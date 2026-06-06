import React from 'react';

let Group, Rect, Circle, Paint;
try {
  const Skia = require('@shopify/react-native-skia');
  Group = Skia.Group;
  Rect = Skia.Rect;
  Circle = Skia.Circle;
  Paint = Skia.Paint;
} catch (e) {}

import { SATELLITE_SPECS, useGameStore } from '../../../store/gameStore';

export default function SkiaSatellites({ earthSatellites, EARTH_CENTER_X, EARTH_CENTER_Y }) {
  const satelliteRotation = useGameStore(state => state.satelliteRotation || 0);

  if (!Group || !Rect || !Circle || !Paint) return null;

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
      <Circle cx={EARTH_CENTER_X} cy={EARTH_CENTER_Y} r={120} color="transparent">
        <Paint style="stroke" strokeWidth={1} color="rgba(0, 240, 255, 0.12)" />
      </Circle>
      {/* Weapon/Attack Orbit path line (Outer) */}
      <Circle cx={EARTH_CENTER_X} cy={EARTH_CENTER_Y} r={145} color="transparent">
        <Paint style="stroke" strokeWidth={1} color="rgba(255, 59, 48, 0.15)" />
      </Circle>

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
          <Group 
            key={`sat-skia-${index}`} 
            transform={[{ translateX: satX }, { translateY: satY }, { rotate: angleRad }]}
          >
            {/* Solar panels */}
            <Rect x={-9} y={-1.5} width={6} height={3} color="rgba(0, 240, 255, 0.8)" />
            <Rect x={3} y={-1.5} width={6} height={3} color="rgba(0, 240, 255, 0.8)" />
            {/* Satellite Body */}
            <Rect x={-3} y={-3} width={6} height={6} color={satColor} />
          </Group>
        );
      })}
    </>
  );
}
