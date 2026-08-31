import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { TextureAtlas, AtlasTextureType } from './TextureAtlas';

// ---------------------------------------------------------
// DETERMINISTIC RANDOMNESS HELPERS
// ---------------------------------------------------------
export function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function randomRange(min: number, max: number, seed: number) {
  return min + (max - min) * seededRandom(seed);
}

export function randomVector(min: THREE.Vector3, max: THREE.Vector3, seed: number) {
  return new THREE.Vector3(
    randomRange(min.x, max.x, seed),
    randomRange(min.y, max.y, seed + 1),
    randomRange(min.z, max.z, seed + 2)
  );
}

// ---------------------------------------------------------
// GEOMETRY HELPERS
// ---------------------------------------------------------
function createDeformedLowPolyMesh(geometry: THREE.BufferGeometry, seed: number, amount: number) {
  const position = geometry.attributes.position;
  const tempVec = new THREE.Vector3();

  for (let i = 0; i < position.count; i++) {
    tempVec.fromBufferAttribute(position, i);
    
    // Deterministic jitter
    const noiseX = seededRandom(seed + i * 3) - 0.5;
    const noiseY = seededRandom(seed + i * 3 + 1) - 0.5;
    const noiseZ = seededRandom(seed + i * 3 + 2) - 0.5;
    
    tempVec.x += noiseX * amount;
    tempVec.y += noiseY * amount;
    tempVec.z += noiseZ * amount;
    
    position.setXYZ(i, tempVec.x, tempVec.y, tempVec.z);
  }
  
  geometry.computeVertexNormals();
  return geometry;
}

// ---------------------------------------------------------
// PROCEDURAL TREE GENERATOR
// ---------------------------------------------------------
export type TreeType = 'FOREST' | 'PINE' | 'OLD' | 'SMALL' | 'WIDE' | 'TALL';

export interface TreeParams {
  seed: number;
  type: TreeType;
}

export class ProceduralTreeGenerator {
  private static materialCache: Map<string, THREE.Material> = new Map();

  public static generateGeometries(params: TreeParams): { trunk: THREE.BufferGeometry; foliage: THREE.BufferGeometry } {
    const { seed, type } = params;

    const trunkParams = this.getTrunkParams(type, seed);
    const trunkMesh = this.createTrunk(trunkParams);
    const trunkGeo = trunkMesh.geometry;

    const foliageParams = this.getFoliageParams(type, seed, trunkParams.height);
    const foliageGroup = this.createFoliage(foliageParams);
    
    // Merge foliage meshes
    const foliageGeos: THREE.BufferGeometry[] = [];
    foliageGroup.children.forEach(child => {
      if (child instanceof THREE.Mesh) {
        child.updateMatrix(); 
        const g = child.geometry.clone();
        g.applyMatrix4(child.matrix);
        foliageGeos.push(g);
      }
    });

    const mergedFoliageGeo = BufferGeometryUtils.mergeGeometries(foliageGeos);
    
    // Apply Atlas UVs with consistent scaling based on trunk height to avoid stretching
    // We use a base density of 1 tile per 1.5 world units for bark
    TextureAtlas.getInstance().applyUVs(trunkGeo, AtlasTextureType.WOOD_BARK, 1.0, trunkParams.height / 1.5);
    TextureAtlas.getInstance().applyConsistentUVs(mergedFoliageGeo, AtlasTextureType.GRASS, 1.2);

    // Cleanup temporary geometries
    foliageGeos.forEach(g => g.dispose());

    return { 
      trunk: trunkGeo, 
      foliage: mergedFoliageGeo 
    };
  }

  private static getTrunkParams(type: TreeType, seed: number) {
    let height = 4;
    let baseRadius = 0.4;
    let segments = 6;
    let radialSegments = 6;
    let bend = 0.2;

    switch (type) {
      case 'PINE':
        height = randomRange(2.0, 3.0, seed);
        baseRadius = 0.15;
        bend = 0.05;
        break;
      case 'OLD':
        height = randomRange(1.25, 1.75, seed);
        baseRadius = 0.3;
        segments = 8;
        bend = 0.4;
        break;
      case 'WIDE':
        height = randomRange(1.25, 1.75, seed);
        baseRadius = 0.25;
        bend = 0.2;
        break;
      case 'TALL':
        height = randomRange(2.5, 3.5, seed);
        baseRadius = 0.17;
        segments = 10;
        bend = 0.1;
        break;
      case 'SMALL':
        height = randomRange(0.5, 0.9, seed);
        baseRadius = 0.1;
        bend = 0.1;
        break;
      default: // FOREST
        height = randomRange(1.5, 2.0, seed);
        baseRadius = 0.2;
        bend = 0.2;
    }

    return { seed, height, baseRadius, segments, radialSegments, bend };
  }

  private static createTrunk(params: any): THREE.Mesh {
    const { seed, height, baseRadius, segments, radialSegments, bend } = params;
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];

    // Generate ring by ring
    for (let s = 0; s <= segments; s++) {
      const t = s / segments;
      const y = t * height;
      const radius = baseRadius * (1 - t * 0.8); // Taper
      
      // Controlled angular deformation for bending
      const horizontalOffset = Math.pow(t, 1.5) * bend * Math.sin(seed + t * 5);
      const horizontalOffsetZ = Math.pow(t, 1.5) * bend * Math.cos(seed + t * 5);

      for (let r = 0; r <= radialSegments; r++) {
        const angle = (r / radialSegments) * Math.PI * 2;
        
        // Irregular non-uniform cross-section
        const radialDeform = 1 + (seededRandom(seed + s * 10 + r) - 0.5) * 0.15;
        // Add vertical "ridges"
        const ridgeDeform = 0.05 * Math.sin(angle * 3 + seed);
        
        const currentRadius = radius * (radialDeform + ridgeDeform);

        const vx = Math.cos(angle) * currentRadius + horizontalOffset;
        const vy = y;
        const vz = Math.sin(angle) * currentRadius + horizontalOffsetZ;

        vertices.push(vx, vy, vz);
        uvs.push(r / radialSegments, s / segments * 2.0); // Tile bark vertically
      }
    }

    // Indices for faces
    for (let s = 0; s < segments; s++) {
      const rowSize = radialSegments + 1;
      for (let r = 0; r < radialSegments; r++) {
        const a = s * rowSize + r;
        const b = (s + 1) * rowSize + r;
        const c = (s + 1) * rowSize + (r + 1);
        const d = s * rowSize + (r + 1);

        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const material = this.getTreeMaterial('bark', seed, []);

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  private static getFoliageParams(type: TreeType, seed: number, trunkHeight: number) {
    let numMasses = 4;
    let baseScale = 1.0;
    let spread = 1.2;
    let verticalBias = 1.0;
    let canopyOffset = 0.65; 

    switch (type) {
      case 'PINE':
        numMasses = 7;
        baseScale = 0.45;
        spread = 0.35;
        verticalBias = 1.8;
        canopyOffset = 0.3; 
        break;
      case 'OLD':
        numMasses = 9;
        baseScale = 0.65;
        spread = 1.1;
        verticalBias = 0.7;
        canopyOffset = 0.7;
        break;
      case 'WIDE':
        numMasses = 7;
        baseScale = 0.8;
        spread = 1.4;
        verticalBias = 0.5;
        canopyOffset = 0.75;
        break;
      case 'TALL':
        numMasses = 6;
        baseScale = 0.55;
        spread = 0.6;
        verticalBias = 2.2;
        canopyOffset = 0.8;
        break;
      case 'SMALL':
        numMasses = 4;
        baseScale = 0.35;
        spread = 0.5;
        verticalBias = 0.6;
        canopyOffset = 0.5;
        break;
      default: // FOREST
        numMasses = 6;
        baseScale = 0.55;
        spread = 0.8;
        verticalBias = 1.1;
        canopyOffset = 0.6;
    }

    return { seed, type, numMasses, baseScale, spread, verticalBias, trunkHeight, canopyOffset };
  }

  private static createFoliage(params: any): THREE.Group {
    const { seed, type, numMasses, baseScale, spread, verticalBias, trunkHeight, canopyOffset } = params;
    const group = new THREE.Group();

    const material = this.getTreeMaterial('foliage', seed, []);

    if (type === 'PINE') {
      const numTiers = Math.floor(randomRange(3, 5, seed));
      const tierHeight = (verticalBias * trunkHeight * 0.8) / numTiers;
      const startHeight = trunkHeight * canopyOffset;

      for (let i = 0; i < numTiers; i++) {
        const t = i / (numTiers - 1);
        const fSeed = seed + i * 1000;
        
        const radius = spread * (1.2 - t * 0.8);
        const height = tierHeight * 1.5;
        const radialSegments = 8;
        const geo = new THREE.ConeGeometry(radius, height, radialSegments, 1, true);

        const position = geo.attributes.position;
        const tempVec = new THREE.Vector3();

        for (let j = 0; j < position.count; j++) {
          tempVec.fromBufferAttribute(position, j);
          
          if (tempVec.y < 0) {
            const angle = Math.atan2(tempVec.z, tempVec.x);
            const jagFactor = 1 + Math.sin(angle * (5 + i)) * 0.3 * seededRandom(fSeed + j);
            tempVec.x *= jagFactor;
            tempVec.z *= jagFactor;
            tempVec.y -= seededRandom(fSeed + j + 1) * 0.4; 
          } else {
            tempVec.x += (seededRandom(fSeed + j) - 0.5) * 0.1;
            tempVec.z += (seededRandom(fSeed + j + 1) - 0.5) * 0.1;
          }
          
          position.setXYZ(j, tempVec.x, tempVec.y, tempVec.z);
        }
        geo.computeVertexNormals();

        const mesh = new THREE.Mesh(geo, material);
        mesh.position.set(0, startHeight + i * tierHeight, 0);
        mesh.rotation.y = seededRandom(fSeed) * Math.PI;
        mesh.castShadow = true;
        group.add(mesh);

        const numAccents = 3;
        for (let a = 0; a < numAccents; a++) {
          const aSeed = fSeed + a * 50;
          const accentGeo = new THREE.PlaneGeometry(0.4, 0.8);
          const accentMesh = new THREE.Mesh(accentGeo, material);
          const ang = (a / numAccents) * Math.PI * 2 + seededRandom(aSeed);
          const d = radius * 0.9;
          accentMesh.position.set(Math.cos(ang) * d, startHeight + i * tierHeight - 0.2, Math.sin(ang) * d);
          accentMesh.rotation.set(0, -ang + Math.PI/2, randomRange(-0.5, 0.5, aSeed));
          group.add(accentMesh);
        }
      }
    } else {
      for (let i = 0; i < numMasses; i++) {
        const fSeed = seed + i * 1000;
        const t = i / (numMasses - 1);
        
        const geo = seededRandom(fSeed) > 0.5 
          ? new THREE.DodecahedronGeometry(1, 0) 
          : new THREE.IcosahedronGeometry(1, 0);

        createDeformedLowPolyMesh(geo, fSeed, 0.4);

        const mesh = new THREE.Mesh(geo, material);
        
        const widthFactor = 1.0 - t * 0.4; 
        const angle = (i / numMasses) * Math.PI * 2 + seededRandom(fSeed) * 2.0;
        const dist = (0.4 + seededRandom(fSeed + 1) * 0.6) * spread * widthFactor;
        
        const heightOffset = (trunkHeight * canopyOffset) + (t * verticalBias * trunkHeight * 0.4) + (seededRandom(fSeed + 2) - 0.5) * 0.3;

        mesh.position.set(
          Math.cos(angle) * dist,
          heightOffset,
          Math.sin(angle) * dist
        );

        const s = baseScale * (0.8 + seededRandom(fSeed + 3) * 0.7) * widthFactor;
        mesh.scale.set(
          s * (0.8 + seededRandom(fSeed + 4) * 0.4),
          s * (0.8 + seededRandom(fSeed + 5) * 0.4),
          s * (0.8 + seededRandom(fSeed + 6) * 0.4)
        );

        mesh.rotation.set(
          seededRandom(fSeed + 7) * Math.PI,
          seededRandom(fSeed + 8) * Math.PI,
          seededRandom(fSeed + 9) * Math.PI
        );

        mesh.castShadow = true;
        group.add(mesh);
      }

      const accentCount = Math.floor(randomRange(1, 4, seed + 99));
      for (let i = 0; i < accentCount; i++) {
        const fSeed = seed + i * 500 + 777;
        const geo = new THREE.IcosahedronGeometry(0.6, 0);
        createDeformedLowPolyMesh(geo, fSeed, 0.2);
        const mesh = new THREE.Mesh(geo, material);
        
        const angle = seededRandom(fSeed) * Math.PI * 2;
        const dist = spread * (0.8 + seededRandom(fSeed + 1) * 0.4);
        const height = (trunkHeight * canopyOffset) + seededRandom(fSeed + 2) * verticalBias * (trunkHeight * 0.3);
        
        mesh.position.set(Math.cos(angle) * dist, height, Math.sin(angle) * dist);
        mesh.scale.setScalar(baseScale * (0.4 + seededRandom(fSeed + 3) * 0.4));
        mesh.rotation.set(seededRandom(fSeed + 4) * 6, seededRandom(fSeed + 5) * 6, seededRandom(fSeed + 6) * 6);
        
        group.add(mesh);
      }
    }

    return group;
  }

  public static getTreeMaterial(type: 'foliage' | 'bark', seed: number, _palette: string[]): THREE.Material {
    const key = `${type}`;
    if (this.materialCache.has(key)) {
      return this.materialCache.get(key)!;
    }

    // Use the atlas material
    const atlas = TextureAtlas.getInstance();
    const material = atlas.getMaterial(type === 'foliage' ? AtlasTextureType.GRASS : AtlasTextureType.WOOD_BARK);
    
    // Some versions of @types/three have issues with flatShading in the constructor
    (material as any).flatShading = true;

    this.materialCache.set(key, material);
    return material;
  }
}

