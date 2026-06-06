let AsyncStorage;
try {
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

export const saveLoadActions = (
  set,
  get,
  initialPlanetsState,
  initialChronosUpgrades,
  calculateSynergies,
  recalculateUsedEnergyState,
  SHIP_TYPES
) => ({
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
      counterattackModules: state.counterattackModules,
      satelliteLevels: state.satelliteLevels
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
        const defaultLevels = {
          laser: { damage: 1, speed: 1, range: 1 },
          plasmaLaser: { damage: 1, speed: 1, range: 1 },
          emp: { damage: 1, speed: 1, range: 1 },
          clusterMissile: { damage: 1, speed: 1, range: 1 },
          gravityBomb: { damage: 1, speed: 1, range: 1 },
          antimatter: { damage: 1, speed: 1, range: 1 }
        };

        if (loaded.satelliteLevels) {
          Object.keys(defaultLevels).forEach(key => {
            const val = loaded.satelliteLevels[key];
            if (val) {
              if (typeof val === 'number') {
                defaultLevels[key] = { damage: val, speed: val, range: val };
              } else if (typeof val === 'object') {
                defaultLevels[key] = {
                  damage: val.damage || 1,
                  speed: val.speed || 1,
                  range: val.range || 1
                };
              }
            }
          });
        }
        loaded.satelliteLevels = defaultLevels;

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
      battleLogs: [],
      satelliteLevels: {
        laser: { damage: 1, speed: 1, range: 1 },
        plasmaLaser: { damage: 1, speed: 1, range: 1 },
        emp: { damage: 1, speed: 1, range: 1 },
        clusterMissile: { damage: 1, speed: 1, range: 1 },
        gravityBomb: { damage: 1, speed: 1, range: 1 },
        antimatter: { damage: 1, speed: 1, range: 1 }
      }
    });

    get().addBattleLog('데이터베이스(세이브)가 초기화되었습니다.');
  }
});
