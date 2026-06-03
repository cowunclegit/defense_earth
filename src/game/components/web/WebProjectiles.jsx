import React from 'react';

export default function WebProjectiles({ projectiles }) {
  return (
    <>
      {projectiles.map((proj) => {
        if (proj.type === 'energy') {
          const dx = proj.vx * 0.05;
          const dy = proj.vy * 0.05;
          const color = proj.color || (proj.isEnemy ? '#00f0ff' : '#ff5500');
          return (
            <g key={proj.id}>
              <line x1={proj.x} y1={proj.y} x2={proj.x - dx} y2={proj.y - dy} stroke={color} strokeWidth={5.5} opacity={0.35} />
              <line x1={proj.x} y1={proj.y} x2={proj.x - dx} y2={proj.y - dy} stroke="#ffffff" strokeWidth={1.5} />
            </g>
          );
        } else {
          return (
            <circle key={proj.id} cx={proj.x} cy={proj.y} r={2.5} fill={proj.color || (proj.isEnemy ? '#ffcc00' : '#ffd700')} />
          );
        }
      })}
    </>
  );
}
