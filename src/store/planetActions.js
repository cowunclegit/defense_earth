import { PLANETS, PLANETARY_DATA } from '../constants/planetaryData';
import {
  SHIP_TYPES,
  SHIP_SPECS,
  MAX_SATELLITES_PER_TYPE,
  getSatelliteCost,
  getSatelliteUpgradeCost,
  SATELLITE_SPECS,
  STATION_SPECS,
  SHIELD_MODULE_SPECS,
  COUNTERATTACK_MODULE_SPECS,
  calculateSynergies,
  getInfrastructureCost
} from './gameSpecs';

export const planetActions = (set, get) => ({
  unlockPlanet: (planetId) => set((state) => {
    const planetData = PLANETARY_DATA[planetId];
    if (!planetData || state.currentWave < planetData.unlockWave || state.planets[planetId].unlocked) return {};

    const updatedPlanets = {
      ...state.planets,
      [planetId]: { ...state.planets[planetId], unlocked: true, population: 100 }
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

    const updatedPlanets = {
      ...state.planets,
      [planetId]: {
        ...planet,
        terraformProgress: updatedProgress
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

  buildInfrastructure: (planetId, infraType) => {
    const state = get();
    const planet = state.planets[planetId];
    if (!planet || !planet.unlocked) return false;

    const infra = planet.infrastructure || { housing: 0, factory: 0, powerPlant: 0, bunker: 0 };
    const currentLevel = infra[infraType] || 0;

    const cost = getInfrastructureCost(infraType, currentLevel);
    if (state.credits < cost) return false;

    const updatedPlanets = {
      ...state.planets,
      [planetId]: {
        ...planet,
        infrastructure: {
          ...infra,
          [infraType]: currentLevel + 1
        }
      }
    };

    let extraMaxHp = 0;
    if (infraType === 'bunker') {
      extraMaxHp = 20;
    }

    // 발전소 건설 즉시 maxEnergy 증가 (다음 tick 기다리지 않음)
    let extraMaxEnergy = 0;
    if (infraType === 'powerPlant') {
      extraMaxEnergy = 20;
    }

    set({
      credits: state.credits - cost,
      planets: updatedPlanets,
      earthMaxHp: state.earthMaxHp + extraMaxHp,
      earthHp: state.earthHp + extraMaxHp,
      maxEnergy: state.maxEnergy + extraMaxEnergy
    });

    const infraNames = {
      housing: '주거 지원 지구(Housing)',
      factory: '종합 생산 공장(Factory)',
      powerPlant: '발전 시설(Power Plant)',
      bunker: '지하 대피 방공호(Bunker)'
    };
    state.addBattleLog(`${PLANETARY_DATA[planetId].name}에 ${infraNames[infraType]} Lv.${currentLevel + 1}을 건설했습니다.`);
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

    const spec = SATELLITE_SPECS[type];
    if (!spec) return false;

    // 각 위성 종류별 한도(MAX_SATELLITES_PER_TYPE개)를 가짐
    const currentCount = planet.orbitalSatellitesList[type] || 0;
    if (currentCount >= MAX_SATELLITES_PER_TYPE) return false;

    const cost = getSatelliteCost(type, currentCount);
    const energyCost = spec.energy;

    if (state.credits < cost || state.getAvailableEnergy() < energyCost) return false;

    const currentTotal = planet.orbitalSatellites || 0;
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

  upgradeSatellite: (type, category) => {
    const state = get();
    const weaponLevels = state.satelliteLevels[type] || { damage: 1, speed: 1, range: 1 };
    const currentLevel = weaponLevels[category] || 1;
    const spec = SATELLITE_SPECS[type];
    if (!spec) return false;

    const cost = getSatelliteUpgradeCost(type, category, currentLevel);
    if (state.credits < cost) return false;

    const categoryNames = { damage: '데미지', speed: '공격속도', range: '사거리' };
    const categoryName = categoryNames[category] || category;

    set({
      credits: state.credits - cost,
      satelliteLevels: {
        ...state.satelliteLevels,
        [type]: {
          ...weaponLevels,
          [category]: currentLevel + 1
        }
      }
    });

    state.addBattleLog(`${spec.name}의 ${categoryName}을 Lv.${currentLevel + 1}로 업그레이드했습니다.`);
    return true;
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

  upgradeShipyard: (planetId) => {
    const state = get();
    const planet = state.planets[planetId];
    if (!planet || !planet.unlocked || (planet.shipyard || 0) < 1 || (planet.shipyard || 0) >= 3) return false;

    const currentLvl = planet.shipyard || 1;
    let cost = 15000;
    let nanocoreCost = 15;
    let energyCost = 10;

    if (currentLvl === 2) {
      cost = 50000;
      nanocoreCost = 35;
      energyCost = 10;
    }

    if (state.credits < cost || state.nanocores < nanocoreCost || state.getAvailableEnergy() < energyCost) return false;

    const updatedPlanets = {
      ...state.planets,
      [planetId]: {
        ...planet,
        shipyard: currentLvl + 1
      }
    };

    set({
      credits: state.credits - cost,
      nanocores: state.nanocores - nanocoreCost,
      usedEnergy: state.usedEnergy + energyCost,
      planets: updatedPlanets
    });

    state.addBattleLog(`${PLANETARY_DATA[planetId].name} 궤도 쉽야드를 Lv.${currentLvl + 1}로 업그레이드했습니다.`);
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
    const isUnlocked = state.unlockedCounterattacks && state.unlockedCounterattacks[moduleType];

    if (currentlyActive) {
      set((s) => ({
        counterattackModules: {
          ...s.counterattackModules,
          [moduleType]: false
        }
      }));
      state.addBattleLog(`반격 모듈 [${spec.name}]을 비활성화했습니다.`);
    } else {
      if (isUnlocked) {
        set((s) => ({
          counterattackModules: {
            ...s.counterattackModules,
            [moduleType]: true
          }
        }));
        state.addBattleLog(`반격 모듈 [${spec.name}]을 활성화했습니다.`);
      } else {
        const cost = spec.cost;
        if (state.credits < cost) return false;

        set((s) => ({
          credits: s.credits - cost,
          unlockedCounterattacks: {
            ...(s.unlockedCounterattacks || {}),
            [moduleType]: true
          },
          counterattackModules: {
            ...s.counterattackModules,
            [moduleType]: true
          }
        }));
        state.addBattleLog(`반격 모듈 [${spec.name}]을 해금하고 활성화했습니다.`);
      }
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

  setFleetReservation: (shipType, count) => set((state) => {
    const updatedSlots = { ...state.fleetSlots, [shipType]: Math.max(0, count) };
    return { fleetSlots: updatedSlots };
  })
});
