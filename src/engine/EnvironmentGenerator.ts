import * as THREE from 'three';
import { GameMap } from '../types/game';
import { ENV_AESTHETICS, BIOMES } from '../data/environmentConfig';
import { ProceduralTreeGenerator, TreeType } from './ProceduralTreeGenerator';
import { TextureAtlas, AtlasTextureType } from './TextureAtlas';

// Procedural helpers
function seededRandom(seed: number) {
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function randomRange(min: number, max: number, seed: number) {
  return min + (max - min) * seededRandom(seed);
}

function createDeformedGeometry(geometry: THREE.BufferGeometry, amount: number, seedOffset: number) {
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vy = pos.getY(i);
    const vz = pos.getZ(i);
    const factor = (vy < 0) ? 0.2 : 1.0; 
    const nx = vx + (seededRandom(i * 3 + seedOffset) - 0.5) * amount * factor;
    const ny = vy + (seededRandom(i * 3 + 1 + seedOffset) - 0.5) * amount * factor;
    const nz = vz + (seededRandom(i * 3 + 2 + seedOffset) - 0.5) * amount * factor;
    pos.setXYZ(i, nx, ny, nz);
  }
  geometry.computeVertexNormals();
  return geometry;
}

// ---------------------------------------------------------
// ASSET FAMILIES DEFINITION
// ---------------------------------------------------------
interface FamilyVariant {
  geometry: THREE.BufferGeometry;
  secondaryGeometry?: THREE.BufferGeometry; // For objects with two parts, like trees (trunk + leaves)
}

function buildTreeFamily(): FamilyVariant[] {
  const archetypes: TreeType[] = ['FOREST', 'PINE', 'OLD', 'SMALL', 'WIDE', 'TALL'];
  const variants: FamilyVariant[] = [];

  archetypes.forEach((type, index) => {
    // Generate 2 variants for each archetype
    for (let i = 0; i < 2; i++) {
      const seed = 1000 + index * 100 + i;
      const geos = ProceduralTreeGenerator.generateGeometries({ seed, type });
      variants.push({
        geometry: geos.trunk,
        secondaryGeometry: geos.foliage
      });
    }
  });

  return variants;
}

function buildRockFamily(): FamilyVariant[] {
  const atlas = TextureAtlas.getInstance();
  
  const roundGeo = createDeformedGeometry(new THREE.DodecahedronGeometry(0.4, 0), 0.1, 5);
  roundGeo.translate(0, 0.2, 0);
  atlas.applyConsistentUVs(roundGeo, AtlasTextureType.STONES_ROUND, 0.8);

  const tallGeo = createDeformedGeometry(new THREE.IcosahedronGeometry(0.3, 0), 0.1, 6);
  tallGeo.scale(1, 1.6, 1);
  tallGeo.translate(0, 0.4, 0);
  atlas.applyConsistentUVs(tallGeo, AtlasTextureType.STONES_DARK, 0.8);

  const flatGeo = createDeformedGeometry(new THREE.IcosahedronGeometry(0.4, 0), 0.1, 7);
  flatGeo.scale(1.4, 0.5, 1.2);
  flatGeo.translate(0, 0.1, 0);
  atlas.applyConsistentUVs(flatGeo, AtlasTextureType.STONES_LIGHT, 0.8);

  return [
    { geometry: roundGeo },
    { geometry: tallGeo },
    { geometry: flatGeo }
  ];
}

function buildWallFamily(): FamilyVariant[] {
  const atlas = TextureAtlas.getInstance();
  
  const blockGeo = new THREE.BoxGeometry(1, 3.2, 1);
  blockGeo.translate(0, 1.6, 0);
  atlas.applyConsistentUVs(blockGeo, AtlasTextureType.WALL_LIGHT, 1.0);

  const chippedGeo = createDeformedGeometry(new THREE.BoxGeometry(1, 3.2, 1, 2, 4, 2), 0.1, 123);
  chippedGeo.translate(0, 1.6, 0);
  atlas.applyConsistentUVs(chippedGeo, AtlasTextureType.STONES_DARK, 1.0);

  const pillarGeo = createDeformedGeometry(new THREE.BoxGeometry(0.8, 3.4, 0.8, 2, 4, 2), 0.08, 124);
  pillarGeo.translate(0, 1.7, 0);
  atlas.applyConsistentUVs(pillarGeo, AtlasTextureType.STONES_ROUND, 1.0);

  return [
    { geometry: blockGeo },
    { geometry: chippedGeo },
    { geometry: pillarGeo }
  ];
}

function buildGrassFamily(): FamilyVariant[] {
  const atlas = TextureAtlas.getInstance();
  
  const tuftGeo = new THREE.ConeGeometry(0.15, 0.4, 3);
  tuftGeo.translate(0, 0.2, 0);
  atlas.applyUVs(tuftGeo, AtlasTextureType.GRASS);
  
  const wideGeo = new THREE.ConeGeometry(0.25, 0.3, 4);
  wideGeo.translate(0, 0.15, 0);
  atlas.applyUVs(wideGeo, AtlasTextureType.GRASS);
  
  return [
    { geometry: tuftGeo },
    { geometry: wideGeo }
  ];
}

function buildBushFamily(): FamilyVariant[] {
  const atlas = TextureAtlas.getInstance();
  
  const b1 = createDeformedGeometry(new THREE.IcosahedronGeometry(0.4, 0), 0.1, 1);
  b1.translate(0, 0.3, 0);
  atlas.applyUVs(b1, AtlasTextureType.GRASS);
  
  const b2 = createDeformedGeometry(new THREE.DodecahedronGeometry(0.5, 0), 0.1, 2);
  b2.scale(1.2, 0.8, 1);
  b2.translate(0, 0.25, 0);
  atlas.applyUVs(b2, AtlasTextureType.GRASS);
  
  return [{ geometry: b1 }, { geometry: b2 }];
}

function buildPebbleFamily(): FamilyVariant[] {
  const atlas = TextureAtlas.getInstance();
  
  const p1 = createDeformedGeometry(new THREE.DodecahedronGeometry(0.12, 0), 0.05, 1);
  p1.scale(1, 0.6, 1);
  p1.translate(0, 0.05, 0);
  atlas.applyUVs(p1, AtlasTextureType.STONES_ROUND);
  
  const p2 = createDeformedGeometry(new THREE.IcosahedronGeometry(0.1, 0), 0.03, 2);
  p2.scale(1.5, 0.5, 0.8);
  p2.translate(0, 0.04, 0);
  atlas.applyUVs(p2, AtlasTextureType.STONES_LIGHT);
  
  return [{ geometry: p1 }, { geometry: p2 }];
}

function buildMushroomFamily(): FamilyVariant[] {
  const atlas = TextureAtlas.getInstance();
  
  const stem = new THREE.CylinderGeometry(0.04, 0.06, 0.25, 5);
  stem.translate(0, 0.125, 0);
  atlas.applyUVs(stem, AtlasTextureType.WALL_LIGHT);
  
  const cap = createDeformedGeometry(new THREE.ConeGeometry(0.18, 0.15, 6), 0.02, 1);
  cap.translate(0, 0.25, 0);
  atlas.applyUVs(cap, AtlasTextureType.ROOF_TILES);
  
  const stem2 = new THREE.CylinderGeometry(0.03, 0.05, 0.15, 5);
  stem2.translate(0, 0.075, 0);
  atlas.applyUVs(stem2, AtlasTextureType.WALL_LIGHT);
  
  const cap2 = createDeformedGeometry(new THREE.DodecahedronGeometry(0.12, 0), 0.02, 2);
  cap2.scale(1, 0.5, 1);
  cap2.translate(0, 0.15, 0);
  atlas.applyUVs(cap2, AtlasTextureType.ROOF_TILES);
  
  return [
    { geometry: stem, secondaryGeometry: cap },
    { geometry: stem2, secondaryGeometry: cap2 }
  ];
}

// ---------------------------------------------------------
// MAIN GENERATOR
// ---------------------------------------------------------

function createToonGradient() {
  const colors = new Uint8Array(4 * 4);
  // 4 steps for clean, luminous fantasy lighting (no crushed dark values)
  const levels = [115, 165, 215, 255];
  for (let i = 0; i < 4; i++) {
    colors[i * 4] = levels[i];
    colors[i * 4 + 1] = levels[i];
    colors[i * 4 + 2] = levels[i];
    colors[i * 4 + 3] = 255;
  }
  const gradientMap = new THREE.DataTexture(colors, 4, 1, THREE.RGBAFormat);
  gradientMap.needsUpdate = true;
  gradientMap.minFilter = THREE.NearestFilter;
  gradientMap.magFilter = THREE.NearestFilter;
  gradientMap.generateMipmaps = false;
  return gradientMap;
}
const toonGradient = createToonGradient();

function generateBlendedTileTexture(biomeColorHex: number, isPath: boolean, theme: string): THREE.Texture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // 1. Solid fallback draw while atlas image preloads
  const r = (biomeColorHex >> 16) & 255;
  const g = (biomeColorHex >> 8) & 255;
  const b = biomeColorHex & 255;
  
  ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
  ctx.fillRect(0, 0, size, size);

  // Quick fallback noise
  for (let i = 0; i < 150; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const brightness = (Math.random() - 0.5) * 12;
    ctx.fillStyle = `rgb(${Math.max(0, Math.min(255, r + brightness))}, ${Math.max(0, Math.min(255, g + brightness + 4))}, ${Math.max(0, Math.min(255, b + brightness))})`;
    ctx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.NearestMipmapLinearFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;

  // 2. Preload your beautiful original pixel-art atlas texture to crop out exact zones
  const atlasImage = new Image();
  atlasImage.src = '/textures/atlas.jpg';
  atlasImage.onload = () => {
    const imgW = atlasImage.width;
    const imgH = atlasImage.height;
    const colW = imgW / 4;
    const rowH = imgH / 2;

    // Clear the solid fallback
    ctx.clearRect(0, 0, size, size);

    // 3. Draw your original GRASS pixel art tile (col = 1, row = 0)
    ctx.drawImage(atlasImage, colW * 1, rowH * 0, colW, rowH, 0, 0, size, size);

    // 4. Layer the path texture from the atlas (such as STONES_ROUND or STONES_LIGHT) with a feathered alpha mask
    if (isPath) {
      let pathCol = 0;
      let pathRow = 1; // STONES_ROUND as default earthy gravel road

      if (theme === 'coast') {
        pathCol = 0; pathRow = 0; // STONES_LIGHT for wet coastal sand/cobbles
      } else if (theme === 'crypt' || theme === 'ruins' || theme === 'fire_temple') {
        pathCol = 2; pathRow = 0; // STONES_DARK for ancient stone pathing
      }

      // Create offscreen canvas for the path texture
      const pathCanvas = document.createElement('canvas');
      pathCanvas.width = size;
      pathCanvas.height = size;
      const pCtx = pathCanvas.getContext('2d')!;

      // Draw the raw path texture from the atlas
      pCtx.drawImage(atlasImage, colW * pathCol, rowH * pathRow, colW, rowH, 0, 0, size, size);

      // Apply dynamic atmospheric tinting over the path stones to integrate with biome colors
      let tintR = 124, tintG = 90, tintB = 60, tintAlpha = 0.0;
      if (theme === 'coast') {
        tintR = 210; tintG = 185; tintB = 140; tintAlpha = 0.35; // Warm sand
      } else if (theme === 'crypt') {
        tintR = 60; tintG = 70; tintB = 90; tintAlpha = 0.45; // Eerie slate
      } else if (theme === 'fire_temple') {
        tintR = 130; tintG = 35; tintB = 20; tintAlpha = 0.5; // Volcanic red
      } else if (theme === 'ruins') {
        tintR = 100; tintG = 105; tintB = 120; tintAlpha = 0.3; // Dusty grey ruins
      } else if (theme === 'plains') {
        tintR = 124; tintG = 90; tintB = 60; tintAlpha = 0.2; // Muddy brown path
      }

      if (tintAlpha > 0) {
        pCtx.save();
        pCtx.fillStyle = `rgba(${tintR}, ${tintG}, ${tintB}, ${tintAlpha})`;
        pCtx.globalCompositeOperation = 'source-atop';
        pCtx.fillRect(0, 0, size, size);
        pCtx.restore();
      }

      // Use destination-in composite mode to smoothly feather the path edges (melting grass & dirt together)
      pCtx.save();
      pCtx.globalCompositeOperation = 'destination-in';
      const maskGrad = pCtx.createRadialGradient(size / 2, size / 2, size * 0.15, size / 2, size / 2, size * 0.49);
      maskGrad.addColorStop(0.0, 'rgba(0,0,0,1.0)');
      maskGrad.addColorStop(0.35, 'rgba(0,0,0,0.85)');
      maskGrad.addColorStop(0.65, 'rgba(0,0,0,0.35)');
      maskGrad.addColorStop(1.0, 'rgba(0,0,0,0.0)');

      pCtx.fillStyle = maskGrad;
      pCtx.fillRect(0, 0, size, size);
      pCtx.restore();

      // Render the feathered path directly onto our grass base
      ctx.drawImage(pathCanvas, 0, 0);
    }

    // Notify Three.js that the texture has updated with high-fidelity atlas pixels
    texture.needsUpdate = true;
  };

  return texture;
}

export class EnvironmentGenerator {
  private instances: THREE.InstancedMesh[] = [];
  private group: THREE.Group | null = null;
  
  private treeFamily = buildTreeFamily();
  
  private barkMaterial = ProceduralTreeGenerator.getTreeMaterial('bark', 123, []);
  private foliageMaterial = ProceduralTreeGenerator.getTreeMaterial('foliage', 123, []);

  private materials = {
    grass: TextureAtlas.getInstance().getMaterial(AtlasTextureType.GRASS),
    stoneBase: TextureAtlas.getInstance().getMaterial(AtlasTextureType.STONES_ROUND),
    woodBase: TextureAtlas.getInstance().getMaterial(AtlasTextureType.WOOD_BARK),
    water: new THREE.MeshToonMaterial({ color: ENV_AESTHETICS.materials.water, transparent: true, opacity: 0.85, gradientMap: toonGradient }),
    lava: new THREE.MeshToonMaterial({ color: ENV_AESTHETICS.materials.lava, emissive: 0xb91c1c, gradientMap: toonGradient }),
    wall: TextureAtlas.getInstance().getMaterial(AtlasTextureType.WALL_LIGHT),
    leaves1: this.foliageMaterial,
    trunk: this.barkMaterial,
    ore: TextureAtlas.getInstance().getMaterial(AtlasTextureType.STONES_DARK),
    herb: new THREE.MeshToonMaterial({ color: ENV_AESTHETICS.materials.herb, emissive: 0x14532d, gradientMap: toonGradient }),
    
    // Procedural Decor Materials
    bush: this.foliageMaterial,
    pebble: TextureAtlas.getInstance().getMaterial(AtlasTextureType.STONES_ROUND),
    mushroomStem: TextureAtlas.getInstance().getMaterial(AtlasTextureType.WALL_LIGHT),
    mushroomCap: TextureAtlas.getInstance().getMaterial(AtlasTextureType.ROOF_TILES),
  };

  constructor() {
    // Apply toon gradient to all atlas materials for consistent lighting
    Object.values(this.materials).forEach(mat => {
      if (mat instanceof THREE.MeshToonMaterial && mat.map && mat.map.name.includes('atlas')) {
        mat.gradientMap = toonGradient;
      }
    });
  }

  private rockFamily = buildRockFamily();
  private wallFamily = buildWallFamily();
  private grassFamily = buildGrassFamily();
  private bushFamily = buildBushFamily();
  private pebbleFamily = buildPebbleFamily();
  private mushroomFamily = buildMushroomFamily();

  public clear() {
    this.instances.forEach((instance: any) => {
      if (this.group) this.group.remove(instance);
      if (instance.geometry) instance.geometry.dispose();
      if (instance.material) {
        if (Array.isArray(instance.material)) {
          instance.material.forEach((m: any) => {
            if (m.map) m.map.dispose();
            m.dispose();
          });
        } else {
          if (instance.material.map) instance.material.map.dispose();
          instance.material.dispose();
        }
      }
    });
    this.instances = [];
  }

  public buildMap(map: GameMap, parentGroup: THREE.Group) {
    this.clear();
    this.group = parentGroup;

    const biome = BIOMES[map.theme] || BIOMES['plains'];

    // Dynamically generate procedural canvas textures for ground and blended route
    const grassTex = generateBlendedTileTexture(biome.groundColor, false, map.theme);
    const pathTex = generateBlendedTileTexture(biome.groundColor, true, map.theme);

    const grassMat = new THREE.MeshToonMaterial({
      map: grassTex,
      gradientMap: toonGradient,
      side: THREE.DoubleSide
    });

    const pathMat = new THREE.MeshToonMaterial({
      map: pathTex,
      gradientMap: toonGradient,
      side: THREE.DoubleSide
    });
    
    if (biome.wallColor) {
       this.materials.wall.color.setHex(biome.wallColor);
    } else {
       // Reset to default if not specified
       this.materials.wall.color.setHex(ENV_AESTHETICS.materials.defaultWall);
    }

    type PropType = 'ground' | 'path' | 'wall' | 'water' | 'stone' | 'wood' | 'tree' | 'ore' | 'herb' | 'grassTuft' | 'bush' | 'pebble' | 'mushroom';
    
    interface PropPlacement {
      x: number;
      y: number;
      type: PropType;
      variant: number;
      seed: number;
    }

    const placements: PropPlacement[] = [];

    // Parse base map tiles
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        let tile = map.tiles[y]?.[x] ?? 0;
        const seed = x * 1000 + y;
        
        // 1. Enforce Natural Boundaries (Biome Override)
        if (tile === 1 && biome.boundaryReplacement !== undefined) {
           tile = biome.boundaryReplacement;
        }
        
        if (tile === 0) {
          placements.push({ x, y, type: 'ground', variant: 0, seed });
          
          // 2. Biome Decor Generation
          if (biome.decorDensity > 0 && seededRandom(seed) < biome.decorDensity) {
             const decorType = biome.allowedDecor[Math.floor(randomRange(0, biome.allowedDecor.length, seed + 1))] as PropType;
             
             let variant = 0;
             if (decorType === 'grassTuft') variant = Math.floor(randomRange(0, this.grassFamily.length, seed));
             else if (decorType === 'bush') variant = Math.floor(randomRange(0, this.bushFamily.length, seed));
             else if (decorType === 'pebble') variant = Math.floor(randomRange(0, this.pebbleFamily.length, seed));
             else if (decorType === 'mushroom') variant = Math.floor(randomRange(0, this.mushroomFamily.length, seed));
             
             placements.push({ x, y, type: decorType, variant, seed });
          }
        }
        else if (tile === 1) {
          const variant = Math.floor(randomRange(0, this.wallFamily.length, seed));
          placements.push({ x, y, type: 'wall', variant, seed });
        }
        else if (tile === 2) {
          placements.push({ x, y, type: 'water', variant: 0, seed });
        }
        else if (tile === 3) {
          placements.push({ x, y, type: 'stone', variant: 0, seed });
        }
        else if (tile === 4) {
          placements.push({ x, y, type: 'wood', variant: 0, seed });
        }
        else if (tile === 5) {
          placements.push({ x, y, type: 'ground', variant: 0, seed });
          const variant = Math.floor(randomRange(0, this.treeFamily.length, seed));
          placements.push({ x, y, type: 'tree', variant, seed });
        }
        else if (tile === 6) {
          placements.push({ x, y, type: 'ground', variant: 0, seed });
          const variant = Math.floor(randomRange(0, this.rockFamily.length, seed));
          placements.push({ x, y, type: 'ore', variant, seed });
        }
        else if (tile === 8) {
          placements.push({ x, y, type: 'path', variant: 0, seed });
        }
      }
    }

    // Parse gather nodes
    map.gatherNodes.forEach(node => {
      if (!node.harvested) {
        const seed = node.x * 100 + node.y;
        if (node.type === 'tree') {
          const variant = Math.floor(randomRange(0, this.treeFamily.length, seed));
          placements.push({ x: node.x, y: node.y, type: 'tree', variant, seed });
        } else if (node.type === 'ore') {
          const variant = Math.floor(randomRange(0, this.rockFamily.length, seed));
          placements.push({ x: node.x, y: node.y, type: 'ore', variant, seed });
        } else {
          placements.push({ x: node.x, y: node.y, type: 'herb', variant: 0, seed });
        }
      }
    });

    // Helper to spawn a family
    const spawnFamily = (typeFilter: string, family: FamilyVariant[], mat1: THREE.Material, mat2?: THREE.Material, positionYOffset: number = 0) => {
      const filtered = placements.filter(p => p.type === typeFilter);
      if (filtered.length === 0) return;

      const variance = ENV_AESTHETICS.objectVariances[typeFilter] || { scaleMin: 0.9, scaleMax: 1.1, scatterRadius: 0, wobbleRotation: 0 };

      for (let v = 0; v < family.length; v++) {
        const variantPlacements = filtered.filter(p => p.variant === v);
        if (variantPlacements.length === 0) continue;

        const mesh1 = new THREE.InstancedMesh(family[v].geometry, mat1, variantPlacements.length);
        mesh1.castShadow = true;
        mesh1.receiveShadow = true;
        this.group!.add(mesh1);
        this.instances.push(mesh1);

        let mesh2: THREE.InstancedMesh | null = null;
        if (family[v].secondaryGeometry && mat2) {
          mesh2 = new THREE.InstancedMesh(family[v].secondaryGeometry, mat2, variantPlacements.length);
          mesh2.castShadow = true;
          this.group!.add(mesh2);
          this.instances.push(mesh2);
        }

        const dummy = new THREE.Object3D();
        let i = 0;
        variantPlacements.forEach(p => {
          dummy.position.set(p.x, positionYOffset, p.y);
          
          // Apply configured variance
          const scale = randomRange(variance.scaleMin, variance.scaleMax, p.seed);
          dummy.scale.set(
            typeFilter === 'tree' ? scale : scale,
            typeFilter === 'tree' ? randomRange(variance.scaleMin, variance.scaleMax, p.seed+1) : scale,
            typeFilter === 'tree' ? scale : scale
          );
          
          dummy.rotation.set(
             randomRange(-variance.wobbleRotation, variance.wobbleRotation, p.seed+1),
             randomRange(0, Math.PI*2, p.seed+2),
             0
          );
          
          if (variance.scatterRadius > 0) {
             dummy.position.x += randomRange(-variance.scatterRadius, variance.scatterRadius, p.seed + 3);
             dummy.position.z += randomRange(-variance.scatterRadius, variance.scatterRadius, p.seed + 4);
          }

          if (typeFilter === 'wall') {
             dummy.scale.set(1, randomRange(variance.scaleMin, variance.scaleMax, p.seed), 1);
             dummy.rotation.set(0, 0, 0); 
          }

          dummy.updateMatrix();
          mesh1.setMatrixAt(i, dummy.matrix);

          if (mesh2) {
            if (typeFilter === 'tree') {
               dummy.rotation.set(
                 randomRange(-variance.wobbleRotation, variance.wobbleRotation, p.seed+3),
                 randomRange(0, Math.PI * 2, p.seed+4),
                 randomRange(-variance.wobbleRotation, variance.wobbleRotation, p.seed+5)
               );
               dummy.updateMatrix();
            } else if (typeFilter === 'mushroom') {
               dummy.rotation.set(
                 randomRange(-variance.wobbleRotation, variance.wobbleRotation, p.seed+3),
                 randomRange(0, Math.PI * 2, p.seed+4),
                 randomRange(-variance.wobbleRotation, variance.wobbleRotation, p.seed+5)
               );
               dummy.updateMatrix();
            }
            mesh2.setMatrixAt(i, dummy.matrix);
          }
          i++;
        });
      }
    };

    // Spawn Families
    spawnFamily('wall', this.wallFamily, this.materials.wall);
    spawnFamily('tree', this.treeFamily, this.materials.trunk, this.materials.leaves1);
    spawnFamily('ore', this.rockFamily, this.materials.ore);
    spawnFamily('grassTuft', this.grassFamily, this.materials.leaves1);
    spawnFamily('bush', this.bushFamily, this.materials.bush);
    spawnFamily('pebble', this.pebbleFamily, this.materials.pebble);
    spawnFamily('mushroom', this.mushroomFamily, this.materials.mushroomStem, this.materials.mushroomCap);

    // Handle generic single-variant tiles/items
    const dummy = new THREE.Object3D();
    const spawnSingle = (typeFilter: string, geo: THREE.BufferGeometry, mat: THREE.Material, posY: number, receiveShadow: boolean, varianceKey?: string) => {
      const filtered = placements.filter(p => p.type === typeFilter);
      if (filtered.length === 0) return;
      const variance = varianceKey ? ENV_AESTHETICS.objectVariances[varianceKey] : null;
      
      const mesh = new THREE.InstancedMesh(geo, mat, filtered.length);
      mesh.receiveShadow = receiveShadow;
      if (variance) mesh.castShadow = true;
      let i = 0;
      filtered.forEach(p => {
        dummy.position.set(p.x, posY, p.y);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        
        if (variance) {
          dummy.scale.setScalar(randomRange(variance.scaleMin, variance.scaleMax, p.seed));
          dummy.rotation.set(0, randomRange(0, Math.PI*2, p.seed+1), 0);
        }
        
        dummy.updateMatrix();
        mesh.setMatrixAt(i++, dummy.matrix);
      });
      this.group!.add(mesh);
      this.instances.push(mesh);
    };

    // Flat planes
    const createPlaneWithUV = (type: AtlasTextureType) => {
      const geo = new THREE.PlaneGeometry(1, 1);
      geo.rotateX(-Math.PI / 2);
      // Using 1,1 repeat because map tiles are already 1x1 world units
      TextureAtlas.getInstance().applyUVs(geo, type, 1, 1);
      return geo;
    };
    
    const planeGeo = new THREE.PlaneGeometry(1, 1);
    planeGeo.rotateX(-Math.PI / 2);
    
    spawnSingle('ground', planeGeo, grassMat, ENV_AESTHETICS.terrain.groundHeight, true);
    spawnSingle('path', planeGeo, pathMat, ENV_AESTHETICS.terrain.groundHeight, true);
    spawnSingle('water', planeGeo, map.theme === 'fire_temple' ? this.materials.lava : this.materials.water, ENV_AESTHETICS.terrain.waterHeight, true);
    spawnSingle('stone', createPlaneWithUV(AtlasTextureType.STONES_ROUND), this.materials.stoneBase, ENV_AESTHETICS.terrain.stoneHeight, true);
    spawnSingle('wood', createPlaneWithUV(AtlasTextureType.WOOD_BARK), this.materials.woodBase, ENV_AESTHETICS.terrain.woodHeight, true);

    // Herbs (Single variant cone)
    const herbGeo = new THREE.ConeGeometry(0.3, 0.6, 4);
    herbGeo.translate(0, 0.3, 0);
    spawnSingle('herb', herbGeo, this.materials.herb, 0, false, 'herb');

    this.buildDynamicObjects(map);
  }

  public buildDynamicObjects(map: GameMap) {
    // Portals
    map.portals.forEach(portal => {
      const portalGeo = new THREE.CylinderGeometry(0.5, 0.6, 0.1, 8);
      const portalMat = new THREE.MeshToonMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        gradientMap: toonGradient
      });
      const portalMesh = new THREE.Mesh(portalGeo, portalMat);
      portalMesh.position.set(portal.x, 0.05, portal.y);
      this.group!.add(portalMesh);
      this.instances.push(portalMesh as any);

      const pLight = new THREE.PointLight(0x38bdf8, 1.0, 4);
      pLight.position.set(portal.x, 0.8, portal.y);
      this.group!.add(pLight);
      this.instances.push(pLight as any);
    });

    // Chests
    map.chests.forEach(chest => {
      const chestMat = new THREE.MeshToonMaterial({
        color: chest.isOpened ? 0x78716c : 0xf59e0b,
        gradientMap: toonGradient
      });
      const cMesh = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.6), chestMat);
      cMesh.position.set(chest.x, 0.25, chest.y);
      cMesh.castShadow = true;
      this.group!.add(cMesh);
      this.instances.push(cMesh as any);
    });
  }
}
