import React from 'react';

let Group, Circle, Rect, Line, Paint;
try {
  const Skia = require('@shopify/react-native-skia');
  Group = Skia.Group;
  Circle = Skia.Circle;
  Rect = Skia.Rect;
  Line = Skia.Line;
  Paint = Skia.Paint;
} catch (e) {}

export default function SkiaEnemies({ enemies }) {
  if (!Group || !Circle || !Rect || !Line || !Paint) return null;
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
          <Group key={enemy.id}>
            <Rect x={enemy.x - w / 2} y={enemy.y - h / 2} width={w} height={h} color={enemyColor} />
            {isBoss && (
              <Circle cx={enemy.x} cy={enemy.y} r={Math.max(w, h) * 0.7} color="transparent">
                <Paint style="stroke" strokeWidth={1} color={enemyColor} />
              </Circle>
            )}
            <Line p1={{ x: enemy.x - w / 2, y: enemy.y - h / 2 - 5 }} p2={{ x: enemy.x + w / 2, y: enemy.y - h / 2 - 5 }} color="rgba(255, 255, 255, 0.25)" strokeWidth={2} />
            <Line p1={{ x: enemy.x - w / 2, y: enemy.y - h / 2 - 5 }} p2={{ x: enemy.x - w / 2 + w * (enemy.hp / enemy.maxHp), y: enemy.y - h / 2 - 5 }} color={isBoss ? '#ffd700' : '#00ff8a'} strokeWidth={2} />
          </Group>
        );
      })}
    </>
  );
}
