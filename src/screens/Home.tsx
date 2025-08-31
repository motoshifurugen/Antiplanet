import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
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
} from '../lib/three';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { ui } from '../theme/ui';
import { animations, createAnimation } from '../theme/animations';
import { iconSizes } from '../theme/icons';
import { RootStackParamList } from '../navigation/navigation/RootNavigator';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation: _navigation }) => {
  const { civilizations, logProgress, deriveCivStates } = useAppStore();
  
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

  // Animation values
  const titleScale = useRef(new Animated.Value(0.8)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const planetIconScale = useRef(new Animated.Value(0.5)).current;

  // Refs for gesture handling
  const lastPanRef = useRef({ x: 0, y: 0 });
  const lastScaleRef = useRef(1);

  // Derive states when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      deriveCivStates();
      
      // Start entrance animations
      Animated.parallel([
        createAnimation('growth', titleScale),
        createAnimation('fadeIn', subtitleOpacity),
        createAnimation('growth', planetIconScale),
      ]).start();
    }, [deriveCivStates, titleScale, subtitleOpacity, planetIconScale])
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
      showToast(`${civilization.name}の進捗を記録しました`, 'success');
      
      // Update the scene markers after progress is recorded
      if (scene) {
        // Derive states again to get updated state
        deriveCivStates();
      }
    } catch (error) {
      console.error('Failed to record progress:', error);
      showToast('進捗を記録できませんでした。接続を確認して再試行してください。', 'error');
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
        {civilizations.length === 0 ? (
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
              惑星が待っています
            </Animated.Text>
            <Animated.Text 
              style={[
                styles.emptySubtitle,
                { opacity: subtitleOpacity }
              ]}
            >
              惑星は生命の準備ができています！最初の文明を作成すると、表面に光るマーカーとして表示されます。回転やズームで世界を探索できます。
            </Animated.Text>
          </View>
        ) : (
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
});
