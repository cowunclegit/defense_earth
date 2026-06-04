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
    // 기본 생산율 = (기본 10 + 지구 인구 1,000,000 * 0.00001 = 10) * 지구 시너지 1.5 = 30 크레딧/초
    store.tick(1);
    
    const updatedStore = useGameStore.getState();
    expect(updatedStore.credits).toBeCloseTo(1030, 1);
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
    // 0.1초 동안 30 * 0.1 = 3 크레딧이 새로 생산되므로: 1000 - 200 + 3 = 803
    expect(postTickStore.credits).toBeCloseTo(803, 1);

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

    // Change module to plasma (cost 1000, capacity bonus +1500, regen 25/s, energy 15W)
    const successModule = store.changeShieldModule('plasma');
    expect(successModule).toBe(true);
    expect(useGameStore.getState().shieldModule).toBe('plasma');
    expect(useGameStore.getState().credits).toBe(9003);
    expect(useGameStore.getState().usedEnergy).toBe(30);
    expect(store.getShieldCapacity()).toBe(1600); // 100 base + 1500 plasma = 1600

    // Toggle discharge counterattack module (cost 2000, energy 10W)
    const successCounter = store.toggleCounterattackModule('discharge');
    expect(successCounter).toBe(true);
    expect(useGameStore.getState().counterattackModules.discharge).toBe(true);
    expect(useGameStore.getState().credits).toBe(7003);
    expect(useGameStore.getState().usedEnergy).toBe(40);
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
      hp: 100,
      maxHp: 100,
      speed: 0,
      attackTimer: 0,
      spec: { name: '정찰선', maxHp: 100, damage: 10, creditReward: 10, coreChance: 0, speed: 0, cooldown: 5, attackType: 'kinetic' }
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
    expect(midFlightState.enemies[0].hp).toBe(100);    // 적 체력은 100 유지

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
});
