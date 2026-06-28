import React, { memo } from 'react';

const WebProjectiles = memo(function WebProjectiles({ projectiles }) {
  return (
    <>
      {projectiles.map((proj) => {
        if (proj.isEnemy) {
          // Enemy Projectiles
          if (proj.type === 'energy') {
            const dx = proj.vx * 0.05;
            const dy = proj.vy * 0.05;
            return (
              <g key={proj.id}>
                <line x1={proj.x} y1={proj.y} x2={proj.x - dx} y2={proj.y - dy} stroke="#00f0ff" strokeWidth={5.5} opacity={0.35} />
                <line x1={proj.x} y1={proj.y} x2={proj.x - dx} y2={proj.y - dy} stroke="#ffffff" strokeWidth={1.5} />
              </g>
            );
          } else {
            return (
              <circle key={proj.id} cx={proj.x} cy={proj.y} r={3} fill="#ffcc00" />
            );
          }
        }

        // Ally/Satellite Projectiles
        const type = proj.bulletType;

        if (type === 'laser') {
          // Thin Cyan Laser Beam
          const dx = proj.vx * 0.04;
          const dy = proj.vy * 0.04;
          return (
            <g key={proj.id}>
              <line x1={proj.x} y1={proj.y} x2={proj.x - dx} y2={proj.y - dy} stroke="#00ffff" strokeWidth={4.0} opacity={0.4} />
              <line x1={proj.x} y1={proj.y} x2={proj.x - dx} y2={proj.y - dy} stroke="#ffffff" strokeWidth={1.2} />
            </g>
          );
        } else if (type === 'plasmaLaser') {
          // Thick Glowing Purple/Magenta Laser Pulse
          const dx = proj.vx * 0.06;
          const dy = proj.vy * 0.06;
          return (
            <g key={proj.id}>
              <line x1={proj.x} y1={proj.y} x2={proj.x - dx} y2={proj.y - dy} stroke="#ff00cc" strokeWidth={9.0} opacity={0.35} />
              <line x1={proj.x} y1={proj.y} x2={proj.x - dx} y2={proj.y - dy} stroke="#ffffff" strokeWidth={2.5} />
            </g>
          );
        } else if (type === 'emp') {
          // Stun Spark: Glowing Green Circle with outer shockwave ring
          return (
            <g key={proj.id}>
              <circle cx={proj.x} cy={proj.y} r={6} fill="#55ff55" opacity={0.3} />
              <circle cx={proj.x} cy={proj.y} r={3} fill="#ffffff" />
            </g>
          );
        } else if (type === 'clusterMissile') {
          // Guided Kinetic Rocket: Orange particle trail + glowing head
          return (
            <g key={proj.id}>
              {proj.trail && proj.trail.map((pt, idx) => {
                if (idx === 0) return null;
                const prev = proj.trail[idx - 1];
                const progress = pt.life / 2.5;
                const opacity = progress * 0.7;
                const width = progress * 4.0;
                return (
                  <line
                    key={`${proj.id}-trail-${idx}`}
                    x1={prev.x}
                    y1={prev.y}
                    x2={pt.x}
                    y2={pt.y}
                    stroke="#ff3300"
                    strokeWidth={width}
                    opacity={opacity}
                  />
                );
              })}
              {!proj.trail && !proj.isExploded && (
                <line
                  x1={proj.x}
                  y1={proj.y}
                  x2={proj.x - proj.vx * 0.06}
                  y2={proj.y - proj.vy * 0.06}
                  stroke="#ff3300"
                  strokeWidth={3.5}
                  opacity={0.6}
                />
              )}
              {!proj.isExploded && <circle cx={proj.x} cy={proj.y} r={3.5} fill="#ffaa00" />}
            </g>
          );
        } else if (type === 'gravityBomb') {
          // Gravity Singularity: Heavy Dark Purple Shell with implosion ring
          return (
            <g key={proj.id}>
              <circle cx={proj.x} cy={proj.y} r={9} fill="#8a2be2" opacity={0.25} stroke="#4b0082" strokeWidth={1.5} />
              <circle cx={proj.x} cy={proj.y} r={3} fill="#2b0040" />
            </g>
          );
        } else if (type === 'antimatter') {
          // Heavy Antimatter Missile: Crimson Red trail + glowing head
          return (
            <g key={proj.id}>
              {proj.trail && proj.trail.map((pt, idx) => {
                if (idx === 0) return null;
                const prev = proj.trail[idx - 1];
                const progress = pt.life / 2.5;
                const opacity = progress * 0.8;
                const width = progress * 6.0;
                return (
                  <line
                    key={`${proj.id}-trail-${idx}`}
                    x1={prev.x}
                    y1={prev.y}
                    x2={pt.x}
                    y2={pt.y}
                    stroke="#ff0055"
                    strokeWidth={width}
                    opacity={opacity}
                  />
                );
              })}
              {!proj.trail && !proj.isExploded && (
                <line
                  x1={proj.x}
                  y1={proj.y}
                  x2={proj.x - proj.vx * 0.06}
                  y2={proj.y - proj.vy * 0.06}
                  stroke="#ff0055"
                  strokeWidth={5.0}
                  opacity={0.7}
                />
              )}
              {!proj.isExploded && (
                <g>
                  <circle cx={proj.x} cy={proj.y} r={6} fill="#ff0055" opacity={0.5} />
                  <circle cx={proj.x} cy={proj.y} r={3} fill="#ffffff" />
                </g>
              )}
            </g>
          );
        } else {
          // Default fallbacks (e.g. ship kinetic shells)
          if (proj.type === 'energy') {
            const dx = proj.vx * 0.05;
            const dy = proj.vy * 0.05;
            return (
              <g key={proj.id}>
                <line x1={proj.x} y1={proj.y} x2={proj.x - dx} y2={proj.y - dy} stroke="#ff5500" strokeWidth={5.5} opacity={0.35} />
                <line x1={proj.x} y1={proj.y} x2={proj.x - dx} y2={proj.y - dy} stroke="#ffffff" strokeWidth={1.5} />
              </g>
            );
          } else {
            return (
              <circle key={proj.id} cx={proj.x} cy={proj.y} r={2.5} fill="#ffd700" />
            );
          }
        }
      })}
    </>
  );
});

export default WebProjectiles;

