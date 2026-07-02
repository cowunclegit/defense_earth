import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Platform, AppState } from 'react-native';

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

const Stack = createNativeStackNavigator();

export default function App() {
  const tick = useGameStore((state) => state.tick);
  const saveGame = useGameStore((state) => state.saveGame);
  const loadGame = useGameStore((state) => state.loadGame);
  const appStateRef = useRef(AppState.currentState);

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
