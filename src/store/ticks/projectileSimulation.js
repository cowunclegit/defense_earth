import {
  EARTH_CENTER_X,
  EARTH_CENTER_Y,
  SHIELD_RADIUS,
  isSystemOnline
} from '../gameSpecs';

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

  for (let i = 0; i < updatedProjectiles.length; i++) {
    const proj = updatedProjectiles[i];

    if (proj.isExploded) {
      if (proj.trail) {
        for (let j = 0; j < proj.trail.length; j++) {
          proj.trail[j].life -= actualDelta;
        }
        proj.trail = proj.trail.filter(pt => pt.life > 0);
      }
      if (!proj.trail || proj.trail.length === 0) {
        projectilesToRemove.add(proj.id);
      }
      continue;
    }

    if ((proj.bulletType === 'clusterMissile' || proj.bulletType === 'antimatter') && !proj.isEnemy) {
      if (proj.lifetime === undefined) {
        proj.lifetime = 5.0;
      }
      proj.lifetime -= actualDelta;
      if (proj.lifetime <= 0) {
        proj.isExploded = true;
        updatedParticles.push({
          id: Math.random().toString(),
          x: proj.x,
          y: proj.y,
          radius: proj.bulletType === 'antimatter' ? 3 : 1,
          maxRadius: proj.bulletType === 'antimatter' ? 500 : 12,
          alpha: 1.0,
          color: proj.bulletType === 'antimatter' ? '#ff0055' : '#ffcc00',
          isDamageRing: proj.bulletType === 'antimatter',
          damage: proj.bulletType === 'antimatter' ? proj.damage : 0,
          hitEnemyIds: []
        });
        continue;
      } else {
        let target = updatedEnemies.find(e => e.id === proj.targetEnemyId && e.hp > 0);
        if (!target && updatedEnemies.length > 0) {
          let nearestEnemy = null;
          let minDist = 999999;
          for (let j = 0; j < updatedEnemies.length; j++) {
            const enemy = updatedEnemies[j];
            if (enemy.hp > 0) {
              const dx = enemy.x - proj.x;
              const dy = enemy.y - proj.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < minDist) {
                minDist = dist;
                nearestEnemy = enemy;
              }
            }
          }
          if (nearestEnemy) {
            proj.targetEnemyId = nearestEnemy.id;
            target = nearestEnemy;
          }
        }

        if (target) {
          const dx = target.x - proj.x;
          const dy = target.y - proj.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0) {
            const currentSpeed = Math.sqrt(proj.vx * proj.vx + proj.vy * proj.vy) || 300;
            const currentAngle = Math.atan2(proj.vy, proj.vx);
            const targetAngle = Math.atan2(dy, dx);
            let angleDiff = targetAngle - currentAngle;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

            const maxAngularSpeed = 4.0;
            const maxTurn = maxAngularSpeed * actualDelta;
            const turnSign = angleDiff >= 0 ? 1 : -1;
            const turnAmount = Math.min(Math.abs(angleDiff), maxTurn);
            const newAngle = currentAngle + turnSign * turnAmount;

            proj.vx = Math.cos(newAngle) * currentSpeed;
            proj.vy = Math.sin(newAngle) * currentSpeed;
          }
        }
      }
    }

    proj.x += proj.vx * actualDelta;
    proj.y += proj.vy * actualDelta;

    if ((proj.bulletType === 'clusterMissile' || proj.bulletType === 'antimatter') && !proj.isEnemy) {
      if (!proj.trail) {
        proj.trail = [];
      }
      proj.trail.push({ x: proj.x, y: proj.y, life: 2.5 });
      for (let j = 0; j < proj.trail.length; j++) {
        proj.trail[j].life -= actualDelta;
      }
      proj.trail = proj.trail.filter(pt => pt.life > 0);
    }

    if (proj.isEnemy) {
      const dx = EARTH_CENTER_X - proj.x;
      const dy = EARTH_CENTER_Y - proj.y;
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
              x: proj.x,
              y: proj.y,
              radius: 1,
              maxRadius: 25,
              alpha: 1.0,
              color: '#ff8a00'
            });
            continue;
          }
        } else if (proj.type === 'energy' && decoyInterceptBonus > 0) {
          if (Math.random() <= decoyInterceptBonus) {
            addBattleLog('미끼 위성이 에너지 빔을 유도하여 차단했습니다.');
            continue;
          }
        }
        
        damageEarth(customDamage, proj.type);
      }
    } else {
      let hitEnemy = null;
      if (proj.targetEnemyId) {
        const target = updatedEnemies.find(e => e.id === proj.targetEnemyId && e.hp > 0);
        if (target) {
          const eDx = target.x - proj.x;
          const eDy = target.y - proj.y;
          const checkRadius = target.type.startsWith('boss') ? 35 : 18;
          if (Math.sqrt(eDx * eDx + eDy * eDy) < checkRadius) {
            hitEnemy = target;
          }
        }
      }
      if (!hitEnemy) {
        hitEnemy = updatedEnemies.find(e => {
          if (e.hp <= 0) return false;
          const eDx = e.x - proj.x;
          const eDy = e.y - proj.y;
          const checkRadius = e.type.startsWith('boss') ? 35 : 18;
          return Math.sqrt(eDx * eDx + eDy * eDy) < checkRadius;
        });
      }

      if (hitEnemy) {
        if (proj.bulletType === 'antimatter') {
          hitEnemy.hp -= proj.damage;
          if (hitEnemy.hp <= 0) {
            enemiesToRemove.add(hitEnemy.id);
            checkAndLogEnemyKill(hitEnemy);
          }
        } else {
          hitEnemy.hp -= proj.damage;

          if (proj.emp) {
            // EMP Splash Stun: Stun all enemies within 100px radius
            updatedEnemies.forEach(e => {
              if (e.hp > 0) {
                const dx = e.x - proj.x;
                const dy = e.y - proj.y;
                if (Math.sqrt(dx * dx + dy * dy) <= 100) {
                  e.stunTimer = Math.max(e.stunTimer || 0, 2.0);
                }
              }
            });
          }
          if (proj.gravityBomb) {
            hitEnemy.slowTimer = 3.0;
            hitEnemy.slowAmount = 0.4;
          }

          if (hitEnemy.hp <= 0) {
            enemiesToRemove.add(hitEnemy.id);
            checkAndLogEnemyKill(hitEnemy);
          }
        }
        
        updatedParticles.push({
          id: Math.random().toString(),
          x: proj.x,
          y: proj.y,
          radius: proj.bulletType === 'antimatter' ? 3 : 1,
          maxRadius: proj.bulletType === 'antimatter' ? 500 : (proj.emp ? 100 : 12),
          alpha: 1.0,
          color: proj.bulletType === 'antimatter' ? '#ff0055' : (proj.emp ? '#00f0ff' : '#ffcc00'),
          isDamageRing: proj.bulletType === 'antimatter',
          damage: proj.bulletType === 'antimatter' ? proj.damage : 0,
          hitEnemyIds: proj.bulletType === 'antimatter' ? [hitEnemy.id] : []
        });

        if ((proj.bulletType === 'clusterMissile' || proj.bulletType === 'antimatter') && !proj.isEnemy) {
          proj.isExploded = true;
        } else {
          projectilesToRemove.add(proj.id);
        }
      }
    }

    if (proj.x < -2000 || proj.x > 2500 || proj.y < -2000 || proj.y > 2500) {
      projectilesToRemove.add(proj.id);
    }
  }

  const cleanedProjectiles = updatedProjectiles.filter(p => !projectilesToRemove.has(p.id));
  const cleanedEnemies = updatedEnemies.filter(e => !enemiesToRemove.has(e.id) && e.hp > 0);

  return {
    updatedProjectiles: cleanedProjectiles,
    updatedEnemies: cleanedEnemies
  };
};

export const simulateExplosionParticles = (updatedParticles, updatedEnemies, actualDelta, checkAndLogEnemyKill) => {
  const activeParticles = [];
  const len = updatedParticles.length;
  for (let i = 0; i < len; i++) {
    const part = updatedParticles[i];
    const expansion = part.maxRadius * 3 * actualDelta;
    part.radius = Math.min(part.maxRadius, part.radius + expansion);
    part.alpha = Math.max(0, part.alpha - 1.8 * actualDelta);
    
    // Apply expanding damage ring logic
    if (part.isDamageRing && part.damage > 0) {
      updatedEnemies.forEach(e => {
        if (e.hp > 0) {
          const dx = e.x - part.x;
          const dy = e.y - part.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= part.radius) {
            if (!part.hitEnemyIds.includes(e.id)) {
              part.hitEnemyIds.push(e.id);
              e.hp -= part.damage;
              if (e.hp <= 0) {
                checkAndLogEnemyKill(e);
              }
            }
          }
        }
      });
    }

    if (part.alpha > 0) {
      activeParticles.push(part);
    }
  }
  
  for (let i = len; i < updatedParticles.length; i++) {
    activeParticles.push(updatedParticles[i]);
  }

  return activeParticles;
};
