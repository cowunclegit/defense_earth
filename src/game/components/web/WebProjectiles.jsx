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
          // Slow Kinetic Spreader: Fiery orange rocket shape (circle with orange tail)
          const dx = proj.vx * 0.06;
          const dy = proj.vy * 0.06;
          return (
            <g key={proj.id}>
              <line x1={proj.x} y1={proj.y} x2={proj.x - dx} y2={proj.y - dy} stroke="#ff3300" strokeWidth={3.5} opacity={0.6} />
              <circle cx={proj.x} cy={proj.y} r={3} fill="#ffaa00" />
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
          // Heavy Antimatter Cannon: Glowing White beam with outer Red halo
          const dx = proj.vx * 0.05;
          const dy = proj.vy * 0.05;
          return (
            <g key={proj.id}>
              <line x1={proj.x} y1={proj.y} x2={proj.x - dx} y2={proj.y - dy} stroke="#ff0000" strokeWidth={12.0} opacity={0.45} />
              <line x1={proj.x} y1={proj.y} x2={proj.x - dx} y2={proj.y - dy} stroke="#ffffff" strokeWidth={3.5} />
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

