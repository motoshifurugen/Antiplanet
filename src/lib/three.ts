// Three.js utilities and scene management for Expo
// 3D planet rendering with civilization markers

import { ExpoWebGLRenderingContext } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
import { Civilization } from '../types';

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

// Re-export all functionality from specialized modules
export * from './planet';
export * from './markers';
export * from './animation';
export * from './lighting';
export * from './scene';
