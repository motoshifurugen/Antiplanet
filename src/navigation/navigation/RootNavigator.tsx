import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../../screens/Home';
import { CivilizationsScreen } from '../../screens/Civilizations';
import { PlanetSettingsScreen } from '../../screens/PlanetSettings';
import { HistoryScreen } from '../../screens/History';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { Icon } from '../../components/UI/Icon';
import { spacing } from '../../theme/spacing';
import { useAppStore } from '../../stores';

export type RootStackParamList = {
  Home: undefined;
  Civilizations: { selectedCivilizationId?: string } | undefined;
  PlanetSettings: undefined;
  History: { selectedCivilizationId?: string } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { planetGoal } = useAppStore();
  
  // Tutorial mode detection
  const isTutorial = !planetGoal || !planetGoal.title || !planetGoal.deadline;

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            ...typography.subheading,
            color: colors.text,
          },
          headerShadowVisible: true,
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ 
            title: '惑星ビュー',
            headerShown: !isTutorial,
            headerRight: isTutorial ? undefined : () => (
              <Icon name="planet" size="sm" color={colors.text} style={{ marginRight: spacing.md }} />
            ),
          }} 
        />
        <Stack.Screen
          name="Civilizations"
          component={CivilizationsScreen}
          options={{ 
            title: '文明',
            headerRight: () => (
              <Icon name="civilizations" size="sm" color={colors.text} style={{ marginRight: spacing.md }} />
            ),
          }}
        />
        <Stack.Screen
          name="PlanetSettings"
          component={PlanetSettingsScreen}
          options={{ 
            title: '惑星設定',
            headerRight: () => (
              <Icon name="settings" size="sm" color={colors.text} style={{ marginRight: spacing.md }} />
            ),
          }}
        />
        <Stack.Screen
          name="History"
          component={HistoryScreen}
          options={{ 
            title: '進捗履歴',
            headerRight: () => (
              <Icon name="history" size="sm" color={colors.text} style={{ marginRight: spacing.md }} />
            ),
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
