// Lighting system and night light effects
import * as THREE from 'three';
import { CivState, CivLevel } from '../types';

// Global light reference for rotation
let directionalLight: THREE.DirectionalLight | null = null;

/**
 * Get light intensity based on civilization level
 * Higher level civilizations have stronger lights
 * Balanced to not overwhelm the planet's atmosphere
 */
const getLightIntensityByLevel = (level: CivLevel): number => {
  switch (level) {
    case 'grassland':
      return 0.20; // Moderate light for natural areas (increased for visibility)
    case 'village':
      return 0.35; // Warm light for rural areas (increased for goldenrod)
    case 'town':
      return 0.50; // Bright light for towns (increased for orange vibrancy)
    case 'city':
      return 0.80; // Very bright light for cities (increased for gold brilliance)
    default:
      return 0.20;
  }
};

/**
 * Get light intensity based on civilization state (legacy support)
 * Higher rank civilizations have stronger lights
 * Balanced to not overwhelm the planet's atmosphere
 */
const getLightIntensityByState = (state: CivState): number => {
  switch (state) {
    case 'uninitialized':
      return 0.12; // Very dim light for uninitialized
    case 'developing':
      return 0.45; // Bright but not overwhelming light for developing civilizations
    case 'decaying':
      return 0.25; // Moderate light for decaying civilizations
    case 'ocean':
      return 0.05; // Very dim light for ocean civilizations (shouldn't be visible)
    default:
      return 0.18;
  }
};

/**
 * Get night light color based on civilization level
 * Creates warm, atmospheric lighting for night side
 */
const getNightLightColorByLevel = (level: CivLevel): number => {
  switch (level) {
    case 'grassland':
      return 0x7CFC00; // Bright lime green for natural areas
    case 'village':
      return 0xDAA520; // Warm goldenrod light for rural areas
    case 'town':
      return 0xFF8C00; // Vibrant dark orange light for towns
    case 'city':
      return 0xFFD700; // Bright gold light for cities
    default:
      return 0x7CFC00;
  }
};

/**
 * Get night light color based on civilization state (legacy support)
 * Creates warm, atmospheric lighting for night side
 */
const getNightLightColorByState = (state: CivState): number => {
  switch (state) {
    case 'uninitialized':
      return 0x333355; // Cool blue-white for uninitialized
    case 'developing':
      return 0x888844; // Warm golden light for developing civilizations
    case 'decaying':
      return 0x666633; // Dimmer amber light for decaying civilizations
    case 'ocean':
      return 0x222244; // Very dim blue for ocean civilizations
    default:
      return 0x444466;
  }
};

/**
 * Setup 3-light configuration for realistic planet lighting
 * Mimics Earth-Sun relationship with proper lighting direction
 */
export const setupLights = (scene: THREE.Scene): void => {
  // Ambient light - dark bluish tint for space atmosphere
  const ambientLight = new THREE.AmbientLight(0x1a1a2e, 0.2);
  scene.add(ambientLight);
  
  // Directional light - warm sunlight from front and to the side
  // Positioned to create better day/night ratio when viewed from front
  directionalLight = new THREE.DirectionalLight(0xffd89b, 3.0);
  directionalLight.position.set(25, 0, 8); // Sun from front and to the side (moved closer)
  directionalLight.castShadow = false; // No shadows for performance
  scene.add(directionalLight);
  
  // Hemisphere light - subtle sky/ground color mixing
  // Sky blue from above, darker blue from below
  const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x2c3e50, 0.3);
  scene.add(hemisphereLight);
};

/**
 * Get directional light reference
 */
export const getDirectionalLight = (): THREE.DirectionalLight | null => {
  return directionalLight;
};

/**
 * Update cloud day/night states based on planet rotation
 * Darken clouds during night time for more realistic appearance
 */
export const updateCloudDayNightStates = (cloudLayer: THREE.Mesh): void => {
  // Calculate current day/night angle
  const sunDirection = new THREE.Vector3(25, 0, 8).normalize();
  
  // Calculate cloud layer position relative to sun
  const cloudPosition = new THREE.Vector3();
  cloudLayer.getWorldPosition(cloudPosition);
  
  // Calculate dot product with sun direction for day/night determination
  const cloudDirection = cloudPosition.normalize();
  const dotProduct = cloudDirection.dot(sunDirection);
  
  // Smooth transition between day and night (0.0 = full night, 1.0 = full day)
  const rawRatio = (dotProduct + 0.5) / 1.0; // Wider transition range (-0.5 to 0.5)
  const clampedRatio = Math.max(0, Math.min(1, rawRatio));
  
  // Apply smooth curve (ease-in-out) for more natural transition
  const dayNightRatio = clampedRatio * clampedRatio * (3 - 2 * clampedRatio); // Smoothstep function
  
  // Interpolate between day and night colors
  const dayColor = 0xe8e8e8; // Subdued white for day
  const nightColor = 0x555555; // Much darker gray for night
  
  // Smooth color interpolation
  const dayR = (dayColor >> 16) & 0xff;
  const dayG = (dayColor >> 8) & 0xff;
  const dayB = dayColor & 0xff;
  
  const nightR = (nightColor >> 16) & 0xff;
  const nightG = (nightColor >> 8) & 0xff;
  const nightB = nightColor & 0xff;
  
  const currentR = Math.floor(dayR + (nightR - dayR) * (1 - dayNightRatio));
  const currentG = Math.floor(dayG + (nightG - dayG) * (1 - dayNightRatio));
  const currentB = Math.floor(dayB + (nightB - dayB) * (1 - dayNightRatio));
  
  const currentColor = (currentR << 16) | (currentG << 8) | currentB;
  
  // Update materials for both outer and inner cloud shells
  cloudLayer.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material) {
      const material = child.material as THREE.MeshBasicMaterial;
      material.color.setHex(currentColor);
    }
  });
};
