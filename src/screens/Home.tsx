import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import {
  PanGestureHandler,
  PinchGestureHandler,
  TapGestureHandler,
  State,
} from 'react-native-gesture-handler';
import { GLView } from 'expo-gl';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/UI/Screen';
import { Toast, ToastType } from '../components/UI/Toast';
import { Icon } from '../components/UI/Icon';
import { CivilizationBottomSheet } from '../components/CivilizationBottomSheet';
import { useAppStore } from '../stores';
import { Civilization } from '../types';
import {
  PlanetScene,
  createPlanetScene,
  updateCivilizationMarkers,
  rotatePlanet,
  zoomPlanet,
  detectMarkerHit,
  renderScene,
  resizeScene,
  disposeScene,
  startIdleAnimation,
  startGesture,
  endGesture,
} from '../lib/three';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { ui } from '../theme/ui';
import { createAnimation } from '../theme/animations';
import { RootStackParamList } from '../navigation/navigation/RootNavigator';
import { strings } from '../i18n/strings';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { civilizations, planetGoal, logProgress, deriveCivStates } = useAppStore();
  
  const [scene, setScene] = useState<PlanetScene | null>(null);
  const [selectedCivilization, setSelectedCivilization] = useState<Civilization | null>(null);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [progressLoading, setProgressLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'info',
  });
  const [viewDimensions, setViewDimensions] = useState({ width: 0, height: 0 });
  const [showFirstCivilizationHint, setShowFirstCivilizationHint] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0); // 0 = World Intro, 1 = Planet Tutorial

  // Animation values
  const titleScale = useRef(new Animated.Value(0.8)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const planetIconScale = useRef(new Animated.Value(0.5)).current;

  // Tutorial mode detection
  const isTutorial = !planetGoal || !planetGoal.title || !planetGoal.deadline;

  // Refs for gesture handling
  const lastPanRef = useRef({ x: 0, y: 0 });
  const lastScaleRef = useRef(1);

  // Derive states when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      deriveCivStates();
      
      // Set tutorial step based on goal status
      if (planetGoal && planetGoal.title && planetGoal.deadline) {
        // Goal is set, skip tutorial and show normal screen
        setTutorialStep(-1); // -1 means tutorial is complete
      } else {
        // No goal set, start from Step 0
        setTutorialStep(0);
      }
      
      // Check if we should show first civilization hint
      // (goal is set but no civilizations exist)
      if (planetGoal && planetGoal.title && planetGoal.deadline && civilizations.length === 0) {
        setShowFirstCivilizationHint(true);
      } else {
        setShowFirstCivilizationHint(false);
      }
      
      // Start entrance animations
      Animated.parallel([
        createAnimation('growth', titleScale),
        createAnimation('fadeIn', subtitleOpacity),
        createAnimation('growth', planetIconScale),
      ]).start();
    }, [deriveCivStates, titleScale, subtitleOpacity, planetIconScale, planetGoal, civilizations.length])
  );

  // Update markers when civilizations change
  useEffect(() => {
    if (scene && civilizations) {
      updateCivilizationMarkers(scene, civilizations);
      renderScene(scene);
    }
  }, [scene, civilizations]);

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  const handleContextCreate = (gl: any) => {
    try {
      const newScene = createPlanetScene(gl);
      setScene(newScene);
      
      // Start idle animation after a delay
      setTimeout(() => {
        startIdleAnimation(newScene);
      }, 1000);
      
      // Initial render
      renderScene(newScene);
    } catch (error) {
      console.error('Failed to create 3D scene:', error);
      showToast('3D惑星ビューを読み込めませんでした。アプリを再起動してください。', 'error');
    }
  };

  const handleResize = (width: number, height: number) => {
    setViewDimensions({ width, height });
    if (scene) {
      resizeScene(scene, width, height);
      renderScene(scene);
    }
  };

  const handlePanGestureEvent = (event: any) => {
    if (!scene) return;

    const { translationX, translationY } = event.nativeEvent;
    const deltaX = translationX - lastPanRef.current.x;
    const deltaY = translationY - lastPanRef.current.y;

    rotatePlanet(scene, deltaX, deltaY);
    renderScene(scene);

    lastPanRef.current = { x: translationX, y: translationY };
  };

  const handlePanStateChange = (event: any) => {
    if (event.nativeEvent.state === State.BEGAN) {
      lastPanRef.current = { x: 0, y: 0 };
      startGesture(); // Start gesture - pause idle rotation
    } else if (event.nativeEvent.state === State.END || event.nativeEvent.state === State.CANCELLED) {
      if (scene) endGesture(scene); // End gesture - resume idle rotation
    }
  };

  const handlePinchGestureEvent = (event: any) => {
    if (!scene) return;

    const { scale } = event.nativeEvent;
    const deltaScale = scale / lastScaleRef.current;

    zoomPlanet(scene, 1 / deltaScale); // Invert for intuitive zoom
    renderScene(scene);

    lastScaleRef.current = scale;
  };

  const handlePinchStateChange = (event: any) => {
    if (event.nativeEvent.state === State.BEGAN) {
      lastScaleRef.current = 1;
      startGesture(); // Start gesture - pause idle rotation
    } else if (event.nativeEvent.state === State.END || event.nativeEvent.state === State.CANCELLED) {
      if (scene) endGesture(scene); // End gesture - resume idle rotation
    }
  };

  const handleTapGestureEvent = (event: any) => {
    if (!scene || viewDimensions.width === 0) return;

    const { x, y } = event.nativeEvent;
    
    const hitCivilizationId = detectMarkerHit(
      scene, 
      x, 
      y, 
      viewDimensions.width, 
      viewDimensions.height
    );
    
    if (hitCivilizationId) {
      const civilization = civilizations.find(civ => civ.id === hitCivilizationId);
      if (civilization) {
        setSelectedCivilization(civilization);
        setBottomSheetVisible(true);
      }
    }
  };

  const handleRecordProgress = async (civilization: Civilization) => {
    setProgressLoading(true);
    try {
      await logProgress(civilization.id);
      showToast(strings.messages.progressLogged, 'success');
      
      // Update the scene markers after progress is recorded
      if (scene) {
        // Derive states again to get updated state
        deriveCivStates();
      }
    } catch (error) {
      console.error('Failed to record progress:', error);
      showToast(strings.messages.progressFailed, 'error');
    } finally {
      setProgressLoading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scene) {
        disposeScene(scene);
      }
    };
  }, [scene]);

  return (
    <Screen padding={false}>
      <View style={styles.container}>
        {isTutorial && tutorialStep >= 0 ? (
          tutorialStep === 0 ? (
            // Step 0: World Intro Screen
            <View style={styles.tutorialContainer}>
              <Animated.View 
                style={[
                  styles.tutorialIconContainer,
                  { transform: [{ scale: planetIconScale }] }
                ]}
              >
                <Icon name="planet" size={96} color={colors.primary} />
              </Animated.View>
              
              <Animated.Text 
                style={[
                  styles.tutorialTitle,
                  { transform: [{ scale: titleScale }] }
                ]}
              >
                {strings.intro.title}
              </Animated.Text>
              
              <Animated.Text 
                style={[
                  styles.tutorialSubtitle,
                  { opacity: subtitleOpacity }
                ]}
              >
                {strings.intro.narrative}
              </Animated.Text>
              
              <TouchableOpacity 
                style={styles.tutorialCTA}
                onPress={() => setTutorialStep(1)}
              >
                <Text style={styles.tutorialCTAText}>{strings.intro.cta}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Step 1: Planet Tutorial Screen
            <View style={styles.tutorialContainer}>
              <Animated.View 
                style={[
                  styles.tutorialIconContainer,
                  { transform: [{ scale: planetIconScale }] }
                ]}
              >
                <Icon name="planet" size="xxl" color={colors.secondary} />
              </Animated.View>
              
              <Animated.Text 
                style={[
                  styles.tutorialTitle,
                  { transform: [{ scale: titleScale }] }
                ]}
              >
                {strings.tutorial.title}
              </Animated.Text>
              
              <Animated.Text 
                style={[
                  styles.tutorialSubtitle,
                  { opacity: subtitleOpacity }
                ]}
              >
                星のビジョンを保存すると、挑戦（最大10件）を登録できます。
              </Animated.Text>
              
              <TouchableOpacity 
                style={styles.tutorialCTA}
                onPress={() => navigation.navigate('PlanetSettings')}
              >
                <Text style={styles.tutorialCTAText}>{strings.tutorial.cta}</Text>
              </TouchableOpacity>
              
              {strings.tutorial.helper && (
                <Animated.Text 
                  style={[
                    styles.tutorialHelper,
                    { opacity: subtitleOpacity }
                  ]}
                >
                  {strings.tutorial.helper}
                </Animated.Text>
              )}
            </View>
          )
        ) : showFirstCivilizationHint ? (
          <View style={styles.hintContainer}>
            <Animated.View 
              style={[
                styles.hintIconContainer,
                { transform: [{ scale: planetIconScale }] }
              ]}
            >
              <Icon name="civilizations" size="xxl" color={colors.primary} />
            </Animated.View>
            
            <Animated.Text 
              style={[
                styles.hintTitle,
                { transform: [{ scale: titleScale }] }
              ]}
            >
              {strings.screens.home.hintTitle}
            </Animated.Text>
            
            <TouchableOpacity 
              style={styles.hintCTA}
              onPress={() => navigation.navigate('Civilizations')}
            >
              <Text style={styles.hintCTAText}>{strings.screens.home.hintCta}</Text>
            </TouchableOpacity>
          </View>
        ) : civilizations.length === 0 ? (
          <View style={styles.emptyState}>
            <Animated.View 
              style={[
                styles.planetIconContainer,
                { transform: [{ scale: planetIconScale }] }
              ]}
            >
              <Icon name="planet" size="xxl" color={colors.primary} />
            </Animated.View>
            <Animated.Text 
              style={[
                styles.emptyTitle,
                { transform: [{ scale: titleScale }] }
              ]}
            >
              星のビジョンが待っています
            </Animated.Text>
            <Animated.Text 
              style={[
                styles.emptySubtitle,
                { opacity: subtitleOpacity }
              ]}
            >
              星のビジョンは生命の準備ができています！最初の挑戦を作成すると、表面に光るマーカーとして表示されます。回転やズームで世界を探索できます。
            </Animated.Text>
          </View>
        ) : (
          <View style={styles.mainContent}>
            {/* Header with navigation */}
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.headerLeft}
                onPress={() => navigation.navigate('PlanetSettings')}
              >
                <Icon name="planet" size="md" color={colors.primary} />
                <Text style={styles.headerTitle}>星のビジョン</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.headerRight}
                onPress={() => navigation.navigate('Civilizations')}
              >
                <Icon name="civilizations" size="md" color={colors.primary} />
                <Text style={styles.headerTitle}>挑戦</Text>
                <View style={styles.civilizationCount}>
                  <Text style={styles.countText}>{civilizations.length}</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* 3D Planet View with gesture handlers */}
            <TapGestureHandler onGestureEvent={handleTapGestureEvent}>
              <PinchGestureHandler
                onGestureEvent={handlePinchGestureEvent}
                onHandlerStateChange={handlePinchStateChange}
              >
                <PanGestureHandler
                  onGestureEvent={handlePanGestureEvent}
                  onHandlerStateChange={handlePanStateChange}
                >
                  <GLView
                    style={styles.glView}
                    onContextCreate={handleContextCreate}
                    onLayout={(event) => {
                      const { width, height } = event.nativeEvent.layout;
                      handleResize(width, height);
                    }}
                  />
                </PanGestureHandler>
              </PinchGestureHandler>
            </TapGestureHandler>
          </View>
        )}

        <CivilizationBottomSheet
          visible={bottomSheetVisible}
          civilization={selectedCivilization}
          onClose={() => setBottomSheetVisible(false)}
          onRecordProgress={handleRecordProgress}
          loading={progressLoading}
        />

        <Toast {...toast} onHide={hideToast} />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  glView: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background,
  },
  planetIconContainer: {
    marginBottom: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...typography.heading,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  tutorialContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    backgroundColor: colors.background,
    width: '100%',
  },
  tutorialIconContainer: {
    marginBottom: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  tutorialTitle: {
    ...typography.heading,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xl,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    maxWidth: 320,
    lineHeight: 32,
  },
  tutorialSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    letterSpacing: 0.3,
    maxWidth: 320,
  },
  tutorialCTA: {
    ...ui.button.primary,
    width: '100%',
    maxWidth: 280,
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 28,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  tutorialCTAText: {
    ...typography.subheading,
    color: colors.background,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  tutorialHelper: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
    opacity: 0.8,
  },
  hintContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background,
  },
  hintIconContainer: {
    marginBottom: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  hintTitle: {
    ...typography.heading,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  hintCTA: {
    ...ui.button.primary,
    width: '100%',
  },
  hintCTAText: {
    ...typography.subheading,
    color: colors.background,
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.subheading,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  civilizationCount: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    marginLeft: spacing.sm,
  },
  countText: {
    ...typography.caption,
    color: colors.background,
    fontWeight: '600',
  },
});
