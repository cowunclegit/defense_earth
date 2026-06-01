export const PLANETS = {
  EARTH: 'earth',
  LUNA: 'luna',
  MARS: 'mars',
  VENUS: 'venus',
  MERCURY: 'mercury',
  JUPITER: 'jupiter',
  SATURN: 'saturn',
  URANUS: 'uranus',
  NEPTUNE: 'neptune',
  PLUTO: 'pluto'
};

export const PLANETARY_DATA = {
  [PLANETS.EARTH]: {
    id: PLANETS.EARTH,
    name: '지구 (Earth)',
    unlockWave: 0,
    terraformCredit: 0,
    terraformEnergy: 0,
    maxPopulation: 2000000,
    synergyDescription: '크레딧 생산 효율 +50% (x1.5)',
    applySynergy: (synergies) => {
      synergies.creditMultiplier *= 1.5;
    }
  },
  [PLANETS.LUNA]: {
    id: PLANETS.LUNA,
    name: '달 (Luna)',
    unlockWave: 5,
    terraformCredit: 15000,
    terraformEnergy: 8000,
    maxPopulation: 50000,
    synergyDescription: '지구 Aegis 보호막 초당 재생률 +25% 증가',
    applySynergy: (synergies) => {
      synergies.shieldRegenMultiplier *= 1.25;
    }
  },
  [PLANETS.MARS]: {
    id: PLANETS.MARS,
    name: '화성 (Mars)',
    unlockWave: 10,
    terraformCredit: 60000,
    terraformEnergy: 30000,
    maxPopulation: 250000,
    synergyDescription: '모든 쉽야드의 함대 제조 비용 -15%, 속도 +20%',
    applySynergy: (synergies) => {
      synergies.shipBuildCostMultiplier *= 0.85;
      synergies.shipBuildSpeedMultiplier *= 1.20;
    }
  },
  [PLANETS.VENUS]: {
    id: PLANETS.VENUS,
    name: '금성 (Venus)',
    unlockWave: 15,
    terraformCredit: 180000,
    terraformEnergy: 90000,
    maxPopulation: 120000,
    synergyDescription: '발전 인프라 효율 +150% (x2.5), 전체 타워 유지비 -20%',
    applySynergy: (synergies) => {
      synergies.energyProductionMultiplier *= 2.5;
      synergies.towerMaintenanceCostMultiplier *= 0.8;
    }
  },
  [PLANETS.MERCURY]: {
    id: PLANETS.MERCURY,
    name: '수성 (Mercury)',
    unlockWave: 20,
    terraformCredit: 400000,
    terraformEnergy: 200000,
    maxPopulation: 35000,
    synergyDescription: '전방 정찰망 제공, 태양계 모든 포탑/요새 사거리 +15%',
    applySynergy: (synergies) => {
      synergies.towerRangeMultiplier *= 1.15;
      synergies.radarEnabled = true;
    }
  },
  [PLANETS.JUPITER]: {
    id: PLANETS.JUPITER,
    name: '목성 (Jupiter)',
    unlockWave: 25,
    terraformCredit: 900000,
    terraformEnergy: 450000,
    maxPopulation: 150000,
    synergyDescription: '모든 중력 왜곡기(감속 타워)의 감속 반경 및 범위 +25%',
    applySynergy: (synergies) => {
      synergies.slowTowerRangeMultiplier *= 1.25;
      synergies.slowTowerEffectMultiplier *= 1.25;
    }
  },
  [PLANETS.SATURN]: {
    id: PLANETS.SATURN,
    name: '토성 (Saturn)',
    unlockWave: 30,
    terraformCredit: 2000000,
    terraformEnergy: 1000000,
    maxPopulation: 80000,
    synergyDescription: '고리 도크 결합, 모든 궤도 방어 기지 무기 슬롯 +1개 추가',
    applySynergy: (synergies) => {
      synergies.orbitalStationWeaponSlotsBonus += 1;
    }
  },
  [PLANETS.URANUS]: {
    id: PLANETS.URANUS,
    name: '천왕성 (Uranus)',
    unlockWave: 35,
    terraformCredit: 4500000,
    terraformEnergy: 2200000,
    maxPopulation: 40000,
    synergyDescription: '초저온 냉각 터빈 가동, 태양계 모든 타워 연사 딜레이 -10%',
    applySynergy: (synergies) => {
      synergies.towerCooldownMultiplier *= 0.9;
    }
  },
  [PLANETS.NEPTUNE]: {
    id: PLANETS.NEPTUNE,
    name: '해왕성 (Neptune)',
    unlockWave: 40,
    terraformCredit: 10000000,
    terraformEnergy: 5000000,
    maxPopulation: 20000,
    synergyDescription: '적 침공 감지 예고시간 +60초 연장, 적 이동 속도 -10%',
    applySynergy: (synergies) => {
      synergies.warningTimeBonusSeconds += 60;
      synergies.enemySpeedMultiplier *= 0.9;
    }
  },
  [PLANETS.PLUTO]: {
    id: PLANETS.PLUTO,
    name: '명왕성 (Pluto)',
    unlockWave: 45,
    terraformCredit: 25000000,
    terraformEnergy: 12000000,
    maxPopulation: 5000,
    synergyDescription: '시간 유물 동조, 타임머신 충전 속도 +30% 가속',
    applySynergy: (synergies) => {
      synergies.timeMachineChargeSpeedMultiplier *= 1.30;
    }
  }
};
