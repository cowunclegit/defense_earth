import React, { memo } from 'react';

const WebShield = memo(function WebShield({
  shieldColor,
  shieldBorderColor,
  EARTH_CENTER_X,
  EARTH_CENTER_Y,
  SHIELD_RADIUS,
  isElectricFieldActive,
  satelliteRotation
}) {
  const rotationDeg = satelliteRotation || 0;
  const pulseFactor = 1 + 0.03 * Math.sin((rotationDeg * Math.PI) / 90);
  const auraRadius = 250 * pulseFactor;

  return (
    <>
      <circle cx={EARTH_CENTER_X} cy={EARTH_CENTER_Y} r={SHIELD_RADIUS} fill={shieldColor} stroke={shieldBorderColor} strokeWidth={2.2} strokeDasharray="10, 6" />
      <circle cx={EARTH_CENTER_X} cy={EARTH_CENTER_Y} r={SHIELD_RADIUS + 4} fill="transparent" stroke={shieldBorderColor} strokeWidth={0.8} strokeDasharray="40, 10" />

      {isElectricFieldActive && (
        <g>
          {/* Outer pulsing dashed boundary ring */}
          <circle
            cx={EARTH_CENTER_X}
            cy={EARTH_CENTER_Y}
            r={auraRadius}
            fill="rgba(0, 240, 255, 0.02)"
            stroke="rgba(0, 240, 255, 0.55)"
            strokeWidth={1.5}
            strokeDasharray="8, 6"
            transform={`rotate(${rotationDeg} ${EARTH_CENTER_X} ${EARTH_CENTER_Y})`}
          />
          {/* Inner thicker cyan glow ring */}
          <circle
            cx={EARTH_CENTER_X}
            cy={EARTH_CENTER_Y}
            r={auraRadius}
            fill="transparent"
            stroke="rgba(0, 240, 255, 0.15)"
            strokeWidth={5}
          />
        </g>
      )}
    </>
  );
});

export default WebShield;

