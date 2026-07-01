import {
  SHIP_TYPES,
  SHIP_SPECS,
  EARTH_CENTER_X,
  EARTH_CENTER_Y,
  SHIP_LEVEL_REQUIREMENTS
} from '../gameSpecs';

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
  for (let i = 0; i < updatedFleet.length; i++) {
    const ship = updatedFleet[i];
    const spec = SHIP_SPECS[ship.type];
    
    if (ship.hp < ship.maxHp) {
      const passiveHeal = state.researchUpgrades.selfRepair ? ship.maxHp * 0.01 : 0;
      const activeHeal = totalRepairShips * 50 + totalRepairDrones * 20;
      ship.hp = Math.min(ship.maxHp, ship.hp + (passiveHeal + activeHeal) * actualDelta);
    }

    if (isMuted) {
      continue;
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

    if (ship.flockOffsetX === undefined) ship.flockOffsetX = (Math.random() - 0.5) * 30;
    if (ship.flockOffsetY === undefined) ship.flockOffsetY = (Math.random() - 0.5) * 30;
    if (ship.orbitSpeedOffset === undefined) ship.orbitSpeedOffset = (Math.random() - 0.5) * 0.15;
    if (ship.orbitRadiusOffset === undefined) ship.orbitRadiusOffset = (Math.random() - 0.5) * 20;

    if (targetEnemy && spec.damage > 0) {
      const targetX = targetEnemy.x + ship.flockOffsetX;
      const targetY = targetEnemy.y + ship.flockOffsetY;
      const tDx = targetX - ship.x;
      const tDy = targetY - ship.y;
      const tDist = Math.sqrt(tDx * tDx + tDy * tDy);

      if (tDist > spec.range) {
        const shipMove = spec.speed * actualDelta;
        ship.x += (tDx / tDist) * shipMove;
        ship.y += (tDy / tDist) * shipMove;
      }

      ship.angle = Math.atan2(tDy, tDx);

      if (ship.cooldownTimer === undefined) ship.cooldownTimer = 0;
      ship.cooldownTimer = Math.max(0, ship.cooldownTimer - actualDelta);
      if (ship.cooldownTimer <= 0 && tDist <= spec.range) {
        ship.cooldownTimer = spec.cooldown * state.synergies.towerCooldownMultiplier;
        
        const dmgMultiplier = 1 + (state.chronosUpgrades.fleetDamage * 0.1) + (state.researchUpgrades.tachionTargeting ? 0.25 : 0.0);

        updatedProjectiles.push({
          id: Math.random().toString(),
          type: 'kinetic',
          x: ship.x,
          y: ship.y,
          vx: (tDx / tDist) * 220,
          vy: (tDy / tDist) * 220,
          damage: spec.damage * dmgMultiplier,
          isEnemy: false,
          targetEnemyId: targetEnemy.id
        });
      }
      ship.targetEnemyId = targetEnemy.id;
    } else {
      ship.angle += (0.4 + ship.orbitSpeedOffset) * actualDelta;
      const baseRadius = ship.type === SHIP_TYPES.INTERCEPTOR ? 120 : ship.type === SHIP_TYPES.ESCORT ? 135 : 150;
      const orbitalRadius = baseRadius + ship.orbitRadiusOffset;
      ship.x = EARTH_CENTER_X + Math.cos(ship.angle) * orbitalRadius;
      ship.y = EARTH_CENTER_Y + Math.sin(ship.angle) * orbitalRadius;
      ship.targetEnemyId = null;
      ship.cooldownTimer = 0;
    }
  }

  return updatedFleet;
};
