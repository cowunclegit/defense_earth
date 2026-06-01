import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useGameStore } from '../store/gameStore';
import TopHud from '../components/TopHud';

export default function ChronosLabScreen() {
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* 헤더 정보 */}
        <View style={styles.header}>
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

        {/* 외계 아티팩트 역공학 연구소 (Phase 4 추가) */}
        <View style={styles.upgradeSection}>
          <Text style={[styles.sectionTitle, { color: '#00f0ff' }]}>보스 전리품: 역공학 연구실</Text>
          <Text style={styles.sectionDesc}>보스 격퇴 시 획득하는 나노코어로 아티팩트 잠금해제 (회귀 시 초기화)</Text>

          {researchSpecs.map((spec) => {
            const isCompleted = researchUpgrades[spec.key];
            return (
              <View key={spec.key} style={[styles.upgradeNode, isCompleted && styles.researchNodeActive]}>
                <View style={styles.nodeMain}>
                  <View style={styles.nodeMeta}>
                    <Text style={[styles.nodeCategory, { color: '#00f0ff' }]}>아티팩트 리버스 연구</Text>
                    <Text style={[styles.nodeLevel, { color: isCompleted ? '#00f0ff' : '#8fa0c4' }]}>
                      {isCompleted ? '연구 완성' : '연구 대기'}
                    </Text>
                  </View>
                  <Text style={styles.nodeName}>{spec.name}</Text>
                  <Text style={styles.nodeDesc}>{spec.desc}</Text>
                </View>
                
                <TouchableOpacity
                  style={[styles.nodeBuyBtn, { backgroundColor: isCompleted ? '#007f8a' : '#00bfa5' }]}
                  onPress={() => handleResearch(spec.key, spec.name)}
                  disabled={isCompleted}
                >
                  <Text style={styles.buyBtnText}>{isCompleted ? '완료' : '연구'}</Text>
                  <Text style={styles.buyBtnCost}>15 Nano</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* 업그레이드 노드 리스트 */}
        <View style={styles.upgradeSection}>
          <Text style={styles.sectionTitle}>크로노스 과학 연구 트리</Text>
          
          {upgradeSpecs.map((spec) => {
            const level = chronosUpgrades[spec.key] || 0;
            const cost = Math.pow(3, level) * 5;

            return (
              <View key={spec.key} style={styles.upgradeNode}>
                <View style={styles.nodeMain}>
                  <View style={styles.nodeMeta}>
                    <Text style={styles.nodeCategory}>{spec.category}</Text>
                    <Text style={styles.nodeLevel}>Lv.{level}</Text>
                  </View>
                  <Text style={styles.nodeName}>{spec.name}</Text>
                  <Text style={styles.nodeDesc}>{spec.desc}</Text>
                </View>
                
                <TouchableOpacity
                  style={styles.nodeBuyBtn}
                  onPress={() => handleUpgrade(spec.key, spec.name)}
                >
                  <Text style={styles.buyBtnText}>강화</Text>
                  <Text style={styles.buyBtnCost}>{cost} TP</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050814',
  },
  scrollContent: {
    paddingBottom: 100,
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
    backgroundColor: 'rgba(191, 92, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(191, 92, 255, 0.25)',
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
    backgroundColor: '#1c142b',
    borderRadius: 6,
    overflow: 'hidden',
  },
  gaugeFill: {
    height: '100%',
    backgroundColor: '#bf5cff',
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
    borderColor: '#c66eff',
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
  upgradeNode: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(10, 20, 45, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    marginVertical: 6,
  },
  nodeMain: {
    flex: 1,
    paddingRight: 10,
  },
  nodeMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  nodeCategory: {
    fontSize: 10,
    color: '#bf5cff',
    fontWeight: 'bold',
  },
  nodeLevel: {
    fontSize: 10,
    color: '#ffd700',
    fontWeight: 'bold',
  },
  nodeName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  nodeDesc: {
    color: '#8fa0c4',
    fontSize: 11,
    marginTop: 2,
  },
  nodeBuyBtn: {
    width: 65,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#bf5cff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  buyBtnCost: {
    color: '#ffffff',
    fontSize: 10,
    marginTop: 2,
    fontWeight: 'bold',
  },
  sectionDesc: {
    fontSize: 11,
    color: '#8fa0c4',
    marginBottom: 10,
    marginTop: -8,
  },
  researchNodeActive: {
    borderColor: 'rgba(0, 240, 255, 0.3)',
    backgroundColor: 'rgba(0, 240, 255, 0.05)',
  }
});
