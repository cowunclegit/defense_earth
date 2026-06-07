import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useGameStore } from '../store/gameStore';
import TopHud from '../components/TopHud';

export default function ChronosLabScreen({ navigation }) {
  const { 
    timeParticles, 
    chronosUpgrades, 
    buyChronosUpgrade, 
    triggerTimeLoop,
    timeMachineGauge,
    credits,
    nanocores,
    planets,
    researchUpgrades,
    buyResearchUpgrade
  } = useGameStore();

  const handleUpgrade = (key, name) => {
    const currentLevel = chronosUpgrades[key];
    const cost = Math.pow(3, currentLevel) * 5;

    if (timeParticles < cost) {
      Alert.alert('시공의 입자 부족', 'TP가 부족합니다. 타임머신을 가동하여 회귀하십시오.');
      return;
    }

    buyChronosUpgrade(key);
  };

  const handleResearch = (key, name) => {
    if (researchUpgrades[key]) {
      Alert.alert('연구 완료', '이미 해당 역공학 연구가 완성되었습니다.');
      return;
    }
    if (nanocores < 15) {
      Alert.alert('나노코어 부족', '연구에 필요한 외계 나노코어(15개)가 부족합니다. 거대 보스나 엘리트 외계선을 물리치십시오.');
      return;
    }
    buyResearchUpgrade(key);
  };

  const handleTimeLoop = () => {
    if (timeMachineGauge < 100) {
      Alert.alert('충전 미달', '타임머신 충전 게이지가 100%에 도달해야 가동할 수 있습니다.');
      return;
    }

    // 예측 획득 TP 계산
    let totalTerraformProgress = 0;
    Object.values(planets).forEach((p) => {
      totalTerraformProgress += p.terraformProgress;
    });
    const baseTP = (credits * 0.00001) + (nanocores * 0.1) + (totalTerraformProgress * 10);
    const upgradeBonus = 1 + (chronosUpgrades.rebirthBonus * 0.1);
    const earnedTP = Math.floor(baseTP * upgradeBonus);

    Alert.alert(
      '시공간 회귀 발동',
      `정말 시간 루프에 진입하시겠습니까?\n\n- 획득 예정 시공의 입자(TP): +${earnedTP}개\n\n※ 주의: 크로노스 연구소의 영구 업그레이드를 제외한 모든 크레딧, 나노코어, 개척 행성 및 궤도 함대가 초기화됩니다.`,
      [
        { text: '취소', style: 'cancel' },
        { text: '시간 회귀 실행', onPress: () => triggerTimeLoop(), style: 'destructive' }
      ]
    );
  };

  const upgradeSpecs = [
    {
      key: 'creditGen',
      name: '양자 금융 세무망',
      desc: '크레딧 세금 수급 효율 +10% 영구 증가',
      category: '생산 및 개척'
    },
    {
      key: 'energyGen',
      name: '다이슨 스피어 파편',
      desc: '전체 전력 생산량 +10% 영구 증가',
      category: '생산 및 개척'
    },
    {
      key: 'nanocoreGen',
      name: '자동 나노 팩토리',
      desc: '초당 나노코어 자원 생산 +0.1 영구 추가',
      category: '생산 및 개척'
    },
    {
      key: 'shieldCap',
      name: 'Aegis 실드 증폭기',
      desc: '에너지 보호막 최대 용량 +15% 영구 증가',
      category: '전투 및 무장'
    },
    {
      key: 'shieldRegen',
      name: '타키온 전도 회로',
      desc: '에너지 보호막 초당 충전율 +15% 영구 증가',
      category: '전투 및 무장'
    },
    {
      key: 'kineticIntercept',
      name: 'SAM 궤도 센서망',
      desc: '키네틱 격추율 기본 확률 +2% 영구 증가',
      category: '전투 및 무장'
    },
    {
      key: 'fleetDamage',
      name: '중력자 가속 탄두',
      desc: '궤도 기동 함대 공격 데미지 +10% 영구 증가',
      category: '전투 및 무장'
    },
    {
      key: 'timeMachineSpeed',
      name: '크로노스 아티팩트',
      desc: '타임머신 충전 속도 +15% 영구 가속',
      category: '시공 및 특수'
    },
    {
      key: 'rebirthBonus',
      name: '시공 정합성 기억 장치',
      desc: '회귀 시 획득하는 시공의 입자(TP) 수량 +10% 영구 증가',
      category: '시공 및 특수'
    }
  ];

  const researchSpecs = [
    {
      key: 'beamConversion',
      name: '빔 관통 에너지 환산망',
      desc: '에너지 쉴드 피격 시 빔 대미지의 10%를 크레딧 자원으로 역수급',
    },
    {
      key: 'selfRepair',
      name: '나노 분사 자가 수리망',
      desc: '기동 함대가 정박 중이지 않아도 매초 HP 1%씩 무료 자가 치유',
    },
    {
      key: 'tachionTargeting',
      name: '타키온 조준 정밀 정렬',
      desc: '모든 아군 궤도 기동 함선의 탄환 파괴 대미지 25% 증폭',
    }
  ];

  return (
    <View style={styles.container}>
      <TopHud />
      <View style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* 헤더 정보 */}
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => navigation.navigate('PlanetDetail')} 
              style={styles.backBtn}
            >
              <Text style={styles.backBtnText}>← 전투 화면 복귀</Text>
            </TouchableOpacity>
            <Text style={styles.title}>크로노스 시간 연구소</Text>
            <Text style={styles.subtitle}>시공의 입자(TP)를 활용한 지구 방어선 영구 업그레이드</Text>
          </View>

          {/* 타임 루프 가동 장치 */}
          <View style={styles.rebirthPanel}>
            <Text style={styles.panelTitle}>시공간 타임머신 코어</Text>
            <View style={styles.gaugeRow}>
              <View style={styles.gaugeBg}>
                <View style={[styles.gaugeFill, { width: `${timeMachineGauge}%` }]} />
              </View>
              <Text style={styles.gaugeText}>{Math.floor(timeMachineGauge)}%</Text>
            </View>
            <Text style={styles.panelDesc}>
              지구가 함락되거나, 타임머신 게이지가 100% 차오르면 자발적으로 루프에 들어갈 수 있습니다.
            </Text>
            <TouchableOpacity
              style={[
                styles.loopBtn,
                timeMachineGauge >= 100 ? styles.loopBtnActive : styles.loopBtnDisabled
              ]}
              onPress={handleTimeLoop}
              disabled={timeMachineGauge < 100}
            >
              <Text style={[
                styles.loopBtnText,
                timeMachineGauge >= 100 ? styles.loopBtnTextActive : styles.loopBtnTextDisabled
              ]}>
                {timeMachineGauge >= 100 ? '시간 루프 가동 (자발적 회귀)' : '타임머신 충전 중...'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 외계 아티팩트 역공학 연구소 */}
          <View style={styles.upgradeSection}>
            <Text style={[styles.sectionTitle, { color: '#00f0ff' }]}>보스 전리품: 역공학 연구실</Text>
            <Text style={styles.sectionDesc}>보스 격퇴 시 획득하는 나노코어로 아티팩트 잠금해제 (회귀 시 초기화)</Text>

            <View style={styles.gridContainer}>
              {researchSpecs.map((spec) => {
                const isCompleted = researchUpgrades[spec.key];
                return (
                  <View 
                    key={spec.key} 
                    style={[
                      styles.gridCard, 
                      { borderColor: '#00f0ff' },
                      isCompleted && { 
                        backgroundColor: 'rgba(0, 240, 255, 0.05)',
                        borderColor: '#00f0ff',
                        shadowColor: '#00f0ff',
                        shadowOpacity: 0.25,
                        shadowRadius: 6,
                      }
                    ]}
                  >
                    <View style={styles.gridCardHeader}>
                      <Text style={[styles.gridCardCategory, { color: '#00f0ff' }]}>아티팩트 리버스</Text>
                      <Text style={[styles.gridCardStatusText, { color: isCompleted ? '#00f0ff' : '#8fa0c4' }]}>
                        {isCompleted ? '연구 완성' : '대기'}
                      </Text>
                    </View>
                    <Text style={styles.gridCardName}>{spec.name}</Text>
                    <Text style={styles.gridCardDesc}>{spec.desc}</Text>
                    
                    {isCompleted ? (
                      <View style={[styles.gridCompleteBadgeMini, { borderColor: '#00f0ff' }]}>
                        <Text style={[styles.gridCompleteTextMini, { color: '#00f0ff' }]}>연구 완성</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[styles.gridBuildBtn, { backgroundColor: '#00bfa5' }]}
                        onPress={() => handleResearch(spec.key, spec.name)}
                      >
                        <Text style={styles.buyBtnText}>연구</Text>
                        <Text style={styles.buyBtnCost}>15 Nano</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* 업그레이드 노드 리스트 */}
          <View style={styles.upgradeSection}>
            <Text style={[styles.sectionTitle, { color: '#bf5cff' }]}>크로노스 과학 연구 트리</Text>
            
            <View style={styles.gridContainer}>
              {upgradeSpecs.map((spec) => {
                const level = chronosUpgrades[spec.key] || 0;
                const cost = Math.pow(3, level) * 5;

                return (
                  <View key={spec.key} style={[styles.gridCard, { borderColor: '#bf5cff' }]}>
                    <View style={styles.gridCardHeader}>
                      <Text style={[styles.gridCardCategory, { color: '#bf5cff' }]}>{spec.category}</Text>
                      <Text style={[styles.gridCardStatusText, { color: '#ffd700' }]}>Lv.{level}</Text>
                    </View>
                    <Text style={styles.gridCardName}>{spec.name}</Text>
                    <Text style={styles.gridCardDesc}>{spec.desc}</Text>
                    
                    <TouchableOpacity
                      style={[styles.gridBuildBtn, { backgroundColor: '#bf5cff' }]}
                      onPress={() => handleUpgrade(spec.key, spec.name)}
                    >
                      <Text style={styles.buyBtnText}>강화</Text>
                      <Text style={styles.buyBtnCost}>{cost} TP</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>

        </ScrollView>
      </View>
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
    color: '#bf5cff',
    textShadowColor: 'rgba(191, 92, 255, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 12,
    color: '#8fa0c4',
    marginTop: 4,
  },
  rebirthPanel: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(191, 92, 255, 0.05)',
    borderWidth: 1.5,
    borderColor: '#bf5cff',
    shadowColor: '#bf5cff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  gaugeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  gaugeBg: {
    flex: 1,
    height: 12,
    backgroundColor: '#161125',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(191, 92, 255, 0.2)',
    overflow: 'hidden',
  },
  gaugeFill: {
    height: '100%',
    backgroundColor: '#bf5cff',
    shadowColor: '#bf5cff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  gaugeText: {
    color: '#bf5cff',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 12,
    width: 38,
  },
  panelDesc: {
    fontSize: 11,
    color: '#8fa0c4',
    lineHeight: 16,
    marginBottom: 16,
  },
  loopBtn: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  loopBtnActive: {
    backgroundColor: '#bf5cff',
    borderColor: '#d28cff',
    shadowColor: '#bf5cff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 3,
  },
  loopBtnDisabled: {
    backgroundColor: 'rgba(191, 92, 255, 0.02)',
    borderColor: 'rgba(191, 92, 255, 0.1)',
  },
  loopBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  loopBtnTextActive: {
    color: '#ffffff',
  },
  loopBtnTextDisabled: {
    color: 'rgba(255, 255, 255, 0.2)',
  },
  upgradeSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  sectionDesc: {
    fontSize: 11,
    color: '#8fa0c4',
    marginBottom: 10,
    marginTop: -8,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  gridCard: {
    width: '49%',
    backgroundColor: 'rgba(10, 20, 45, 0.75)',
    borderWidth: 1.5,
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    justifyContent: 'space-between',
    minHeight: 132,
  },
  gridCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  gridCardCategory: {
    fontSize: 9.5,
    fontWeight: 'bold',
    flex: 1,
    paddingRight: 2,
  },
  gridCardStatusText: {
    fontSize: 9.5,
    fontWeight: 'bold',
    fontFamily: 'Courier New',
  },
  gridCardName: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 2,
  },
  gridCardDesc: {
    color: '#8fa0c4',
    fontSize: 8.5,
    marginVertical: 4,
    lineHeight: 11.5,
  },
  gridBuildBtn: {
    paddingVertical: 5,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 4,
  },
  gridCompleteBadgeMini: {
    paddingVertical: 5,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: 'rgba(0, 240, 255, 0.05)',
  },
  gridCompleteTextMini: {
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  buyBtnText: {
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: 'bold',
  },
  buyBtnCost: {
    color: '#ffffff',
    fontSize: 8.5,
    marginTop: 1,
    fontWeight: 'bold',
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(191, 92, 255, 0.15)',
    borderWidth: 1,
    borderColor: '#bf5cff',
    marginBottom: 15,
  },
  backBtnText: {
    color: '#bf5cff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
