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

    const urls = [
      '/newTexture/Extra/TX%20Plant%20with%20Shadow.png',
      '/newTexture/TX%20Plant%20with%20Shadow.png',
      '/newTexture/TX%20Plant.png',
    ];

    let img: HTMLImageElement | null = null;
    for (const url of urls) {
      img = await this.tryLoad(url);
      if (img) break;
    }

    if (!img) {
      console.warn('[VegetationAtlas] Could not load any plant texture');
      return false;
    }

    this.texture = new THREE.Texture(img);
    this.texture.minFilter = THREE.NearestFilter;
    this.texture.magFilter = THREE.NearestFilter;
    this.texture.wrapS = THREE.ClampToEdgeWrapping;
    this.texture.wrapT = THREE.ClampToEdgeWrapping;
    this.texture.generateMipmaps = false;
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.needsUpdate = true;

    this.buildUVLookup();
    this.ready = true;
    return true;
  }

  /** Sync load — returns null if image not yet available. */
  loadSync(): boolean {
    if (this.ready) return true;
    const url = '/newTexture/Extra/TX%20Plant%20with%20Shadow.png';
    const img = new Image();
    img.src = url;
    if (!img.complete || img.naturalWidth === 0) return false;

    this.texture = new THREE.Texture(img);
    this.texture.minFilter = THREE.NearestFilter;
    this.texture.magFilter = THREE.NearestFilter;
    this.texture.wrapS = THREE.ClampToEdgeWrapping;
    this.texture.wrapT = THREE.ClampToEdgeWrapping;
    this.texture.generateMipmaps = false;
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.needsUpdate = true;

    this.buildUVLookup();
    this.ready = true;
    return true;
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

  private buildUVLookup(): void {
    const plant = NEW_TEXTURE_SHEETS.plant;
    for (const cell of plant.cells) {
      const { bbox } = cell;
      this.cellUVs.set(cell.id, {
        u0: bbox.x / ATLAS_SIZE,
        v0: bbox.y / ATLAS_SIZE,
        u1: (bbox.x + bbox.w) / ATLAS_SIZE,
        v1: (bbox.y + bbox.h) / ATLAS_SIZE,
        aspect: bbox.w / bbox.h,
      });
    }
  }

  private tryLoad(url: string): Promise<HTMLImageElement | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (img.naturalWidth > 0) resolve(img);
        else resolve(null);
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }
}
