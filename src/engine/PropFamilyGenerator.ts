import * as THREE from 'three';
import { TextureAtlas, AtlasTextureType } from './TextureAtlas';

// ---------------------------------------------------------
// PROP FAMILY GENERATOR
// ---------------------------------------------------------
// World-art authority (argentum-world-art):
//   - Props communicate meaning: crate→storage, barrel→supplies,
//     bench→rest, fence→boundary (§23).
//   - Families share a material palette; variation comes from
//     bounded seeds (§29/§30/§34).
//   - Assets are merged per material for low draw calls (§32/§35).

export type PropFamily = 'crate' | 'barrel' | 'bench' | 'fence' | 'crate_stack';

export interface PropResult {
  geometry: THREE.BufferGeometry;
  materials: THREE.MeshToonMaterial[];
}

interface GeoAccum {
  vertices: number[];
  normals: number[];
  uvs: number[];
  indices: number[];
  groups: { start: number; count: number; materialIndex: number }[];
}

const MAT_WOOD = 0;
const MAT_METAL = 1;
const MAT_STONE = 2;

const PART_TEXTURE: Record<number, AtlasTextureType> = {
  [MAT_WOOD]: AtlasTextureType.WOOD_BARK,
  [MAT_METAL]: AtlasTextureType.STONES_DARK,
  [MAT_STONE]: AtlasTextureType.STONES_LIGHT,
};

export class PropFamilyGenerator {
  private static seededRandom(seed: number) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  private static randomRange(min: number, max: number, seed: number) {
    return min + (max - min) * this.seededRandom(seed);
  }

  private static boxPart(
    acc: GeoAccum,
    matIndex: number,
    size: THREE.Vector3,
    center: THREE.Vector3,
    rotY = 0,
    rotX = 0
  ) {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    geo.scale(size.x, size.y, size.z);
    geo.rotateX(rotX);
    geo.rotateY(rotY);
    geo.translate(center.x, center.y, center.z);

    const pos = geo.attributes.position;
    const nor = geo.attributes.normal;
    const uv = geo.attributes.uv;
    const index = geo.index;
    const baseVertex = acc.vertices.length / 3;
    const startUv = acc.uvs.length;

    for (let i = 0; i < pos.count; i++) {
      acc.vertices.push(pos.getX(i), pos.getY(i), pos.getZ(i));
      acc.normals.push(nor.getX(i), nor.getY(i), nor.getZ(i));
      acc.uvs.push(uv.getX(i), uv.getY(i));
    }
    for (let i = 0; i < (index ? index.count : 0); i++) {
      acc.indices.push(baseVertex + index!.getX(i));
    }

    // Remap UVs into atlas sub-rectangle
    const mapping = TextureAtlas.getInstance().getUVMapping(PART_TEXTURE[matIndex]);
    const padding = 0.001;
    const safeW = mapping.w - padding * 2;
    const safeH = mapping.h - padding * 2;
    const safeU = mapping.u + padding;
    const safeV = mapping.v + padding;
    const repeatU = Math.max(1, size.x);
    const repeatV = Math.max(1, size.y);
    for (let i = startUv; i < acc.uvs.length; i += 2) {
      const u = acc.uvs[i];
      const v = acc.uvs[i + 1];
      acc.uvs[i] = safeU + Math.min(1, u * repeatU) * safeW;
      acc.uvs[i + 1] = safeV + Math.min(1, v * repeatV) * safeH;
    }

    const groupCount = acc.indices.length - acc.groups.reduce((s, g) => s + g.count, 0);
    acc.groups.push({ start: acc.indices.length - groupCount, count: groupCount, materialIndex: matIndex });

    geo.dispose();
  }

  private static materialCache: THREE.MeshToonMaterial[] | null = null;
  private static getSharedMaterials(): THREE.MeshToonMaterial[] {
    if (PropFamilyGenerator.materialCache) return PropFamilyGenerator.materialCache;

    const toonGradient = this.sharedToonGradient();
    const mats = [
      TextureAtlas.getInstance().getMaterial(AtlasTextureType.WOOD_BARK),
      TextureAtlas.getInstance().getMaterial(AtlasTextureType.STONES_DARK),
      TextureAtlas.getInstance().getMaterial(AtlasTextureType.STONES_LIGHT),
    ];
    mats.forEach((m) => { if (toonGradient) m.gradientMap = toonGradient; });
    PropFamilyGenerator.materialCache = mats;
    return mats;
  }

  private static merge(acc: GeoAccum): PropResult {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(acc.vertices, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(acc.normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(acc.uvs, 2));
    geometry.setIndex(acc.indices);
    geometry.groups = acc.groups;
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    return { geometry, materials: this.getSharedMaterials() };
  }

  private static sharedToonGradient(): THREE.DataTexture | null {
    if (PropFamilyGenerator._toonGradient) return PropFamilyGenerator._toonGradient;
    const colors = new Uint8Array(4 * 4);
    const levels = [115, 165, 215, 255];
    for (let i = 0; i < 4; i++) {
      colors[i * 4] = levels[i];
      colors[i * 4 + 1] = levels[i];
      colors[i * 4 + 2] = levels[i];
      colors[i * 4 + 3] = 255;
    }
    const tex = new THREE.DataTexture(colors, 4, 1, THREE.RGBAFormat);
    tex.needsUpdate = true;
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    PropFamilyGenerator._toonGradient = tex;
    return tex;
  }
  private static _toonGradient: THREE.DataTexture | null = null;

  // ---------------------------------------------------------
  // PUBLIC API
  // ---------------------------------------------------------
  public static generate(type: PropFamily, seed: number): PropResult {
    switch (type) {
      case 'crate': return this.generateCrate(seed);
      case 'barrel': return this.generateBarrel(seed);
      case 'bench': return this.generateBench(seed);
      case 'fence': return this.generateFenceSegment(seed);
      case 'crate_stack': return this.generateCrateStack(seed);
    }
  }

  // ---------------------------------------------------------
  // INDIVIDUAL FAMILIES
  // ---------------------------------------------------------

  /** Wooden crate: box body + lid + band accents. */
  static generateCrate(seed: number): PropResult {
    const acc: GeoAccum = { vertices: [], normals: [], uvs: [], indices: [], groups: [] };

    const w = 0.55 + this.randomRange(-0.05, 0.08, seed);
    const h = 0.42 + this.randomRange(-0.04, 0.06, seed + 1);
    const d = 0.52 + this.randomRange(-0.05, 0.08, seed + 2);
    const bandTh = 0.035;

    // Body
    this.boxPart(acc, MAT_WOOD, new THREE.Vector3(w, h, d), new THREE.Vector3(0, h / 2, 0));

    // Lid (slightly wider, thin)
    const lidH = 0.055;
    this.boxPart(acc, MAT_WOOD, new THREE.Vector3(w + 0.03, lidH, d + 0.03), new THREE.Vector3(0, h + lidH / 2, 0));

    // Metal bands (2 horizontal, near top and bottom)
    const bandY1 = h * 0.2;
    const bandY2 = h * 0.8;
    this.boxPart(acc, MAT_METAL, new THREE.Vector3(w + 0.01, bandTh, d + 0.01), new THREE.Vector3(0, bandY1, 0));
    this.boxPart(acc, MAT_METAL, new THREE.Vector3(w + 0.01, bandTh, d + 0.01), new THREE.Vector3(0, bandY2, 0));

    return this.merge(acc);
  }

  /** Wooden barrel: cylindrical body with iron hoops. */
  static generateBarrel(seed: number): PropResult {
    const acc: GeoAccum = { vertices: [], normals: [], uvs: [], indices: [], groups: [] };

    const r = 0.28 + this.randomRange(-0.03, 0.05, seed);
    const h = 0.6 + this.randomRange(-0.06, 0.08, seed + 1);
    const bandTh = 0.03;

    // Main body (approximated with a tall box + slight taper via two stacked boxes)
    const midH = h * 0.6;
    const midR = r * 1.04;
    this.boxPart(acc, MAT_WOOD, new THREE.Vector3(midR * 2, midH, midR * 2), new THREE.Vector3(0, h / 2, 0));

    // Top and bottom caps (slightly narrower)
    const capH = h * 0.2;
    this.boxPart(acc, MAT_WOOD, new THREE.Vector3(r * 2, capH, r * 2), new THREE.Vector3(0, capH / 2, 0));
    this.boxPart(acc, MAT_WOOD, new THREE.Vector3(r * 2, capH, r * 2), new THREE.Vector3(0, h - capH / 2, 0));

    // Iron hoops (3 bands)
    const hoopY1 = h * 0.18;
    const hoopY2 = h * 0.5;
    const hoopY3 = h * 0.82;
    const hoopW = r * 2 + 0.01;
    this.boxPart(acc, MAT_METAL, new THREE.Vector3(hoopW, bandTh, hoopW), new THREE.Vector3(0, hoopY1, 0));
    this.boxPart(acc, MAT_METAL, new THREE.Vector3(hoopW, bandTh, hoopW), new THREE.Vector3(0, hoopY2, 0));
    this.boxPart(acc, MAT_METAL, new THREE.Vector3(hoopW, bandTh, hoopW), new THREE.Vector3(0, hoopY3, 0));

    return this.merge(acc);
  }

  /** Wooden bench: plank seat + 4 legs. */
  static generateBench(seed: number): PropResult {
    const acc: GeoAccum = { vertices: [], normals: [], uvs: [], indices: [], groups: [] };

    const seatW = 1.0 + this.randomRange(-0.1, 0.15, seed);
    const seatD = 0.28;
    const seatH = 0.06;
    const legH = 0.35;
    const legW = 0.06;

    // Seat plank
    const seatY = legH + seatH / 2;
    this.boxPart(acc, MAT_WOOD, new THREE.Vector3(seatW, seatH, seatD), new THREE.Vector3(0, seatY, 0));

    // 4 legs (slightly inset)
    const inset = 0.08;
    const legY = legH / 2;
    const halfSeat = seatW / 2 - inset;
    const halfDepth = seatD / 2 - inset;
    const legs: Array<[number, number]> = [
      [halfSeat, halfDepth],
      [halfSeat, -halfDepth],
      [-halfSeat, halfDepth],
      [-halfSeat, -halfDepth],
    ];
    legs.forEach(([lx, lz], i) => {
      const wobble = this.randomRange(-0.02, 0.02, seed + 20 + i);
      this.boxPart(acc, MAT_WOOD, new THREE.Vector3(legW, legH, legW), new THREE.Vector3(lx, legY, lz), wobble);
    });

    // Cross-brace (optional, deterministic)
    if (seed % 3 !== 0) {
      const braceY = legH * 0.4;
      this.boxPart(acc, MAT_WOOD, new THREE.Vector3(seatW - inset * 2, 0.04, 0.04),
        new THREE.Vector3(0, braceY, 0));
    }

    return this.merge(acc);
  }

  /** Fence segment: 2 posts + 2 horizontal rails. */
  static generateFenceSegment(seed: number): PropResult {
    const acc: GeoAccum = { vertices: [], normals: [], uvs: [], indices: [], groups: [] };

    const length = 1.2 + this.randomRange(-0.1, 0.2, seed);
    const postH = 0.7 + this.randomRange(-0.05, 0.1, seed + 1);
    const postW = 0.06;
    const railH = 0.04;

    // Posts
    const postY = postH / 2;
    const halfLen = length / 2 - postW / 2;
    this.boxPart(acc, MAT_WOOD, new THREE.Vector3(postW, postH, postW), new THREE.Vector3(halfLen, postY, 0));
    this.boxPart(acc, MAT_WOOD, new THREE.Vector3(postW, postH, postW), new THREE.Vector3(-halfLen, postY, 0));

    // Top rail
    const topRailY = postH * 0.78;
    this.boxPart(acc, MAT_WOOD, new THREE.Vector3(length, railH, railH * 0.8), new THREE.Vector3(0, topRailY, 0));

    // Bottom rail
    const botRailY = postH * 0.32;
    this.boxPart(acc, MAT_WOOD, new THREE.Vector3(length, railH, railH * 0.8), new THREE.Vector3(0, botRailY, 0));

    return this.merge(acc);
  }

  /** Stack of 2-3 crates (vertical pile). */
  static generateCrateStack(seed: number): PropResult {
    const acc: GeoAccum = { vertices: [], normals: [], uvs: [], indices: [], groups: [] };

    const count = 2 + (seed % 2);
    const baseW = 0.52;
    const baseH = 0.4;
    const baseD = 0.5;

    for (let i = 0; i < count; i++) {
      const wobbleX = this.randomRange(-0.04, 0.04, seed + 30 + i);
      const wobbleZ = this.randomRange(-0.04, 0.04, seed + 40 + i);
      const scale = 1.0 - i * 0.03;
      const y = i * baseH + baseH / 2;

      // Crate body
      this.boxPart(acc, MAT_WOOD, new THREE.Vector3(baseW * scale, baseH * scale, baseD * scale),
        new THREE.Vector3(wobbleX, y, wobbleZ));

      // Lid
      const lidH = 0.05 * scale;
      this.boxPart(acc, MAT_WOOD, new THREE.Vector3(baseW * scale + 0.02, lidH, baseD * scale + 0.02),
        new THREE.Vector3(wobbleX, y + baseH * scale / 2 + lidH / 2, wobbleZ));

      // Metal band
      if (i < 2) {
        const bandY = y + baseH * scale * 0.5;
        this.boxPart(acc, MAT_METAL, new THREE.Vector3(baseW * scale + 0.01, 0.03, baseD * scale + 0.01),
          new THREE.Vector3(wobbleX, bandY, wobbleZ));
      }
    }

    return this.merge(acc);
  }
}
