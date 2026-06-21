import React, { memo } from 'react';
import { SHIP_TYPES } from '../../../store/gameStore';

const SHIP_VISUALS = {
  [SHIP_TYPES.INTERCEPTOR]: { color: '#00ff8a', size: 4, muteColor: '#8a8a8a' },     // Neon Green
  [SHIP_TYPES.ESCORT]: { color: '#1e56ff', size: 6, muteColor: '#636e85' },          // Blue
  [SHIP_TYPES.DESTROYER]: { color: '#bf5cff', size: 9, muteColor: '#7a5a8f' },       // Purple
  [SHIP_TYPES.CRUISER]: { color: '#ff8a00', size: 8, muteColor: '#8c593b' },         // Orange
  [SHIP_TYPES.STEALTH]: { color: '#00f0ff', size: 5, muteColor: '#517478' },         // Cyan
  [SHIP_TYPES.ION_BATTLESHIP]: { color: '#ff3b30', size: 11, muteColor: '#8c3d3d' },  // Red
  [SHIP_TYPES.SHIELD_CARRIER]: { color: '#00d8ff', size: 10, muteColor: '#3d838c' },  // Sky Blue
  [SHIP_TYPES.REPAIR_SHIP]: { color: '#00ffcc', size: 7, muteColor: '#488c67' },     // Turquoise
  [SHIP_TYPES.BARRIER_SHIP]: { color: '#ffd700', size: 8, muteColor: '#8c8038' }      // Gold
};

const WebFleet = memo(function WebFleet({ fleet, chronoMuteTimer }) {
  return (
    <>
      {fleet.map((ship) => {
        const visual = SHIP_VISUALS[ship.type] || { color: '#00ff8a', size: 4, muteColor: '#8a8a8a' };
        const shipColor = chronoMuteTimer > 0 ? visual.muteColor : visual.color;
        const shipSize = visual.size;

        return (
          <g key={ship.id}>
            <circle cx={ship.x} cy={ship.y} r={shipSize} fill={shipColor} />
            <circle cx={ship.x} cy={ship.y} r={shipSize + 3} fill="transparent" stroke="rgba(255, 255, 255, 0.25)" strokeWidth={0.5} />
          </g>
        );
      })}
    </>
  );
});

export default WebFleet;

