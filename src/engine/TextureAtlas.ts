import * as THREE from 'three';

export enum AtlasTextureType {
  STONES_LIGHT = 'stones_light',
  GRASS = 'grass',
  STONES_DARK = 'stones_dark',
  BRICKS_ORANGE = 'bricks_orange',
  STONES_ROUND = 'stones_round',
  WOOD_BARK = 'wood_bark',
  WALL_LIGHT = 'wall_light',
  ROOF_TILES = 'roof_tiles'
}

const ATLAS_COLS = 4;
const ATLAS_ROWS = 2;

export class TextureAtlas {
  private static instance: TextureAtlas;
  private texture: THREE.Texture;
  private loadingPromise: Promise<THREE.Texture> | null = null;
  private materialsList: THREE.MeshToonMaterial[] = [];

  private constructor() {
    // Initialize with a 1x1 white pixel placeholder image
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1, 1);
    
    this.texture = new THREE.CanvasTexture(canvas);
    this.texture.name = 'atlas-placeholder';
    this.texture.needsUpdate = true;
  }

  public static getInstance(): TextureAtlas {
    if (!TextureAtlas.instance) {
      TextureAtlas.instance = new TextureAtlas();
    }
    return TextureAtlas.instance;
  }

  public async load(): Promise<THREE.Texture> {
    if (this.loadingPromise) return this.loadingPromise;
    if (this.texture.name === 'atlas-real') return this.texture;

    this.loadingPromise = new Promise((resolve, reject) => {
      const loader = new THREE.TextureLoader();
      loader.load(
        '/textures/atlas.jpg',
        (tex) => {
          // Robust update: assign settings to the loaded texture
          tex.wrapS = THREE.RepeatWrapping;
          tex.wrapT = THREE.RepeatWrapping;
          tex.magFilter = THREE.NearestFilter;
          tex.minFilter = THREE.NearestMipmapLinearFilter;
          tex.flipY = true;
          tex.name = 'atlas-real';
          tex.needsUpdate = true;
          
          // Swap the stored texture reference for future getMaterial calls
          this.texture = tex;
          
          // Update all previously created materials with the real texture reference
          this.materialsList.forEach((mat) => {
            mat.map = tex;
            mat.needsUpdate = true;
          });
          
          resolve(tex);
        },
        undefined,
        (err) => {
          console.error('FAILED TO LOAD ATLAS:', err);
          reject(err);
        }
      );
    });

    return this.loadingPromise;
  }

  public getUVMapping(type: AtlasTextureType): { u: number; v: number; w: number; h: number } {
    let col = 0;
    let row = 0; // 0 is Top, 1 is Bottom

    switch (type) {
      case AtlasTextureType.STONES_LIGHT: col = 0; row = 0; break;
      case AtlasTextureType.GRASS: col = 1; row = 0; break;
      case AtlasTextureType.STONES_DARK: col = 2; row = 0; break;
      case AtlasTextureType.BRICKS_ORANGE: col = 3; row = 0; break;
      case AtlasTextureType.STONES_ROUND: col = 0; row = 1; break;
      case AtlasTextureType.WOOD_BARK: col = 1; row = 1; break;
      case AtlasTextureType.WALL_LIGHT: col = 2; row = 1; break;
      case AtlasTextureType.ROOF_TILES: col = 3; row = 1; break;
    }

    // Convert row to UV space (0 is bottom, 1 is top)
    const uvRow = 1 - row; // Row 0 (Top) becomes 1. Row 1 (Bottom) becomes 0.
    
    return {
      u: col / ATLAS_COLS,
      v: (row === 0 ? 0.5 : 0.0), // Corrected: Row 0 is Top half [0.5, 1.0], Row 1 is Bottom half [0.0, 0.5]
      w: 1 / ATLAS_COLS,
      h: 1 / ATLAS_ROWS
    };
  }

  public applyUVs(geometry: THREE.BufferGeometry, type: AtlasTextureType, repeatU: number = 1, repeatV: number = 1) {
    const mapping = this.getUVMapping(type);
    const uvAttr = geometry.attributes.uv;
    if (!uvAttr) return;

    // Tiny inset to prevent texture bleeding at tile boundaries
    const padding = 0.001;
    const safeW = mapping.w - padding * 2;
    const safeH = mapping.h - padding * 2;
    const safeU = mapping.u + padding;
    const safeV = mapping.v + padding;

    for (let i = 0; i < uvAttr.count; i++) {
      const u = uvAttr.getX(i);
      const v = uvAttr.getY(i);
      
      let wrappedU = u * repeatU;
      let wrappedV = v * repeatV;

      if (repeatU > 1) {
        wrappedU = ((wrappedU % 1.0) + 1.0) % 1.0;
      } else {
        wrappedU = Math.max(0, Math.min(1, wrappedU));
      }

      if (repeatV > 1) {
        wrappedV = ((wrappedV % 1.0) + 1.0) % 1.0;
      } else {
        wrappedV = Math.max(0, Math.min(1, wrappedV));
      }

      uvAttr.setXY(
        i,
        safeU + wrappedU * safeW,
        safeV + wrappedV * safeH
      );
    }
    uvAttr.needsUpdate = true;
  }

  /**
   * Automatically calculates UV scaling based on geometry dimensions to maintain consistent pixel density.
   * Eliminates stretching by tiling the atlas sub-rect based on world-space units.
   */
  public applyConsistentUVs(geometry: THREE.BufferGeometry, type: AtlasTextureType, unitsPerTile: number = 1.0) {
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    if (!box) return;

    const size = new THREE.Vector3();
    box.getSize(size);

    // Determine primary axes for UV projection or scaling
    // For standard geometries, we often want to scale V by height and U by width/circumference
    // We'll use a heuristic: scale repeat based on the largest dimensions relative to TPU
    const repeatU = Math.max(1, size.x / unitsPerTile);
    const repeatV = Math.max(1, size.y / unitsPerTile);

    this.applyUVs(geometry, type, repeatU, repeatV);
  }

  public getMaterial(type: AtlasTextureType): THREE.MeshToonMaterial {
    const mat = new THREE.MeshToonMaterial({
      map: this.texture,
      side: THREE.DoubleSide,
      transparent: false,
      alphaTest: 0.5
    });
    
    // Register the material for automatic texture swaps when preloading completes
    this.materialsList.push(mat);
    
    // We can't easily access the gradient here without passing it, 
    // but we can at least ensure it's not transparent and has the right map.
    return mat;
  }
}
