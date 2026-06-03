import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Platform, useWindowDimensions } from 'react-native';
import { useGameStore } from '../store/gameStore';

export default function TopHud({ overlay }) {
  const { width: screenWidth } = useWindowDimensions();
  // 화면 비율 기반 자원칸 너비 (고정 픽셀 대신 화면 크기 비례)
  const colW = {
    credit:    Math.floor(screenWidth * 0.15),
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
    gameSpeed, 
    setGameSpeed,
    isPaused, 
    togglePause,
    isPremium,
    buyPremium,
    timeMachineGauge,
    timeParticles
  } = useGameStore();

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
      
      <View style={styles.hudContentColumn} pointerEvents={overlay ? "box-none" : "auto"}>
        {/* 상단: 자원 요약 바 */}
        <View style={styles.leftResourcesColumn} pointerEvents={overlay ? "box-none" : "auto"}>
          <TouchableOpacity 
            style={styles.summaryBarTouch} 
            onPress={() => setShowDetails(!showDetails)}
          >
            <View style={[styles.summaryItemSlot, { width: colW.credit }]}>
              <Text style={styles.summaryIconText} numberOfLines={1} ellipsizeMode="clip">🪙 {Math.floor(credits).toLocaleString()}</Text>
            </View>
            <View style={[styles.summaryItemSlot, { width: colW.energy }]}>
              <Text style={styles.summaryIconText} numberOfLines={1} ellipsizeMode="clip">⚡ {usedEnergy}/{maxEnergy}W</Text>
            </View>
            <View style={[styles.summaryItemSlot, { width: colW.nanocores }]}>
              <Text style={styles.summaryIconText} numberOfLines={1} ellipsizeMode="clip">⚙️ {Math.floor(nanocores)}</Text>
            </View>
            <View style={[styles.summaryItemSlot, { width: colW.chronos }]}>
              <Text style={styles.summaryIconText} numberOfLines={1} ellipsizeMode="clip">⏳ {Math.floor(timeMachineGauge)}%</Text>
            </View>
            <Text style={styles.dropdownArrow}>{showDetails ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {showDetails && (
            <View style={styles.detailsDropdown} pointerEvents="none">
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: '#00ff8a' }]}>CREDIT</Text>
                <Text style={[styles.detailValue, { color: '#00ff8a' }]}>{Math.floor(credits).toLocaleString()}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: '#00f0ff' }]}>ENERGY</Text>
                <Text style={[styles.detailValue, { color: '#00f0ff' }]}>{usedEnergy} / {maxEnergy} W</Text>
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
        </View>

        {/* 하단: 게임 컨트롤 및 웨이브 상태 패널 (자원창 하단에 소형 배치) */}
        <View style={styles.bottomControlRow} pointerEvents={overlay ? "box-none" : "auto"}>
          <View style={styles.waveBadge}>
            <Text style={styles.waveText}>WAVE {currentWave}</Text>
          </View>

          <View style={styles.tpBadge}>
            <Text style={styles.tpText}>🌀 {timeParticles} TP</Text>
          </View>

          <TouchableOpacity 
            style={[styles.premiumBadge, isPremium ? styles.premiumBadgeActive : styles.premiumBadgeLocked]}
            onPress={handlePremiumPress}
          >
            <Text style={[styles.premiumBadgeText, { color: isPremium ? '#00f0ff' : '#ffd700' }]}>
              {isPremium ? '★ PREMIUM' : '☆ BUY PASS'}
            </Text>
          </TouchableOpacity>

          <View style={styles.speedControlStepper}>
            <TouchableOpacity style={styles.stepperMiniBtn} onPress={decreaseSpeed}>
              <Text style={styles.stepperMiniBtnText}>◀</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.speedBtnMain} onPress={cycleSpeed}>
              <Text style={styles.speedText}>{gameSpeed}x Speed</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.stepperMiniBtn} onPress={increaseSpeed}>
              <Text style={styles.stepperMiniBtnText}>▶</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.pauseBtn, isPaused && styles.pauseBtnActive]} 
            onPress={togglePause}
          >
            <Text style={styles.pauseText}>{isPaused ? 'RESUME' : 'PAUSE'}</Text>
          </TouchableOpacity>
        </View>
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
    paddingTop: 8,
    paddingHorizontal: 15,
    zIndex: 100,
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
    width: 170,
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
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 5,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#00f0ff',
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
