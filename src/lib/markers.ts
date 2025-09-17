// Civilization markers management and positioning
import * as THREE from 'three';
import { Civilization, CivState, CivLevel } from '../types';
import { colors } from '../theme/colors';
import { PLANET_RADIUS, EARTH_AXIS_TILT } from './planet';
import { PlanetScene } from './three';

export interface CivilizationMarker {
  id: string;
  position: THREE.Vector3;
  mesh: THREE.Mesh;
  civilization: Civilization;
}

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
  const baseRadius = 0.08 * markerSize; // Doubled the base size for better hit detection
  const markerGeometry = new THREE.SphereGeometry(baseRadius, 16, 12);
  const markerMaterial = new THREE.MeshStandardMaterial({
    color: markerColor,
    metalness: 0.1,
    roughness: 0.3,
    emissive: markerColor,
    emissiveIntensity: 0.2,
    transparent: true, // Enable transparency for night darkening
    opacity: 1.0, // Default opacity (will be changed at night)
  });
  
  const marker = new THREE.Mesh(markerGeometry, markerMaterial);
  marker.position.copy(position);
  
  // Add invisible bounding box for better hit detection
  const boundingBox = new THREE.BoxGeometry(baseRadius * 2, baseRadius * 2, baseRadius * 2);
  const invisibleMaterial = new THREE.MeshBasicMaterial({ 
    visible: false, 
    transparent: true, 
    opacity: 0 
  });
  const hitArea = new THREE.Mesh(boundingBox, invisibleMaterial);
  hitArea.position.copy(position);
  
  // Add hit area to marker for better detection
  marker.add(hitArea);
  
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
  console.log('Updating civilization markers:', civilizations.length);
  
  // Remove existing markers
  scene.markers.forEach(marker => {
    // Find spin group in scene
    let spinGroup: THREE.Group | null = null;
    scene.scene.traverse((object) => {
      if (object instanceof THREE.Group && object.children.includes(scene.planet)) {
        spinGroup = object;
      }
    });
    
    if (spinGroup) {
      (spinGroup as THREE.Group).remove(marker);
    }
  });
  scene.markers.clear();

  // Add new markers (skip ocean state)
  civilizations.forEach((civilization, index) => {
    if (civilization.state === 'ocean') {
      console.log(`Skipping ocean civilization: ${civilization.name}`);
      return; // Don't render ocean civilizations
    }

    console.log(`Creating marker for: ${civilization.name} (${civilization.state})`);
    
    // Pass existing civilizations to ensure proper region assignment
    const position = getCivilizationPosition(civilization, index, civilizations);
    const marker = createCivilizationMarker(civilization, position);
    
    // Find spin group in scene
    let spinGroup: THREE.Group | null = null;
    scene.scene.traverse((object) => {
      if (object instanceof THREE.Group && object.children.includes(scene.planet)) {
        spinGroup = object as THREE.Group;
      }
    });
    
    if (spinGroup) {
      (spinGroup as THREE.Group).add(marker);
      console.log(`Added marker for ${civilization.name} to scene`);
    } else {
      console.error(`Could not find spin group for ${civilization.name}`);
    }
    scene.markers.set(civilization.id, marker);
  });
  
  console.log(`Total markers created: ${scene.markers.size}`);
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
      // Find spin group in scene
      let spinGroup: THREE.Group | null = null;
      scene.scene.traverse((object) => {
        if (object instanceof THREE.Group && object.children.includes(scene.planet)) {
          spinGroup = object as THREE.Group;
        }
      });
      
      if (spinGroup) {
        (spinGroup as THREE.Group).remove(marker);
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
