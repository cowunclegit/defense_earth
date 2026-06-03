import React from 'react';
import { useGameStore, SHIP_TYPES } from '../../store/gameStore';

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

  const hpRatio = earthHp / earthMaxHp;
  const earthColor = `rgb(${Math.floor(13 + (1 - hpRatio) * 120)}, ${Math.floor(31 * hpRatio + 10)}, ${Math.floor(61 * hpRatio + 15)})`;

  const shieldRatio = Math.max(0, earthShield / earthMaxShield);
  const shieldColor = shieldRatio > 0 ? `rgba(0, 240, 255, ${0.1 + shieldRatio * 0.45})` : 'rgba(255, 0, 0, 0.05)';
  const shieldBorderColor = shieldRatio > 0 ? `rgba(0, 240, 255, ${0.4 + shieldRatio * 0.6})` : 'rgba(255, 0, 0, 0.15)';

  return (
    <svg viewBox="0 0 540 540" style={{ width: '100%', height: '100%' }}>
      <g transform={`translate(${panX + 270}, ${panY + 270}) scale(${zoom}) translate(-270, -270)`}>
        {/* 심연의 우주배경 그리드 세로선/가로선 */}
        <line x1={90} y1={0} x2={90} y2={540} stroke="rgba(0, 240, 255, 0.08)" strokeWidth={1} />
        <line x1={180} y1={0} x2={180} y2={540} stroke="rgba(0, 240, 255, 0.08)" strokeWidth={1} />
        <line x1={270} y1={0} x2={270} y2={540} stroke="rgba(0, 240, 255, 0.08)" strokeWidth={1} />
        <line x1={360} y1={0} x2={360} y2={540} stroke="rgba(0, 240, 255, 0.08)" strokeWidth={1} />
        <line x1={450} y1={0} x2={450} y2={540} stroke="rgba(0, 240, 255, 0.08)" strokeWidth={1} />
        <line x1={0} y1={90} x2={540} y2={90} stroke="rgba(0, 240, 255, 0.08)" strokeWidth={1} />
        <line x1={0} y1={180} x2={540} y2={180} stroke="rgba(0, 240, 255, 0.08)" strokeWidth={1} />
        <line x1={0} y1={270} x2={540} y2={270} stroke="rgba(0, 240, 255, 0.08)" strokeWidth={1} />
        <line x1={0} y1={360} x2={540} y2={360} stroke="rgba(0, 240, 255, 0.08)" strokeWidth={1} />
        <line x1={0} y1={450} x2={540} y2={450} stroke="rgba(0, 240, 255, 0.08)" strokeWidth={1} />

        {/* 세로 골든 스타 트랙 */}
        <line x1={45} y1={0} x2={45} y2={540} stroke="rgba(255, 215, 0, 0.12)" strokeWidth={1} strokeDasharray="3, 15" />
        <line x1={135} y1={0} x2={135} y2={540} stroke="rgba(255, 215, 0, 0.12)" strokeWidth={1} strokeDasharray="5, 20" />
        <line x1={225} y1={0} x2={225} y2={540} stroke="rgba(255, 215, 0, 0.12)" strokeWidth={1} strokeDasharray="4, 18" />
        <line x1={315} y1={0} x2={315} y2={540} stroke="rgba(255, 215, 0, 0.12)" strokeWidth={1} strokeDasharray="6, 25" />
        <line x1={405} y1={0} x2={405} y2={540} stroke="rgba(255, 215, 0, 0.12)" strokeWidth={1} strokeDasharray="4, 15" />
        <line x1={495} y1={0} x2={495} y2={540} stroke="rgba(255, 215, 0, 0.12)" strokeWidth={1} strokeDasharray="5, 22" />

        {/* 1. 지구 본체 렌더링 */}
        <circle cx={EARTH_CENTER_X} cy={EARTH_CENTER_Y} r={80} fill={earthColor} />
        <circle cx={EARTH_CENTER_X} cy={EARTH_CENTER_Y} r={80} fill="rgba(0, 240, 255, 0.08)" />
        <circle cx={EARTH_CENTER_X} cy={EARTH_CENTER_Y} r={80} fill="transparent" stroke="#00f0ff" strokeWidth={1.5} opacity={0.5} />

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
              <line x1={baseX} y1={baseY} x2={barrelX} y2={barrelY} stroke={baseColor} strokeWidth={2.5} />
              <circle cx={baseX} cy={baseY} r={4.5} fill={baseColor} stroke="#050814" strokeWidth={1} />
            </g>
          );
        })}

        {/* 2. 이원화 에너지 실드 아크 */}
        <circle cx={EARTH_CENTER_X} cy={EARTH_CENTER_Y} r={SHIELD_RADIUS} fill={shieldColor} stroke={shieldBorderColor} strokeWidth={2.2} strokeDasharray="10, 6" />
        <circle cx={EARTH_CENTER_X} cy={EARTH_CENTER_Y} r={SHIELD_RADIUS + 4} fill="transparent" stroke={shieldBorderColor} strokeWidth={0.8} strokeDasharray="40, 10" />

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
            <g key={ship.id}>
              <circle cx={ship.x} cy={ship.y} r={shipSize} fill={shipColor} />
              <circle cx={ship.x} cy={ship.y} r={shipSize + 3} fill="transparent" stroke="rgba(255, 255, 255, 0.25)" strokeWidth={0.5} />
            </g>
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
            <g key={enemy.id}>
              <rect x={enemy.x - w / 2} y={enemy.y - h / 2} width={w} height={h} fill={enemyColor} />
              {isBoss && (
                <circle cx={enemy.x} cy={enemy.y} r={Math.max(w, h) * 0.7} fill="transparent" stroke={enemyColor} strokeWidth={1} />
              )}
              <line x1={enemy.x - w / 2} y1={enemy.y - h / 2 - 5} x2={enemy.x + w / 2} y2={enemy.y - h / 2 - 5} stroke="rgba(255, 255, 255, 0.25)" strokeWidth={2} />
              <line x1={enemy.x - w / 2} y1={enemy.y - h / 2 - 5} x2={enemy.x - w / 2 + w * (enemy.hp / enemy.maxHp)} y2={enemy.y - h / 2 - 5} stroke={isBoss ? '#ffd700' : '#00ff8a'} strokeWidth={2} />
              <text x={enemy.x} y={enemy.y - h / 2 - 9} fill="#ffffff" fontSize={6.5} fontWeight="bold" textAnchor="middle">
                Lv.{enemy.level || 1} ({Math.round(enemy.hp)}/{Math.round(enemy.maxHp)})
              </text>
            </g>
          );
        })}

        {/* 5. 실시간 투사체 */}
        {projectiles.map((proj) => {
          if (proj.type === 'energy') {
            const dx = proj.vx * 0.05;
            const dy = proj.vy * 0.05;
            const color = proj.color || (proj.isEnemy ? '#00f0ff' : '#ff5500');
            return (
              <g key={proj.id}>
                <line x1={proj.x} y1={proj.y} x2={proj.x - dx} y2={proj.y - dy} stroke={color} strokeWidth={5.5} opacity={0.35} />
                <line x1={proj.x} y1={proj.y} x2={proj.x - dx} y2={proj.y - dy} stroke="#ffffff" strokeWidth={1.5} />
              </g>
            );
          } else {
            return (
              <circle key={proj.id} cx={proj.x} cy={proj.y} r={2.5} fill={proj.color || (proj.isEnemy ? '#ffcc00' : '#ffd700')} />
            );
          }
        })}

        {/* 6. 폭발 파편 및 요격 대공 파티클 */}
        {particles.map((part) => (
          <circle key={part.id} cx={part.x} cy={part.y} r={part.radius} fill={part.color} opacity={part.alpha} />
        ))}

        {/* 7. 시간 정지 디버프 오버레이 */}
        {chronoMuteTimer > 0 && (
          <rect x={0} y={0} width={540} height={540} fill="rgba(148, 26, 255, 0.15)" />
        )}
      </g>
    </svg>
  );
}
