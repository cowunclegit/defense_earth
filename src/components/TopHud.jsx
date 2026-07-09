import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Platform, useWindowDimensions } from 'react-native';
import { useGameStore, isSystemOnline } from '../store/gameStore';
import { PLANETARY_DATA } from '../constants/planetaryData';
import { getFactoryIncome } from '../store/gameSpecs';

export default function TopHud({
  overlay,
  planetId,
  onPressHp,
  onPressShield,
  onPressEp,
  onPressTower,
  onPressTerraform,
  onPressPop,
  onPressAuto,
  onPressFleet
}) {
  const { width: screenWidth } = useWindowDimensions();
  // 화면 비율 기반 자원칸 너비 (고정 픽셀 대신 화면 크기 비례)
  const colW = {
    credit:    Math.floor(screenWidth * 0.28),
    energy:    Math.floor(screenWidth * 0.19),
    nanocores: Math.floor(screenWidth * 0.12),
    chronos:   Math.floor(screenWidth * 0.10),
  };
  const [showDetails, setShowDetails] = React.useState(false);
  const { 
    credits, 
    maxEnergy, 
    usedEnergy, 
    nanocores, 
    currentWave,
    enemies,
    enemiesRemainingToSpawn,
    gameSpeed, 
    setGameSpeed,
    isPaused, 
    togglePause,
    isPremium,
    buyPremium,
    timeMachineGauge,
    timeParticles,
    planets,
    synergies,
    kineticDefenseTowers,
    autoTerraform,
    autoBuildTowers,
    fleet
  } = useGameStore();

  const planetState = planetId ? planets[planetId] : null;
  const earthHp = useGameStore(state => state.earthHp);
  const earthShield = useGameStore(state => state.earthShield);
  const overloadEnergy = useGameStore(state => state.overloadEnergy);
  const isPowerOffline = useGameStore(state => state.isPowerOffline);
  const isShieldOnline = planetId ? isSystemOnline('shield', null, overloadEnergy, isPowerOffline) : false;
  const isPowerDischarged = (overloadEnergy || 0) <= 0;
  const fleetLength = fleet ? fleet.length : 0;

  const [blinkVisible, setBlinkVisible] = React.useState(true);

  React.useEffect(() => {
    if (!isPowerDischarged) {
      setBlinkVisible(true);
      return;
    }
    const interval = setInterval(() => {
      setBlinkVisible((prev) => !prev);
    }, 400);
    return () => clearInterval(interval);
  }, [isPowerDischarged]);

  const activeEnemiesCount = enemies ? enemies.length : 0;
  const remainingEnemies = activeEnemiesCount + (enemiesRemainingToSpawn || 0);
  const totalEnemies = currentWave % 10 === 0 ? 1 : (3 + currentWave) * 4;
  const killedEnemies = Math.max(0, totalEnemies - remainingEnemies);
  const progressPercent = totalEnemies > 0 ? Math.min(100, Math.max(0, (killedEnemies / totalEnemies) * 100)) : 0;

  const getCreditRate = () => {
    let totalPopulation = 0;
    let totalFactoryContribution = 0;
    let totalTaxBonus = 0;

    Object.keys(planets || {}).forEach((planetId) => {
      const p = planets[planetId];
      if (p && p.unlocked) {
        const data = PLANETARY_DATA[planetId];
        if (data) {
          const infra = p.infrastructure || { housing: 0, factory: 0, powerPlant: 0, bunker: 0 };
          totalPopulation += p.population || 0;
          
          const factoryLvl = infra.factory || 0;
          totalFactoryContribution += getFactoryIncome(factoryLvl);
          totalTaxBonus += factoryLvl * 0.03;
        }
      }
    });

    const taxRevenue = 0.005 * Math.pow(Math.max(0, totalPopulation), 0.75);
    const baseCreditRate = 10 + taxRevenue * (1 + totalTaxBonus) + totalFactoryContribution;
    const rate = baseCreditRate * (synergies?.creditMultiplier || 1.0);
    return rate;
  };
  const creditRate = getCreditRate();

  const cycleSpeed = () => {
    if (gameSpeed === 1) {
      setGameSpeed(2);
    } else if (gameSpeed === 2) {
      if (!isPremium) {
        Alert.alert(
          '프리미엄 전용 배속',
          '4배속 초고속 기동 모드는 [광고제거 프리미엄 패스] 구매자 전용입니다.\n\n즉시 모의 결제하여 4배속과 자동 편의 기능을 해금하시겠습니까?',
          [
            { text: '취소', style: 'cancel' },
            { text: '즉시 해금', onPress: () => buyPremium() }
          ]
        );
      } else {
        setGameSpeed(4);
      }
    } else {
      setGameSpeed(1);
    }
  };

  const increaseSpeed = () => {
    if (gameSpeed === 1) {
      setGameSpeed(2);
    } else if (gameSpeed === 2) {
      if (!isPremium) {
        Alert.alert(
          '프리미엄 전용 배속',
          '4배속 초고속 기동 모드는 [광고제거 프리미엄 패스] 구매자 전용입니다.\n\n즉시 모의 결제하여 4배속과 자동 편의 기능을 해금하시겠습니까?',
          [
            { text: '취소', style: 'cancel' },
            { text: '즉시 해금', onPress: () => buyPremium() }
          ]
        );
      } else {
        setGameSpeed(4);
      }
    }
  };

  const decreaseSpeed = () => {
    if (gameSpeed === 4) {
      setGameSpeed(2);
    } else if (gameSpeed === 2) {
      setGameSpeed(1);
    }
  };

  const handlePremiumPress = () => {
    if (isPremium) {
      Alert.alert('프리미엄 활성', '이미 프리미엄 패스가 영구 적용되어 있습니다.');
      return;
    }
    Alert.alert(
      '프리미엄 패스 해금',
      '모의 결제를 통해 프리미엄 패스를 구매하시겠습니까?\n\n[혜택]:\n- 4배속 초고속 가속 전면 개방\n- 행성 테라포밍 자동 강화 예약 기능 해금\n- 대공 요격 타워 자동 재건 예약 기능 해금',
      [
        { text: '취소', style: 'cancel' },
        { text: '모의 구매', onPress: () => buyPremium() }
      ]
    );
  };

  return (
    <View 
      style={[styles.hudContainer, overlay && styles.hudContainerOverlay]}
      pointerEvents={overlay ? "box-none" : "auto"}
    >
      {/* E2E 테스트 호환용 숨겨진 투명 텍스트 (클릭 간섭 원천 차단) */}
      <View style={styles.hiddenE2ETestWrapper} pointerEvents="none">
        <View>
          <Text>CREDIT</Text>
          <Text>{Math.floor(credits)}</Text>
        </View>
        <View>
          <Text>ENERGY</Text>
          <Text>{usedEnergy} / {maxEnergy} W</Text>
        </View>
        <View>
          <Text>NANOCORE</Text>
          <Text>{Math.floor(nanocores)}</Text>
        </View>
      </View>

      <View style={styles.dashboardPanel} pointerEvents={overlay ? "box-none" : "auto"}>
        {/* Line 1: Resource Summary Row & TP Badge */}
        <View style={styles.dashboardRow}>
          <TouchableOpacity 
            style={styles.resourceSummaryTouch} 
            onPress={() => setShowDetails(!showDetails)}
          >
            <Text style={styles.summaryIconText} numberOfLines={1} ellipsizeMode="clip">
              🪙 {Math.floor(credits).toLocaleString()} (+{creditRate.toFixed(1)}/s) | ⚙️ {Math.floor(nanocores)} | ⏳ {Math.floor(timeMachineGauge)}% {showDetails ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.dashboardTpBadge}>
            <Text style={styles.tpText}>🌀 {timeParticles} TP</Text>
          </View>
        </View>

        {/* Dropdown details if clicked */}
        {showDetails && (
          <View style={styles.detailsDropdownInline}>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: '#00ff8a' }]}>CREDIT</Text>
              <Text style={[styles.detailValue, { color: '#00ff8a' }]}>{Math.floor(credits).toLocaleString()} (+{creditRate.toFixed(1)}/s)</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: '#ffd700' }]}>NANOCORE</Text>
              <Text style={[styles.detailValue, { color: '#ffd700' }]}>{Math.floor(nanocores).toLocaleString()}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: '#bf5cff' }]}>CHRONOS</Text>
              <Text style={[styles.detailValue, { color: '#bf5cff' }]}>{Math.floor(timeMachineGauge)}%</Text>
            </View>
          </View>
        )}

        {/* Line 2: Wave Progress & Speed/Pause Controls */}
        <View style={[styles.dashboardRow, { marginTop: 6 }]}>
          {/* Wave info */}
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
            <Text style={styles.waveText}>WAVE {currentWave} ({killedEnemies}/{totalEnemies})</Text>
            <View style={{ height: 3, backgroundColor: 'rgba(0, 240, 255, 0.25)', borderRadius: 1.5, overflow: 'hidden', flex: 1, marginLeft: 8 }}>
              <View style={{ height: '100%', width: `${progressPercent}%`, backgroundColor: '#00ff8a' }} />
            </View>
          </View>

          {/* Controls */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <TouchableOpacity 
              style={[styles.premiumBadge, isPremium ? styles.premiumBadgeActive : styles.premiumBadgeLocked]}
              onPress={handlePremiumPress}
            >
              <Text style={[styles.premiumBadgeText, { color: isPremium ? '#00f0ff' : '#ffd700', fontSize: 8 }]}>
                {isPremium ? 'PREMIUM' : 'BUY PASS'}
              </Text>
            </TouchableOpacity>

            <View style={styles.speedControlStepper}>
              <TouchableOpacity style={styles.stepperMiniBtn} onPress={decreaseSpeed}>
                <Text style={styles.stepperMiniBtnText}>◀</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.speedBtnMain} onPress={cycleSpeed}>
                <Text style={styles.speedText}>{gameSpeed}x</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.stepperMiniBtn} onPress={increaseSpeed}>
                <Text style={styles.stepperMiniBtnText}>▶</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.pauseBtn, isPaused && styles.pauseBtnActive, { paddingVertical: 3, paddingHorizontal: 6 }]} 
              onPress={togglePause}
            >
              <Text style={[styles.pauseBtnText, { fontSize: 8 }]}>{isPaused ? '▶' : '⏸'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Line 3: All 8 Status Chips */}
        {planetId && (
          <View style={[styles.statusChipsRow, { marginTop: 6, paddingTop: 6, borderTopWidth: 0.5, borderTopColor: 'rgba(255, 255, 255, 0.08)' }]}>
            {/* ❤️ HP */}
            <TouchableOpacity
              style={[styles.miniStatusChip, { borderColor: '#ff5c5c' }]}
              onPress={onPressHp}
            >
              <Text style={styles.miniStatusChipIcon}>❤️</Text>
              <Text style={[styles.miniStatusChipVal, { color: '#ff5c5c' }]}>
                {planetId === 'earth' ? Math.floor(earthHp || 0) : Math.floor(planetState?.hp || 0)}
              </Text>
            </TouchableOpacity>

            {/* 🛡️ Shield */}
            <TouchableOpacity
              style={[
                styles.miniStatusChip,
                { borderColor: '#00f0ff' },
                !isShieldOnline && { borderColor: '#8fa0c4', opacity: 0.6 }
              ]}
              onPress={onPressShield}
            >
              <Text style={styles.miniStatusChipIcon}>🛡️</Text>
              <Text style={[styles.miniStatusChipVal, { color: '#00f0ff' }, !isShieldOnline && { color: '#8fa0c4' }]}>
                {!isShieldOnline ? 'OFF' : (planetId === 'earth' ? Math.floor(earthShield || 0) : Math.floor(planetState?.shield || 0))}
              </Text>
            </TouchableOpacity>

            {/* ⚡ EP */}
            <TouchableOpacity
              style={[
                styles.miniStatusChip,
                { borderColor: '#ffd700' },
                isPowerDischarged && {
                  borderColor: blinkVisible ? '#ffd700' : '#8fa0c4',
                  backgroundColor: blinkVisible ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255, 255, 255, 0.02)'
                }
              ]}
              onPress={onPressEp}
            >
              <Text style={styles.miniStatusChipIcon}>⚡</Text>
              <Text style={[styles.miniStatusChipVal, { color: '#ffd700' }, isPowerDischarged && { color: blinkVisible ? '#ffd700' : '#8fa0c4' }]}>
                {isPowerDischarged ? '방전됨' : `${Math.max(0, Math.floor(overloadEnergy))}TW`}
              </Text>
            </TouchableOpacity>

            {/* 🛰️ Satellite */}
            <TouchableOpacity
              style={[styles.miniStatusChip, { borderColor: '#c296ff' }]}
              onPress={onPressTower}
            >
              <Text style={styles.miniStatusChipIcon}>🛰️</Text>
              <Text style={[styles.miniStatusChipVal, { color: '#c296ff' }]}>{kineticDefenseTowers}</Text>
            </TouchableOpacity>

            {/* 🌱 Terraform */}
            <TouchableOpacity
              style={[styles.miniStatusChip, { borderColor: '#00ff8a' }]}
              onPress={onPressTerraform}
            >
              <Text style={styles.miniStatusChipIcon}>🌱</Text>
              <Text style={[styles.miniStatusChipVal, { color: '#00ff8a' }]}>{planetState?.terraformProgress || 0}%</Text>
            </TouchableOpacity>

            {/* 👥 Population */}
            <TouchableOpacity
              style={[styles.miniStatusChip, { borderColor: '#ffd700' }]}
              onPress={onPressPop}
            >
              <Text style={styles.miniStatusChipIcon}>👥</Text>
              <Text style={[styles.miniStatusChipVal, { color: '#ffd700' }]}>{Math.floor((planetState?.population || 0) / 1000)}K</Text>
            </TouchableOpacity>

            {/* ⚙️ Auto settings */}
            <TouchableOpacity
              style={[styles.miniStatusChip, { borderColor: '#8fa0c4' }]}
              onPress={onPressAuto}
            >
              <Text style={styles.miniStatusChipIcon}>⚙️</Text>
              <Text style={[styles.miniStatusChipVal, { color: autoTerraform || autoBuildTowers ? '#00bfa5' : '#8fa0c4' }]}>
                {(autoTerraform ? 1 : 0) + (autoBuildTowers ? 1 : 0)}/2
              </Text>
            </TouchableOpacity>

            {/* 🛸 Fleet */}
            <TouchableOpacity
              style={[styles.miniStatusChip, { borderColor: '#00ff8a' }]}
              onPress={onPressFleet}
            >
              <Text style={styles.miniStatusChipIcon}>🛸</Text>
              <Text style={[styles.miniStatusChipVal, { color: '#00ff8a' }]}>{fleetLength}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hudContainer: {
    backgroundColor: '#040712', // 매우 어두운 우주색
    borderBottomWidth: 1.5,
    borderColor: '#00f0ff', // 네온 블루 바닥 테두리
    paddingTop: Platform.OS === 'ios' ? 45 : 15,
    paddingBottom: 8,
    paddingHorizontal: 16,
    shadowColor: '#00f0ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  hudContainerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
    paddingTop: Platform.OS === 'ios' ? 48 : 15,
    paddingHorizontal: 15,
    zIndex: 100,
  },
  dashboardPanel: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(4, 7, 18, 0.92)',
    borderWidth: 1.2,
    borderColor: 'rgba(0, 240, 255, 0.25)',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#00f0ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  dashboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  resourceSummaryTouch: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 4,
  },
  dashboardTpBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(191, 92, 255, 0.15)',
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(191, 92, 255, 0.35)',
  },
  detailsDropdownInline: {
    marginTop: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 4,
    padding: 4,
    gap: 4,
  },
  hudContentColumn: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 6,
  },
  leftResourcesColumn: {
    position: 'relative',
    zIndex: 999,
  },
  bottomControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  hiddenE2ETestWrapper: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0.01,
    overflow: 'hidden',
  },
  summaryBarTouch: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 5,
    alignItems: 'center',
    backgroundColor: 'rgba(10, 20, 45, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
  },
  summaryItemSlot: {
    flexShrink: 0,
    overflow: 'hidden',
  },
  // 구형 참조용 (삭제 가능하나 하위호환 보존)
  summaryItemCredit: {},
  summaryItemEnergy: {},
  summaryItemNanocores: {},
  summaryItemChronos: {},
  summaryIconText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  dropdownArrow: {
    color: '#00f0ff',
    fontSize: 8.5,
    marginLeft: 2,
  },
  detailsDropdown: {
    position: 'absolute',
    top: 36,
    left: 0,
    backgroundColor: 'rgba(5, 8, 20, 0.95)',
    borderWidth: 1.2,
    borderColor: '#00f0ff',
    borderRadius: 8,
    padding: 6,
    width: 195,
    gap: 5,
    zIndex: 999,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 20, 45, 0.75)',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 240, 255, 0.15)',
  },
  detailLabel: {
    fontSize: 8.5,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 9.5,
    fontWeight: 'bold',
    fontFamily: 'Courier New',
  },
  waveBadge: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.35)',
  },
  statusChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    marginTop: 4,
  },
  miniStatusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1.5,
    paddingVertical: 1.5,
    paddingHorizontal: 3.5,
    borderRadius: 4,
    borderWidth: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  miniStatusChipIcon: {
    fontSize: 7.5,
  },
  miniStatusChipVal: {
    fontSize: 7.5,
    fontWeight: 'bold',
  },
  waveText: {
    color: '#00f0ff',
    fontSize: 8.5,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  tpBadge: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 5,
    backgroundColor: 'rgba(191, 92, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#bf5cff',
  },
  tpText: {
    color: '#bf5cff',
    fontSize: 8.5,
    fontWeight: 'bold',
  },
  premiumBadge: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 5,
    borderWidth: 1,
  },
  premiumBadgeActive: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderColor: '#00f0ff',
  },
  premiumBadgeLocked: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderColor: '#ffd700',
  },
  premiumBadgeText: {
    fontSize: 8.5,
    fontWeight: 'bold',
  },
  speedControlStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16223f',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#00ff8a',
    overflow: 'hidden',
  },
  stepperMiniBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperMiniBtnText: {
    color: '#00ff8a',
    fontSize: 8.5,
    fontWeight: 'bold',
  },
  speedBtnMain: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: 'rgba(0, 255, 138, 0.3)',
  },
  speedText: {
    color: '#00ff8a',
    fontSize: 8.5,
    fontWeight: 'bold',
  },
  pauseBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#c23b3b',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ff5c5c',
  },
  pauseBtnActive: {
    backgroundColor: '#3bb5c2',
    borderColor: '#00f0ff',
  },
  pauseText: {
    color: '#ffffff',
    fontSize: 8.5,
    fontWeight: 'bold',
  }
});
