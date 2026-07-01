import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { getOrderedBuiltSatellites } from '../../store/gameSpecs';
import WebBackground from './web/WebBackground';
import WebEarth from './web/WebEarth';
import WebShield from './web/WebShield';
import WebSatellites from './web/WebSatellites';
import WebFleet from './web/WebFleet';
import WebEnemies from './web/WebEnemies';
import WebProjectiles from './web/WebProjectiles';
import WebParticles from './web/WebParticles';
import WebChronoOverlay from './web/WebChronoOverlay';

const EMPTY_BASES = [];

export default function WebCanvas({ zoom, panX, panY }) {

  const fleet = useGameStore(state => state.fleet);
  const enemies = useGameStore(state => state.enemies);
  const projectiles = useGameStore(state => state.projectiles);
  const particles = useGameStore(state => state.particles);
  const earthShield = useGameStore(state => state.earthShield);
  const earthMaxShield = useGameStore(state => state.earthMaxShield);
  const earthHp = useGameStore(state => state.earthHp);
  const earthMaxHp = useGameStore(state => state.earthMaxHp);
  const chronoMuteTimer = useGameStore(state => state.chronoMuteTimer);
  const isPowerOffline = useGameStore(state => state.isPowerOffline);
  const onlineSatelliteCount = useGameStore(state => state.onlineSatelliteCount);
  const counterattackModules = useGameStore(state => state.counterattackModules);
  const overloadEnergy = useGameStore(state => state.overloadEnergy);
  const satelliteRotation = useGameStore(state => state.satelliteRotation);
  const dischargeTimer = useGameStore(state => state.dischargeTimer);
  const floatingTexts = useGameStore(state => state.floatingTexts || []);
  
  const isElectricFieldActive = counterattackModules?.electricField && earthShield > 0 && (overloadEnergy || 0) > 0;
  
  // Select serialized planets configuration to prevent re-renders when other planet fields change (e.g. population, terraform progress)
  const planetsConfigStr = useGameStore(state => {
    if (!state.planets) return '';
    const config = {};
    Object.keys(state.planets).forEach(pId => {
      config[pId] = {
        unlocked: state.planets[pId].unlocked,
        orbitalSatellitesList: state.planets[pId].orbitalSatellitesList
      };
    });
    return JSON.stringify(config);
  });

  const EARTH_CENTER_X = 270;
  const EARTH_CENTER_Y = 270;
  const SHIELD_RADIUS = 100;
  const angles = [0, 180, 90, 270, 45, 225, 135, 315];

  // Memoize earthSatellites so it doesn't re-allocate or trigger updates unnecessarily
  const earthSatellites = React.useMemo(() => {
    if (!planetsConfigStr) return [];
    const planets = JSON.parse(planetsConfigStr);
    const earthPlanet = planets.earth;
    const builtSats = getOrderedBuiltSatellites(planets);
    const activeLimit = isPowerOffline ? (onlineSatelliteCount || 0) : builtSats.length;

    const activeSatsMap = {};
    Object.keys(planets).forEach(pId => {
      activeSatsMap[pId] = {};
    });

    for (let i = 0; i < Math.min(activeLimit, builtSats.length); i++) {
      const sat = builtSats[i];
      if (sat && activeSatsMap[sat.planetId]) {
        if (!activeSatsMap[sat.planetId][sat.type]) {
          activeSatsMap[sat.planetId][sat.type] = 0;
        }
        activeSatsMap[sat.planetId][sat.type]++;
      }
    }

    const satellitesList = [];
    const typeCounters = {};
    if (earthPlanet && earthPlanet.orbitalSatellitesList) {
      Object.keys(earthPlanet.orbitalSatellitesList).forEach((type) => {
        const count = earthPlanet.orbitalSatellitesList[type] || 0;
        for (let i = 0; i < count; i++) {
          const activeCount = activeSatsMap.earth?.[type] || 0;
          const currentInstanceIndex = typeCounters[type] || 0;
          typeCounters[type] = currentInstanceIndex + 1;

          const isOnline = currentInstanceIndex < activeCount;
          satellitesList.push({ 
            type, 
            globalIndex: satellitesList.length,
            isOnline
          });
        }
      });
    }
    return satellitesList;
  }, [planetsConfigStr, isPowerOffline, onlineSatelliteCount]);


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
          earthBases={EMPTY_BASES} 
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
          isElectricFieldActive={isElectricFieldActive}
          satelliteRotation={satelliteRotation}
        />

        {dischargeTimer > 0 && counterattackModules?.discharge && (
          <text
            x={EARTH_CENTER_X}
            y={EARTH_CENTER_Y + 55}
            textAnchor="middle"
            fill="#00f0ff"
            fontSize={11}
            fontWeight="bold"
            style={{
              textShadow: '0 0 4px rgba(0, 240, 255, 0.7)',
              fontFamily: 'monospace'
            }}
          >
            ⚡ 과부하 방전: {dischargeTimer.toFixed(1)}초
          </text>
        )}

        {/* Floating Combat Texts (RPG Damage Popups) */}
        {floatingTexts.map(ft => (
          <text
            key={ft.id}
            x={ft.x}
            y={ft.y}
            fill={ft.color}
            fontSize={10}
            fontWeight="bold"
            opacity={ft.alpha}
            textAnchor="middle"
            style={{
              fontFamily: 'monospace',
              textShadow: '0 0 3px rgba(0,0,0,0.8)'
            }}
          >
            {ft.text}
          </text>
        ))}

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
