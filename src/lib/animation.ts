// Animation control and day/night system
import * as THREE from 'three';
import { PlanetScene } from './three';

// Animation state
let animationInterval: NodeJS.Timeout | null = null;
let isAnimating = false;

// Day/night system state
let dayNightAngle = 0; // Current day/night rotation angle
let cameraAngle = 0; // Current camera viewing angle

// Gesture state management
let isGestureActive = false;

// Global references for scene graph
let spinGroup: THREE.Group | null = null;
let cloudLayer: THREE.Mesh | null = null;

/**
 * Initialize animation system with scene references
 */
export const initializeAnimation = (spinGroupRef: THREE.Group, cloudLayerRef: THREE.Mesh): void => {
  spinGroup = spinGroupRef;
  cloudLayer = cloudLayerRef;
};

/**
 * Start day/night rotation (planet spins, lighting stays fixed)
 */
export const startIdleAnimation = (scene: PlanetScene): void => {
  if (isAnimating) return;
  
  isAnimating = true;
  animationInterval = setInterval(() => {
    if (spinGroup && !isGestureActive) {
      // Update day/night angle (planet rotation) only when not gesturing
      dayNightAngle += 0.01; // Slow rotation (correct direction)
      spinGroup.rotation.y = dayNightAngle;
      
      // Update cloud layer rotation - slower than planet for natural movement
      if (cloudLayer && !isGestureActive) {
        // Cloud layer rotates at 85% of planet speed for more noticeable drift effect
        // Use incremental rotation instead of absolute positioning to avoid jumps
        cloudLayer.rotation.y += 0.01 * 0.85; // Incremental rotation at 85% speed
        
        // Skip cloud day/night updates - keep clouds at constant color
        
        // Add subtle texture animation for cloud movement
        cloudLayer.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            const cloudMaterial = child.material as THREE.MeshBasicMaterial;
            if (cloudMaterial.map) {
              cloudMaterial.map.offset.x += 0.0001; // Very slow texture drift
              cloudMaterial.map.offset.y += 0.00005; // Even slower vertical drift
            }
          }
        });
      }
      
      // Update marker day/night states based on rotation
      updateMarkerDayNightStates(scene);
      
      scene.renderer.render(scene.scene, scene.camera);
      (scene.renderer.getContext() as any).endFrameEXP();
    }
  }, 50); // 20fps for smooth rotation
};

/**
 * Stop idle animation
 */
export const stopIdleAnimation = (): void => {
  isAnimating = false;
  if (animationInterval) {
    clearInterval(animationInterval);
    animationInterval = null;
  }
};

/**
 * Start gesture (pause idle rotation)
 */
export const startGesture = (): void => {
  isGestureActive = true;
};

/**
 * End gesture (resume idle rotation)
 */
export const endGesture = (scene: PlanetScene): void => {
  isGestureActive = false;
  
  // Update marker day/night states immediately after gesture ends
  if (scene) {
    updateMarkerDayNightStates(scene);
  }
  
  // Don't reset cloud position - keep it at current position
  // Cloud will continue rotating from its current position during automatic animation
};

/**
 * Update marker day/night states based on planet rotation
 * Darken markers during night time for more realistic appearance
 */
const updateMarkerDayNightStates = (scene: PlanetScene): void => {
  scene.markers.forEach((marker, civilizationId) => {
    // Get marker position in world coordinates
    const worldPosition = new THREE.Vector3();
    marker.getWorldPosition(worldPosition);
    
    // Calculate if marker is in day or night based on its position
    // Sun light comes from (25, 0, 8) direction
    // Calculate dot product with sun direction for accurate day/night
    const sunDirection = new THREE.Vector3(25, 0, 8).normalize();
    const markerDirection = worldPosition.normalize();
    const dotProduct = markerDirection.dot(sunDirection);
    
    // Smooth transition between day and night (0.0 = full night, 1.0 = full day)
    // Use a much smoother curve for gradual transition
    const rawRatio = (dotProduct + 0.5) / 1.0; // Wider transition range (-0.5 to 0.5)
    const clampedRatio = Math.max(0, Math.min(1, rawRatio));
    
    // Apply smooth curve (ease-in-out) for more natural transition
    const dayNightRatio = clampedRatio * clampedRatio * (3 - 2 * clampedRatio); // Smoothstep function
    
    const material = marker.material as THREE.MeshStandardMaterial;
    
    // Smooth interpolation between day and night values
    const dayEmissive = 0.2;
    const nightEmissive = 0.03; // Much dimmer at night
    const dayOpacity = 1.0;
    const nightOpacity = 0.4; // More transparent at night for darker appearance
    
    material.emissiveIntensity = nightEmissive + (dayEmissive - nightEmissive) * dayNightRatio;
    material.opacity = nightOpacity + (dayOpacity - nightOpacity) * dayNightRatio;
  });
  
  // Update equator ring gradient based on planet rotation
  updateEquatorGradient(scene);
};

/**
 * Update equator ring gradient to show day/night transition
 */
const updateEquatorGradient = (scene: PlanetScene): void => {
  // Find the equator ring
  let equatorRing: THREE.Mesh | null = null;
  scene.scene.traverse((object) => {
    if (object instanceof THREE.Mesh && object.userData.isEquatorRing) {
      equatorRing = object as THREE.Mesh;
    }
  });
  
  if (!equatorRing) return;
  
  // Calculate current day/night angle
  const sunDirection = new THREE.Vector3(25, 0, 8).normalize();
  
  // Create gradient effect by adjusting opacity based on position
  const material = (equatorRing as THREE.Mesh).material as THREE.MeshBasicMaterial;
  
  // Simple gradient effect - brighter on day side, much dimmer on night side
  // This is a simplified approach; for more complex gradients, we'd need custom shaders
  const currentRotation = dayNightAngle;
  const gradientIntensity = Math.sin(currentRotation) * 0.3 + 0.7; // 0.4 to 1.0
  material.opacity = 0.1 + gradientIntensity * 0.4; // 0.1 to 0.5 (much darker at night)
};

/**
 * Rotate camera around planet (viewpoint switching)
 * This changes what part of the planet we're looking at
 */
export const rotatePlanet = (
  scene: PlanetScene,
  deltaX: number,
  deltaY: number,
  sensitivity: number = 0.005
): void => {
  // Apply rotation to spin group for intuitive XYZ rotation
  if (spinGroup) {
    // Horizontal swipe (deltaX) rotates around Y-axis (correct direction)
    const yRotation = deltaX * sensitivity; // Correct direction
    spinGroup.rotation.y += yRotation;
    
    // Update day/night angle to match current rotation
    dayNightAngle = spinGroup.rotation.y;
    
    // Stop cloud layer rotation during manual gestures
    // Keep cloud layer at its current position
    if (cloudLayer) {
      // Don't update cloud rotation or day/night states during manual rotation
      // Cloud layer stays fixed relative to the scene
    }
    
    // Vertical swipe (deltaY) rotates around X-axis (correct direction)
    spinGroup.rotation.x += deltaY * sensitivity; // Correct direction
  }
};

/**
 * Apply camera zoom
 */
export const zoomPlanet = (scene: PlanetScene, scale: number): void => {
  const CAMERA_MIN_DISTANCE = 2.0;
  const CAMERA_MAX_DISTANCE = 7.0;
  
  const distance = scene.camera.position.length();
  const newDistance = Math.max(
    CAMERA_MIN_DISTANCE,
    Math.min(CAMERA_MAX_DISTANCE, distance * scale)
  );
  
  scene.camera.position.normalize().multiplyScalar(newDistance);
  scene.camera.lookAt(0, 0, 0);
};

/**
 * Get current day/night angle
 */
export const getDayNightAngle = (): number => {
  return dayNightAngle;
};

/**
 * Set day/night angle (for external control)
 */
export const setDayNightAngle = (angle: number): void => {
  dayNightAngle = angle;
  if (spinGroup) {
    spinGroup.rotation.y = angle;
  }
};
