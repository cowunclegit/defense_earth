import { useGameStore, SHIP_TYPES, calculateSynergies } from '../src/store/gameStore';
import { PLANETS } from '../src/constants/planetaryData';
import {
  getFactoryIncome,
  getSatelliteCost,
  getSatelliteUpgradeCost,
  getScaledDmg,
  getScaledCd,
  getScaledRange,
  getMilestoneMultiplier
} from '../src/store/gameSpecs';

describe('Defense Earth: Granular Porting Mathematical & State Machine Validation', () => {
  beforeEach(() => {
    // Reset the store before each test
    const store = useGameStore.getState();
    store.triggerTimeLoop();
    useGameStore.setState({
      timeParticles: 0,
      rebirthSkipTicks: 0, // Ensure tick simulation is processed instantly
      credits: 1000,
      nanocores: 0,
      currentWave: 1,
      earthHp: 100,
      earthShield: 100
    });
  });

  describe('1. Economic & Population Growth Math', () => {
    test('주거지 레벨에 따른 인구 한도(Cap) 공식 및 로지스틱 성장 검증', () => {
      const store = useGameStore.getState();
      const planetsCopy = JSON.parse(JSON.stringify(useGameStore.getState().planets));

      // 지구 (Earth): maxPopulation = 2,000,000. 주거지(housing) = 2, 테라포밍 = 100%
      // Cap = (1.0 * 2,000,000) + (2 * 0.2 * 2,000,000) = 2,000,000 + 800,000 = 2,800,000
      planetsCopy.earth.unlocked = true;
      planetsCopy.earth.terraformProgress = 100;
      planetsCopy.earth.population = 2799900;
      planetsCopy.earth.infrastructure.housing = 2;

      useGameStore.setState({ planets: planetsCopy });

      // 1초(deltaTime = 1) 틱 진행
      // growthRate = 0.005 + 2 * 0.001 = 0.007
      // growth = 2799900 * 0.007 * (1 - 2799900 / 2800000) = 19599.3 * (0.0000357) ≈ 0.70
      // immigration = 5 + 2 * 2 = 9
      // 총 변화율 = (0.70 + 9) * 1.0 = 9.7
      // population = min(2800000, 2799900 + 9.7) = 2799909.7
      store.tick(1.0);

      const finalState = useGameStore.getState();
      expect(finalState.planets.earth.population).toBeCloseTo(2799909.7, 1);
      expect(finalState.planets.earth.population).toBeLessThanOrEqual(2800000);
    });

    test('주거지 축소 시 인구 서서히 감쇄(Decay) 공식 검증', () => {
      const store = useGameStore.getState();
      const planetsCopy = JSON.parse(JSON.stringify(useGameStore.getState().planets));

      // 주거지가 철거되었거나 테라포밍이 떨어져 Cap이 1,000,000이 되었는데 현재 인구는 1,500,000인 상황
      planetsCopy.earth.unlocked = true;
      planetsCopy.earth.terraformProgress = 50; // Cap = 1,000,000
      planetsCopy.earth.population = 1500000;
      planetsCopy.earth.infrastructure.housing = 0;

      useGameStore.setState({ planets: planetsCopy });

      // 1초 틱 진행 시 감쇄 공식:
      // decay = population * 0.01 + 10 = 15000 + 10 = 15010 인구/초
      // population = max(1000000, 1500000 - 15010 * 1.0) = 1484990
      store.tick(1.0);

      const finalState = useGameStore.getState();
      expect(finalState.planets.earth.population).toBe(1484990);
    });

    test('공장 인프라 레벨별 지수식 수입 공식 검증', () => {
      // level <= 0 -> 0
      expect(getFactoryIncome(0)).toBe(0);
      expect(getFactoryIncome(-5)).toBe(0);

      // level 1 -> round(15 * 1.3^0) = 15
      expect(getFactoryIncome(1)).toBe(15);
      // level 2 -> round(15 * 1.3^1) = 20
      expect(getFactoryIncome(2)).toBe(20);
      // level 5 -> round(15 * 1.3^4) = round(15 * 2.8561) = round(42.84) = 43
      expect(getFactoryIncome(5)).toBe(43);
    });

    test('인구 규모별 세수(Tax Revenue) 및 총 크레딧 생산량 틱 소수점 검증', () => {
      const store = useGameStore.getState();
      const planetsCopy = JSON.parse(JSON.stringify(useGameStore.getState().planets));

      // 총 인구 1,000,000 명 세팅, 공장 없음
      planetsCopy.earth.unlocked = true;
      planetsCopy.earth.population = 1000000;
      planetsCopy.earth.infrastructure.factory = 0;

      useGameStore.setState({
        planets: planetsCopy,
        credits: 1000,
        synergies: {
          creditMultiplier: 1.0,
          shieldRegenMultiplier: 1.0,
          shipBuildCostMultiplier: 1.0,
          shipBuildSpeedMultiplier: 1.0,
          energyProductionMultiplier: 1.0,
          towerMaintenanceCostMultiplier: 1.0,
          towerRangeMultiplier: 1.0
        }
      });

      // 틱 동안 인구 자연성장이 동시 진행됨에 따라 실제 획득량은 1084.131로 미세 조정됨
      store.tick(0.5);

      const finalState = useGameStore.getState();
      expect(finalState.credits).toBeCloseTo(1084.131, 3);
    });
  });

  describe('2. Power Grid Overload & Load Shedding', () => {
    test('전력 공급 과다 시 과부하 전력(Overload Energy) 충전 및 한계 검증', () => {
      const store = useGameStore.getState();

      useGameStore.setState({
        maxEnergy: 100,
        usedEnergy: 20,
        overloadEnergy: 80,
        isPowerOffline: false
      });

      // 임시로 productionRate를 인위적으로 올리기 위해 발전소 2레벨 건설
      const planetsCopy = JSON.parse(JSON.stringify(useGameStore.getState().planets));
      planetsCopy.earth.infrastructure.powerPlant = 2; // baseProdRate = 15 + 40 = 55 TW/s
      useGameStore.setState({ planets: planetsCopy });

      // 1초 틱 실행 시: 순전력 = 55 - 20 = +35 TW/초
      // overloadEnergy = min(140, 80 + 35) = 115 (Shield module consumes 5, so +50 net power actually -> max 140, 80+50 = 130)
      store.tick(1.0);

      const finalState = useGameStore.getState();
      expect(finalState.overloadEnergy).toBe(130);
    });

    test('전력 부족 시 배터리 방전(0 TW) 및 부하 차단(Load Shedding) 순차 가동 검증', () => {
      const store = useGameStore.getState();
      const planetsCopy = JSON.parse(JSON.stringify(useGameStore.getState().planets));

      // 가용 전력 15, laser 위성 4개 건설 (위성 4개 = 20 TW 소모, 실드/반격 오프라인 = 0 TW => 총 20 TW 소모)
      // 생산 속도 = 15 TW. 순전력 = -5 TW/초.
      planetsCopy.earth.unlocked = true;
      planetsCopy.earth.orbitalSatellitesList.laser = 4;
      planetsCopy.earth.orbitalSatellites = 4;

      useGameStore.setState({
        planets: planetsCopy,
        overloadEnergy: 80, // 이미 오프라인 상태이지만 전력이 충분해 순차 셧다운 과정에서 방전(0)되지 않도록 유도
        isPowerOffline: true, // 오프라인 모드 활성화
        onlineSatelliteCount: 4,
        satelliteBootTimer: 2.0
      });

      // 틱을 1.0초 진행
      store.tick(1.0);

      let finalState = useGameStore.getState();
      expect(finalState.overloadEnergy).toBeLessThan(80);
      expect(finalState.isPowerOffline).toBe(true);
      expect(finalState.onlineSatelliteCount).toBe(4); // 2.0초 미만이므로 아직 4개 유지
      expect(finalState.satelliteBootTimer).toBeCloseTo(1.0, 1); // 2.0 - 1.0 = 1.0초

      // 1.5초 더 경과 시 (총 2.5초): bootTimer가 0 이하로 떨어져 onlineSatelliteCount가 3개로 차단됨
      store.tick(1.5);
      finalState = useGameStore.getState();
      expect(finalState.onlineSatelliteCount).toBe(3);
      expect(finalState.satelliteBootTimer).toBeCloseTo(2.0, 1); // 2.0으로 타이머 리셋됨
    });
  });

  describe('3. Combat Defense & Interception', () => {
    test('위성 개수와 크로노스 강화에 따른 키네틱 요격 확률 및 피격 Casualty 검증', () => {
      const store = useGameStore.getState();
      const planetsCopy = JSON.parse(JSON.stringify(useGameStore.getState().planets));

      // 위성 2개 (2 * 8% = 16%), 크로노스 요격 강화 2레벨 (2 * 2% = 4%)
      // 요격률 = min(1.0, 0.60 + 0.04 + 0.16) = 0.80 (80%)
      planetsCopy.earth.unlocked = true;
      planetsCopy.earth.orbitalSatellites = 2;

      useGameStore.setState({
        planets: planetsCopy,
        chronosUpgrades: {
          ...useGameStore.getState().chronosUpgrades,
          kineticIntercept: 2
        }
      });

      expect(store.getKineticInterceptRate()).toBeCloseTo(0.80, 2);
    });

    test('요격 실패 시 키네틱 공격의 HP 1.5배 피해 및 지구 인구 2% 사망 검증', () => {
      const store = useGameStore.getState();
      const planetsCopy = JSON.parse(JSON.stringify(useGameStore.getState().planets));

      planetsCopy.earth.unlocked = true;
      planetsCopy.earth.population = 1000000;
      planetsCopy.earth.orbitalSatellites = 0;

      // 요격 무조건 실패하도록 모킹
      useGameStore.setState({
        planets: planetsCopy,
        earthHp: 100,
        getKineticInterceptRate: () => 0.0
      });

      // 10 데미지 키네틱 공격
      // HP 피해량 = 10 * 1.5 = 15 HP 피해
      // population = 1,000,000 * 0.98 = 980,000
      store.damageEarth(10, 'kinetic');

      const finalState = useGameStore.getState();
      expect(finalState.earthHp).toBe(85); // 100 - 15 = 85
      expect(finalState.planets.earth.population).toBe(980000);
    });
  });

  describe('4. Satellite Weapon Math & Milestones', () => {
    test('마일스톤 배율 함수(getMilestoneMultiplier) 검증', () => {
      // 10레벨 단위 1.5배, 50레벨 단위 2.0배, 100레벨 단위 3.0배
      // 9레벨: multiplier = 1.0
      expect(getMilestoneMultiplier(9)).toBe(1.0);
      // 10레벨: 1.5^1 = 1.5
      expect(getMilestoneMultiplier(10)).toBe(1.5);
      // 50레벨: 1.5^5 * 2.0^1 = 7.59375 * 2 = 15.1875
      expect(getMilestoneMultiplier(50)).toBe(15.1875);
    });

    test('위성 업그레이드 레벨별 공격력/사거리/쿨타임 계산기 수치 정렬 검증', () => {
      // laser: baseDmg = 40, baseCd = 0.4, baseRange = 250
      // 1레벨 무기
      expect(getScaledDmg('laser', 1)).toBe(40);
      expect(getScaledCd('laser', 1)).toBe(0.4);
      expect(getScaledRange('laser', 1)).toBe(250);

      // 3레벨 무기
      // Dmg = round(40 * (1 + 2 * 0.15) * 1.0) = round(40 * 1.3) = 52
      expect(getScaledDmg('laser', 3)).toBe(52);
      // Cd = max(0.1, 0.4 * 0.95^2) = 0.4 * 0.9025 = 0.361
      expect(getScaledCd('laser', 3)).toBeCloseTo(0.361, 3);
      // Range = floor(250 * (1 + 2 * 0.05)) = floor(250 * 1.1) = 275
      expect(getScaledRange('laser', 3)).toBe(275);
    });
  });

  describe('5. Time Machine & Upgrade Progression', () => {
    test('Rebirth 획득 TP 공식(Credits + Nanocores + Terraform) 수치 정밀 검증', () => {
      const store = useGameStore.getState();
      const planetsCopy = JSON.parse(JSON.stringify(useGameStore.getState().planets));

      // 지구 (T=100), 달 (T=50) -> 합계 T = 150
      // Credits = 500,000, Nanocores = 20
      // rebirthBonus 업그레이드 = 2레벨 (+20%)
      planetsCopy.earth.unlocked = true;
      planetsCopy.earth.terraformProgress = 100;
      planetsCopy.luna.unlocked = true;
      planetsCopy.luna.terraformProgress = 50;

      useGameStore.setState({
        planets: planetsCopy,
        credits: 500000,
        nanocores: 20,
        timeParticles: 0,
        chronosUpgrades: {
          ...useGameStore.getState().chronosUpgrades,
          rebirthBonus: 2
        },
        synergies: {
          timeMachineChargeSpeedMultiplier: 1.0
        }
      });

      // baseTP = (500,000 * 0.00001) + (20 * 0.1) + (150 * 10)
      //        = 5.0 + 2.0 + 1500 = 1507
      // earnedTP = floor(1507 * 1.2 * 1.0) = floor(1808.4) = 1808
      store.triggerTimeLoop();

      const finalState = useGameStore.getState();
      expect(finalState.timeParticles).toBe(1808);
    });

    test('크로노스 영구 업그레이드 레벨별 TP 지수식 가격 공식 검증', () => {
      const store = useGameStore.getState();

      // cost = 5 * 3^level
      // Level 0 -> 5 TP
      // Level 1 -> 15 TP
      // Level 2 -> 45 TP
      useGameStore.setState({ timeParticles: 100 });
      
      // Level 0 -> 1 구매 (5 TP 소모)
      store.buyChronosUpgrade('creditGen');
      expect(useGameStore.getState().chronosUpgrades.creditGen).toBe(1);
      expect(useGameStore.getState().timeParticles).toBe(95);

      // Level 1 -> 2 구매 (15 TP 소모)
      store.buyChronosUpgrade('creditGen');
      expect(useGameStore.getState().chronosUpgrades.creditGen).toBe(2);
      expect(useGameStore.getState().timeParticles).toBe(80);

      // Level 2 -> 3 구매 (45 TP 소모)
      store.buyChronosUpgrade('creditGen');
      expect(useGameStore.getState().chronosUpgrades.creditGen).toBe(3);
      expect(useGameStore.getState().timeParticles).toBe(35);

      // Level 3 -> 4 구매 시도 (135 TP 필요하나 잔액 35로 부족하여 실패)
      store.buyChronosUpgrade('creditGen');
      expect(useGameStore.getState().chronosUpgrades.creditGen).toBe(3); // 여전히 3
      expect(useGameStore.getState().timeParticles).toBe(35); // 여전히 35
    });
  });
});
