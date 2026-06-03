import React from 'react';

let Group, Circle, Line;
try {
  const Skia = require('@shopify/react-native-skia');
  Group = Skia.Group;
  Circle = Skia.Circle;
  Line = Skia.Line;
} catch (e) {}

export default function SkiaProjectiles({ projectiles }) {
  if (!Group || !Circle || !Line) return null;
  return (
    <>
      {projectiles.map((proj) => {
        if (proj.type === 'energy') {
          const dx = proj.vx * 0.05;
          const dy = proj.vy * 0.05;
          const color = proj.color || (proj.isEnemy ? '#00f0ff' : '#ff5500');
          return (
            <Group key={proj.id}>
              <Line p1={{ x: proj.x, y: proj.y }} p2={{ x: proj.x - dx, y: proj.y - dy }} color={color} strokeWidth={5.5} opacity={0.35} />
              <Line p1={{ x: proj.x, y: proj.y }} p2={{ x: proj.x - dx, y: proj.y - dy }} color="#ffffff" strokeWidth={1.5} />
            </Group>
          );
        } else {
          return (
            <Circle key={proj.id} cx={proj.x} cy={proj.y} r={2.5} color={proj.color || (proj.isEnemy ? '#ffcc00' : '#ffd700')} />
          );
        }
      })}
    </>
  );
}
