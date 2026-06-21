import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Modal, TextInput, Dimensions } from 'react-native';
import { useGameStore } from '../store/gameStore';
import TopHud from '../components/TopHud';
import { ALIEN_SPECS, DEFAULT_ALIEN_SPECS } from '../store/gameSpecs';

export default function AIPlaytestScreen({ navigation }) {
  const store = useGameStore();
  const [jsonModalVisible, setJsonModalVisible] = useState(false);
  const [exportedJson, setExportedJson] = useState('');

  const {
    isAiPlaytestActive,
    aiPlaytestSpeed,
    playtestMetrics,
    currentWave,
    earthHp,
    earthMaxHp,
    earthShield,
    earthMaxShield,
    credits,
    nanocores,
    timeParticles,
    resetTunedSpecs,
    exportTunedSpecs
  } = store;

  const toggleAutopilot = () => {
    useGameStore.setState({ isAiPlaytestActive: !isAiPlaytestActive });
    store.addBattleLog(
      isAiPlaytestActive 
        ? '🤖 AI Autopilot: 오토플레이 시뮬레이션을 중지했습니다.' 
        : '🤖 AI Autopilot: 오토플레이 시뮬레이션을 가동했습니다.'
    );
  };

  const handleSpeedChange = (speed) => {
    useGameStore.setState({ aiPlaytestSpeed: speed });
    store.addBattleLog(`🤖 AI Autopilot: 시뮬레이션 배속을 ${speed}x 로 변경했습니다.`);
  };

  const handleReset = () => {
    Alert.alert(
      '밸런스 초기화',
      '모든 유닛의 스탯 오버라이드 값과 플레이테스트 로그를 지우고 기획서 기본값으로 되돌리시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { text: '초기화 실행', onPress: () => resetTunedSpecs(), style: 'destructive' }
      ]
    );
  };

  const handleExport = () => {
    const json = exportTunedSpecs();
    setExportedJson(json);
    setJsonModalVisible(true);
  };

  const enemyTypes = [
    { id: 'scout', label: '외계 정찰기 (Scout)' },
    { id: 'raider', label: '외계 약탈함 (Raider)' },
    { id: 'destroyer', label: '외계 아머 멜터 (Destroyer)' },
    { id: 'boss_apocalypse', label: '아포칼립스 파괴함 (Boss A)' },
    { id: 'boss_chrono', label: '크로노 디바우러 (Boss C)' }
  ];

  return (
    <View style={styles.container}>
      <TopHud />
      <View style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => navigation.navigate('PlanetDetail')} 
              style={styles.backBtn}
            >
              <Text style={styles.backBtnText}>← 전투 화면 복귀</Text>
            </TouchableOpacity>
            <Text style={styles.title}>🤖 AI 플레이테스트 & 오토밸런서</Text>
            <Text style={styles.subtitle}>
              AI 에이전트의 자동 게임 진행 데이터를 바탕으로 적선 밸런스를 피드백 루프로 실시간 튜닝합니다.
            </Text>
          </View>

          {/* Autopilot Controller */}
          <View style={styles.controlPanel}>
            <Text style={styles.panelTitle}>시뮬레이터 제어 센터</Text>
            
            <View style={styles.controlRow}>
              <TouchableOpacity
                style={[
                  styles.autoPlayBtn,
                  isAiPlaytestActive ? styles.autoPlayActive : styles.autoPlayInactive
                ]}
                onPress={toggleAutopilot}
              >
                <Text style={styles.autoPlayBtnText}>
                  {isAiPlaytestActive ? '⚡ 오토플레이 가동 중' : '🤖 오토플레이 대기 중'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.speedLabel}>시뮬레이션 배속 설정 (Sub-tick Division)</Text>
            <View style={styles.speedRow}>
              {[1, 2, 4, 10, 20, 50].map((speed) => (
                <TouchableOpacity
                  key={speed}
                  style={[
                    styles.speedBtn,
                    aiPlaytestSpeed === speed && styles.speedBtnActive
                  ]}
                  onPress={() => handleSpeedChange(speed)}
                >
                  <Text style={[
                    styles.speedBtnText,
                    aiPlaytestSpeed === speed && styles.speedBtnTextActive
                  ]}>
                    {speed}x
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionBtn, { borderColor: '#ff3b30' }]} onPress={handleReset}>
                <Text style={[styles.actionBtnText, { color: '#ff3b30' }]}>밸런스 초기화</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.actionBtn, { borderColor: '#00f0ff' }]} onPress={handleExport}>
                <Text style={[styles.actionBtnText, { color: '#00f0ff' }]}>JSON 스펙 내보내기</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Live Simulation Monitor */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: '#00ff8a' }]}>📊 실시간 시뮬레이션 모니터</Text>
            <View style={styles.monitorCard}>
              <View style={styles.monitorRow}>
                <View style={styles.monitorItem}>
                  <Text style={styles.monitorLabel}>진행 웨이브</Text>
                  <Text style={[styles.monitorValue, { color: '#00ff8a' }]}>WAVE {currentWave}</Text>
                </View>
                <View style={styles.monitorItem}>
                  <Text style={styles.monitorLabel}>지구 내구도</Text>
                  <Text style={[styles.monitorValue, { color: '#ff5c5c' }]}>{Math.round(earthHp)} / {earthMaxHp}</Text>
                </View>
                <View style={styles.monitorItem}>
                  <Text style={styles.monitorLabel}>보호막 잔여량</Text>
                  <Text style={[styles.monitorValue, { color: '#00f0ff' }]}>{Math.round(earthShield)} / {Math.round(earthMaxShield)}</Text>
                </View>
              </View>

              <View style={[styles.monitorRow, { marginTop: 15 }]}>
                <View style={styles.monitorItem}>
                  <Text style={styles.monitorLabel}>크레딧 금고</Text>
                  <Text style={styles.monitorValueMini}>{Math.floor(credits).toLocaleString()} Cr</Text>
                </View>
                <View style={styles.monitorItem}>
                  <Text style={styles.monitorLabel}>외계 나노코어</Text>
                  <Text style={styles.monitorValueMini}>{nanocores} 코어</Text>
                </View>
                <View style={styles.monitorItem}>
                  <Text style={styles.monitorLabel}>시공의 입자 (TP)</Text>
                  <Text style={[styles.monitorValueMini, { color: '#bf5cff' }]}>{timeParticles} TP</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Tuning Comparison Grid */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: '#ffd700' }]}>👾 적선 능력치 실시간 튜닝 현황</Text>
            <Text style={styles.sectionDesc}>시공간 루프 속에서 AI 에이전트의 생존 지표에 따라 스탯이 자동 튜닝됩니다.</Text>
            
            <View style={styles.statsGrid}>
              {enemyTypes.map((enemy) => {
                const defHp = DEFAULT_ALIEN_SPECS[enemy.id].maxHp;
                const curHp = ALIEN_SPECS[enemy.id].maxHp;
                const hpPct = Math.round(((curHp - defHp) / defHp) * 100);

                const defDmg = DEFAULT_ALIEN_SPECS[enemy.id].damage;
                const curDmg = ALIEN_SPECS[enemy.id].damage;
                const dmgPct = Math.round(((curDmg - defDmg) / defDmg) * 100);

                return (
                  <View key={enemy.id} style={styles.statsCard}>
                    <Text style={styles.cardName}>{enemy.label}</Text>
                    
                    <View style={styles.statCompareRow}>
                      <Text style={styles.statLabel}>❤️ 체력 (Max HP)</Text>
                      <View style={styles.statCompareVal}>
                        <Text style={styles.statDefault}>{defHp}</Text>
                        <Text style={styles.statArrow}>➔</Text>
                        <Text style={[
                          styles.statCurrent,
                          curHp > defHp ? styles.colorGain : curHp < defHp ? styles.colorLoss : null
                        ]}>
                          {curHp} ({hpPct >= 0 ? `+${hpPct}%` : `${hpPct}%`})
                        </Text>
                      </View>
                    </View>

                    <View style={styles.statCompareRow}>
                      <Text style={styles.statLabel}>⚔️ 공격력 (Damage)</Text>
                      <View style={styles.statCompareVal}>
                        <Text style={styles.statDefault}>{defDmg}</Text>
                        <Text style={styles.statArrow}>➔</Text>
                        <Text style={[
                          styles.statCurrent,
                          curDmg > defDmg ? styles.colorGain : curDmg < defDmg ? styles.colorLoss : null
                        ]}>
                          {curDmg} ({dmgPct >= 0 ? `+${dmgPct}%` : `${dmgPct}%`})
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Autoplay & Balancing Log */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: '#af52de' }]}>📝 플레이테스트 및 튜닝 로그</Text>
            <View style={styles.logCard}>
              {(!playtestMetrics || playtestMetrics.length === 0) ? (
                <Text style={styles.noLogText}>수집된 데이터가 없습니다. 오토플레이를 시작하십시오.</Text>
              ) : (
                playtestMetrics.map((log) => (
                  <View key={log.id} style={styles.logRow}>
                    <View style={styles.logMeta}>
                      <Text style={styles.logTime}>{log.timestamp}</Text>
                      <Text style={styles.logWave}>WAVE {log.wave}</Text>
                    </View>
                    <View style={styles.logBody}>
                      <Text style={styles.logText}>
                        클리어 시간: {log.duration}초 | 최소 실드: {log.minShield}% | 최소 체력: {log.minHp}%
                      </Text>
                      <Text style={[
                        styles.logAction,
                        log.action.includes('Increased') ? { color: '#00ff8a' } : log.action.includes('Decreased') ? { color: '#ff3b30' } : { color: '#8fa0c4' }
                      ]}>
                        조정 사항: {log.action}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>

        </ScrollView>
      </View>

      {/* JSON Export Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={jsonModalVisible}
        onRequestClose={() => setJsonModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>tuned_balance_specs.json</Text>
            <Text style={styles.modalDesc}>아래 JSON 스펙 데이터를 복사하여 gameSpecs.js 상수에 직접 반영할 수 있습니다.</Text>
            
            <TextInput
              style={styles.modalTextarea}
              multiline={true}
              value={exportedJson}
              editable={false}
              selectTextOnFocus={true}
            />

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setJsonModalVisible(false)}
            >
              <Text style={styles.modalCloseBtnText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050814',
    overflow: 'hidden',
  },
  scrollContent: {
    paddingBottom: 80,
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00ff8a',
    textShadowColor: 'rgba(0, 255, 138, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 12,
    color: '#8fa0c4',
    marginTop: 6,
    lineHeight: 16,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 255, 138, 0.15)',
    borderWidth: 1,
    borderColor: '#00ff8a',
    marginBottom: 15,
  },
  backBtnText: {
    color: '#00ff8a',
    fontSize: 12,
    fontWeight: 'bold',
  },
  controlPanel: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 240, 255, 0.05)',
    borderWidth: 1.5,
    borderColor: '#00f0ff',
    shadowColor: '#00f0ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  controlRow: {
    marginBottom: 16,
  },
  autoPlayBtn: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  autoPlayActive: {
    backgroundColor: '#00ff8a',
    borderColor: '#00ff8a',
    shadowColor: '#00ff8a',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  autoPlayInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  autoPlayBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 2,
  },
  speedLabel: {
    fontSize: 11,
    color: '#8fa0c4',
    marginBottom: 8,
  },
  speedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  speedBtn: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  speedBtnActive: {
    backgroundColor: '#00f0ff',
    borderColor: '#00f0ff',
  },
  speedBtnText: {
    color: '#8fa0c4',
    fontSize: 12,
    fontWeight: 'bold',
  },
  speedBtnTextActive: {
    color: '#050814',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sectionDesc: {
    fontSize: 11,
    color: '#8fa0c4',
    marginTop: -6,
    marginBottom: 10,
  },
  monitorCard: {
    backgroundColor: 'rgba(10, 20, 45, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 138, 0.2)',
    borderRadius: 8,
    padding: 15,
  },
  monitorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  monitorItem: {
    flex: 1,
    alignItems: 'center',
  },
  monitorLabel: {
    fontSize: 10,
    color: '#8fa0c4',
    marginBottom: 4,
  },
  monitorValue: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  monitorValueMini: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statsCard: {
    width: '100%',
    backgroundColor: 'rgba(10, 20, 45, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  cardName: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 215, 0, 0.1)',
    paddingBottom: 4,
  },
  statCompareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 3,
  },
  statLabel: {
    fontSize: 10,
    color: '#8fa0c4',
  },
  statCompareVal: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statDefault: {
    fontSize: 11,
    color: '#8fa0c4',
    textDecorationLine: 'line-through',
  },
  statArrow: {
    fontSize: 10,
    color: '#8fa0c4',
    marginHorizontal: 5,
  },
  statCurrent: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  colorGain: {
    color: '#00ff8a',
  },
  colorLoss: {
    color: '#ff3b30',
  },
  logCard: {
    backgroundColor: 'rgba(10, 20, 45, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(175, 82, 222, 0.2)',
    borderRadius: 8,
    padding: 12,
    maxHeight: 300,
  },
  noLogText: {
    color: '#8fa0c4',
    fontSize: 11,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 15,
  },
  logRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 8,
  },
  logMeta: {
    width: 80,
    marginRight: 10,
  },
  logTime: {
    fontSize: 9,
    color: '#8fa0c4',
  },
  logWave: {
    fontSize: 11,
    color: '#af52de',
    fontWeight: 'bold',
    marginTop: 2,
  },
  logBody: {
    flex: 1,
  },
  logText: {
    color: '#ffffff',
    fontSize: 10,
  },
  logAction: {
    fontSize: 9.5,
    fontWeight: 'bold',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#0a142d',
    borderWidth: 2,
    borderColor: '#00f0ff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#00f0ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00f0ff',
    marginBottom: 6,
  },
  modalDesc: {
    fontSize: 11,
    color: '#8fa0c4',
    marginBottom: 15,
    lineHeight: 15,
  },
  modalTextarea: {
    flex: 1,
    backgroundColor: '#050814',
    borderColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    color: '#00ff8a',
    fontFamily: 'Courier New',
    fontSize: 11,
    textAlignVertical: 'top',
    minHeight: 250,
  },
  modalCloseBtn: {
    backgroundColor: '#00f0ff',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 15,
  },
  modalCloseBtnText: {
    color: '#050814',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
