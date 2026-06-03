import React from 'react';
import { StyleSheet } from 'react-native';
import { useGameStore, SHIP_TYPES } from '../../store/gameStore';

let Canvas, Circle, Rect, Group, Line, Paint;
try {
  const Skia = require('@shopify/react-native-skia');
  Canvas = Skia.Canvas;
  Circle = Skia.Circle;
  Rect = Skia.Rect;
  Group = Skia.Group;
  Line = Skia.Line;
  Paint = Skia.Paint;
} catch (e) {
  // Silent warning for Web/environments without Skia loaded
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
          {/* 심연의 우주배경 그리드 세로선/가로선 */}
          <Line p1={{ x: 90, y: 0 }} p2={{ x: 90, y: 540 }} color="rgba(0, 240, 255, 0.08)" strokeWidth={1} />
          <Line p1={{ x: 180, y: 0 }} p2={{ x: 180, y: 540 }} color="rgba(0, 240, 255, 0.08)" strokeWidth={1} />
          <Line p1={{ x: 270, y: 0 }} p2={{ x: 270, y: 540 }} color="rgba(0, 240, 255, 0.08)" strokeWidth={1} />
          <Line p1={{ x: 360, y: 0 }} p2={{ x: 360, y: 540 }} color="rgba(0, 240, 255, 0.08)" strokeWidth={1} />
          <Line p1={{ x: 450, y: 0 }} p2={{ x: 450, y: 540 }} color="rgba(0, 240, 255, 0.08)" strokeWidth={1} />
          <Line p1={{ x: 0, y: 90 }} p2={{ x: 540, y: 90 }} color="rgba(0, 240, 255, 0.08)" strokeWidth={1} />
          <Line p1={{ x: 0, y: 180 }} p2={{ x: 540, y: 180 }} color="rgba(0, 240, 255, 0.08)" strokeWidth={1} />
          <Line p1={{ x: 0, y: 270 }} p2={{ x: 540, y: 270 }} color="rgba(0, 240, 255, 0.08)" strokeWidth={1} />
          <Line p1={{ x: 0, y: 360 }} p2={{ x: 540, y: 360 }} color="rgba(0, 240, 255, 0.08)" strokeWidth={1} />
          <Line p1={{ x: 0, y: 450 }} p2={{ x: 540, y: 450 }} color="rgba(0, 240, 255, 0.08)" strokeWidth={1} />

          {/* 세로 골든 스타 트랙 */}
          <Line p1={{ x: 45, y: 0 }} p2={{ x: 45, y: 540 }} color="rgba(255, 215, 0, 0.12)" strokeWidth={1} />
          <Line p1={{ x: 135, y: 0 }} p2={{ x: 135, y: 540 }} color="rgba(255, 215, 0, 0.12)" strokeWidth={1} />
          <Line p1={{ x: 225, y: 0 }} p2={{ x: 225, y: 540 }} color="rgba(255, 215, 0, 0.12)" strokeWidth={1} />
          <Line p1={{ x: 315, y: 0 }} p2={{ x: 315, y: 540 }} color="rgba(255, 215, 0, 0.12)" strokeWidth={1} />
          <Line p1={{ x: 405, y: 0 }} p2={{ x: 405, y: 540 }} color="rgba(255, 215, 0, 0.12)" strokeWidth={1} />
          <Line p1={{ x: 495, y: 0 }} p2={{ x: 495, y: 540 }} color="rgba(255, 215, 0, 0.12)" strokeWidth={1} />

          {/* 1. 지구 본체 렌더링 */}
          <Circle cx={EARTH_CENTER_X} cy={EARTH_CENTER_Y} r={80} color={earthColor} />
          <Circle cx={EARTH_CENTER_X} cy={EARTH_CENTER_Y} r={80} color="rgba(0, 240, 255, 0.08)" />

          {/* 지구 표면 지상 기지 시각화 */}
          {earthBases.map((base) => {
            const angleDeg = angles[base.globalIndex % angles.length];
            const angleRad = (angleDeg * Math.PI) / 180;
            const baseX = EARTH_CENTER_X + 80 * Math.cos(angleRad);
            const baseY = EARTH_CENTER_Y + 80 * Math.sin(angleRad);
            const barrelX = EARTH_CENTER_X + 89 * Math.cos(angleRad);
            const barrelY = EARTH_CENTER_Y + 89 * Math.sin(angleRad);

            let baseColor = '#ffd700';
            if (base.type === 'railgun') baseColor = '#ff5500';
            else if (base.type === 'energyCannon') baseColor = '#00f0ff';
            else if (base.type === 'missileSilo') baseColor = '#ffaa00';
            else if (base.type === 'plasmaBomber') baseColor = '#941aff';
            else if (base.type === 'electricTurret') baseColor = '#bf5cff';
            else if (base.type === 'sniperCannon') baseColor = '#33ff33';
            else if (base.type === 'gatling') baseColor = '#ffcc00';
            else if (base.type === 'nuclearTorpedo') baseColor = '#ff0000';
            else if (base.type === 'ciws') baseColor = '#ffffff';
            else if (base.type === 'forceShield') baseColor = '#00aaff';
            else if (base.type === 'armor') baseColor = '#8a8a8a';

            return (
              <Group key={`base-skia-${base.globalIndex}`}>
                <Line p1={{ x: baseX, y: baseY }} p2={{ x: barrelX, y: barrelY }} color={baseColor} strokeWidth={2.5} />
                <Circle cx={baseX} cy={baseY} r={4.5} color={baseColor} />
              </Group>
            );
          })}

          {/* 2. 이원화 에너지 실드 아크 */}
          <Circle cx={EARTH_CENTER_X} cy={EARTH_CENTER_Y} r={SHIELD_RADIUS} color={shieldColor} />
          <Circle cx={EARTH_CENTER_X} cy={EARTH_CENTER_Y} r={SHIELD_RADIUS} color="transparent">
            <Paint style="stroke" strokeWidth={2.2} color={shieldBorderColor} />
          </Circle>
          <Circle cx={EARTH_CENTER_X} cy={EARTH_CENTER_Y} r={SHIELD_RADIUS + 4} color="transparent">
            <Paint style="stroke" strokeWidth={0.8} color={shieldBorderColor} />
          </Circle>

          {/* 3. 아군 궤도 기동대 */}
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
              <Group key={ship.id}>
                <Circle cx={ship.x} cy={ship.y} r={shipSize} color={shipColor} />
                <Circle cx={ship.x} cy={ship.y} r={shipSize + 3} color="transparent">
                  <Paint style="stroke" strokeWidth={0.5} color="rgba(255, 255, 255, 0.25)" />
                </Circle>
              </Group>
            );
          })}

          {/* 4. 적 외계인 함대 및 거대 보스 */}
          {enemies.map((enemy) => {
            let enemyColor = '#ff3b30';
            let isBoss = false;
            let w = 8;
            let h = 8;

            if (enemy.type === 'raider') {
              enemyColor = '#ff8a00';
              w = 12;
              h = 12;
            } else if (enemy.type === 'destroyer') {
              enemyColor = '#de3bff';
              w = 18;
              h = 18;
            } else if (enemy.type === 'boss_apocalypse') {
              enemyColor = '#ff1a1a';
              isBoss = true;
              w = 42;
              h = 24;
            } else if (enemy.type === 'boss_chrono') {
              enemyColor = '#941aff';
              isBoss = true;
              w = 34;
              h = 34;
            }

            return (
              <Group key={enemy.id}>
                <Rect x={enemy.x - w / 2} y={enemy.y - h / 2} width={w} height={h} color={enemyColor} />
                {isBoss && (
                  <Circle cx={enemy.x} cy={enemy.y} r={Math.max(w, h) * 0.7} color="transparent">
                    <Paint style="stroke" strokeWidth={1} color={enemyColor} />
                  </Circle>
                )}
                <Line p1={{ x: enemy.x - w / 2, y: enemy.y - h / 2 - 5 }} p2={{ x: enemy.x + w / 2, y: enemy.y - h / 2 - 5 }} color="rgba(255, 255, 255, 0.25)" strokeWidth={2} />
                <Line p1={{ x: enemy.x - w / 2, y: enemy.y - h / 2 - 5 }} p2={{ x: enemy.x - w / 2 + w * (enemy.hp / enemy.maxHp), y: enemy.y - h / 2 - 5 }} color={isBoss ? '#ffd700' : '#00ff8a'} strokeWidth={2} />
              </Group>
            );
          })}

          {/* 5. 실시간 투사체 */}
          {projectiles.map((proj) => {
            if (proj.type === 'energy') {
              const dx = proj.vx * 0.05;
              const dy = proj.vy * 0.05;
              const color = proj.color || (proj.isEnemy ? '#00f0ff' : '#ff5500');
              return (
                <Group key={proj.id}>
                  <Line p1={{ x: proj.x, y: proj.y }} p2={{ x: proj.x - dx, y: proj.y - dy }} color={color} strokeWidth={5.5} opacity={0.35} />
                  <Line p1={{ x: proj.x, y: proj.y }} p2={{ x: proj.x - dx, y: proj.y - dy }} color="#ffffff" strokeWidth={1.5} />
                </Group>
              );
            } else {
              return (
                <Circle key={proj.id} cx={proj.x} cy={proj.y} r={2.5} color={proj.color || (proj.isEnemy ? '#ffcc00' : '#ffd700')} />
              );
            }
          })}

          {/* 6. 폭발 파편 및 요격 대공 파티클 */}
          {particles.map((part) => (
            <Circle key={part.id} cx={part.x} cy={part.y} r={part.radius} color={part.color} opacity={part.alpha} />
          ))}

          {/* 7. 시간 정지 디버프 오버레이 */}
          {chronoMuteTimer > 0 && (
            <Rect x={0} y={0} width={540} height={540} color="rgba(148, 26, 255, 0.15)" />
          )}
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
