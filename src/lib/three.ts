// Three.js utilities and scene management for Expo
// 3D planet rendering with civilization markers

import { ExpoWebGLRenderingContext } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
import { Civilization, CivState } from '../types';
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
const PLANET_RADIUS = 1;
const CAMERA_MIN_DISTANCE = 2;
const CAMERA_MAX_DISTANCE = 6;
const CAMERA_INITIAL_DISTANCE = 3.5;

/**
 * Create smooth planet mesh with PBR material
 */
export const createPlanetMesh = (): THREE.Mesh => {
  // Smooth sphere geometry with 64 segments for quality
  const planetGeometry = new THREE.SphereGeometry(PLANET_RADIUS, 64, 48);
  
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
 * Setup 3-light configuration for realistic planet lighting
 */
export const setupLights = (scene: THREE.Scene): void => {
  // Ambient light - dark bluish tint for space atmosphere
  const ambientLight = new THREE.AmbientLight(0x1a1a2e, 0.3);
  scene.add(ambientLight);
  
  // Directional light - warm sunlight from top-right
  const directionalLight = new THREE.DirectionalLight(0xffd89b, 1.2);
  directionalLight.position.set(2, 3, 1);
  directionalLight.castShadow = false; // No shadows for performance
  scene.add(directionalLight);
  
  // Hemisphere light - subtle sky/ground color mixing
  const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x2c3e50, 0.4);
  scene.add(hemisphereLight);
};

/**
 * Create and initialize 3D planet scene
 */
export const createPlanetScene = (gl: ExpoWebGLRenderingContext): PlanetScene => {
  // Scene setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0a); // Dark space background

  // Camera setup
  const camera = new THREE.PerspectiveCamera(
    50, // FOV
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

  // Create smooth planet mesh
  const planet = createPlanetMesh();
  scene.add(planet);

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
 * Generate stable spherical position for civilization
 */
export const getCivilizationPosition = (civilization: Civilization, index: number): THREE.Vector3 => {
  // Create stable position based on ID hash and index
  const hash = civilization.id.split('').reduce((a, b) => {
    // eslint-disable-next-line no-bitwise
    a = ((a << 5) - a) + b.charCodeAt(0);
    // eslint-disable-next-line no-bitwise
    return a & a;
  }, 0);
  
  // Convert hash to spherical coordinates
  const phi = (Math.abs(hash) % 1000) / 1000 * Math.PI * 2; // Longitude
  const theta = (index * 0.618034) % 1 * Math.PI; // Latitude (golden ratio spacing)
  
  // Convert to Cartesian coordinates on sphere surface
  const x = PLANET_RADIUS * 1.01 * Math.sin(theta) * Math.cos(phi); // Slightly outside planet
  const y = PLANET_RADIUS * 1.01 * Math.cos(theta);
  const z = PLANET_RADIUS * 1.01 * Math.sin(theta) * Math.sin(phi);
  
  return new THREE.Vector3(x, y, z);
};

/**
 * Convert hex color string to THREE.js hex number
 */
const hexToThreeColor = (hexString: string): number => {
  return parseInt(hexString.replace('#', ''), 16);
};

/**
 * Get marker color based on civilization state (consistent with UI theme)
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
  const markerGeometry = new THREE.SphereGeometry(0.03, 16, 12); // Small smooth sphere
  const markerMaterial = new THREE.MeshStandardMaterial({
    color: getMarkerColor(civilization.state),
    metalness: 0.1,
    roughness: 0.3,
    emissive: getMarkerColor(civilization.state),
    emissiveIntensity: 0.2,
  });
  
  const marker = new THREE.Mesh(markerGeometry, markerMaterial);
  marker.position.copy(position);
  marker.userData = { civilizationId: civilization.id }; // Store ID for raycasting
  
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
    scene.scene.remove(marker);
  });
  scene.markers.clear();

  // Add new markers (skip ocean state)
  civilizations.forEach((civilization, index) => {
    if (civilization.state === 'ocean') {
      return; // Don't render ocean civilizations
    }

    const position = getCivilizationPosition(civilization, index);
    const marker = createCivilizationMarker(civilization, position);
    
    scene.scene.add(marker);
    scene.markers.set(civilization.id, marker);
  });
};

/**
 * Update single marker color when state changes
 */
export const updateMarkerState = (
  scene: PlanetScene,
  civilizationId: string,
  newState: CivState
): void => {
  const marker = scene.markers.get(civilizationId);
  if (marker) {
    if (newState === 'ocean') {
      // Remove marker for ocean state
      scene.scene.remove(marker);
      scene.markers.delete(civilizationId);
    } else {
      // Update marker color and emissive
      const material = marker.material as THREE.MeshStandardMaterial;
      const newColor = getMarkerColor(newState);
      material.color.setHex(newColor);
      material.emissive.setHex(newColor);
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
 * Apply camera rotation
 */
export const rotatePlanet = (
  scene: PlanetScene,
  deltaX: number,
  deltaY: number,
  sensitivity: number = 0.005
): void => {
  // Get current spherical coordinates
  const spherical = new THREE.Spherical();
  spherical.setFromVector3(scene.camera.position);
  
  // Apply rotation
  spherical.theta -= deltaX * sensitivity;
  spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi + deltaY * sensitivity));
  
  // Update camera position
  scene.camera.position.setFromSpherical(spherical);
  scene.camera.lookAt(0, 0, 0);
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
