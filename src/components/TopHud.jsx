import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { useGameStore } from '../store/gameStore';

export default function TopHud() {
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
      // 4배속 시도
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
    <View style={styles.hudContainer}>
      {/* 상부 자원 라인 */}
      <View style={styles.resourcesRow}>
        <View style={styles.resourceItem}>
          <Text style={styles.resLabel}>CREDIT</Text>
          <Text style={styles.resValue}>{Math.floor(credits).toLocaleString()}</Text>
        </View>
        <View style={styles.resourceItem}>
          <Text style={[styles.resLabel, { color: '#00ff8a' }]}>ENERGY</Text>
          <Text style={styles.resValue}>{usedEnergy} / {maxEnergy} W</Text>
        </View>
        <View style={styles.resourceItem}>
          <Text style={[styles.resLabel, { color: '#ffd700' }]}>NANOCORE</Text>
          <Text style={styles.resValue}>{Math.floor(nanocores).toLocaleString()}</Text>
        </View>
        <View style={styles.resourceItem}>
          <Text style={[styles.resLabel, { color: '#bf5cff' }]}>CHRONOS</Text>
          <Text style={[styles.resValue, { color: '#bf5cff' }]}>{Math.floor(timeMachineGauge)}%</Text>
        </View>
      </View>

      {/* 하부 컨트롤 라인 */}
      <View style={styles.controlRow}>
        <View style={styles.badgeRow}>
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
            <Text style={styles.premiumBadgeText}>{isPremium ? '★ PREMIUM' : '☆ BUY PASS'}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.buttonsGroup}>
          <TouchableOpacity style={styles.speedBtn} onPress={cycleSpeed}>
            <Text style={styles.speedText}>{gameSpeed}x Speed</Text>
          </TouchableOpacity>
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
    backgroundColor: '#0c1328',
    borderBottomWidth: 1.5,
    borderColor: '#1e305e',
    paddingTop: 45, // Safe area 대용 마진
    paddingBottom: 10,
    paddingHorizontal: 15,
  },
  resourcesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resourceItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    backgroundColor: 'rgba(10, 20, 45, 0.4)',
    borderRadius: 6,
    marginHorizontal: 3,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  resLabel: {
    fontSize: 8,
    color: '#00f0ff',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  resValue: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 'bold',
    marginTop: 2,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  waveBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderWidth: 0.5,
    borderColor: '#00f0ff',
  },
  waveText: {
    color: '#00f0ff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  buttonsGroup: {
    flexDirection: 'row',
  },
  speedBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#16223f',
    borderRadius: 6,
    marginRight: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  speedText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  pauseBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#c23b3b',
    borderRadius: 6,
  },
  pauseBtnActive: {
    backgroundColor: '#3bb5c2',
  },
  pauseText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tpBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 6,
    backgroundColor: 'rgba(191, 92, 255, 0.1)',
    borderWidth: 0.5,
    borderColor: '#bf5cff',
  },
  tpText: {
    color: '#bf5cff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  premiumBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 6,
    borderWidth: 0.5,
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
  }
});
