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
          headerTintColor: colors.primary,
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
            title: 'My Planet',
            headerShown: !isTutorial
          }} 
        />
        <Stack.Screen
          name="Civilizations"
          component={CivilizationsScreen}
          options={{ 
            title: 'Civilizations',
          }}
        />
        <Stack.Screen
          name="PlanetSettings"
          component={PlanetSettingsScreen}
          options={{ 
            title: 'Vision',
          }}
        />
        <Stack.Screen
          name="History"
          component={HistoryScreen}
          options={{ 
            title: 'History',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
