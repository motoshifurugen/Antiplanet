import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../../screens/Home';
import { CivilizationsScreen } from '../../screens/Civilizations';
import { PlanetSettingsScreen } from '../../screens/PlanetSettings';

export type RootStackParamList = {
  Home: undefined;
  Civilizations: undefined;
  PlanetSettings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Planet View (MVP)' }} />
        <Stack.Screen
          name="Civilizations"
          component={CivilizationsScreen}
          options={{ title: 'Civilizations' }}
        />
        <Stack.Screen
          name="PlanetSettings"
          component={PlanetSettingsScreen}
          options={{ title: 'Planet Settings' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
