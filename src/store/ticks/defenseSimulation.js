import { PLANETARY_DATA } from '../../constants/planetaryData';
import {
  SATELLITE_SPECS,
  EARTH_CENTER_X,
  EARTH_CENTER_Y,
  getScaledDmg,
  getScaledCd,
  getScaledRange
} from '../gameSpecs';

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
            
            let speed = 400;
            if (type === 'laser') speed = 1200;
            else if (type === 'plasmaLaser') speed = 360;
            else if (type === 'emp') speed = 480;
            else if (type === 'clusterMissile') speed = 300;
            else if (type === 'gravityBomb') speed = 220;
            else if (type === 'antimatter') speed = 800;

            const targetAngle = Math.atan2(dy, dx);
            const anglesToSpawn = type === 'clusterMissile' ? [-0.2, 0, 0.2] : [0];

            anglesToSpawn.forEach((angleOffset) => {
              const angle = targetAngle + angleOffset;
              const vx = dist > 0 ? Math.cos(angle) * speed : 0;
              const vy = dist > 0 ? Math.sin(angle) * speed : 0;

              updatedProjectiles.push({
                id: Math.random().toString(),
                type: type === 'clusterMissile' ? 'kinetic' : 'energy',
                bulletType: type,
                x: satX,
                y: satY,
                vx: vx,
                vy: vy,
                damage: scaledDmg,
                isEnemy: false,
                targetEnemyId: target.id,
                emp: type === 'emp',
                gravityBomb: type === 'gravityBomb',
                lifetime: (type === 'clusterMissile' || type === 'antimatter') ? 5.0 : undefined
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
