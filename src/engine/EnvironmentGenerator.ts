import * as THREE from 'three';
import { GameMap } from '../types/game';
import { ENV_AESTHETICS, BIOMES } from '../data/environmentConfig';
import { ProceduralTreeGenerator, TreeType } from './ProceduralTreeGenerator';
import { ProceduralBuildingGenerator, BuildingFootprint } from './ProceduralBuildingGenerator';
import { PropFamilyGenerator, PropFamily } from './PropFamilyGenerator';
import { TextureAtlas, AtlasTextureType } from './TextureAtlas';
import { NEW_TEXTURE_SHEETS, type CainosSheet, type SpriteCell } from '../data/newTextureManifest';

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
  applySideRepeatUVs(blockGeo, 1, 3.2);

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

interface PropFamilyVariant {
  geometry: THREE.BufferGeometry;
  materials: THREE.MeshToonMaterial[];
}

function buildAllPropFamilies(): Record<PropFamily, PropFamilyVariant[]> {
  const types: PropFamily[] = ['crate', 'barrel', 'bench', 'fence', 'crate_stack'];
  const result = {} as Record<PropFamily, PropFamilyVariant[]>;
  types.forEach((t, ti) => {
    // 3 variants per family, bounded deterministic seeds
    result[t] = [0, 1, 2].map((i) => {
      const res = PropFamilyGenerator.generate(t, 7000 + ti * 100 + i);
      return { geometry: res.geometry, materials: res.materials };
    });
  });
  return result;
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

// ---------------------------------------------------------
// STYLIZED FLUID MATERIAL (world-art §8)
// Slow, readable wave-band motion painted into the toon
// shading — no expensive vertex displacement (no cracked
// tile seams), no bloom, no realism. uTime is advanced by
// EnvironmentGenerator.update() each frame.
// ---------------------------------------------------------
function createFluidMaterial(
  uniforms: { value: number }[],
  opts: { color: number; emissive?: number; transparent?: boolean; opacity?: number; lava?: boolean }
): THREE.MeshToonMaterial {
  const uniform = { value: 0 };
  uniforms.push(uniform);

  const mat = new THREE.MeshToonMaterial({
    color: opts.color,
    gradientMap: toonGradient,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
    emissive: opts.emissive ?? 0x000000,
  });

  const fluidFrag = opts.lava
    ? `
float pulse = 0.5 + 0.5 * sin(uTime * 1.7 + (vWorldPos.x + vWorldPos.z) * 0.65);
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.98, 0.55, 0.18), pulse * 0.55);
diffuseColor.rgb += vec3(pulse * 0.12);
`
    : `
float band = sin(vWorldPos.x * 2.3 + uTime * 1.2) + sin(vWorldPos.z * 2.9 + uTime * 0.9);
band *= 0.5;
float lift = smoothstep(0.3, 1.0, band);
float shimmer = smoothstep(0.72, 1.0, band);
diffuseColor.rgb *= mix(0.9, 1.12, lift);
diffuseColor.rgb += vec3(shimmer * 0.14);
`;

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniform;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWorldPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWorldPos = (modelMatrix * vec4( transformed, 1.0 )).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;\nvarying vec3 vWorldPos;')
      .replace('#include <lights_fragment>', fluidFrag + '\n#include <lights_fragment>');
    mat.userData.shader = shader;
  };

  return mat;
}

// Worn dirt patch decal — feathered pixel-art brown with soft
// edges, laid over grass next to roads (world-art §13/§14).
function createDirtPatchMaterial(): THREE.MeshToonMaterial {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#4a3a27';
  ctx.fillRect(0, 0, size, size);
  const shades = ['#3d2f1f', '#55452f', '#433324', '#5c4a32'];
  for (let i = 0; i < 260; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle = shades[Math.floor(Math.random() * shades.length)];
    ctx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }

  ctx.save();
  ctx.globalCompositeOperation = 'destination-in';
  const grad = ctx.createRadialGradient(size / 2, size / 2, size * 0.1, size / 2, size / 2, size * 0.5);
  grad.addColorStop(0, 'rgba(0,0,0,1)');
  grad.addColorStop(0.4, 'rgba(0,0,0,0.8)');
  grad.addColorStop(0.75, 'rgba(0,0,0,0.15)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.needsUpdate = true;
  return new THREE.MeshToonMaterial({ map: texture, transparent: true, gradientMap: toonGradient });
}

// ---------------------------------------------------------
// CAINOS WORLD-ART SUPPORT ("Pixel Art Top Down - Basic")
// Shares images across every tile/texture generation; slices
// spritesheet cells into pixel-perfect billboard textures.
// ---------------------------------------------------------

const cainosImageCache = new Map<string, HTMLImageElement>();
function getCainosImage(url: string): HTMLImageElement {
  let img = cainosImageCache.get(url);
  if (!img) {
    img = new Image();
    img.src = url;
    cainosImageCache.set(url, img);
  }
  return img;
}

// Ground tiles: the seamless 128x128 sub-tiles of the Cainos ground tilesets,
// used as the base for every blended road/plaza tile texture ('stone' floor).
const sharedGrassTileImage: HTMLImageElement | null = (() => {
  if (typeof document === 'undefined') return null;
  return getCainosImage(NEW_TEXTURE_SHEETS.tileset_grass.path);
})();
const sharedStoneTileImage: HTMLImageElement | null = (() => {
  if (typeof document === 'undefined') return null;
  return getCainosImage(NEW_TEXTURE_SHEETS.tileset_stone.path);
})();

// Pixel-perfect destination size for a slice cell (mirrors renderSpriteCanvas).
function spriteSliceDims(bbox: { x: number; y: number; w: number; h: number }): { destW: number; destH: number } {
  const scale = Math.min(220 / bbox.w, 180 / bbox.h);
  return {
    destW: Math.max(1, Math.floor(bbox.w * scale)),
    destH: Math.max(1, Math.floor(bbox.h * scale)),
  };
}

// Draw a single spritesheet cell (bbox) centered into a pixel-art canvas with
// its feet pinned at y=242 — mirrors renderSpriteCanvas sizing/anchoring so
// billboards share the exact density and grounding convention as mob sprites.
function drawSpriteSlice(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  bbox: { x: number; y: number; w: number; h: number },
  canvasSize: number
): { destW: number; destH: number } {
  const { destW, destH } = spriteSliceDims(bbox);
  const destX = Math.floor((canvasSize - destW) / 2);
  const destY = Math.max(24, Math.floor(242 - destH));
  ctx.clearRect(0, 0, canvasSize, canvasSize);
  ctx.imageSmoothingEnabled = false;
  if (img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, bbox.x, bbox.y, bbox.w, bbox.h, destX, destY, destW, destH);
  }
  return { destW, destH };
}

// Billboard sprite texture: 256x256 slice of a Cainos sheet, pixel-perfect
// (Nearest filtering, no mipmaps, uppercase colorSpace). Redraws on load.
function createBillboardTexture(sheet: CainosSheet, cell: SpriteCell): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = false;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  const image = getCainosImage(sheet.path);
  const redraw = () => {
    drawSpriteSlice(ctx, image, cell.bbox, 256);
    texture.needsUpdate = true;
  };
  if (image.complete && image.naturalWidth > 0) redraw();
  else image.addEventListener('load', redraw, { once: true });
  return texture;
}

// World-art mapping: which sheet cell(s) replace each 3D decor family.
interface BillboardDecorConfig {
  sheet: string;
  cells: string[];
  height?: number;
  width?: number;
  variance: [number, number];
  scatter: number;
  castShadow?: boolean;
}
const DECOR_BILLBOARD_MAP: Record<string, BillboardDecorConfig> = {
  tree:      { sheet: 'plant', cells: ['tree_0', 'tree_1', 'tree_2'], height: 2.8, variance: [0.8, 1.2], scatter: 0, castShadow: true },
  bush:      { sheet: 'plant', cells: ['plant_2', 'plant_3', 'plant_4', 'plant_5'], height: 0.95, variance: [0.6, 1.4], scatter: 0.4 },
  grassTuft: { sheet: 'plant', cells: ['grass_0', 'grass_1', 'grass_2', 'grass_3', 'grass_4', 'grass_5', 'grass_6', 'grass_7'], width: 1.1, variance: [0.6, 1.4], scatter: 0.4 },
  pebble:    { sheet: 'props', cells: ['prop_9', 'prop_10', 'prop_13', 'prop_14', 'prop_15'], width: 0.8, variance: [0.6, 1.4], scatter: 0.4 },
};

interface DecorPlacement {
  x: number;
  y: number;
  type: string;
  variant: number;
  seed: number;
}

// Scale UVs on the vertical side faces of a BoxGeometry so a tile texture
// repeats V times along world-Y. BoxGeometry groups: 0=+x, 1=-x, 2=+y,
// 3=-y, 4=+z, 5=-z; the v-component of side faces follows world Y.
function applySideRepeatUVs(geometry: THREE.BufferGeometry, uRepeat: number, vRepeat: number): void {
  const uv = geometry.attributes.uv as THREE.BufferAttribute;
  const groups = geometry.groups;
  const sideGroups = [0, 1, 4, 5];
  for (const groupId of sideGroups) {
    const group = groups.find((g) => g.materialIndex === groupId);
    if (!group) continue;
    for (let i = group.start; i < group.start + group.count; i++) {
      uv.setXY(i, uv.getX(i) * uRepeat, uv.getY(i) * vRepeat);
    }
  }
  uv.needsUpdate = true;
}

// Wall block texture: crop the TX Tileset Wall "wall_main" region (32,32 →
// 232x128 native) onto a canvas so the whole free-textured face can tile.
function createWallTileMaterial(): THREE.MeshToonMaterial {
  const sheet = NEW_TEXTURE_SHEETS.tileset_wall;
  const cell = sheet.cells.find((c) => c.id === 'wall_main');
  const bbox = cell ? cell.bbox : { x: 34, y: 32, w: 232, h: 128 };
  const canvas = document.createElement('canvas');
  canvas.width = bbox.w;
  canvas.height = bbox.h;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = false;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  const image = getCainosImage(sheet.path);
  const redraw = () => {
    if (image.complete && image.naturalWidth > 0) {
      ctx.clearRect(0, 0, bbox.w, bbox.h);
      ctx.drawImage(image, bbox.x, bbox.y, bbox.w, bbox.h, 0, 0, bbox.w, bbox.h);
      texture.needsUpdate = true;
    }
  };
  if (image.complete && image.naturalWidth > 0) redraw();
  else image.addEventListener('load', redraw, { once: true });
  return new THREE.MeshToonMaterial({ map: texture, gradientMap: toonGradient, side: THREE.DoubleSide });
}

// Stone plaza/floor material: the seamless 128x128 Cainos stone sub-tile,
// upscaled to the ground-tile density (184ppu) and tiling.
function createStoneFloorMaterial(): THREE.MeshToonMaterial {
  const tileSize = 184;
  const canvas = document.createElement('canvas');
  canvas.width = tileSize;
  canvas.height = tileSize;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = false;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  const image = sharedStoneTileImage ?? getCainosImage(NEW_TEXTURE_SHEETS.tileset_stone.path);
  const redraw = () => {
    if (image.complete && image.naturalWidth > 0) {
      ctx.clearRect(0, 0, tileSize, tileSize);
      ctx.drawImage(image, 0, 0, 128, 128, 0, 0, tileSize, tileSize);
      texture.needsUpdate = true;
    }
  };
  if (image.complete && image.naturalWidth > 0) redraw();
  else image.addEventListener('load', redraw, { once: true });
  return new THREE.MeshToonMaterial({ map: texture, gradientMap: toonGradient, side: THREE.DoubleSide });
}



function generateBlendedTileTexture(biomeColorHex: number, isPath: boolean, theme: string): THREE.Texture {
  // 184px cell = atlas.jpg cell size (736x368 / 4x2), keeping generated
  // ground tiles at the exact same native density as static stone/wood
  // planes (world-art §5 pixel-density coherence). 1:1 draw, no resample.
  const size = 184;
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

  // 2. Reuse the shared Cainos ground tiles (full-bleed 256x256) for the base
  const drawFromTiles = () => {
    if (!sharedGrassTileImage || !sharedStoneTileImage) return;
    if (!sharedGrassTileImage.complete || sharedGrassTileImage.naturalWidth === 0) return;
    if (!sharedStoneTileImage.complete || sharedStoneTileImage.naturalWidth === 0) return;

    // Clear the solid fallback
    ctx.clearRect(0, 0, size, size);

    // 3. Cainos GRASS sub-tile (128x128 seam-free) as the base ground
    ctx.drawImage(sharedGrassTileImage, 0, 0, 128, 128, 0, 0, size, size);

    // 4. Cainos STONE GROUND sub-tile (128x128) as the path layer with a feathered alpha mask
    if (isPath) {
      // Create offscreen canvas for the path texture
      const pathCanvas = document.createElement('canvas');
      pathCanvas.width = size;
      pathCanvas.height = size;
      const pCtx = pathCanvas.getContext('2d')!;

      // Draw the raw stone tile
      pCtx.drawImage(sharedStoneTileImage, 0, 0, 128, 128, 0, 0, size, size);

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

  if (sharedGrassTileImage && sharedStoneTileImage) {
    const readyNow = sharedGrassTileImage.complete && sharedGrassTileImage.naturalWidth > 0
      && sharedStoneTileImage.complete && sharedStoneTileImage.naturalWidth > 0;
    if (readyNow) {
      drawFromTiles();
    } else {
      sharedGrassTileImage.addEventListener('load', drawFromTiles, { once: true });
      sharedStoneTileImage.addEventListener('load', drawFromTiles, { once: true });
    }
  }

  return texture;
}

export class EnvironmentGenerator {
  private instances: THREE.InstancedMesh[] = [];
  private group: THREE.Group | null = null;
  
  private treeFamily = buildTreeFamily();
  
  private barkMaterial = ProceduralTreeGenerator.getTreeMaterial('bark', 123, []);
  private foliageMaterial = ProceduralTreeGenerator.getTreeMaterial('foliage', 123, []);

  private fluidUniforms: { value: number }[] = [];
  private foamMaterial = new THREE.MeshToonMaterial({ color: 0xf0e8d2, transparent: true, opacity: 0.5, gradientMap: toonGradient, depthWrite: false });

  private materials = {
    grass: TextureAtlas.getInstance().getMaterial(AtlasTextureType.GRASS),
    stoneBase: TextureAtlas.getInstance().getMaterial(AtlasTextureType.STONES_ROUND),
    woodBase: TextureAtlas.getInstance().getMaterial(AtlasTextureType.WOOD_BARK),
    water: createFluidMaterial(this.fluidUniforms, { color: ENV_AESTHETICS.materials.water, transparent: true, opacity: 0.85 }),
    lava: createFluidMaterial(this.fluidUniforms, { color: ENV_AESTHETICS.materials.lava, emissive: 0xb91c1c, lava: true }),
    wall: createWallTileMaterial(),
    wallStoneDark: TextureAtlas.getInstance().getMaterial(AtlasTextureType.STONES_DARK),
    wallStoneRound: TextureAtlas.getInstance().getMaterial(AtlasTextureType.STONES_ROUND),
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

  public update(dt: number) {
    for (const u of this.fluidUniforms) u.value += dt;
    this.foamMaterial.opacity = 0.45 + 0.12 * Math.sin((this.fluidUniforms[0]?.value ?? 0) * 1.1);
  }

  // Billboards: camera-facing props/plants (world-art §7). Re-orients every
  // instance toward the current camera quaternion each frame (mob pattern).
  public updateBillboardOrientations(cameraQuaternion: THREE.Quaternion): void {
    for (const batch of this.billboardBatches) {
      const list = batch.instances;
      for (let i = 0; i < list.length; i++) {
        const it = list[i];
        this.billboardDummy.position.set(it.x, ENV_AESTHETICS.terrain.groundHeight + 0.015, it.z);
        this.billboardDummy.scale.set(it.scale, it.scale, 1);
        this.billboardDummy.quaternion.copy(cameraQuaternion);
        this.billboardDummy.updateMatrix();
        batch.mesh.setMatrixAt(i, this.billboardDummy.matrix);
      }
      if (list.length > 0) batch.mesh.instanceMatrix.needsUpdate = true;
    }
  }

  // Spawns a decor family as camera-facing billboards sliced from the Cainos
  // sheets (TX Plant / TX Props), replacing the old 3D tree/bush/grass/pebble.
  private spawnBillboardDecor(type: string, placements: DecorPlacement[]) {
    const cfg = DECOR_BILLBOARD_MAP[type];
    if (!cfg) return;
    const sheet = NEW_TEXTURE_SHEETS[cfg.sheet as keyof typeof NEW_TEXTURE_SHEETS];
    if (!sheet) return;
    const filtered = placements.filter(p => p.type === type);
    if (filtered.length === 0) return;

    const variance = ENV_AESTHETICS.objectVariances[type] || { scaleMin: 0.9, scaleMax: 1.1, scatterRadius: 0, wobbleRotation: 0 };

    for (let ci = 0; ci < cfg.cells.length; ci++) {
      const cell = sheet.cells.find(c => c.id === cfg.cells[ci]);
      if (!cell) continue;
      const variantPlacements = filtered.filter(p => p.variant % cfg.cells.length === ci);
      if (variantPlacements.length === 0) continue;

      const material = new THREE.MeshToonMaterial({
        map: createBillboardTexture(sheet, cell),
        gradientMap: toonGradient,
        transparent: true,
        alphaTest: 0.5,
        side: THREE.FrontSide,
        depthWrite: true,
      });
      const mesh = new THREE.InstancedMesh(this.billboardGeometry, material, variantPlacements.length);
      mesh.castShadow = !!cfg.castShadow;
      mesh.receiveShadow = false;
      mesh.frustumCulled = false;
      this.group!.add(mesh);
      this.instances.push(mesh);

      const dims = spriteSliceDims(cell.bbox);
      const worldScale = cfg.height
        ? (cfg.height * 256) / dims.destH
        : ((cfg.width ?? 1) * 256) / dims.destW;

      const instances: { x: number; z: number; scale: number }[] = [];
      variantPlacements.forEach(p => {
        const scale = worldScale * randomRange(variance.scaleMin, variance.scaleMax, p.seed);
        let x = p.x;
        let z = p.y;
        if (variance.scatterRadius > 0) {
          x += randomRange(-variance.scatterRadius, variance.scatterRadius, p.seed + 3);
          z += randomRange(-variance.scatterRadius, variance.scatterRadius, p.seed + 4);
        }
        instances.push({ x, z, scale });
      });
      this.billboardBatches.push({ mesh, instances });
    }
  }

  private billboardBatches: { mesh: THREE.InstancedMesh; instances: { x: number; z: number; scale: number }[] }[] = [];
  private billboardDummy = new THREE.Object3D();
  private billboardGeometry = (() => {
    const geometry = new THREE.PlaneGeometry(1, 1);
    geometry.translate(0, 0.5 - 14 / 256, 0);
    return geometry;
  })();

  private rockFamily = buildRockFamily();
  private wallFamily = buildWallFamily();
  private grassFamily = buildGrassFamily();
  private bushFamily = buildBushFamily();
  private pebbleFamily = buildPebbleFamily();
  private mushroomFamily = buildMushroomFamily();
  private propFamilies = buildAllPropFamilies();

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
    this.billboardBatches = [];
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

    type PropType = 'ground' | 'path' | 'wall' | 'water' | 'stone' | 'wood' | 'tree' | 'ore' | 'herb' | 'grassTuft' | 'bush' | 'pebble' | 'mushroom' | 'crate' | 'barrel' | 'bench' | 'fence' | 'crate_stack' | 'dirtPatch';
    
    interface PropPlacement {
      x: number;
      y: number;
      type: PropType;
      variant: number;
      seed: number;
    }

    const placements: PropPlacement[] = [];

    // Detect buildings on civilized themes (town), from enclosed
    // wood-floor interiors. Their wall ring replaces the flat wall
    // boxes so each structure gets a proper silhouette (world-art §16).
    const buildings: BuildingFootprint[] =
      map.theme === 'town' ? ProceduralBuildingGenerator.detectFootprints(map) : [];
    const buildingTiles = new Set<string>();
    buildings.forEach((fp) => {
      for (let y = fp.minZ; y <= fp.maxZ; y++) {
        for (let x = fp.minX; x <= fp.maxX; x++) {
          buildingTiles.add(`${x},${y}`);
        }
      }
    });

    // Tiles adjacent to buildings — where benches/fences make sense
    // (world-art §23/§26: props communicate rest + boundary).
    const buildingPerimeter = new Set<string>();
    buildings.forEach((fp) => {
      for (let y = fp.minZ - 2; y <= fp.maxZ + 2; y++) {
        for (let x = fp.minX - 2; x <= fp.maxX + 2; x++) {
          if (x < 0 || y < 0 || x >= map.width || y >= map.height) continue;
          if (!buildingTiles.has(`${x},${y}`)) buildingPerimeter.add(`${x},${y}`);
        }
      }
    });

    // Ground grammar: tiles adjacent to a path (world-art §13/§14) get worn
    // dirt patches and lose tall vegetation, so roads stay readable.
    const nearPath = (x: number, y: number) => {
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        if ((map.tiles[y + dy]?.[x + dx] ?? 0) === 8) return true;
      }
      return false;
    };

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
          
          // 2. Biome Decor Generation — kept off grass directly beside
          //    roads so paths stay readable (world-art §14).
          if (biome.decorDensity > 0 && seededRandom(seed) < biome.decorDensity) {
             const decorType = biome.allowedDecor[Math.floor(randomRange(0, biome.allowedDecor.length, seed + 1))] as PropType;
             if (!(nearPath(x, y) && decorType !== 'pebble')) {
              let variant = 0;
              if (decorType === 'grassTuft') variant = Math.floor(randomRange(0, this.grassFamily.length, seed));
              else if (decorType === 'bush') variant = Math.floor(randomRange(0, this.bushFamily.length, seed));
              else if (decorType === 'pebble') variant = Math.floor(randomRange(0, this.pebbleFamily.length, seed));
              else if (decorType === 'mushroom') variant = Math.floor(randomRange(0, this.mushroomFamily.length, seed));
              
              placements.push({ x, y, type: decorType, variant, seed });
             }
          }

          // 3. Civilized/ruin props — sparse, deterministic
          if (!buildingTiles.has(`${x},${y}`) && biome.allowedProps && biome.propDensity) {
            const propRoll = seed + 5000;
            if (seededRandom(propRoll) < biome.propDensity) {
              const allowed: PropFamily[] = biome.allowedProps as PropFamily[];
              const propType = allowed[Math.floor(randomRange(0, allowed.length, propRoll + 1))];
              const isPerimeterType = propType === 'bench' || propType === 'fence';
              if (!isPerimeterType || buildingPerimeter.has(`${x},${y}`)) {
                const variant = Math.floor(randomRange(0, this.propFamilies[propType].length, propRoll + 2));
                placements.push({ x, y, type: propType, variant, seed: propRoll + 3 });
              }
            }
          }

          // 4. Worn dirt patch beside roads (world-art §13: ground grammar)
          if (!buildingTiles.has(`${x},${y}`) && nearPath(x, y) && seededRandom(seed + 9000) < 0.3) {
            placements.push({ x, y, type: 'dirtPatch', variant: 0, seed: seed + 9000 });
          }
        }
        else if (tile === 1) {
          if (buildingTiles.has(`${x},${y}`)) {
            // Interior structure handled by the building generator.
          } else {
            const variant = Math.floor(randomRange(0, this.wallFamily.length, seed));
            placements.push({ x, y, type: 'wall', variant, seed });
          }
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

    // Stylized shoreline foam: thin strips along the water side of every
    // water/land boundary (world-art §8). No foam on lava.
    const waterSet = new Set<string>();
    placements.forEach(p => { if (p.type === 'water') waterSet.add(`${p.x},${p.y}`); });
    const foamEdges: { x: number; y: number; rotY: number }[] = [];
    if (map.theme !== 'fire_temple') {
      waterSet.forEach((key) => {
        const [wx, wy] = key.split(',').map(Number);
        const isWater = (x: number, y: number) => waterSet.has(`${x},${y}`);
        if (!isWater(wx, wy - 1)) foamEdges.push({ x: wx, y: wy - 0.5, rotY: 0 });
        if (!isWater(wx, wy + 1)) foamEdges.push({ x: wx, y: wy + 0.5, rotY: 0 });
        if (!isWater(wx - 1, wy)) foamEdges.push({ x: wx - 0.5, y: wy, rotY: Math.PI / 2 });
        if (!isWater(wx + 1, wy)) foamEdges.push({ x: wx + 0.5, y: wy, rotY: -Math.PI / 2 });
      });
    }

    // Helper to spawn a family
    const spawnFamily = (typeFilter: string, family: FamilyVariant[], mat1: THREE.Material | THREE.Material[], mat2?: THREE.Material, positionYOffset: number = 0) => {
      const filtered = placements.filter(p => p.type === typeFilter);
      if (filtered.length === 0) return;

      const mats = Array.isArray(mat1) ? mat1 : Array(family.length).fill(mat1);
      const variance = ENV_AESTHETICS.objectVariances[typeFilter] || { scaleMin: 0.9, scaleMax: 1.1, scatterRadius: 0, wobbleRotation: 0 };

      for (let v = 0; v < family.length; v++) {
        const variantPlacements = filtered.filter(p => p.variant === v);
        if (variantPlacements.length === 0) continue;

        const mesh1 = new THREE.InstancedMesh(family[v].geometry, mats[v % mats.length], variantPlacements.length);
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

    // Spawn props (instanced per variant, shared materials)
    const spawnProps = (typeFilter: PropFamily) => {
      const variants = this.propFamilies[typeFilter];
      const filtered = placements.filter(p => p.type === typeFilter);
      if (filtered.length === 0) return;

      for (let v = 0; v < variants.length; v++) {
        const variantPlacements = filtered.filter(p => p.variant === v);
        if (variantPlacements.length === 0) continue;

        const mesh = new THREE.InstancedMesh(variants[v].geometry, variants[v].materials, variantPlacements.length);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.group!.add(mesh);
        this.instances.push(mesh);

        const dummy = new THREE.Object3D();
        let i = 0;
        variantPlacements.forEach(p => {
          dummy.position.set(p.x, 0, p.y);
          dummy.scale.setScalar(randomRange(0.9, 1.12, p.seed));
          dummy.rotation.set(0, randomRange(0, Math.PI * 2, p.seed + 1), 0);
          dummy.updateMatrix();
          mesh.setMatrixAt(i++, dummy.matrix);
        });
      }
    };

    // Spawn Families
    spawnFamily('wall', this.wallFamily, [this.materials.wall, this.materials.wallStoneDark, this.materials.wallStoneRound]);
    this.spawnBillboardDecor('tree', placements);
    spawnFamily('ore', this.rockFamily, this.materials.ore);
    this.spawnBillboardDecor('grassTuft', placements);
    this.spawnBillboardDecor('bush', placements);
    this.spawnBillboardDecor('pebble', placements);
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
    spawnSingle('stone', planeGeo, createStoneFloorMaterial(), ENV_AESTHETICS.terrain.stoneHeight, true);
    spawnSingle('wood', createPlaneWithUV(AtlasTextureType.WOOD_BARK), this.materials.woodBase, ENV_AESTHETICS.terrain.woodHeight, true);

    // Worn dirt patches beside roads (world-art §13) — soft feathered decals
    const dirtFiltered = placements.filter(p => p.type === 'dirtPatch');
    if (dirtFiltered.length) {
      const dirtGeo = new THREE.PlaneGeometry(0.72, 0.72);
      dirtGeo.rotateX(-Math.PI / 2);
      const dirtMesh = new THREE.InstancedMesh(dirtGeo, createDirtPatchMaterial(), dirtFiltered.length);
      dirtMesh.receiveShadow = true;
      const dirtDummy = new THREE.Object3D();
      dirtFiltered.forEach((p, i) => {
        const s = randomRange(0.7, 1.35, p.seed);
        dirtDummy.position.set(p.x, ENV_AESTHETICS.terrain.groundHeight + 0.007, p.y);
        dirtDummy.rotation.set(0, randomRange(0, Math.PI * 2, p.seed + 1), 0);
        dirtDummy.scale.set(s, 1, s * randomRange(0.85, 1.15, p.seed + 2));
        dirtDummy.updateMatrix();
        dirtMesh.setMatrixAt(i, dirtDummy.matrix);
      });
      this.group!.add(dirtMesh);
      this.instances.push(dirtMesh);
    }

    // Stylized shoreline foam strips (world-art §8) — just above the water
    if (foamEdges.length) {
      const foamGeo = new THREE.PlaneGeometry(1, 0.16);
      foamGeo.rotateX(-Math.PI / 2);
      const foamMesh = new THREE.InstancedMesh(foamGeo, this.foamMaterial, foamEdges.length);
      const foamDummy = new THREE.Object3D();
      foamEdges.forEach((e, i) => {
        foamDummy.position.set(e.x, ENV_AESTHETICS.terrain.waterHeight + 0.012, e.y);
        foamDummy.rotation.set(0, e.rotY, 0);
        foamDummy.updateMatrix();
        foamMesh.setMatrixAt(i, foamDummy.matrix);
      });
      this.group!.add(foamMesh);
      this.instances.push(foamMesh);
    }

    // Herbs (Single variant cone)
    const herbGeo = new THREE.ConeGeometry(0.3, 0.6, 4);
    herbGeo.translate(0, 0.3, 0);
    spawnSingle('herb', herbGeo, this.materials.herb, 0, false, 'herb');

    // Civilized props (instanced, sparse)
    spawnProps('crate');
    spawnProps('barrel');
    spawnProps('bench');
    spawnProps('fence');
    spawnProps('crate_stack');

    this.buildBuildings(buildings, map);
    this.buildDynamicObjects(map);
  }

  private buildBuildings(buildings: BuildingFootprint[], map: GameMap) {
    buildings.forEach((fp) => {
      const result = ProceduralBuildingGenerator.buildBuilding(fp);
      const mesh = new THREE.Mesh(result.geometry, result.materials);
      mesh.position.set((fp.minX + fp.maxX) / 2, 0, (fp.minZ + fp.maxZ) / 2);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.group!.add(mesh);
      this.instances.push(mesh as any);
    });

    // Landmark: covered well at the village centroid (world-art §25).
    // Gives the settlement a recognizable focal point from the camera.
    if (buildings.length >= 2) {
      let cx = 0;
      let cz = 0;
      buildings.forEach((fp) => {
        cx += (fp.minX + fp.maxX) / 2;
        cz += (fp.minZ + fp.maxZ) / 2;
      });
      cx /= buildings.length;
      cz /= buildings.length;

      // Verify the centroid tile is walkable ground before placing.
      const tileX = Math.round(cx);
      const tileZ = Math.round(cz);
      const targetTile = map.tiles[tileZ]?.[tileX];
      if ((targetTile ?? 0) === 0) {
        const result = ProceduralBuildingGenerator.buildWell(cx * 100 + cz * 31 + 17);
        const mesh = new THREE.Mesh(result.geometry, result.materials);
        mesh.position.set(cx, 0, cz);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.group!.add(mesh);
        this.instances.push(mesh as any);
      }
    }
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
