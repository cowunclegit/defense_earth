import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { 
  useGameStore, 
  SHIP_TYPES, 
  SHIP_SPECS, 
  GROUND_BASE_SPECS, 
  SATELLITE_SPECS, 
  STATION_SPECS, 
  SHIELD_MODULE_SPECS, 
  COUNTERATTACK_MODULE_SPECS 
} from '../store/gameStore';
import { PLANETARY_DATA, PLANETS } from '../constants/planetaryData';
import TopHud from '../components/TopHud';
import GameCanvas from '../game/GameCanvas';

export default function PlanetDetailScreen({ route, navigation }) {
  const planetId = route?.params?.planetId || PLANETS.EARTH;
  const [activeTab, setActiveTab] = React.useState('ground');
  const { 
    planets, 
    credits, 
    maxEnergy, 
    usedEnergy, 
    earthHp,
    earthMaxHp,
    earthShield,
    earthMaxShield,
    upgradePlanetTerraform, 
    kineticDefenseTowers,
    buildKineticTower,
    fleetSlots,
    setFleetReservation,
    damageEarth,
    autoTerraform,
    autoBuildTowers,
    toggleAutoTerraform,
    toggleAutoBuildTowers,
    isPremium,
    buyPremium,
    saveGame,
    loadGame,
    resetDatabase,
    cheatCredits,
    cheatNanocores,
    cheatTimeParticles,
    cheatTimeMachineMax,
    cheatAdvanceWaves,
    cheatMaxEnergy,
    
    // 신규 방어 체계 액션 및 상태
    buildGroundBaseDetail,
    buildOrbitalSatelliteDetail,
    buildOrbitalStationDetail,
    changeShieldModule,
    toggleCounterattackModule,
    shieldModule,
    counterattackModules
  } = useGameStore();

  React.useEffect(() => {
    loadGame();
  }, []);

  const planetState = planets[planetId];
  const planetData = PLANETARY_DATA[planetId];

  if (!planetState || !planetData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>행성 정보를 찾을 수 없습니다.</Text>
      </View>
    );
  }

  const handleUpgrade = () => {
    const costCredit = Math.floor(planetData.terraformCredit * 0.1);
    const costEnergy = Math.floor(planetData.terraformEnergy * 0.1);
    const availableEnergy = maxEnergy - usedEnergy;

    if (credits < costCredit) {
      Alert.alert('자원 부족', '크레딧이 부족합니다.');
      return;
    }
    if (availableEnergy < costEnergy) {
      Alert.alert('전력 부족', '가용 전력 한도가 부족합니다.');
      return;
    }

    const success = upgradePlanetTerraform(planetId);
    if (success) {
      setTimeout(() => saveGame(), 100);
    }
  };

  const handleBuildTower = () => {
    const cost = 500 * (kineticDefenseTowers + 1);
    if (credits < cost) {
      Alert.alert('자원 부족', '크레딧이 부족합니다.');
      return;
    }
    const success = buildKineticTower();
    if (success) {
      setTimeout(() => saveGame(), 100);
    }
  };

  const handleToggleAutoTerraform = () => {
    if (!isPremium) {
      Alert.alert(
        '프리미엄 기능 해금',
        '자동 테라포밍 옵션은 [광고제거 프리미엄 패스] 구매자 전용입니다.\n\n즉시 모의 결제하여 해금하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          { text: '즉시 해금', onPress: () => buyPremium() }
        ]
      );
      return;
    }
    toggleAutoTerraform();
    setTimeout(() => saveGame(), 100);
  };

  const handleToggleAutoBuild = () => {
    if (!isPremium) {
      Alert.alert(
        '프리미엄 기능 해금',
        '자동 요격 타워 재건 옵션은 [광고제거 프리미엄 패스] 구매자 전용입니다.\n\n즉시 모의 결제하여 해금하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          { text: '즉시 해금', onPress: () => buyPremium() }
        ]
      );
      return;
    }
    toggleAutoBuildTowers();
    setTimeout(() => saveGame(), 100);
  };

  const handleAddShip = (type) => {
    const currentReserved = fleetSlots[type] || 0;
    setFleetReservation(type, currentReserved + 1);
    setTimeout(() => saveGame(), 100);
  };

  const handleRemoveShip = (type) => {
    const currentReserved = fleetSlots[type] || 0;
    setFleetReservation(type, Math.max(0, currentReserved - 1));
    setTimeout(() => saveGame(), 100);
  };

  // 모의 전투 피해 주기 (개발/테스트 편의용)
  const triggerMockAttack = (type) => {
    damageEarth(10, type);
  };

  const handleResetDb = () => {
    Alert.alert(
      '데이터베이스 초기화',
      '모든 세이브 데이터와 진행도를 지우고 처음부터 시작하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { text: '초기화', style: 'destructive', onPress: () => resetDatabase() }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TopHud />
      <View style={styles.fixedContentContainer}>
        {/* 상단: 2D 전투 캔버스 영역 */}
        <View style={styles.battleCanvasContainer}>
          <GameCanvas />
          
          {/* 오버레이: 좌상단 행성 이름 및 이동 버튼 */}
          <View style={styles.topLeftOverlay}>
            <TouchableOpacity onPress={() => navigation.navigate('SolarSystem')} style={styles.backButton}>
              <Text style={styles.backButtonText}>← 성계도</Text>
            </TouchableOpacity>
            <Text style={styles.titleText}>{planetData.name}</Text>
            <Text style={styles.synergyText}>
              시너지: {planetState.terraformProgress >= 80 ? '활성' : '대기'}
            </Text>
          </View>

          {/* 오버레이: 우상단 지구 HP & 보호막 정보 */}
          <View style={styles.topRightOverlay}>
            <Text style={styles.hpText}>지구 HP: {Math.floor(earthHp)} / {earthMaxHp}</Text>
            <Text style={styles.shieldText}>에너지 실드: {Math.floor(earthShield)} / {Math.floor(earthMaxShield)}</Text>
            <Text style={styles.kineticText}>키네틱 요격 타워: {kineticDefenseTowers}개</Text>
          </View>

          {/* 오버레이: 좌하단 테스트용 피격 버튼 */}
          <View style={styles.bottomLeftOverlay}>
            <TouchableOpacity style={styles.miniMockBtn} onPress={() => triggerMockAttack('energy')}>
              <Text style={styles.miniMockText}>에너지 피격 (빔)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.miniMockBtn, { backgroundColor: '#c23b3b' }]} onPress={() => triggerMockAttack('kinetic')}>
              <Text style={styles.miniMockText}>키네틱 피격 (철갑탄)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 하단 제어판 및 조작 버튼 */}
        <View style={styles.controlPanel}>
          {/* 테라포밍 프로젝트 줄 (매우 콤팩트하게) */}
          <View style={styles.compactTerraformRow}>
            <Text style={styles.terraformProgressText}>테라포밍 {planetState.terraformProgress}%</Text>
            <View style={styles.compactProgressBarBg}>
              <View style={[styles.compactProgressBarFill, { width: `${planetState.terraformProgress}%` }]} />
            </View>
            {planetState.terraformProgress < 100 ? (
              <TouchableOpacity style={styles.compactUpgradeBtn} onPress={handleUpgrade}>
                <Text style={styles.compactUpgradeBtnText}>
                  테라포밍 10% 증가 ({Math.floor(planetData.terraformCredit * 0.1).toLocaleString()} Cr)
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.compactCompleteBadge}>
                <Text style={styles.compactCompleteText}>완료</Text>
              </View>
            )}
          </View>
          <Text style={styles.populationText}>
            현재 수용 인구: {planetState.population.toLocaleString()}명 / {planetData.maxPopulation.toLocaleString()}명
          </Text>

          {/* QoL 자동화 토글 줄 */}
          <View style={styles.qolRow}>
            <View style={styles.qolItem}>
              <Text style={styles.qolLabel}>자동 테라포밍 시스템</Text>
              <TouchableOpacity 
                style={[styles.qolToggleBtn, autoTerraform ? styles.toggleOn : styles.toggleOff]} 
                onPress={handleToggleAutoTerraform}
              >
                <Text style={styles.toggleBtnText}>
                  {!isPremium ? '🔒 PASS 전용' : autoTerraform ? 'ON' : 'OFF'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.qolItem}>
              <Text style={styles.qolLabel}>자동 요격 타워 재건</Text>
              <TouchableOpacity 
                style={[styles.qolToggleBtn, autoBuildTowers ? styles.toggleOn : styles.toggleOff]} 
                onPress={handleToggleAutoBuild}
              >
                <Text style={styles.toggleBtnText}>
                  {!isPremium ? '🔒 PASS 전용' : autoBuildTowers ? 'ON' : 'OFF'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 탭 헤더 */}
          <View style={styles.tabHeaderWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabHeaderRow}>
              {['ground', 'satellite', 'station', 'shipyard', 'shield'].map((tab) => {
                let label = '지상 기지';
                if (tab === 'satellite') label = '궤도 위성';
                else if (tab === 'station') label = '궤도 기지';
                else if (tab === 'shipyard') label = '함대 쉽야드';
                else if (tab === 'shield') label = '실드 발생기';
                return (
                  <TouchableOpacity 
                    key={tab} 
                    style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
                    onPress={() => setActiveTab(tab)}
                  >
                    <Text style={[styles.tabButtonText, activeTab === tab && styles.tabButtonTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* 탭 본문 영역 (내부 스크롤 지원) */}
          <ScrollView style={styles.tabScrollContainer} contentContainerStyle={styles.tabScrollContent}>
            {/* 지상 기지 탭 */}
            {activeTab === 'ground' && (
              <View>
                <Text style={styles.subTitleText}>지상 방어 기지 수량: {planetState.groundBases} / 8</Text>
                
                {/* E2E test compatibility: kinetic 요격 타워 (대함 레일건 요새) first */}
                <View style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>키네틱 요격 타워</Text>
                    <Text style={styles.itemDesc}>
                      적 키네틱 탄환 요격 성공 확률 +5% (보유: {planetState.groundBasesList?.railgun || 0}개)
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.buildBtn} 
                    onPress={() => {
                      const success = buildGroundBaseDetail(planetId, 'railgun');
                      if (success) setTimeout(() => saveGame(), 100);
                      else Alert.alert('건설 실패', '자원이 부족하거나 최대 건설 한도(8개)에 도달했습니다.');
                    }}
                  >
                    <Text style={styles.buildBtnText}>
                      건설 ({GROUND_BASE_SPECS.railgun.cost} Cr)
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* 나머지 지상 무기 렌더링 */}
                {Object.keys(GROUND_BASE_SPECS).map((type) => {
                  if (type === 'railgun') return null; // Already rendered first
                  const spec = GROUND_BASE_SPECS[type];
                  const count = planetState.groundBasesList?.[type] || 0;
                  let desc = spec.isWeapon ? `공격력: ${spec.dmg} HP, 재장전: ${spec.cd}초` : '방어/보조 모듈';
                  if (type === 'ciws') desc = '적 미사일/포탄 자동 요격 (0.8초 쿨다운)';
                  if (type === 'forceShield') desc = '기지 HP +30% 실드 추가 (상시 에너지 소모)';
                  if (type === 'armor') desc = '받는 데미지 25% 감소 (패시브)';
                  return (
                    <View key={type} style={styles.itemRow}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{spec.name} (보유: {count}개)</Text>
                        <Text style={styles.itemDesc}>{desc} | 전력: {spec.energy}W</Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.buildBtn} 
                        onPress={() => {
                          const success = buildGroundBaseDetail(planetId, type);
                          if (success) setTimeout(() => saveGame(), 100);
                          else Alert.alert('건설 실패', '자원이 부족하거나 최대 건설 한도(8개)에 도달했습니다.');
                        }}
                      >
                        <Text style={styles.buildBtnText}>
                          건설 ({spec.cost} Cr)
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}

            {/* 궤도 위성 탭 */}
            {activeTab === 'satellite' && (
              <View>
                <Text style={styles.subTitleText}>궤도 방어 위성 수량: {planetState.orbitalSatellites} / 5</Text>
                {Object.keys(SATELLITE_SPECS).map((type) => {
                  const spec = SATELLITE_SPECS[type];
                  const count = planetState.orbitalSatellitesList?.[type] || 0;
                  let desc = spec.isWeapon ? `공격력: ${spec.dmg} HP, 재장전: ${spec.cd}초` : '지원/보조 위성';
                  if (type === 'emp') desc = '적 전자계 마비 (3초 스턴, 6초 쿨다운)';
                  if (type === 'gravityBomb') desc = '공격력: 160 HP, 적 이동속도 -40% 디버프';
                  if (type === 'sensor') desc = '적 탐지 반경 +50% 및 적 이동속도 감속';
                  if (type === 'decoy') desc = '적 투사체/레이저 요격 흡수 버프';
                  if (type === 'repairDrone') desc = '아군 궤도 함선 초당 20 HP 지속 회복';
                  return (
                    <View key={type} style={styles.itemRow}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{spec.name} (보유: {count}개)</Text>
                        <Text style={styles.itemDesc}>{desc} | 전력: {spec.energy}W</Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.buildBtn} 
                        onPress={() => {
                          const success = buildOrbitalSatelliteDetail(planetId, type);
                          if (success) setTimeout(() => saveGame(), 100);
                          else Alert.alert('건설 실패', '자원이 부족하거나 최대 위성 한도(5개)에 도달했습니다.');
                        }}
                      >
                        <Text style={styles.buildBtnText}>
                          건설 ({spec.cost} Cr)
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}

            {/* 궤도 기지 탭 */}
            {activeTab === 'station' && (
              <View>
                <Text style={styles.subTitleText}>궤도 방어 기지 수량: {planetState.orbitalStations} / 3</Text>
                {Object.keys(STATION_SPECS).map((type) => {
                  const spec = STATION_SPECS[type];
                  const count = planetState.orbitalStationsList?.[type] || 0;
                  let desc = '';
                  if (type === 'aegisShield') desc = '행성 에너지 실드 최대 용량 +20% 증가';
                  if (type === 'gigaPlasma') desc = '발사 시 광역 마비 5초 + 500 HP 피해 (20초 재장전)';
                  if (type === 'gravityDistorter') desc = '태양계 모든 적 기동 속도 -25% 감속';
                  return (
                    <View key={type} style={styles.itemRow}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{spec.name} (보유: {count}/1개)</Text>
                        <Text style={styles.itemDesc}>{desc} | 전력: {spec.energy}W</Text>
                      </View>
                      {count === 0 ? (
                        <TouchableOpacity 
                          style={styles.buildBtn} 
                          onPress={() => {
                            const success = buildOrbitalStationDetail(planetId, type);
                            if (success) setTimeout(() => saveGame(), 100);
                            else Alert.alert('건설 실패', '크레딧, 나노코어, 또는 가용 전력이 부족합니다.');
                          }}
                        >
                          <Text style={styles.buildBtnText}>
                            건설 ({spec.cost} Cr, {spec.nanocores} Nano)
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.completeBadgeMini}>
                          <Text style={styles.completeTextMini}>가동 중</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* 쉽야드 탭 */}
            {activeTab === 'shipyard' && (
              <View>
                {!planetState.shipyard ? (
                  <View style={styles.shipyardBuildBox}>
                    <Text style={styles.itemDesc}>능동적인 궤도 방어 함대를 운용하려면 쉽야드가 필수적입니다.</Text>
                    <TouchableOpacity 
                      style={[styles.upgradeBtn, { marginTop: 10 }]} 
                      onPress={() => {
                        const success = useGameStore.getState().buildShipyard(planetId);
                        if (success) setTimeout(() => saveGame(), 100);
                        else Alert.alert('건설 실패', '자원이 부족합니다. (요구: 3,000 Cr, 5 Nano, 15W)');
                      }}
                    >
                      <Text style={styles.upgradeBtnText}>쉽야드 건설 (3,000 Cr, 5 Nano, 15W)</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View>
                    <Text style={styles.subTitleText}>기동 함대 슬롯 예약 (자동 보충 및 배치)</Text>
                    {Object.keys(SHIP_SPECS).map((type) => {
                      const reserved = fleetSlots[type] || 0;
                      const spec = SHIP_SPECS[type];
                      let role = spec.damage > 0 ? `공격: ${spec.damage} HP, 사거리: ${spec.range}` : '보조/방어 지원';
                      if (type === 'shieldCarrier') role = '아군 함대 실드 +30% 및 기동 보호막';
                      if (type === 'repairShip') role = '아군 함선 초당 50 HP 지속 수리';
                      if (type === 'barrierShip') role = '광역 배리어 전개, 함대 받는 피해 10% 감소';
                      return (
                        <View key={type} style={styles.shipRow}>
                          <View style={styles.itemInfo}>
                            <Text style={styles.itemName}>{spec.name}</Text>
                            <Text style={styles.itemDesc}>
                              {role} | 비용: {spec.baseCost} Cr, {spec.baseNanocore} Nano | 빌드타임: {spec.baseBuildTime}초
                            </Text>
                          </View>
                          <View style={styles.counterRow}>
                            <TouchableOpacity style={styles.counterBtn} onPress={() => handleRemoveShip(type)}>
                              <Text style={styles.counterBtnText}>-</Text>
                            </TouchableOpacity>
                            <Text style={styles.counterVal}>{reserved}</Text>
                            <TouchableOpacity style={styles.counterBtn} onPress={() => handleAddShip(type)}>
                              <Text style={styles.counterBtnText}>+</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {/* 실드 발생기 탭 */}
            {activeTab === 'shield' && (
              <View>
                <Text style={styles.subTitleText}>행성 보호막 에너지 실드 관리</Text>
                
                {/* 실드 모듈 교체 */}
                <Text style={styles.sectionHeader}>액티브 실드 모듈 선택</Text>
                {Object.keys(SHIELD_MODULE_SPECS).map((type) => {
                  const spec = SHIELD_MODULE_SPECS[type];
                  const isActive = shieldModule === type;
                  let desc = `실드량: +${spec.capacityBonus}, 재생: +${spec.regenBonus}/초, 전력: ${spec.energyCost}W`;
                  if (type === 'reflect') desc += ' (레이저 공격 30% 역반사)';
                  if (type === 'phase') desc += ' (모든 피해 30% 감쇄)';
                  if (type === 'repair') desc += ' (HP 초당 5 무료 재생, 붕괴 시 HP 20 복구)';
                  
                  return (
                    <View key={type} style={styles.itemRow}>
                      <View style={styles.itemInfo}>
                        <Text style={[styles.itemName, isActive && { color: '#00f0ff' }]}>
                          {spec.name} {isActive && '(장착 중)'}
                        </Text>
                        <Text style={styles.itemDesc}>{desc}</Text>
                      </View>
                      {!isActive ? (
                        <TouchableOpacity 
                          style={styles.buildBtn} 
                          onPress={() => {
                            const success = changeShieldModule(type);
                            if (success) setTimeout(() => saveGame(), 100);
                            else Alert.alert('교체 실패', '크레딧이나 가용 전력이 부족합니다.');
                          }}
                        >
                          <Text style={styles.buildBtnText}>
                            장착 ({spec.cost} Cr)
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.completeBadgeMini}>
                          <Text style={styles.completeTextMini}>활성</Text>
                        </View>
                      )}
                    </View>
                  );
                })}

                {/* 반격 모듈 토글 */}
                <Text style={[styles.sectionHeader, { marginTop: 15 }]}>반격/과부하 부가 모듈</Text>
                {Object.keys(COUNTERATTACK_MODULE_SPECS).map((type) => {
                  const spec = COUNTERATTACK_MODULE_SPECS[type];
                  const isActive = counterattackModules?.[type];
                  let desc = '';
                  if (type === 'reflector') desc = '받는 모든 피해의 30%를 적에게 무작위 반사 | 전력: 10W';
                  if (type === 'discharge') desc = '실드 완전 붕괴 직전, 적 전체에 200 광역 피해 방전 | 전력: 10W';
                  if (type === 'electricField') desc = '실드가 켜져 있는 동안, 주변 적에게 초당 80 지속 피해 | 전력: 15W';
                  
                  return (
                    <View key={type} style={styles.itemRow}>
                      <View style={styles.itemInfo}>
                        <Text style={[styles.itemName, isActive && { color: '#ffd700' }]}>
                          {spec.name} {isActive && '(장착 활성화)'}
                        </Text>
                        <Text style={styles.itemDesc}>{desc}</Text>
                      </View>
                      <TouchableOpacity 
                        style={[styles.toggleBtn, isActive ? styles.toggleBtnOn : styles.toggleBtnOff]} 
                        onPress={() => {
                          const success = toggleCounterattackModule(type);
                          if (success) setTimeout(() => saveGame(), 100);
                          else Alert.alert('작동 실패', '자원이 부족합니다.');
                        }}
                      >
                        <Text style={styles.toggleBtnText}>
                          {isActive ? 'ON' : 'OFF'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* 개발자 테스트 패널 (아래쪽에 가볍게 일렬로 배치) */}
          <View style={styles.devCheatRow}>
            <TouchableOpacity style={styles.cheatBtn} onPress={() => { cheatCredits(10000); setTimeout(() => saveGame(), 100); }}>
              <Text style={styles.cheatBtnText}>+10,000 Cr</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cheatBtn} onPress={() => { cheatNanocores(100); setTimeout(() => saveGame(), 100); }}>
              <Text style={styles.cheatBtnText}>+100 Nano</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cheatBtn} onPress={() => { cheatTimeParticles(1000); setTimeout(() => saveGame(), 100); }}>
              <Text style={styles.cheatBtnText}>+1,000 TP</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cheatBtn} onPress={() => { cheatTimeMachineMax(); setTimeout(() => saveGame(), 100); }}>
              <Text style={styles.cheatBtnText}>Gauge Max</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cheatBtn} onPress={() => { cheatAdvanceWaves(5); setTimeout(() => saveGame(), 100); }}>
              <Text style={styles.cheatBtnText}>Wave +5</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cheatBtn} onPress={() => { cheatMaxEnergy(10000); setTimeout(() => saveGame(), 100); }}>
              <Text style={styles.cheatBtnText}>+10,000 W</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.cheatBtn, { backgroundColor: '#c23b3b' }]} onPress={handleResetDb}>
              <Text style={styles.cheatBtnText}>DB 초기화 (전체 초기화)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050814',
  },
  fixedContentContainer: {
    flex: 1,
    flexDirection: 'column',
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  battleCanvasContainer: {
    position: 'relative',
    alignSelf: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#1e305e',
    overflow: 'hidden',
    backgroundColor: '#050814',
  },
  topLeftOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: 6,
  },
  backButtonText: {
    color: '#00f0ff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  titleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowRadius: 4,
  },
  synergyText: {
    fontSize: 10,
    color: '#ffd700',
    marginTop: 2,
    fontWeight: 'bold',
  },
  topRightOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    alignItems: 'flex-end',
    backgroundColor: 'rgba(5, 8, 20, 0.75)',
    padding: 6,
    borderRadius: 6,
    zIndex: 10,
  },
  hpText: {
    color: '#ff5c5c',
    fontSize: 11,
    fontWeight: 'bold',
  },
  shieldText: {
    color: '#5c96ff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  kineticText: {
    color: '#c296ff',
    fontSize: 10,
  },
  bottomLeftOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    gap: 6,
    zIndex: 10,
  },
  miniMockBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#ff8a00',
    borderRadius: 4,
  },
  miniMockText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  controlScroll: {
    flex: 1,
    marginTop: 10,
  },
  controlScrollContent: {
    paddingBottom: 20,
  },
  card: {
    marginTop: 10,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(10, 20, 45, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBarBg: {
    flex: 1,
    height: 10,
    backgroundColor: '#16223f',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00f0ff',
  },
  progressValue: {
    color: '#00f0ff',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 12,
    width: 36,
    textAlign: 'right',
  },
  populationText: {
    color: '#8fa0c4',
    fontSize: 12,
    marginBottom: 12,
  },
  upgradeBtn: {
    padding: 12,
    backgroundColor: '#00f0ff',
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeBtnText: {
    color: '#050814',
    fontSize: 13,
    fontWeight: 'bold',
  },
  completeBadge: {
    padding: 12,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00f0ff',
    alignItems: 'center',
  },
  completeText: {
    color: '#00f0ff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  itemInfo: {
    flex: 1,
    paddingRight: 8,
  },
  itemName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemDesc: {
    color: '#8fa0c4',
    fontSize: 11,
    marginTop: 2,
  },
  buildBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#1e56ff',
    borderRadius: 6,
  },
  buildBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  shipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  counterBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#16223f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnText: {
    color: '#00f0ff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  counterVal: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
  toggleBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  toggleBtnOn: {
    backgroundColor: '#00bfa5',
  },
  toggleBtnOff: {
    backgroundColor: '#16223f',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  toggleBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  tabHeaderWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  tabHeaderRow: {
    flexDirection: 'row',
    paddingBottom: 6,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  tabButtonActive: {
    backgroundColor: '#1e56ff',
  },
  tabButtonText: {
    color: '#8fa0c4',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tabButtonTextActive: {
    color: '#ffffff',
  },
  subTitleText: {
    color: '#00f0ff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  sectionHeader: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#00f0ff',
    paddingLeft: 8,
  },
  completeBadgeMini: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#00f0ff',
  },
  completeTextMini: {
    color: '#00f0ff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  shipyardBuildBox: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockActionsRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  mockAttackBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ff8a00',
    borderRadius: 6,
    marginHorizontal: 6,
  },
  mockAttackText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#050814',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ffffff',
    fontSize: 16,
  },
  qolRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  qolItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  qolLabel: {
    color: '#8fa0c4',
    fontSize: 9,
    fontWeight: 'bold',
  },
  qolToggleBtn: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 4,
    minWidth: 64,
    alignItems: 'center',
  },
  toggleOn: {
    backgroundColor: '#00bfa5',
  },
  toggleOff: {
    backgroundColor: '#16223f',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  }
});
