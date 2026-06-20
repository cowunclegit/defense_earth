import { PLANETS, PLANETARY_DATA } from '../constants/planetaryData';
import {
  SHIP_TYPES,
  SHIP_SPECS,
  SATELLITE_SPECS,
  STATION_SPECS,
  SHIELD_MODULE_SPECS,
  COUNTERATTACK_MODULE_SPECS,
  ALIEN_TYPES,
  ALIEN_SPECS,
  EARTH_CENTER_X,
  EARTH_CENTER_Y,
  SHIELD_RADIUS,
  ENEMY_SPAWN_RADIUS,
  MAX_SATELLITES_PER_TYPE,
  getSatelliteCost,
  getScaledDmg,
  getScaledCd,
  getScaledRange,
  calculateSynergies,
  recalculateUsedEnergyState,
  isSystemOnline,
  getOrderedBuiltSatellites,
  SHIP_LEVEL_REQUIREMENTS
} from './gameSpecs';

// 1. 자원 수확 및 총 에너지 연산
export const harvestResources = (state, updatedPlanets, actualDelta) => {
  let totalPopulation = 0;
  let totalFactoryContribution = 0;
  let totalTaxBonus = 0;

  Object.keys(updatedPlanets).forEach((planetId) => {
    const p = updatedPlanets[planetId];
    if (p.unlocked) {
      const data = PLANETARY_DATA[planetId];
      if (data) {
        // Fallback for infrastructure if undefined
        const infra = p.infrastructure || { housing: 0, factory: 0, powerPlant: 0, bunker: 0 };
        
        // 1. Calculate population capacity
        const baseCapacity = (p.terraformProgress / 100) * data.maxPopulation;
        const capacityBonus = data.maxPopulation * 0.2;
        const maxPop = baseCapacity + (infra.housing || 0) * capacityBonus;

        // 2. Simulate population growth (logistic growth + immigration)
        if (p.population < maxPop) {
          const growthRate = 0.005 + (infra.housing || 0) * 0.001;
          const growth = p.population * growthRate * (1 - p.population / Math.max(1, maxPop));
          const immigration = 5 + (infra.housing || 0) * 2;
          p.population = Math.min(maxPop, p.population + (growth + immigration) * actualDelta);
        } else if (p.population > maxPop) {
          // If capacity shrank, gradually decay population
          p.population = Math.max(maxPop, p.population - (p.population * 0.01 + 10) * actualDelta);
        }

        totalPopulation += p.population;
        
        // 3. Accumulate factory contribution
        const factoryLvl = infra.factory || 0;
        totalFactoryContribution += factoryLvl * 15;
        totalTaxBonus += factoryLvl * 0.03;
      }
    }
  });

  // 4. Calculate credit generation rate based on population and factory levels
  // Tax formula: 0.005 * (totalPopulation ^ 0.75)
  const taxRevenue = 0.005 * Math.pow(Math.max(0, totalPopulation), 0.75);
  const baseCreditRate = 10 + taxRevenue * (1 + totalTaxBonus) + totalFactoryContribution;
  const earnedCredits = baseCreditRate * state.synergies.creditMultiplier * actualDelta;

  // 5. Calculate energy capacity (Power Plants)
  let baseEnergy = 100;
  let baseProdRate = 15; // 기본 충전 속도 TW/s
  Object.keys(updatedPlanets).forEach((planetId) => {
    const p = updatedPlanets[planetId];
    if (p.unlocked) {
      if (planetId !== PLANETS.EARTH) {
        baseEnergy += (p.terraformProgress / 100) * 50;
      }
      const infra = p.infrastructure || { housing: 0, factory: 0, powerPlant: 0, bunker: 0 };
      const powerPlantLvl = infra.powerPlant || 0;
      baseEnergy += powerPlantLvl * 20;       // 발전소 1개당 쿄쿵시티 +20 TW
      baseProdRate += powerPlantLvl * 20;      // 발전소 1개당 충전속도 +20 TW/s
    }
  });
  const calculatedMaxEnergy = Math.floor(baseEnergy * state.synergies.energyProductionMultiplier);
  const calculatedProductionRate = Math.floor(baseProdRate * state.synergies.energyProductionMultiplier);

  const baseNanocoreRate = state.chronosUpgrades.nanocoreGen * 0.1;
  const earnedNanocores = baseNanocoreRate * actualDelta;

  return {
    earnedCredits,
    calculatedMaxEnergy,
    calculatedProductionRate,
    earnedNanocores
  };
};

// 2. 아군 행성 궤도 위성 및 기지 공격 시뮬레이션
export const simulatePlanetaryDefenses = (
  state,
  updatedPlanets,
  updatedEnemies,
  updatedProjectiles,
  updatedParticles,
  actualDelta,
  nextRotation,
  addBattleLog,
  activeSatsMap
) => {
  Object.keys(updatedPlanets).forEach((planetId) => {
    const p = updatedPlanets[planetId];
    if (!p.unlocked) return;

    // Initialize lists/timers if missing (safeguard)
    if (!p.groundBasesList) p.groundBasesList = {};
    if (!p.groundBaseTimers) p.groundBaseTimers = {};
    if (!p.orbitalSatellitesList) p.orbitalSatellitesList = {};
    if (!p.satelliteTimers) p.satelliteTimers = {};
    if (!p.orbitalStationsList) p.orbitalStationsList = {};
    if (!p.stationTimers) p.stationTimers = {};

    // CIWS (미사일 방어막) 요격 로직 (decoy 위성 개수를 참조)
    const ciwsCount = activeSatsMap[planetId]?.decoy || 0;
    if (ciwsCount > 0) {
      let ciwsTimer = p.groundBaseTimers.ciws_intercept || 0;
      if (ciwsTimer > 0) {
        p.groundBaseTimers.ciws_intercept = Math.max(0, ciwsTimer - actualDelta);
      }
      if (p.groundBaseTimers.ciws_intercept <= 0) {
        const enemyProjIndex = updatedProjectiles.findIndex(proj => proj.isEnemy);
        if (enemyProjIndex >= 0) {
          const proj = updatedProjectiles[enemyProjIndex];
          updatedProjectiles.splice(enemyProjIndex, 1);
          p.groundBaseTimers.ciws_intercept = 0.8 / ciwsCount;
          addBattleLog(`CIWS 요격 작동: 적 포탄 차단.`);
          updatedParticles.push({
            id: Math.random().toString(),
            x: proj.x,
            y: proj.y,
            radius: 1,
            maxRadius: 15,
            alpha: 1.0,
            color: '#00f0ff'
          });
        }
      }
    }

    // 궤도 위성 공격
    const attackSatellites = [];
    const defenseSatellites = [];
    const planetActiveSats = activeSatsMap[planetId] || {};
    Object.keys(planetActiveSats).forEach((t) => {
      const c = planetActiveSats[t] || 0;
      const spec = SATELLITE_SPECS[t];
      const isWeapon = spec ? spec.isWeapon : false;
      for (let i = 0; i < c; i++) {
        if (isWeapon) {
          attackSatellites.push({ type: t, globalIndex: attackSatellites.length, isWeapon: true });
        } else {
          defenseSatellites.push({ type: t, globalIndex: defenseSatellites.length, isWeapon: false });
        }
      }
    });
    const earthSatellites = [...attackSatellites, ...defenseSatellites];

    Object.keys(planetActiveSats).forEach((type) => {
      const count = planetActiveSats[type] || 0;
      if (count <= 0) return;

      const spec = SATELLITE_SPECS[type];
      if (!spec || !spec.isWeapon) return;

      const weaponLevels = state.satelliteLevels[type] || { damage: 1, speed: 1, range: 1 };
      const dmgLvl = weaponLevels.damage || 1;
      const spdLvl = weaponLevels.speed || 1;
      const rngLvl = weaponLevels.range || 1;

      const scaledRange = getScaledRange(type, rngLvl);
      const scaledDmg = getScaledDmg(type, dmgLvl);
      const scaledCd = getScaledCd(type, spdLvl);

      let timer = p.satelliteTimers[type] || 0;
      if (timer > 0) {
        p.satelliteTimers[type] = Math.max(0, timer - actualDelta);
      }

      if (p.satelliteTimers[type] <= 0 && updatedEnemies.length > 0) {
        let anyFired = false;
        const matchingSats = earthSatellites.filter(sat => sat.type === type);
        
        matchingSats.forEach((sat) => {
          const currentRotation = nextRotation % 360;
          const isWeapon = spec ? spec.isWeapon : false;
          const orbitRadius = isWeapon ? 145 : 120;
          const satListForAngle = isWeapon ? attackSatellites : defenseSatellites;

          const baseAngle = (360 / Math.max(1, satListForAngle.length)) * sat.globalIndex;
          const angleDeg = baseAngle + currentRotation;
          const angleRad = (angleDeg * Math.PI) / 180;
          const satX = EARTH_CENTER_X + orbitRadius * Math.cos(angleRad);
          const satY = EARTH_CENTER_Y + orbitRadius * Math.sin(angleRad);

          const enemiesInRange = updatedEnemies.filter(enemy => {
            const dx = enemy.x - satX;
            const dy = enemy.y - satY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            return dist <= scaledRange;
          });

          if (enemiesInRange.length > 0) {
            const target = enemiesInRange[Math.floor(Math.random() * enemiesInRange.length)];
            anyFired = true;

            addBattleLog(`${PLANETARY_DATA[planetId].name} 위성 ${spec.name} 공격! (데미지 ${scaledDmg})`);

            const dx = target.x - satX;
            const dy = target.y - satY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const speed = 400;

            const targetAngle = Math.atan2(dy, dx);
            const anglesToSpawn = type === 'clusterMissile' ? [-0.2, 0, 0.2] : [0];

            anglesToSpawn.forEach((angleOffset) => {
              const angle = targetAngle + angleOffset;
              const vx = dist > 0 ? Math.cos(angle) * speed : 0;
              const vy = dist > 0 ? Math.sin(angle) * speed : 0;

              updatedProjectiles.push({
                id: Math.random().toString(),
                type: type === 'clusterMissile' ? 'kinetic' : 'energy',
                x: satX,
                y: satY,
                vx: vx,
                vy: vy,
                damage: scaledDmg,
                isEnemy: false,
                targetEnemyId: target.id,
                emp: type === 'emp',
                gravityBomb: type === 'gravityBomb'
              });
            });
          }
        });

        if (anyFired) {
          p.satelliteTimers[type] = scaledCd;
        }
      }
    });

    // 기가 플라즈마 주포 공격
    if (p.orbitalStationsList && p.orbitalStationsList.gigaPlasma > 0) {
      let timer = p.stationTimers.gigaPlasma || 0;
      if (timer > 0) {
        p.stationTimers.gigaPlasma = Math.max(0, timer - actualDelta);
      }
      if (p.stationTimers.gigaPlasma <= 0 && updatedEnemies.length > 0) {
        p.stationTimers.gigaPlasma = 20.0;
        addBattleLog(`${PLANETARY_DATA[planetId].name} 궤도 기지 기가 플라즈마 주포 발사!`);
        updatedEnemies.forEach(e => {
          e.hp -= 500;
          e.stunTimer = 5.0;
        });
        updatedParticles.push({
          id: Math.random().toString(),
          x: EARTH_CENTER_X,
          y: EARTH_CENTER_Y,
          radius: 5,
          maxRadius: 100,
          alpha: 1.0,
          color: '#00f0ff'
        });
      }
    }
  });
};

// 3. 에너지 실드 및 HP 관리
export const simulateShieldAndHP = (
  state,
  updatedPlanets,
  updatedEnemies,
  updatedParticles,
  actualDelta,
  calculatedMaxEnergy,
  maxShield,
  newShield,
  newHp,
  checkAndLogEnemyKill,
  addBattleLog,
  activeSatsMap
) => {
  let totalSatellites = 0;
  Object.keys(activeSatsMap).forEach(pId => {
    Object.values(activeSatsMap[pId]).forEach(count => {
      totalSatellites += count;
    });
  });
  const satelliteBonus = 1 + totalSatellites * 0.1;

  const activeModuleSpec = SHIELD_MODULE_SPECS[state.shieldModule || 'basic'];
  const baseRegen = (activeModuleSpec ? activeModuleSpec.regenBonus : 5) + (state.earthShieldRegenLevel - 1) * 3;
  const shieldRegen = baseRegen * state.synergies.shieldRegenMultiplier * satelliteBonus * actualDelta;
  const isPowerShortage = state.usedEnergy > calculatedMaxEnergy;
  const actualRegen = isPowerShortage ? (shieldRegen * 0.5) : shieldRegen;

  const isShieldOnline = isSystemOnline('shield', null, state.overloadEnergy, state.isPowerOffline);
  if (!isShieldOnline) {
    newShield = 0;
  } else if (newShield < maxShield) {
    newShield = Math.min(maxShield, newShield + actualRegen);
  }

  // HP 자동 회복
  const hpRegenRate = state.earthHpRegenLevel * 2;
  if (hpRegenRate > 0 && newHp < state.earthMaxHp && newHp > 0) {
    newHp = Math.min(state.earthMaxHp, newHp + hpRegenRate * actualDelta);
  }

  // 나노 수리 실드 패시브 복구
  if (state.shieldModule === 'repair' && newShield > 0 && newHp < state.earthMaxHp && newHp > 0) {
    newHp = Math.min(state.earthMaxHp, newHp + 5 * actualDelta);
  }

  // 실드 붕괴 시의 동작들 (과부하 방전 및 즉시 체력 복구)
  const isShieldCollapsed = state.earthShield > 0 && newShield <= 0;
  if (isShieldCollapsed) {
    if (state.counterattackModules.discharge && (state.overloadEnergy || 0) > 0 && updatedEnemies.length > 0) {
      addBattleLog(`실드 과부하 방전 발동! 모든 적에게 200 광역 피해!`);
      updatedEnemies.forEach(e => {
        e.hp -= 200;
      });
      // 처치 및 필터
      for (let i = updatedEnemies.length - 1; i >= 0; i--) {
        const e = updatedEnemies[i];
        if (e.hp <= 0) {
          checkAndLogEnemyKill(e);
          updatedEnemies.splice(i, 1);
        }
      }
      updatedParticles.push({
        id: Math.random().toString(),
        x: EARTH_CENTER_X,
        y: EARTH_CENTER_Y,
        radius: SHIELD_RADIUS,
        maxRadius: 200,
        alpha: 1.0,
        color: '#00f0ff'
      });
    }
    if (state.shieldModule === 'repair') {
      newHp = Math.min(state.earthMaxHp, newHp + 20);
      addBattleLog(`나노 수리 실드 작동: 지구 HP 20 즉시 복구.`);
    }
  }

  // 전기장 역류 지속 데미지
  if (state.counterattackModules.electricField && (state.overloadEnergy || 0) > 0 && newShield > 0 && updatedEnemies.length > 0) {
    updatedEnemies.forEach(e => {
      e.hp -= 80 * actualDelta;
    });
    // 처치 및 필터
    for (let i = updatedEnemies.length - 1; i >= 0; i--) {
      const e = updatedEnemies[i];
      if (e.hp <= 0) {
        checkAndLogEnemyKill(e);
        updatedEnemies.splice(i, 1);
      }
    }
  }

  return {
    newShield,
    newHp
  };
};

// 4. 함대 재생산 및 쉽야드 관리
export const simulateFleetReplenishment = (
  state,
  updatedFleet,
  updatedShipyardQueue,
  updatedCredits,
  updatedNanocores,
  actualDelta,
  addBattleLog,
  updatedPlanets
) => {
  if (updatedShipyardQueue) {
    const buildSpeed = state.synergies.shipBuildSpeedMultiplier;
    const newProgress = updatedShipyardQueue.progress + actualDelta * buildSpeed;

    if (newProgress >= updatedShipyardQueue.totalTime) {
      const spec = SHIP_SPECS[updatedShipyardQueue.type];
      const angle = Math.random() * Math.PI - Math.PI;
      const radius = 120 + Math.random() * 20;

      updatedFleet.push({
        id: Math.random().toString(),
        type: updatedShipyardQueue.type,
        x: EARTH_CENTER_X + Math.cos(angle) * radius,
        y: EARTH_CENTER_Y + Math.sin(angle) * radius,
        angle: angle,
        hp: spec.maxHp,
        maxHp: spec.maxHp,
        cooldownTimer: 0,
        targetEnemyId: null,
        orbitSpeedOffset: (Math.random() - 0.5) * 0.15,
        orbitRadiusOffset: (Math.random() - 0.5) * 20,
        flockOffsetX: (Math.random() - 0.5) * 30,
        flockOffsetY: (Math.random() - 0.5) * 30
      });
      addBattleLog(`${spec.name} 자동 건조 배치 완료.`);
      updatedShipyardQueue = null;
    } else {
      updatedShipyardQueue = { ...updatedShipyardQueue, progress: newProgress };
    }
  } else {
    const shipCounts = {};
    Object.values(SHIP_TYPES).forEach(type => { shipCounts[type] = 0; });
    updatedFleet.forEach(ship => { if (shipCounts[ship.type] !== undefined) shipCounts[ship.type]++; });

    let targetShipToBuild = null;
    for (const type of Object.values(SHIP_TYPES)) {
      if ((shipCounts[type] || 0) < (state.fleetSlots[type] || 0)) {
        // 쉽야드가 건설되어 있고 레벨 요구사항을 만족하는지 검증
        const reqLvl = SHIP_LEVEL_REQUIREMENTS[type] || 1;
        const maxShipyardLvl = Object.values(updatedPlanets || {}).reduce((max, p) => p.unlocked && p.shipyard ? Math.max(max, p.shipyard) : max, 0);
        if (maxShipyardLvl >= reqLvl) {
          targetShipToBuild = type;
          break;
        }
      }
    }

    if (targetShipToBuild) {
      const spec = SHIP_SPECS[targetShipToBuild];
      const costCredit = Math.floor(spec.baseCost * state.synergies.shipBuildCostMultiplier);
      const costNanocore = Math.floor(spec.baseNanocore * state.synergies.shipBuildCostMultiplier);

      if (updatedCredits >= costCredit && updatedNanocores >= costNanocore) {
        updatedCredits -= costCredit;
        updatedNanocores -= costNanocore;
        updatedShipyardQueue = {
          type: targetShipToBuild,
          progress: 0,
          totalTime: spec.baseBuildTime,
          costCredits: costCredit,
          costNanocore: costNanocore
        };
        addBattleLog(`${spec.name} 자동 재생산 대기열 추가.`);
      }
    }
  }

  return {
    updatedFleet,
    updatedShipyardQueue,
    updatedCredits,
    updatedNanocores
  };
};

// 5. QoL 편의 기능 자동화 작동 연산
export const simulateQolAutomation = (
  state,
  updatedPlanets,
  updatedCredits,
  calculatedMaxEnergy,
  targetUsedEnergy,
  addBattleLog
) => {
  // 자동 테라포밍 옵션
  if (state.autoTerraform && updatedCredits > 500) {
    for (const planetId of Object.keys(updatedPlanets)) {
      const planet = updatedPlanets[planetId];
      const data = PLANETARY_DATA[planetId];
      if (planet.unlocked && planet.terraformProgress < 100) {
        const costCredit = Math.floor(data.terraformCredit * 0.1);
        const costEnergy = Math.floor(data.terraformEnergy * 0.1);
        const availableEnergy = calculatedMaxEnergy - targetUsedEnergy;

        if (updatedCredits >= costCredit && availableEnergy >= costEnergy) {
          const updatedProgress = Math.min(100, planet.terraformProgress + 10);
          
          updatedPlanets[planetId] = {
            ...planet,
            terraformProgress: updatedProgress
          };
          updatedCredits -= costCredit;
          
          state.synergies = calculateSynergies(updatedPlanets, state.chronosUpgrades);
          addBattleLog(`${data.name} 테라포밍 자동 강화 실행 (${updatedProgress}%).`);
          break;
        }
      }
    }
  }

  // 자동 위성 건설 옵션
  const currentCount = updatedPlanets[PLANETS.EARTH]?.orbitalSatellitesList?.laser || 0;
  if (state.autoBuildTowers && currentCount < MAX_SATELLITES_PER_TYPE) {
    const spec = SATELLITE_SPECS.laser;
    const cost = getSatelliteCost('laser', currentCount);
    const availableEnergy = (calculatedMaxEnergy + state.cheatEnergyBonus) - targetUsedEnergy;
    if (updatedCredits >= cost && availableEnergy >= spec.energy) {
      updatedCredits -= cost;
      targetUsedEnergy += spec.energy;
      
      const earthSats = updatedPlanets[PLANETS.EARTH]?.orbitalSatellites || 0;
      updatedPlanets[PLANETS.EARTH].orbitalSatellites = earthSats + 1;
      if (!updatedPlanets[PLANETS.EARTH].orbitalSatellitesList) {
        updatedPlanets[PLANETS.EARTH].orbitalSatellitesList = {};
      }
      updatedPlanets[PLANETS.EARTH].orbitalSatellitesList.laser = currentCount + 1;
      
      addBattleLog(`방어 위성 자동 복구: 지구 궤도에 타겟팅 레이저 위성 자동 건설.`);
    }
  }

  return {
    updatedPlanets,
    updatedCredits,
    targetUsedEnergy
  };
};

// 6. 적 및 보스 스폰 엔진
export const spawnEnemiesAndBosses = (
  state,
  updatedEnemies,
  actualDelta,
  enemiesRemaining,
  addBattleLog
) => {
  let updatedSpawnTimer = state.enemySpawnTimer + actualDelta;
  const isBossWave = state.currentWave % 10 === 0;
  const baseInterval = Math.max(2.0, 5.0 - state.currentWave * 0.1);
  const spawnInterval = isBossWave ? baseInterval : baseInterval / 4.0;

  const hasActiveBoss = updatedEnemies.some(e => e.type === ALIEN_TYPES.BOSS_APOCALYPSE || e.type === ALIEN_TYPES.BOSS_CHRONO);

  if (updatedSpawnTimer >= spawnInterval && !hasActiveBoss && enemiesRemaining > 0) {
    updatedSpawnTimer = 0;
    enemiesRemaining -= 1;
    
    if (isBossWave) {
      const bossType = state.currentWave % 20 === 0 ? ALIEN_TYPES.BOSS_CHRONO : ALIEN_TYPES.BOSS_APOCALYPSE;
      const baseSpec = ALIEN_SPECS[bossType];
      
      const level = state.currentWave;
      const hpMultiplier = 1 + (level - 1) * 0.12;
      const damageMultiplier = 1 + (level - 1) * 0.08;
      const rewardMultiplier = 1 + (level - 1) * 0.06;
      const speedMultiplier = Math.min(1.5, 1 + (level - 1) * 0.015);

      const scaledMaxHp = Math.round(baseSpec.maxHp * hpMultiplier);
      const scaledDmg = Math.round(baseSpec.damage * damageMultiplier);
      const scaledReward = Math.round(baseSpec.creditReward * rewardMultiplier);
      const scaledSpeed = baseSpec.speed * speedMultiplier;

      const spec = {
        ...baseSpec,
        maxHp: scaledMaxHp,
        damage: scaledDmg,
        creditReward: scaledReward,
        speed: scaledSpeed
      };

      const spawnAngle = Math.random() * 2 * Math.PI;
      const startX = EARTH_CENTER_X + ENEMY_SPAWN_RADIUS * Math.cos(spawnAngle);
      const startY = EARTH_CENTER_Y + ENEMY_SPAWN_RADIUS * Math.sin(spawnAngle);

      updatedEnemies.push({
        id: Math.random().toString(),
        level: level,
        type: bossType,
        x: startX,
        y: startY,
        hp: scaledMaxHp,
        maxHp: scaledMaxHp,
        speed: scaledSpeed,
        attackTimer: 0,
        spec: spec
      });
      addBattleLog(`[Lv.${level}] 경고: 거대 위협 [${spec.name}] 웜홀 진입!`);
    } else {
      const roll = Math.random();
      let enemyType = ALIEN_TYPES.SCOUT;
      if (roll > 0.85 && state.currentWave >= 8) enemyType = ALIEN_TYPES.DESTROYER;
      else if (roll > 0.50 && state.currentWave >= 3) enemyType = ALIEN_TYPES.RAIDER;

      const baseSpec = ALIEN_SPECS[enemyType];
      
      const level = state.currentWave;
      const hpMultiplier = 1 + (level - 1) * 0.12;
      const damageMultiplier = 1 + (level - 1) * 0.08;
      const rewardMultiplier = 1 + (level - 1) * 0.06;
      const speedMultiplier = Math.min(1.5, 1 + (level - 1) * 0.015);

      const scaledMaxHp = Math.round(baseSpec.maxHp * hpMultiplier);
      const scaledDmg = Math.round(baseSpec.damage * damageMultiplier);
      const scaledReward = Math.round(baseSpec.creditReward * rewardMultiplier);
      const scaledSpeed = baseSpec.speed * speedMultiplier;

      const spec = {
        ...baseSpec,
        maxHp: scaledMaxHp,
        damage: scaledDmg,
        creditReward: scaledReward,
        speed: scaledSpeed
      };

      const spawnAngle = Math.random() * 2 * Math.PI;
      const startX = EARTH_CENTER_X + ENEMY_SPAWN_RADIUS * Math.cos(spawnAngle);
      const startY = EARTH_CENTER_Y + ENEMY_SPAWN_RADIUS * Math.sin(spawnAngle);
      
      updatedEnemies.push({
        id: Math.random().toString(),
        level: level,
        type: enemyType,
        x: startX,
        y: startY,
        hp: scaledMaxHp,
        maxHp: scaledMaxHp,
        speed: scaledSpeed,
        attackTimer: 0,
        spec: spec
      });
      addBattleLog(`[Lv.${level}] 외계 침략선 [${spec.name}] 탐지됨!`);
    }
  }

  return {
    updatedEnemies,
    updatedSpawnTimer,
    enemiesRemaining
  };
};

// 7. 적 물리 이동 및 공격
export const simulateEnemyMovementAndAttack = (
  state,
  updatedEnemies,
  updatedPlanets,
  updatedProjectiles,
  actualDelta,
  nextMuteTimer,
  barrierDamageReduction,
  addBattleLog
) => {
  const totalSensors = Object.values(updatedPlanets).reduce((acc, p) => acc + (p.orbitalSatellitesList?.sensor || 0), 0);
  const sensorSpeedMultiplier = Math.max(0.75, 1 - totalSensors * 0.05);
  const totalDistorters = Object.values(updatedPlanets).reduce((acc, p) => acc + (p.orbitalStationsList?.gravityDistorter || 0), 0);
  const distorterMultiplier = totalDistorters > 0 ? 0.75 : 1.0;

  const results = updatedEnemies.map(enemy => {
    const dx = EARTH_CENTER_X - enemy.x;
    const dy = EARTH_CENTER_Y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    let nextX = enemy.x;
    let nextY = enemy.y;

    const isBoss = enemy.type === ALIEN_TYPES.BOSS_APOCALYPSE || enemy.type === ALIEN_TYPES.BOSS_CHRONO;
    const border = isBoss ? SHIELD_RADIUS + 40 : SHIELD_RADIUS + 20;

    let currentSpeed = enemy.speed;
    if (enemy.stunTimer > 0) {
      enemy.stunTimer = Math.max(0, enemy.stunTimer - actualDelta);
      currentSpeed = 0;
    } else if (enemy.slowTimer > 0) {
      enemy.slowTimer = Math.max(0, enemy.slowTimer - actualDelta);
      currentSpeed *= (1 - (enemy.slowAmount || 0));
    }

    if (dist > border) {
      const moveDist = currentSpeed * sensorSpeedMultiplier * distorterMultiplier * state.synergies.enemySpeedMultiplier * actualDelta;
      nextX += (dx / dist) * moveDist;
      nextY += (dy / dist) * moveDist;
    }

    let nextAttackTimer = enemy.attackTimer + actualDelta;
    if (nextAttackTimer >= enemy.spec.cooldown) {
      nextAttackTimer = 0;

      if (enemy.type === ALIEN_TYPES.BOSS_CHRONO) {
        nextMuteTimer = 4.0;
        addBattleLog('보스 [크로노 디바우러]가 시공간 정지 필드를 전개했습니다! (함대 4초 정지)');
        
        const px = -dy / dist;
        const py = dx / dist;
        for (let i = 0; i < 3; i++) {
          const offset = (i - 1) * 15;
          const spreadV = (i - 1) * 30;
          updatedProjectiles.push({
            id: Math.random().toString(),
            type: 'kinetic',
            x: nextX + px * offset,
            y: nextY + py * offset,
            vx: (dx / dist) * 120 + px * spreadV,
            vy: (dy / dist) * 120 + py * spreadV,
            damage: (enemy.spec.damage / 3) * barrierDamageReduction,
            isEnemy: true
          });
        }
      } else {
        const projDx = EARTH_CENTER_X - nextX;
        const projDy = EARTH_CENTER_Y - nextY;
        const projDist = Math.sqrt(projDx * projDx + projDy * projDy);

        updatedProjectiles.push({
          id: Math.random().toString(),
          type: enemy.spec.attackType,
          x: nextX,
          y: nextY,
          vx: (projDx / projDist) * (isBoss ? 110 : 150),
          vy: (projDy / projDist) * (isBoss ? 110 : 150),
          damage: enemy.spec.damage * barrierDamageReduction,
          isEnemy: true
        });

        if (enemy.type === ALIEN_TYPES.BOSS_APOCALYPSE) {
          addBattleLog('경고: [아포칼립스 파괴함]이 거대 행성 파괴 광선을 발사했습니다!');
        }
      }
    }

    return {
      ...enemy,
      x: nextX,
      y: nextY,
      attackTimer: nextAttackTimer
    };
  });

  return {
    updatedEnemies: results,
    nextMuteTimer
  };
};

// 8. 아군 궤도 함선 기동 및 적 추격
export const simulateFleetMovementAndCombat = (
  state,
  updatedFleet,
  updatedEnemies,
  updatedProjectiles,
  actualDelta,
  isMuted,
  totalRepairShips,
  totalRepairDrones
) => {
  const results = updatedFleet.map(ship => {
    const spec = SHIP_SPECS[ship.type];
    
    let nextHp = ship.hp;
    if (nextHp < ship.maxHp) {
      const passiveHeal = state.researchUpgrades.selfRepair ? ship.maxHp * 0.01 : 0;
      const activeHeal = totalRepairShips * 50 + totalRepairDrones * 20;
      nextHp = Math.min(ship.maxHp, nextHp + (passiveHeal + activeHeal) * actualDelta);
    }

    if (isMuted) {
      return { ...ship, hp: nextHp };
    }

    let targetEnemy = null;
    if (ship.targetEnemyId) {
      targetEnemy = updatedEnemies.find(e => e.id === ship.targetEnemyId);
    }
    if (!targetEnemy && updatedEnemies.length > 0) {
      let minDist = 9999;
      updatedEnemies.forEach(e => {
        const sDx = e.x - ship.x;
        const sDy = e.y - ship.y;
        const d = Math.sqrt(sDx * sDx + sDy * sDy);
        if (d < minDist) { minDist = d; targetEnemy = e; }
      });
    }

    const flockOffsetX = ship.flockOffsetX !== undefined ? ship.flockOffsetX : ((Math.random() - 0.5) * 30);
    const flockOffsetY = ship.flockOffsetY !== undefined ? ship.flockOffsetY : ((Math.random() - 0.5) * 30);
    const orbitSpeedOffset = ship.orbitSpeedOffset !== undefined ? ship.orbitSpeedOffset : ((Math.random() - 0.5) * 0.15);
    const orbitRadiusOffset = ship.orbitRadiusOffset !== undefined ? ship.orbitRadiusOffset : ((Math.random() - 0.5) * 20);

    let nextX = ship.x;
    let nextY = ship.y;
    let nextAngle = ship.angle;

    if (targetEnemy && spec.damage > 0) {
      const targetX = targetEnemy.x + flockOffsetX;
      const targetY = targetEnemy.y + flockOffsetY;
      const tDx = targetX - ship.x;
      const tDy = targetY - ship.y;
      const tDist = Math.sqrt(tDx * tDx + tDy * tDy);

      if (tDist > spec.range) {
        const shipMove = spec.speed * actualDelta;
        nextX += (tDx / tDist) * shipMove;
        nextY += (tDy / tDist) * shipMove;
      }

      nextAngle = Math.atan2(tDy, tDx);

      let nextCooldown = Math.max(0, ship.cooldownTimer - actualDelta);
      if (nextCooldown <= 0 && tDist <= spec.range) {
        nextCooldown = spec.cooldown * state.synergies.towerCooldownMultiplier;
        
        const dmgMultiplier = 1 + (state.chronosUpgrades.fleetDamage * 0.1) + (state.researchUpgrades.tachionTargeting ? 0.25 : 0.0);

        updatedProjectiles.push({
          id: Math.random().toString(),
          type: 'kinetic',
          x: nextX,
          y: nextY,
          vx: (tDx / tDist) * 220,
          vy: (tDy / tDist) * 220,
          damage: spec.damage * dmgMultiplier,
          isEnemy: false,
          targetEnemyId: targetEnemy.id
        });
      }

      return {
        ...ship,
        x: nextX,
        y: nextY,
        angle: nextAngle,
        hp: nextHp,
        targetEnemyId: targetEnemy.id,
        cooldownTimer: nextCooldown,
        flockOffsetX,
        flockOffsetY,
        orbitSpeedOffset,
        orbitRadiusOffset
      };
    } else {
      nextAngle += (0.4 + orbitSpeedOffset) * actualDelta;
      const baseRadius = ship.type === SHIP_TYPES.INTERCEPTOR ? 120 : ship.type === SHIP_TYPES.ESCORT ? 135 : 150;
      const orbitalRadius = baseRadius + orbitRadiusOffset;
      nextX = EARTH_CENTER_X + Math.cos(nextAngle) * orbitalRadius;
      nextY = EARTH_CENTER_Y + Math.sin(nextAngle) * orbitalRadius;

      return {
        ...ship,
        x: nextX,
        y: nextY,
        angle: nextAngle,
        hp: nextHp,
        targetEnemyId: null,
        cooldownTimer: 0,
        flockOffsetX,
        flockOffsetY,
        orbitSpeedOffset,
        orbitRadiusOffset
      };
    }
  });

  return results;
};

// 9. 투사체 이동 및 충돌 체크
export const simulateProjectilesAndCollisions = (
  state,
  updatedProjectiles,
  updatedEnemies,
  updatedParticles,
  actualDelta,
  decoyInterceptBonus,
  checkAndLogEnemyKill,
  damageEarth,
  addBattleLog
) => {
  const projectilesToRemove = new Set();
  const enemiesToRemove = new Set();

  const results = updatedProjectiles.map(proj => {
    const nextX = proj.x + proj.vx * actualDelta;
    const nextY = proj.y + proj.vy * actualDelta;

    if (proj.isEnemy) {
      const dx = EARTH_CENTER_X - nextX;
      const dy = EARTH_CENTER_Y - nextY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= SHIELD_RADIUS) {
        projectilesToRemove.add(proj.id);
        
        let customDamage = proj.damage;
        if (proj.type === 'kinetic') {
          const finalIntercept = Math.min(1.0, state.getKineticInterceptRate() + decoyInterceptBonus);
          const isIntercepted = Math.random() <= finalIntercept;
          if (isIntercepted) {
            addBattleLog('키네틱 실드가 적의 탄환을 요격했습니다.');
            updatedParticles.push({
              id: Math.random().toString(),
              x: nextX,
              y: nextY,
              radius: 1,
              maxRadius: 25,
              alpha: 1.0,
              color: '#ff8a00'
            });
            return { ...proj, x: nextX, y: nextY };
          }
        } else if (proj.type === 'energy' && decoyInterceptBonus > 0) {
          if (Math.random() <= decoyInterceptBonus) {
            addBattleLog('미끼 위성이 에너지 빔을 유도하여 차단했습니다.');
            return { ...proj, x: nextX, y: nextY };
          }
        }
        
        damageEarth(customDamage, proj.type);
      }
    } else {
      let hitEnemy = null;
      if (proj.targetEnemyId) {
        const target = updatedEnemies.find(e => e.id === proj.targetEnemyId);
        if (target) {
          const eDx = target.x - nextX;
          const eDy = target.y - nextY;
          const checkRadius = target.type.startsWith('boss') ? 35 : 18;
          if (Math.sqrt(eDx * eDx + eDy * eDy) < checkRadius) {
            hitEnemy = target;
          }
        }
      }
      if (!hitEnemy) {
        hitEnemy = updatedEnemies.find(e => {
          const eDx = e.x - nextX;
          const eDy = e.y - nextY;
          const checkRadius = e.type.startsWith('boss') ? 35 : 18;
          return Math.sqrt(eDx * eDx + eDy * eDy) < checkRadius;
        });
      }

      if (hitEnemy) {
        projectilesToRemove.add(proj.id);
        hitEnemy.hp -= proj.damage;

        if (proj.emp) {
          hitEnemy.stunTimer = 3.0;
        }
        if (proj.gravityBomb) {
          hitEnemy.slowTimer = 3.0;
          hitEnemy.slowAmount = 0.4;
        }
        
        updatedParticles.push({
          id: Math.random().toString(),
          x: nextX,
          y: nextY,
          radius: 1,
          maxRadius: 12,
          alpha: 1.0,
          color: '#ffcc00'
        });

        if (hitEnemy.hp <= 0) {
          enemiesToRemove.add(hitEnemy.id);
          checkAndLogEnemyKill(hitEnemy);
        }
      }
    }

    if (nextX < -2000 || nextX > 2500 || nextY < -2000 || nextY > 2500) {
      projectilesToRemove.add(proj.id);
    }

    return { ...proj, x: nextX, y: nextY };
  });

  const cleanedProjectiles = results.filter(p => !projectilesToRemove.has(p.id));
  const cleanedEnemies = updatedEnemies.filter(e => !enemiesToRemove.has(e.id) && e.hp > 0);

  return {
    updatedProjectiles: cleanedProjectiles,
    updatedEnemies: cleanedEnemies
  };
};

// 10. 폭발 파티클 갱신
export const simulateExplosionParticles = (updatedParticles, actualDelta) => {
  return updatedParticles.map(part => {
    const expansion = part.maxRadius * 3 * actualDelta;
    const newRadius = Math.min(part.maxRadius, part.radius + expansion);
    const newAlpha = Math.max(0, part.alpha - 1.8 * actualDelta);
    return { ...part, radius: newRadius, alpha: newAlpha };
  }).filter(part => part.alpha > 0);
};

// 11. 대통합 틱 시뮬레이터 실행
export const runTickSimulation = (state, actualDelta, addBattleLog, damageEarth) => {
  const updatedPlanets = JSON.parse(JSON.stringify(state.planets));
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

  // 4. 타임머신 충전
  const timeMachineRate = 0.1 * state.synergies.timeMachineChargeSpeedMultiplier * actualDelta;
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

  // 11. 폭발 파티클 갱신
  updatedParticles = simulateExplosionParticles(updatedParticles, actualDelta);

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
  // productionPower = 발전소 포함 실제 충전 속도 (15 + 발전소당 +5 TW/s)
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
  // maxOverloadEnergy = 발전소 포함된 배터리 용량 (calculatedMaxEnergy)
  const maxOverloadEnergy = calculatedMaxEnergy;

  newOverloadEnergy = Math.max(0, Math.min(maxOverloadEnergy, newOverloadEnergy + netPower * actualDelta));

  let newIsPowerOffline = state.isPowerOffline;
  let newOnlineSatelliteCount = state.onlineSatelliteCount !== undefined ? state.onlineSatelliteCount : 0;
  let newSatelliteBootTimer = state.satelliteBootTimer !== undefined ? state.satelliteBootTimer : 2.0;

  if (newOverloadEnergy <= 0) {
    // 방전: 모든 위성 즉시 OFF
    newIsPowerOffline = true;
    newOnlineSatelliteCount = 0;
    newSatelliteBootTimer = 2.0;
  } else if (newIsPowerOffline) {
    // 복구 중: 가용 전력이 0보다 크면 순차적으로 위성 ON
    if (netPower < 0 && newOnlineSatelliteCount > 0) {
      // 순전력이 음수인데 위성이 켜져있으면 2초마다 하나씩 OFF
      newSatelliteBootTimer -= actualDelta;
      if (newSatelliteBootTimer <= 0) {
        newOnlineSatelliteCount--;
        addBattleLog(`[경고] 전력 부족! 위성 전원 차단: 위성 1개 OFF.`);
        newSatelliteBootTimer = 2.0;
      }
    } else if (newOnlineSatelliteCount < builtSats.length) {
      // 순전력이 0 이상이면 2초마다 하나씩 ON
      newSatelliteBootTimer -= actualDelta;
      if (newSatelliteBootTimer <= 0) {
        newOnlineSatelliteCount++;
        addBattleLog(`[알림] 전력 복구 중: 위성 순차 투입 (${newOnlineSatelliteCount}/${builtSats.length}).`);
        newSatelliteBootTimer = 2.0;
      }
    }

    // 복구 완료: 모든 위성이 켜졌고 순전력이 0 이상일 때 정상 상태로 전환
    if (newOnlineSatelliteCount >= builtSats.length && netPower >= 0) {
      newIsPowerOffline = false;
    }
  } else {
    // 정상 상태: 모든 위성 ON
    newOnlineSatelliteCount = builtSats.length;
    newSatelliteBootTimer = 2.0;
  }

  return {
    newOverloadEnergy,
    maxOverloadEnergy,
    newIsPowerOffline,
    newOnlineSatelliteCount,
    newSatelliteBootTimer,
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
