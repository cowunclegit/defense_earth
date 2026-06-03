import React from 'react';
import { SHIP_TYPES } from '../../../store/gameStore';

export default function WebFleet({ fleet, chronoMuteTimer }) {
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
          <g key={ship.id}>
            <circle cx={ship.x} cy={ship.y} r={shipSize} fill={shipColor} />
            <circle cx={ship.x} cy={ship.y} r={shipSize + 3} fill="transparent" stroke="rgba(255, 255, 255, 0.25)" strokeWidth={0.5} />
          </g>
        );
      })}
    </>
  );
}
