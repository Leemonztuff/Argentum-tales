import * as THREE from 'three';
import { GameMap } from '../types/game';
import { ENV_AESTHETICS, BIOMES } from '../data/environmentConfig';

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
  const oakTrunk = createDeformedGeometry(new THREE.CylinderGeometry(0.15, 0.25, 1.2, 5), 0.05, 1);
  oakTrunk.translate(0, 0.6, 0);
  const oakLeaves = createDeformedGeometry(new THREE.DodecahedronGeometry(0.8, 0), 0.2, 2);
  oakLeaves.translate(0, 1.5, 0);

  const pineTrunk = createDeformedGeometry(new THREE.CylinderGeometry(0.1, 0.2, 1.8, 5), 0.05, 10);
  pineTrunk.translate(0, 0.9, 0);
  const pineLeaves = createDeformedGeometry(new THREE.ConeGeometry(0.7, 1.6, 5), 0.1, 11);
  pineLeaves.translate(0, 1.8, 0);

  const bushTrunk = createDeformedGeometry(new THREE.CylinderGeometry(0.2, 0.3, 0.7, 5), 0.05, 20);
  bushTrunk.translate(0, 0.35, 0);
  const bushLeaves = createDeformedGeometry(new THREE.IcosahedronGeometry(0.7, 0), 0.15, 21);
  bushLeaves.scale(1.2, 0.8, 1.2);
  bushLeaves.translate(0, 1.0, 0);

  return [
    { geometry: oakTrunk, secondaryGeometry: oakLeaves },
    { geometry: pineTrunk, secondaryGeometry: pineLeaves },
    { geometry: bushTrunk, secondaryGeometry: bushLeaves }
  ];
}

function buildRockFamily(): FamilyVariant[] {
  const roundGeo = createDeformedGeometry(new THREE.DodecahedronGeometry(0.4, 0), 0.1, 5);
  roundGeo.translate(0, 0.2, 0);

  const tallGeo = createDeformedGeometry(new THREE.IcosahedronGeometry(0.3, 0), 0.1, 6);
  tallGeo.scale(1, 1.6, 1);
  tallGeo.translate(0, 0.4, 0);

  const flatGeo = createDeformedGeometry(new THREE.IcosahedronGeometry(0.4, 0), 0.1, 7);
  flatGeo.scale(1.4, 0.5, 1.2);
  flatGeo.translate(0, 0.1, 0);

  return [
    { geometry: roundGeo },
    { geometry: tallGeo },
    { geometry: flatGeo }
  ];
}

function buildWallFamily(): FamilyVariant[] {
  const blockGeo = new THREE.BoxGeometry(1, 3.2, 1);
  blockGeo.translate(0, 1.6, 0);

  const chippedGeo = createDeformedGeometry(new THREE.BoxGeometry(1, 3.2, 1, 2, 4, 2), 0.1, 123);
  chippedGeo.translate(0, 1.6, 0);

  const pillarGeo = createDeformedGeometry(new THREE.BoxGeometry(0.8, 3.4, 0.8, 2, 4, 2), 0.08, 124);
  pillarGeo.translate(0, 1.7, 0);

  return [
    { geometry: blockGeo },
    { geometry: chippedGeo },
    { geometry: pillarGeo }
  ];
}

function buildGrassFamily(): FamilyVariant[] {
  const tuftGeo = new THREE.ConeGeometry(0.15, 0.4, 3);
  tuftGeo.translate(0, 0.2, 0);
  const wideGeo = new THREE.ConeGeometry(0.25, 0.3, 4);
  wideGeo.translate(0, 0.15, 0);
  return [
    { geometry: tuftGeo },
    { geometry: wideGeo }
  ];
}

function buildBushFamily(): FamilyVariant[] {
  const b1 = createDeformedGeometry(new THREE.IcosahedronGeometry(0.4, 0), 0.1, 1);
  b1.translate(0, 0.3, 0);
  const b2 = createDeformedGeometry(new THREE.DodecahedronGeometry(0.5, 0), 0.1, 2);
  b2.scale(1.2, 0.8, 1);
  b2.translate(0, 0.25, 0);
  return [{ geometry: b1 }, { geometry: b2 }];
}

function buildPebbleFamily(): FamilyVariant[] {
  const p1 = createDeformedGeometry(new THREE.DodecahedronGeometry(0.12, 0), 0.05, 1);
  p1.scale(1, 0.6, 1);
  p1.translate(0, 0.05, 0);
  const p2 = createDeformedGeometry(new THREE.IcosahedronGeometry(0.1, 0), 0.03, 2);
  p2.scale(1.5, 0.5, 0.8);
  p2.translate(0, 0.04, 0);
  return [{ geometry: p1 }, { geometry: p2 }];
}

function buildMushroomFamily(): FamilyVariant[] {
  const stem = new THREE.CylinderGeometry(0.04, 0.06, 0.25, 5);
  stem.translate(0, 0.125, 0);
  const cap = createDeformedGeometry(new THREE.ConeGeometry(0.18, 0.15, 6), 0.02, 1);
  cap.translate(0, 0.25, 0);
  
  const stem2 = new THREE.CylinderGeometry(0.03, 0.05, 0.15, 5);
  stem2.translate(0, 0.075, 0);
  const cap2 = createDeformedGeometry(new THREE.DodecahedronGeometry(0.12, 0), 0.02, 2);
  cap2.scale(1, 0.5, 1);
  cap2.translate(0, 0.15, 0);
  
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

function createProceduralNormalMap(type: 'stone' | 'wall' | 'grass' | 'wood'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  const size = 128;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      let nx = 0;
      let ny = 0;

      if (type === 'stone') {
        // Cobblestone grid with rounded bevels
        const gx = (x % 32) - 16;
        const gy = (y % 32) - 16;
        const dist = Math.sqrt(gx * gx + gy * gy) / 16;
        if (dist < 1.0) {
          nx = (gx / 16) * (1.0 - dist);
          ny = (gy / 16) * (1.0 - dist);
        }
      } else if (type === 'wall') {
        // Brick / Mortar grid pattern
        const brickH = 16;
        const brickW = 32;
        const row = Math.floor(y / brickH);
        const shift = (row % 2) * (brickW / 2);
        const bx = ((x + shift) % brickW) - (brickW / 2);
        const by = (y % brickH) - (brickH / 2);
        const edgeX = Math.abs(bx) / (brickW / 2);
        const edgeY = Math.abs(by) / (brickH / 2);
        
        if (edgeX > 0.8 || edgeY > 0.8) {
          nx = Math.sign(bx) * 0.6;
          ny = Math.sign(by) * 0.6;
        }
      } else if (type === 'wood') {
        // Wood grain ridges
        const wave = Math.sin(x * 0.3 + Math.sin(y * 0.05) * 4.0);
        nx = wave * 0.5;
        ny = Math.cos(y * 0.1) * 0.2;
      } else {
        // Grass micro-texture
        nx = (Math.sin(x * 0.8) + Math.cos(y * 0.5)) * 0.2;
        ny = (Math.cos(x * 0.5) + Math.sin(y * 0.8)) * 0.2;
      }

      const r = Math.floor((nx * 0.5 + 0.5) * 255);
      const g = Math.floor((ny * 0.5 + 0.5) * 255);
      const b = 255;

      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.needsUpdate = true;
  return tex;
}

const stoneNormalMap = createProceduralNormalMap('stone');
const wallNormalMap = createProceduralNormalMap('wall');
const woodNormalMap = createProceduralNormalMap('wood');

export class EnvironmentGenerator {
  private instances: THREE.InstancedMesh[] = [];
  private group: THREE.Group | null = null;
  
  private materials = {
    grass: new THREE.MeshToonMaterial({ color: 0x48793b, gradientMap: toonGradient }),
    stoneBase: new THREE.MeshToonMaterial({ color: ENV_AESTHETICS.materials.stoneBase, gradientMap: toonGradient, normalMap: stoneNormalMap, normalScale: new THREE.Vector2(0.8, 0.8) }),
    woodBase: new THREE.MeshToonMaterial({ color: ENV_AESTHETICS.materials.woodBase, gradientMap: toonGradient, normalMap: woodNormalMap, normalScale: new THREE.Vector2(0.6, 0.6) }),
    water: new THREE.MeshToonMaterial({ color: ENV_AESTHETICS.materials.water, transparent: true, opacity: 0.85, gradientMap: toonGradient }),
    lava: new THREE.MeshToonMaterial({ color: ENV_AESTHETICS.materials.lava, emissive: 0xb91c1c, gradientMap: toonGradient }),
    wall: new THREE.MeshToonMaterial({ color: ENV_AESTHETICS.materials.defaultWall, gradientMap: toonGradient, normalMap: wallNormalMap, normalScale: new THREE.Vector2(1.2, 1.2) }),
    leaves1: new THREE.MeshToonMaterial({ color: ENV_AESTHETICS.materials.leaves, gradientMap: toonGradient }),
    trunk: new THREE.MeshToonMaterial({ color: ENV_AESTHETICS.materials.trunk, gradientMap: toonGradient, normalMap: woodNormalMap, normalScale: new THREE.Vector2(0.5, 0.5) }),
    ore: new THREE.MeshToonMaterial({ color: ENV_AESTHETICS.materials.ore, gradientMap: toonGradient }),
    herb: new THREE.MeshToonMaterial({ color: ENV_AESTHETICS.materials.herb, emissive: 0x14532d, gradientMap: toonGradient }),
    
    // Procedural Decor Materials
    bush: new THREE.MeshToonMaterial({ color: ENV_AESTHETICS.materials.bush, gradientMap: toonGradient }),
    pebble: new THREE.MeshToonMaterial({ color: ENV_AESTHETICS.materials.pebble, gradientMap: toonGradient, normalMap: stoneNormalMap, normalScale: new THREE.Vector2(0.5, 0.5) }),
    mushroomStem: new THREE.MeshToonMaterial({ color: ENV_AESTHETICS.materials.mushroomStem, gradientMap: toonGradient }),
    mushroomCap: new THREE.MeshToonMaterial({ color: ENV_AESTHETICS.materials.mushroomCap, gradientMap: toonGradient }),
  };

  private treeFamily = buildTreeFamily();
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
          instance.material.forEach((m: any) => m.dispose());
        } else {
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

    // Apply Biome Colors
    this.materials.grass.color.setHex(biome.groundColor);
    if (biome.wallColor) {
       this.materials.wall.color.setHex(biome.wallColor);
    } else {
       // Reset to default if not specified
       this.materials.wall.color.setHex(ENV_AESTHETICS.materials.defaultWall);
    }

    type PropType = 'ground' | 'wall' | 'water' | 'stone' | 'wood' | 'tree' | 'ore' | 'herb' | 'grassTuft' | 'bush' | 'pebble' | 'mushroom';
    
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
    const planeGeo = new THREE.PlaneGeometry(1, 1);
    planeGeo.rotateX(-Math.PI / 2);
    
    spawnSingle('ground', planeGeo, this.materials.grass, ENV_AESTHETICS.terrain.groundHeight, true);
    spawnSingle('water', planeGeo, map.theme === 'fire_temple' ? this.materials.lava : this.materials.water, ENV_AESTHETICS.terrain.waterHeight, true);
    spawnSingle('stone', planeGeo, this.materials.stoneBase, ENV_AESTHETICS.terrain.stoneHeight, true);
    spawnSingle('wood', planeGeo, this.materials.woodBase, ENV_AESTHETICS.terrain.woodHeight, true);

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
