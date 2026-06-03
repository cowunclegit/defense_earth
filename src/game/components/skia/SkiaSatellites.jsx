import React from 'react';

let Group, Rect, Circle, Paint;
try {
  const Skia = require('@shopify/react-native-skia');
  Group = Skia.Group;
  Rect = Skia.Rect;
  Circle = Skia.Circle;
  Paint = Skia.Paint;
} catch (e) {}

import { useGameStore } from '../../../store/gameStore';

export default function SkiaSatellites({ earthSatellites, EARTH_CENTER_X, EARTH_CENTER_Y }) {
  const satelliteRotation = useGameStore(state => state.satelliteRotation || 0);

  if (!Group || !Rect || !Circle || !Paint) return null;
  if (!earthSatellites || earthSatellites.length === 0) return null;

  const currentRotation = satelliteRotation % 360;

  return (
    <>
      {/* Orbit path line */}
      <Circle cx={EARTH_CENTER_X} cy={EARTH_CENTER_Y} r={125} color="transparent">
        <Paint style="stroke" strokeWidth={1} color="rgba(0, 240, 255, 0.15)" />
      </Circle>

      {earthSatellites.map((sat, index) => {
        const baseAngle = (360 / earthSatellites.length) * index;
        const angleDeg = baseAngle + currentRotation;
        const angleRad = (angleDeg * Math.PI) / 180;
        
        const orbitRadius = 125;
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
