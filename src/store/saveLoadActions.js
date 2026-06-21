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
      unlockedCounterattacks: state.unlockedCounterattacks,
      satelliteLevels: state.satelliteLevels,
      earthHpRegenLevel: state.earthHpRegenLevel,
      earthShieldRegenLevel: state.earthShieldRegenLevel,
      overloadEnergy: state.overloadEnergy,
      overloadMaxEnergy: state.overloadMaxEnergy,
      isPowerOffline: state.isPowerOffline,
      onlineSatelliteCount: state.onlineSatelliteCount,
      satelliteBootTimer: state.satelliteBootTimer,
      alienSpecOverrides: state.alienSpecOverrides || {},
      satelliteSpecOverrides: state.satelliteSpecOverrides || {}
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

        if (loaded.planets) {
          Object.keys(loaded.planets).forEach(pId => {
            const planet = loaded.planets[pId];
            if (!planet.infrastructure) {
              planet.infrastructure = {
                housing: 0,
                factory: 0,
                powerPlant: 0,
                bunker: 0
              };
            }
          });
        }

        let totalBunkers = 0;
        if (loaded.planets) {
          Object.keys(loaded.planets).forEach(pId => {
            const planet = loaded.planets[pId];
            if (planet.unlocked && planet.infrastructure) {
              totalBunkers += planet.infrastructure.bunker || 0;
            }
          });
        }

        const nextState = {
          ...loaded,
          earthHpRegenLevel: loaded.earthHpRegenLevel || 1,
          earthShieldRegenLevel: loaded.earthShieldRegenLevel || 1,
          overloadEnergy: loaded.overloadEnergy !== undefined ? loaded.overloadEnergy : 100,
          overloadMaxEnergy: loaded.overloadMaxEnergy !== undefined ? loaded.overloadMaxEnergy : 100,
          isPowerOffline: loaded.isPowerOffline !== undefined ? loaded.isPowerOffline : false,
          onlineSatelliteCount: loaded.onlineSatelliteCount !== undefined ? loaded.onlineSatelliteCount : 0,
          satelliteBootTimer: loaded.satelliteBootTimer !== undefined ? loaded.satelliteBootTimer : 2.0,
          unlockedCounterattacks: loaded.unlockedCounterattacks !== undefined ? loaded.unlockedCounterattacks : {
            reflector: false,
            discharge: false,
            electricField: false
          },
          earthMaxHp: 100 + totalBunkers * 20,
          earthHp: Math.min(100 + totalBunkers * 20, loaded.earthHp !== undefined ? loaded.earthHp : 100),
          synergies: calculateSynergies(loaded.planets, loaded.chronosUpgrades)
        };
        const { ALIEN_SPECS, SATELLITE_SPECS } = require('./gameSpecs');
        if (loaded.alienSpecOverrides) {
          Object.keys(loaded.alienSpecOverrides).forEach(type => {
            if (ALIEN_SPECS[type]) {
              Object.assign(ALIEN_SPECS[type], loaded.alienSpecOverrides[type]);
            }
          });
        }
        if (loaded.satelliteSpecOverrides) {
          Object.keys(loaded.satelliteSpecOverrides).forEach(type => {
            if (SATELLITE_SPECS[type]) {
              Object.assign(SATELLITE_SPECS[type], loaded.satelliteSpecOverrides[type]);
            }
          });
        }

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
    const { ALIEN_SPECS, SATELLITE_SPECS, DEFAULT_ALIEN_SPECS, DEFAULT_SATELLITE_SPECS } = require('./gameSpecs');
    if (DEFAULT_ALIEN_SPECS) {
      Object.keys(DEFAULT_ALIEN_SPECS).forEach(type => {
        Object.assign(ALIEN_SPECS[type], DEFAULT_ALIEN_SPECS[type]);
      });
    }
    if (DEFAULT_SATELLITE_SPECS) {
      Object.keys(DEFAULT_SATELLITE_SPECS).forEach(type => {
        Object.assign(SATELLITE_SPECS[type], DEFAULT_SATELLITE_SPECS[type]);
      });
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
      earthHpRegenLevel: 1,
      earthShieldRegenLevel: 1,
      overloadEnergy: 100,
      overloadMaxEnergy: 100,
      isPowerOffline: false,
      onlineSatelliteCount: 0,
      satelliteBootTimer: 2.0,
      kineticDefenseTowers: 0,
      shieldModule: 'basic',
      counterattackModules: {
        reflector: false,
        discharge: false,
        electricField: false
      },
      unlockedCounterattacks: {
        reflector: false,
        discharge: false,
        electricField: false
      },
      currentWave: 1,
      enemiesRemainingToSpawn: 16,
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
      alienSpecOverrides: {},
      satelliteSpecOverrides: {},
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
