import { PLANETS } from '../constants/planetaryData';
import {
  EARTH_CENTER_X,
  EARTH_CENTER_Y,
  SHIELD_RADIUS,
  SHIELD_MODULE_SPECS,
  COUNTERATTACK_MODULE_SPECS
} from './gameSpecs';

export const earthDamageActions = (set, get) => ({
  damageEarth: (damage, type) => {
    const state = get();
    if (state.earthHp <= 0) return;

    // --- Phase Shield (30% damage reduction) ---
    if (state.shieldModule === 'phase') {
      damage *= 0.7;
    }

    const angle = Math.random() * 2 * Math.PI;
    const hitX = EARTH_CENTER_X + Math.cos(angle) * SHIELD_RADIUS;
    const hitY = EARTH_CENTER_Y + Math.sin(angle) * SHIELD_RADIUS;
    
    const newParticle = {
      id: Math.random().toString(),
      x: hitX,
      y: hitY,
      radius: 2,
      maxRadius: 20,
      alpha: 1.0,
      color: type === 'energy' ? '#00f0ff' : '#ffaa00'
    };

    set((s) => ({ particles: [...s.particles, newParticle] }));

    // --- Reflect Shield & Reflector Counterattack ---
    let reflectPercent = 0;
    if (state.shieldModule === 'reflect' && type === 'energy') reflectPercent += 0.3;
    if (state.counterattackModules.reflector) reflectPercent += 0.3;

    if (reflectPercent > 0 && state.enemies.length > 0) {
      const reflectedDamage = damage * reflectPercent;
      const targetIndex = Math.floor(Math.random() * state.enemies.length);
      const target = state.enemies[targetIndex];
      if (target) {
        target.hp = Math.max(0, target.hp - reflectedDamage);
        state.addBattleLog(`실드 반사 작동: 적 ${target.spec?.name || target.type}에게 ${Math.floor(reflectedDamage)} 반사 피해!`);
        if (target.hp <= 0) {
          set((s) => ({
            enemies: s.enemies.filter(e => e.id !== target.id),
            credits: s.credits + (target.spec?.creditReward || 0)
          }));
        }
      }
    }

    if (type === 'energy') {
      const energyDamage = damage * 1.5;
      const currentShield = state.earthShield;
      let creditRefunding = 0;
      if (state.researchUpgrades.beamConversion) {
        creditRefunding = energyDamage * 0.1;
      }

      if (currentShield >= energyDamage) {
        set({ 
          earthShield: currentShield - energyDamage,
          credits: state.credits + creditRefunding
        });
      } else {
        const piercingDamage = (energyDamage - currentShield) / 1.5;
        const finalHpDamage = piercingDamage * 0.5;
        const newHp = Math.max(0, state.earthHp - finalHpDamage);

        if (newHp <= 0) {
          state.addBattleLog('지구 방어망이 완전히 붕괴되어 파괴되기 시작합니다!');
          const explosionParticles = [];
          for (let i = 0; i < 40; i++) {
            const angle = Math.random() * 2 * Math.PI;
            const dist = Math.random() * 30;
            explosionParticles.push({
              id: `earth-explode-${i}-${Math.random()}`,
              x: EARTH_CENTER_X + Math.cos(angle) * dist,
              y: EARTH_CENTER_Y + Math.sin(angle) * dist,
              radius: 2 + Math.random() * 5,
              maxRadius: 40 + Math.random() * 80,
              alpha: 1.0,
              color: ['#ff4400', '#ffcc00', '#ffffff'][Math.floor(Math.random() * 3)]
            });
          }
          set((s) => ({
            earthShield: 0,
            earthHp: 0,
            timeLoopCountdown: 2.5,
            particles: [...s.particles, ...explosionParticles],
            credits: s.credits + creditRefunding
          }));
        } else {
          set({ 
            earthShield: 0, 
            earthHp: newHp,
            credits: state.credits + creditRefunding
          });
        }
      }
    } else if (type === 'kinetic') {
      const interceptRate = state.getKineticInterceptRate();
      const isIntercepted = Math.random() <= interceptRate;

      if (isIntercepted) {
        state.addBattleLog('키네틱 실드가 적의 탄환을 요격했습니다.');
        const interceptParticle = {
          id: Math.random().toString(),
          x: hitX,
          y: hitY - 15,
          radius: 1,
          maxRadius: 25,
          alpha: 1.0,
          color: '#ff8a00'
        };
        set((s) => ({ particles: [...s.particles, interceptParticle] }));
      } else {
        const finalHpDamage = damage * 1.5;
        const newHp = Math.max(0, state.earthHp - finalHpDamage);
        
        const earthPlanet = state.planets[PLANETS.EARTH];
        const newPopulation = Math.max(0, Math.floor(earthPlanet.population * 0.98));
        
        state.addBattleLog(`요격 실패! 물리 탄환 지구 직격, 인구 ${Math.floor(earthPlanet.population * 0.02)}명 사망.`);

        if (newHp <= 0) {
          state.addBattleLog('지구가 물리 탄환의 충격으로 인해 파괴되기 시작합니다!');
          const explosionParticles = [];
          for (let i = 0; i < 40; i++) {
            const angle = Math.random() * 2 * Math.PI;
            const dist = Math.random() * 30;
            explosionParticles.push({
              id: `earth-explode-${i}-${Math.random()}`,
              x: EARTH_CENTER_X + Math.cos(angle) * dist,
              y: EARTH_CENTER_Y + Math.sin(angle) * dist,
              radius: 2 + Math.random() * 5,
              maxRadius: 40 + Math.random() * 80,
              alpha: 1.0,
              color: ['#ff4400', '#ffcc00', '#ffffff'][Math.floor(Math.random() * 3)]
            });
          }
          set((s) => ({
            earthHp: 0,
            timeLoopCountdown: 2.5,
            particles: [...s.particles, ...explosionParticles],
            planets: {
              ...s.planets,
              [PLANETS.EARTH]: {
                ...earthPlanet,
                population: newPopulation
              }
            }
          }));
        } else {
          set((s) => ({
            earthHp: newHp,
            planets: {
              ...s.planets,
              [PLANETS.EARTH]: {
                ...earthPlanet,
                population: newPopulation
              }
            }
          }));
        }
      }
    }
  }
});
