import React from 'react';

export default function WebShield({ shieldColor, shieldBorderColor, EARTH_CENTER_X, EARTH_CENTER_Y, SHIELD_RADIUS }) {
  return (
    <>
      <circle cx={EARTH_CENTER_X} cy={EARTH_CENTER_Y} r={SHIELD_RADIUS} fill={shieldColor} stroke={shieldBorderColor} strokeWidth={2.2} strokeDasharray="10, 6" />
      <circle cx={EARTH_CENTER_X} cy={EARTH_CENTER_Y} r={SHIELD_RADIUS + 4} fill="transparent" stroke={shieldBorderColor} strokeWidth={0.8} strokeDasharray="40, 10" />
    </>
  );
}
