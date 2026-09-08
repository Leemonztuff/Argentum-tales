import * as THREE from 'three';

/**
 * MaterialFactory — centralized material creation with shared settings.
 * Ensures consistent toon gradient, normal strength, and specular settings
 * across all world objects (terrain, props, decorations, sprites).
 */
export class MaterialFactory {
  private static instance: MaterialFactory | null = null;

  /** Shared 4-step toon gradient texture (AAA HD-2D style). */
  public readonly toonGradient: THREE.DataTexture;

  /** Shared toon material options for consistent lighting. */
  public readonly toonDefaults = {
    side: THREE.DoubleSide as THREE.Side,
    transparent: false,
    alphaTest: 0.5,
  };

  private constructor() {
    this.toonGradient = MaterialFactory.createToonGradient();
  }

  public static getInstance(): MaterialFactory {
    if (!MaterialFactory.instance) {
      MaterialFactory.instance = new MaterialFactory();
    }
    return MaterialFactory.instance;
  }

  /**
   * Creates a toon-shaded material with the shared gradient map.
   * Used for terrain, props, and decorations.
   */
  createToonMaterial(opts: {
    color?: number;
    map?: THREE.Texture;
    emissive?: number;
    emissiveIntensity?: number;
    transparent?: boolean;
    opacity?: number;
    side?: THREE.Side;
    depthWrite?: boolean;
  } = {}): THREE.MeshToonMaterial {
    return new THREE.MeshToonMaterial({
      map: opts.map ?? null,
      color: opts.color,
      emissive: opts.emissive,
      emissiveIntensity: opts.emissiveIntensity,
      transparent: opts.transparent ?? this.toonDefaults.transparent,
      opacity: opts.opacity,
      side: opts.side ?? this.toonDefaults.side,
      depthWrite: opts.depthWrite ?? true,
      gradientMap: this.toonGradient,
    });
  }

  /**
   * Creates a basic unlit material for debug/VFX/UI elements.
   */
  createBasicMaterial(opts: {
    color?: number;
    transparent?: boolean;
    opacity?: number;
    wireframe?: boolean;
    side?: THREE.Side;
  } = {}): THREE.MeshBasicMaterial {
    return new THREE.MeshBasicMaterial({
      color: opts.color,
      transparent: opts.transparent ?? false,
      opacity: opts.opacity,
      wireframe: opts.wireframe ?? false,
      side: opts.side ?? THREE.FrontSide,
    });
  }

  private static createToonGradient(): THREE.DataTexture {
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
    return gradientMap;
  }
}
