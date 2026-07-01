import { clonePlanets } from './cloneHelpers';
import { harvestResources } from './resourceSimulation';
import { simulatePlanetaryDefenses } from './defenseSimulation';
import { simulateShieldAndHP } from './shieldSimulation';
import { simulateFleetReplenishment, simulateFleetMovementAndCombat } from './fleetSimulation';
import { simulateQolAutomation } from './qolAutomation';
import { spawnEnemiesAndBosses, simulateEnemyMovementAndAttack } from './enemySimulation';
import { simulateProjectilesAndCollisions, simulateExplosionParticles } from './projectileSimulation';

import {
  SHIP_TYPES,
  SATELLITE_SPECS,
  SHIELD_MODULE_SPECS,
  ALIEN_TYPES,
  EARTH_CENTER_X,
  EARTH_CENTER_Y,
  SHIELD_RADIUS,
  isSystemOnline,
  getOrderedBuiltSatellites,
  recalculateUsedEnergyState
} from '../gameSpecs';

export const runTickSimulation = (state, actualDelta, addBattleLog, damageEarth) => {
  const updatedPlanets = clonePlanets(state.planets);
  let nextMuteTimer = Math.max(0, state.chronoMuteTimer - actualDelta);
  const isMuted = nextMuteTimer > 0;

  // 1.1. 건설된 위성 정렬 목록 및 액티브 맵 계산
  const builtSats = getOrderedBuiltSatellites(updatedPlanets);
  const activeLimit = state.isPowerOffline ? (state.onlineSatelliteCount || 0) : builtSats.length;

  const activeSatsMap = {};
  Object.keys(updatedPlanets).forEach(planetId => {
    activeSatsMap[planetId] = {};
  });

  for (let i = 0; i < Math.min(activeLimit, builtSats.length); i++) {
    const sat = builtSats[i];
    if (!activeSatsMap[sat.planetId][sat.type]) {
      activeSatsMap[sat.planetId][sat.type] = 0;
    }
    activeSatsMap[sat.planetId][sat.type]++;
  }

  // 1. 자원 수확 및 총 에너지 연산
  const { earnedCredits, calculatedMaxEnergy, calculatedProductionRate, earnedNanocores } = harvestResources(state, updatedPlanets, actualDelta);
  let updatedCredits = state.credits + earnedCredits;
  let updatedNanocores = state.nanocores + earnedNanocores;

  let updatedEnemies = [...state.enemies];
  let updatedProjectiles = [...state.projectiles];
  let updatedParticles = [...state.particles];
  let updatedFleet = [...state.fleet];
  let updatedFloatingTexts = [...(state.floatingTexts || [])];

  // Helper closure for rewards & logging
  const checkAndLogEnemyKill = (enemy) => {
    updatedCredits += enemy.spec.creditReward;
    const lvlStr = `[Lv.${enemy.level || 1}]`;
    if (enemy.type === ALIEN_TYPES.BOSS_APOCALYPSE) {
      updatedNanocores += 5;
      addBattleLog(`${lvlStr} [아포칼립스 파괴함] 완벽 분쇄! 외계 나노코어 5개 회수.`);
    } else if (enemy.type === ALIEN_TYPES.BOSS_CHRONO) {
      updatedNanocores += 15;
      addBattleLog(`${lvlStr} [크로노 디바우러] 완벽 분쇄! 외계 나노코어 15개 회수.`);
    } else if (Math.random() <= enemy.spec.coreChance) {
      updatedNanocores += 1;
      addBattleLog(`${lvlStr} 적 격침! 외계 나노코어 획득.`);
    } else {
      addBattleLog(`${lvlStr} 적군 ${enemy.spec.name} 파괴 성공.`);
    }

    updatedParticles.push({
      id: Math.random().toString(),
      x: enemy.x,
      y: enemy.y,
      radius: 4,
      maxRadius: enemy.type.startsWith('boss') ? 70 : 35,
      alpha: 1.0,
      color: '#ff4400'
    });
  };

  // 2. 아군 행성 궤도 위성 및 기지 공격 시뮬레이션
  const nextRotation = (state.satelliteRotation || 0) + 15 * actualDelta;
  simulatePlanetaryDefenses(
    state,
    updatedPlanets,
    updatedEnemies,
    updatedProjectiles,
    updatedParticles,
    actualDelta,
    nextRotation,
    addBattleLog,
    activeSatsMap
  );

  // Clean up dead enemies immediately (from satellite fire)
  updatedEnemies = updatedEnemies.filter(enemy => {
    if (enemy.hp <= 0) {
      checkAndLogEnemyKill(enemy);
      return false;
    }
    return true;
  });

  // 3. 에너지 실드 및 HP 관리
  const maxShield = state.getShieldCapacity();
  const shieldHP = simulateShieldAndHP(
    state,
    updatedPlanets,
    updatedEnemies,
    updatedParticles,
    updatedFloatingTexts,
    actualDelta,
    calculatedMaxEnergy,
    maxShield,
    state.earthShield,
    state.earthHp,
    checkAndLogEnemyKill,
    addBattleLog,
    activeSatsMap
  );
  let newShield = shieldHP.newShield;
  let newHp = shieldHP.newHp;
  let newDischargeTimer = shieldHP.newDischargeTimer;

  // 4. 타임머신 충전
  const timeMachineSpeedUp = state.isAiPlaytestActive ? 10.0 : 1.0;
  const timeMachineRate = 0.1 * state.synergies.timeMachineChargeSpeedMultiplier * actualDelta * timeMachineSpeedUp;
  const newTimeMachineGauge = Math.min(100, state.timeMachineGauge + timeMachineRate);

  // 5. 함대 재생산 및 수리 전력 소모 연산
  const fleetRep = simulateFleetReplenishment(
    state,
    updatedFleet,
    state.shipyardQueue,
    updatedCredits,
    updatedNanocores,
    actualDelta,
    addBattleLog,
    updatedPlanets
  );
  updatedFleet = fleetRep.updatedFleet;
  let updatedShipyardQueue = fleetRep.updatedShipyardQueue;
  updatedCredits = fleetRep.updatedCredits;
  updatedNanocores = fleetRep.updatedNanocores;

  const targetUsedEnergy = recalculateUsedEnergyState({
    planets: updatedPlanets,
    shieldModule: state.shieldModule,
    counterattackModules: state.counterattackModules,
    shipyardQueue: updatedShipyardQueue,
    fleet: updatedFleet
  });

  // 6. QoL 편의 기능 자동화 작동 연산
  const qol = simulateQolAutomation(
    state,
    updatedPlanets,
    updatedCredits,
    calculatedMaxEnergy,
    targetUsedEnergy,
    addBattleLog
  );
  const finalPlanets = qol.updatedPlanets;
  updatedCredits = qol.updatedCredits;
  const finalUsedEnergy = qol.targetUsedEnergy;

  // 7. 적 및 보스 스폰 엔진
  let enemiesRemaining = state.enemiesRemainingToSpawn !== undefined ? state.enemiesRemainingToSpawn : (state.currentWave % 10 === 0 ? 1 : (3 + state.currentWave) * 4);
  const spawn = spawnEnemiesAndBosses(
    state,
    updatedEnemies,
    actualDelta,
    enemiesRemaining,
    addBattleLog
  );
  updatedEnemies = spawn.updatedEnemies;
  let updatedSpawnTimer = spawn.updatedSpawnTimer;
  enemiesRemaining = spawn.enemiesRemaining;

  // 8. 적 물리 이동 및 공격
  const totalDecoys = Object.values(finalPlanets).reduce((acc, p) => acc + (p.orbitalSatellitesList?.decoy || 0), 0);
  const decoyInterceptBonus = totalDecoys * 0.05;
  const totalBarrierShips = updatedFleet.filter(s => s.type === SHIP_TYPES.BARRIER_SHIP).length;
  const barrierDamageReduction = Math.max(0.5, 1 - totalBarrierShips * 0.1);

  const enemyMove = simulateEnemyMovementAndAttack(
    state,
    updatedEnemies,
    finalPlanets,
    updatedProjectiles,
    actualDelta,
    nextMuteTimer,
    barrierDamageReduction,
    addBattleLog
  );
  updatedEnemies = enemyMove.updatedEnemies;
  nextMuteTimer = enemyMove.nextMuteTimer;

  // 9. 아군 궤도 함선 기동 및 적 추격
  const totalRepairShips = updatedFleet.filter(s => s.type === SHIP_TYPES.REPAIR_SHIP).length;
  const totalRepairDrones = Object.keys(activeSatsMap).reduce((acc, pId) => acc + (activeSatsMap[pId]?.repairDrone || 0), 0);
  updatedFleet = simulateFleetMovementAndCombat(
    state,
    updatedFleet,
    updatedEnemies,
    updatedProjectiles,
    actualDelta,
    isMuted,
    totalRepairShips,
    totalRepairDrones
  );

  // 10. 투사체 이동 및 충돌 체크
  const projSim = simulateProjectilesAndCollisions(
    state,
    updatedProjectiles,
    updatedEnemies,
    updatedParticles,
    actualDelta,
    decoyInterceptBonus,
    checkAndLogEnemyKill,
    damageEarth,
    addBattleLog
  );
  updatedProjectiles = projSim.updatedProjectiles;
  updatedEnemies = projSim.updatedEnemies;

  // 11. 폭발 파티클 갱신 및 확장식 광역 스플래시 피해 적용
  updatedParticles = simulateExplosionParticles(updatedParticles, updatedEnemies, actualDelta, checkAndLogEnemyKill);

  // Clean up any enemies killed by the damage rings in this frame
  updatedEnemies = updatedEnemies.filter(enemy => enemy.hp > 0);

  // 12. 모든 적선 클리어 및 스폰 완료 시 웨이브 상승
  let nextWave = state.currentWave;
  if (updatedEnemies.length === 0 && enemiesRemaining === 0) {
    nextWave = state.currentWave + 1;
    addBattleLog(`웨이브 ${nextWave} 진입!`);
    const nextBoss = nextWave % 10 === 0;
    enemiesRemaining = nextBoss ? 1 : (3 + nextWave) * 4;
    updatedSpawnTimer = 0;
  }

  // 13. 가용 전력(overloadEnergy) 및 생산/소모 연산 (TW/s)
  const productionPower = calculatedProductionRate;
  
  // 13.1. 실드 전력 소모 (TW단위)
  const isShieldOnline = isSystemOnline('shield', null, state.overloadEnergy, state.isPowerOffline);
  const shieldConsumption = isShieldOnline ? (SHIELD_MODULE_SPECS[state.shieldModule || 'basic']?.energyCost || 0) : 0;
  
  // 13.2. 반격 모듈 전력 소모
  const isCounterattackOnline = isSystemOnline('counterattack', null, state.overloadEnergy, state.isPowerOffline);
  let counterattackConsumption = 0;
  if (isCounterattackOnline) {
    if (state.counterattackModules.reflector) counterattackConsumption += 10;
    if (state.counterattackModules.discharge) counterattackConsumption += 10;
    if (state.counterattackModules.electricField) counterattackConsumption += 15;
  }
  
  // 13.3. 위성 유지 전력 소모 (TW단위)
  let satelliteConsumption = 0;
  Object.keys(activeSatsMap).forEach((planetId) => {
    Object.keys(activeSatsMap[planetId]).forEach((type) => {
      const count = activeSatsMap[planetId][type] || 0;
      const spec = SATELLITE_SPECS[type];
      if (spec && count > 0) {
        satelliteConsumption += count * spec.energy;
      }
    });
  });

  const totalConsumption = shieldConsumption + counterattackConsumption + satelliteConsumption;
  const netPower = productionPower - totalConsumption;

  let newOverloadEnergy = state.overloadEnergy !== undefined ? state.overloadEnergy : 100;
  const maxOverloadEnergy = calculatedMaxEnergy;

  newOverloadEnergy = Math.max(0, Math.min(maxOverloadEnergy, newOverloadEnergy + netPower * actualDelta));

  let newIsPowerOffline = state.isPowerOffline;
  let newOnlineSatelliteCount = state.onlineSatelliteCount !== undefined ? state.onlineSatelliteCount : 0;
  let newSatelliteBootTimer = state.satelliteBootTimer !== undefined ? state.satelliteBootTimer : 2.0;

  if (newOverloadEnergy <= 0) {
    newIsPowerOffline = true;
    newOnlineSatelliteCount = 0;
    newSatelliteBootTimer = 2.0;
  } else if (newIsPowerOffline) {
    if (netPower < 0 && newOnlineSatelliteCount > 0) {
      newSatelliteBootTimer -= actualDelta;
      if (newSatelliteBootTimer <= 0) {
        newOnlineSatelliteCount--;
        addBattleLog(`[경고] 전력 부족! 위성 전원 차단: 위성 1개 OFF.`);
        newSatelliteBootTimer = 2.0;
      }
    } else if (newOnlineSatelliteCount < builtSats.length) {
      newSatelliteBootTimer -= actualDelta;
      if (newSatelliteBootTimer <= 0) {
        newOnlineSatelliteCount++;
        addBattleLog(`[알림] 전력 복구 중: 위성 순차 투입 (${newOnlineSatelliteCount}/${builtSats.length}).`);
        newSatelliteBootTimer = 2.0;
      }
    }

    if (newOnlineSatelliteCount >= builtSats.length && netPower >= 0) {
      newIsPowerOffline = false;
    }
  } else {
    newOnlineSatelliteCount = builtSats.length;
    newSatelliteBootTimer = 2.0;
  }

  // 11.5. 플로팅 텍스트 갱신
  updatedFloatingTexts = updatedFloatingTexts.map(ft => ({
    ...ft,
    y: ft.y - 40 * actualDelta,
    age: ft.age + actualDelta,
    alpha: Math.max(0, 1.0 - ft.age * 1.5)
  })).filter(ft => ft.age < 0.7);

  return {
    newOverloadEnergy,
    maxOverloadEnergy,
    newIsPowerOffline,
    newOnlineSatelliteCount,
    newSatelliteBootTimer,
    dischargeTimer: newDischargeTimer,
    updatedFloatingTexts,
    updatedCredits,
    updatedNanocores,
    calculatedMaxEnergy,
    targetUsedEnergy: finalUsedEnergy,
    maxShield,
    newShield,
    newHp,
    newTimeMachineGauge,
    updatedShipyardQueue,
    updatedFleet,
    updatedEnemies,
    updatedProjectiles,
    updatedParticles,
    updatedSpawnTimer,
    nextMuteTimer,
    updatedPlanets: finalPlanets,
    nextWave,
    enemiesRemaining
  };
};
