import React from 'react';

export default function WebEnemies({ enemies }) {
  return (
    <>
      {enemies.map((enemy) => {
        let enemyColor = '#ff3b30';
        let isBoss = false;
        let w = 8;
        let h = 8;

        if (enemy.type === 'raider') {
          enemyColor = '#ff8a00';
          w = 12;
          h = 12;
        } else if (enemy.type === 'destroyer') {
          enemyColor = '#de3bff';
          w = 18;
          h = 18;
        } else if (enemy.type === 'boss_apocalypse') {
          enemyColor = '#ff1a1a';
          isBoss = true;
          w = 42;
          h = 24;
        } else if (enemy.type === 'boss_chrono') {
          enemyColor = '#941aff';
          isBoss = true;
          w = 34;
          h = 34;
        }

        return (
          <g key={enemy.id}>
            <rect x={enemy.x - w / 2} y={enemy.y - h / 2} width={w} height={h} fill={enemyColor} />
            {isBoss && (
              <circle cx={enemy.x} cy={enemy.y} r={Math.max(w, h) * 0.7} fill="transparent" stroke={enemyColor} strokeWidth={1} />
            )}
            <line x1={enemy.x - w / 2} y1={enemy.y - h / 2 - 5} x2={enemy.x + w / 2} y2={enemy.y - h / 2 - 5} stroke="rgba(255, 255, 255, 0.25)" strokeWidth={2} />
            <line x1={enemy.x - w / 2} y1={enemy.y - h / 2 - 5} x2={enemy.x - w / 2 + w * (enemy.hp / enemy.maxHp)} y2={enemy.y - h / 2 - 5} stroke={isBoss ? '#ffd700' : '#00ff8a'} strokeWidth={2} />
            <text x={enemy.x} y={enemy.y - h / 2 - 9} fill="#ffffff" fontSize={6.5} fontWeight="bold" textAnchor="middle">
              Lv.{enemy.level || 1} ({Math.round(enemy.hp)}/{Math.round(enemy.maxHp)})
            </text>
          </g>
        );
      })}
    </>
  );
}
