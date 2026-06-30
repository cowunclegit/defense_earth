import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useGameStore } from '../../store/gameStore';
import { getOrderedBuiltSatellites } from '../../store/gameSpecs';
import SkiaBackground from './skia/SkiaBackground';
import SkiaEarth from './skia/SkiaEarth';
import SkiaShield from './skia/SkiaShield';
import SkiaSatellites from './skia/SkiaSatellites';
import SkiaFleet from './skia/SkiaFleet';
import SkiaEnemies from './skia/SkiaEnemies';
import SkiaProjectiles from './skia/SkiaProjectiles';
import SkiaParticles from './skia/SkiaParticles';
import SkiaChronoOverlay from './skia/SkiaChronoOverlay';

let Canvas, Group;
try {
  const Skia = require('@shopify/react-native-skia');
  Canvas = Skia.Canvas;
  Group = Skia.Group;
} catch (e) {
  // Silent warning for Web
}

export default function SkiaCanvas({ canvasSize, zoom, panX, panY }) {
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
    planets,
    isPowerOffline,
    onlineSatelliteCount,
    counterattackModules,
    overloadEnergy,
    satelliteRotation,
    dischargeTimer
  } = useGameStore();

  const isElectricFieldActive = counterattackModules?.electricField && earthShield > 0 && (overloadEnergy || 0) > 0;

  const EARTH_CENTER_X = 270;
  const EARTH_CENTER_Y = 270;
  const SHIELD_RADIUS = 100;
  const angles = [0, 180, 90, 270, 45, 225, 135, 315];

  const earthPlanet = planets ? planets.earth : null;
  const earthBases = [];

  // Calculate active satellites map using getOrderedBuiltSatellites
  const builtSats = getOrderedBuiltSatellites(planets);
  const activeLimit = isPowerOffline ? (onlineSatelliteCount || 0) : builtSats.length;

  const activeSatsMap = {};
  Object.keys(planets || {}).forEach(pId => {
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

  const earthSatellites = [];
  const typeCounters = {};
  if (earthPlanet && earthPlanet.orbitalSatellitesList) {
    Object.keys(earthPlanet.orbitalSatellitesList).forEach((type) => {
      const count = earthPlanet.orbitalSatellitesList[type] || 0;
      for (let i = 0; i < count; i++) {
        const activeCount = activeSatsMap.earth?.[type] || 0;
        const currentInstanceIndex = typeCounters[type] || 0;
        typeCounters[type] = currentInstanceIndex + 1;

        const isOnline = currentInstanceIndex < activeCount;
        earthSatellites.push({ 
          type, 
          globalIndex: earthSatellites.length,
          isOnline
        });
      }
    });
  }

  const hpRatio = earthHp / earthMaxHp;
  const earthColor = `rgb(${Math.floor(13 + (1 - hpRatio) * 120)}, ${Math.floor(31 * hpRatio + 10)}, ${Math.floor(61 * hpRatio + 15)})`;

  const shieldRatio = Math.max(0, earthShield / earthMaxShield);
  const shieldColor = shieldRatio > 0 ? `rgba(0, 240, 255, ${0.1 + shieldRatio * 0.45})` : 'rgba(255, 0, 0, 0.05)';
  const shieldBorderColor = shieldRatio > 0 ? `rgba(0, 240, 255, ${0.4 + shieldRatio * 0.6})` : 'rgba(255, 0, 0, 0.15)';

  if (!Canvas) return null;

  const scaleFactor = canvasSize / 540;

  return (
    <View style={styles.container}>
      <Canvas style={styles.skiaCanvas}>
      <Group transform={[{ scale: scaleFactor }]}>
        <Group transform={[{ translateX: panX + 270 }, { translateY: panY + 270 }, { scale: zoom }, { translateX: -270 }, { translateY: -270 }]}>
          <SkiaBackground />
          
          <SkiaEarth 
            earthColor={earthColor} 
            earthBases={earthBases} 
            EARTH_CENTER_X={EARTH_CENTER_X} 
            EARTH_CENTER_Y={EARTH_CENTER_Y} 
            angles={angles} 
          />
          
          <SkiaShield 
            shieldColor={shieldColor} 
            shieldBorderColor={shieldBorderColor} 
            EARTH_CENTER_X={EARTH_CENTER_X} 
            EARTH_CENTER_Y={EARTH_CENTER_Y} 
            SHIELD_RADIUS={SHIELD_RADIUS} 
            isElectricFieldActive={isElectricFieldActive}
            satelliteRotation={satelliteRotation}
          />

          <SkiaSatellites 
            earthSatellites={earthSatellites} 
            EARTH_CENTER_X={EARTH_CENTER_X} 
            EARTH_CENTER_Y={EARTH_CENTER_Y} 
          />
          
          <SkiaFleet 
            fleet={fleet} 
            chronoMuteTimer={chronoMuteTimer} 
          />
          
          <SkiaEnemies 
            enemies={enemies} 
          />
          
          <SkiaProjectiles 
            projectiles={projectiles} 
          />
          
          <SkiaParticles 
            particles={particles} 
          />
          
          <SkiaChronoOverlay 
            chronoMuteTimer={chronoMuteTimer} 
          />
        </Group>
      </Group>
      </Canvas>
      {dischargeTimer > 0 && counterattackModules?.discharge && (
        <View 
          style={[
            styles.cooldownOverlay, 
            { 
              left: EARTH_CENTER_X + panX - 100, // Center of overlay on Earth
              top: 55 * zoom + EARTH_CENTER_Y + panY, // Dynamically tracks Earth Y position under zoom/pan
            }
          ]}
        >
          <Text style={[styles.cooldownText, { fontSize: Math.max(7, 10 * zoom) }]}>
            ⚡ 과부하 방전: {dischargeTimer.toFixed(1)}초
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skiaCanvas: {
    flex: 1,
  },
  cooldownOverlay: {
    position: 'absolute',
    width: 200,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none'
  },
  cooldownText: {
    color: '#00f0ff',
    fontWeight: 'bold',
    fontFamily: 'monospace',
    textShadowColor: 'rgba(0, 240, 255, 0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  }
});
