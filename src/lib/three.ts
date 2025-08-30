// Three.js utilities and scene management for Expo
// 3D planet rendering with civilization markers

import { ExpoWebGLRenderingContext } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
import { Civilization, CivState } from '../types';

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

  // Renderer setup
  const renderer = new Renderer({ gl });
  renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
  renderer.shadowMap.enabled = false; // Keep performance simple
  
  // Lighting setup
  const ambientLight = new THREE.AmbientLight(0x404040, 0.6); // Soft ambient
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);

  // Planet geometry - low poly sphere
  const planetGeometry = new THREE.IcosahedronGeometry(PLANET_RADIUS, 1); // Low subdivision
  const planetMaterial = new THREE.MeshLambertMaterial({ 
    color: 0x4a90e2,
    wireframe: false 
  });
  const planet = new THREE.Mesh(planetGeometry, planetMaterial);
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
 * Get marker color based on civilization state
 */
export const getMarkerColor = (state: CivState): number => {
  switch (state) {
    case 'uninitialized':
      return 0x808080; // Gray
    case 'developing':
      return 0x00ff00; // Green
    case 'decaying':
      return 0xff8800; // Orange
    case 'ocean':
      return 0x808080; // Gray (shouldn't be visible)
    default:
      return 0x808080;
  }
};

/**
 * Create civilization marker mesh
 */
export const createCivilizationMarker = (
  civilization: Civilization,
  position: THREE.Vector3
): THREE.Mesh => {
  const markerGeometry = new THREE.SphereGeometry(0.03, 8, 6); // Small low-poly sphere
  const markerMaterial = new THREE.MeshLambertMaterial({
    color: getMarkerColor(civilization.state),
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
      // Update marker color
      (marker.material as THREE.MeshLambertMaterial).color.setHex(
        getMarkerColor(newState)
      );
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
