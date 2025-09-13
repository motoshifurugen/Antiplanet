import 'react-native-reanimated';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useFonts,
  NotoSansJP_300Light,
  NotoSansJP_400Regular,
  NotoSansJP_500Medium,
  NotoSansJP_700Bold,
} from '@expo-google-fonts/noto-sans-jp';
import { RootNavigator } from './src/navigation/navigation/RootNavigator';
import { useAppStore } from './src/stores';
import { colors } from './src/theme/colors';
import { typography } from './src/theme/typography';

export default function App() {
  const { initializeAuth, loadAll } = useAppStore(state => ({
    initializeAuth: state.initializeAuth,
    loadAll: state.loadAll,
  }));

  const [fontsLoaded] = useFonts({
    NotoSansJP_300Light,
    NotoSansJP_400Regular,
    NotoSansJP_500Medium,
    NotoSansJP_700Bold,
  });

  useEffect(() => {
    // Initialize authentication first, then load data
    const initializeApp = async () => {
      try {
        await initializeAuth();
        await loadAll();
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initializeApp();
  }, [initializeAuth, loadAll]);

  // Show loading screen while fonts are loading
  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.text, ...typography.body }}>フォントを読み込み中...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <RootNavigator />
      </GestureHandlerRootView>
    </>
  );
}
