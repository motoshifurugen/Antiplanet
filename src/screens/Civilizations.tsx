import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/UI/Screen';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { RootStackParamList } from '../app/navigation/RootNavigator';

type CivilizationsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Civilizations'
>;

interface CivilizationsScreenProps {
  navigation: CivilizationsScreenNavigationProp;
}

// Mock data for civilizations
const mockCivilizations = [
  { id: '1', name: 'Ancient Terra', population: '10,000', status: 'Flourishing' },
  { id: '2', name: 'Neo Babylon', population: '25,000', status: 'Expanding' },
  { id: '3', name: 'Crystal Valley', population: '5,000', status: 'Developing' },
];

export const CivilizationsScreen: React.FC<CivilizationsScreenProps> = ({
  navigation: _navigation,
}) => {
  const handleAddCivilization = () => {
    // No-op for now as specified in requirements
    console.log('Add Civilization pressed');
  };

  const renderCivilization = ({ item }: { item: (typeof mockCivilizations)[0] }) => (
    <View style={styles.civilizationCard}>
      <Text style={styles.civilizationName}>{item.name}</Text>
      <Text style={styles.civilizationDetail}>Population: {item.population}</Text>
      <Text style={styles.civilizationDetail}>Status: {item.status}</Text>
    </View>
  );

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Civilizations</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddCivilization}>
            <Text style={styles.addButtonText}>Add Civilization</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={mockCivilizations}
          renderItem={renderCivilization}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: spacing.lg,
  },
  civilizationCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  civilizationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  civilizationDetail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs / 2,
  },
});
