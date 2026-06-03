import React from 'react';

let Circle, Line, Group;
try {
  const Skia = require('@shopify/react-native-skia');
  Circle = Skia.Circle;
  Line = Skia.Line;
  Group = Skia.Group;
} catch (e) {}

export default function SkiaEarth({ earthColor, earthBases, EARTH_CENTER_X, EARTH_CENTER_Y, angles }) {
  if (!Circle || !Line || !Group) return null;
  return (
    <>
      <Circle cx={EARTH_CENTER_X} cy={EARTH_CENTER_Y} r={80} color={earthColor} />
      <Circle cx={EARTH_CENTER_X} cy={EARTH_CENTER_Y} r={80} color="rgba(0, 240, 255, 0.08)" />

      {/* 지구 표면 지상 기지 시각화 */}
      {earthBases.map((base) => {
        const angleDeg = angles[base.globalIndex % angles.length];
        const angleRad = (angleDeg * Math.PI) / 180;
        const baseX = EARTH_CENTER_X + 80 * Math.cos(angleRad);
        const baseY = EARTH_CENTER_Y + 80 * Math.sin(angleRad);
        const barrelX = EARTH_CENTER_X + 89 * Math.cos(angleRad);
        const barrelY = EARTH_CENTER_Y + 89 * Math.sin(angleRad);

        let baseColor = '#ffd700';
        if (base.type === 'railgun') baseColor = '#ff5500';
        else if (base.type === 'energyCannon') baseColor = '#00f0ff';
        else if (base.type === 'missileSilo') baseColor = '#ffaa00';
        else if (base.type === 'plasmaBomber') baseColor = '#941aff';
        else if (base.type === 'electricTurret') baseColor = '#bf5cff';
        else if (base.type === 'sniperCannon') baseColor = '#33ff33';
        else if (base.type === 'gatling') baseColor = '#ffcc00';
        else if (base.type === 'nuclearTorpedo') baseColor = '#ff0000';
        else if (base.type === 'ciws') baseColor = '#ffffff';
        else if (base.type === 'forceShield') baseColor = '#00aaff';
        else if (base.type === 'armor') baseColor = '#8a8a8a';

        return (
          <Group key={`base-skia-${base.globalIndex}`}>
            <Line p1={{ x: baseX, y: baseY }} p2={{ x: barrelX, y: barrelY }} color={baseColor} strokeWidth={2.5} />
            <Circle cx={baseX} cy={baseY} r={4.5} color={baseColor} />
          </Group>
        );
      })}
    </>
  );
}
