// Planet mesh creation and atmospheric effects
import * as THREE from 'three';

// Planet constants
export const PLANET_RADIUS = 0.5;
export const EARTH_AXIS_TILT = 15 * Math.PI / 180;

/**
 * Create smooth planet mesh with PBR material
 */
export const createPlanetMesh = (): THREE.Mesh => {
  // Smooth sphere geometry with proper aspect ratio to prevent distortion
  const planetGeometry = new THREE.SphereGeometry(PLANET_RADIUS, 64, 64);
  
  // Ensure sphere geometry is perfectly round
  planetGeometry.computeBoundingSphere();
  
  // Ensure the geometry is perfectly spherical by normalizing vertices
  const vertices = planetGeometry.attributes.position.array;
  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i];
    const y = vertices[i + 1];
    const z = vertices[i + 2];
    const length = Math.sqrt(x * x + y * y + z * z);
    vertices[i] = (x / length) * PLANET_RADIUS;
    vertices[i + 1] = (y / length) * PLANET_RADIUS;
    vertices[i + 2] = (z / length) * PLANET_RADIUS;
  }
  planetGeometry.attributes.position.needsUpdate = true;
  
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
 * Create procedural cloud texture with elliptical cloud patterns
 * React Native compatible version using DataTexture
 */
const createCloudTexture = (): THREE.DataTexture => {
  const size = 512; // Texture resolution
  const data = new Uint8Array(size * size * 4); // RGBA data
  
  // Simple noise function for cloud patterns
  const noise = (x: number, y: number): number => {
    return Math.sin(x * 0.1) * Math.cos(y * 0.1) + 
           Math.sin(x * 0.05) * Math.cos(y * 0.05) * 0.5 +
           Math.sin(x * 0.02) * Math.cos(y * 0.02) * 0.25;
  };
  
  // Generate elliptical cloud patterns (fewer clouds with more rounded shape)
  const cloudCenters = [
    { x: 150, y: 180, width: 35, height: 30, angle: 0.3 },
    { x: 350, y: 120, width: 40, height: 35, angle: -0.2 },
    { x: 450, y: 280, width: 30, height: 28, angle: 0.5 },
    { x: 200, y: 380, width: 35, height: 32, angle: -0.4 },
    { x: 400, y: 420, width: 40, height: 36, angle: 0.1 },
  ];
  
  // Generate cloud pattern data
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const index = (y * size + x) * 4;
      
      let cloudValue = 0;
      
      // Check each elliptical cloud
      for (const cloud of cloudCenters) {
        // Rotate coordinates
        const cos = Math.cos(cloud.angle);
        const sin = Math.sin(cloud.angle);
        const dx = x - cloud.x;
        const dy = y - cloud.y;
        const rotatedX = dx * cos + dy * sin;
        const rotatedY = -dx * sin + dy * cos;
        
        // Check if point is inside ellipse
        const ellipseValue = (rotatedX * rotatedX) / (cloud.width * cloud.width) + 
                           (rotatedY * rotatedY) / (cloud.height * cloud.height);
        
        if (ellipseValue <= 1) {
          // Add elliptical cloud with sharper edges for clearer distinction
          const edgeFactor = 1 - ellipseValue;
          const sharpEdge = Math.max(0, edgeFactor - 0.1) / 0.9; // Sharper edge transition
          cloudValue = Math.max(cloudValue, sharpEdge * 0.7); // Reduced intensity
        }
      }
      
      // Add some noise-based clouds for variety (minimal intensity)
      const noiseValue = Math.max(0, noise(x * 0.03, y * 0.03) + 0.4) * 0.1;
      cloudValue = Math.max(cloudValue, noiseValue);
      
      // Add wispy cloud details (minimal intensity)
      const wispyValue = Math.max(0, noise(x * 0.08, y * 0.08) + 0.3) * 0.08;
      cloudValue = Math.max(cloudValue, wispyValue);
      
      // Apply threshold to create clear cloud/no-cloud distinction
      const cloudThreshold = 0.4; // Higher threshold for fewer clouds
      if (cloudValue < cloudThreshold) {
        cloudValue = 0; // Clear sky areas
      } else {
        // Normalize cloud values above threshold for better contrast
        cloudValue = (cloudValue - cloudThreshold) / (1 - cloudThreshold);
      }
      
      // Ensure cloud value is between 0 and 1
      cloudValue = Math.min(1, cloudValue);
      
      // Convert to RGBA values (subdued white, no gradient)
      const alpha = cloudValue > 0 ? 255 : 0; // White or transparent
      
      data[index] = 232;     // R - subdued white
      data[index + 1] = 232; // G - subdued white
      data[index + 2] = 232; // B - subdued white
      data[index + 3] = alpha; // A - either 255 (white) or 0 (transparent)
    }
  }
  
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  
  return texture;
};

/**
 * Create cloud layer mesh with natural cloud patterns
 */
export const createCloudLayerMesh = (planetRadius: number): THREE.Mesh => {
  // Cloud layer with more thickness - create outer and inner spheres
  const outerRadius = planetRadius * 1.15;
  const innerRadius = planetRadius * 1.08;
  
  // Create outer sphere geometry
  const outerGeometry = new THREE.SphereGeometry(outerRadius, 64, 64);
  
  // Create inner sphere geometry (smaller, will be subtracted)
  const innerGeometry = new THREE.SphereGeometry(innerRadius, 64, 64);
  
  // Create cloud layer group
  const cloudGroup = new THREE.Group();
  
  // Create outer cloud shell
  const cloudTexture = createCloudTexture();
  const cloudMaterial = new THREE.MeshBasicMaterial({
    map: cloudTexture,
    color: 0xe8e8e8, // More subdued white base (more grayish)
    transparent: true,
    opacity: 0.6, // Reduced opacity for more subtle appearance
    side: THREE.DoubleSide, // Render both sides
    alphaTest: 0.5, // Higher threshold to cut off more transparent areas
  });
  
  const outerCloud = new THREE.Mesh(outerGeometry, cloudMaterial);
  cloudGroup.add(outerCloud);
  
  // Create middle cloud shell for additional thickness
  const middleRadius = planetRadius * 1.11;
  const middleGeometry = new THREE.SphereGeometry(middleRadius, 64, 64);
  const middleCloudMaterial = cloudMaterial.clone();
  middleCloudMaterial.opacity = 0.5; // Medium transparency for middle layer
  middleCloudMaterial.alphaTest = 0.5; // Higher threshold to cut off more transparent areas
  const middleCloud = new THREE.Mesh(middleGeometry, middleCloudMaterial);
  cloudGroup.add(middleCloud);
  
  // Create inner cloud shell (slightly different material for depth)
  const innerCloudMaterial = cloudMaterial.clone();
  innerCloudMaterial.opacity = 0.4; // More transparent for depth effect
  innerCloudMaterial.alphaTest = 0.5; // Higher threshold to cut off more transparent areas
  const innerCloud = new THREE.Mesh(innerGeometry, innerCloudMaterial);
  cloudGroup.add(innerCloud);
  
  return cloudGroup as any; // Type assertion for compatibility
};

/**
 * Create equator ring with day/night gradient effect
 */
export const createEquatorRing = (planetRadius: number): THREE.Mesh => {
  const ringGeometry = new THREE.RingGeometry(planetRadius * 0.98, planetRadius * 1.02, 64);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
  });
  const equatorRing = new THREE.Mesh(ringGeometry, ringMaterial);
  equatorRing.rotation.x = Math.PI / 2; // Rotate to be horizontal
  
  // Store reference for day/night updates
  equatorRing.userData.isEquatorRing = true;
  
  return equatorRing;
};
