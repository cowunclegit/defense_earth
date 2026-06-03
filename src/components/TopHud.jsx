import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Platform } from 'react-native';
import { useGameStore } from '../store/gameStore';

export default function TopHud({ overlay }) {
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
      <View style={styles.hudContentRow} pointerEvents={overlay ? "box-none" : "auto"}>
        {/* 좌측: 세로로 정렬된 자원 목록 (네온 스타일 카드) */}
        <View style={styles.leftResourcesColumn}>
          <View style={styles.resourceItem}>
            <Text style={[styles.resLabel, { color: '#00ff8a' }]}>CREDIT</Text>
            <Text style={[styles.resValue, { color: '#00ff8a' }]}>{Math.floor(credits).toLocaleString()}</Text>
          </View>
          <View style={styles.resourceItem}>
            <Text style={[styles.resLabel, { color: '#00f0ff' }]}>ENERGY</Text>
            <Text style={[styles.resValue, { color: '#00f0ff' }]}>{usedEnergy} / {maxEnergy} W</Text>
          </View>
          <View style={styles.resourceItem}>
            <Text style={[styles.resLabel, { color: '#ffd700' }]}>NANOCORE</Text>
            <Text style={[styles.resValue, { color: '#ffd700' }]}>{Math.floor(nanocores).toLocaleString()}</Text>
          </View>
          <View style={styles.resourceItem}>
            <Text style={[styles.resLabel, { color: '#bf5cff' }]}>CHRONOS</Text>
            <Text style={[styles.resValue, { color: '#bf5cff' }]}>{Math.floor(timeMachineGauge)}%</Text>
          </View>
        </View>

        {/* 우측: 게임 컨트롤 및 웨이브 상태 패널 */}
        <View style={styles.rightControlColumn}>
          <View style={styles.waveBadge}>
            <Text style={styles.waveText}>WAVE {currentWave}</Text>
          </View>

          <View style={styles.controlRow}>
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
          </View>

          <View style={styles.buttonsGroup}>
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
  hudContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftResourcesColumn: {
    flex: 1.2,
    flexDirection: 'column',
    gap: 5,
  },
  rightControlColumn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 6,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(10, 20, 45, 0.6)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.1)',
  },
  resLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  resValue: {
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'Courier New',
  },
  waveBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#00f0ff',
    shadowColor: '#00f0ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  waveText: {
    color: '#00f0ff',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  controlRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  tpBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(191, 92, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#bf5cff',
  },
  tpText: {
    color: '#bf5cff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  premiumBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
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
    fontSize: 9,
    fontWeight: 'bold',
  },
  buttonsGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  speedControlStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16223f',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#00ff8a',
    overflow: 'hidden',
  },
  stepperMiniBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperMiniBtnText: {
    color: '#00ff8a',
    fontSize: 10,
    fontWeight: 'bold',
  },
  speedBtnMain: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: 'rgba(0, 255, 138, 0.3)',
  },
  speedText: {
    color: '#00ff8a',
    fontSize: 9,
    fontWeight: 'bold',
  },
  pauseBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#c23b3b',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ff5c5c',
  },
  pauseBtnActive: {
    backgroundColor: '#3bb5c2',
    borderColor: '#00f0ff',
  },
  pauseText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  }
});
