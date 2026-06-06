import { create } from 'zustand';
import { Alert } from 'react-native';
import { PLANETS, PLANETARY_DATA } from '../constants/planetaryData';
import { runTickSimulation } from './tickHelpers';
import { planetActions } from './planetActions';
import { earthDamageActions } from './earthDamageActions';
import { saveLoadActions } from './saveLoadActions';
import { cheatActions } from './cheatActions';

// 초기 행성 상태 템플릿
const createDefaultPlanetState = (unlocked = false, terraformProgress = 0, population = 0, shipyard = 0) => ({
  unlocked,
  terraformProgress,
  population,
  shipyard,
  groundBases: 0,
  orbitalSatellites: 0,
  orbitalStations: 0,
  groundBasesList: {
    railgun: 0,
    energyCannon: 0,
    missileSilo: 0,
    plasmaBomber: 0,
    electricTurret: 0,
    sniperCannon: 0,
    gatling: 0,
    nuclearTorpedo: 0,
    forceShield: 0,
    ciws: 0,
    armor: 0
  },
  groundBaseTimers: {
    railgun: 0,
    energyCannon: 0,
    missileSilo: 0,
    plasmaBomber: 0,
    electricTurret: 0,
    sniperCannon: 0,
    gatling: 0,
    nuclearTorpedo: 0,
    ciws: 0
  },
  orbitalSatellitesList: {
    laser: 0,
    plasmaLaser: 0,
    emp: 0,
    clusterMissile: 0,
    gravityBomb: 0,
    antimatter: 0,
    sensor: 0,
    forceShield: 0,
    decoy: 0,
    repairDrone: 0
  },
  satelliteTimers: {
    laser: 0,
    plasmaLaser: 0,
    emp: 0,
    clusterMissile: 0,
    gravityBomb: 0,
    antimatter: 0,
    forceShield: 0
  },
  orbitalStationsList: {
    aegisShield: 0,
    gigaPlasma: 0,
    gravityDistorter: 0
  },
  stationTimers: {
    gigaPlasma: 0
  }
});

const initialPlanetsState = {
  [PLANETS.EARTH]: createDefaultPlanetState(true, 100, 1000000, 1),
  [PLANETS.LUNA]: createDefaultPlanetState(false, 0, 0, 0),
  [PLANETS.MARS]: createDefaultPlanetState(false, 0, 0, 0),
  [PLANETS.VENUS]: createDefaultPlanetState(false, 0, 0, 0),
  [PLANETS.MERCURY]: createDefaultPlanetState(false, 0, 0, 0),
  [PLANETS.JUPITER]: createDefaultPlanetState(false, 0, 0, 0),
  [PLANETS.SATURN]: createDefaultPlanetState(false, 0, 0, 0),
  [PLANETS.URANUS]: createDefaultPlanetState(false, 0, 0, 0),
  [PLANETS.NEPTUNE]: createDefaultPlanetState(false, 0, 0, 0),
  [PLANETS.PLUTO]: createDefaultPlanetState(false, 0, 0, 0),
};

// 크로노스 연구소 영구 업그레이드 초기 상태
const initialChronosUpgrades = {
  creditGen: 0,
  energyGen: 0,
  nanocoreGen: 0,
  shieldCap: 0,
  shieldRegen: 0,
  kineticIntercept: 0,
  fleetDamage: 0,
  timeMachineSpeed: 0,
  rebirthBonus: 0,
};

import {
  SHIP_TYPES,
  SHIP_SPECS,
  GROUND_BASE_SPECS,
  MAX_SATELLITES_PER_CATEGORY,
  getSatelliteCost,
  SATELLITE_SPECS,
  STATION_SPECS,
  SHIELD_MODULE_SPECS,
  COUNTERATTACK_MODULE_SPECS,
  ALIEN_TYPES,
  ALIEN_SPECS,
  EARTH_CENTER_X,
  EARTH_CENTER_Y,
  SHIELD_RADIUS,
  ENEMY_SPAWN_RADIUS,
  calculateSynergies,
  recalculateUsedEnergyState
} from './gameSpecs';

export {
  SHIP_TYPES,
  SHIP_SPECS,
  GROUND_BASE_SPECS,
  MAX_SATELLITES_PER_CATEGORY,
  getSatelliteCost,
  SATELLITE_SPECS,
  STATION_SPECS,
  SHIELD_MODULE_SPECS,
  COUNTERATTACK_MODULE_SPECS,
  ALIEN_TYPES,
  ALIEN_SPECS,
  EARTH_CENTER_X,
  EARTH_CENTER_Y,
  SHIELD_RADIUS,
  ENEMY_SPAWN_RADIUS,
  calculateSynergies,
  recalculateUsedEnergyState
};

export const useGameStore = create((set, get) => ({
  credits: 1000,
  maxEnergy: 100,
  usedEnergy: 20,
  nanocores: 0,
  timeParticles: 0,
  cheatEnergyBonus: 0,

  activeAlerts: [],
  showAlert: (title, message, buttons) => set((state) => {
    const newAlert = { id: Math.random().toString(), title, message, buttons };
    let updated = [...state.activeAlerts, newAlert];
    if (updated.length > 4) {
      updated.shift();
    }
    return { activeAlerts: updated };
  }),
  closeAlert: (id) => set((state) => ({
    activeAlerts: state.activeAlerts.filter(a => a.id !== id)
  })),

  satelliteLevels: {
    laser: { damage: 1, speed: 1, range: 1 },
    plasmaLaser: { damage: 1, speed: 1, range: 1 },
    emp: { damage: 1, speed: 1, range: 1 },
    clusterMissile: { damage: 1, speed: 1, range: 1 },
    gravityBomb: { damage: 1, speed: 1, range: 1 },
    antimatter: { damage: 1, speed: 1, range: 1 }
  },

  earthHp: 100,
  earthMaxHp: 100,
  earthShield: 100,
  earthMaxShield: 100,
  earthShieldRechargeRate: 5,
  kineticDefenseTowers: 0,
  satelliteRotation: 0,
  shieldModule: 'basic',
  counterattackModules: {
    reflector: false,
    discharge: false,
    electricField: false
  },
  
  currentWave: 1,
  enemiesRemainingToSpawn: 8,
  gameSpeed: 1,
  isPaused: false,
  timeMachineGauge: 0,
  timeLoopCountdown: 0,

  planets: initialPlanetsState,
  chronosUpgrades: initialChronosUpgrades,
  synergies: calculateSynergies(initialPlanetsState, initialChronosUpgrades),

  researchUpgrades: {
    beamConversion: false,
    selfRepair: false,
    tachionTargeting: false
  },

  // --- QoL 자동화 편의 옵션 ---
  autoTerraform: false,
  autoBuildTowers: false,
  
  // --- 모의 BM 프리미엄 패스 상태 ---
  isPremium: false,

  fleet: [],
  enemies: [],
  projectiles: [],
  particles: [],
  enemySpawnTimer: 0,
  chronoMuteTimer: 0,

  fleetSlots: {
    [SHIP_TYPES.INTERCEPTOR]: 0,
    [SHIP_TYPES.ESCORT]: 0,
    [SHIP_TYPES.DESTROYER]: 0,
    [SHIP_TYPES.CRUISER]: 0,
    [SHIP_TYPES.STEALTH]: 0,
    [SHIP_TYPES.ION_BATTLESHIP]: 0,
    [SHIP_TYPES.SHIELD_CARRIER]: 0,
    [SHIP_TYPES.REPAIR_SHIP]: 0,
    [SHIP_TYPES.BARRIER_SHIP]: 0,
  },
  shipyardQueue: null,
  battleLogs: [],

  getAvailableEnergy: () => {
    const state = get();
    return Math.max(0, state.maxEnergy - state.usedEnergy);
  },

  getKineticInterceptRate: () => {
    const state = get();
    const base = 0.60;
    const upgradeBonus = state.chronosUpgrades.kineticIntercept * 0.02;
    
    let totalSatellites = 0;
    Object.keys(state.planets).forEach((planetId) => {
      const p = state.planets[planetId];
      if (p.unlocked) {
        totalSatellites += p.orbitalSatellites || 0;
      }
    });

    const towerBonus = totalSatellites * 0.08;
    return Math.min(1.0, base + upgradeBonus + towerBonus);
  },

  getShieldCapacity: () => {
    const state = get();
    let base = 100;

    const module = state.shieldModule || 'basic';
    if (module === 'basic') base += 500;
    else if (module === 'plasma') base += 1500;
    else if (module === 'dual') base += 3000;
    else if (module === 'reflect') base += 2000;
    else if (module === 'phase') base += 4000;
    else if (module === 'repair') base += 1000;

    const upgradeBonus = state.chronosUpgrades.shieldCap * 0.15;
    
    let totalStations = 0;
    Object.keys(state.planets).forEach((planetId) => {
      const p = state.planets[planetId];
      if (p.unlocked) {
        totalStations += (p.orbitalStations || 0);
      }
    });

    const stationBonus = totalStations * 0.20;
    return base * (1 + upgradeBonus + stationBonus);
  },

  setGameSpeed: (speed) => {
    const state = get();
    // 프리미엄 미구매 시 4배속 제한 적용 (모의 BM)
    if (speed === 4 && !state.isPremium) {
      state.addBattleLog('4배속 모드는 프리미엄 패스 구매 전용입니다.');
      return;
    }
    set({ gameSpeed: speed });
  },

  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),

  // --- QoL 토글 액션 ---
  toggleAutoTerraform: () => set((state) => ({ autoTerraform: !state.autoTerraform })),
  toggleAutoBuildTowers: () => set((state) => ({ autoBuildTowers: !state.autoBuildTowers })),

  // --- 모의 결제 BM 구매 액션 ---
  buyPremium: () => {
    set({ isPremium: true });
    get().addBattleLog('프리미엄 광고제거 패스를 구매했습니다. 4배속 및 자동 강화가 전면 해금됩니다.');
  },

  addBattleLog: (message) => set((state) => ({
    battleLogs: [
      { id: Math.random().toString(), timestamp: new Date().toLocaleTimeString(), message },
      ...state.battleLogs.slice(0, 19)
    ]
  })),

  // --- 모듈화된 서브 액션 믹스인 ---
  ...planetActions(set, get),
  ...earthDamageActions(set, get),
  ...saveLoadActions(set, get, initialPlanetsState, initialChronosUpgrades, calculateSynergies, recalculateUsedEnergyState, SHIP_TYPES),
  ...cheatActions(set, get),

  triggerTimeLoop: () => {
    const state = get();
    let totalTerraformProgress = 0;
    Object.values(state.planets).forEach((p) => {
      totalTerraformProgress += p.terraformProgress;
    });

    const baseTP = (state.credits * 0.00001) + (state.nanocores * 0.1) + (totalTerraformProgress * 10);
    const upgradeBonus = 1 + (state.chronosUpgrades.rebirthBonus * 0.1);
    const plutoBonus = state.synergies.timeMachineChargeSpeedMultiplier;
    const earnedTP = Math.floor(baseTP * upgradeBonus * plutoBonus);

    state.addBattleLog(`시간 회귀 가동! TP ${earnedTP} 획득.`);

    set((state) => {
      const resetPlanets = { ...initialPlanetsState };
      const newSynergies = calculateSynergies(resetPlanets, state.chronosUpgrades);
      const newMaxShield = 100 * (1 + state.chronosUpgrades.shieldCap * 0.15);

      return {
        credits: 1000,
        maxEnergy: 100,
        usedEnergy: 20,
        nanocores: 0,
        timeParticles: state.timeParticles + earnedTP,
        cheatEnergyBonus: 0,
        earthHp: 100,
        earthMaxHp: 100,
        earthShield: newMaxShield,
        earthMaxShield: newMaxShield,
        kineticDefenseTowers: 0,
        timeMachineGauge: 0,
        currentWave: 1,
        enemiesRemainingToSpawn: 8,
        timeLoopCountdown: 0,
        planets: resetPlanets,
        synergies: newSynergies,
        shieldModule: 'basic',
        counterattackModules: {
          reflector: false,
          discharge: false,
          electricField: false
        },
        researchUpgrades: {
          beamConversion: false,
          selfRepair: false,
          tachionTargeting: false
        },
        satelliteLevels: {
          laser: { damage: 1, speed: 1, range: 1 },
          plasmaLaser: { damage: 1, speed: 1, range: 1 },
          emp: { damage: 1, speed: 1, range: 1 },
          clusterMissile: { damage: 1, speed: 1, range: 1 },
          gravityBomb: { damage: 1, speed: 1, range: 1 },
          antimatter: { damage: 1, speed: 1, range: 1 }
        },
        fleet: [],
        enemies: [],
        projectiles: [],
        particles: [],
        shipyardQueue: null,
        chronoMuteTimer: 0
      };
    });
    // 자동 세이브 트리거
    get().saveGame();
  },

  // --- 핵심 틱 시뮬레이션 루프 ---
  tick: (deltaTime) => {
    const state = get();
    if (state.isPaused) return;

    const actualDelta = deltaTime * state.gameSpeed;
    const nextRotation = (state.satelliteRotation || 0) + 15 * actualDelta;

    // 만약 지구 체력이 0 이하인 상태라면, 파괴 시퀀스(대폭발 카운트다운)만 처리
    if (state.earthHp <= 0) {
      if (state.timeLoopCountdown > 0) {
        const nextCountdown = Math.max(0, state.timeLoopCountdown - actualDelta);
        
        // 매 프레임마다 무작위로 추가 파편 파티클 생성
        const newParticles = [...state.particles];
        const spawnCount = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < spawnCount; i++) {
          const angle = Math.random() * 2 * Math.PI;
          const dist = Math.random() * 40;
          newParticles.push({
            id: `earth-dying-${Date.now()}-${i}-${Math.random()}`,
            x: EARTH_CENTER_X + Math.cos(angle) * dist,
            y: EARTH_CENTER_Y + Math.sin(angle) * dist,
            radius: 1 + Math.random() * 3,
            maxRadius: 20 + Math.random() * 40,
            alpha: 1.0,
            color: ['#ff3300', '#ffaa00', '#ffffff', '#ff0055'][Math.floor(Math.random() * 4)]
          });
        }

        // 모든 폭발 파티클 업데이트
        const updatedParticles = newParticles.map(part => {
          const expansion = part.maxRadius * 3 * actualDelta;
          const newRadius = Math.min(part.maxRadius, part.radius + expansion);
          const decayRate = part.id.includes('earth') ? (0.3 + Math.random() * 0.8) : 1.8;
          const newAlpha = Math.max(0, part.alpha - decayRate * actualDelta);
          return { ...part, radius: newRadius, alpha: newAlpha };
        }).filter(part => part.alpha > 0);

        set({
          timeLoopCountdown: nextCountdown,
          particles: updatedParticles
        });

        if (nextCountdown <= 0) {
          get().triggerTimeLoop();
        }
      }
      return;
    }
    const {
      updatedCredits,
      updatedNanocores,
      calculatedMaxEnergy,
      targetUsedEnergy,
      maxShield,
      newShield,
      newHp,
      newTimeMachineGauge,
      updatedShipyardQueue,
      updatedFleet,
      updatedEnemies,
      updatedProjectiles,
      updatedParticles,
      updatedSpawnTimer,
      nextMuteTimer,
      updatedPlanets: finalPlanets,
      nextWave,
      enemiesRemaining
    } = runTickSimulation(state, actualDelta, (msg) => state.addBattleLog(msg), (dmg, type) => state.damageEarth(dmg, type));

    // Get final values from store updated by damageEarth
    const finalState = get();

    set({
      credits: updatedCredits,
      nanocores: updatedNanocores,
      maxEnergy: calculatedMaxEnergy,
      usedEnergy: targetUsedEnergy,
      earthShield: finalState.earthShield,
      earthMaxShield: maxShield,
      earthHp: finalState.earthHp,
      timeMachineGauge: newTimeMachineGauge,
      shipyardQueue: updatedShipyardQueue,
      fleet: updatedFleet,
      enemies: updatedEnemies,
      projectiles: updatedProjectiles,
      particles: updatedParticles,
      enemySpawnTimer: updatedSpawnTimer,
      chronoMuteTimer: nextMuteTimer,
      planets: finalPlanets,
      currentWave: nextWave,
      enemiesRemainingToSpawn: enemiesRemaining,
      satelliteRotation: nextRotation,
      kineticDefenseTowers: finalPlanets[PLANETS.EARTH]?.orbitalSatellitesList?.laser || 0
    });
  }
}));

// Route React Native's Alert.alert to our custom alert store state
Alert.alert = (title, message, buttons) => {
  useGameStore.getState().showAlert(title, message, buttons);
};
