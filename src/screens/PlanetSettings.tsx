import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/UI/Screen';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { RootStackParamList } from '../app/navigation/RootNavigator';

type PlanetSettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PlanetSettings'>;

interface PlanetSettingsScreenProps {
  navigation: PlanetSettingsScreenNavigationProp;
}

export const PlanetSettingsScreen: React.FC<PlanetSettingsScreenProps> = ({ navigation: _navigation }) => {
  const [goalTitle, setGoalTitle] = useState('');
  const [deadline, setDeadline] = useState('');

  const handleSave = () => {
    console.log('Saving settings:', { goalTitle, deadline });
    // Mock save functionality
  };

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Planet Settings</Text>
        <Text style={styles.subtitle}>Configure your planet's goals and timeline</Text>
        
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Goal Title</Text>
            <TextInput
              style={styles.input}
              value={goalTitle}
              onChangeText={setGoalTitle}
              placeholder="Enter your planet's main goal"
              placeholderTextColor={colors.placeholder}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Deadline (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={deadline}
              onChangeText={setDeadline}
              placeholder="2024-12-31"
              placeholderTextColor={colors.placeholder}
              keyboardType="numeric"
            />
          </View>
          
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Save Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: 16,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
