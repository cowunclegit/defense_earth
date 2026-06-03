import { create } from 'zustand';
import { PLANETS, PLANETARY_DATA } from '../constants/planetaryData';

let AsyncStorage;
try {
  // 모바일 디바이스 구동 시 동적 로드, Jest 환경 등에서는 Mock/Fallback 처리
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (e) {
  AsyncStorage = null;
}

if (!AsyncStorage && typeof window !== 'undefined' && window.localStorage) {
  AsyncStorage = {
    setItem: async (key, value) => {
      window.localStorage.setItem(key, value);
    },
    getItem: async (key) => {
      return window.localStorage.getItem(key);
    },
    removeItem: async (key) => {
      window.localStorage.removeItem(key);
    }
  };
}

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

export const SHIP_TYPES = {
  INTERCEPTOR: 'interceptor',
  ESCORT: 'escort',
  DESTROYER: 'destroyer',
  CRUISER: 'cruiser',
  STEALTH: 'stealth',
  ION_BATTLESHIP: 'ionBattleship',
  SHIELD_CARRIER: 'shieldCarrier',
  REPAIR_SHIP: 'repairShip',
  BARRIER_SHIP: 'barrierShip'
};

export const SHIP_SPECS = {
  [SHIP_TYPES.INTERCEPTOR]: {
    name: '무인 요격기 (Interceptor)',
    baseCost: 200,
    baseNanocore: 0,
    baseBuildTime: 5,
    maxHp: 200,
    powerDraw: 2,
    speed: 120,
    range: 80,
    damage: 60,
    cooldown: 1.5,
  },
  [SHIP_TYPES.ESCORT]: {
    name: '방어용 호위함 (Escort Frigate)',
    baseCost: 800,
    baseNanocore: 5,
    baseBuildTime: 15,
    maxHp: 2500,
    powerDraw: 5,
    speed: 80,
    range: 120,
    damage: 100,
    cooldown: 2.0,
  },
  [SHIP_TYPES.DESTROYER]: {
    name: '구축함 (Destroyer)',
    baseCost: 3000,
    baseNanocore: 25,
    baseBuildTime: 40,
    maxHp: 1500,
    powerDraw: 15,
    speed: 50,
    range: 160,
    damage: 350,
    cooldown: 5.0,
  },
  [SHIP_TYPES.CRUISER]: {
    name: '중순양함 (Cruiser)',
    baseCost: 4000,
    baseNanocore: 20,
    baseBuildTime: 30,
    maxHp: 4000,
    powerDraw: 20,
    speed: 40,
    range: 180,
    damage: 600,
    cooldown: 8.0,
  },
  [SHIP_TYPES.STEALTH]: {
    name: '스텔스 암살자 (Stealth Assassin)',
    baseCost: 2500,
    baseNanocore: 15,
    baseBuildTime: 20,
    maxHp: 800,
    powerDraw: 12,
    speed: 100,
    range: 100,
    damage: 800,
    cooldown: 12.0,
  },
  [SHIP_TYPES.ION_BATTLESHIP]: {
    name: '이온 전함 (Ion Battleship)',
    baseCost: 8000,
    baseNanocore: 50,
    baseBuildTime: 60,
    maxHp: 8000,
    powerDraw: 40,
    speed: 30,
    range: 250,
    damage: 1200,
    cooldown: 20.0,
  },
  [SHIP_TYPES.SHIELD_CARRIER]: {
    name: '실드 탱크 함 (Shield Carrier)',
    baseCost: 3500,
    baseNanocore: 18,
    baseBuildTime: 25,
    maxHp: 3000,
    powerDraw: 15,
    speed: 70,
    range: 130,
    damage: 0,
    cooldown: 3.0,
  },
  [SHIP_TYPES.REPAIR_SHIP]: {
    name: '수리함 (Repair Ship)',
    baseCost: 2000,
    baseNanocore: 10,
    baseBuildTime: 18,
    maxHp: 1200,
    powerDraw: 10,
    speed: 60,
    range: 150,
    damage: 0,
    cooldown: 1.0,
  },
  [SHIP_TYPES.BARRIER_SHIP]: {
    name: '포스 배리어 함 (Barrier Ship)',
    baseCost: 3000,
    baseNanocore: 15,
    baseBuildTime: 22,
    maxHp: 2000,
    powerDraw: 15,
    speed: 50,
    range: 120,
    damage: 0,
    cooldown: 5.0,
  }
};

export const GROUND_BASE_SPECS = {
  railgun: { name: '대함 레일건 요새', cost: 100, energy: 10, isWeapon: true, dmg: 200, cd: 5.0, maxCount: 8 },
  energyCannon: { name: '지대공 에너지 캐논', cost: 80, energy: 5, isWeapon: true, dmg: 80, cd: 2.0, maxCount: 8 },
  missileSilo: { name: '지상 요격 미사일 사일로', cost: 120, energy: 8, isWeapon: true, dmg: 120, cd: 3.0, maxCount: 8 },
  plasmaBomber: { name: '플라즈마 폭격기', cost: 250, energy: 12, isWeapon: true, dmg: 250, cd: 7.0, maxCount: 8 },
  electricTurret: { name: '전기 방출 포탑', cost: 150, energy: 10, isWeapon: true, dmg: 150, cd: 4.0, maxCount: 8 },
  sniperCannon: { name: '초전도 스나이퍼 캐논', cost: 350, energy: 15, isWeapon: true, dmg: 350, cd: 10.0, maxCount: 8 },
  gatling: { name: '속사 개틀링 포탑', cost: 30, energy: 6, isWeapon: true, dmg: 30, cd: 0.4, maxCount: 8 },
  nuclearTorpedo: { name: '핵 어뢰 사일로', cost: 800, energy: 25, isWeapon: true, dmg: 800, cd: 30.0, maxCount: 8 },
  forceShield: { name: '지상 포스필드 배리어', cost: 150, energy: 10, isWeapon: false, maxCount: 8 },
  ciws: { name: '미사일 방어막 (CIWS)', cost: 100, energy: 8, isWeapon: true, dmg: 50, cd: 0.8, maxCount: 8 },
  armor: { name: '강화 장갑 플레이팅', cost: 100, energy: 0, isWeapon: false, maxCount: 8 }
};

export const SATELLITE_SPECS = {
  laser: { name: '타겟팅 레이저 위성', cost: 200, energy: 5, isWeapon: true, dmg: 120, cd: 3.0 },
  plasmaLaser: { name: '플라즈마 레이저 위성', cost: 180, energy: 8, isWeapon: true, dmg: 180, cd: 5.0 },
  emp: { name: 'EMP 위성', cost: 150, energy: 7, isWeapon: true, dmg: 0, cd: 6.0 },
  clusterMissile: { name: '클러스터 미사일 위성', cost: 250, energy: 10, isWeapon: true, dmg: 90, cd: 8.0 },
  gravityBomb: { name: '중력 포탄 위성', cost: 160, energy: 9, isWeapon: true, dmg: 160, cd: 6.0 },
  antimatter: { name: '반물질 포 위성', cost: 400, energy: 15, isWeapon: true, dmg: 400, cd: 15.0 },
  sensor: { name: '조기 경보 센서 위성', cost: 150, energy: 8, isWeapon: false },
  forceShield: { name: '포스 실드 위성', cost: 250, energy: 12, isWeapon: false },
  decoy: { name: '디코이 위성', cost: 100, energy: 5, isWeapon: false },
  repairDrone: { name: '수리 드론 위성', cost: 200, energy: 10, isWeapon: false }
};

export const STATION_SPECS = {
  aegisShield: { name: '행성 보호막 발생기 (Aegis)', cost: 4000, nanocores: 10, energy: 25 },
  gigaPlasma: { name: '기가 플라즈마포 (EMP)', cost: 5000, nanocores: 15, energy: 30, cd: 20.0 },
  gravityDistorter: { name: '중력 왜곡기', cost: 4500, nanocores: 12, energy: 25 }
};

export const SHIELD_MODULE_SPECS = {
  basic: { name: '기본 포스필드', capacityBonus: 500, regenBonus: 10, energyCost: 5, cost: 0 },
  plasma: { name: '강화 플라즈마 실드', capacityBonus: 1500, regenBonus: 25, energyCost: 15, cost: 1000 },
  dual: { name: '이중 레이어 배리어', capacityBonus: 3000, regenBonus: 40, energyCost: 30, cost: 3000 },
  reflect: { name: '반사 에너지 실드', capacityBonus: 2000, regenBonus: 20, energyCost: 25, cost: 2500 },
  phase: { name: '위상 실드 (Phase)', capacityBonus: 4000, regenBonus: 50, energyCost: 50, cost: 5000 },
  repair: { name: '나노 수리 실드', capacityBonus: 1000, regenBonus: 15, energyCost: 10, cost: 2000 }
};

export const COUNTERATTACK_MODULE_SPECS = {
  reflector: { name: '실드 반사포', energyCost: 10, cost: 2000 },
  discharge: { name: '과부하 방전', energyCost: 10, cost: 2000 },
  electricField: { name: '전기장 역류', energyCost: 15, cost: 2500 }
};

export const ALIEN_TYPES = {
  SCOUT: 'scout',
  RAIDER: 'raider',
  DESTROYER: 'destroyer',
  BOSS_APOCALYPSE: 'boss_apocalypse',
  BOSS_CHRONO: 'boss_chrono'
};

const ALIEN_SPECS = {
  [ALIEN_TYPES.SCOUT]: {
    name: '외계 정찰기',
    maxHp: 80,
    speed: 60,
    attackType: 'energy',
    damage: 8,
    cooldown: 2.0,
    creditReward: 50,
    coreChance: 0.05,
  },
  [ALIEN_TYPES.RAIDER]: {
    name: '외계 약탈함',
    maxHp: 220,
    speed: 40,
    attackType: 'kinetic',
    damage: 18,
    cooldown: 3.0,
    creditReward: 150,
    coreChance: 0.15,
  },
  [ALIEN_TYPES.DESTROYER]: {
    name: '외계 아머 멜터',
    maxHp: 650,
    speed: 25,
    attackType: 'energy',
    damage: 40,
    cooldown: 4.5,
    creditReward: 400,
    coreChance: 0.35,
  },
  [ALIEN_TYPES.BOSS_APOCALYPSE]: {
    name: '보스: 아포칼립스 파괴함',
    maxHp: 3500,
    speed: 12,
    attackType: 'energy',
    damage: 150,
    cooldown: 7.0,
    creditReward: 2000,
    coreChance: 1.0,
  },
  [ALIEN_TYPES.BOSS_CHRONO]: {
    name: '보스: 크로노 디바우러',
    maxHp: 8500,
    speed: 8,
    attackType: 'kinetic',
    damage: 220,
    cooldown: 9.0,
    creditReward: 5000,
    coreChance: 1.0,
  }
};

const EARTH_CENTER_X = 270;
const EARTH_CENTER_Y = 270;
const SHIELD_RADIUS = 100;
const ENEMY_SPAWN_RADIUS = 750;

const calculateSynergies = (planets, chronosUpgrades) => {
  const synergies = {
    creditMultiplier: 1.0,
    shieldRegenMultiplier: 1.0,
    shipBuildCostMultiplier: 1.0,
    shipBuildSpeedMultiplier: 1.0,
    energyProductionMultiplier: 1.0,
    towerMaintenanceCostMultiplier: 1.0,
    towerRangeMultiplier: 1.0,
    radarEnabled: false,
    slowTowerRangeMultiplier: 1.0,
    slowTowerEffectMultiplier: 1.0,
    orbitalStationWeaponSlotsBonus: 0,
    towerCooldownMultiplier: 1.0,
    warningTimeBonusSeconds: 0,
    enemySpeedMultiplier: 1.0,
    timeMachineChargeSpeedMultiplier: 1.0,
  };

  synergies.creditMultiplier += chronosUpgrades.creditGen * 0.1;
  synergies.energyProductionMultiplier += chronosUpgrades.energyGen * 0.1;
  synergies.shieldRegenMultiplier += chronosUpgrades.shieldRegen * 0.15;
  synergies.timeMachineChargeSpeedMultiplier += chronosUpgrades.timeMachineSpeed * 0.15;

  Object.keys(planets).forEach((planetId) => {
    const planet = planets[planetId];
    if (planet.terraformProgress >= 80) {
      const data = PLANETARY_DATA[planetId];
      if (data && data.applySynergy) {
        data.applySynergy(synergies);
      }
    }
  });

  return synergies;
};

export const recalculateUsedEnergyState = (state) => {
  let defensePowerDraw = 0;
  Object.values(state.planets).forEach(p => {
    if (p.unlocked) {
      if (p.groundBasesList) {
        Object.keys(p.groundBasesList).forEach(type => {
          const count = p.groundBasesList[type] || 0;
          const spec = GROUND_BASE_SPECS[type];
          if (spec) defensePowerDraw += count * spec.energy;
        });
      }
      if (p.orbitalSatellitesList) {
        Object.keys(p.orbitalSatellitesList).forEach(type => {
          const count = p.orbitalSatellitesList[type] || 0;
          const spec = SATELLITE_SPECS[type];
          if (spec) defensePowerDraw += count * spec.energy;
        });
      }
      if (p.orbitalStationsList) {
        Object.keys(p.orbitalStationsList).forEach(type => {
          if (p.orbitalStationsList[type] > 0) {
            const spec = STATION_SPECS[type];
            if (spec) defensePowerDraw += spec.energy;
          }
        });
      }
      defensePowerDraw += (p.shipyard || 0) * 15;
    }
  });

  let shieldPowerDraw = 0;
  const activeModuleSpec = SHIELD_MODULE_SPECS[state.shieldModule || 'basic'];
  if (activeModuleSpec) shieldPowerDraw += activeModuleSpec.energyCost;
  Object.keys(state.counterattackModules || {}).forEach(key => {
    if (state.counterattackModules[key]) {
      const cs = COUNTERATTACK_MODULE_SPECS[key];
      if (cs) shieldPowerDraw += cs.energyCost;
    }
  });

  const shipyardPowerDraw = state.shipyardQueue ? 10 : 0;
  
  let repairCount = 0;
  if (state.fleet) {
    state.fleet.forEach(ship => { if (ship.hp < ship.maxHp) repairCount++; });
  }
  const repairPowerDraw = repairCount * 3;

  return shipyardPowerDraw + repairPowerDraw + defensePowerDraw + shieldPowerDraw;
};

export const useGameStore = create((set, get) => ({
  credits: 1000,
  maxEnergy: 100,
  usedEnergy: 20,
  nanocores: 0,
  timeParticles: 0,
  cheatEnergyBonus: 0,

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

  // --- QoL 자동화 편의 옵션 (Phase 5) ---
  autoTerraform: false,
  autoBuildTowers: false,
  
  // --- 모의 BM 프리미엄 패스 상태 (Phase 5) ---
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

  unlockPlanet: (planetId) => set((state) => {
    const planetData = PLANETARY_DATA[planetId];
    if (!planetData || state.currentWave < planetData.unlockWave || state.planets[planetId].unlocked) return {};

    const updatedPlanets = {
      ...state.planets,
      [planetId]: { ...state.planets[planetId], unlocked: true }
    };
    return {
      planets: updatedPlanets,
      synergies: calculateSynergies(updatedPlanets, state.chronosUpgrades)
    };
  }),

  upgradePlanetTerraform: (planetId) => {
    const state = get();
    const planet = state.planets[planetId];
    const data = PLANETARY_DATA[planetId];
    if (!planet || !data || !planet.unlocked || planet.terraformProgress >= 100) return false;

    const costCredit = Math.floor(data.terraformCredit * 0.1);
    const costEnergy = Math.floor(data.terraformEnergy * 0.1);
    const availableEnergy = state.maxEnergy - state.usedEnergy;

    if (state.credits < costCredit || availableEnergy < costEnergy) return false;

    const updatedProgress = Math.min(100, planet.terraformProgress + 10);
    const updatedPopulation = Math.floor((updatedProgress / 100) * data.maxPopulation);

    const updatedPlanets = {
      ...state.planets,
      [planetId]: {
        ...planet,
        terraformProgress: updatedProgress,
        population: updatedPopulation
      }
    };

    set({
      credits: state.credits - costCredit,
      usedEnergy: state.usedEnergy + costEnergy,
      planets: updatedPlanets,
      synergies: calculateSynergies(updatedPlanets, state.chronosUpgrades)
    });
    return true;
  },

  buildGroundBaseDetail: (planetId, type) => {
    return false;
  },

  buildGroundBase: (planetId) => {
    return false;
  },

  buildOrbitalSatelliteDetail: (planetId, type) => {
    const state = get();
    const planet = state.planets[planetId];
    if (!planet || !planet.unlocked) return false;

    const currentTotal = planet.orbitalSatellites || 0;
    if (currentTotal >= 5) return false;

    const spec = SATELLITE_SPECS[type];
    if (!spec) return false;

    const cost = spec.cost;
    const energyCost = spec.energy;

    if (state.credits < cost || state.getAvailableEnergy() < energyCost) return false;

    const currentCount = planet.orbitalSatellitesList[type] || 0;
    const updatedPlanets = {
      ...state.planets,
      [planetId]: {
        ...planet,
        orbitalSatellites: currentTotal + 1,
        orbitalSatellitesList: {
          ...planet.orbitalSatellitesList,
          [type]: currentCount + 1
        }
      }
    };

    const updatedKineticDefenseTowers = (type === 'laser' && planetId === 'earth')
      ? (currentCount + 1)
      : state.kineticDefenseTowers;

    set({
      credits: state.credits - cost,
      usedEnergy: state.usedEnergy + energyCost,
      planets: updatedPlanets,
      kineticDefenseTowers: updatedKineticDefenseTowers
    });

    state.addBattleLog(`${PLANETARY_DATA[planetId].name} 궤도에 ${spec.name}을 배치했습니다.`);
    return true;
  },

  buildOrbitalSatellite: (planetId) => {
    return get().buildOrbitalSatelliteDetail(planetId, 'laser');
  },

  buildOrbitalStationDetail: (planetId, type) => {
    const state = get();
    const planet = state.planets[planetId];
    if (!planet || !planet.unlocked) return false;

    const currentTotal = planet.orbitalStations || 0;
    if (currentTotal >= 3) return false;

    const spec = STATION_SPECS[type];
    if (!spec) return false;

    const currentCount = planet.orbitalStationsList[type] || 0;
    if (currentCount >= 1) return false;

    const cost = spec.cost;
    const nanocoreCost = spec.nanocores;
    const energyCost = spec.energy;

    if (state.credits < cost || state.nanocores < nanocoreCost || state.getAvailableEnergy() < energyCost) return false;

    const updatedPlanets = {
      ...state.planets,
      [planetId]: {
        ...planet,
        orbitalStations: currentTotal + 1,
        orbitalStationsList: {
          ...planet.orbitalStationsList,
          [type]: 1
        }
      }
    };

    set({
      credits: state.credits - cost,
      nanocores: state.nanocores - nanocoreCost,
      usedEnergy: state.usedEnergy + energyCost,
      planets: updatedPlanets
    });

    state.addBattleLog(`${PLANETARY_DATA[planetId].name} 궤도에 ${spec.name}을 건조했습니다.`);
    return true;
  },

  buildOrbitalStation: (planetId) => {
    return get().buildOrbitalStationDetail(planetId, 'aegisShield');
  },

  buildShipyard: (planetId) => {
    const state = get();
    const planet = state.planets[planetId];
    if (!planet || !planet.unlocked || (planet.shipyard || 0) >= 1) return false;

    const cost = 3000;
    const nanocoreCost = 5;
    const energyCost = 15;

    if (state.credits < cost || state.nanocores < nanocoreCost || state.getAvailableEnergy() < energyCost) return false;

    const updatedPlanets = {
      ...state.planets,
      [planetId]: {
        ...planet,
        shipyard: 1
      }
    };

    set({
      credits: state.credits - cost,
      nanocores: state.nanocores - nanocoreCost,
      usedEnergy: state.usedEnergy + energyCost,
      planets: updatedPlanets
    });

    state.addBattleLog(`${PLANETARY_DATA[planetId].name} 궤도 쉽야드를 건설했습니다.`);
    return true;
  },

  changeShieldModule: (moduleType) => {
    const state = get();
    const spec = SHIELD_MODULE_SPECS[moduleType];
    if (!spec) return false;

    if (state.credits < spec.cost) return false;

    const oldSpec = SHIELD_MODULE_SPECS[state.shieldModule || 'basic'];
    const oldEnergy = oldSpec ? oldSpec.energyCost : 0;
    const newEnergy = spec.energyCost;
    
    const availableEnergy = state.maxEnergy - state.usedEnergy + oldEnergy;
    if (availableEnergy < newEnergy) return false;

    set({
      shieldModule: moduleType,
      credits: state.credits - spec.cost,
      usedEnergy: state.usedEnergy - oldEnergy + newEnergy
    });

    state.addBattleLog(`행성 실드 발생기 모듈을 [${spec.name}]으로 교체했습니다.`);
    return true;
  },

  toggleCounterattackModule: (moduleType) => {
    const state = get();
    const spec = COUNTERATTACK_MODULE_SPECS[moduleType];
    if (!spec) return false;

    const currentlyActive = state.counterattackModules[moduleType];
    const energyCost = spec.energyCost;

    if (currentlyActive) {
      set((s) => ({
        counterattackModules: {
          ...s.counterattackModules,
          [moduleType]: false
        },
        usedEnergy: s.usedEnergy - energyCost
      }));
      state.addBattleLog(`반격 모듈 [${spec.name}]을 비활성화했습니다.`);
    } else {
      const cost = spec.cost;
      if (state.credits < cost) return false;
      if (state.getAvailableEnergy() < energyCost) return false;

      set((s) => ({
        credits: s.credits - cost,
        counterattackModules: {
          ...s.counterattackModules,
          [moduleType]: true
        },
        usedEnergy: s.usedEnergy + energyCost
      }));
      state.addBattleLog(`반격 모듈 [${spec.name}]을 활성화했습니다.`);
    }
    return true;
  },

  buildKineticTower: () => {
    const state = get();
    return state.buildOrbitalSatelliteDetail('earth', 'laser');
  },

  buyResearchUpgrade: (researchKey) => set((state) => {
    if (state.researchUpgrades[researchKey]) return {};
    
    const cost = 15;
    if (state.nanocores < cost) return {};

    return {
      nanocores: state.nanocores - cost,
      researchUpgrades: {
        ...state.researchUpgrades,
        [researchKey]: true
      }
    };
  }),

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
  },

  setFleetReservation: (shipType, count) => set((state) => {
    const updatedSlots = { ...state.fleetSlots, [shipType]: Math.max(0, count) };
    return { fleetSlots: updatedSlots };
  }),

  cheatCredits: (amount) => set((state) => ({ credits: state.credits + amount })),
  cheatNanocores: (amount) => set((state) => ({ nanocores: state.nanocores + amount })),
  cheatTimeParticles: (amount) => set((state) => ({ timeParticles: state.timeParticles + amount })),
  cheatTimeMachineMax: () => set({ timeMachineGauge: 100 }),
  cheatAdvanceWaves: (amount) => set((state) => {
    const nextWave = state.currentWave + amount;
    const isBoss = nextWave % 10 === 0;
    return {
      currentWave: nextWave,
      enemiesRemainingToSpawn: isBoss ? 1 : (3 + nextWave) * 2
    };
  }),
  cheatMaxEnergy: (amount) => set((state) => {
    console.log("cheatMaxEnergy called with", amount, "current maxEnergy", state.maxEnergy, "current cheatEnergyBonus", state.cheatEnergyBonus);
    return {
      cheatEnergyBonus: state.cheatEnergyBonus + amount,
      maxEnergy: state.maxEnergy + amount
    };
  }),

  resetDatabase: async () => {
    if (AsyncStorage) {
      try {
        await AsyncStorage.removeItem('DEFENSE_EARTH_SAVE');
      } catch (e) {
        // 무시
      }
    }
    const cleanPlanets = JSON.parse(JSON.stringify(initialPlanetsState));
    const cleanChronos = { ...initialChronosUpgrades };
    const cleanSynergies = calculateSynergies(cleanPlanets, cleanChronos);

    set({
      credits: 1000,
      maxEnergy: 100,
      usedEnergy: 20,
      nanocores: 0,
      timeParticles: 0,
      cheatEnergyBonus: 0,
      earthHp: 100,
      earthMaxHp: 100,
      earthShield: 100,
      earthMaxShield: 100,
      earthShieldRechargeRate: 5,
      kineticDefenseTowers: 0,
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
      planets: cleanPlanets,
      chronosUpgrades: cleanChronos,
      synergies: cleanSynergies,
      researchUpgrades: {
        beamConversion: false,
        selfRepair: false,
        tachionTargeting: false
      },
      autoTerraform: false,
      autoBuildTowers: false,
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
      battleLogs: []
    });

    get().addBattleLog('데이터베이스(세이브)가 초기화되었습니다.');
  },

  buyChronosUpgrade: (upgradeKey) => set((state) => {
    const currentLevel = state.chronosUpgrades[upgradeKey];
    if (currentLevel === undefined) return {};
    
    const cost = Math.pow(3, currentLevel) * 5;
    if (state.timeParticles < cost) return {};

    const updatedUpgrades = { ...state.chronosUpgrades, [upgradeKey]: currentLevel + 1 };

    return {
      timeParticles: state.timeParticles - cost,
      chronosUpgrades: updatedUpgrades,
      synergies: calculateSynergies(state.planets, updatedUpgrades)
    };
  }),

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

  // --- AsyncStorage 기반 로컬 영구 세이브 저장/로드 (Phase 5) ---
  saveGame: async () => {
    if (!AsyncStorage) return;
    const state = get();
    const saveObj = {
      credits: state.credits,
      nanocores: state.nanocores,
      timeParticles: state.timeParticles,
      earthHp: state.earthHp,
      earthShield: state.earthShield,
      kineticDefenseTowers: state.kineticDefenseTowers,
      currentWave: state.currentWave,
      planets: state.planets,
      chronosUpgrades: state.chronosUpgrades,
      researchUpgrades: state.researchUpgrades,
      fleetSlots: state.fleetSlots,
      isPremium: state.isPremium,
      autoTerraform: state.autoTerraform,
      autoBuildTowers: state.autoBuildTowers,
      shieldModule: state.shieldModule,
      counterattackModules: state.counterattackModules
    };
    try {
      await AsyncStorage.setItem('DEFENSE_EARTH_SAVE', JSON.stringify(saveObj));
    } catch (e) {
      // 에러 로그 무시
    }
  },

  loadGame: async () => {
    if (!AsyncStorage) return;
    try {
      const dataStr = await AsyncStorage.getItem('DEFENSE_EARTH_SAVE');
      if (dataStr) {
        const loaded = JSON.parse(dataStr);
        const nextState = {
          ...loaded,
          synergies: calculateSynergies(loaded.planets, loaded.chronosUpgrades)
        };
        nextState.usedEnergy = recalculateUsedEnergyState(nextState);
        set(nextState);
        get().addBattleLog('로컬 저장 데이터를 복구했습니다.');
      }
    } catch (e) {
      // 로드 에러 무시
    }
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
          // 지구 파괴용 파티클은 조금 더 부드럽고 오래 가도록 천천히 감쇠시킴
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
    const updatedPlanets = JSON.parse(JSON.stringify(state.planets));

    // 0. 크로노 마비 (시간정지) 디버프 갱신
    let nextMuteTimer = Math.max(0, state.chronoMuteTimer - actualDelta);
    const isMuted = nextMuteTimer > 0;

    // 1. 자원 수확
    let totalPopulation = 0;
    Object.values(updatedPlanets).forEach((p) => {
      if (p.unlocked) totalPopulation += p.population;
    });

    const baseCreditRate = 10 + (totalPopulation * 0.00001);
    const earnedCredits = baseCreditRate * state.synergies.creditMultiplier * actualDelta;

    let baseEnergy = 100;
    Object.keys(updatedPlanets).forEach((planetId) => {
      const p = updatedPlanets[planetId];
      if (p.unlocked && planetId !== PLANETS.EARTH) {
        baseEnergy += (p.terraformProgress / 100) * 50;
      }
    });
    const calculatedMaxEnergy = Math.floor(baseEnergy * state.synergies.energyProductionMultiplier);

    const baseNanocoreRate = state.chronosUpgrades.nanocoreGen * 0.1;
    const earnedNanocores = baseNanocoreRate * actualDelta;

    let updatedCredits = state.credits + earnedCredits;
    let updatedNanocores = state.nanocores + earnedNanocores;

    let updatedEnemies = [...state.enemies];
    let updatedProjectiles = [...state.projectiles];
    let updatedParticles = [...state.particles];
    let updatedFleet = [...state.fleet];

    // --- Helper function to claim kill rewards ---
    const checkAndLogEnemyKill = (enemy) => {
      updatedCredits += enemy.spec.creditReward;
      const lvlStr = `[Lv.${enemy.level || 1}]`;
      if (enemy.type === ALIEN_TYPES.BOSS_APOCALYPSE) {
        updatedNanocores += 5;
        state.addBattleLog(`${lvlStr} [아포칼립스 파괴함] 완벽 분쇄! 외계 나노코어 5개 회수.`);
      } else if (enemy.type === ALIEN_TYPES.BOSS_CHRONO) {
        updatedNanocores += 15;
        state.addBattleLog(`${lvlStr} [크로노 디바우러] 완벽 분쇄! 외계 나노코어 15개 회수.`);
      } else if (Math.random() <= enemy.spec.coreChance) {
        updatedNanocores += 1;
        state.addBattleLog(`${lvlStr} 적 격침! 외계 나노코어 획득.`);
      } else {
        state.addBattleLog(`${lvlStr} 적군 ${enemy.spec.name} 파괴 성공.`);
      }

      updatedParticles.push({
        id: Math.random().toString(),
        x: enemy.x,
        y: enemy.y,
        radius: 4,
        maxRadius: enemy.type.startsWith('boss') ? 70 : 35,
        alpha: 1.0,
        color: '#ff4400'
      });
    };

    // --- 지상 방어 기지 및 위성 공격 시뮬레이션 ---
    Object.keys(updatedPlanets).forEach((planetId) => {
      const p = updatedPlanets[planetId];
      if (!p.unlocked) return;

      // Initialize lists/timers if missing (safeguard)
      if (!p.groundBasesList) p.groundBasesList = {};
      if (!p.groundBaseTimers) p.groundBaseTimers = {};
      if (!p.orbitalSatellitesList) p.orbitalSatellitesList = {};
      if (!p.satelliteTimers) p.satelliteTimers = {};
      if (!p.orbitalStationsList) p.orbitalStationsList = {};
      if (!p.stationTimers) p.stationTimers = {};

      // 1. 지상 방어 기지 공격 [폐지]
      // 지상 기지는 모두 없애고 궤도 위성으로 일원화하므로 틱 공격 처리를 하지 않습니다.

      // 2. CIWS (미사일 방어막) 요격 로직 (지상 ciws 대신 decoy 위성 개수를 참조하여 요격)
      const ciwsCount = p.orbitalSatellitesList.decoy || 0;
      if (ciwsCount > 0) {
        let ciwsTimer = p.groundBaseTimers.ciws_intercept || 0;
        if (ciwsTimer > 0) {
          p.groundBaseTimers.ciws_intercept = Math.max(0, ciwsTimer - actualDelta);
        }
        if (p.groundBaseTimers.ciws_intercept <= 0) {
          const enemyProjIndex = updatedProjectiles.findIndex(proj => proj.isEnemy);
          if (enemyProjIndex >= 0) {
            const proj = updatedProjectiles[enemyProjIndex];
            updatedProjectiles.splice(enemyProjIndex, 1);
            p.groundBaseTimers.ciws_intercept = 0.8 / ciwsCount;
            state.addBattleLog(`CIWS 요격 작동: 적 포탄 차단.`);
            updatedParticles.push({
              id: Math.random().toString(),
              x: proj.x,
              y: proj.y,
              radius: 1,
              maxRadius: 15,
              alpha: 1.0,
              color: '#00f0ff'
            });
          }
        }
      }

      // 3. 궤도 위성 공격
      const earthSatellites = [];
      if (p.orbitalSatellitesList) {
        Object.keys(p.orbitalSatellitesList).forEach((t) => {
          const c = p.orbitalSatellitesList[t] || 0;
          for (let i = 0; i < c; i++) {
            earthSatellites.push({ type: t, globalIndex: earthSatellites.length });
          }
        });
      }

      Object.keys(p.orbitalSatellitesList).forEach((type) => {
        const count = p.orbitalSatellitesList[type] || 0;
        if (count <= 0) return;

        const spec = SATELLITE_SPECS[type];
        if (!spec || !spec.isWeapon) return;

        let timer = p.satelliteTimers[type] || 0;
        if (timer > 0) {
          p.satelliteTimers[type] = Math.max(0, timer - actualDelta);
        }

        if (p.satelliteTimers[type] <= 0 && updatedEnemies.length > 0) {
          p.satelliteTimers[type] = spec.cd;

          const matchingSats = earthSatellites.filter(sat => sat.type === type);
          matchingSats.forEach((sat) => {
            const target = updatedEnemies[Math.floor(Math.random() * updatedEnemies.length)];
            if (target) {
              const dmg = spec.dmg;
              target.hp -= dmg;

              state.addBattleLog(`${PLANETARY_DATA[planetId].name} 위성 ${spec.name} 공격! (데미지 ${dmg})`);

              if (type === 'emp') {
                target.stunTimer = 3.0;
              } else if (type === 'gravityBomb') {
                target.slowTimer = 3.0;
                target.slowAmount = 0.4;
              } else if (type === 'clusterMissile') {
                target.hp -= spec.dmg * 2;
              }

              // 위성 위치 계산
              const currentRotation = nextRotation % 360;
              const baseAngle = (360 / earthSatellites.length) * sat.globalIndex;
              const angleDeg = baseAngle + currentRotation;
              const angleRad = (angleDeg * Math.PI) / 180;
              const orbitRadius = 125;
              const satX = EARTH_CENTER_X + orbitRadius * Math.cos(angleRad);
              const satY = EARTH_CENTER_Y + orbitRadius * Math.sin(angleRad);

              const dx = target.x - satX;
              const dy = target.y - satY;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const speed = 400;
              const vx = dist > 0 ? (dx / dist) * speed : 0;
              const vy = dist > 0 ? (dy / dist) * speed : 0;

              updatedProjectiles.push({
                id: Math.random().toString(),
                type: 'energy',
                x: satX,
                y: satY,
                vx: vx,
                vy: vy,
                damage: 0,
                isEnemy: false
              });
            }
          });
        }
      });

      // 4. 기가 플라즈마 주포 공격
      if (p.orbitalStationsList && p.orbitalStationsList.gigaPlasma > 0) {
        let timer = p.stationTimers.gigaPlasma || 0;
        if (timer > 0) {
          p.stationTimers.gigaPlasma = Math.max(0, timer - actualDelta);
        }
        if (p.stationTimers.gigaPlasma <= 0 && updatedEnemies.length > 0) {
          p.stationTimers.gigaPlasma = 20.0;
          state.addBattleLog(`${PLANETARY_DATA[planetId].name} 궤도 기지 기가 플라즈마 주포 발사!`);
          updatedEnemies.forEach(e => {
            e.hp -= 500;
            e.stunTimer = 5.0;
          });
          updatedParticles.push({
            id: Math.random().toString(),
            x: EARTH_CENTER_X,
            y: EARTH_CENTER_Y,
            radius: 5,
            maxRadius: 100,
            alpha: 1.0,
            color: '#00f0ff'
          });
        }
      }
    });

    // Clean up dead enemies immediately
    updatedEnemies = updatedEnemies.filter(enemy => {
      if (enemy.hp <= 0) {
        checkAndLogEnemyKill(enemy);
        return false;
      }
      return true;
    });

    // 2. 에너지 실드 충전
    const maxShield = state.getShieldCapacity();
    let newShield = state.earthShield;
    
    let totalSatellites = 0;
    Object.values(updatedPlanets).forEach(p => {
      if (p.unlocked) {
        totalSatellites += (p.orbitalSatellites || 0);
      }
    });
    const satelliteBonus = 1 + totalSatellites * 0.1;

    const activeModuleSpec = SHIELD_MODULE_SPECS[state.shieldModule || 'basic'];
    const baseRegen = activeModuleSpec ? activeModuleSpec.regenBonus : 5;
    const shieldRegen = baseRegen * state.synergies.shieldRegenMultiplier * satelliteBonus * actualDelta;
    const isPowerShortage = state.usedEnergy > calculatedMaxEnergy;
    const actualRegen = isPowerShortage ? (shieldRegen * 0.5) : shieldRegen;

    if (newShield < maxShield) {
      newShield = Math.min(maxShield, newShield + actualRegen);
    }

    // --- Nano Repair Shield passive recovery ---
    let newHp = state.earthHp;
    if (state.shieldModule === 'repair' && newShield > 0 && newHp < state.earthMaxHp) {
      newHp = Math.min(state.earthMaxHp, newHp + 5 * actualDelta);
    }

    // --- Shield Collapse Actions (Discharge and Nano Repair burst) ---
    const isShieldCollapsed = state.earthShield > 0 && newShield <= 0;
    if (isShieldCollapsed) {
      if (state.counterattackModules.discharge && updatedEnemies.length > 0) {
        state.addBattleLog(`실드 과부하 방전 발동! 모든 적에게 200 광역 피해!`);
        updatedEnemies.forEach(e => {
          e.hp -= 200;
        });
        updatedEnemies = updatedEnemies.filter(enemy => {
          if (enemy.hp <= 0) {
            checkAndLogEnemyKill(enemy);
            return false;
          }
          return true;
        });
        updatedParticles.push({
          id: Math.random().toString(),
          x: EARTH_CENTER_X,
          y: EARTH_CENTER_Y,
          radius: SHIELD_RADIUS,
          maxRadius: 200,
          alpha: 1.0,
          color: '#00f0ff'
        });
      }
      if (state.shieldModule === 'repair') {
        newHp = Math.min(state.earthMaxHp, newHp + 20);
        state.addBattleLog(`나노 수리 실드 작동: 지구 HP 20 즉시 복구.`);
      }
    }

    // --- Electric Field continuous damage ---
    if (state.counterattackModules.electricField && newShield > 0 && updatedEnemies.length > 0) {
      updatedEnemies.forEach(e => {
        e.hp -= 80 * actualDelta;
      });
      updatedEnemies = updatedEnemies.filter(enemy => {
        if (enemy.hp <= 0) {
          checkAndLogEnemyKill(enemy);
          return false;
        }
        return true;
      });
    }

    // Synchronize shield & hp in store before projectile collisions
    set({ earthShield: newShield, earthHp: newHp });

    // 3. 타임머신 충전
    const timeMachineRate = 0.1 * state.synergies.timeMachineChargeSpeedMultiplier * actualDelta;
    const newTimeMachineGauge = Math.min(100, state.timeMachineGauge + timeMachineRate);

    // 4. 함대 재생산 및 수리 전력 소모 연산
    let updatedShipyardQueue = state.shipyardQueue;
    
    let repairCount = 0;
    updatedFleet.forEach(ship => { if (ship.hp < ship.maxHp) repairCount++; });
    const repairPowerDraw = repairCount * 3;
    const shipyardPowerDraw = updatedShipyardQueue ? 10 : 0;
    
    let defensePowerDraw = 0;
    Object.values(updatedPlanets).forEach(p => {
      if (p.unlocked) {
        if (p.groundBasesList) {
          Object.keys(p.groundBasesList).forEach(type => {
            const count = p.groundBasesList[type] || 0;
            const spec = GROUND_BASE_SPECS[type];
            if (spec) defensePowerDraw += count * spec.energy;
          });
        } else {
          defensePowerDraw += (p.groundBases || 0) * 10;
        }
        
        if (p.orbitalSatellitesList) {
          Object.keys(p.orbitalSatellitesList).forEach(type => {
            const count = p.orbitalSatellitesList[type] || 0;
            const spec = SATELLITE_SPECS[type];
            if (spec) defensePowerDraw += count * spec.energy;
          });
        } else {
          defensePowerDraw += (p.orbitalSatellites || 0) * 5;
        }

        if (p.orbitalStationsList) {
          Object.keys(p.orbitalStationsList).forEach(type => {
            if (p.orbitalStationsList[type] > 0) {
              const spec = STATION_SPECS[type];
              if (spec) defensePowerDraw += spec.energy;
            }
          });
        } else {
          defensePowerDraw += (p.orbitalStations || 0) * 25;
        }

        defensePowerDraw += (p.shipyard || 0) * 15;
      }
    });

    let shieldPowerDraw = 0;
    if (activeModuleSpec) shieldPowerDraw += activeModuleSpec.energyCost;
    Object.keys(state.counterattackModules).forEach(key => {
      if (state.counterattackModules[key]) {
        const cs = COUNTERATTACK_MODULE_SPECS[key];
        if (cs) shieldPowerDraw += cs.energyCost;
      }
    });

    const targetUsedEnergy = shipyardPowerDraw + repairPowerDraw + defensePowerDraw + shieldPowerDraw;

    if (updatedShipyardQueue) {
      const buildSpeed = state.synergies.shipBuildSpeedMultiplier;
      const newProgress = updatedShipyardQueue.progress + actualDelta * buildSpeed;

      if (newProgress >= updatedShipyardQueue.totalTime) {
        const spec = SHIP_SPECS[updatedShipyardQueue.type];
        const angle = Math.random() * Math.PI - Math.PI;
        const radius = 120 + Math.random() * 20;

        updatedFleet.push({
          id: Math.random().toString(),
          type: updatedShipyardQueue.type,
          x: EARTH_CENTER_X + Math.cos(angle) * radius,
          y: EARTH_CENTER_Y + Math.sin(angle) * radius,
          angle: angle,
          hp: spec.maxHp,
          maxHp: spec.maxHp,
          cooldownTimer: 0,
          targetEnemyId: null
        });
        state.addBattleLog(`${spec.name} 자동 건조 배치 완료.`);
        updatedShipyardQueue = null;
      } else {
        updatedShipyardQueue = { ...updatedShipyardQueue, progress: newProgress };
      }
    } else {
      const shipCounts = {};
      Object.values(SHIP_TYPES).forEach(type => { shipCounts[type] = 0; });
      updatedFleet.forEach(ship => { if (shipCounts[ship.type] !== undefined) shipCounts[ship.type]++; });

      let targetShipToBuild = null;
      for (const type of Object.values(SHIP_TYPES)) {
        if ((shipCounts[type] || 0) < (state.fleetSlots[type] || 0)) {
          targetShipToBuild = type;
          break;
        }
      }

      if (targetShipToBuild) {
        const spec = SHIP_SPECS[targetShipToBuild];
        const costCredit = Math.floor(spec.baseCost * state.synergies.shipBuildCostMultiplier);
        const costNanocore = Math.floor(spec.baseNanocore * state.synergies.shipBuildCostMultiplier);

        if (updatedCredits >= costCredit && updatedNanocores >= costNanocore) {
          updatedCredits -= costCredit;
          updatedNanocores -= costNanocore;
          updatedShipyardQueue = {
            type: targetShipToBuild,
            progress: 0,
            totalTime: spec.baseBuildTime,
            costCredits: costCredit,
            costNanocore: costNanocore
          };
          state.addBattleLog(`${spec.name} 자동 재생산 대기열 추가.`);
        }
      }
    }

    // 5. [QoL 편의 기능 자동화 작동 연산] (Phase 5)
    // 5-1. 자동 테라포밍 옵션
    if (state.autoTerraform && updatedCredits > 500) {
      for (const planetId of Object.keys(updatedPlanets)) {
        const planet = updatedPlanets[planetId];
        const data = PLANETARY_DATA[planetId];
        if (planet.unlocked && planet.terraformProgress < 100) {
          const costCredit = Math.floor(data.terraformCredit * 0.1);
          const costEnergy = Math.floor(data.terraformEnergy * 0.1);
          const availableEnergy = calculatedMaxEnergy - targetUsedEnergy;

          if (updatedCredits >= costCredit && availableEnergy >= costEnergy) {
            const updatedProgress = Math.min(100, planet.terraformProgress + 10);
            const updatedPopulation = Math.floor((updatedProgress / 100) * data.maxPopulation);
            
            updatedPlanets[planetId] = {
              ...planet,
              terraformProgress: updatedProgress,
              population: updatedPopulation
            };
            updatedCredits -= costCredit;
            
            state.synergies = calculateSynergies(updatedPlanets, state.chronosUpgrades);
            state.addBattleLog(`${data.name} 테라포밍 자동 강화 실행 (${updatedProgress}%).`);
            break;
          }
        }
      }
    }

    // 5-2. 자동 위성 건설 옵션
    const earthSats = updatedPlanets[PLANETS.EARTH]?.orbitalSatellites || 0;
    if (state.autoBuildTowers && earthSats < 5) {
      const spec = SATELLITE_SPECS.laser;
      const availableEnergy = (calculatedMaxEnergy + state.cheatEnergyBonus) - targetUsedEnergy;
      if (updatedCredits >= spec.cost && availableEnergy >= spec.energy) {
        updatedCredits -= spec.cost;
        targetUsedEnergy += spec.energy;
        
        const currentCount = updatedPlanets[PLANETS.EARTH].orbitalSatellitesList?.laser || 0;
        updatedPlanets[PLANETS.EARTH].orbitalSatellites = earthSats + 1;
        if (!updatedPlanets[PLANETS.EARTH].orbitalSatellitesList) {
          updatedPlanets[PLANETS.EARTH].orbitalSatellitesList = {};
        }
        updatedPlanets[PLANETS.EARTH].orbitalSatellitesList.laser = currentCount + 1;
        
        state.addBattleLog(`방어 위성 자동 복구: 지구 궤도에 타겟팅 레이저 위성 자동 건설.`);
      }
    }

    // 6-1. 적 및 보스 스폰 엔진
    let updatedSpawnTimer = state.enemySpawnTimer + actualDelta;
    const isBossWave = state.currentWave % 10 === 0;
    const baseInterval = Math.max(2.0, 5.0 - state.currentWave * 0.1);
    const spawnInterval = isBossWave ? baseInterval : baseInterval / 2.0;

    const hasActiveBoss = updatedEnemies.some(e => e.type === ALIEN_TYPES.BOSS_APOCALYPSE || e.type === ALIEN_TYPES.BOSS_CHRONO);

    let enemiesRemaining = state.enemiesRemainingToSpawn !== undefined ? state.enemiesRemainingToSpawn : (isBossWave ? 1 : (3 + state.currentWave) * 2);

    if (updatedSpawnTimer >= spawnInterval && !hasActiveBoss && enemiesRemaining > 0) {
      updatedSpawnTimer = 0;
      enemiesRemaining -= 1;
      
      if (isBossWave) {
        const bossType = state.currentWave % 20 === 0 ? ALIEN_TYPES.BOSS_CHRONO : ALIEN_TYPES.BOSS_APOCALYPSE;
        const baseSpec = ALIEN_SPECS[bossType];
        
        const level = state.currentWave;
        const hpMultiplier = 1 + (level - 1) * 0.12;
        const damageMultiplier = 1 + (level - 1) * 0.08;
        const rewardMultiplier = 1 + (level - 1) * 0.06;
        const speedMultiplier = Math.min(1.5, 1 + (level - 1) * 0.015);

        const scaledMaxHp = Math.round(baseSpec.maxHp * hpMultiplier);
        const scaledDmg = Math.round(baseSpec.damage * damageMultiplier);
        const scaledReward = Math.round(baseSpec.creditReward * rewardMultiplier);
        const scaledSpeed = baseSpec.speed * speedMultiplier;

        const spec = {
          ...baseSpec,
          maxHp: scaledMaxHp,
          damage: scaledDmg,
          creditReward: scaledReward,
          speed: scaledSpeed
        };

        const spawnAngle = Math.random() * 2 * Math.PI;
        const startX = EARTH_CENTER_X + ENEMY_SPAWN_RADIUS * Math.cos(spawnAngle);
        const startY = EARTH_CENTER_Y + ENEMY_SPAWN_RADIUS * Math.sin(spawnAngle);

        updatedEnemies.push({
          id: Math.random().toString(),
          level: level,
          type: bossType,
          x: startX,
          y: startY,
          hp: scaledMaxHp,
          maxHp: scaledMaxHp,
          speed: scaledSpeed,
          attackTimer: 0,
          spec: spec
        });
        state.addBattleLog(`[Lv.${level}] 경고: 거대 위협 [${spec.name}] 웜홀 진입!`);
      } else {
        const roll = Math.random();
        let enemyType = ALIEN_TYPES.SCOUT;
        if (roll > 0.85 && state.currentWave >= 8) enemyType = ALIEN_TYPES.DESTROYER;
        else if (roll > 0.50 && state.currentWave >= 3) enemyType = ALIEN_TYPES.RAIDER;

        const baseSpec = ALIEN_SPECS[enemyType];
        
        const level = state.currentWave;
        const hpMultiplier = 1 + (level - 1) * 0.12;
        const damageMultiplier = 1 + (level - 1) * 0.08;
        const rewardMultiplier = 1 + (level - 1) * 0.06;
        const speedMultiplier = Math.min(1.5, 1 + (level - 1) * 0.015);

        const scaledMaxHp = Math.round(baseSpec.maxHp * hpMultiplier);
        const scaledDmg = Math.round(baseSpec.damage * damageMultiplier);
        const scaledReward = Math.round(baseSpec.creditReward * rewardMultiplier);
        const scaledSpeed = baseSpec.speed * speedMultiplier;

        const spec = {
          ...baseSpec,
          maxHp: scaledMaxHp,
          damage: scaledDmg,
          creditReward: scaledReward,
          speed: scaledSpeed
        };

        const spawnAngle = Math.random() * 2 * Math.PI;
        const startX = EARTH_CENTER_X + ENEMY_SPAWN_RADIUS * Math.cos(spawnAngle);
        const startY = EARTH_CENTER_Y + ENEMY_SPAWN_RADIUS * Math.sin(spawnAngle);
        
        updatedEnemies.push({
          id: Math.random().toString(),
          level: level,
          type: enemyType,
          x: startX,
          y: startY,
          hp: scaledMaxHp,
          maxHp: scaledMaxHp,
          speed: scaledSpeed,
          attackTimer: 0,
          spec: spec
        });
        state.addBattleLog(`[Lv.${level}] 외계 침략선 [${spec.name}] 탐지됨!`);
      }
    }

    // --- Decoy satellite bonus to intercept rates ---
    const totalDecoys = Object.values(updatedPlanets).reduce((acc, p) => acc + (p.orbitalSatellitesList?.decoy || 0), 0);
    const decoyInterceptBonus = totalDecoys * 0.05;

    // --- Shield Carrier and Barrier Ship fleet bonuses ---
    const totalRepairShips = updatedFleet.filter(s => s.type === SHIP_TYPES.REPAIR_SHIP).length;
    const totalRepairDrones = Object.values(updatedPlanets).reduce((acc, p) => acc + (p.orbitalSatellitesList?.repairDrone || 0), 0);
    const totalBarrierShips = updatedFleet.filter(s => s.type === SHIP_TYPES.BARRIER_SHIP).length;
    const barrierDamageReduction = Math.max(0.5, 1 - totalBarrierShips * 0.1);

    // 6-2. 적 물리 이동 및 공격
    const totalSensors = Object.values(updatedPlanets).reduce((acc, p) => acc + (p.orbitalSatellitesList?.sensor || 0), 0);
    const sensorSpeedMultiplier = Math.max(0.75, 1 - totalSensors * 0.05);
    const totalDistorters = Object.values(updatedPlanets).reduce((acc, p) => acc + (p.orbitalStationsList?.gravityDistorter || 0), 0);
    const distorterMultiplier = totalDistorters > 0 ? 0.75 : 1.0;

    updatedEnemies = updatedEnemies.map(enemy => {
      const dx = EARTH_CENTER_X - enemy.x;
      const dy = EARTH_CENTER_Y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      let nextX = enemy.x;
      let nextY = enemy.y;

      const isBoss = enemy.type === ALIEN_TYPES.BOSS_APOCALYPSE || enemy.type === ALIEN_TYPES.BOSS_CHRONO;
      const border = isBoss ? SHIELD_RADIUS + 40 : SHIELD_RADIUS + 20;

      let currentSpeed = enemy.speed;
      if (enemy.stunTimer > 0) {
        enemy.stunTimer = Math.max(0, enemy.stunTimer - actualDelta);
        currentSpeed = 0;
      } else if (enemy.slowTimer > 0) {
        enemy.slowTimer = Math.max(0, enemy.slowTimer - actualDelta);
        currentSpeed *= (1 - (enemy.slowAmount || 0));
      }

      if (dist > border) {
        const moveDist = currentSpeed * sensorSpeedMultiplier * distorterMultiplier * state.synergies.enemySpeedMultiplier * actualDelta;
        nextX += (dx / dist) * moveDist;
        nextY += (dy / dist) * moveDist;
      }

      let nextAttackTimer = enemy.attackTimer + actualDelta;
      if (nextAttackTimer >= enemy.spec.cooldown) {
        nextAttackTimer = 0;

        if (enemy.type === ALIEN_TYPES.BOSS_CHRONO) {
          nextMuteTimer = 4.0;
          state.addBattleLog('보스 [크로노 디바우러]가 시공간 정지 필드를 전개했습니다! (함대 4초 정지)');
          
          const px = -dy / dist;
          const py = dx / dist;
          for (let i = 0; i < 3; i++) {
            const offset = (i - 1) * 15;
            const spreadV = (i - 1) * 30;
            updatedProjectiles.push({
              id: Math.random().toString(),
              type: 'kinetic',
              x: nextX + px * offset,
              y: nextY + py * offset,
              vx: (dx / dist) * 120 + px * spreadV,
              vy: (dy / dist) * 120 + py * spreadV,
              damage: (enemy.spec.damage / 3) * barrierDamageReduction,
              isEnemy: true
            });
          }
        } else {
          const projDx = EARTH_CENTER_X - nextX;
          const projDy = EARTH_CENTER_Y - nextY;
          const projDist = Math.sqrt(projDx * projDx + projDy * projDy);

          updatedProjectiles.push({
            id: Math.random().toString(),
            type: enemy.spec.attackType,
            x: nextX,
            y: nextY,
            vx: (projDx / projDist) * (isBoss ? 110 : 150),
            vy: (projDy / projDist) * (isBoss ? 110 : 150),
            damage: enemy.spec.damage * barrierDamageReduction,
            isEnemy: true
          });

          if (enemy.type === ALIEN_TYPES.BOSS_APOCALYPSE) {
            state.addBattleLog('경고: [아포칼립스 파괴함]이 거대 행성 파괴 광선을 발사했습니다!');
          }
        }
      }

      return {
        ...enemy,
        x: nextX,
        y: nextY,
        attackTimer: nextAttackTimer
      };
    });

    // 6-3. 아군 궤도 함선 기동 및 적 추격
    updatedFleet = updatedFleet.map(ship => {
      const spec = SHIP_SPECS[ship.type];
      
      let nextHp = ship.hp;
      if (nextHp < ship.maxHp) {
        const passiveHeal = state.researchUpgrades.selfRepair ? ship.maxHp * 0.01 : 0;
        const activeHeal = totalRepairShips * 50 + totalRepairDrones * 20;
        nextHp = Math.min(ship.maxHp, nextHp + (passiveHeal + activeHeal) * actualDelta);
      }

      if (isMuted) {
        return { ...ship, hp: nextHp };
      }

      let targetEnemy = null;
      if (ship.targetEnemyId) {
        targetEnemy = updatedEnemies.find(e => e.id === ship.targetEnemyId);
      }
      if (!targetEnemy && updatedEnemies.length > 0) {
        let minDist = 9999;
        updatedEnemies.forEach(e => {
          const sDx = e.x - ship.x;
          const sDy = e.y - ship.y;
          const d = Math.sqrt(sDx * sDx + sDy * sDy);
          if (d < minDist) { minDist = d; targetEnemy = e; }
        });
      }

      let nextX = ship.x;
      let nextY = ship.y;
      let nextAngle = ship.angle;

      if (targetEnemy && spec.damage > 0) {
        const tDx = targetEnemy.x - ship.x;
        const tDy = targetEnemy.y - ship.y;
        const tDist = Math.sqrt(tDx * tDx + tDy * tDy);

        if (tDist > spec.range) {
          const shipMove = spec.speed * actualDelta;
          nextX += (tDx / tDist) * shipMove;
          nextY += (tDy / tDist) * shipMove;
        }

        nextAngle = Math.atan2(tDy, tDx);

        let nextCooldown = Math.max(0, ship.cooldownTimer - actualDelta);
        if (nextCooldown <= 0 && tDist <= spec.range) {
          nextCooldown = spec.cooldown * state.synergies.towerCooldownMultiplier;
          
          const dmgMultiplier = 1 + (state.chronosUpgrades.fleetDamage * 0.1) + (state.researchUpgrades.tachionTargeting ? 0.25 : 0.0);

          updatedProjectiles.push({
            id: Math.random().toString(),
            type: 'kinetic',
            x: nextX,
            y: nextY,
            vx: (tDx / tDist) * 220,
            vy: (tDy / tDist) * 220,
            damage: spec.damage * dmgMultiplier,
            isEnemy: false,
            targetEnemyId: targetEnemy.id
          });
        }

        return {
          ...ship,
          x: nextX,
          y: nextY,
          angle: nextAngle,
          hp: nextHp,
          targetEnemyId: targetEnemy.id,
          cooldownTimer: nextCooldown
        };
      } else {
        nextAngle += 0.4 * actualDelta;
        const orbitalRadius = ship.type === SHIP_TYPES.INTERCEPTOR ? 120 : ship.type === SHIP_TYPES.ESCORT ? 135 : 150;
        nextX = EARTH_CENTER_X + Math.cos(nextAngle) * orbitalRadius;
        nextY = EARTH_CENTER_Y + Math.sin(nextAngle) * orbitalRadius;

        return {
          ...ship,
          x: nextX,
          y: nextY,
          angle: nextAngle,
          hp: nextHp,
          targetEnemyId: null,
          cooldownTimer: 0
        };
      }
    });

    // 6-4. 투사체 이동 및 충돌 체크
    const projectilesToRemove = new Set();
    const enemiesToRemove = new Set();

    updatedProjectiles = updatedProjectiles.map(proj => {
      const nextX = proj.x + proj.vx * actualDelta;
      const nextY = proj.y + proj.vy * actualDelta;

      if (proj.isEnemy) {
        const dx = EARTH_CENTER_X - nextX;
        const dy = EARTH_CENTER_Y - nextY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= SHIELD_RADIUS) {
          projectilesToRemove.add(proj.id);
          
          let customDamage = proj.damage;
          if (proj.type === 'kinetic') {
            const finalIntercept = Math.min(1.0, state.getKineticInterceptRate() + decoyInterceptBonus);
            const isIntercepted = Math.random() <= finalIntercept;
            if (isIntercepted) {
              state.addBattleLog('키네틱 실드가 적의 탄환을 요격했습니다.');
              updatedParticles.push({
                id: Math.random().toString(),
                x: nextX,
                y: nextY,
                radius: 1,
                maxRadius: 25,
                alpha: 1.0,
                color: '#ff8a00'
              });
              return { ...proj, x: nextX, y: nextY };
            }
          } else if (proj.type === 'energy' && decoyInterceptBonus > 0) {
            if (Math.random() <= decoyInterceptBonus) {
              state.addBattleLog('미끼 위성이 에너지 빔을 유도하여 차단했습니다.');
              return { ...proj, x: nextX, y: nextY };
            }
          }
          
          state.damageEarth(customDamage, proj.type);
        }
      } else {
        let hitEnemy = null;
        if (proj.targetEnemyId) {
          hitEnemy = updatedEnemies.find(e => e.id === proj.targetEnemyId);
        }
        if (!hitEnemy) {
          hitEnemy = updatedEnemies.find(e => {
            const eDx = e.x - nextX;
            const eDy = e.y - nextY;
            const checkRadius = e.type.startsWith('boss') ? 35 : 18;
            return Math.sqrt(eDx * eDx + eDy * eDy) < checkRadius;
          });
        }

        if (hitEnemy) {
          projectilesToRemove.add(proj.id);
          hitEnemy.hp -= proj.damage;
          
          updatedParticles.push({
            id: Math.random().toString(),
            x: nextX,
            y: nextY,
            radius: 1,
            maxRadius: 12,
            alpha: 1.0,
            color: '#ffcc00'
          });

          if (hitEnemy.hp <= 0) {
            enemiesToRemove.add(hitEnemy.id);
            updatedCredits += hitEnemy.spec.creditReward;
            
            const hitLvlStr = `[Lv.${hitEnemy.level || 1}]`;
            if (hitEnemy.type === ALIEN_TYPES.BOSS_APOCALYPSE) {
              updatedNanocores += 5;
              state.addBattleLog(`${hitLvlStr} [아포칼립스 파괴함] 완벽 분쇄! 외계 나노코어 5개 회수.`);
            } else if (hitEnemy.type === ALIEN_TYPES.BOSS_CHRONO) {
              updatedNanocores += 15;
              state.addBattleLog(`${hitLvlStr} [크로노 디바우러] 완벽 분쇄! 외계 나노코어 15개 회수.`);
            } else if (Math.random() <= hitEnemy.spec.coreChance) {
              updatedNanocores += 1;
              state.addBattleLog(`${hitLvlStr} 적 격침! 외계 나노코어 획득.`);
            } else {
              state.addBattleLog(`${hitLvlStr} 적군 ${hitEnemy.spec.name} 파괴 성공.`);
            }

            updatedParticles.push({
              id: Math.random().toString(),
              x: hitEnemy.x,
              y: hitEnemy.y,
              radius: 4,
              maxRadius: hitEnemy.type.startsWith('boss') ? 70 : 35,
              alpha: 1.0,
              color: '#ff4400'
            });
          }
        }
      }

      if (nextX < -180 || nextX > 720 || nextY < -180 || nextY > 720) {
        projectilesToRemove.add(proj.id);
      }

      return { ...proj, x: nextX, y: nextY };
    });

    updatedProjectiles = updatedProjectiles.filter(p => !projectilesToRemove.has(p.id));
    updatedEnemies = updatedEnemies.filter(e => !enemiesToRemove.has(e.id) && e.hp > 0);

    // 6-5. 폭발 파티클 갱신
    updatedParticles = updatedParticles.map(part => {
      const expansion = part.maxRadius * 3 * actualDelta;
      const newRadius = Math.min(part.maxRadius, part.radius + expansion);
      const newAlpha = Math.max(0, part.alpha - 1.8 * actualDelta);
      return { ...part, radius: newRadius, alpha: newAlpha };
    }).filter(part => part.alpha > 0);

    // 7. 모든 적선 클리어 및 스폰 완료 시 웨이브 상승
    let nextWave = state.currentWave;
    if (updatedEnemies.length === 0 && enemiesRemaining === 0) {
      nextWave = state.currentWave + 1;
      state.addBattleLog(`웨이브 ${nextWave} 진입!`);
      const nextBoss = nextWave % 10 === 0;
      enemiesRemaining = nextBoss ? 1 : (3 + nextWave) * 2;
      updatedSpawnTimer = 0;
    }

    // Get final values from store updated by damageEarth
    const finalState = get();

    set({
      credits: updatedCredits,
      nanocores: updatedNanocores,
      maxEnergy: calculatedMaxEnergy + state.cheatEnergyBonus,
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
      planets: updatedPlanets,
      currentWave: nextWave,
      enemiesRemainingToSpawn: enemiesRemaining,
      satelliteRotation: nextRotation,
      kineticDefenseTowers: updatedPlanets[PLANETS.EARTH]?.orbitalSatellitesList?.laser || 0
    });
  }
}));
