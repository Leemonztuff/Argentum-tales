import * as THREE from 'three';
import { GameMap } from '../types/game';
import { TextureAtlas, AtlasTextureType } from './TextureAtlas';

// ---------------------------------------------------------
// PROCEDURAL BUILDING GENERATOR
// ---------------------------------------------------------
// World-art authority (argentum-world-art):
//   - Building families share a language (foundation + body +
//     roof + trim), while per-building variation comes from
//     deterministic seeds (§16/§17/§29).
//   - Structures are built as *open timber pavilions*: low stone
//     half-walls keep a recognizable silhouette without hiding
//     characters/interactions (gameplay readability > decoration).
//   - All parts share atlas materials and are merged per material
//     to keep draw calls low (§32/§34/§35).

export interface BuildingFootprint {
  /** Tile-space bounds of the interior (wood floor) region. */
  minX: number;
  minZ: number;
  maxX: number;
  maxZ: number;
  /** Seed derived from footprint position (deterministic). */
  seed: number;
}

export interface BuildingResult {
  /** Merged geometry with material groups. */
  geometry: THREE.BufferGeometry;
  /** Material array aligned with geometry groups. */
  materials: THREE.MeshToonMaterial[];
}

interface GeoAccum {
  vertices: number[];
  normals: number[];
  uvs: number[];
  indices: number[];
  groups: { start: number; count: number; materialIndex: number }[];
}

const MAT_STONE = 0;
const MAT_WOOD = 1;
const MAT_ROOF = 2;
const MAT_BRICK = 3;
const MAT_METAL = 4;

const PART_TEXTURE: Record<number, AtlasTextureType> = {
  [MAT_STONE]: AtlasTextureType.WALL_LIGHT,
  [MAT_WOOD]: AtlasTextureType.WOOD_BARK,
  [MAT_ROOF]: AtlasTextureType.ROOF_TILES,
  [MAT_BRICK]: AtlasTextureType.BRICKS_ORANGE,
  [MAT_METAL]: AtlasTextureType.STONES_DARK,
};

export type BuildingVariant =
  | 'pavilion'
  | 'small_house'
  | 'workshop'
  | 'blacksmith'
  | 'inn'
  | 'storage';

interface VariantConfig {
  postH: [number, number];
  halfWallH: [number, number];
  awning: boolean;
  awningAngle: [number, number];
  awningReach: [number, number];
  chimney: boolean;
  sign: boolean;
  signW: number;
}

const VARIANT_CONFIGS: Record<BuildingVariant, VariantConfig> = {
  pavilion: {
    postH: [2.15, 2.5],
    halfWallH: [0.5, 0.68],
    awning: true,
    awningAngle: [0.18, 0.28],
    awningReach: [0.55, 0.8],
    chimney: true,
    sign: true,
    signW: 1.1,
  },
  small_house: {
    postH: [1.8, 2.1],
    halfWallH: [0.45, 0.55],
    awning: true,
    awningAngle: [0.2, 0.3],
    awningReach: [0.4, 0.55],
    chimney: true,
    sign: false,
    signW: 0,
  },
  workshop: {
    postH: [2.0, 2.35],
    halfWallH: [0.55, 0.72],
    awning: true,
    awningAngle: [0.22, 0.32],
    awningReach: [0.6, 0.9],
    chimney: true,
    sign: true,
    signW: 1.0,
  },
  blacksmith: {
    postH: [2.1, 2.5],
    halfWallH: [0.5, 0.65],
    awning: true,
    awningAngle: [0.18, 0.26],
    awningReach: [0.55, 0.75],
    chimney: true,
    sign: true,
    signW: 1.1,
  },
  inn: {
    postH: [2.4, 2.8],
    halfWallH: [0.55, 0.7],
    awning: true,
    awningAngle: [0.15, 0.22],
    awningReach: [0.6, 0.85],
    chimney: true,
    sign: true,
    signW: 1.3,
  },
  storage: {
    postH: [1.6, 1.9],
    halfWallH: [0.4, 0.52],
    awning: false,
    awningAngle: [0, 0],
    awningReach: [0, 0],
    chimney: false,
    sign: false,
    signW: 0,
  },
};

export class ProceduralBuildingGenerator {
  private static seededRandom(seed: number) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  private static randomRange(min: number, max: number, seed: number) {
    return min + (max - min) * this.seededRandom(seed);
  }

  /**
   * Select building variant based on footprint size and seed.
   * Larger footprints → inn/workshop; smaller → small_house/storage;
   * medium defaults to pavilion or blacksmith.
   */
  public static selectVariant(fp: BuildingFootprint, seed: number): BuildingVariant {
    const w = fp.maxX - fp.minX + 1;
    const d = fp.maxZ - fp.minZ + 1;
    const area = w * d;

    if (area >= 35) return 'inn';
    if (area >= 25) {
      return seed % 3 === 0 ? 'blacksmith' : 'workshop';
    }
    if (area >= 16) {
      return seed % 2 === 0 ? 'pavilion' : 'blacksmith';
    }
    if (area >= 9) {
      const pick = seed % 4;
      if (pick === 0) return 'small_house';
      if (pick === 1) return 'workshop';
      return 'pavilion';
    }
    return 'storage';
  }

  /**
   * Detect enclosed wood-floor building footprints.
   * Only enclosed regions (bounded by wall tiles) qualify, so stray
   * `=` tiles elsewhere never become buildings.
   */
  public static detectFootprints(map: GameMap): BuildingFootprint[] {
    const h = map.height;
    const w = map.width;
    const visited = new Set<number>();
    const footprints: BuildingFootprint[] = [];

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const tile = map.tiles[y]?.[x] ?? 1;
        if (tile !== 4 || visited.has(y * w + x)) continue;

        // Flood-fill the connected interior region
        const region: Array<{ x: number; y: number }> = [];
        const stack = [{ x, y }];
        visited.add(y * w + x);
        while (stack.length > 0) {
          const cur = stack.pop()!;
          region.push(cur);
          const neighbors = [
            { x: cur.x + 1, y: cur.y },
            { x: cur.x - 1, y: cur.y },
            { x: cur.x, y: cur.y + 1 },
            { x: cur.x, y: cur.y - 1 },
          ];
          neighbors.forEach((n) => {
            if (n.x < 0 || n.y < 0 || n.x >= w || n.y >= h) return;
            const key = n.y * w + n.x;
            if (visited.has(key)) return;
            if ((map.tiles[n.y]?.[n.x] ?? 1) === 4) {
              visited.add(key);
              stack.push(n);
            }
          });
        }

        let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
        region.forEach((p) => {
          if (p.x < minX) minX = p.x;
          if (p.x > maxX) maxX = p.x;
          if (p.y < minZ) minZ = p.y;
          if (p.y > maxZ) maxZ = p.y;
        });

        // Require a sensible minimum size (3x3 interior => full building)
        if (maxX - minX + 1 < 3 || maxZ - minZ + 1 < 3) continue;

        // Expand to the surrounding wall ring and verify it is enclosed
        const sMinX = minX - 1, sMaxX = maxX + 1, sMinZ = minZ - 1, sMaxZ = maxZ + 1;
        if (sMinX < 0 || sMinZ < 0 || sMaxX >= w || sMaxZ >= h) continue;

        const isWall = (t: number) => t === 1 || t === 7;
        let enclosed = true;
        for (let cx = sMinX; cx <= sMaxX; cx++) {
          if (!isWall(map.tiles[sMinZ]?.[cx] ?? 1)) { enclosed = false; break; }
          if (!isWall(map.tiles[sMaxZ]?.[cx] ?? 1)) { enclosed = false; break; }
        }
        for (let cz = sMinZ; cz <= sMaxZ && enclosed; cz++) {
          if (!isWall(map.tiles[cz]?.[sMinX] ?? 1)) { enclosed = false; break; }
          if (!isWall(map.tiles[cz]?.[sMaxX] ?? 1)) { enclosed = false; break; }
        }
        if (!enclosed) continue;

        const seed = sMinX * 73 + sMinZ * 131 + 7;
        footprints.push({ minX: sMinX, minZ: sMinZ, maxX: sMaxX, maxZ: sMaxZ, seed });
      }
    }

    return footprints;
  }

  private static ensureMaterial(type: AtlasTextureType): THREE.MeshToonMaterial {
    return TextureAtlas.getInstance().getMaterial(type);
  }

  private static boxPart(
    acc: GeoAccum,
    matIndex: number,
    size: THREE.Vector3,
    center: THREE.Vector3,
    rotY = 0,
    rotX = 0,
    unitsPerTile = 1.0
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

    // Remap this part's UVs into its atlas sub-rectangle (per material,
    // consistent pixel density — no texture bleeding).
    const mapping = TextureAtlas.getInstance().getUVMapping(PART_TEXTURE[matIndex]);
    const padding = 0.001;
    const safeW = mapping.w - padding * 2;
    const safeH = mapping.h - padding * 2;
    const safeU = mapping.u + padding;
    const safeV = mapping.v + padding;
    const repeatU = Math.max(1, size.x / unitsPerTile);
    const repeatV = Math.max(1, size.y / unitsPerTile);
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

  // ---------------------------------------------------------
  // BUILDING FAMILY — open timber pavilion + variants
  // ---------------------------------------------------------
  public static buildBuilding(
    fp: BuildingFootprint,
    variant?: BuildingVariant
  ): BuildingResult {
    const acc: GeoAccum = { vertices: [], normals: [], uvs: [], indices: [], groups: [] };

    const v = variant ?? this.selectVariant(fp, fp.seed);
    const cfg = VARIANT_CONFIGS[v];

    const interiorW = fp.maxX - fp.minX + 1;
    const interiorD = fp.maxZ - fp.minZ + 1;
    const wallW = interiorW + 2;
    const wallD = interiorD + 2;
    const halfW = wallW / 2;
    const halfD = wallD / 2;
    const seed = fp.seed;

    // Variant parameters (bounded, deterministic)
    const postH = this.randomRange(cfg.postH[0], cfg.postH[1], seed);
    const halfWallH = this.randomRange(cfg.halfWallH[0], cfg.halfWallH[1], seed + 1);
    const awningAngle = cfg.awning
      ? this.randomRange(cfg.awningAngle[0], cfg.awningAngle[1], seed + 3) * (seed % 2 === 0 ? 1 : -1)
      : 0;
    const awningReach = cfg.awning
      ? this.randomRange(cfg.awningReach[0], cfg.awningReach[1], seed + 2)
      : 0;
    const hasCap = cfg.chimney && seed % 3 !== 2;
    const hasSign = cfg.sign && wallW >= 3.5;

    // 1. Stone foundation ring (plinth) — houses the wood interior floor
    const plinthTh = 0.5;
    const plinthH = 0.18;
    const plinthY = plinthH / 2;
    // N/S
    this.boxPart(acc, MAT_STONE, new THREE.Vector3(wallW + plinthTh, plinthH, plinthTh), new THREE.Vector3(0, plinthY, halfD + plinthTh / 2));
    this.boxPart(acc, MAT_STONE, new THREE.Vector3(wallW + plinthTh, plinthH, plinthTh), new THREE.Vector3(0, plinthY, -halfD - plinthTh / 2));
    // E/W
    this.boxPart(acc, MAT_STONE, new THREE.Vector3(plinthTh, plinthH, wallD), new THREE.Vector3(halfW + plinthTh / 2, plinthY, 0));
    this.boxPart(acc, MAT_STONE, new THREE.Vector3(plinthTh, plinthH, wallD), new THREE.Vector3(-halfW - plinthTh / 2, plinthY, 0));

    // 2. Low stone half-walls (keep characters readable above them)
    const wallTh = 0.22;
    const wallY = plinthH + halfWallH / 2;
    this.boxPart(acc, MAT_STONE, new THREE.Vector3(wallW - wallTh, halfWallH, wallTh), new THREE.Vector3(0, wallY, halfD - wallTh / 2));
    this.boxPart(acc, MAT_STONE, new THREE.Vector3(wallW - wallTh, halfWallH, wallTh), new THREE.Vector3(0, wallY, -halfD + wallTh / 2));
    this.boxPart(acc, MAT_STONE, new THREE.Vector3(wallTh, halfWallH, wallD - wallTh), new THREE.Vector3(halfW - wallTh / 2, wallY, 0));
    this.boxPart(acc, MAT_STONE, new THREE.Vector3(wallTh, halfWallH, wallD - wallTh), new THREE.Vector3(-halfW + wallTh / 2, wallY, 0));

    // 3. Corner wood posts
    const postSize = 0.34;
    const postY = (plinthH + postH) / 2;
    const corners: Array<[number, number]> = [
      [halfW - postSize / 2, halfD - postSize / 2],
      [halfW - postSize / 2, -halfD + postSize / 2],
      [-halfW + postSize / 2, halfD - postSize / 2],
      [-halfW + postSize / 2, -halfD + postSize / 2],
    ];
    corners.forEach(([cx, cz], idx) => {
      const w = 0.32 + this.randomRange(-0.03, 0.05, seed + 10 + idx);
      this.boxPart(acc, MAT_WOOD, new THREE.Vector3(w, postH, w), new THREE.Vector3(cx, postY, cz));
    });

    // 4. Perimeter beams between posts (top ring)
    const beamY = plinthH + postH - 0.12;
    this.boxPart(acc, MAT_WOOD, new THREE.Vector3(wallW - 0.1, 0.2, 0.2), new THREE.Vector3(0, beamY, halfD - postSize / 2));
    this.boxPart(acc, MAT_WOOD, new THREE.Vector3(wallW - 0.1, 0.2, 0.2), new THREE.Vector3(0, beamY, -halfD + postSize / 2));
    this.boxPart(acc, MAT_WOOD, new THREE.Vector3(0.2, 0.2, wallD - 0.1), new THREE.Vector3(halfW - postSize / 2, beamY, 0));
    this.boxPart(acc, MAT_WOOD, new THREE.Vector3(0.2, 0.2, wallD - 0.1), new THREE.Vector3(-halfW + postSize / 2, beamY, 0));

    // 5. Roof awning (slope outward) — optional per variant
    if (cfg.awning) {
      const roofTh = 0.16;
      const roofY = beamY + 0.12;
      // North/South strips
      this.boxPart(acc, MAT_ROOF, new THREE.Vector3(wallW + awningReach, roofTh, 0.95), new THREE.Vector3(0, roofY, halfD + awningReach * 0.35), 0, awningAngle);
      this.boxPart(acc, MAT_ROOF, new THREE.Vector3(wallW + awningReach, roofTh, 0.95), new THREE.Vector3(0, roofY, -halfD - awningReach * 0.35), 0, -awningAngle);
      // East/West strips
      this.boxPart(acc, MAT_ROOF, new THREE.Vector3(0.95, roofTh, wallD + awningReach), new THREE.Vector3(halfW + awningReach * 0.35, roofY, 0), 0, awningAngle);
      this.boxPart(acc, MAT_ROOF, new THREE.Vector3(0.95, roofTh, wallD + awningReach), new THREE.Vector3(-halfW - awningReach * 0.35, roofY, 0), 0, -awningAngle);
    }

    // 6. Hanging sign over the camera-facing (south) side
    if (hasSign) {
      const signW = Math.min(cfg.signW, wallW - 0.6);
      this.boxPart(acc, MAT_WOOD, new THREE.Vector3(signW, 0.42, 0.09), new THREE.Vector3(0, plinthH + postH * 0.72, halfD - 0.34));
    }

    // 7. Brick cap accent on a corner (chimney-like silhouette)
    if (hasCap) {
      const capX = halfW - postSize / 2 - 0.12;
      const capZ = halfD - postSize / 2 - 0.12;
      this.boxPart(acc, MAT_BRICK, new THREE.Vector3(0.5, 0.5, 0.5), new THREE.Vector3(capX, plinthH + postH + 0.12, capZ));
    }

    // 8. Family-specific details
    if (v === 'blacksmith') {
      this.addForgeAccents(acc, halfW, halfD, postH, plinthH);
    }
    if (v === 'inn') {
      this.addInnAccents(acc, halfW, halfD, postH, plinthH, postSize);
    }
    if (v === 'storage') {
      this.addStorageAccents(acc, halfW, halfD);
    }
    if (v === 'small_house') {
      this.addSmallHouseAccents(acc, halfW, halfD, postH, plinthH, postSize);
    }

    // Merge into a single geometry + material groups
    const result = this.mergeAcc(acc);
    return result;
  }

  /** Shared merged-geometry + toon-materials step. */
  private static mergeAcc(acc: GeoAccum): BuildingResult {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(acc.vertices, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(acc.normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(acc.uvs, 2));
    geometry.setIndex(acc.indices);
    geometry.groups = acc.groups;
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    const toonSources = EnvironmentToonGradient.sharedGradient();
    const materials = [
      this.ensureMaterial(AtlasTextureType.WALL_LIGHT),
      this.ensureMaterial(AtlasTextureType.WOOD_BARK),
      this.ensureMaterial(AtlasTextureType.ROOF_TILES),
      this.ensureMaterial(AtlasTextureType.BRICKS_ORANGE),
    ];
    materials.forEach((m) => {
      if (toonSources) m.gradientMap = toonSources;
    });

    return { geometry, materials };
  }

  // ---------------------------------------------------------
  // LANDMARK — covered well (village focal point, world-art §25)
  // ---------------------------------------------------------
  public static buildWell(seed: number): BuildingResult {
    const acc: GeoAccum = { vertices: [], normals: [], uvs: [], indices: [], groups: [] };

    const ringR = 0.75;
    const ringTh = 0.22;
    const ringH = 0.5;

    // Stone ring (4 box segments forming a square collar)
    const side = ringR * 2 - ringTh;
    const ringY = ringH / 2;
    this.boxPart(acc, MAT_STONE, new THREE.Vector3(ringR * 2, ringH, ringTh), new THREE.Vector3(0, ringY, ringR - ringTh / 2));
    this.boxPart(acc, MAT_STONE, new THREE.Vector3(ringR * 2, ringH, ringTh), new THREE.Vector3(0, ringY, -ringR + ringTh / 2));
    this.boxPart(acc, MAT_STONE, new THREE.Vector3(ringTh, ringH, side), new THREE.Vector3(ringR - ringTh / 2, ringY, 0));
    this.boxPart(acc, MAT_STONE, new THREE.Vector3(ringTh, ringH, side), new THREE.Vector3(-ringR + ringTh / 2, ringY, 0));

    // A-frame posts (angled inward, front/back)
    const postH = 1.9;
    const postTh = 0.1;
    const tilt = 0.16;
    const footZ = ringR - 0.05;
    this.boxPart(acc, MAT_WOOD, new THREE.Vector3(postTh, postH, postTh), new THREE.Vector3(0, ringH + postH / 2 - 0.1, footZ), 0, tilt);
    this.boxPart(acc, MAT_WOOD, new THREE.Vector3(postTh, postH, postTh), new THREE.Vector3(0, ringH + postH / 2 - 0.1, -footZ), 0, -tilt);

    // Cross beam at the top
    const topY = ringH + postH - 0.2;
    this.boxPart(acc, MAT_WOOD, new THREE.Vector3(ringR * 1.6, 0.14, 0.12), new THREE.Vector3(0, topY, 0));

    // Small peaked roof
    const roofTh = 0.06;
    const roofW = ringR * 1.5;
    this.boxPart(acc, MAT_ROOF, new THREE.Vector3(roofW, roofTh, roofTh), new THREE.Vector3(0, topY + 0.28, 0), 0, 0.42);
    this.boxPart(acc, MAT_ROOF, new THREE.Vector3(roofW, roofTh, roofTh), new THREE.Vector3(0, topY + 0.28, 0), 0, -0.42);

    // Hanging bucket (rope + pail)
    const bucketY = ringH + 1.05;
    this.boxPart(acc, MAT_WOOD, new THREE.Vector3(0.05, bucketY - ringH, 0.05), new THREE.Vector3(0, (ringH + bucketY) / 2, 0));
    this.boxPart(acc, MAT_METAL, new THREE.Vector3(0.18, 0.16, 0.16), new THREE.Vector3(0, bucketY + 0.08, 0));

    return this.mergeAcc(acc);
  }

  // ---------------------------------------------------------
  // FAMILY-SPECIFIC DETAILS
  // ---------------------------------------------------------

  /** Blacksmith: forge platform (stone) + anvil block (brick) + hanging tool rod (wood). */
  private static addForgeAccents(
    acc: GeoAccum,
    halfW: number,
    halfD: number,
    postH: number,
    plinthH: number
  ) {
    // Stone forge platform (small raised slab against north wall)
    const platW = 1.2;
    const platD = 0.6;
    const platH = 0.12;
    this.boxPart(acc, MAT_STONE, new THREE.Vector3(platW, platH, platD),
      new THREE.Vector3(0, plinthH + platH / 2, -halfD + 0.45));

    // Brick anvil block on the platform
    this.boxPart(acc, MAT_BRICK, new THREE.Vector3(0.38, 0.35, 0.38),
      new THREE.Vector3(0, plinthH + platH + 0.17, -halfD + 0.45));

    // Horizontal wood tool rod above the forge
    const rodY = plinthH + postH * 0.55;
    this.boxPart(acc, MAT_WOOD, new THREE.Vector3(1.4, 0.1, 0.1),
      new THREE.Vector3(0, rodY, -halfD + 0.55));
  }

  /** Inn: decorative corner buttresses + heavier sign post + side bench silhouette. */
  private static addInnAccents(
    acc: GeoAccum,
    halfW: number,
    halfD: number,
    postH: number,
    plinthH: number,
    postSize: number
  ) {
    // Corner stone buttresses (chunky, asymmetric)
    const buttH = 0.6;
    const buttW = 0.4;
    const buttY = plinthH + buttH / 2;
    const offsets: Array<[number, number, number]> = [
      [halfW - 0.2, halfD - 0.2, 0.04],
      [-halfW + 0.2, halfD - 0.2, -0.03],
    ];
    offsets.forEach(([bx, bz, rot], i) => {
      this.boxPart(acc, MAT_STONE, new THREE.Vector3(buttW, buttH, 0.22),
        new THREE.Vector3(bx, buttY, bz), rot);
    });

    // Side bench (long wood plank against east wall)
    const benchY = plinthH + 0.38;
    this.boxPart(acc, MAT_WOOD, new THREE.Vector3(0.32, 0.08, 2.2),
      new THREE.Vector3(halfW - 0.35, benchY, 0));

    // Bench legs
    this.boxPart(acc, MAT_WOOD, new THREE.Vector3(0.1, 0.28, 0.1),
      new THREE.Vector3(halfW - 0.35, plinthH + 0.14, 0.9));
    this.boxPart(acc, MAT_WOOD, new THREE.Vector3(0.1, 0.28, 0.1),
      new THREE.Vector3(halfW - 0.35, plinthH + 0.14, -0.9));
  }

  /** Storage: internal shelving (wood planks against walls). */
  private static addStorageAccents(
    acc: GeoAccum,
    halfW: number,
    halfD: number
  ) {
    // Two shelf planks against north wall
    const shelfY1 = 0.55;
    const shelfY2 = 1.05;
    this.boxPart(acc, MAT_WOOD, new THREE.Vector3(1.6, 0.07, 0.28),
      new THREE.Vector3(-halfW + 0.65, shelfY1, -halfD + 0.2));
    this.boxPart(acc, MAT_WOOD, new THREE.Vector3(1.6, 0.07, 0.28),
      new THREE.Vector3(-halfW + 0.65, shelfY2, -halfD + 0.2));

    // Shelf uprights
    this.boxPart(acc, MAT_WOOD, new THREE.Vector3(0.07, shelfY2 + 0.07, 0.07),
      new THREE.Vector3(-halfW + 0.2, shelfY2 / 2, -halfD + 0.2));
    this.boxPart(acc, MAT_WOOD, new THREE.Vector3(0.07, shelfY2 + 0.07, 0.07),
      new THREE.Vector3(-halfW + 1.0, shelfY2 / 2, -halfD + 0.2));
  }

  /** Small house: interior wall partition + door frame accent. */
  private static addSmallHouseAccents(
    acc: GeoAccum,
    halfW: number,
    halfD: number,
    postH: number,
    plinthH: number,
    postSize: number
  ) {
    // Interior partition wall (half-height, divides room)
    const partW = 0.12;
    const partH = 1.3;
    const partY = plinthH + partH / 2;
    this.boxPart(acc, MAT_STONE, new THREE.Vector3(partW, partH, halfD * 0.8),
      new THREE.Vector3(-halfW * 0.3, partY, 0));

    // Door frame accent (two thin vertical posts on south side)
    const frameY = plinthH + 1.4;
    const frameW = 0.08;
    this.boxPart(acc, MAT_WOOD, new THREE.Vector3(frameW, 1.4, frameW),
      new THREE.Vector3(-0.5, frameY, halfD - 0.15));
    this.boxPart(acc, MAT_WOOD, new THREE.Vector3(frameW, 1.4, frameW),
      new THREE.Vector3(0.5, frameY, halfD - 0.15));

    // Lintel (horizontal beam above door)
    this.boxPart(acc, MAT_WOOD, new THREE.Vector3(1.08, 0.1, 0.1),
      new THREE.Vector3(0, plinthH + 1.4 + 0.7, halfD - 0.15));
  }
}

// Shared toon gradient (kept out of EnvironmentGenerator to avoid
// circular imports). Mirrors the stepping used by the environment.
class EnvironmentToonGradient {
  private static gradient: THREE.DataTexture | null = null;
  static sharedGradient(): THREE.DataTexture | null {
    if (EnvironmentToonGradient.gradient) return EnvironmentToonGradient.gradient;
    const colors = new Uint8Array(4 * 4);
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
    EnvironmentToonGradient.gradient = gradientMap;
    return gradientMap;
  }
}