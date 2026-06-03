import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

export default function CanvasControls({ zoom, setZoom, resetZoomPan }) {
  return (
    <View style={styles.hudContainer}>
      <Text style={styles.hudZoomText}>{Math.round(zoom * 100)}%</Text>
      <TouchableOpacity style={styles.hudBtn} onPress={() => setZoom(z => Math.min(3.0, z + 0.15))}>
        <Text style={styles.hudText}>➕</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.hudBtn} onPress={() => setZoom(z => Math.max(0.3, z - 0.15))}>
        <Text style={styles.hudText}>➖</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.hudBtn} onPress={resetZoomPan}>
        <Text style={styles.hudText}>🔄</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  hudContainer: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 8, 20, 0.85)',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#1e305e',
    padding: 6,
    gap: 8,
    zIndex: 999,
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
  }
});
