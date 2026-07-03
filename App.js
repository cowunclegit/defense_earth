import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Platform, AppState, Text } from 'react-native';

if (Platform.OS === 'web') {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (
      args[0] &&
      typeof args[0] === 'string' &&
      (args[0].includes('style props are deprecated') ||
       args[0].includes('pointerEvents is deprecated'))
    ) {
      return;
    }
    originalWarn(...args);
  };
}

import { useGameStore } from './src/store/gameStore';
import SolarSystemScreen from './src/screens/SolarSystemScreen';
import PlanetDetailScreen from './src/screens/PlanetDetailScreen';
import ChronosLabScreen from './src/screens/ChronosLabScreen';
import AIPlaytestScreen from './src/screens/AIPlaytestScreen';
import CustomAlert from './src/components/CustomAlert';

// Web에서 Skia (CanvasKit WASM) 초기화
let skiaWebReady = Platform.OS !== 'web'; // native는 항상 true
if (Platform.OS === 'web') {
  import('@shopify/react-native-skia/web').then(({ LoadSkiaWeb }) => {
    LoadSkiaWeb().then(() => {
      skiaWebReady = true;
    });
  });
}


const Stack = createNativeStackNavigator();

export default function App() {
  const tick = useGameStore((state) => state.tick);
  const saveGame = useGameStore((state) => state.saveGame);
  const loadGame = useGameStore((state) => state.loadGame);
  const appStateRef = useRef(AppState.currentState);
  const [skiaReady, setSkiaReady] = useState(skiaWebReady);

  // 웹: Skia WASM 로딩 대기
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (skiaWebReady) { setSkiaReady(true); return; }
    const interval = setInterval(() => {
      if (skiaWebReady) {
        setSkiaReady(true);
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // 앱 시작 시 저장 데이터 로드
  useEffect(() => {
    loadGame();
  }, []);

  // 앱이 백그라운드로 전환될 때 자동 저장
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appStateRef.current === 'active' &&
        (nextAppState === 'background' || nextAppState === 'inactive')
      ) {
        saveGame();
      }
      appStateRef.current = nextAppState;
    });
    return () => subscription.remove();
  }, [saveGame]);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.useGameStore = useGameStore;
    }

    let lastTime = Date.now();
    let frameId;

    const loop = () => {
      const now = Date.now();
      const deltaTime = (now - lastTime) / 1000;
      lastTime = now;

      // 델타 타임 제한 (백그라운드 활성화 시 순간적인 자원 대폭 수급 및 버그 방지)
      const clampedDelta = Math.min(deltaTime, 0.1);
      tick(clampedDelta);

      // 개발용 User Timing API (PerformanceMeasure) 누적 해제
      if (
        typeof performance !== 'undefined' &&
        typeof performance.clearMarks === 'function' &&
        typeof performance.clearMeasures === 'function'
      ) {
        performance.clearMarks();
        performance.clearMeasures();
      }

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [tick]);

  // 웹에서 Skia WASM 로딩 중일 때 로딩 화면 표시
  if (Platform.OS === 'web' && !skiaReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a1a', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#00f0ff', fontSize: 18 }}>🚀 Defense Earth 로딩 중...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator
          initialRouteName="PlanetDetail"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen 
            name="PlanetDetail" 
            component={PlanetDetailScreen} 
          />
          <Stack.Screen 
            name="SolarSystem" 
            component={SolarSystemScreen} 
          />
          <Stack.Screen 
            name="ChronosLab" 
            component={ChronosLabScreen} 
          />
          <Stack.Screen 
            name="AIPlaytest" 
            component={AIPlaytestScreen} 
          />
        </Stack.Navigator>
      </NavigationContainer>
      <CustomAlert />
    </View>
  );
}
