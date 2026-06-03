import React from 'react';

let Circle, Paint;
try {
  const Skia = require('@shopify/react-native-skia');
  Circle = Skia.Circle;
  Paint = Skia.Paint;
} catch (e) {}

export default function SkiaShield({ shieldColor, shieldBorderColor, EARTH_CENTER_X, EARTH_CENTER_Y, SHIELD_RADIUS }) {
  if (!Circle || !Paint) return null;
  return (
    <>
      <Circle cx={EARTH_CENTER_X} cy={EARTH_CENTER_Y} r={SHIELD_RADIUS} color={shieldColor} />
      <Circle cx={EARTH_CENTER_X} cy={EARTH_CENTER_Y} r={SHIELD_RADIUS} color="transparent">
        <Paint style="stroke" strokeWidth={2.2} color={shieldBorderColor} />
      </Circle>
      <Circle cx={EARTH_CENTER_X} cy={EARTH_CENTER_Y} r={SHIELD_RADIUS + 4} color="transparent">
        <Paint style="stroke" strokeWidth={0.8} color={shieldBorderColor} />
      </Circle>
    </>
  );
}
