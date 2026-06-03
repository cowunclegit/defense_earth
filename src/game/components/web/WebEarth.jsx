import React from 'react';

export default function WebEarth({ earthColor, earthBases, EARTH_CENTER_X, EARTH_CENTER_Y, angles }) {
  return (
    <>
      <circle cx={EARTH_CENTER_X} cy={EARTH_CENTER_Y} r={80} fill={earthColor} />
      <circle cx={EARTH_CENTER_X} cy={EARTH_CENTER_Y} r={80} fill="rgba(0, 240, 255, 0.08)" />
      <circle cx={EARTH_CENTER_X} cy={EARTH_CENTER_Y} r={80} fill="transparent" stroke="#00f0ff" strokeWidth={1.5} opacity={0.5} />

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
          <g key={`base-web-${base.globalIndex}`}>
            <line x1={baseX} y1={baseY} x2={barrelX} y2={barrelY} stroke={baseColor} strokeWidth={2.5} />
            <circle cx={baseX} cy={baseY} r={4.5} fill={baseColor} stroke="#050814" strokeWidth={1} />
          </g>
        );
      })}
    </>
  );
}
