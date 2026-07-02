import React from 'react';
import { Group, Circle, Line } from '@shopify/react-native-skia';

export default function SkiaProjectiles({ projectiles }) {

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
          // Guided Kinetic Rocket: Orange particle trail + glowing head
          return (
            <Group key={proj.id}>
              {proj.trail && proj.trail.map((pt, idx) => {
                if (idx === 0) return null;
                const prev = proj.trail[idx - 1];
                const progress = pt.life / 2.5;
                const opacity = progress * 0.7;
                const width = progress * 4.0;
                return (
                  <Line
                    key={`${proj.id}-trail-${idx}`}
                    p1={{ x: prev.x, y: prev.y }}
                    p2={{ x: pt.x, y: pt.y }}
                    color="#ff3300"
                    strokeWidth={width}
                    opacity={opacity}
                  />
                );
              })}
              {!proj.trail && !proj.isExploded && (
                <Line
                  p1={{ x: proj.x, y: proj.y }}
                  p2={{ x: proj.x - proj.vx * 0.06, y: proj.y - proj.vy * 0.06 }}
                  color="#ff3300"
                  strokeWidth={3.5}
                  opacity={0.6}
                />
              )}
              {!proj.isExploded && <Circle cx={proj.x} cy={proj.y} r={3.5} color="#ffaa00" />}
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
          // Heavy Antimatter Missile: Crimson Red trail + glowing head
          return (
            <Group key={proj.id}>
              {proj.trail && proj.trail.map((pt, idx) => {
                if (idx === 0) return null;
                const prev = proj.trail[idx - 1];
                const progress = pt.life / 2.5;
                const opacity = progress * 0.8;
                const width = progress * 6.0;
                return (
                  <Line
                    key={`${proj.id}-trail-${idx}`}
                    p1={{ x: prev.x, y: prev.y }}
                    p2={{ x: pt.x, y: pt.y }}
                    color="#ff0055"
                    strokeWidth={width}
                    opacity={opacity}
                  />
                );
              })}
              {!proj.trail && !proj.isExploded && (
                <Line
                  p1={{ x: proj.x, y: proj.y }}
                  p2={{ x: proj.x - proj.vx * 0.06, y: proj.y - proj.vy * 0.06 }}
                  color="#ff0055"
                  strokeWidth={5.0}
                  opacity={0.7}
                />
              )}
              {!proj.isExploded && (
                <Group>
                  <Circle cx={proj.x} cy={proj.y} r={6} color="#ff0055" opacity={0.5} />
                  <Circle cx={proj.x} cy={proj.y} r={3} color="#ffffff" />
                </Group>
              )}
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
