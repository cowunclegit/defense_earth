import { PLANETS, PLANETARY_DATA } from '../../constants/planetaryData';
import {
  SATELLITE_SPECS,
  MAX_SATELLITES_PER_TYPE,
  getSatelliteCost,
  calculateSynergies
} from '../gameSpecs';

export const simulateQolAutomation = (
  state,
  updatedPlanets,
  updatedCredits,
  calculatedMaxEnergy,
  targetUsedEnergy,
  addBattleLog
) => {
  // 자동 테라포밍 옵션
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
          
          updatedPlanets[planetId] = {
            ...planet,
            terraformProgress: updatedProgress
          };
          updatedCredits -= costCredit;
          
          state.synergies = calculateSynergies(updatedPlanets, state.chronosUpgrades);
          addBattleLog(`${data.name} 테라포밍 자동 강화 실행 (${updatedProgress}%).`);
          break;
        }
      }
    }
  }

  // 자동 위성 건설 옵션
  const currentCount = updatedPlanets[PLANETS.EARTH]?.orbitalSatellitesList?.laser || 0;
  if (state.autoBuildTowers && currentCount < MAX_SATELLITES_PER_TYPE) {
    const spec = SATELLITE_SPECS.laser;
    const cost = getSatelliteCost('laser', currentCount);
    const availableEnergy = (calculatedMaxEnergy + state.cheatEnergyBonus) - targetUsedEnergy;
    if (updatedCredits >= cost && availableEnergy >= spec.energy) {
      updatedCredits -= cost;
      targetUsedEnergy += spec.energy;
      
      const earthSats = updatedPlanets[PLANETS.EARTH]?.orbitalSatellites || 0;
      updatedPlanets[PLANETS.EARTH].orbitalSatellites = earthSats + 1;
      if (!updatedPlanets[PLANETS.EARTH].orbitalSatellitesList) {
        updatedPlanets[PLANETS.EARTH].orbitalSatellitesList = {};
      }
      updatedPlanets[PLANETS.EARTH].orbitalSatellitesList.laser = currentCount + 1;
      
      addBattleLog(`방어 위성 자동 복구: 지구 궤도에 타겟팅 레이저 위성 자동 건설.`);
    }
  }

  return {
    updatedPlanets,
    updatedCredits,
    targetUsedEnergy
  };
};
