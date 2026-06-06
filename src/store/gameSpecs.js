import { PLANETS, PLANETARY_DATA } from '../constants/planetaryData';

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

export const MAX_SATELLITES_PER_CATEGORY = 20;

export const getSatelliteCost = (type, currentCount) => {
  const spec = SATELLITE_SPECS[type];
  if (!spec) return 0;
  return Math.floor(spec.cost * Math.pow(1.5, currentCount));
};

export const SATELLITE_SPECS = {
  laser: { name: '타겟팅 레이저 위성', cost: 200, energy: 5, isWeapon: true, dmg: 120, cd: 3.0, range: 400 },
  plasmaLaser: { name: '플라즈마 레이저 위성', cost: 180, energy: 8, isWeapon: true, dmg: 180, cd: 5.0, range: 350 },
  emp: { name: 'EMP 위성', cost: 150, energy: 7, isWeapon: true, dmg: 0, cd: 6.0, range: 300 },
  clusterMissile: { name: '클러스터 미사일 위성', cost: 250, energy: 10, isWeapon: true, dmg: 90, cd: 8.0, range: 450 },
  gravityBomb: { name: '중력 포탄 위성', cost: 160, energy: 9, isWeapon: true, dmg: 160, cd: 6.0, range: 280 },
  antimatter: { name: '반물질 포 위성', cost: 400, energy: 15, isWeapon: true, dmg: 400, cd: 15.0, range: 500 },
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

export const ALIEN_SPECS = {
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

export const EARTH_CENTER_X = 270;
export const EARTH_CENTER_Y = 270;
export const SHIELD_RADIUS = 100;
export const ENEMY_SPAWN_RADIUS = 750;

export const calculateSynergies = (planets, chronosUpgrades) => {
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
