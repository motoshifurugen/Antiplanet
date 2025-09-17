// Scene management and interaction handling
import { ExpoWebGLRenderingContext } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
import { PlanetScene } from './three';
import { createPlanetMesh, createCloudLayerMesh, createEquatorRing, PLANET_RADIUS, EARTH_AXIS_TILT } from './planet';
import { setupLights } from './lighting';
import { initializeAnimation } from './animation';

// Camera constants
const CAMERA_MIN_DISTANCE = 2.0;
const CAMERA_MAX_DISTANCE = 5.0;
const CAMERA_INITIAL_DISTANCE = 3.5;

/**
 * Create and initialize 3D planet scene
 */
export const createPlanetScene = (gl: ExpoWebGLRenderingContext): PlanetScene => {
  // Scene setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e); // Slightly brighter space background

  // Camera setup
  const camera = new THREE.PerspectiveCamera(
    30, // FOV (even further reduced to prevent vertical distortion)
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
  const tiltGroup = new THREE.Group();
  const spinGroup = new THREE.Group();
  
  // Apply Earth's axis tilt to tilt group (23.4 degrees)
  // Rotate around Z-axis to tilt rightward instead of forward
  tiltGroup.rotation.z = EARTH_AXIS_TILT;
  
  // Create smooth planet mesh
  const planet = createPlanetMesh();
  
  // Add very subtle white outline to planet
  const outlineGeometry = new THREE.SphereGeometry(PLANET_RADIUS * 1.005, 32, 32);
  outlineGeometry.scale(1, 1, 1); // Ensure uniform scaling for outline
  const outlineMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.15,
    side: THREE.BackSide,
  });
  const outline = new THREE.Mesh(outlineGeometry, outlineMaterial);
  planet.add(outline);
  
  // Create cloud layer mesh
  const cloudLayer = createCloudLayerMesh(PLANET_RADIUS);
  
  // Add equator ring with day/night gradient effect
  const equatorRing = createEquatorRing(PLANET_RADIUS);
  
  // Add planet and equator ring to spin group (cloud layer stays independent)
  spinGroup.add(planet);
  spinGroup.add(equatorRing);
  
  // Add spin group to tilt group
  tiltGroup.add(spinGroup);
  
  // Add cloud layer directly to tilt group (independent of planet rotation)
  tiltGroup.add(cloudLayer);
  
  // Add tilt group to scene
  scene.add(tiltGroup);

  // Initialize animation system
  initializeAnimation(spinGroup, cloudLayer);

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
 * Handle screen resize
 */
export const resizeScene = (
  scene: PlanetScene,
  width: number,
  height: number
): void => {
  const aspectRatio = width / height;
  scene.camera.aspect = aspectRatio;
  scene.camera.updateProjectionMatrix();
  scene.renderer.setSize(width, height);
  
  // Ensure proper aspect ratio to prevent sphere distortion
  console.log(`Screen resize: ${width}x${height}, aspect ratio: ${aspectRatio.toFixed(2)}`);
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
  console.log('detectMarkerHit called with:', { x, y, screenWidth, screenHeight });
  console.log('Scene markers count:', scene.markers.size);
  
  // Convert screen coordinates to normalized device coordinates
  scene.pointer.x = (x / screenWidth) * 2 - 1;
  scene.pointer.y = -(y / screenHeight) * 2 + 1;

  console.log('Normalized coordinates:', { x: scene.pointer.x, y: scene.pointer.y });

  // Update raycaster with improved settings
  scene.raycaster.setFromCamera(scene.pointer, scene.camera);
  
  // Increase raycast precision by setting a threshold
  scene.raycaster.params.Points.threshold = 0.1; // Increase threshold for better hit detection

  // Get all markers as array
  const markers = Array.from(scene.markers.values());
  console.log('Markers array length:', markers.length);
  
  // Perform raycast with recursive search for child objects
  const intersects = scene.raycaster.intersectObjects(markers, true); // true = recursive
  console.log('Raycast intersects:', intersects.length);
  
  if (intersects.length > 0) {
    const hitObject = intersects[0].object;
    let civilizationId: string | null = null;
    
    // If hit object is a child (hit area), get civilization ID from parent
    if (hitObject.parent && hitObject.parent.userData.civilizationId) {
      civilizationId = hitObject.parent.userData.civilizationId as string;
      console.log('Hit child object, using parent civilization ID:', civilizationId);
    } else if (hitObject.userData.civilizationId) {
      civilizationId = hitObject.userData.civilizationId as string;
      console.log('Hit main marker, civilization ID:', civilizationId);
    }
    
    if (civilizationId) {
      console.log('Hit civilization ID:', civilizationId);
      return civilizationId;
    }
  }
  
  console.log('No marker hit');
  return null;
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
  const { stopIdleAnimation } = require('./animation');
  stopIdleAnimation();
  
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
