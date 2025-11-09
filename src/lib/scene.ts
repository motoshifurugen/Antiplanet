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
const CAMERA_MAX_DISTANCE = 7.0;
const CAMERA_INITIAL_DISTANCE = 5.0;

/**
 * Create and initialize 3D planet scene
 */
export const createPlanetScene = (gl: ExpoWebGLRenderingContext): PlanetScene => {
  // Scene setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e); // Slightly brighter space background

  // Camera setup
  // Use safe default aspect ratio (1:1) - will be updated on resize
  // Don't use gl.drawingBufferWidth/Height here as they may not match onLayout dimensions
  const camera = new THREE.PerspectiveCamera(
    30, // FOV (even further reduced to prevent vertical distortion)
    1.0, // Default aspect ratio - will be updated by resizeScene
    0.1, // near
    100 // far
  );
  camera.position.set(0, 0, CAMERA_INITIAL_DISTANCE);
  camera.lookAt(0, 0, 0); // Ensure camera looks at the center

  // Renderer setup with PBR configuration
  const renderer = new Renderer({ gl });
  // Don't set size here - wait for onLayout to provide correct dimensions
  // Set a minimal size to avoid errors, will be updated by resizeScene
  renderer.setSize(1, 1);
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
    spinGroup,
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
  if (width <= 0 || height <= 0) {
    console.warn('Invalid resize dimensions:', { width, height });
    return;
  }
  
  // Get GL context to access drawing buffer dimensions
  const gl = scene.renderer.getContext() as ExpoWebGLRenderingContext;
  
  // Use physical pixel dimensions for both renderer and camera
  // This ensures aspect ratio matches the actual rendering buffer
  const physicalWidth = gl ? gl.drawingBufferWidth : width;
  const physicalHeight = gl ? gl.drawingBufferHeight : height;
  const aspectRatio = physicalWidth / physicalHeight;
  
  // Update camera aspect ratio using physical pixel dimensions
  scene.camera.aspect = aspectRatio;
  scene.camera.updateProjectionMatrix();
  
  // Set renderer size to match physical pixel dimensions
  scene.renderer.setSize(physicalWidth, physicalHeight, false);
  
  // Set viewport to cover entire drawing buffer (must match renderer size)
  if (gl) {
    gl.viewport(0, 0, physicalWidth, physicalHeight);
  }
  
  console.log('Resized scene:', { 
    logicalSize: { width, height },
    physicalSize: { width: physicalWidth, height: physicalHeight },
    aspectRatio,
    rendererSize: { 
      width: scene.renderer.getSize(new THREE.Vector2()).x,
      height: scene.renderer.getSize(new THREE.Vector2()).y
    }
  });
  
  // Ensure camera still looks at center after resize
  scene.camera.lookAt(0, 0, 0);
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

  // Update raycaster with improved settings
  scene.raycaster.setFromCamera(scene.pointer, scene.camera);
  
  // Get all markers as array
  const markers = Array.from(scene.markers.values());
  
  // Perform raycast with recursive search for child objects (hit areas)
  // Recursive search ensures we detect both the marker mesh and its hit area child
  const intersects = scene.raycaster.intersectObjects(markers, true); // true = recursive
  
  if (intersects.length > 0) {
    const hitObject = intersects[0].object;
    let civilizationId: string | null = null;
    
    // First check if the hit object itself has a civilization ID (hit area)
    if (hitObject.userData.civilizationId) {
      civilizationId = hitObject.userData.civilizationId as string;
    }
    // If hit object is a child (hit area), get civilization ID from parent
    else if (hitObject.parent && hitObject.parent.userData.civilizationId) {
      civilizationId = hitObject.parent.userData.civilizationId as string;
    }
    // If hit object is the marker itself, get ID from its userData
    else if (hitObject.userData && hitObject.userData.civilizationId) {
      civilizationId = hitObject.userData.civilizationId as string;
    }
    
    if (civilizationId) {
      return civilizationId;
    }
  }
  
  return null;
};

/**
 * Render scene (call only when needed)
 */
export const renderScene = (scene: PlanetScene): void => {
  // Ensure viewport is set before rendering
  const gl = scene.renderer.getContext() as ExpoWebGLRenderingContext;
  if (gl) {
    // Use physical pixel dimensions from drawing buffer
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  }
  
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
