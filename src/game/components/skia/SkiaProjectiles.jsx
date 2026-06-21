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
        if (proj.isEnemy) {
          // Enemy Projectiles
          if (proj.type === 'energy') {
            const dx = proj.vx * 0.05;
            const dy = proj.vy * 0.05;
            return (
              <Group key={proj.id}>
                <Line p1={{ x: proj.x, y: proj.y }} p2={{ x: proj.x - dx, y: proj.y - dy }} color="#00f0ff" strokeWidth={5.5} opacity={0.35} />
                <Line p1={{ x: proj.x, y: proj.y }} p2={{ x: proj.x - dx, y: proj.y - dy }} color="#ffffff" strokeWidth={1.5} />
              </Group>
            );
          } else {
            return (
              <Circle key={proj.id} cx={proj.x} cy={proj.y} r={3} color="#ffcc00" />
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
            <Group key={proj.id}>
              <Line p1={{ x: proj.x, y: proj.y }} p2={{ x: proj.x - dx, y: proj.y - dy }} color="#00ffff" strokeWidth={4.0} opacity={0.4} />
              <Line p1={{ x: proj.x, y: proj.y }} p2={{ x: proj.x - dx, y: proj.y - dy }} color="#ffffff" strokeWidth={1.2} />
            </Group>
          );
        } else if (type === 'plasmaLaser') {
          // Thick Glowing Purple/Magenta Laser Pulse
          const dx = proj.vx * 0.06;
          const dy = proj.vy * 0.06;
          return (
            <Group key={proj.id}>
              <Line p1={{ x: proj.x, y: proj.y }} p2={{ x: proj.x - dx, y: proj.y - dy }} color="#ff00cc" strokeWidth={9.0} opacity={0.35} />
              <Line p1={{ x: proj.x, y: proj.y }} p2={{ x: proj.x - dx, y: proj.y - dy }} color="#ffffff" strokeWidth={2.5} />
            </Group>
          );
        } else if (type === 'emp') {
          // Stun Spark: Glowing Green Circle with outer shockwave ring
          return (
            <Group key={proj.id}>
              <Circle cx={proj.x} cy={proj.y} r={6} color="#55ff55" opacity={0.3} />
              <Circle cx={proj.x} cy={proj.y} r={3} color="#ffffff" />
            </Group>
          );
        } else if (type === 'clusterMissile') {
          // Slow Kinetic Spreader: Fiery orange rocket shape (circle with orange tail)
          const dx = proj.vx * 0.06;
          const dy = proj.vy * 0.06;
          return (
            <Group key={proj.id}>
              <Line p1={{ x: proj.x, y: proj.y }} p2={{ x: proj.x - dx, y: proj.y - dy }} color="#ff3300" strokeWidth={3.5} opacity={0.6} />
              <Circle cx={proj.x} cy={proj.y} r={3} color="#ffaa00" />
            </Group>
          );
        } else if (type === 'gravityBomb') {
          // Gravity Singularity: Heavy Dark Purple Shell with implosion ring
          return (
            <Group key={proj.id}>
              <Circle cx={proj.x} cy={proj.y} r={9} color="#8a2be2" opacity={0.25} />
              <Circle cx={proj.x} cy={proj.y} r={3} color="#2b0040" />
            </Group>
          );
        } else if (type === 'antimatter') {
          // Heavy Antimatter Cannon: Glowing White beam with outer Red halo
          const dx = proj.vx * 0.05;
          const dy = proj.vy * 0.05;
          return (
            <Group key={proj.id}>
              <Line p1={{ x: proj.x, y: proj.y }} p2={{ x: proj.x - dx, y: proj.y - dy }} color="#ff0000" strokeWidth={12.0} opacity={0.45} />
              <Line p1={{ x: proj.x, y: proj.y }} p2={{ x: proj.x - dx, y: proj.y - dy }} color="#ffffff" strokeWidth={3.5} />
            </Group>
          );
        } else {
          // Default fallbacks (e.g. ship kinetic shells)
          if (proj.type === 'energy') {
            const dx = proj.vx * 0.05;
            const dy = proj.vy * 0.05;
            return (
              <Group key={proj.id}>
                <Line p1={{ x: proj.x, y: proj.y }} p2={{ x: proj.x - dx, y: proj.y - dy }} color="#ff5500" strokeWidth={5.5} opacity={0.35} />
                <Line p1={{ x: proj.x, y: proj.y }} p2={{ x: proj.x - dx, y: proj.y - dy }} color="#ffffff" strokeWidth={1.5} />
              </Group>
            );
          } else {
            return (
              <Circle key={proj.id} cx={proj.x} cy={proj.y} r={2.5} color="#ffd700" />
            );
          }
        }
      })}
    </>
  );
}
