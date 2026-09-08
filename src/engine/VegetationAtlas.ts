import * as THREE from 'three';
import { NEW_TEXTURE_SHEETS, type SpriteCell } from '../data/newTextureManifest';

/**
 * UV region for a single vegetation cell in the unified atlas.
 */
export interface VegetationCellUV {
  u0: number;
  v0: number;
  u1: number;
  v1: number;
  aspect: number;
}

const ATLAS_SIZE = 512;

/** URLs candidatas, en orden de preferencia. */
export const VEGETATION_ATLAS_URLS = [
  '/newTexture/Extra/TX%20Plant%20with%20Shadow.png',
  '/newTexture/TX%20Plant%20with%20Shadow.png',
  '/newTexture/TX%20Plant.png',
];

/**
 * Caché de imágenes compartida entre todas las instancias.
 * Permite que `loadSync()` tenga éxito dentro de `buildMap()` si
 * `AssetLoader.preloadMapAssets()` ya precargó el atlas con `load()`.
 */
const sharedVegImageCache = new Map<string, HTMLImageElement>();

function getCachedVegImage(): HTMLImageElement | null {
  for (const url of VEGETATION_ATLAS_URLS) {
    const img = sharedVegImageCache.get(url);
    if (img && img.complete && img.naturalWidth > 0) return img;
  }
  return null;
}

/**
 * Loads TX Plant with Shadow.png (or falls back to TX Plant.png) and maps
 * every cell ID to its normalised UV region within the atlas texture.
 *
 * All vegetation (trees, bushes, grass, herbs, mushrooms) shares this single
 * texture via one ShaderMaterial — zero texture switches, one draw call.
 */
export class VegetationAtlas {
  private texture: THREE.Texture | null = null;
  private cellUVs = new Map<string, VegetationCellUV>();
  private ready = false;

  /** Tries the "with Shadow" composite first, then plain plant sheet. */
  async load(): Promise<boolean> {
    if (this.ready) return true;

    // Reutilizar imagen ya cacheada por otra instancia (p. ej. precarga).
    const cached = getCachedVegImage();
    if (cached) {
      this.texture = this.createTexture(cached);
      this.buildUVLookup();
      this.ready = true;
      return true;
    }

    let img: HTMLImageElement | null = null;
    for (const url of VEGETATION_ATLAS_URLS) {
      img = await this.tryLoad(url);
      if (img) break;
    }

    if (!img) {
      console.warn('[VegetationAtlas] Could not load any plant texture');
      return false;
    }

    this.texture = this.createTexture(img);
    this.buildUVLookup();
    this.ready = true;
    return true;
  }

  /**
   * Sync load — tiene éxito si la imagen ya está en caché (precargada por
   * `load()` en `AssetLoader`). Ya NO intenta cargar sincrónicamente una
   * imagen sin caché: eso siempre fallaba en el primer buildMap y dejaba
   * el sistema de vegetación con 0 instancias (árboles invisibles).
   */
  loadSync(): boolean {
    if (this.ready) return true;
    const cached = getCachedVegImage();
    if (!cached) return false;

    this.texture = this.createTexture(cached);
    this.buildUVLookup();
    this.ready = true;
    return true;
  }

  /** Precarga las imágenes sin crear texturas (para AssetLoader). */
  static async preloadImages(): Promise<boolean> {
    if (getCachedVegImage()) return true;
    for (const url of VEGETATION_ATLAS_URLS) {
      const img = await VegetationAtlas.loadImage(url);
      if (img) return true;
    }
    console.warn('[VegetationAtlas] preloadImages: no se pudo cargar ninguna textura vegetal');
    return false;
  }

  private static loadImage(url: string): Promise<HTMLImageElement | null> {
    const cached = sharedVegImageCache.get(url);
    if (cached && cached.complete && cached.naturalWidth > 0) return Promise.resolve(cached);
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (img.naturalWidth > 0) {
          sharedVegImageCache.set(url, img);
          resolve(img);
        } else resolve(null);
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  getTexture(): THREE.Texture | null {
    return this.texture;
  }

  getCellUV(id: string): VegetationCellUV | undefined {
    return this.cellUVs.get(id);
  }

  isReady(): boolean {
    return this.ready;
  }

  dispose(): void {
    this.texture?.dispose();
    this.texture = null;
    this.cellUVs.clear();
    this.ready = false;
  }

  // ---- private ----

  private createTexture(img: HTMLImageElement): THREE.Texture {
    const texture = new THREE.Texture(img);
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.generateMipmaps = false;
    texture.colorSpace = THREE.SRGBColorSpace;
    // flipY por defecto (true): el origen UV está abajo-izquierda.
    texture.needsUpdate = true;
    return texture;
  }

  private buildUVLookup(): void {
    const plant = NEW_TEXTURE_SHEETS.plant;
    for (const cell of plant.cells) {
      const { bbox } = cell;
      // bbox usa Y-hacia-abajo (canvas/PNG); con flipY=true hay que invertir V.
      this.cellUVs.set(cell.id, {
        u0: bbox.x / ATLAS_SIZE,
        v0: 1 - (bbox.y + bbox.h) / ATLAS_SIZE,
        u1: (bbox.x + bbox.w) / ATLAS_SIZE,
        v1: 1 - bbox.y / ATLAS_SIZE,
        aspect: bbox.w / bbox.h,
      });
    }
  }

  private tryLoad(url: string): Promise<HTMLImageElement | null> {
    const cached = sharedVegImageCache.get(url);
    if (cached && cached.complete && cached.naturalWidth > 0) return Promise.resolve(cached);
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (img.naturalWidth > 0) {
          sharedVegImageCache.set(url, img);
          resolve(img);
        } else resolve(null);
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }
}
