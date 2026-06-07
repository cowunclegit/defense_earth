import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

import { useGameStore } from './src/store/gameStore';
import SolarSystemScreen from './src/screens/SolarSystemScreen';
import PlanetDetailScreen from './src/screens/PlanetDetailScreen';
import ChronosLabScreen from './src/screens/ChronosLabScreen';
import CustomAlert from './src/components/CustomAlert';

const Stack = createNativeStackNavigator();

export default function App() {
  const tick = useGameStore((state) => state.tick);

  // 글로벌 시뮬레이션 게임 루프 (매 프레임 갱신)
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
        </Stack.Navigator>
      </NavigationContainer>
      <CustomAlert />
    </View>
  );
}
