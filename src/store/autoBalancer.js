import { ALIEN_SPECS, SATELLITE_SPECS } from './gameSpecs';

export const autoBalancerActions = (set, get) => ({
  // Reset all specs to default settings
  resetTunedSpecs: () => {
    const { DEFAULT_ALIEN_SPECS, DEFAULT_SATELLITE_SPECS } = require('./gameSpecs');
    
    set((state) => {
      // Revert the in-memory specs
      Object.keys(DEFAULT_ALIEN_SPECS).forEach((type) => {
        Object.keys(DEFAULT_ALIEN_SPECS[type]).forEach((key) => {
          ALIEN_SPECS[type][key] = DEFAULT_ALIEN_SPECS[type][key];
        });
      });

      Object.keys(DEFAULT_SATELLITE_SPECS).forEach((type) => {
        Object.keys(DEFAULT_SATELLITE_SPECS[type]).forEach((key) => {
          SATELLITE_SPECS[type][key] = DEFAULT_SATELLITE_SPECS[type][key];
        });
      });

      return {
        alienSpecOverrides: {},
        satelliteSpecOverrides: {},
        playtestMetrics: [],
        rebirthHistory: [], // Track rebirth progression
      };
    });
    
    get().addBattleLog('🤖 AI Auto-Balancer: 모든 밸런스 설정이 기획서 기본값으로 초기화되었습니다.');
  },

  // Called when a wave starts
  recordWaveStart: (waveNum) => {
    const state = get();
    set({
      waveStartTime: Date.now(),
      minShieldDuringWave: state.earthShield,
      minHpDuringWave: state.earthHp,
    });
  },

  // Called when a wave is cleared
  recordWaveEnd: (waveNum, isDefeat) => {
    const state = get();
    const duration = state.waveStartTime ? (Date.now() - state.waveStartTime) / 1000 : 0;
    
    const maxShield = state.getShieldCapacity();
    const maxHp = state.earthMaxHp;

    const minShieldPct = Math.round((state.minShieldDuringWave / maxShield) * 100);
    const minHpPct = Math.round((state.minHpDuringWave / maxHp) * 100);

    const activeEnemyTypes = [];
    if (waveNum % 10 === 0) {
      if ((waveNum / 10) % 2 === 1) activeEnemyTypes.push('boss_apocalypse');
      else activeEnemyTypes.push('boss_chrono');
    } else {
      if (waveNum >= 1) activeEnemyTypes.push('scout');
      if (waveNum >= 3) activeEnemyTypes.push('raider');
      if (waveNum >= 8) activeEnemyTypes.push('destroyer');
    }

    let actionTaken = 'NO CHANGE';

    if (isDefeat) {
      // Game Over: Too hard! Decrease enemy HP and Damage by 10%
      activeEnemyTypes.forEach((type) => {
        const hp = ALIEN_SPECS[type].maxHp;
        const dmg = ALIEN_SPECS[type].damage;
        
        state.updateSpecOverride('alien', type, 'maxHp', Math.round(hp * 0.90));
        state.updateSpecOverride('alien', type, 'damage', Math.round(dmg * 0.90));
      });
      actionTaken = `DEFEAT: Decreased stats for ${activeEnemyTypes.join('/')} by 10%`;
    } else if (waveNum >= 2) {
      // Analyze shield depletion: Target sweet spot is minShieldPct between 20% and 50%
      if (minShieldPct > 75) {
        // Too Easy! Increase enemy stats by 5%
        activeEnemyTypes.forEach((type) => {
          const hp = ALIEN_SPECS[type].maxHp;
          const dmg = ALIEN_SPECS[type].damage;
          
          state.updateSpecOverride('alien', type, 'maxHp', Math.round(hp * 1.05));
          state.updateSpecOverride('alien', type, 'damage', Math.round(dmg * 1.05));
        });
        actionTaken = `EASY (Shield ${minShieldPct}%): Increased enemy stats by 5%`;
      } else if (minShieldPct < 15 || minHpPct < 90) {
        // Too Hard! Decrease enemy stats by 5%
        activeEnemyTypes.forEach((type) => {
          const hp = ALIEN_SPECS[type].maxHp;
          const dmg = ALIEN_SPECS[type].damage;
          
          state.updateSpecOverride('alien', type, 'maxHp', Math.round(hp * 0.95));
          state.updateSpecOverride('alien', type, 'damage', Math.round(dmg * 0.95));
        });
        actionTaken = `HARD (Shield ${minShieldPct}%): Decreased enemy stats by 5%`;
      } else {
        actionTaken = `OPTIMAL (Shield ${minShieldPct}%): No adjustments needed`;
      }
    }

    const logEntry = {
      id: Math.random().toString(),
      wave: waveNum,
      rebirthIndex: state.rebirthCount,
      duration: Math.round(duration),
      minShield: minShieldPct,
      minHp: minHpPct,
      action: actionTaken,
      timestamp: new Date().toLocaleTimeString(),
    };

    set((state) => ({
      playtestMetrics: [logEntry, ...(state.playtestMetrics || [])].slice(0, 50),
    }));

    state.addBattleLog(`🤖 AI Auto-Balancer: W${waveNum} 완료 (${logEntry.action})`);
  },

  // Called just before triggerTimeLoop in gameStore
  recordRebirth: () => {
    const state = get();
    const currentRebirthIndex = state.rebirthCount;
    const maxWaveThisLoop = state.currentWave;

    const thisLoopMetrics = (state.playtestMetrics || []).filter(m => m.rebirthIndex === currentRebirthIndex);
    
    let tensionWaves = 0;
    thisLoopMetrics.forEach(m => {
      if (m.minShield >= 15 && m.minShield <= 60) {
        tensionWaves++;
      }
    });
    
    const totalWavesRecorded = thisLoopMetrics.length || 1;
    const tensionRatio = tensionWaves / totalWavesRecorded;

    const record = {
      rebirthIndex: currentRebirthIndex,
      maxWaveReached: maxWaveThisLoop,
      tensionRatio: tensionRatio,
      timestamp: new Date().toLocaleTimeString()
    };

    return record; // Return object rather than set state directly to avoid races
  },

  // Calculate overall Fun Score based on game pacing, tension and progression (Target >= 80)
  calculateFunScore: () => {
    const state = get();
    const history = state.rebirthHistory || [];
    if (history.length < 5) {
      return 0;
    }

    // 1. Tension Score (40 pts) - Shield depletion frequency target: 15% - 45%
    let totalTensionRatio = 0;
    history.forEach(h => {
      totalTensionRatio += h.tensionRatio;
    });
    const avgTensionRatio = totalTensionRatio / history.length;
    let tensionScore = 40;
    if (avgTensionRatio < 0.15) {
      tensionScore = Math.max(0, 40 - (0.15 - avgTensionRatio) * 200);
    } else if (avgTensionRatio > 0.45) {
      tensionScore = Math.max(0, 40 - (avgTensionRatio - 0.45) * 200);
    }

    // 2. Progression Score (45 pts) - Stepwise wave ceiling upgrades (Ideally +3 to +12 wave jumps)
    let progressionScore = 45;
    let regressionCount = 0;
    let plateauCount = 0;
    
    for (let i = 1; i < history.length; i++) {
      const prev = history[i - 1].maxWaveReached;
      const cur = history[i].maxWaveReached;
      const diff = cur - prev;
      
      if (diff < 0) {
        regressionCount++;
      } else if (diff === 0) {
        plateauCount++;
      } else if (diff < 3 || diff > 15) {
        progressionScore -= 5;
      }
    }
    
    progressionScore -= regressionCount * 15;
    progressionScore -= plateauCount * 10;
    progressionScore = Math.max(0, progressionScore);

    // 3. Early Defeat Rhythm Score (15 pts) - Initial loop defeat should happen before wave 15
    let rhythmScore = 15;
    const r0MaxWave = history[0].maxWaveReached;
    if (r0MaxWave > 15) {
      rhythmScore = Math.max(0, 15 - (r0MaxWave - 15) * 2);
    }

    const finalFunScore = Math.round(tensionScore + progressionScore + rhythmScore);
    return finalFunScore;
  },

  // Evolving Difficulty Auto-Correction to push Fun Score upwards
  adjustDifficultyBias: (biasFactor) => {
    const state = get();
    const alienTypes = ['scout', 'raider', 'destroyer', 'boss_apocalypse', 'boss_chrono'];
    alienTypes.forEach(type => {
      const currentHp = ALIEN_SPECS[type].maxHp;
      const currentDmg = ALIEN_SPECS[type].damage;
      
      state.updateSpecOverride('alien', type, 'maxHp', Math.max(5, Math.round(currentHp * biasFactor)));
      state.updateSpecOverride('alien', type, 'damage', Math.max(1, Math.round(currentDmg * biasFactor)));
    });
    
    state.addBattleLog(`🤖 AI Auto-Balancer: 재미 점수 미달로 인해 난이도 보정치를 ${biasFactor}x 로 조정했습니다.`);
  },

  // Export current specs as JSON
  exportTunedSpecs: () => {
    const state = get();
    const tunedData = {
      timestamp: new Date().toISOString(),
      funScore: state.calculateFunScore ? state.calculateFunScore() : 0,
      rebirthCount: state.rebirthCount,
      rebirthHistory: state.rebirthHistory || [],
      overrides: {
        alienSpecOverrides: state.alienSpecOverrides || {},
        satelliteSpecOverrides: state.satelliteSpecOverrides || {},
      },
      specs: {
        alienSpecs: {},
        satelliteSpecs: {},
      },
    };

    Object.keys(ALIEN_SPECS).forEach((key) => {
      tunedData.specs.alienSpecs[key] = {
        name: ALIEN_SPECS[key].name,
        maxHp: ALIEN_SPECS[key].maxHp,
        damage: ALIEN_SPECS[key].damage,
        speed: ALIEN_SPECS[key].speed,
      };
    });

    Object.keys(SATELLITE_SPECS).forEach((key) => {
      tunedData.specs.satelliteSpecs[key] = {
        name: SATELLITE_SPECS[key].name,
        cost: SATELLITE_SPECS[key].cost,
        dmg: SATELLITE_SPECS[key].dmg,
        cd: SATELLITE_SPECS[key].cd,
        range: SATELLITE_SPECS[key].range,
      };
    });

    return JSON.stringify(tunedData, null, 2);
  },
});
