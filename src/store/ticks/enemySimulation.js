import {
  ALIEN_TYPES,
  ALIEN_SPECS,
  EARTH_CENTER_X,
  EARTH_CENTER_Y,
  SHIELD_RADIUS,
  ENEMY_SPAWN_RADIUS
} from '../gameSpecs';

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

  for (let i = 0; i < updatedEnemies.length; i++) {
    const enemy = updatedEnemies[i];
    const dx = EARTH_CENTER_X - enemy.x;
    const dy = EARTH_CENTER_Y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

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
      enemy.x += (dx / dist) * moveDist;
      enemy.y += (dy / dist) * moveDist;
    }

    enemy.attackTimer = (enemy.attackTimer || 0) + actualDelta;
    if (enemy.attackTimer >= enemy.spec.cooldown) {
      enemy.attackTimer = 0;

      if (enemy.type === ALIEN_TYPES.BOSS_CHRONO) {
        nextMuteTimer = 4.0;
        addBattleLog('보스 [크로노 디바우러]가 시공간 정지 필드를 전개했습니다! (함대 4초 정지)');
        
        const px = -dy / dist;
        const py = dx / dist;
        for (let j = 0; j < 3; j++) {
          const offset = (j - 1) * 15;
          const spreadV = (j - 1) * 30;
          updatedProjectiles.push({
            id: Math.random().toString(),
            type: 'kinetic',
            x: enemy.x + px * offset,
            y: enemy.y + py * offset,
            vx: (dx / dist) * 120 + px * spreadV,
            vy: (dy / dist) * 120 + py * spreadV,
            damage: (enemy.spec.damage / 3) * barrierDamageReduction,
            isEnemy: true
          });
        }
      } else {
        const projDx = EARTH_CENTER_X - enemy.x;
        const projDy = EARTH_CENTER_Y - enemy.y;
        const projDist = Math.sqrt(projDx * projDx + projDy * projDy);

        updatedProjectiles.push({
          id: Math.random().toString(),
          type: enemy.spec.attackType,
          x: enemy.x,
          y: enemy.y,
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
  }

  return {
    updatedEnemies,
    nextMuteTimer
  };
};
