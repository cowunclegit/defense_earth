export const cheatActions = (set, get) => ({
  cheatCredits: (amount) => set((state) => ({ credits: state.credits + amount })),
  cheatNanocores: (amount) => set((state) => ({ nanocores: state.nanocores + amount })),
  cheatTimeParticles: (amount) => set((state) => ({ timeParticles: state.timeParticles + amount })),
  cheatTimeMachineMax: () => set({ timeMachineGauge: 100 }),
  cheatAdvanceWaves: (amount) => set((state) => {
    const nextWave = state.currentWave + amount;
    const isBoss = nextWave % 10 === 0;
    return {
      currentWave: nextWave,
      enemiesRemainingToSpawn: isBoss ? 1 : (3 + nextWave) * 4
    };
  }),
  cheatMaxEnergy: (amount) => set((state) => {
    console.log("cheatMaxEnergy called with", amount, "current maxEnergy", state.maxEnergy, "current cheatEnergyBonus", state.cheatEnergyBonus);
    return {
      cheatEnergyBonus: state.cheatEnergyBonus + amount,
      maxEnergy: state.maxEnergy + amount
    };
  }),
  updateSpecOverride: (category, type, specKey, value) => {
    set((state) => {
      const overridesKey = category === 'alien' ? 'alienSpecOverrides' : 'satelliteSpecOverrides';
      const currentOverrides = state[overridesKey] || {};
      const newOverrides = {
        ...currentOverrides,
        [type]: {
          ...(currentOverrides[type] || {}),
          [specKey]: value
        }
      };

      const { ALIEN_SPECS, SATELLITE_SPECS } = require('./gameSpecs');
      if (category === 'alien' && ALIEN_SPECS[type]) {
        ALIEN_SPECS[type][specKey] = value;
      } else if (category === 'satellite' && SATELLITE_SPECS[type]) {
        SATELLITE_SPECS[type][specKey] = value;
      }

      return {
        [overridesKey]: newOverrides
      };
    });
  }
});
