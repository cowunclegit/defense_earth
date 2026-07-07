import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { 
  useGameStore,
  SATELLITE_SPECS,
  SHIELD_MODULE_SPECS,
  getOrderedBuiltSatellites
} from '../../store/gameStore';

export default function CanvasControls({ zoom, setZoom, resetZoomPan, purchaseMultiplier, onToggleMultiplier }) {
  const overloadEnergy = useGameStore(state => state.overloadEnergy);
  const overloadMaxEnergy = useGameStore(state => state.overloadMaxEnergy);
  const isPowerOffline = useGameStore(state => state.isPowerOffline);
  const onlineSatelliteCount = useGameStore(state => state.onlineSatelliteCount);
  const planets = useGameStore(state => state.planets);
  const shieldModule = useGameStore(state => state.shieldModule);
  const counterattackModules = useGameStore(state => state.counterattackModules);
  const synergies = useGameStore(state => state.synergies);

  const isPowerDischarged = (overloadEnergy || 0) <= 0;

  // Calculate power values
  const builtSats = getOrderedBuiltSatellites(planets || {});
  const activeLimit = isPowerOffline ? (onlineSatelliteCount || 0) : builtSats.length;

  const activeSatsMap = {};
  Object.keys(planets || {}).forEach(pId => {
    activeSatsMap[pId] = {};
  });

  for (let i = 0; i < Math.min(activeLimit, builtSats.length); i++) {
    const sat = builtSats[i];
    if (sat && activeSatsMap[sat.planetId]) {
      if (!activeSatsMap[sat.planetId][sat.type]) {
        activeSatsMap[sat.planetId][sat.type] = 0;
      }
      activeSatsMap[sat.planetId][sat.type]++;
    }
  }

  let baseProdRate = 15;
  Object.keys(planets || {}).forEach((pId) => {
    const p = planets[pId];
    if (p && p.unlocked) {
      const infra = p.infrastructure || {};
      baseProdRate += (infra.powerPlant || 0) * 20;
    }
  });
  const productionPower = Math.floor(baseProdRate * (synergies?.energyProductionMultiplier || 1.0));
  const shieldConsumption = SHIELD_MODULE_SPECS[shieldModule || 'basic']?.energyCost || 0;
  
  let counterattackConsumption = 0;
  if (counterattackModules?.reflector) counterattackConsumption += 10;
  if (counterattackModules?.discharge) counterattackConsumption += 10;
  if (counterattackModules?.electricField) counterattackConsumption += 15;
  
  let satelliteConsumption = 0;
  Object.keys(activeSatsMap || {}).forEach((pId) => {
    Object.keys(activeSatsMap[pId] || {}).forEach((satType) => {
      const count = activeSatsMap[pId][satType] || 0;
      const satSpec = SATELLITE_SPECS[satType];
      if (satSpec && count > 0) {
        satelliteConsumption += count * satSpec.energy;
      }
    });
  });
  
  const totalConsumption = shieldConsumption + counterattackConsumption + satelliteConsumption;

  return (
    <View style={styles.hudContainer}>
      {/* 가용 전력 컴팩트 게이지 바 */}
      <View style={styles.powerHUD}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
          <Text style={{ fontSize: 8, color: '#ffd700', fontWeight: 'bold' }}>⚡ 가용 전력</Text>
          <Text style={{ fontSize: 8, color: '#ffd700', fontWeight: 'bold', fontFamily: 'monospace' }}>
            {isPowerDischarged ? '방전' : `${Math.floor(overloadEnergy)}TW`}
          </Text>
        </View>
        <View style={styles.miniBar}>
          <View 
            style={[
              styles.miniBarFill, 
              { 
                width: `${Math.min(100, Math.max(0, (overloadEnergy / (overloadMaxEnergy || 100)) * 100))}%`,
                backgroundColor: isPowerDischarged ? '#ff3b30' : '#ffd700'
              }
            ]} 
          />
        </View>
        <Text style={{ fontSize: 7.5, color: '#8fa0c4', marginTop: 2, fontWeight: 'bold', textAlign: 'center' }}>
          +{productionPower.toFixed(0)} / -{totalConsumption.toFixed(0)} TW
        </Text>
      </View>

      {/* 줌 및 배속 제어 버튼 그룹 */}
      <View style={styles.zoomControlsRow}>
        <Text style={styles.hudZoomText}>{Math.round(zoom * 100)}%</Text>
        <TouchableOpacity style={styles.hudBtn} onPress={() => setZoom(z => Math.min(3.0, z + 0.15))}>
          <Text style={styles.hudText}>➕</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.hudBtn} onPress={() => setZoom(z => Math.max(0.15, z - 0.15))}>
          <Text style={styles.hudText}>➖</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.hudBtn} onPress={resetZoomPan}>
          <Text style={styles.hudText}>🔄</Text>
        </TouchableOpacity>
        {onToggleMultiplier && (
          <TouchableOpacity
            style={[styles.hudBtn, { backgroundColor: purchaseMultiplier > 1 ? '#ff8a00' : '#0a1026', borderColor: '#ff8a00', minWidth: 34 }]}
            onPress={onToggleMultiplier}
          >
            <Text style={[styles.hudText, { color: purchaseMultiplier > 1 ? '#050814' : '#ff8a00', fontSize: 11 }]}>x{purchaseMultiplier}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hudContainer: {
    position: 'absolute',
    bottom: 4,
    left: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(5, 8, 20, 0.9)',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#1e305e',
    padding: 6,
    zIndex: 999,
  },
  zoomControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hudZoomText: {
    color: '#00f0ff',
    fontSize: 12,
    fontWeight: 'bold',
    marginHorizontal: 4,
    minWidth: 40,
    textAlign: 'center',
  },
  hudBtn: {
    width: 28,
    height: 28,
    backgroundColor: '#0a1026',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00f0ff',
  },
  hudText: {
    color: '#00f0ff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  powerHUD: {
    flexDirection: 'column',
    width: 115,
    backgroundColor: 'rgba(255, 215, 0, 0.02)',
    borderWidth: 0.8,
    borderColor: 'rgba(255, 215, 0, 0.15)',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 5,
    marginRight: 4,
  },
  miniBar: {
    height: 4,
    backgroundColor: '#101726',
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniBarFill: {
    height: '100%',
    borderRadius: 2,
  }
});
