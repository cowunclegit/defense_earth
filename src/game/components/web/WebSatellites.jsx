import React from 'react';
import { SATELLITE_SPECS, useGameStore } from '../../../store/gameStore';

export default function WebSatellites({ earthSatellites, EARTH_CENTER_X, EARTH_CENTER_Y }) {
  const satelliteRotation = useGameStore(state => state.satelliteRotation || 0);

  const currentRotation = satelliteRotation % 360;

  // Separate attack and defense satellites for angular spacing
  const attackSatellites = earthSatellites ? earthSatellites.filter(sat => SATELLITE_SPECS[sat.type]?.isWeapon) : [];
  const defenseSatellites = earthSatellites ? earthSatellites.filter(sat => !SATELLITE_SPECS[sat.type]?.isWeapon) : [];

  // Map elements with indices updated to reflect their respective orbit lists
  const processedSatellites = earthSatellites ? earthSatellites.map(sat => {
    const isWeapon = SATELLITE_SPECS[sat.type]?.isWeapon;
    const sameOrbitList = isWeapon ? attackSatellites : defenseSatellites;
    const localIndex = sameOrbitList.findIndex(s => s.globalIndex === sat.globalIndex);
    return {
      ...sat,
      localIndex: localIndex >= 0 ? localIndex : 0,
      isWeapon,
      sameOrbitList
    };
  }) : [];

  return (
    <>
      {/* Utility/Defense Orbit path line (Inner) */}
      <circle cx={EARTH_CENTER_X} cy={EARTH_CENTER_Y} r={120} fill="none" stroke="rgba(0, 240, 255, 0.12)" strokeWidth={1} strokeDasharray="4, 8" />
      {/* Weapon/Attack Orbit path line (Outer) */}
      <circle cx={EARTH_CENTER_X} cy={EARTH_CENTER_Y} r={145} fill="none" stroke="rgba(255, 59, 48, 0.15)" strokeWidth={1} strokeDasharray="4, 8" />

      {processedSatellites.map((sat, index) => {
        const baseAngle = (360 / Math.max(1, sat.sameOrbitList.length)) * sat.localIndex;
        const angleDeg = baseAngle + currentRotation;
        const angleRad = (angleDeg * Math.PI) / 180;
        
        const orbitRadius = sat.isWeapon ? 145 : 120;
        const satX = EARTH_CENTER_X + orbitRadius * Math.cos(angleRad);
        const satY = EARTH_CENTER_Y + orbitRadius * Math.sin(angleRad);

        let satColor = '#ffd700'; // default gold
        if (sat.type === 'laser') satColor = '#ff3b30';
        else if (sat.type === 'plasmaLaser') satColor = '#ff9500';
        else if (sat.type === 'emp') satColor = '#5ac8fa';
        else if (sat.type === 'clusterMissile') satColor = '#ffcc00';
        else if (sat.type === 'gravityBomb') satColor = '#af52de';
        else if (sat.type === 'antimatter') satColor = '#ff2d55';
        else if (sat.type === 'sensor') satColor = '#4cd964';
        else if (sat.type === 'forceShield') satColor = '#007aff';
        else if (sat.type === 'decoy') satColor = '#8e8e93';
        else if (sat.type === 'repairDrone') satColor = '#5856d6';

        return (
          <g key={`sat-web-${index}`} transform={`translate(${satX}, ${satY}) rotate(${angleDeg})`}>
            {/* Solar panels */}
            <rect x={-9} y={-1.5} width={6} height={3} fill="#00f0ff" stroke="#050814" strokeWidth={0.5} opacity={0.8} />
            <rect x={3} y={-1.5} width={6} height={3} fill="#00f0ff" stroke="#050814" strokeWidth={0.5} opacity={0.8} />
            {/* Satellite Body */}
            <rect x={-3} y={-3} width={6} height={6} fill={satColor} stroke="#050814" strokeWidth={1} />
          </g>
        );
      })}
    </>
  );
}
