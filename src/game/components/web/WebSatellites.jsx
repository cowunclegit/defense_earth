import React from 'react';
import { SATELLITE_SPECS } from '../../../store/gameStore';

export default function WebSatellites({ earthSatellites, EARTH_CENTER_X, EARTH_CENTER_Y }) {
  const [time, setTime] = React.useState(Date.now());

  React.useEffect(() => {
    let animId;
    const update = () => {
      setTime(Date.now());
      animId = requestAnimationFrame(update);
    };
    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, []);

  if (!earthSatellites || earthSatellites.length === 0) return null;

  const rotationSpeed = 0.015; // degrees per millisecond
  const currentRotation = (time * rotationSpeed) % 360;

  return (
    <>
      {/* Orbit path line */}
      <circle cx={EARTH_CENTER_X} cy={EARTH_CENTER_Y} r={125} fill="none" stroke="rgba(0, 240, 255, 0.15)" strokeWidth={1} strokeDasharray="4, 8" />

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
