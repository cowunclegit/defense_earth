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
      enemiesRemainingToSpawn: isBoss ? 1 : (3 + nextWave) * 2
    };
  }),
  cheatMaxEnergy: (amount) => set((state) => {
    console.log("cheatMaxEnergy called with", amount, "current maxEnergy", state.maxEnergy, "current cheatEnergyBonus", state.cheatEnergyBonus);
    return {
      cheatEnergyBonus: state.cheatEnergyBonus + amount,
      maxEnergy: state.maxEnergy + amount
    };
  })
});
