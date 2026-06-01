import React from 'react';
import { StyleSheet, View, Platform, Text, TouchableOpacity, Dimensions } from 'react-native';
import { useGameStore, SHIP_TYPES } from '../store/gameStore';

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');
const canvasSize = Math.min(320, windowHeight * 0.45);

// Conditionally load Skia on native platforms to prevent web bundler/WASM errors
let Canvas, Circle, Rect, Group, Line, Paint;
if (Platform.OS !== 'web') {
  try {
    const Skia = require('@shopify/react-native-skia');
    Canvas = Skia.Canvas;
    Circle = Skia.Circle;
    Rect = Skia.Rect;
    Group = Skia.Group;
    Line = Skia.Line;
    Paint = Skia.Paint;
  } catch (e) {
    console.warn('Failed to load react-native-skia dynamically:', e);
  }
}

export default function GameCanvas() {
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

  const [zoom, setZoom] = React.useState(1.0);
  const [panX, setPanX] = React.useState(0);
  const [panY, setPanY] = React.useState(0);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    if (Platform.OS === 'web' && containerRef.current) {
      const element = containerRef.current;
      const handleWheel = (e) => {
        e.preventDefault();
        const zoomFactor = 1.1;
        setZoom(prevZoom => {
          const nextZoom = e.deltaY > 0 ? prevZoom / zoomFactor : prevZoom * zoomFactor;
          return Math.max(0.3, Math.min(3.0, nextZoom));
        });
      };
      element.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        element.removeEventListener('wheel', handleWheel);
      };
    }
  }, []);

  const onStartShouldSetResponder = () => true;
  const onResponderGrant = (evt) => {
    const locX = evt.nativeEvent.pageX;
    const locY = evt.nativeEvent.pageY;
    setDragStart({ x: locX - panX, y: locY - panY });
  };
  const onResponderMove = (evt) => {
    const locX = evt.nativeEvent.pageX;
    const locY = evt.nativeEvent.pageY;
    setPanX(locX - dragStart.x);
    setPanY(locY - dragStart.y);
  };

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

  // HP 비율에 따른 지구 색상 변화 (위험할수록 붉어짐)
  const hpRatio = earthHp / earthMaxHp;
  const earthColor = `rgb(${Math.floor(13 + (1 - hpRatio) * 120)}, ${Math.floor(31 * hpRatio + 10)}, ${Math.floor(61 * hpRatio + 15)})`;

  // 실드 에너지에 따른 강도 및 쉴드 색상 산출
  const shieldRatio = Math.max(0, earthShield / earthMaxShield);
  const shieldColor = shieldRatio > 0 ? `rgba(0, 240, 255, ${0.1 + shieldRatio * 0.45})` : 'rgba(255, 0, 0, 0.05)';
  const shieldBorderColor = shieldRatio > 0 ? `rgba(0, 240, 255, ${0.4 + shieldRatio * 0.6})` : 'rgba(255, 0, 0, 0.15)';

  if (Platform.OS === 'web') {
    // Web rendering: Render standard SVG
    return (
      <View 
        ref={containerRef}
        style={styles.canvasContainer}
        onStartShouldSetResponder={onStartShouldSetResponder}
        onResponderGrant={onResponderGrant}
        onResponderMove={onResponderMove}
      >
        <svg viewBox="0 0 540 540" style={{ width: '100%', height: '100%' }}>
          <g transform={`translate(${panX + 270}, ${panY + 270}) scale(${zoom}) translate(-270, -270)`}>
            {/* 심연의 우주배경 그리드 세로선/가로선 */}
          {/* 심연의 우주배경 그리드 세로선/가로선 */}
          <line x1={90} y1={0} x2={90} y2={540} stroke="rgba(30, 48, 94, 0.15)" strokeWidth={1} />
          <line x1={180} y1={0} x2={180} y2={540} stroke="rgba(30, 48, 94, 0.15)" strokeWidth={1} />
          <line x1={270} y1={0} x2={270} y2={540} stroke="rgba(30, 48, 94, 0.15)" strokeWidth={1} />
          <line x1={360} y1={0} x2={360} y2={540} stroke="rgba(30, 48, 94, 0.15)" strokeWidth={1} />
          <line x1={450} y1={0} x2={450} y2={540} stroke="rgba(30, 48, 94, 0.15)" strokeWidth={1} />
          <line x1={0} y1={90} x2={540} y2={90} stroke="rgba(30, 48, 94, 0.15)" strokeWidth={1} />
          <line x1={0} y1={180} x2={540} y2={180} stroke="rgba(30, 48, 94, 0.15)" strokeWidth={1} />
          <line x1={0} y1={270} x2={540} y2={270} stroke="rgba(30, 48, 94, 0.15)" strokeWidth={1} />
          <line x1={0} y1={360} x2={540} y2={360} stroke="rgba(30, 48, 94, 0.15)" strokeWidth={1} />
          <line x1={0} y1={450} x2={540} y2={450} stroke="rgba(30, 48, 94, 0.15)" strokeWidth={1} />

          {/* 1. 지구 본체 렌더링 (하단 구형 반경) */}
          <circle cx={EARTH_CENTER_X} cy={EARTH_CENTER_Y} r={80} fill={earthColor} />
          <circle cx={EARTH_CENTER_X} cy={EARTH_CENTER_Y} r={80} fill="rgba(0, 240, 255, 0.08)" />

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
              <g key={`base-web-${base.globalIndex}`}>
                {/* 포신 */}
                <line x1={baseX} y1={baseY} x2={barrelX} y2={barrelY} stroke={baseColor} strokeWidth={2.5} />
                {/* 포탑 본체 */}
                <circle cx={baseX} cy={baseY} r={4.5} fill={baseColor} stroke="#050814" strokeWidth={1} />
              </g>
            );
          })}

          {/* 2. 이원화 에너지 실드 아크 (반투명 서클막) */}
          <circle cx={EARTH_CENTER_X} cy={EARTH_CENTER_Y} r={SHIELD_RADIUS} fill={shieldColor} stroke={shieldBorderColor} strokeWidth={1.8} />

          {/* 3. 아군 궤도 기동대 렌더링 (요격기, 호위함, 구축함 구분) */}
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
              <g key={ship.id}>
                {/* 함선 본체 */}
                <circle cx={ship.x} cy={ship.y} r={shipSize} fill={shipColor} />
                {/* 함선 쉴드막 미세 렌더 */}
                <circle cx={ship.x} cy={ship.y} r={shipSize + 3} fill="transparent" stroke="rgba(255, 255, 255, 0.25)" strokeWidth={0.5} />
              </g>
            );
          })}

          {/* 4. 적 외계인 함대 및 거대 보스 렌더링 */}
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
              <g key={enemy.id}>
                {/* 보스 및 일반 적 외형 드로잉 */}
                <rect x={enemy.x - w / 2} y={enemy.y - h / 2} width={w} height={h} fill={enemyColor} />
                {isBoss && (
                  <circle cx={enemy.x} cy={enemy.y} r={Math.max(w, h) * 0.7} fill="transparent" stroke={enemyColor} strokeWidth={1} />
                )}

                {/* HP 게이지바 */}
                <line x1={enemy.x - w / 2} y1={enemy.y - h / 2 - 5} x2={enemy.x + w / 2} y2={enemy.y - h / 2 - 5} stroke="rgba(255, 255, 255, 0.25)" strokeWidth={2} />
                <line x1={enemy.x - w / 2} y1={enemy.y - h / 2 - 5} x2={enemy.x - w / 2 + w * (enemy.hp / enemy.maxHp)} y2={enemy.y - h / 2 - 5} stroke={isBoss ? '#ffd700' : '#00ff8a'} strokeWidth={2} />
                <text x={enemy.x} y={enemy.y - h / 2 - 9} fill="#ffffff" fontSize={7} fontWeight="bold" textAnchor="middle">
                  Lv.{enemy.level || 1}
                </text>
              </g>
            );
          })}

          {/* 5. 실시간 투사체 (레이저 빔 및 철갑탄) 렌더링 */}
          {projectiles.map((proj) => {
            if (proj.type === 'energy') {
              const dx = proj.vx * 0.05;
              const dy = proj.vy * 0.05;
              return (
                <line 
                  key={proj.id}
                  x1={proj.x}
                  y1={proj.y}
                  x2={proj.x - dx}
                  y2={proj.y - dy}
                  stroke={proj.color || (proj.isEnemy ? '#00f0ff' : '#00ff8a')}
                  strokeWidth={2}
                />
              );
            } else {
              return (
                <circle 
                  key={proj.id} 
                  cx={proj.x} 
                  cy={proj.y} 
                  r={2} 
                  fill={proj.color || (proj.isEnemy ? '#ffcc00' : '#ffd700')} 
                />
              );
            }
          })}

          {/* 6. 폭발 파편 및 요격 대공(Flak Burst) 파티클 이펙트 */}
          {particles.map((part) => {
            return (
              <circle 
                key={part.id}
                cx={part.x}
                cy={part.y}
                r={part.radius}
                fill={part.color}
                opacity={part.alpha}
              />
            );
          })}

          {/* 7. 시간 정지 디버프 오버레이 연출 */}
          {chronoMuteTimer > 0 && (
            <rect x={0} y={0} width={540} height={540} fill="rgba(148, 26, 255, 0.15)" />
          )}
          </g>
        </svg>
        {/* Floating Zoom & Reset Controls */}
        <View style={styles.hudContainer}>
          <Text style={styles.hudZoomText}>{Math.round(zoom * 100)}%</Text>
          <TouchableOpacity style={styles.hudBtn} onPress={() => setZoom(z => Math.min(3.0, z + 0.15))}>
            <Text style={styles.hudText}>➕</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.hudBtn} onPress={() => setZoom(z => Math.max(0.3, z - 0.15))}>
            <Text style={styles.hudText}>➖</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.hudBtn} onPress={() => { setZoom(1.0); setPanX(0); setPanY(0); }}>
            <Text style={styles.hudText}>🔄</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Native rendering: Render Skia Canvas
  const scaleFactor = canvasSize / 540;

  return (
    <View 
      ref={containerRef}
      style={styles.canvasContainer}
      onStartShouldSetResponder={onStartShouldSetResponder}
      onResponderGrant={onResponderGrant}
      onResponderMove={onResponderMove}
    >
      <Canvas style={styles.skiaCanvas}>
        <Group transform={[{ scale: scaleFactor }]}>
          <Group transform={[{ translateX: panX + 270 }, { translateY: panY + 270 }, { scale: zoom }, { translateX: -270 }, { translateY: -270 }]}>
          {/* 심연의 우주배경 그리드 세로선/가로선 */}
        <Line p1={{ x: 90, y: 0 }} p2={{ x: 90, y: 540 }} color="rgba(30, 48, 94, 0.15)" strokeWidth={1} />
        <Line p1={{ x: 180, y: 0 }} p2={{ x: 180, y: 540 }} color="rgba(30, 48, 94, 0.15)" strokeWidth={1} />
        <Line p1={{ x: 270, y: 0 }} p2={{ x: 270, y: 540 }} color="rgba(30, 48, 94, 0.15)" strokeWidth={1} />
        <Line p1={{ x: 360, y: 0 }} p2={{ x: 360, y: 540 }} color="rgba(30, 48, 94, 0.15)" strokeWidth={1} />
        <Line p1={{ x: 450, y: 0 }} p2={{ x: 450, y: 540 }} color="rgba(30, 48, 94, 0.15)" strokeWidth={1} />
        <Line p1={{ x: 0, y: 90 }} p2={{ x: 540, y: 90 }} color="rgba(30, 48, 94, 0.15)" strokeWidth={1} />
        <Line p1={{ x: 0, y: 180 }} p2={{ x: 540, y: 180 }} color="rgba(30, 48, 94, 0.15)" strokeWidth={1} />
        <Line p1={{ x: 0, y: 270 }} p2={{ x: 540, y: 270 }} color="rgba(30, 48, 94, 0.15)" strokeWidth={1} />
        <Line p1={{ x: 0, y: 360 }} p2={{ x: 540, y: 360 }} color="rgba(30, 48, 94, 0.15)" strokeWidth={1} />
        <Line p1={{ x: 0, y: 450 }} p2={{ x: 540, y: 450 }} color="rgba(30, 48, 94, 0.15)" strokeWidth={1} />

        {/* 1. 지구 본체 렌더링 (하단 구형 반경) */}
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
              {/* 포신 */}
              <Line p1={{ x: baseX, y: baseY }} p2={{ x: barrelX, y: barrelY }} color={baseColor} strokeWidth={2.5} />
              {/* 포탑 본체 */}
              <Circle cx={baseX} cy={baseY} r={4.5} color={baseColor} />
            </Group>
          );
        })}

        {/* 2. 이원화 에너지 실드 아크 (반투명 서클막) */}
        <Circle 
          cx={EARTH_CENTER_X} 
          cy={EARTH_CENTER_Y} 
          r={SHIELD_RADIUS} 
          color={shieldColor} 
        />
        <Circle 
          cx={EARTH_CENTER_X} 
          cy={EARTH_CENTER_Y} 
          r={SHIELD_RADIUS} 
          color="transparent" 
        >
          <Paint style="stroke" strokeWidth={1.8} color={shieldBorderColor} />
        </Circle>

        {/* 3. 아군 궤도 기동대 렌더링 (요격기, 호위함, 구축함 구분) */}
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
              {/* 함선 본체 */}
              <Circle cx={ship.x} cy={ship.y} r={shipSize} color={shipColor} />
              {/* 함선 쉴드막 미세 렌더 */}
              <Circle cx={ship.x} cy={ship.y} r={shipSize + 3} color="transparent">
                <Paint style="stroke" strokeWidth={0.5} color="rgba(255, 255, 255, 0.25)" />
              </Circle>
            </Group>
          );
        })}

        {/* 4. 적 외계인 함대 및 거대 보스 렌더링 */}
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
              {/* 보스 및 일반 적 외형 드로잉 */}
              <Rect 
                x={enemy.x - w / 2} 
                y={enemy.y - h / 2} 
                width={w} 
                height={h} 
                color={enemyColor} 
              />
              {isBoss && (
                <Circle cx={enemy.x} cy={enemy.y} r={Math.max(w, h) * 0.7} color="transparent">
                  <Paint style="stroke" strokeWidth={1} color={enemyColor} />
                </Circle>
              )}

              {/* HP 게이지바 */}
              <Line 
                p1={{ x: enemy.x - w / 2, y: enemy.y - h / 2 - 5 }}
                p2={{ x: enemy.x + w / 2, y: enemy.y - h / 2 - 5 }}
                color="rgba(255, 255, 255, 0.25)"
                strokeWidth={2}
              />
              <Line 
                p1={{ x: enemy.x - w / 2, y: enemy.y - h / 2 - 5 }}
                p2={{ x: enemy.x - w / 2 + w * (enemy.hp / enemy.maxHp), y: enemy.y - h / 2 - 5 }}
                color={isBoss ? '#ffd700' : '#00ff8a'}
                strokeWidth={2}
              />
            </Group>
          );
        })}

        {/* 5. 실시간 투사체 (레이저 빔 및 철갑탄) 렌더링 */}
        {projectiles.map((proj) => {
          if (proj.type === 'energy') {
            const dx = proj.vx * 0.05;
            const dy = proj.vy * 0.05;
            return (
              <Line 
                key={proj.id}
                p1={{ x: proj.x, y: proj.y }}
                p2={{ x: proj.x - dx, y: proj.y - dy }}
                color={proj.color || (proj.isEnemy ? '#00f0ff' : '#00ff8a')}
                strokeWidth={2}
              />
            );
          } else {
            return (
              <Circle 
                key={proj.id} 
                cx={proj.x} 
                cy={proj.y} 
                r={2} 
                color={proj.color || (proj.isEnemy ? '#ffcc00' : '#ffd700')} 
              />
            );
          }
        })}

        {/* 6. 폭발 파편 및 요격 대공(Flak Burst) 파티클 이펙트 */}
        {particles.map((part) => {
          return (
            <Circle 
              key={part.id}
              cx={part.x}
              cy={part.y}
              r={part.radius}
              color={part.color}
              opacity={part.alpha}
            />
          );
        })}

        {/* 7. 시간 정지 디버프 오버레이 연출 */}
        {chronoMuteTimer > 0 && (
          <Rect 
            x={0} 
            y={0} 
            width={540} 
            height={540} 
            color="rgba(148, 26, 255, 0.15)" 
          />
        )}
          </Group>
        </Group>
      </Canvas>
      {/* Floating Zoom & Reset Controls */}
      <View style={styles.hudContainer}>
        <Text style={styles.hudZoomText}>{Math.round(zoom * 100)}%</Text>
        <TouchableOpacity style={styles.hudBtn} onPress={() => setZoom(z => Math.min(3.0, z + 0.15))}>
          <Text style={styles.hudText}>➕</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.hudBtn} onPress={() => setZoom(z => Math.max(0.3, z - 0.15))}>
          <Text style={styles.hudText}>➖</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.hudBtn} onPress={() => { setZoom(1.0); setPanX(0); setPanY(0); }}>
          <Text style={styles.hudText}>🔄</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  canvasContainer: {
    width: canvasSize,
    height: canvasSize,
    backgroundColor: '#050814',
    overflow: 'hidden',
  },
  skiaCanvas: {
    flex: 1,
  },
  hudContainer: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 8, 20, 0.85)',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#1e305e',
    padding: 6,
    gap: 8,
    zIndex: 999,
  },
  hudZoomText: {
    color: '#00f0ff',
    fontSize: 12,
    fontWeight: 'bold',
    marginHorizontal: 4,
    minWidth: 40,
    textAlign: 'center',
  },
  hudBtn: {
    width: 28,
    height: 28,
    backgroundColor: '#0a1026',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00f0ff',
  },
  hudText: {
    color: '#00f0ff',
    fontWeight: 'bold',
    fontSize: 14,
  }
});
