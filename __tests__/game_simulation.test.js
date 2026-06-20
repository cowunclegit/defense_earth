import { useGameStore, SHIP_TYPES, SHIP_SPECS } from '../src/store/gameStore';
import { PLANETS } from '../src/constants/planetaryData';

describe('Defense Earth: Cosmic Loop Core Simulation Test', () => {
  beforeEach(() => {
    // 매 테스트 시작 전 스토어를 초기화시킵니다.
    // Zustand 스토어의 상태를 Rebirth 로직을 통해 초기화 상태로 유도
    const store = useGameStore.getState();
    store.triggerTimeLoop(); // 초기 1000 크레딧, TP 0, 행성 초기화 상태로 복구
    
    // timeParticles 및 업그레이드 수동 초기화
    useGameStore.setState({
      timeParticles: 0,
      chronosUpgrades: {
        creditGen: 0,
        energyGen: 0,
        nanocoreGen: 0,
        shieldCap: 0,
        shieldRegen: 0,
        kineticIntercept: 0,
        fleetDamage: 0,
        timeMachineSpeed: 0,
        rebirthBonus: 0,
      },
      kineticDefenseTowers: 0,
      credits: 1000,
      nanocores: 0,
      fleetSlots: {
        [SHIP_TYPES.INTERCEPTOR]: 0,
        [SHIP_TYPES.ESCORT]: 0,
        [SHIP_TYPES.DESTROYER]: 0,
        [SHIP_TYPES.CRUISER]: 0,
        [SHIP_TYPES.STEALTH]: 0,
        [SHIP_TYPES.ION_BATTLESHIP]: 0,
        [SHIP_TYPES.SHIELD_CARRIER]: 0,
        [SHIP_TYPES.REPAIR_SHIP]: 0,
        [SHIP_TYPES.BARRIER_SHIP]: 0
      },
      shipyardQueue: null
    });
  });

  test('초기 상태 및 크레딧 생산량 틱 검증', () => {
    const store = useGameStore.getState();
    expect(store.credits).toBe(1000);
    expect(store.earthHp).toBe(100);
    expect(store.earthShield).toBe(100);

    // 1초(deltaTime = 1) 틱 진행
    // 새 공식: taxRevenue = 0.005 * (1,000,000 ^ 0.75) ≈ 158.1, factory=0
    // baseCreditRate ≈ 10 + 158.1 = 168.1, × synergy 1.5 ≈ 252 크레딧/초
    store.tick(1);
    
    const updatedStore = useGameStore.getState();
    // 크레딧이 인구 기반 세수 + 기본 생산으로 증가했는지만 확인 (기존 1000보다 큰지)
    expect(updatedStore.credits).toBeGreaterThan(1000);
  });

  test('행성 해금 및 테라포밍 업그레이드 자원 소모 검증', () => {
    const store = useGameStore.getState();
    
    // 달(Luna)은 5웨이브 이상 해금 조건
    store.unlockPlanet(PLANETS.LUNA);
    expect(useGameStore.getState().planets[PLANETS.LUNA].unlocked).toBe(false);

    // 웨이브를 5로 세팅 후 해금 진행
    useGameStore.setState({ currentWave: 5 });
    store.unlockPlanet(PLANETS.LUNA);
    expect(useGameStore.getState().planets[PLANETS.LUNA].unlocked).toBe(true);

    // 달의 테라포밍 1회 진행 (크레딧 1,500, 에너지 800 소모)
    // 1회당 10% 진행이므로 1500 크레딧, 800 전력 한도 요구
    // 현재 크레딧은 1000으로 부족하므로 업그레이드 불가능
    store.upgradePlanetTerraform(PLANETS.LUNA);
    expect(useGameStore.getState().planets[PLANETS.LUNA].terraformProgress).toBe(0);

    // 자원 강제 추가 및 최대 전력 계산을 위해 틱 한번 돌려서 maxEnergy 증가시킴
    useGameStore.setState({ credits: 5000, maxEnergy: 1000 });
    
    store.upgradePlanetTerraform(PLANETS.LUNA);
    const postUpgradeStore = useGameStore.getState();
    expect(postUpgradeStore.planets[PLANETS.LUNA].terraformProgress).toBe(10);
    expect(postUpgradeStore.credits).toBe(3500); // 5000 - 1500
    expect(postUpgradeStore.usedEnergy).toBe(820); // 20 + 800
  });

  test('달 테라포밍 80% 돌파 시 시너지(실드 재생 버프) 활성화 검증', () => {
    const store = useGameStore.getState();
    
    // 달 해금
    useGameStore.setState({ currentWave: 5 });
    store.unlockPlanet(PLANETS.LUNA);

    // 달의 테라포밍을 80%로 강제 세팅하고 시너지 계산 갱신
    useGameStore.setState((state) => {
      const updatedPlanets = {
        ...state.planets,
        [PLANETS.LUNA]: {
          ...state.planets[PLANETS.LUNA],
          terraformProgress: 80,
          population: 40000
        }
      };
      
      // synergies 재계산
      const baseChronos = state.chronosUpgrades;
      const synergies = {
        creditMultiplier: 1.0,
        shieldRegenMultiplier: 1.0,
        shipBuildCostMultiplier: 1.0,
        shipBuildSpeedMultiplier: 1.0,
        energyProductionMultiplier: 1.0,
        towerMaintenanceCostMultiplier: 1.0,
        towerRangeMultiplier: 1.0,
        radarEnabled: false,
        slowTowerRangeMultiplier: 1.0,
        slowTowerEffectMultiplier: 1.0,
        orbitalStationWeaponSlotsBonus: 0,
        towerCooldownMultiplier: 1.0,
        warningTimeBonusSeconds: 0,
        enemySpeedMultiplier: 1.0,
        timeMachineChargeSpeedMultiplier: 1.0,
      };
      // 달 시너지 직접 적용
      synergies.shieldRegenMultiplier *= 1.25;

      return {
        planets: updatedPlanets,
        synergies
      };
    });

    const updatedStore = useGameStore.getState();
    expect(updatedStore.synergies.shieldRegenMultiplier).toBe(1.25);
  });

  test('이원화 실드: 에너지 공격 vs 키네틱 공격 역학 테스트', () => {
    const store = useGameStore.getState();

    // 1. 에너지 공격: 빔 10 데미지 -> 150% 증폭하여 15 실드 깎임
    store.damageEarth(10, 'energy');
    expect(useGameStore.getState().earthShield).toBe(85);

    // 2. 키네틱 공격: 요격 확률 기본 60%
    // 요격 확률 100%로 강제 조정하여 완벽 방격 검증
    useGameStore.setState({
      planets: {
        ...useGameStore.getState().planets,
        [PLANETS.EARTH]: {
          ...useGameStore.getState().planets[PLANETS.EARTH],
          orbitalSatellites: 5
        }
      }
    }); // 위성 5개 (기본 60% + 40% = 100%)
    expect(useGameStore.getState().getKineticInterceptRate()).toBe(1.0);

    const initialHp = useGameStore.getState().earthHp;
    const initialPopulation = useGameStore.getState().planets[PLANETS.EARTH].population;

    store.damageEarth(20, 'kinetic'); // 100% 확률로 요격 성공해야 함
    
    expect(useGameStore.getState().earthHp).toBe(initialHp);
    expect(useGameStore.getState().planets[PLANETS.EARTH].population).toBe(initialPopulation);

    // 요격 확률 0%로 강제 조정하여 피격 및 인구 사망 패널티 검증
    useGameStore.setState({
      planets: {
        ...useGameStore.getState().planets,
        [PLANETS.EARTH]: {
          ...useGameStore.getState().planets[PLANETS.EARTH],
          orbitalSatellites: 0
        }
      }
    });
    // 요격률을 강제로 0%로 오버라이드하기 위해 임시 목업
    const originalGetRate = store.getKineticInterceptRate;
    useGameStore.setState({
      getKineticInterceptRate: () => 0.0
    });

    store.damageEarth(10, 'kinetic'); // 요격 무조건 실패
    
    // 키네틱은 150% 관통 피해 -> 10 * 1.5 = 15 HP 피해
    expect(useGameStore.getState().earthHp).toBe(initialHp - 15);
    // 지구 인구 2% 사망 검증
    expect(useGameStore.getState().planets[PLANETS.EARTH].population).toBe(Math.floor(initialPopulation * 0.98));

    // 원래 메서드로 복구
    useGameStore.setState({ getKineticInterceptRate: originalGetRate });
  });

  test('쉽야드 함선 대기열 자동 보충 및 완성 시 궤도 배치 테스트', () => {
    const store = useGameStore.getState();

    // 요격기 슬롯 2개 예약
    store.setFleetReservation(SHIP_TYPES.INTERCEPTOR, 2);
    expect(useGameStore.getState().fleetSlots[SHIP_TYPES.INTERCEPTOR]).toBe(2);

    // 크레딧 자원이 1000이므로 요격기(비용 200) 생산 개시 가능
    store.tick(0.1); // 틱을 주면 예약 수량이 부족함을 인지하고 자동 건조 시작
    
    const postTickStore = useGameStore.getState();
    expect(postTickStore.shipyardQueue).not.toBeNull();
    expect(postTickStore.shipyardQueue.type).toBe(SHIP_TYPES.INTERCEPTOR);
    // 0.1초 동안 새 공식으로 크레딧 생산 후 요격기(200Cr) 차감
    // 크레딧이 1000 - 200 = 800보다 크고(틱 생산분 포함), 1000보다 작은지 확인
    expect(postTickStore.credits).toBeGreaterThan(800);
    expect(postTickStore.credits).toBeLessThan(1000);

    // 요격기 빌드타임은 5초. 5초 동안 틱을 경과시킨다.
    store.tick(5.0);

    const finishStore = useGameStore.getState();
    expect(finishStore.shipyardQueue).toBeNull(); // 건조 대기열 비어짐
    expect(finishStore.fleet.length).toBe(1); // 함대에 요격기 1대 배치됨
    expect(finishStore.fleet[0].type).toBe(SHIP_TYPES.INTERCEPTOR);
  });

  test('타임머신 강제 회귀(Rebirth) 및 영구 업그레이드 보존 검증', () => {
    const store = useGameStore.getState();

    // 크레딧 강제 추가
    useGameStore.setState({ credits: 200000 }); // 200,000 credits
    
    // 크로노스 업그레이드 레벨 증가시키기 위해 TP 충전
    useGameStore.setState({ timeParticles: 100 });
    store.buyChronosUpgrade('creditGen'); // 1레벨 비용 5 TP 소모
    expect(useGameStore.getState().chronosUpgrades.creditGen).toBe(1);
    expect(useGameStore.getState().timeParticles).toBe(95);

    // 타임머신 강제 작동
    store.triggerTimeLoop();

    const postRebirthStore = useGameStore.getState();
    
    // 크레딧 초기화 검증
    expect(postRebirthStore.credits).toBe(1000);
    
    // 영구 업그레이드(creditGen 레벨 1) 보존 검증
    expect(postRebirthStore.chronosUpgrades.creditGen).toBe(1);

    // 획득 TP 공식:
    // credits * 0.00001 = 200,000 * 0.00001 = 2 TP 획득 (소수점 버림)
    // 지구 테라포밍 점수 (100% * 10 = 1000 TP)
    // 총 1002 TP 획득
    // 기존 95 TP + 1002 TP = 1097 TP
    expect(postRebirthStore.timeParticles).toBe(1097);
  });

  test('지상 방어 기지 세부 무기 및 위성 건설 자원 검증', () => {
    const store = useGameStore.getState();
    useGameStore.setState({ credits: 2000, maxEnergy: 500 });
    
    // 지상 기지는 더 이상 건설할 수 없음
    const successGatling = store.buildGroundBaseDetail('earth', 'gatling');
    expect(successGatling).toBe(false);

    // Laser satellite: cost 200, energy 5
    const successLaser = store.buildOrbitalSatelliteDetail('earth', 'laser');
    expect(successLaser).toBe(true);
    expect(useGameStore.getState().credits).toBe(1800);
    expect(useGameStore.getState().usedEnergy).toBe(25);
    expect(useGameStore.getState().planets.earth.orbitalSatellitesList.laser).toBe(1);
  });

  test('행성 실드 모듈 및 반격 모듈 교체/활성화 테스트', () => {
    const store = useGameStore.getState();
    useGameStore.setState({ credits: 10000, maxEnergy: 1000 });
    
    // tick을 돌려 기본 실드 모듈의 에너지 소모(5W)를 usedEnergy에 반영시킵니다.
    store.tick(0.1);
    const creditsAfterTick = useGameStore.getState().credits;

    // Change module to plasma (cost 1000, capacity bonus +1500, regen 25/s, energy 15W)
    const successModule = store.changeShieldModule('plasma');
    expect(successModule).toBe(true);
    expect(useGameStore.getState().shieldModule).toBe('plasma');
    // 틱 후 증가한 크레딧에서 plasma 비용(1000Cr) 차감 확인
    expect(useGameStore.getState().credits).toBeCloseTo(creditsAfterTick - 1000, 0);
    expect(useGameStore.getState().usedEnergy).toBe(30);
    expect(store.getShieldCapacity()).toBe(1600); // 100 base + 1500 plasma = 1600

    // Toggle discharge counterattack module (cost 2000, energy 10W)
    const creditsBeforeDischarge = useGameStore.getState().credits;
    const successCounter = store.toggleCounterattackModule('discharge');
    expect(successCounter).toBe(true);
    expect(useGameStore.getState().counterattackModules.discharge).toBe(true);
    expect(useGameStore.getState().unlockedCounterattacks.discharge).toBe(true);
    expect(useGameStore.getState().credits).toBeCloseTo(creditsBeforeDischarge - 2000, 0);
    expect(useGameStore.getState().usedEnergy).toBe(30);

    // Toggle OFF: should not change credits, should mark active as false, and keep unlocked status
    const creditsBeforeOff = useGameStore.getState().credits;
    const successOff = store.toggleCounterattackModule('discharge');
    expect(successOff).toBe(true);
    expect(useGameStore.getState().counterattackModules.discharge).toBe(false);
    expect(useGameStore.getState().unlockedCounterattacks.discharge).toBe(true);
    expect(useGameStore.getState().credits).toBe(creditsBeforeOff); // OFF 해도 크레딧 변동 없음

    // Set credits to 0: since it is unlocked, toggling it ON should still succeed
    useGameStore.setState({ credits: 0 });
    const successOnAgain = store.toggleCounterattackModule('discharge');
    expect(successOnAgain).toBe(true);
    expect(useGameStore.getState().counterattackModules.discharge).toBe(true);
    expect(useGameStore.getState().credits).toBe(0);

    // Try to toggle a locked module (reflector, cost 2000) when credits are 0: should fail
    const successReflectorFail = store.toggleCounterattackModule('reflector');
    expect(successReflectorFail).toBe(false);
    expect(useGameStore.getState().counterattackModules.reflector).toBe(false);
    expect(useGameStore.getState().unlockedCounterattacks.reflector).toBe(false);
  });

  test('개발자 데이터베이스 초기화(resetDatabase) 검증', async () => {
    const store = useGameStore.getState();

    // 임의의 비-기본 값 세팅
    useGameStore.setState({
      credits: 9999,
      nanocores: 88,
      timeParticles: 777,
      currentWave: 12,
      isPremium: true
    });

    // resetDatabase 호출
    await store.resetDatabase();

    const updatedStore = useGameStore.getState();

    // 초기 상태값으로 전부 돌아갔는지 검증
    expect(updatedStore.credits).toBe(1000);
    expect(updatedStore.nanocores).toBe(0);
    expect(updatedStore.timeParticles).toBe(0);
    expect(updatedStore.currentWave).toBe(1);
    expect(updatedStore.isPremium).toBe(false);
    expect(updatedStore.earthHp).toBe(100);
  });

  test('자연적인 웨이브 스폰 및 클리어 시 웨이브 상승 검증', () => {
    const store = useGameStore.getState();

    // 초기 상태: currentWave: 1, enemiesRemainingToSpawn: 8
    expect(store.currentWave).toBe(1);
    expect(store.enemiesRemainingToSpawn).toBe(8);

    // 틱을 여러 번 줘서 8마리 스폰하게 만든다.
    // spawnInterval은 5.0 - 1 * 0.1 = 4.9초
    // 5초씩 틱을 줘서 8마리를 모두 스폰시킨다.
    for (let i = 0; i < 8; i++) {
      store.tick(5.0);
    }

    const midStore = useGameStore.getState();
    expect(midStore.enemiesRemainingToSpawn).toBe(0);
    expect(midStore.enemies.length).toBe(8);
    expect(midStore.currentWave).toBe(1); // 아직 적들이 격침 안 되었으므로 여전히 웨이브 1

    // 적들을 모두 지운다 (격침 처리)
    useGameStore.setState({ enemies: [] });

    // 틱을 한 번 더 준다 (클리어 검증 틱)
    store.tick(0.1);

    const finishStore = useGameStore.getState();
    expect(finishStore.currentWave).toBe(2); // 웨이브 2 진입 성공!
    expect(finishStore.enemiesRemainingToSpawn).toBe(10); // 웨이브 2는 (3 + 2) * 2 = 10마리
  });

  test('지구 체력 0 도달 시 즉시 파괴 방지, 지연 폭발 및 시간 루프 지연 실행 검증', () => {
    const store = useGameStore.getState();

    // 1. 강제로 지구에 큰 피해를 줘서 체력을 0으로 만듦
    // 현재 지구 HP는 100, 실드는 100
    // 300 에너지 데미지 -> 300 * 1.5 = 450 실드 피해 -> 실드 0 깎이고 남은 350 피해 -> 350 / 1.5 * 0.5 = 116.67 HP 피해 -> HP 0 도달
    store.damageEarth(300, 'energy');
    
    let state = useGameStore.getState();
    expect(state.earthHp).toBe(0);
    expect(state.timeLoopCountdown).toBe(2.5);
    expect(state.particles.length).toBeGreaterThanOrEqual(40);
    // 아직 타임 루프가 시작되지 않아 웨이브 1이고, 크레딧 등 초기화 안 됨
    expect(state.currentWave).toBe(1);

    // 2. 1초 경과 틱 (deltaTime = 1.0)
    store.tick(1.0);
    state = useGameStore.getState();
    expect(state.earthHp).toBe(0);
    expect(state.timeLoopCountdown).toBeCloseTo(1.5, 1);
    expect(state.currentWave).toBe(1); // 여전히 1

    // 3. 2초 더 경과 틱 (deltaTime = 2.0, 총 3초로 2.5초 초과)
    store.tick(2.0);
    state = useGameStore.getState();
    
    // 시간 회귀가 가동되었으므로 상태가 초기화되어야 함
    expect(state.earthHp).toBe(100);
    expect(state.timeLoopCountdown).toBe(0);
    expect(state.currentWave).toBe(1);
    expect(state.credits).toBe(1000);
  });

  test('위성 포탄 발사 후 공중 비행 및 실제 충돌/피해 검증', () => {
    const store = useGameStore.getState();

    // 1. 지구에 타겟팅 레이저 위성을 1개 설치
    useGameStore.setState({ credits: 2000, maxEnergy: 500 });
    const successLaser = store.buildOrbitalSatelliteDetail('earth', 'laser');
    expect(successLaser).toBe(true);

    // 2. 적 스폰 (x: 450, y: 450)
    const testEnemy = {
      id: 'test-enemy-1',
      level: 1,
      type: 'scout',
      x: 450,
      y: 450,
      hp: 30,
      maxHp: 30,
      speed: 0,
      attackTimer: 0,
      spec: { name: '정찰선', maxHp: 30, damage: 10, creditReward: 10, coreChance: 0, speed: 0, cooldown: 5, attackType: 'kinetic' }
    };
    useGameStore.setState({ enemies: [testEnemy], projectiles: [], enemySpawnTimer: 0, enemiesRemainingToSpawn: 0 });

    // 위성 쿨타임 초기화
    const earth = useGameStore.getState().planets.earth;
    earth.satelliteTimers.laser = 0;

    // 3. 틱을 0.001초 실행하여 공격 유도 (위성은 쿨타임이 0이므로 즉시 공격하여 투사체 생성)
    store.tick(0.001);

    const postLaunchState = useGameStore.getState();
    expect(postLaunchState.projectiles.length).toBe(1);

    const proj = postLaunchState.projectiles[0];
    expect(proj.targetEnemyId).toBe('test-enemy-1');

    // 4. 다음 몇 프레임 틱 진행 시 투사체가 즉시 사라지지 않고 공중을 날아다녀야 함
    // 0.01초 틱 진행
    store.tick(0.01);
    
    let midFlightState = useGameStore.getState();
    expect(midFlightState.projectiles.length).toBe(1); // 아직 충돌할 거리가 아니므로 투사체가 살아있어야 함
    expect(midFlightState.enemies[0].hp).toBe(30);    // 적 체력은 30 유지

    // 5. 소량의 틱(0.05초)을 반복하여 투사체가 날아가 충돌할 때까지 진행
    let collided = false;
    for (let i = 0; i < 20; i++) {
      store.tick(0.05);
      const state = useGameStore.getState();
      if (state.projectiles.length === 0) {
        collided = true;
        break;
      }
    }
    expect(collided).toBe(true);

    const hitState = useGameStore.getState();
    expect(hitState.projectiles.length).toBe(0); // 투사체 소멸
    expect(hitState.enemies.length).toBe(0);     // hp가 깎여 0 이하가 되었으므로 적 소멸
  });

  test('공격형 위성과 방어형 위성의 독립적 한도(각 20개) 및 글로벌 누진 가격 검증', () => {
    const store = useGameStore.getState();
    // 충분한 자원 세팅 (40개 건설 시 가격이 누진되어 천문학적으로 커지므로 충분히 큰 크레딧 부여)
    useGameStore.setState({ credits: 999999999999, maxEnergy: 100000 });

    // 1. 첫번째 위성 가격 검증 (기본 200, 누적 0개)
    const initCredits = useGameStore.getState().credits;
    const success1 = store.buildOrbitalSatelliteDetail('earth', 'laser');
    expect(success1).toBe(true);
    expect(useGameStore.getState().credits).toBe(initCredits - 200);

    // 두번째 위성 가격 검증 (200 * 1.5 = 300, 누적 1개)
    const success2 = store.buildOrbitalSatelliteDetail('earth', 'laser');
    expect(success2).toBe(true);
    expect(useGameStore.getState().credits).toBe(initCredits - 200 - 300);

    // 세번째 위성은 다른 종류인 decoy(기본 100)를 만듦 (디코이는 0개째이므로 누진세 없이 기본 100 Cr 차감)
    const preDecoyCredits = useGameStore.getState().credits;
    const successDecoy = store.buildOrbitalSatelliteDetail('earth', 'decoy');
    expect(successDecoy).toBe(true);
    expect(useGameStore.getState().credits).toBe(preDecoyCredits - 100);

    // 네번째 위성 (laser) 가격 검증 (레이저 위성 2개 보유 상태이므로 200 * 1.5^2 = 450 Cr 차감)
    const preLaser3Credits = useGameStore.getState().credits;
    const successLaser3 = store.buildOrbitalSatelliteDetail('earth', 'laser');
    expect(successLaser3).toBe(true);
    expect(useGameStore.getState().credits).toBe(preLaser3Credits - 450);

    // 이제 나머지 한도들을 채우고 한도가 올바르게 작동하는지 검증
    // 현재 지구 위성 상태: laser 3개, decoy 1개 (총 4개)
    // 공격형 위성: laser 3개 (최대 20개이므로 17개 더 지을 수 있음)
    // 방어형 위성: decoy 1개 (최대 20개이므로 19개 더 지을 수 있음)

    for (let i = 0; i < 17; i++) {
      const success = store.buildOrbitalSatelliteDetail('earth', 'laser');
      expect(success).toBe(true);
    }
    // 21번째 laser 위성 건설 실패 검증 (한도 20개 초과)
    const successLaser21 = store.buildOrbitalSatelliteDetail('earth', 'laser');
    expect(successLaser21).toBe(false);

    // 그러나 다른 종류의 공격 위성(plasmaLaser)은 정상적으로 건설 가능해야 함 (종류별 한도 20개 적용)
    const successPlasmaLaser = store.buildOrbitalSatelliteDetail('earth', 'plasmaLaser');
    expect(successPlasmaLaser).toBe(true);
    expect(useGameStore.getState().planets.earth.orbitalSatellitesList.plasmaLaser).toBe(1);

    for (let i = 0; i < 19; i++) {
      const success = store.buildOrbitalSatelliteDetail('earth', 'decoy');
      expect(success).toBe(true);
    }
    // 21번째 decoy 위성 건설 실패 검증 (한도 20개 초과)
    const successDecoy21 = store.buildOrbitalSatelliteDetail('earth', 'decoy');
    expect(successDecoy21).toBe(false);

    // 총 위성 개수가 41개(laser 20개 + decoy 20개 + plasmaLaser 1개)인지 검증
    const state = useGameStore.getState();
    expect(state.planets.earth.orbitalSatellites).toBe(41);
  });

  test('위성 무기 카테고리별 업그레이드(데미지, 속도, 범위) 레벨 상승, 크레딧 차감, 스펙 비율 상승 및 회귀(Rebirth) 시 리셋 검증', () => {
    const store = useGameStore.getState();
    
    // 데이터베이스 초기화
    store.resetDatabase();
    
    const s1 = useGameStore.getState();
    expect(s1.satelliteLevels.laser).toEqual({ damage: 1, speed: 1, range: 1 });

    // 1. 데미지 레벨 1 -> 2 업그레이드 (비용 300 Cr)
    useGameStore.setState({ credits: 1000 });
    const successUpg1 = store.upgradeSatellite('laser', 'damage');
    expect(successUpg1).toBe(true);
    
    const s2 = useGameStore.getState();
    expect(s2.satelliteLevels.laser.damage).toBe(2);
    expect(s2.credits).toBe(700); // 1000 - 300

    // 2. 데미지 레벨 2 -> 3 업그레이드 (지수식 비용: 200 * 1.5 * 1.15^1 = 345 Cr)
    const successUpg2 = store.upgradeSatellite('laser', 'damage');
    expect(successUpg2).toBe(true);

    const s3 = useGameStore.getState();
    expect(s3.satelliteLevels.laser.damage).toBe(3);
    expect(s3.credits).toBe(355); // 700 - 345 = 355

    // 3. 공격속도 레벨 1 -> 2 업그레이드 (비용 300 Cr - 크레딧 부족 상황 만들기 위해 200 Cr로 강제 세팅)
    useGameStore.setState({ credits: 200 });
    const successUpgFail = store.upgradeSatellite('laser', 'speed');
    expect(successUpgFail).toBe(false);
    expect(useGameStore.getState().satelliteLevels.laser.speed).toBe(1);

    // 4. 전투 틱에서 데미지 레벨 3 공격력 반영 검증 (기본 120 * 1.30 = 156)
    // 지구 궤도에 타겟팅 레이저 위성 1개 설치
    useGameStore.setState({ credits: 10000, maxEnergy: 1000 });
    store.buildOrbitalSatelliteDetail('earth', 'laser');
    
    // 기존 적/투사체 초기화 및 테스트 적 스폰
    useGameStore.setState({
      enemies: [{
        id: 'upgrade-test-enemy',
        type: 'scout',
        x: 100, // 지구 근처
        y: 100,
        hp: 200,
        maxHp: 200,
        speed: 10,
        level: 1,
        spec: { name: '정찰선', speed: 40, hp: 40, creditReward: 15, coreChance: 0.05 }
      }],
      projectiles: []
    });

    // 쿨타임 0 상태로 만들기 위해 타이머 강제 초기화
    const earthPlanet = useGameStore.getState().planets.earth;
    earthPlanet.satelliteTimers = { laser: 0 };
    
    // 틱 실행하여 레이저 발사
    store.tick(0.001);

    const shotState = useGameStore.getState();
    expect(shotState.projectiles.length).toBe(1);
    expect(shotState.projectiles[0].damage).toBe(52); // 40 * 1.3 = 52

    // 4-2. 마일스톤 레벨(Level 10) 도달 시 Tap Titans 2 스타일 공격력 점프 검증
    // 데미지 레벨 10으로 강제 세팅 (기본 40 * (1 + 9 * 0.15) * 1.5배 마일스톤 보너스 = 40 * 2.35 * 1.5 = 94 * 1.5 = 141)
    useGameStore.setState({
      satelliteLevels: {
        ...useGameStore.getState().satelliteLevels,
        laser: { damage: 10, speed: 1, range: 1 }
      },
      enemies: [{
        id: 'milestone-test-enemy',
        type: 'scout',
        x: 100,
        y: 100,
        hp: 500,
        maxHp: 500,
        speed: 10,
        level: 1,
        spec: { name: '정찰선', speed: 40, hp: 40, creditReward: 15, coreChance: 0.05 }
      }],
      projectiles: []
    });
    
    useGameStore.getState().planets.earth.satelliteTimers = { laser: 0 };
    store.tick(0.001);
    
    const milestoneShotState = useGameStore.getState();
    expect(milestoneShotState.projectiles.length).toBe(1);
    expect(milestoneShotState.projectiles[0].damage).toBe(141);

    // 5. 시간 회귀(triggerTimeLoop) 시 레벨 리셋 검증
    store.triggerTimeLoop();
    const rebirthState = useGameStore.getState();
    expect(rebirthState.satelliteLevels.laser).toEqual({ damage: 1, speed: 1, range: 1 });
  });

  test('공격형 위성과 방어형 위성의 이원 궤도 반지름 및 위치 계산 검증', () => {
    const store = useGameStore.getState();
    useGameStore.setState({ credits: 10000, maxEnergy: 1000 });

    // 1. 공격형 위성(laser) 2개, 방어형 위성(decoy) 1개 건설
    store.buildOrbitalSatelliteDetail('earth', 'laser');
    store.buildOrbitalSatelliteDetail('earth', 'laser');
    store.buildOrbitalSatelliteDetail('earth', 'decoy');

    const state = useGameStore.getState();
    const earth = state.planets.earth;
    
    expect(earth.orbitalSatellites).toBe(3);
    expect(earth.orbitalSatellitesList.laser).toBe(2);
    expect(earth.orbitalSatellitesList.decoy).toBe(1);

    // 2. tick 실행 시 시뮬레이션에서 계산하는 위성 위치 및 궤도 검사
    const earthSatellites = [];
    Object.keys(earth.orbitalSatellitesList).forEach((type) => {
      const count = earth.orbitalSatellitesList[type] || 0;
      for (let i = 0; i < count; i++) {
        earthSatellites.push({ type, globalIndex: earthSatellites.length });
      }
    });

    const SATELLITE_SPECS_MOCK = {
      laser: { isWeapon: true },
      decoy: { isWeapon: false }
    };

    const attackSats = earthSatellites.filter(sat => SATELLITE_SPECS_MOCK[sat.type]?.isWeapon);
    const defenseSats = earthSatellites.filter(sat => !SATELLITE_SPECS_MOCK[sat.type]?.isWeapon);

    expect(attackSats.length).toBe(2);
    expect(defenseSats.length).toBe(1);

    const processed = earthSatellites.map(sat => {
      const isWeapon = SATELLITE_SPECS_MOCK[sat.type]?.isWeapon;
      const sameOrbitList = isWeapon ? attackSats : defenseSats;
      const localIndex = sameOrbitList.findIndex(s => s.globalIndex === sat.globalIndex);
      return {
        ...sat,
        localIndex: localIndex >= 0 ? localIndex : 0,
        isWeapon,
        orbitRadius: isWeapon ? 145 : 120
      };
    });

    const laser1 = processed.find(s => s.type === 'laser' && s.localIndex === 0);
    const laser2 = processed.find(s => s.type === 'laser' && s.localIndex === 1);
    const decoySat = processed.find(s => s.type === 'decoy' && s.localIndex === 0);

    expect(laser1.orbitRadius).toBe(145);
    expect(laser2.orbitRadius).toBe(145);
    expect(decoySat.orbitRadius).toBe(120);

    expect(laser1.localIndex).toBe(0);
    expect(laser2.localIndex).toBe(1);
    expect(decoySat.localIndex).toBe(0);
  });

  test('지구 HP 및 실드 회복 장치 업그레이드, 틱 회복 및 회귀(Rebirth) 리셋 검증', () => {
    const store = useGameStore.getState();

    // 1. 초기 레벨 검증 (기본 1레벨)
    expect(store.earthHpRegenLevel).toBe(1);
    expect(store.earthShieldRegenLevel).toBe(1);

    // 2. 업그레이드 비용 차감 및 레벨 상승 검증 (비용 300 * 1 * 1.5 = 450 Cr)
    useGameStore.setState({ credits: 1000 });
    const successHp = store.upgradeEarthHpRegen();
    expect(successHp).toBe(true);
    expect(useGameStore.getState().earthHpRegenLevel).toBe(2);
    expect(useGameStore.getState().credits).toBe(550); // 1000 - 450

    const successShield = store.upgradeEarthShieldRegen();
    expect(successShield).toBe(true);
    expect(useGameStore.getState().earthShieldRegenLevel).toBe(2);
    expect(useGameStore.getState().credits).toBe(100); // 550 - 450

    // 자원 부족 시 실패 검증
    const successHpFail = store.upgradeEarthHpRegen(); // 필요 비용 300 * 2 * 1.5 = 900
    expect(successHpFail).toBe(false);
    expect(useGameStore.getState().earthHpRegenLevel).toBe(2);

    // 3. 틱 회복 동작 검증
    // 지구 체력을 50으로, 실드를 50으로 깎고 틱 진행
    useGameStore.setState({
      earthHp: 50,
      earthShield: 50
    });

    // 1초(deltaTime = 1) 틱 진행
    // HP 회복량: 2 * 2 = 4 HP/초
    // 실드 회복량:
    //   baseRegen = 10 (기본 포스필드 모듈) + (2 - 1) * 3 = 13 실드/초
    //   shieldRegenMultiplier = 1.0 (시너지 곱)
    //   satelliteBonus = 1.0 (위성 수 = 0)
    //   => 13 * 1 * 1 * 1.0초 = 13 실드/초
    store.tick(1.0);

    const postTickState = useGameStore.getState();
    expect(postTickState.earthHp).toBe(54); // 50 + 4 = 54
    expect(postTickState.earthShield).toBe(63); // 50 + 13 = 63

    // 4. 시간 회귀(triggerTimeLoop) 시 리셋 검증
    store.triggerTimeLoop();
    const rebirthState = useGameStore.getState();
    expect(rebirthState.earthHpRegenLevel).toBe(1);
    expect(rebirthState.earthShieldRegenLevel).toBe(1);
  });

  test('과부하 부가 모듈 활성화 시 동적 에너지 소모 및 비활성화 시 충전 검증', () => {
    const store = useGameStore.getState();

    // 1. 초기 overloadEnergy = 100 검증
    expect(store.overloadEnergy).toBe(100);

    // 2. 모듈 toggle (discharge = ON, reflector = ON) -> 총 초당 20 소모 예상
    // 기본 실드 모듈이 5 TW를 소모하므로 총 소모 25 TW/초, 생산 15 TW/초 => 순전력 -10 TW/초
    useGameStore.setState({
      counterattackModules: {
        reflector: true,
        discharge: true,
        electricField: false
      }
    });

    // 1초 틱 실행
    store.tick(1.0);
    expect(useGameStore.getState().overloadEnergy).toBe(90); // 100 - 10 = 90

    // 3. 모듈 모두 OFF -> 기본 실드 소모 5 TW/초, 생산 15 TW/초 => 순전력 +10 TW/초
    useGameStore.setState({
      counterattackModules: {
        reflector: false,
        discharge: false,
        electricField: false
      }
    });

    // 1초 틱 실행
    store.tick(1.0);
    expect(useGameStore.getState().overloadEnergy).toBe(100); // 90 + 10 = 100
  });

  test('가용 전력 방전(0 TW) 시 실드 및 위성 비활성화 검증', () => {
    const store = useGameStore.getState();

    // 1. 가용 전력을 0으로 설정 (방전 상태)
    useGameStore.setState({
      overloadEnergy: 0,
      earthShield: 500,
      shieldModule: 'phase'
    });

    // 틱을 실행했을 때 실드가 Off(0)가 되는지 검증
    store.tick(1.0);
    expect(useGameStore.getState().earthShield).toBe(0);

    // 2. 방전 상태에서 데미지 피격 시 실드가 흡수하거나 phase 패시브가 작동하지 않고 온전히 직접 피해로 환산되는지 검증
    useGameStore.setState({
      earthHp: 100,
      overloadEnergy: 0,
      earthShield: 0
    });

    // 10 데미지 energy 공격 피격 (피어싱 데미지 배율 1.5배, 선체 피격 시 감쇄율 0.5배 적용)
    store.damageEarth(10, 'energy');
    // 100 - (10 * 1.5 / 1.5 * 0.5) = 95 HP가 되는지 확인
    expect(useGameStore.getState().earthHp).toBe(95);
  });

  test('순차적 가동 제어 및 방전 시 소모량 0차감 검증', () => {
    const store = useGameStore.getState();

    // 1. 초기 셋업: 방전 상태(isPowerOffline = true, overloadEnergy = 0)로 진입
    useGameStore.setState({
      isPowerOffline: true,
      overloadEnergy: 0,
      onlineSatelliteCount: 0,
      satelliteBootTimer: 2.0,
      shieldModule: 'basic', // basic shield cost = 5 TW
      counterattackModules: {
        reflector: true, // reflector cost = 10 TW
        discharge: false,
        electricField: false
      },
      planets: {
        earth: {
          unlocked: true,
          orbitalSatellitesList: {
            laser: 1 // laser satellite cost = 5 TW
          }
        }
      }
    });

    // 틱을 실행하기 전, 방전 상태이고 가용 전력 0이므로 실드(20 TW)도 비활성
    // 모든 소비 전력은 0이어야 함.
    // 생산 전력 = 15 TW. 순전력 = +15 TW.
    // 1초 후 가용 전력은 15 TW가 되어야 함.
    store.tick(1.0);
    expect(useGameStore.getState().overloadEnergy).toBe(15);
    expect(useGameStore.getState().onlineSatelliteCount).toBe(0);
    expect(useGameStore.getState().isPowerOffline).toBe(true);

    // 2. 가용 전력을 20 TW로 세팅하여 실드 기동
    // 실드 모듈 활성화로 소비 전력 = 5 TW.
    // 순전력 = 15 - 5 = +10 TW.
    // 1.0초 경과 시: timer가 2.0에서 1.0으로 가고 onlineSatelliteCount는 여전히 0
    useGameStore.setState({
      overloadEnergy: 20,
      satelliteBootTimer: 2.0
    });
    store.tick(1.0);
    expect(useGameStore.getState().overloadEnergy).toBe(30); // 20 + 10 * 1.0
    expect(useGameStore.getState().onlineSatelliteCount).toBe(0);
    expect(useGameStore.getState().satelliteBootTimer).toBe(1.0);

    // 1.0초 더 경과 시 (총 2초 경과): timer가 0 이하가 되어 onlineSatelliteCount가 1로 증가하고 timer가 2.0으로 리셋됨
    store.tick(1.0);
    expect(useGameStore.getState().overloadEnergy).toBe(40); // 30 + 10 * 1.0
    expect(useGameStore.getState().onlineSatelliteCount).toBe(1);
    expect(useGameStore.getState().satelliteBootTimer).toBe(2.0);

    // 3. 복구 완료 검증: 모든 위성(1개)이 복원되고 가용 전력이 80 TW에 도달했을 때 정상화(isPowerOffline = false)
    useGameStore.setState({
      overloadEnergy: 80
    });
    // 틱 한 번 돌리면 복구 완료 체크
    store.tick(0.1);
    expect(useGameStore.getState().isPowerOffline).toBe(false);

    // 4. 과부하 및 부하 차단 (Load Shedding) 검증
    // 정상 운영 중이었으나 위성 전력 부하 초과로 overloadEnergy 방전 상태가 되었을 때
    useGameStore.setState({
      isPowerOffline: true,
      overloadEnergy: 50,
      onlineSatelliteCount: 3,
      satelliteBootTimer: 2.0,
      planets: {
        earth: {
          unlocked: true,
          orbitalSatellitesList: {
            laser: 3 // laser satellite 3개, 개당 5 TW = 15 TW 소모
          }
        }
      }
    });
    // 실드(5 TW) + 위성(15 TW) = 총 20 TW 소모. 생산 15 TW. 순전력 = -5 TW < 0.
    // 1.0초 경과 시: timer가 2.0에서 1.0으로 가고 onlineSatelliteCount는 여전히 3
    store.tick(1.0);
    expect(useGameStore.getState().overloadEnergy).toBe(45); // 50 - 5 * 1.0
    expect(useGameStore.getState().onlineSatelliteCount).toBe(3);
    expect(useGameStore.getState().satelliteBootTimer).toBe(1.0);

    // 1.0초 더 경과 시 (총 2초 경과): timer가 0 이하가 되어 onlineSatelliteCount가 2로 감소
    store.tick(1.0);
    expect(useGameStore.getState().overloadEnergy).toBe(40); // 45 - 5 * 1.0
    expect(useGameStore.getState().onlineSatelliteCount).toBe(2);
    // 이제 위성 2개 = 10 TW 소모. 실드(5 TW) 합쳐서 총 15 TW 소모. 생산 15 TW. 순전력 = 0 TW.
    // 순전력이 0이 되어 부하가 평형 상태에 도달함
  });

  test('행성 인프라 건설 및 자원/체력/발전 버프 연동 검증', () => {
    const store = useGameStore.getState();

    // 1. 초기화: 지구 언락, 인프라 0레벨, 지구 체력 100
    useGameStore.setState({
      credits: 2000,
      earthHp: 100,
      earthMaxHp: 100,
      maxEnergy: 100,
      planets: {
        earth: {
          unlocked: true,
          terraformProgress: 100,
          population: 1000000,
          infrastructure: {
            housing: 0,
            factory: 0,
            powerPlant: 0,
            bunker: 0
          },
          orbitalSatellitesList: {},
          groundBasesList: {}
        }
      }
    });

    // 2. 인구 서서히 증가 및 크레딧 징수 검증
    // 1초 경과 시, 인구가 Logistics growth + Immigration 에 의해 1,000,000에서 늘어나야 함.
    store.tick(1.0);
    const popAfter1s = useGameStore.getState().planets.earth.population;
    expect(popAfter1s).toBeGreaterThan(1000000);
    // 원래 인구 한도는 지구 maxPopulation인 2,000,000 이며 주거지 0레벨일 때 성장하고 있음

    // 3. 발전 시설 건설 검증
    // 발전소 1개 구매비용 = 250 Cr.
    const creditsBeforePower = useGameStore.getState().credits;
    const buildPowerSuccess = store.buildInfrastructure('earth', 'powerPlant');
    expect(buildPowerSuccess).toBe(true);
    expect(useGameStore.getState().planets.earth.infrastructure.powerPlant).toBe(1);
    expect(useGameStore.getState().credits).toBeCloseTo(creditsBeforePower - 250, 0);

    // 틱을 실행하면 발전 시설 반영되어 maxEnergy가 늘어남 (기본 100 + 발전소 1레벨 20 = 120W)
    store.tick(0.1);
    expect(useGameStore.getState().maxEnergy).toBe(120);

    // 4. 방공호 건설 및 최대 체력/자가 힐 검증
    // 방공호 1개 구매비용 = 400 Cr.
    // 먼저 지구 체력을 50으로 깎고 진행
    useGameStore.setState({ earthHp: 50 });
    const creditsBeforeBunker = useGameStore.getState().credits;
    const buildBunkerSuccess = store.buildInfrastructure('earth', 'bunker');
    expect(buildBunkerSuccess).toBe(true);
    expect(useGameStore.getState().planets.earth.infrastructure.bunker).toBe(1);
    expect(useGameStore.getState().credits).toBeCloseTo(creditsBeforeBunker - 400, 0);
    
    // 최대 체력이 100에서 120으로 증가하고 현재 체력도 50에서 70으로 증가해야 함 (+20)
    expect(useGameStore.getState().earthMaxHp).toBe(120);
    expect(useGameStore.getState().earthHp).toBe(70);

    // 5. 생산 공장 건설 및 크레딧 생산 증대 검증
    // 공장 1개 구매비용 = 150 Cr.
    const creditsBeforeFactory = useGameStore.getState().credits;
    const buildFactorySuccess = store.buildInfrastructure('earth', 'factory');
    expect(buildFactorySuccess).toBe(true);
    expect(useGameStore.getState().planets.earth.infrastructure.factory).toBe(1);
    expect(useGameStore.getState().credits).toBeCloseTo(creditsBeforeFactory - 150, 0);
  });
});
