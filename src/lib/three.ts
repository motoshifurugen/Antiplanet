// Three.js utilities and scene management for Expo
// 3D planet rendering with civilization markers

import { ExpoWebGLRenderingContext } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
import { Civilization, CivState, CivLevel } from '../types';
import { colors } from '../theme/colors';

export interface PlanetScene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  planet: THREE.Mesh;
  markers: Map<string, THREE.Mesh>;
  raycaster: THREE.Raycaster;
  pointer: THREE.Vector2;
}

export interface CivilizationMarker {
  id: string;
  position: THREE.Vector3;
  mesh: THREE.Mesh;
  civilization: Civilization;
}

// Planet and camera constants
const PLANET_RADIUS = 0.5; // Much smaller planet for better screen fit
const CAMERA_MIN_DISTANCE = 1.2; // Adjusted for much smaller planet
const CAMERA_MAX_DISTANCE = 4.0; // Adjusted for much smaller planet
const CAMERA_INITIAL_DISTANCE = 2.2; // Adjusted for much smaller planet
const EARTH_AXIS_TILT = 15 * Math.PI / 180; // 15 degrees in radians

// Global references for scene graph
let tiltGroup: THREE.Group | null = null;
let spinGroup: THREE.Group | null = null;

// Animation state
let animationInterval: NodeJS.Timeout | null = null;
let isAnimating = false;

// Day/night system state
let dayNightAngle = 0; // Current day/night rotation angle
let cameraAngle = 0; // Current camera viewing angle

// Gesture state management
let isGestureActive = false;

// Global light reference for rotation
let directionalLight: THREE.DirectionalLight | null = null;

/**
 * Start day/night rotation (planet spins, lighting stays fixed)
 */
export const startIdleAnimation = (scene: PlanetScene): void => {
  if (isAnimating) return;
  
  isAnimating = true;
  animationInterval = setInterval(() => {
    if (spinGroup && !isGestureActive) {
      // Update day/night angle (planet rotation) only when not gesturing
      dayNightAngle -= 0.01; // Slow rotation (reversed direction)
      spinGroup.rotation.y = dayNightAngle;
      
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
};

/**
 * Get light intensity based on civilization level
 * Higher level civilizations have stronger lights
 * Balanced to not overwhelm the planet's atmosphere
 */
const getLightIntensityByLevel = (level: CivLevel): number => {
  switch (level) {
    case 'grassland':
      return 0.15; // Very dim light for natural areas
    case 'village':
      return 0.25; // Dim light for rural areas
    case 'town':
      return 0.40; // Moderate light for towns
    case 'city':
      return 0.60; // Bright light for cities
    default:
      return 0.15;
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
      return 0x444466; // Dim blue-white for natural areas
    case 'village':
      return 0x666644; // Warm amber light for rural areas
    case 'town':
      return 0x888844; // Bright golden light for towns
    case 'city':
      return 0xAAAA22; // Very bright golden light for cities
    default:
      return 0x444466;
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
 * Update marker day/night states based on planet rotation
 * Note: Color changes removed - lighting will be handled by building lights separately
 */
const updateMarkerDayNightStates = (scene: PlanetScene): void => {
  scene.markers.forEach((marker, civilizationId) => {
    // Keep consistent appearance regardless of day/night
    // Color changes removed - lighting will be handled by building lights separately
    const material = marker.material as THREE.MeshStandardMaterial;
    
    // Maintain consistent emissive properties
    material.emissiveIntensity = 0.2; // Consistent base emissive intensity
    // Keep original color - no day/night color changes
  });
};

/**
 * Create smooth planet mesh with PBR material
 */
export const createPlanetMesh = (): THREE.Mesh => {
  // Smooth sphere geometry with proper aspect ratio to prevent distortion
  const planetGeometry = new THREE.SphereGeometry(PLANET_RADIUS, 64, 64);
  
  // PBR material with ocean blue base and subtle gradient
  const planetMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a90e2, // Ocean blue base
    metalness: 0, // Non-metallic surface
    roughness: 0.9, // Soft, diffuse surface
    emissive: 0x001122, // Subtle blue glow
    emissiveIntensity: 0.1,
  });
  
  const planet = new THREE.Mesh(planetGeometry, planetMaterial);
  return planet;
};

/**
 * Create atmosphere mesh with subtle gradient glow effect
 */
export const createAtmosphereMesh = (planetRadius: number): THREE.Mesh => {
  // Much larger sphere for wide gradient spread
  const atmosphereRadius = planetRadius * 1.4; // 40% larger for wide gradient
  const atmosphereGeometry = new THREE.SphereGeometry(atmosphereRadius, 20, 12);
  
  // Very subtle material with gradient effect
  const atmosphereMaterial = new THREE.MeshBasicMaterial({
    color: 0x87ceeb, // Light sky blue
    transparent: true,
    opacity: 0.08, // Much more subtle opacity
    side: THREE.BackSide, // Render inside faces for rim effect
    blending: THREE.AdditiveBlending, // Glow effect
  });
  
  const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
  return atmosphere;
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
 * Create and initialize 3D planet scene
 */
export const createPlanetScene = (gl: ExpoWebGLRenderingContext): PlanetScene => {
  // Scene setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e); // Slightly brighter space background

  // Camera setup
  const camera = new THREE.PerspectiveCamera(
    50, // FOV (adjusted for better planet appearance)
    gl.drawingBufferWidth / gl.drawingBufferHeight, // aspect ratio
    0.1, // near
    100 // far
  );
  camera.position.set(0, 0, CAMERA_INITIAL_DISTANCE);

  // Renderer setup with PBR configuration
  const renderer = new Renderer({ gl });
  renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
  renderer.shadowMap.enabled = false; // Keep performance simple
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  
  // Setup lighting
  setupLights(scene);

  // Create scene graph groups
  tiltGroup = new THREE.Group();
  spinGroup = new THREE.Group();
  
  // Apply Earth's axis tilt to tilt group (23.4 degrees)
  // Rotate around Z-axis to tilt rightward instead of forward
  tiltGroup.rotation.z = EARTH_AXIS_TILT;
  
  // Create smooth planet mesh
  const planet = createPlanetMesh();
  
  // Add very subtle white outline to planet
  const outlineGeometry = new THREE.SphereGeometry(PLANET_RADIUS * 1.005, 32, 32);
  const outlineMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.15,
    side: THREE.BackSide,
  });
  const outline = new THREE.Mesh(outlineGeometry, outlineMaterial);
  planet.add(outline);
  
  // Add equator ring for visual rotation cue
  const ringGeometry = new THREE.RingGeometry(PLANET_RADIUS * 0.995, PLANET_RADIUS * 1.005, 32);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
  });
  const equatorRing = new THREE.Mesh(ringGeometry, ringMaterial);
  equatorRing.rotation.x = Math.PI / 2; // Rotate to be horizontal
  
  // Add planet and equator ring to spin group
  spinGroup.add(planet);
  spinGroup.add(equatorRing);
  
  // Add spin group to tilt group
  tiltGroup.add(spinGroup);
  
  // Add tilt group to scene
  scene.add(tiltGroup);

  // Interaction setup
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  return {
    scene,
    camera,
    renderer,
    planet,
    markers: new Map(),
    raycaster,
    pointer,
  };
};

/**
 * Pre-defined regions for civilization placement
 * 30 regions with varied latitude distribution on sphere surface (0° to 50°)
 * Concentrated around equator like human civilizations
 */
const CIVILIZATION_REGIONS = [
  // Northern hemisphere regions (15 regions) - concentrated around equator
  // Region 1-2: High latitude (45-50°N) - fewer regions
  { longitude: 0, latitude: 45 },
  { longitude: 120, latitude: 50 },
  
  // Region 3-5: Mid-high latitude (35-40°N) - moderate regions
  { longitude: 180, latitude: 35 },
  { longitude: 240, latitude: 40 },
  { longitude: 300, latitude: 37 },
  
  // Region 6-8: Mid latitude (25-30°N) - moderate regions
  { longitude: 30, latitude: 25 },
  { longitude: 90, latitude: 30 },
  { longitude: 150, latitude: 27 },
  
  // Region 9-12: Low-mid latitude (15-20°N) - more regions near equator
  { longitude: 210, latitude: 15 },
  { longitude: 270, latitude: 20 },
  { longitude: 330, latitude: 17 },
  { longitude: 45, latitude: 18 },
  
  // Region 13-15: Low latitude (5-10°N) - most regions near equator
  { longitude: 105, latitude: 5 },
  { longitude: 165, latitude: 10 },
  { longitude: 225, latitude: 8 },
  
  // Southern hemisphere regions (15 regions) - concentrated around equator
  // Region 16-17: High latitude (45-50°S) - fewer regions
  { longitude: 285, latitude: -45 },
  { longitude: 345, latitude: -50 },
  
  // Region 18-20: Mid-high latitude (35-40°S) - moderate regions
  { longitude: 15, latitude: -35 },
  { longitude: 75, latitude: -40 },
  { longitude: 135, latitude: -37 },
  
  // Region 21-23: Mid latitude (25-30°S) - moderate regions
  { longitude: 195, latitude: -25 },
  { longitude: 255, latitude: -30 },
  { longitude: 315, latitude: -27 },
  
  // Region 24-27: Low-mid latitude (15-20°S) - more regions near equator
  { longitude: 30, latitude: -15 },
  { longitude: 90, latitude: -20 },
  { longitude: 150, latitude: -17 },
  { longitude: 210, latitude: -18 },
  
  // Region 28-30: Low latitude (5-10°S) - most regions near equator
  { longitude: 270, latitude: -5 },
  { longitude: 330, latitude: -10 },
  { longitude: 60, latitude: -8 },
];

/**
 * Assign a region to a civilization randomly from available regions
 * Uses civilization ID hash for deterministic but random-like assignment
 */
const assignRegionToCivilization = (civilization: Civilization, existingCivilizations: Civilization[]): number => {
  // Create a hash from civilization ID for deterministic assignment
  const hash = civilization.id.split('').reduce((a, b) => {
    // eslint-disable-next-line no-bitwise
    a = ((a << 5) - a) + b.charCodeAt(0);
    // eslint-disable-next-line no-bitwise
    return a & a;
  }, 0);
  
  // Get used regions from existing civilizations
  const usedRegions = new Set<number>();
  existingCivilizations.forEach(civ => {
    const regionIndex = getCivilizationRegionIndex(civ.id);
    if (regionIndex !== -1) {
      usedRegions.add(regionIndex);
    }
  });
  
  // Find available regions
  const availableRegions = [];
  for (let i = 0; i < CIVILIZATION_REGIONS.length; i++) {
    if (!usedRegions.has(i)) {
      availableRegions.push(i);
    }
  }
  
  // If all regions are used, assign based on hash (shouldn't happen with 20 regions and max 10 civilizations)
  if (availableRegions.length === 0) {
    return Math.abs(hash) % CIVILIZATION_REGIONS.length;
  }
  
  // Randomly assign from available regions using hash as seed
  return availableRegions[Math.abs(hash) % availableRegions.length];
};

/**
 * Get the region index for a civilization based on its ID
 * This is used to check which regions are already occupied
 */
const getCivilizationRegionIndex = (civilizationId: string): number => {
  // For sample data, assign regions concentrated around equator like human civilizations
  const sampleRegionMap: Record<string, number> = {
    'sample-civ-1': 13, // Low latitude (5°N) - 持続可能なエネルギー開発
    'sample-civ-2': 28, // Low latitude (5°S) - 海洋環境保護プロジェクト
    'sample-civ-3': 14, // Low latitude (10°N) - 宇宙探査技術革新
    'sample-civ-4': 24, // Low-mid latitude (15°S) - 古代文明の謎解き
    'sample-civ-5': 9, // Low-mid latitude (15°N) - AI倫理ガイドライン策定
  };
  
  if (sampleRegionMap[civilizationId] !== undefined) {
    return sampleRegionMap[civilizationId];
  }
  
  // For other civilizations, use hash-based assignment
  const hash = civilizationId.split('').reduce((a, b) => {
    // eslint-disable-next-line no-bitwise
    a = ((a << 5) - a) + b.charCodeAt(0);
    // eslint-disable-next-line no-bitwise
    return a & a;
  }, 0);
  
  return Math.abs(hash) % CIVILIZATION_REGIONS.length;
};

/**
 * Generate stable spherical position for civilization
 * Uses pre-defined regions to ensure even distribution
 * Accounts for Earth's axis tilt (15 degrees)
 */
export const getCivilizationPosition = (civilization: Civilization, index: number, existingCivilizations: Civilization[] = []): THREE.Vector3 => {
  // Assign a region to this civilization
  const regionIndex = assignRegionToCivilization(civilization, existingCivilizations);
  const region = CIVILIZATION_REGIONS[regionIndex];
  
  // Convert degrees to radians
  const phi = (region.longitude * Math.PI) / 180; // Longitude
  const theta = ((90 - region.latitude) * Math.PI) / 180; // Latitude (convert to spherical coordinates)
  
  // Convert to Cartesian coordinates on sphere surface
  let x = PLANET_RADIUS * 1.01 * Math.sin(theta) * Math.cos(phi);
  let y = PLANET_RADIUS * 1.01 * Math.cos(theta);
  let z = PLANET_RADIUS * 1.01 * Math.sin(theta) * Math.sin(phi);
  
  // Apply Earth's axis tilt rotation around Z-axis
  // This rotates the entire coordinate system to match the tilted planet
  const cosTilt = Math.cos(EARTH_AXIS_TILT);
  const sinTilt = Math.sin(EARTH_AXIS_TILT);
  
  // Rotate around Z-axis (Y-axis tilt)
  const newX = x * cosTilt - y * sinTilt;
  const newY = x * sinTilt + y * cosTilt;
  const newZ = z;
  
  return new THREE.Vector3(newX, newY, newZ);
};

/**
 * Convert hex color string to THREE.js hex number
 */
const hexToThreeColor = (hexString: string): number => {
  return parseInt(hexString.replace('#', ''), 16);
};

/**
 * Get marker color based on civilization level (consistent with UI theme)
 */
export const getMarkerColorByLevel = (level: CivLevel): number => {
  switch (level) {
    case 'grassland':
      return hexToThreeColor(colors.grassland);
    case 'village':
      return hexToThreeColor(colors.village);
    case 'town':
      return hexToThreeColor(colors.town);
    case 'city':
      return hexToThreeColor(colors.city);
    default:
      return hexToThreeColor(colors.grassland);
  }
};

/**
 * Get marker size based on civilization level (growth level affects land size)
 */
export const getMarkerSizeByLevel = (level: CivLevel): number => {
  switch (level) {
    case 'grassland':
      return 1.2; // Smallest - natural, undeveloped (increased from 0.8)
    case 'village':
      return 1.5; // Small - simple rural development (increased from 1.0)
    case 'town':
      return 1.9; // Medium - moderate development (increased from 1.3)
    case 'city':
      return 2.4; // Largest - advanced urban development (increased from 1.6)
    default:
      return 1.2;
  }
};

/**
 * Get marker color based on civilization state (legacy support)
 */
export const getMarkerColor = (state: CivState): number => {
  switch (state) {
    case 'uninitialized':
      return hexToThreeColor(colors.border); // Theme border color
    case 'developing':
      return hexToThreeColor(colors.success); // Theme success color
    case 'decaying':
      return hexToThreeColor(colors.warning); // Theme warning color
    case 'ocean':
      return hexToThreeColor(colors.primary); // Theme primary color (shouldn't be visible)
    default:
      return hexToThreeColor(colors.border);
  }
};

/**
 * Create civilization marker mesh
 */
export const createCivilizationMarker = (
  civilization: Civilization,
  position: THREE.Vector3
): THREE.Mesh => {
  // Use new level system if available, fallback to legacy state system
  const markerColor = civilization.levels 
    ? getMarkerColorByLevel(civilization.levels.classification)
    : getMarkerColor(civilization.state);
  
  const markerSize = civilization.levels 
    ? getMarkerSizeByLevel(civilization.levels.classification)
    : 1.0; // Default size for legacy state system
  
  // Debug logging
  console.log(`Creating marker for ${civilization.name}:`, {
    level: civilization.levels?.classification,
    color: markerColor.toString(16),
    size: markerSize
  });
  
  // Create sphere geometry for civilization markers
  const baseRadius = 0.04 * markerSize; // Increased base size from 0.03
  const markerGeometry = new THREE.SphereGeometry(baseRadius, 16, 12);
  const markerMaterial = new THREE.MeshStandardMaterial({
    color: markerColor,
    metalness: 0.1,
    roughness: 0.3,
    emissive: markerColor,
    emissiveIntensity: 0.2,
  });
  
  const marker = new THREE.Mesh(markerGeometry, markerMaterial);
  marker.position.copy(position);
  
  // Apply gravity-like flattening towards planet center
  // Calculate the normal direction from planet center to marker position
  const planetCenter = new THREE.Vector3(0, 0, 0);
  const normalDirection = position.clone().normalize();
  
  // Create a transformation matrix that flattens the marker towards the planet center
  // This simulates gravity pulling the marker down towards the surface
  const flattenFactor = 0.5; // How much to flatten (0.5 = 50% of original height - more flattened)
  
  // Create a custom transformation that compresses along the normal direction
  const scaleMatrix = new THREE.Matrix4();
  const identityMatrix = new THREE.Matrix4().identity();
  
  // Calculate the scaling factors for each axis
  // We want to compress along the normal direction (towards planet center)
  const normalX = normalDirection.x;
  const normalY = normalDirection.y;
  const normalZ = normalDirection.z;
  
  // Create a transformation that flattens along the normal direction
  // This is more complex than simple axis scaling - we need to transform along the surface normal
  const flattenScale = flattenFactor;
  const preserveScale = 1.0;
  
  // Apply the flattening transformation
  // Scale down along the normal direction, preserve other directions
  const transformMatrix = new THREE.Matrix4();
  
  // Calculate the scaling matrix components
  const xx = preserveScale + (flattenScale - preserveScale) * normalX * normalX;
  const xy = (flattenScale - preserveScale) * normalX * normalY;
  const xz = (flattenScale - preserveScale) * normalX * normalZ;
  const yx = (flattenScale - preserveScale) * normalY * normalX;
  const yy = preserveScale + (flattenScale - preserveScale) * normalY * normalY;
  const yz = (flattenScale - preserveScale) * normalY * normalZ;
  const zx = (flattenScale - preserveScale) * normalZ * normalX;
  const zy = (flattenScale - preserveScale) * normalZ * normalY;
  const zz = preserveScale + (flattenScale - preserveScale) * normalZ * normalZ;
  
  transformMatrix.set(
    xx, xy, xz, 0,
    yx, yy, yz, 0,
    zx, zy, zz, 0,
    0,  0,  0,  1
  );
  
  // Apply the transformation to the geometry
  markerGeometry.applyMatrix4(transformMatrix);
  
  marker.userData = { 
    civilizationId: civilization.id,
    civilizationState: civilization.state, // Store state for light intensity calculation
    civilizationLevel: civilization.levels?.classification // Store level for new system
  };
  
  return marker;
};

/**
 * Update civilization markers in scene
 */
export const updateCivilizationMarkers = (
  scene: PlanetScene,
  civilizations: Civilization[]
): void => {
  // Remove existing markers
  scene.markers.forEach(marker => {
    if (spinGroup) {
      spinGroup.remove(marker);
    }
  });
  scene.markers.clear();

  // Add new markers (skip ocean state)
  civilizations.forEach((civilization, index) => {
    if (civilization.state === 'ocean') {
      return; // Don't render ocean civilizations
    }

    // Pass existing civilizations to ensure proper region assignment
    const position = getCivilizationPosition(civilization, index, civilizations);
    const marker = createCivilizationMarker(civilization, position);
    
    if (spinGroup) {
      spinGroup.add(marker);
    }
    scene.markers.set(civilization.id, marker);
  });
};

/**
 * Update single marker when civilization changes
 */
export const updateMarkerState = (
  scene: PlanetScene,
  civilizationId: string,
  civilization: Civilization
): void => {
  const marker = scene.markers.get(civilizationId);
  if (marker) {
    if (civilization.state === 'ocean') {
      // Remove marker for ocean state
      if (spinGroup) {
        spinGroup.remove(marker);
      }
      scene.markers.delete(civilizationId);
    } else {
      // Update marker color, size, and emissive based on new level system
      const material = marker.material as THREE.MeshStandardMaterial;
      
      // Use new level system if available, fallback to legacy state system
      const newColor = civilization.levels 
        ? getMarkerColorByLevel(civilization.levels.classification)
        : getMarkerColor(civilization.state);
      
      material.color.setHex(newColor);
      material.emissive.setHex(newColor);
      
      // Update marker size if level system is available
      if (civilization.levels) {
        const newSize = getMarkerSizeByLevel(civilization.levels.classification);
        marker.scale.setScalar(newSize);
      }
      
      // Update userData with new state and level for light intensity calculation
      marker.userData.civilizationState = civilization.state;
      marker.userData.civilizationLevel = civilization.levels?.classification;
    }
  }
};

/**
 * Handle screen resize
 */
export const resizeScene = (
  scene: PlanetScene,
  width: number,
  height: number
): void => {
  scene.camera.aspect = width / height;
  scene.camera.updateProjectionMatrix();
  scene.renderer.setSize(width, height);
};

/**
 * Perform raycast to detect marker under pointer
 */
export const detectMarkerHit = (
  scene: PlanetScene,
  x: number,
  y: number,
  screenWidth: number,
  screenHeight: number
): string | null => {
  // Convert screen coordinates to normalized device coordinates
  scene.pointer.x = (x / screenWidth) * 2 - 1;
  scene.pointer.y = -(y / screenHeight) * 2 + 1;

  // Update raycaster
  scene.raycaster.setFromCamera(scene.pointer, scene.camera);

  // Get all markers as array
  const markers = Array.from(scene.markers.values());
  
  // Perform raycast
  const intersects = scene.raycaster.intersectObjects(markers);
  
  if (intersects.length > 0) {
    const hitMarker = intersects[0].object;
    return hitMarker.userData.civilizationId as string;
  }
  
  return null;
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
    // Horizontal swipe (deltaX) rotates around Y-axis (reversed direction)
    const yRotation = -deltaX * sensitivity; // Reversed direction
    spinGroup.rotation.y += yRotation;
    
    // Update day/night angle to match current rotation
    dayNightAngle = spinGroup.rotation.y;
    
    // Vertical swipe (deltaY) rotates around X-axis (reversed direction)
    spinGroup.rotation.x -= deltaY * sensitivity; // Reversed direction
  }
};

/**
 * Apply camera zoom
 */
export const zoomPlanet = (scene: PlanetScene, scale: number): void => {
  const distance = scene.camera.position.length();
  const newDistance = Math.max(
    CAMERA_MIN_DISTANCE,
    Math.min(CAMERA_MAX_DISTANCE, distance * scale)
  );
  
  scene.camera.position.normalize().multiplyScalar(newDistance);
  scene.camera.lookAt(0, 0, 0);
};

/**
 * Render scene (call only when needed)
 */
export const renderScene = (scene: PlanetScene): void => {
  scene.renderer.render(scene.scene, scene.camera);
  // Use type assertion for expo-gl specific method
  (scene.renderer.getContext() as any).endFrameEXP();
};

/**
 * Dispose scene resources
 */
export const disposeScene = (scene: PlanetScene): void => {
  // Stop animation
  stopIdleAnimation();
  
  // Clear global references
  tiltGroup = null;
  spinGroup = null;
  directionalLight = null;
  
  // Dispose geometries and materials
  scene.scene.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      if (object.material instanceof THREE.Material) {
        object.material.dispose();
      }
    }
  });

  // Dispose renderer
  scene.renderer.dispose();
};
