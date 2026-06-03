import React from 'react';
import { StyleSheet } from 'react-native';
import { useGameStore } from '../../store/gameStore';
import SkiaBackground from './skia/SkiaBackground';
import SkiaEarth from './skia/SkiaEarth';
import SkiaShield from './skia/SkiaShield';
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

  const hpRatio = earthHp / earthMaxHp;
  const earthColor = `rgb(${Math.floor(13 + (1 - hpRatio) * 120)}, ${Math.floor(31 * hpRatio + 10)}, ${Math.floor(61 * hpRatio + 15)})`;

  const shieldRatio = Math.max(0, earthShield / earthMaxShield);
  const shieldColor = shieldRatio > 0 ? `rgba(0, 240, 255, ${0.1 + shieldRatio * 0.45})` : 'rgba(255, 0, 0, 0.05)';
  const shieldBorderColor = shieldRatio > 0 ? `rgba(0, 240, 255, ${0.4 + shieldRatio * 0.6})` : 'rgba(255, 0, 0, 0.15)';

  if (!Canvas) return null;

  const scaleFactor = canvasSize / 540;

  return (
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
  );
}

const styles = StyleSheet.create({
  skiaCanvas: {
    flex: 1,
  }
});
