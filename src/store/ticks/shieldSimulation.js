import {
  EARTH_CENTER_X,
  EARTH_CENTER_Y,
  SHIELD_RADIUS,
  SHIELD_MODULE_SPECS,
  isSystemOnline
} from '../gameSpecs';

export const simulateShieldAndHP = (
  state,
  updatedPlanets,
  updatedEnemies,
  updatedParticles,
  updatedFloatingTexts,
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
  let newDischargeTimer = Math.max(0, (state.dischargeTimer || 0) - actualDelta);

  if (isShieldCollapsed) {
    if (state.counterattackModules.discharge && (state.overloadEnergy || 0) > 0 && updatedEnemies.length > 0 && newDischargeTimer <= 0) {
      newDischargeTimer = 20.0; // 20s Cooldown
      addBattleLog(`실드 과부하 방전 발동! 주변 적에게 200 광역 피해!`);
      updatedEnemies.forEach(e => {
        const dx = e.x - EARTH_CENTER_X;
        const dy = e.y - EARTH_CENTER_Y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= 200) { // maxRadius of visual effect is 200
          e.hp -= 200;
          // Spawn cyan shockwave impact particle on zapped enemy
          updatedParticles.push({
            id: Math.random().toString(),
            x: e.x,
            y: e.y,
            radius: 2,
            maxRadius: 35,
            alpha: 1.0,
            color: '#00f0ff'
          });
          // Push floating combat text
          updatedFloatingTexts.push({
            id: Math.random().toString(),
            x: e.x,
            y: e.y,
            text: `⚡ -200`,
            color: '#00f0ff',
            alpha: 1.0,
            age: 0.0
          });
        }
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
      const dx = e.x - EARTH_CENTER_X;
      const dy = e.y - EARTH_CENTER_Y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= 250) { // Proximity range for electric field
        e.hp -= 80 * actualDelta;
        // Spawn small electric spark on zapped enemy periodically (15% chance per frame)
        if (Math.random() < 0.15) {
          updatedParticles.push({
            id: Math.random().toString(),
            x: e.x,
            y: e.y,
            radius: 2,
            maxRadius: 8,
            alpha: 0.8,
            color: '#00ffff'
          });
          updatedFloatingTexts.push({
            id: Math.random().toString(),
            x: e.x,
            y: e.y,
            text: `⚡ -80`,
            color: '#00ffff',
            alpha: 1.0,
            age: 0.0
          });
        }
      }
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
    newHp,
    newDischargeTimer
  };
};
