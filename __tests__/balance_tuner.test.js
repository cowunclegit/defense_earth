import fs from 'fs';
import path from 'path';
import { useGameStore, SHIP_SPECS } from '../src/store/gameStore';
import { SHIP_TYPES, SATELLITE_SPECS, ALIEN_SPECS } from '../src/store/gameSpecs';

describe('자동 밸런스 튜닝 루프 (Auto-Tuning Feedback Loop)', () => {
  test('시뮬레이션 기반 적 HP / 아군 공격력 튜닝', async () => {
    // 1. 목표 밸런스 기준 정의
    const targetMinSurvivalRate = 0.50; // 목표 최소 생존율 50%
    const targetMaxSurvivalRate = 0.75; // 목표 최대 생존율 75%
    const simulationRunsPerIteration = 25; // 각 단계별 시뮬레이션 구동 횟수
    const maxIterations = 8; // 최대 밸런스 조정 루프 반복 횟수

    // 튜닝할 타겟 명세 정의
    const tuneTargets = [
      {
        type: 'scout',
        displayName: '외계 정찰기',
        testWave: 1,
        satelliteSetup: { laser: 2 },
        infrastructureSetup: { powerPlant: 1 },
        fleetSetup: {}, // No fleet for Wave 1
        maxEnergy: 100,
        usedEnergy: 15, // 2 lasers (10) + shield (5)
        initialHp: ALIEN_SPECS.scout.maxHp,
        specField: 'scout',
        regexKey: 'SCOUT'
      },
      {
        type: 'raider',
        displayName: '외계 약탈함',
        testWave: 3,
        satelliteSetup: { laser: 3 },
        infrastructureSetup: { powerPlant: 1 },
        fleetSetup: { interceptor: 3 }, // 3 interceptors for Wave 3
        maxEnergy: 100,
        usedEnergy: 20, // 3 lasers (15) + shield (5)
        initialHp: ALIEN_SPECS.raider.maxHp,
        specField: 'raider',
        regexKey: 'RAIDER'
      },
      {
        type: 'destroyer',
        displayName: '외계 아머 멜터',
        testWave: 8,
        satelliteSetup: { laser: 4, emp: 1 },
        infrastructureSetup: { powerPlant: 2 },
        fleetSetup: { interceptor: 5, escort: 1 }, // 5 interceptors + 1 escort for Wave 8
        maxEnergy: 100,
        usedEnergy: 32, // 4 lasers (20) + 1 emp (7) + shield (5)
        initialHp: ALIEN_SPECS.destroyer.maxHp,
        specField: 'destroyer',
        regexKey: 'DESTROYER'
      }
    ];

    const createMockShip = (type) => {
      const spec = SHIP_SPECS[type];
      if (!spec) return null;
      const angle = Math.random() * Math.PI - Math.PI;
      const radius = 120 + Math.random() * 20;
      return {
        id: Math.random().toString(),
        type: type,
        x: 270 + Math.cos(angle) * radius,
        y: 270 + Math.sin(angle) * radius,
        angle: angle,
        hp: spec.maxHp,
        maxHp: spec.maxHp,
        cooldownTimer: 0,
        targetEnemyId: null,
        orbitSpeedOffset: (Math.random() - 0.5) * 0.15,
        orbitRadiusOffset: (Math.random() - 0.5) * 20,
        flockOffsetX: (Math.random() - 0.5) * 30,
        flockOffsetY: (Math.random() - 0.5) * 30
      };
    };

    console.log('\n==================================================');
    console.log(`🤖 [자가 피드백 밸런스 튜너] 다중 타겟 가동 시작`);
    console.log(`목표 조건: 생존율 ${(targetMinSurvivalRate * 100)}% ~ ${(targetMaxSurvivalRate * 100)}% 수렴`);
    console.log('==================================================\n');

    const tunedResults = {};

    for (const target of tuneTargets) {
      console.log(`--------------------------------------------------`);
      console.log(`🎯 [튜닝 진행] ${target.displayName} (W${target.testWave})`);
      console.log(`위성 셋업: ${JSON.stringify(target.satelliteSetup)}`);
      console.log(`아군 함대 셋업: ${JSON.stringify(target.fleetSetup)}`);
      console.log(`--------------------------------------------------`);

      let currentAlienHp = target.initialHp;

      for (let iteration = 1; iteration <= maxIterations; iteration++) {
        let winCount = 0;
        let totalClearTime = 0;

        for (let run = 0; run < simulationRunsPerIteration; run++) {
          const store = useGameStore.getState();
          await store.resetDatabase();

          // 모의 함선 리스트 생성
          const initialFleet = [];
          Object.keys(target.fleetSetup).forEach(type => {
            const count = target.fleetSetup[type];
            for (let i = 0; i < count; i++) {
              const ship = createMockShip(type);
              if (ship) initialFleet.push(ship);
            }
          });

          // 모의 시나리오 세팅
          useGameStore.setState({
            credits: 200000,
            currentWave: target.testWave,
            maxEnergy: target.maxEnergy,
            usedEnergy: target.usedEnergy,
            isPowerOffline: false,
            onlineSatelliteCount: Object.values(target.satelliteSetup).reduce((a, b) => a + b, 0),
            satelliteBootTimer: 2.0,
            fleet: initialFleet,
            planets: {
              ...useGameStore.getState().planets,
              earth: {
                ...useGameStore.getState().planets.earth,
                unlocked: true,
                infrastructure: {
                  housing: 0,
                  factory: 0,
                  powerPlant: target.infrastructureSetup.powerPlant,
                  bunker: 0
                },
                orbitalSatellitesList: target.satelliteSetup
              }
            }
          });

          // 이전에 튜닝 완료된 적선 HP와 현재 조율 중인 HP 모두 주입
          Object.keys(tunedResults).forEach(tType => {
            const specF = tuneTargets.find(t => t.type === tType).specField;
            ALIEN_SPECS[specF].maxHp = tunedResults[tType];
          });
          ALIEN_SPECS[target.specField].maxHp = currentAlienHp;

          let elapsed = 0;
          const maxSimTime = 120;
          const tickStep = 0.5;

          while (elapsed < maxSimTime) {
            store.tick(tickStep);
            elapsed += tickStep;

            const state = useGameStore.getState();

            // 웨이브 클리어 조건
            if (state.currentWave > target.testWave || (state.enemies.length === 0 && state.enemiesRemainingToSpawn === 0)) {
              winCount++;
              totalClearTime += elapsed;
              break;
            }
            // 패배 조건
            if (state.earthHp <= 0) {
              break;
            }
          }
        }

        const survivalRate = winCount / simulationRunsPerIteration;
        const avgClearTime = winCount > 0 ? (totalClearTime / winCount) : 0;

        console.log(`[${target.displayName}] HP: ${currentAlienHp} | 루프 #${iteration} | 생존율: ${(survivalRate * 100).toFixed(1)}% | 클리어 타임: ${avgClearTime.toFixed(1)}초`);

        if (survivalRate > targetMaxSurvivalRate) {
          // 너무 쉬움 -> HP +15%
          currentAlienHp = Math.round(currentAlienHp * 1.15);
          console.log(`  ➡️ 결과: TOO EASY (생존율 ${(survivalRate * 100).toFixed(1)}%). HP를 ${currentAlienHp}으로 상향 조정합니다.`);
        } else if (survivalRate < targetMinSurvivalRate) {
          // 너무 어려움 -> HP -15%
          currentAlienHp = Math.round(currentAlienHp * 0.85);
          console.log(`  ➡️ 결과: TOO HARD (생존율 ${(survivalRate * 100).toFixed(1)}%). HP를 ${currentAlienHp}으로 하향 조정합니다.`);
        } else {
          console.log(`\n🎯 [최적화 성공] ${target.displayName}의 최적 HP: ${currentAlienHp} (최종 생존율: ${(survivalRate * 100).toFixed(1)}%)`);
          break;
        }
      }

      tunedResults[target.type] = currentAlienHp;
    }

    console.log('\n==================================================');
    console.log(`💾 튜닝 완료! 결과를 gameSpecs.js 파일에 자동 반영합니다.`);
    console.log(JSON.stringify(tunedResults, null, 2));
    console.log('==================================================\n');

    // 2. 파일 쓰기 반영 (Writeback)
    const specsPath = path.resolve(__dirname, '../src/store/gameSpecs.js');
    let content = fs.readFileSync(specsPath, 'utf8');

    for (const target of tuneTargets) {
      const tunedHp = tunedResults[target.type];
      const regex = new RegExp(`(\\[ALIEN_TYPES\\.${target.regexKey}\\]:\\s*\\{[\\s\\S]*?maxHp:\\s*)\\d+`);
      content = content.replace(regex, `$1${tunedHp}`);
    }

    fs.writeFileSync(specsPath, content, 'utf8');
    console.log(`🎉 gameSpecs.js 업데이트 성공!`);
  });
});
