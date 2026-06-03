import React from 'react';
import { SHIP_TYPES } from '../../../store/gameStore';

let Group, Circle, Paint;
try {
  const Skia = require('@shopify/react-native-skia');
  Group = Skia.Group;
  Circle = Skia.Circle;
  Paint = Skia.Paint;
} catch (e) {}

export default function SkiaFleet({ fleet, chronoMuteTimer }) {
  if (!Group || !Circle || !Paint) return null;
  return (
    <>
      {fleet.map((ship) => {
        let shipColor = chronoMuteTimer > 0 ? '#8a8a8a' : '#00ff8a';
        let shipSize = 4;
        if (ship.type === SHIP_TYPES.ESCORT) {
          shipColor = chronoMuteTimer > 0 ? '#636e85' : '#1e56ff';
          shipSize = 6;
        } else if (ship.type === SHIP_TYPES.DESTROYER) {
          shipColor = chronoMuteTimer > 0 ? '#7a5a8f' : '#bf5cff';
          shipSize = 9;
        }

        return (
          <Group key={ship.id}>
            <Circle cx={ship.x} cy={ship.y} r={shipSize} color={shipColor} />
            <Circle cx={ship.x} cy={ship.y} r={shipSize + 3} color="transparent">
              <Paint style="stroke" strokeWidth={0.5} color="rgba(255, 255, 255, 0.25)" />
            </Circle>
          </Group>
        );
      })}
    </>
  );
}
