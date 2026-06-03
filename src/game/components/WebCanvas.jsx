import React from 'react';
import { useGameStore } from '../../store/gameStore';
import WebBackground from './web/WebBackground';
import WebEarth from './web/WebEarth';
import WebShield from './web/WebShield';
import WebSatellites from './web/WebSatellites';
import WebFleet from './web/WebFleet';
import WebEnemies from './web/WebEnemies';
import WebProjectiles from './web/WebProjectiles';
import WebParticles from './web/WebParticles';
import WebChronoOverlay from './web/WebChronoOverlay';

export default function WebCanvas({ zoom, panX, panY }) {
  const { 
    fleet, 
    enemies, 
    projectiles, 
    particles, 
    earthShield, 
    earthMaxShield,
    earthHp,
    earthMaxHp,
    chronoMuteTimer,
    planets
  } = useGameStore();

  const EARTH_CENTER_X = 270;
  const EARTH_CENTER_Y = 270;
  const SHIELD_RADIUS = 100;
  const angles = [0, 180, 90, 270, 45, 225, 135, 315];

  const earthPlanet = planets ? planets.earth : null;
  const earthBases = [];
  if (earthPlanet && earthPlanet.groundBasesList) {
    Object.keys(earthPlanet.groundBasesList).forEach((type) => {
      const count = earthPlanet.groundBasesList[type] || 0;
      for (let i = 0; i < count; i++) {
        earthBases.push({ type, globalIndex: earthBases.length });
      }
    });
  }

  const earthSatellites = [];
  if (earthPlanet && earthPlanet.orbitalSatellitesList) {
    Object.keys(earthPlanet.orbitalSatellitesList).forEach((type) => {
      const count = earthPlanet.orbitalSatellitesList[type] || 0;
      for (let i = 0; i < count; i++) {
        earthSatellites.push({ type, globalIndex: earthSatellites.length });
      }
    });
  }

  const hpRatio = earthHp / earthMaxHp;
  const earthColor = `rgb(${Math.floor(13 + (1 - hpRatio) * 120)}, ${Math.floor(31 * hpRatio + 10)}, ${Math.floor(61 * hpRatio + 15)})`;

  const shieldRatio = Math.max(0, earthShield / earthMaxShield);
  const shieldColor = shieldRatio > 0 ? `rgba(0, 240, 255, ${0.1 + shieldRatio * 0.45})` : 'rgba(255, 0, 0, 0.05)';
  const shieldBorderColor = shieldRatio > 0 ? `rgba(0, 240, 255, ${0.4 + shieldRatio * 0.6})` : 'rgba(255, 0, 0, 0.15)';

  return (
    <svg viewBox="0 0 540 540" style={{ width: '100%', height: '100%' }}>
      <g transform={`translate(${panX + 270}, ${panY + 270}) scale(${zoom}) translate(-270, -270)`}>
        <WebBackground />
        
        <WebEarth 
          earthColor={earthColor} 
          earthBases={earthBases} 
          EARTH_CENTER_X={EARTH_CENTER_X} 
          EARTH_CENTER_Y={EARTH_CENTER_Y} 
          angles={angles} 
        />
        
        <WebShield 
          shieldColor={shieldColor} 
          shieldBorderColor={shieldBorderColor} 
          EARTH_CENTER_X={EARTH_CENTER_X} 
          EARTH_CENTER_Y={EARTH_CENTER_Y} 
          SHIELD_RADIUS={SHIELD_RADIUS} 
        />

        <WebSatellites 
          earthSatellites={earthSatellites} 
          EARTH_CENTER_X={EARTH_CENTER_X} 
          EARTH_CENTER_Y={EARTH_CENTER_Y} 
        />
        
        <WebFleet 
          fleet={fleet} 
          chronoMuteTimer={chronoMuteTimer} 
        />
        
        <WebEnemies 
          enemies={enemies} 
        />
        
        <WebProjectiles 
          projectiles={projectiles} 
        />
        
        <WebParticles 
          particles={particles} 
        />
        
        <WebChronoOverlay 
          chronoMuteTimer={chronoMuteTimer} 
        />
      </g>
    </svg>
  );
}
