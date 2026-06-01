import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { PLANETARY_DATA } from '../constants/planetaryData';
import TopHud from '../components/TopHud';

export default function SolarSystemScreen({ navigation }) {
  const { planets, currentWave, unlockPlanet } = useGameStore();

  const handlePlanetPress = (planetId, isUnlocked) => {
    if (isUnlocked) {
      navigation.navigate('PlanetDetail', { planetId });
    } else {
      // 해금 시도
      unlockPlanet(planetId);
    }
  };

  return (
    <View style={styles.container}>
      <TopHud />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>태양계 관제 센터</Text>
          <Text style={styles.subtitle}>태양계 방어선 구축 및 테라포밍 상태</Text>
        </View>

        {/* 행성 궤도 맵 (간이 시각화) */}
        <View style={styles.orbitContainer}>
          <View style={styles.sun} />
          {Object.keys(PLANETARY_DATA).map((planetId, index) => {
            const planetData = PLANETARY_DATA[planetId];
            const planetState = planets[planetId];
            const isUnlocked = planetState.unlocked;
            const meetsRequirement = currentWave >= planetData.unlockWave;

            return (
              <TouchableOpacity
                key={planetId}
                style={[
                  styles.planetNode,
                  isUnlocked ? styles.unlockedPlanet : styles.lockedPlanet,
                  { top: 50 + index * 45 }
                ]}
                onPress={() => handlePlanetPress(planetId, isUnlocked)}
                activeOpacity={0.7}
              >
                <View style={styles.planetBadge}>
                  <Text style={styles.planetIndex}>{index + 1}</Text>
                </View>
                <View style={styles.planetInfo}>
                  <Text style={styles.planetName}>{planetData.name}</Text>
                  <Text style={styles.planetStatus}>
                    {isUnlocked 
                      ? `테라포밍 ${planetState.terraformProgress}% | 인구: ${planetState.population.toLocaleString()}명` 
                      : meetsRequirement 
                        ? '해금 가능 (터치하여 개척)' 
                        : `웨이브 ${planetData.unlockWave} 돌파 시 해금`}
                  </Text>
                </View>
                {isUnlocked && (
                  <View style={styles.activeSynergy}>
                    <Text style={styles.synergyText}>
                      {planetState.terraformProgress >= 80 ? '시너지 활성' : '시너지 대기'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
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
    marginTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00f0ff',
    textShadowColor: 'rgba(0, 240, 255, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 13,
    color: '#8fa0c4',
    marginTop: 4,
  },
  orbitContainer: {
    paddingHorizontal: 20,
    minHeight: 550,
    position: 'relative',
  },
  sun: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffaa00',
    position: 'absolute',
    left: '50%',
    marginLeft: -30,
    top: -10,
    shadowColor: '#ffaa00',
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  planetNode: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginVertical: 6,
    backgroundColor: 'rgba(10, 20, 45, 0.6)',
  },
  unlockedPlanet: {
    borderColor: 'rgba(0, 240, 255, 0.3)',
  },
  lockedPlanet: {
    borderColor: 'rgba(255, 255, 255, 0.08)',
    opacity: 0.6,
  },
  planetBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#16223f',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  planetIndex: {
    color: '#00f0ff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planetInfo: {
    flex: 1,
  },
  planetName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  planetStatus: {
    color: '#8fa0c4',
    fontSize: 12,
    marginTop: 2,
  },
  activeSynergy: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderWidth: 0.5,
    borderColor: '#00f0ff',
  },
  synergyText: {
    color: '#00f0ff',
    fontSize: 9,
    fontWeight: 'bold',
  }
});
