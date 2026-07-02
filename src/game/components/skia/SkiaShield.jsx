import React from 'react';
import { Circle, Paint, Group } from '@shopify/react-native-skia';

export default function SkiaShield({
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
      <Circle cx={EARTH_CENTER_X} cy={EARTH_CENTER_Y} r={SHIELD_RADIUS} color={shieldColor} />
      <Circle cx={EARTH_CENTER_X} cy={EARTH_CENTER_Y} r={SHIELD_RADIUS} color="transparent">
        <Paint style="stroke" strokeWidth={2.2} color={shieldBorderColor} />
      </Circle>
      <Circle cx={EARTH_CENTER_X} cy={EARTH_CENTER_Y} r={SHIELD_RADIUS + 4} color="transparent">
        <Paint style="stroke" strokeWidth={0.8} color={shieldBorderColor} />
      </Circle>

      {isElectricFieldActive && (
        <Group>
          {/* Outer pulsing rotated boundary ring */}
          <Group origin={{ x: EARTH_CENTER_X, y: EARTH_CENTER_Y }} transform={[{ rotate: (rotationDeg * Math.PI) / 180 }]}>
              <Circle cx={EARTH_CENTER_X} cy={EARTH_CENTER_Y} r={auraRadius} color="rgba(0, 240, 255, 0.02)" />
              <Circle cx={EARTH_CENTER_X} cy={EARTH_CENTER_Y} r={auraRadius} color="transparent">
                <Paint style="stroke" strokeWidth={1.5} color="rgba(0, 240, 255, 0.55)" />
              </Circle>
            </Group>
          

          {/* Inner thicker cyan glow ring */}
          <Circle cx={EARTH_CENTER_X} cy={EARTH_CENTER_Y} r={auraRadius} color="transparent">
            <Paint style="stroke" strokeWidth={5} color="rgba(0, 240, 255, 0.15)" />
          </Circle>
        </Group>
      )}
    </>
  );
}
