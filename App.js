import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

import { useGameStore } from './src/store/gameStore';
import SolarSystemScreen from './src/screens/SolarSystemScreen';
import PlanetDetailScreen from './src/screens/PlanetDetailScreen';
import ChronosLabScreen from './src/screens/ChronosLabScreen';

const Tab = createBottomTabNavigator();

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
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#00f0ff',
          tabBarInactiveTintColor: '#8fa0c4',
          tabBarStyle: {
            backgroundColor: '#0c1328',
            borderTopWidth: 1.5,
            borderTopColor: '#1e305e',
            height: 52,
            paddingBottom: 4,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: 'bold',
          }
        }}
      >
        <Tab.Screen 
          name="SolarSystem" 
          component={SolarSystemScreen} 
          options={{
            title: '성계도',
          }}
        />
        <Tab.Screen 
          name="PlanetDetail" 
          component={PlanetDetailScreen} 
          options={{
            title: '행성 관리',
          }}
        />
        <Tab.Screen 
          name="ChronosLab" 
          component={ChronosLabScreen} 
          options={{
            title: '시간 연구소',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
