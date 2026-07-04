import { PLANETS, PLANETARY_DATA } from '../../constants/planetaryData';
import { getFactoryIncome } from '../gameSpecs';

export const harvestResources = (state, updatedPlanets, actualDelta) => {
  let totalPopulation = 0;
  let totalFactoryContribution = 0;
  let totalTaxBonus = 0;

  Object.keys(updatedPlanets).forEach((planetId) => {
    const p = updatedPlanets[planetId];
    if (p.unlocked) {
      const data = PLANETARY_DATA[planetId];
      if (data) {
        // Fallback for infrastructure if undefined
        const infra = p.infrastructure || { housing: 0, factory: 0, powerPlant: 0, bunker: 0 };
        
        // 1. Calculate population capacity
        const baseCapacity = (p.terraformProgress / 100) * data.maxPopulation;
        const capacityBonus = data.maxPopulation * 0.2;
        const maxPop = baseCapacity + (infra.housing || 0) * capacityBonus;

        // 2. Simulate population growth (logistic growth + immigration)
        if (p.population < maxPop) {
          const growthRate = 0.005 + (infra.housing || 0) * 0.001;
          const growth = p.population * growthRate * (1 - p.population / Math.max(1, maxPop));
          const immigration = 5 + (infra.housing || 0) * 2;
          p.population = Math.min(maxPop, p.population + (growth + immigration) * actualDelta);
        } else if (p.population > maxPop) {
          // If capacity shrank, gradually decay population
          p.population = Math.max(maxPop, p.population - (p.population * 0.01 + 10) * actualDelta);
        }

        totalPopulation += p.population;
        
        // 3. Accumulate factory contribution (exponential income)
        const factoryLvl = infra.factory || 0;
        totalFactoryContribution += getFactoryIncome(factoryLvl);
        totalTaxBonus += factoryLvl * 0.03;
      }
    }
  });

  // 4. Calculate credit generation rate based on population and factory levels
  // Tax formula: 0.005 * (totalPopulation ^ 0.75)
  const taxRevenue = 0.005 * Math.pow(Math.max(0, totalPopulation), 0.75);
  const baseCreditRate = 10 + taxRevenue * (1 + totalTaxBonus) + totalFactoryContribution;
  const earnedCredits = baseCreditRate * state.synergies.creditMultiplier * actualDelta;

  // 5. Calculate energy capacity (Power Plants)
  let baseEnergy = 100;
  let baseProdRate = 15; // 기본 충전 속도 TW/s
  Object.keys(updatedPlanets).forEach((planetId) => {
    const p = updatedPlanets[planetId];
    if (p.unlocked) {
      if (planetId !== PLANETS.EARTH) {
        baseEnergy += (p.terraformProgress / 100) * 50;
      }
      const infra = p.infrastructure || { housing: 0, factory: 0, powerPlant: 0, bunker: 0 };
      const powerPlantLvl = infra.powerPlant || 0;
      baseEnergy += powerPlantLvl * 20;       // 발전소 1개당 쿄쿵시티 +20 TW
      baseProdRate += powerPlantLvl * 20;      // 발전소 1개당 충전속도 +20 TW/s
    }
  });
  const calculatedMaxEnergy = Math.floor(baseEnergy * state.synergies.energyProductionMultiplier);
  const calculatedProductionRate = Math.floor(baseProdRate * state.synergies.energyProductionMultiplier);

  const baseNanocoreRate = state.chronosUpgrades.nanocoreGen * 0.1;
  const earnedNanocores = baseNanocoreRate * actualDelta;

  return {
    earnedCredits,
    calculatedMaxEnergy,
    calculatedProductionRate,
    earnedNanocores
  };
};
