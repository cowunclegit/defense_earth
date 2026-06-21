import { PLANETS, PLANETARY_DATA } from '../constants/planetaryData';
import { SATELLITE_SPECS, SHIP_TYPES, SHIP_LEVEL_REQUIREMENTS } from './gameSpecs';

export const runAutoPlayAgentTick = (set, get, deltaTime) => {
  const state = get();
  if (!state.isAiPlaytestActive) return;

  // Accumulate time for AI decisions (run once per simulation second)
  const aiTimer = (state.aiTimer || 0) + deltaTime;
  if (aiTimer < 1.0) {
    set({ aiTimer });
    return;
  }
  set({ aiTimer: 0 });

  // 1. Permanent Chronos Upgrades (if we have TP)
  const chronosUpgradeKeys = [
    'creditGen',
    'energyGen',
    'shieldCap',
    'shieldRegen',
    'kineticIntercept',
    'timeMachineSpeed',
    'rebirthBonus',
  ];
  for (const key of chronosUpgradeKeys) {
    const currentLevel = state.chronosUpgrades[key] || 0;
    const cost = Math.pow(3, currentLevel) * 5;
    if (state.timeParticles >= cost) {
      state.buyChronosUpgrade(key);
    }
  }

  // 2. Science Lab Research (if we have Nanocores)
  const researchKeys = ['beamConversion', 'selfRepair', 'tachionTargeting'];
  for (const key of researchKeys) {
    if (!state.researchUpgrades[key] && state.nanocores >= 15) {
      state.buyResearchUpgrade(key);
    }
  }

  // 3. Auto Rebirth check
  // If Earth HP is low and Time Machine is fully charged, execute early loop reset to maximize TP gathering.
  if (state.earthHp < 35 && state.timeMachineGauge >= 100) {
    state.addBattleLog('🤖 AI Autopilot: Earth HP low. Triggering Chronos time loop.');
    state.triggerTimeLoop();
    return;
  }
  // Alternatively, if we are at high wave and have accumulated significant credits/nanocores but cannot progress, rebirth
  if (state.timeMachineGauge >= 100 && state.currentWave >= 12 + state.rebirthCount * 5) {
    state.addBattleLog('🤖 AI Autopilot: Rebirth conditions optimal. Triggering Chronos time loop.');
    state.triggerTimeLoop();
    return;
  }

  // 4. Planet Management
  Object.keys(PLANETARY_DATA).forEach((planetId) => {
    const data = PLANETARY_DATA[planetId];
    
    // Unlock planet if conditions are met
    if (!state.planets[planetId].unlocked) {
      if (state.currentWave >= data.unlockWave) {
        state.unlockPlanet(planetId);
        state.addBattleLog(`🤖 AI Autopilot: Unlocked planet ${data.name}`);
      }
      return;
    }

    const planet = state.planets[planetId];
    const infra = planet.infrastructure || { housing: 0, factory: 0, powerPlant: 0, bunker: 0 };

    // A. Priority 1: Energy. If energy is low, build Power Plants
    const availableEnergy = state.getAvailableEnergy();
    if (availableEnergy < 15 && state.credits >= 250) {
      state.buildInfrastructure(planetId, 'powerPlant');
    }

    // B. Priority 2: Terraforming
    if (planet.terraformProgress < 100) {
      const tfCreditCost = Math.floor(data.terraformCredit * 0.1);
      const tfEnergyCost = Math.floor(data.terraformEnergy * 0.1);
      if (state.credits >= tfCreditCost && state.getAvailableEnergy() >= tfEnergyCost) {
        state.upgradePlanetTerraform(planetId);
      }
    }

    // C. Priority 3: Housing/Population check
    // If population is near max cap, build housing to allow further growth and credit taxes
    const maxPop = (planet.terraformProgress / 100) * data.maxPopulation + (infra.housing || 0) * (data.maxPopulation * 0.2);
    if (planet.population > maxPop * 0.85 && state.credits >= 100) {
      state.buildInfrastructure(planetId, 'housing');
    }

    // D. Priority 4: Economy (Factories)
    // If we have enough energy and surplus credits, build factories for passive taxes
    if (state.credits > 500 && infra.factory < (infra.housing + 1) * 3) {
      state.buildInfrastructure(planetId, 'factory');
    }

    // E. Priority 5: Bunkers (on Earth only to bolster global HP)
    if (planetId === PLANETS.EARTH && state.credits > 1000 && infra.bunker < 10) {
      state.buildInfrastructure(planetId, 'bunker');
    }

    // F. Priority 6: Build Satellites
    // Build a defensive matrix of satellites
    const satelliteOrder = [
      'laser',          // Initial kinetic intercept & damage
      'decoy',          // Absorb attacks
      'sensor',         // Radar and range
      'emp',            // Stun enemies
      'repairDrone',    // Regenerate health
      'plasmaLaser',    // Heavy DPS
      'forceShield',    // Extra shields
      'gravityBomb',    // AOE Slowdown
      'clusterMissile', // High AOE dmg
      'antimatter'      // Endgame boss melter
    ];

    for (const satType of satelliteOrder) {
      const spec = SATELLITE_SPECS[satType];
      const count = planet.orbitalSatellitesList[satType] || 0;
      
      // Determine desired count based on satellite type
      let desiredCount = 0;
      if (satType === 'laser') desiredCount = 5; // Get 100% kinetic intercept
      else if (satType === 'decoy') desiredCount = 2;
      else if (satType === 'sensor') desiredCount = 1;
      else if (satType === 'emp') desiredCount = 2;
      else if (satType === 'repairDrone') desiredCount = 2;
      else if (satType === 'forceShield') desiredCount = 2;
      else desiredCount = 3; // For plasma, gravity, cluster, antimatter

      if (count < desiredCount) {
        const cost = Math.floor(spec.cost * Math.pow(1.5, count));
        const energyCost = spec.energy;
        if (state.credits >= cost && state.getAvailableEnergy() >= energyCost) {
          state.buildOrbitalSatelliteDetail(planetId, satType);
        }
        break; // Build one satellite at a time
      }
    }

    // G. Priority 7: Upgrade Satellite Levels
    // Periodically upgrade satellite damage, speed, range
    const satelliteUpgradeOrder = ['laser', 'plasmaLaser', 'emp', 'clusterMissile', 'gravityBomb', 'antimatter'];
    for (const satType of satelliteUpgradeOrder) {
      const levels = state.satelliteLevels[satType] || { damage: 1, speed: 1, range: 1 };
      const currentDmgLvl = levels.damage;
      const currentSpdLvl = levels.speed;
      
      // Upgrade dmg if possible
      const dmgCost = Math.floor(SATELLITE_SPECS[satType].cost * 1.5 * Math.pow(1.15, currentDmgLvl - 1));
      if (state.credits > dmgCost * 1.5) {
        state.upgradeSatellite(satType, 'damage');
        break;
      }

      // Upgrade speed if possible
      const spdCost = Math.floor(SATELLITE_SPECS[satType].cost * 1.5 * Math.pow(1.15, currentSpdLvl - 1));
      if (state.credits > spdCost * 1.5) {
        state.upgradeSatellite(satType, 'speed');
        break;
      }
    }

    // H. Priority 8: Shipyard & Fleet Construction
    if (!planet.shipyard) {
      // Build Shipyard
      if (state.credits >= 3000 && state.nanocores >= 5 && state.getAvailableEnergy() >= 15) {
        state.buildShipyard(planetId);
      }
    } else {
      // Upgrade Shipyard if we have spare resources
      const shipyardLvl = planet.shipyard;
      if (shipyardLvl < 3) {
        const upgradeCost = shipyardLvl === 1 ? 15000 : 50000;
        const nanoCost = shipyardLvl === 1 ? 15 : 35;
        if (state.credits >= upgradeCost && state.nanocores >= nanoCost && state.getAvailableEnergy() >= 10) {
          state.upgradeShipyard(planetId);
        }
      }

      // Set optimized fleet reservations
      const expectedReservations = {
        [SHIP_TYPES.INTERCEPTOR]: shipyardLvl * 3,
        [SHIP_TYPES.ESCORT]: shipyardLvl * 1,
        [SHIP_TYPES.REPAIR_SHIP]: 1,
      };

      if (shipyardLvl >= 2) {
        expectedReservations[SHIP_TYPES.DESTROYER] = 1;
        expectedReservations[SHIP_TYPES.BARRIER_SHIP] = 1;
      }
      if (shipyardLvl >= 3) {
        expectedReservations[SHIP_TYPES.CRUISER] = 1;
        expectedReservations[SHIP_TYPES.SHIELD_CARRIER] = 1;
        expectedReservations[SHIP_TYPES.ION_BATTLESHIP] = 1;
      }

      // Apply reservations if different
      Object.keys(expectedReservations).forEach((type) => {
        const reserved = state.fleetSlots[type] || 0;
        if (reserved !== expectedReservations[type]) {
          state.setFleetReservation(type, expectedReservations[type]);
        }
      });
    }

    // I. Priority 9: Orbital Stations
    if (planet.orbitalStations < 3) {
      const stationTypes = ['aegisShield', 'gigaPlasma', 'gravityDistorter'];
      for (const stationType of stationTypes) {
        const built = planet.orbitalStationsList[stationType] || 0;
        if (built === 0) {
          const spec = SATELLITE_SPECS[stationType] || { cost: 4000, nanocores: 10, energy: 25 }; // fallback
          // Wait, STATION_SPECS in gameSpecs has station values
          const cost = stationType === 'aegisShield' ? 4000 : stationType === 'gigaPlasma' ? 5000 : 4500;
          const nano = stationType === 'aegisShield' ? 10 : stationType === 'gigaPlasma' ? 15 : 12;
          const energy = stationType === 'aegisShield' ? 25 : stationType === 'gigaPlasma' ? 30 : 25;
          
          if (state.credits >= cost && state.nanocores >= nano && state.getAvailableEnergy() >= energy) {
            state.buildOrbitalStationDetail(planetId, stationType);
            break;
          }
        }
      }
    }
  });
};
