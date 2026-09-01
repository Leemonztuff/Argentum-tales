import * as THREE from 'three';
import { GameMap, PlayerCharacter, ActiveMob, FloatingText, SelectedTarget, NPC } from '../types/game';
import { MOBS } from '../data/mobs';
import { SPRITESHEETS, CLASS_SPRITES, NPC_SPRITES, DEFAULT_MOB_SPRITE, DEFAULT_NPC_SPRITE } from '../data/spritesheets';
import { AssetLoader } from './AssetLoader';
import { EnvironmentGenerator } from './EnvironmentGenerator';
import { TextureAtlas, AtlasTextureType } from './TextureAtlas';
import { PixelShaderConfig, ShaderPresetMode } from './PixelShaderPass';
import { SpritePBRGenerator, SpriteMaterialTextures } from './SpritePBRGenerator';
import { CameraManager } from './CameraManager';
import { SpriteInstancingManager } from './SpriteInstancingManager';
import { PostProcessingManager } from './PostProcessingManager';

export { type SpriteMaterialTextures };

export class Game3DRenderer {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private animationFrameId: number | null = null;

  // Capable-device (desktop/high-perf mobile) vs low-power target: drives pixelRatio,
  // tone mapping, and shadow resolution scaling (L1/L2).
  private readonly deviceHighQuality: boolean;

  // Submodules
  public cameraManager: CameraManager;
  public instancingManager: SpriteInstancingManager;
  public postProcessingManager: PostProcessingManager;

  public get camera(): THREE.PerspectiveCamera {
    return this.cameraManager.getCamera();
  }

  public get sharedBillboardGeometry(): THREE.PlaneGeometry {
    return this.instancingManager.getSharedBillboardGeometry();
  }

  public get cameraMode(): 'DEADZONE' | 'HARD_FOLLOW' {
    return this.cameraManager.cameraMode;
  }
  public set cameraMode(val: 'DEADZONE' | 'HARD_FOLLOW') {
    this.cameraManager.cameraMode = val;
  }

  public get cameraPixelSnap(): boolean {
    return this.cameraManager.cameraPixelSnap;
  }
  public set cameraPixelSnap(val: boolean) {
    this.cameraManager.cameraPixelSnap = val;
  }

  public get cameraSmoothing(): boolean {
    return this.cameraManager.cameraSmoothing;
  }
  public set cameraSmoothing(val: boolean) {
    this.cameraManager.cameraSmoothing = val;
  }

  public get logicalCameraPos(): THREE.Vector3 {
    return this.cameraManager.getLogicalPosition();
  }

  public get logicalCameraTarget(): THREE.Vector3 {
    return this.cameraManager.getLogicalTarget();
  }

  // Active map reference
  private currentMap: GameMap | null = null;

  // Object pools & references
  private tileGroup: THREE.Group;
  private entityGroup: THREE.Group;
  private vfxGroup: THREE.Group;
  private lightGroup: THREE.Group;
  private telegraphGroup: THREE.Group;

  // Active meshes with 2.5D dynamic normal mapping
  private playerMesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial> | null = null;
  private playerLight: THREE.PointLight | null = null;
  private dirLight: THREE.DirectionalLight | null = null;
  private hemiLight: THREE.HemisphereLight | null = null;
  private ambientLight: THREE.AmbientLight | null = null;
  private playerFacingIndicator: THREE.Group | null = null;
  private alignmentLine: THREE.Line | null = null;
  private groundReticleGroup: THREE.Group | null = null;
  private reticleOuterRing: THREE.Mesh | null = null;
  private reticleInnerRing: THREE.Mesh | null = null;
  private reticleInnerPulse: THREE.Mesh | null = null;
  private reticleBrackets: THREE.Group | null = null;
  private reticleStatusSprite: THREE.Sprite | null = null;
  private currentReticleColor: number = 0x22c55e;
  private currentAlignmentStatus: 'in_range' | 'aligned_far' | 'misaligned' = 'in_range';

  private npcSprites: Map<string, THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>> = new Map();
  private chestMeshes: Map<string, THREE.Group> = new Map();
  private gatherMeshes: Map<string, THREE.Group> = new Map();

  // Raycasting for target selection
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private mouseVector: THREE.Vector2 = new THREE.Vector2();
  private onTargetSelectedCallback: ((target: SelectedTarget) => void) | null = null;
  private currentActiveMobs: ActiveMob[] = [];

  // Textures cache & specialized 2.5D Sprite PBR Generator
  // Bounded LRU cache: sprite/reticle textures are keyed by a fine-grained combo
  // (hp %, orientation, anim frame) that can grow combinatorially during combat (T3).
  private readonly SPRITE_TEXTURE_CACHE_MAX = 512;
  private spriteTextureCache: Map<string, THREE.Texture> = new Map();
  public pbrGenerator: SpritePBRGenerator = new SpritePBRGenerator();
  private imageCache: Map<string, HTMLImageElement> = new Map();

  // 2.5D Sprite Normal & Specular Lighting Getters & Setters
  public get spriteNormalEnabled(): boolean { return this.pbrGenerator.spriteNormalEnabled; }
  public set spriteNormalEnabled(val: boolean) { this.pbrGenerator.spriteNormalEnabled = val; }

  public get spriteNormalStrength(): number { return this.pbrGenerator.spriteNormalStrength; }
  public set spriteNormalStrength(val: number) { this.pbrGenerator.spriteNormalStrength = val; }

  public get spriteSpecularIntensity(): number { return this.pbrGenerator.spriteSpecularIntensity; }
  public set spriteSpecularIntensity(val: number) { this.pbrGenerator.spriteSpecularIntensity = val; }

  public get spriteSpecularShininess(): number { return this.pbrGenerator.spriteSpecularShininess; }
  public set spriteSpecularShininess(val: number) { this.pbrGenerator.spriteSpecularShininess = val; }

  public get spriteSpecularRimPower(): number { return this.pbrGenerator.spriteSpecularRimPower; }
  public set spriteSpecularRimPower(val: number) { this.pbrGenerator.spriteSpecularRimPower = val; }

  public setSpriteNormalEnabled(enabled: boolean): void {
    this.pbrGenerator.spriteNormalEnabled = enabled;
    this.playerNeedsTextureRefresh = true;
    this.mobsNeedTextureRefresh = true;
    if (this.playerMesh && this.playerMesh.material) {
      this.playerMesh.material.normalMap = enabled ? ((this.playerMesh.material.userData.normalMap as THREE.Texture) || null) : null;
      this.playerMesh.material.needsUpdate = true;
    }
    this.instancingManager.setNormalMapEnabled(enabled);
    this.npcSprites.forEach((mesh) => {
      mesh.material.normalMap = enabled ? ((mesh.material.userData.normalMap as THREE.Texture) || null) : null;
      mesh.material.needsUpdate = true;
    });
  }

  public setSpriteNormalStrength(strength: number): void {
    this.pbrGenerator.spriteNormalStrength = Math.max(0, Math.min(4.0, strength));
    this.pbrGenerator.clearCaches();
    this.playerNeedsTextureRefresh = true;
    this.mobsNeedTextureRefresh = true;
    if (this.playerMesh && this.playerMesh.material) {
      this.playerMesh.material.normalScale.set(this.pbrGenerator.spriteNormalStrength, this.pbrGenerator.spriteNormalStrength);
    }
    this.instancingManager.setNormalScale(this.pbrGenerator.spriteNormalStrength);
    this.npcSprites.forEach((mesh) => {
      mesh.material.normalScale.set(this.pbrGenerator.spriteNormalStrength, this.pbrGenerator.spriteNormalStrength);
    });
  }

  public setSpriteSpecularIntensity(intensity: number): void {
    this.pbrGenerator.spriteSpecularIntensity = Math.max(0, Math.min(5.0, intensity));
    this.updateSpriteShaderUniforms();
  }

  public setSpriteSpecularShininess(shininess: number): void {
    this.pbrGenerator.spriteSpecularShininess = Math.max(1.0, Math.min(128.0, shininess));
    this.updateSpriteShaderUniforms();
  }

  public setSpriteSpecularRimPower(rim: number): void {
    this.pbrGenerator.spriteSpecularRimPower = Math.max(0, Math.min(3.0, rim));
    this.updateSpriteShaderUniforms();
  }

  public isSpriteNormalEnabled(): boolean {
    return this.spriteNormalEnabled;
  }

  public getSpriteNormalStrength(): number {
    return this.spriteNormalStrength;
  }

  public getSpriteSpecularIntensity(): number {
    return this.spriteSpecularIntensity;
  }

  public getSpriteSpecularShininess(): number {
    return this.spriteSpecularShininess;
  }

  public getSpriteSpecularRimPower(): number {
    return this.spriteSpecularRimPower;
  }

  private updateSpriteShaderUniforms(): void {
    const updateMaterial = (mat: THREE.MeshStandardMaterial | null) => {
      if (!mat) return;
      if (mat.userData && mat.userData.shader && mat.userData.shader.uniforms) {
        if (mat.userData.shader.uniforms.uSpecularIntensity) {
          mat.userData.shader.uniforms.uSpecularIntensity.value = this.spriteSpecularIntensity;
        }
        if (mat.userData.shader.uniforms.uSpecularShininess) {
          mat.userData.shader.uniforms.uSpecularShininess.value = this.spriteSpecularShininess;
        }
        if (mat.userData.shader.uniforms.uSpecularRimPower) {
          mat.userData.shader.uniforms.uSpecularRimPower.value = this.spriteSpecularRimPower;
        }
      }
    };

    if (this.playerMesh) updateMaterial(this.playerMesh.material);
    this.instancingManager.updateSpecularUniforms(
      this.spriteSpecularIntensity,
      this.spriteSpecularShininess,
      this.spriteSpecularRimPower
    );
    this.npcSprites.forEach((m) => updateMaterial(m.material));
  }

  private getOrLoadImage(url: string): HTMLImageElement | null {
    // Check AssetLoader cache first
    const preloaded = AssetLoader.getInstance().getImage(url);
    if (preloaded) {
      this.imageCache.set(url, preloaded);
      return preloaded;
    }

    let img = this.imageCache.get(url);
    if (!img) {
      img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;
      img.onload = () => {
        this.spriteTextureCache.clear();
        this.pbrGenerator.clearCaches();
        this.playerNeedsTextureRefresh = true;
        this.mobsNeedTextureRefresh = true;
      };
      img.onerror = () => {
        console.warn('Failed to load sprite image from:', url);
      };
      this.imageCache.set(url, img);
    }
    return img.complete && img.naturalWidth > 0 ? img : null;
  }

  // Screen shake & Miss VFX state
  private shakeIntensity: number = 0;
  private shakeEndTime: number = 0;
  private shakeDuration: number = 250;
  private currentPlayerPos: { x: number; y: number } | null = null;
  private smoothPlayerPos: { x: number; y: number } | null = null;
  private smoothMobPos: Map<string, { x: number; y: number }> = new Map();
  private smoothCameraTarget: THREE.Vector3 = new THREE.Vector3(12, 0.8, 12);

  // Player render state & distance-based footstep animation
  private playerRenderParams: {
    icon: string;
    glowColor: string;
    name: string;
    isStealthed: boolean;
    facing: 'up' | 'down' | 'left' | 'right';
    spriteUrl: string;
  } | null = null;
  private playerNeedsTextureRefresh: boolean = false;
  private playerWalkDistance: number = 0;
  private playerLastAnimFrame: number = -1;

  // Mobs render state & distance-based footstep animation
  private mobRenderParams: Map<string, {
    sprite: string;
    glowColor: string;
    name: string;
    hpPct: number;
    spriteUrl: string;
    facing: 'up' | 'down' | 'left' | 'right';
    isBoss: boolean;
  }> = new Map();
  private mobsNeedTextureRefresh: boolean = false;
  private mobWalkDistances: Map<string, number> = new Map();
  private mobLastAnimFrames: Map<string, number> = new Map();

  // State & Pixel Perfect Debug Engine
  private currentMapId: string = '';
  private targetCameraPos: THREE.Vector3 = new THREE.Vector3();
  private isDestroyed: boolean = false;
  private onMapRenderedCallback: (() => void) | null = null;
  private hasRenderedCurrentMap: boolean = false;

  // Precision movement configuration and state
  public moveSpeed: number = 4.5;
  public joystickDeadzone: number = 0.12;
  public cameraDeadzonePercent: number = 0.30;

  private logicalPlayerPos: THREE.Vector2 = new THREE.Vector2(12, 12);
  public activeInput: { x: number; y: number } = { x: 0, y: 0 };
  private joystickInput: THREE.Vector2 = new THREE.Vector2(0, 0);
  private activeKeys: Set<string> = new Set();
  private lastFrameTime: number = 0;
  private lastSyncedX: number = -1;
  private lastSyncedY: number = -1;
  private lastSyncedFacing: string = '';

  private onPlayerMoveContinuousCallback: ((x: number, y: number, facing: 'up' | 'down' | 'left' | 'right') => void) | null = null;
  private boundKeyDown: ((e: KeyboardEvent) => void) | null = null;
  private boundKeyUp: ((e: KeyboardEvent) => void) | null = null;

  public setOnPlayerMoveContinuous(cb: (x: number, y: number, facing: 'up' | 'down' | 'left' | 'right') => void) {
    this.onPlayerMoveContinuousCallback = cb;
  }

  public setJoystickInput(x: number, y: number) {
    if (Math.abs(x) > Math.abs(y)) {
      this.joystickInput.set(Math.sign(x), 0);
    } else if (Math.abs(y) >= Math.abs(x) && (x !== 0 || y !== 0)) {
      this.joystickInput.set(0, Math.sign(y));
    } else {
      this.joystickInput.set(0, 0);
    }
  }

  private initInputListeners() {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) return;
      if (['ArrowUp', 'KeyW', 'ArrowDown', 'KeyS', 'ArrowLeft', 'KeyA', 'ArrowRight', 'KeyD'].includes(e.code)) {
        this.activeKeys.add(e.code);
        this.updateActiveInput();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW', 'ArrowDown', 'KeyS', 'ArrowLeft', 'KeyA', 'ArrowRight', 'KeyD'].includes(e.code)) {
        this.activeKeys.delete(e.code);
        this.updateActiveInput();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    this.boundKeyDown = handleKeyDown;
    this.boundKeyUp = handleKeyUp;
  }

  private updateActiveInput() {
    let dx = 0;
    let dy = 0;
    if (this.activeKeys.has('KeyW') || this.activeKeys.has('ArrowUp')) dy -= 1;
    if (this.activeKeys.has('KeyS') || this.activeKeys.has('ArrowDown')) dy += 1;
    if (this.activeKeys.has('KeyA') || this.activeKeys.has('ArrowLeft')) dx -= 1;
    if (this.activeKeys.has('KeyD') || this.activeKeys.has('ArrowRight')) dx += 1;

    // Enforce 4 directions (no diagonals)
    if (dx !== 0 && dy !== 0) {
      dy = 0;
    }

    this.activeInput.x = dx;
    this.activeInput.y = dy;
  }

  public setOnMapRenderedCallback(callback: (() => void) | null) {
    this.onMapRenderedCallback = callback;
    if (callback && this.hasRenderedCurrentMap) {
      callback();
    }
  }

  // Debug Toggle for Pixel-Perfect Rendering Mode & Bounds Visualizer
  public pixelPerfectEnabled: boolean = true;
  public showDebugBounds: boolean = false;
  private debugGroup: THREE.Group = new THREE.Group();
  private debugWireframes: THREE.Object3D[] = [];

  public setPixelPerfect(enabled: boolean): void {
    this.pixelPerfectEnabled = enabled;
    this.spriteTextureCache.clear();
    this.playerNeedsTextureRefresh = true;
    this.mobsNeedTextureRefresh = true;
  }

  public togglePixelPerfect(): boolean {
    const nextState = !this.pixelPerfectEnabled;
    this.setPixelPerfect(nextState);
    return nextState;
  }

  public isPixelPerfect(): boolean {
    return this.pixelPerfectEnabled;
  }

  public setDebugBounds(enabled: boolean): void {
    this.showDebugBounds = enabled;
    this.spriteTextureCache.clear();
    this.playerNeedsTextureRefresh = true;
    this.mobsNeedTextureRefresh = true;
    if (!enabled) {
      this.clearDebugWireframes();
    }
  }

  public toggleDebugBounds(): boolean {
    const nextState = !this.showDebugBounds;
    this.setDebugBounds(nextState);
    return nextState;
  }

  public isDebugBoundsEnabled(): boolean {
    return this.showDebugBounds;
  }

  private clearDebugWireframes(): void {
    this.debugWireframes.forEach((obj) => {
      this.debugGroup.remove(obj);
      if ((obj as any).geometry) (obj as any).geometry.dispose();
      if ((obj as any).material) (obj as any).material.dispose();
    });
    this.debugWireframes = [];
  }

  public getCameraDeadzoneUnits(): number {
    if (!this.container || this.isDestroyed || !this.camera) return 2.2;
    const height = this.container.clientHeight || 1;
    const width = this.container.clientWidth || 1;
    const aspect = width / height;

    // Depth and height offsets of the camera
    const dY = 13.5 - (aspect < 1.0 ? 1.35 : 0.8);
    const dZ = aspect < 1.0 ? 11.5 : 10.5;
    const d = Math.sqrt(dY * dY + dZ * dZ);

    // Total vertical units visible on screen at player's y plane (approximate)
    const visibleHeight = 2 * d * Math.tan((this.camera.fov * Math.PI) / 360);
    const visibleWidth = visibleHeight * aspect;

    // We want the deadzone to be ~25-35% of the screen width/height.
    // Let's take the percentage of the minimum dimension to keep the box balanced
    const minVisibleDim = Math.min(visibleWidth, visibleHeight);
    return minVisibleDim * (this.cameraDeadzonePercent / 2); // Divide by 2 because deadzone is measured as a radius!
  }

  // Snapping 3D world coordinates to the screen pixel grid
  private getDynamicPixelsPerUnit(): number {
    if (!this.container || this.isDestroyed) return 48;
    const height = this.container.clientHeight || 1;
    const aspect = this.container.clientWidth / height;
    const dY = 13.5 - (aspect < 1.0 ? 1.35 : 0.8);
    const dZ = aspect < 1.0 ? 11.5 : 10.5;
    const d = Math.sqrt(dY * dY + dZ * dZ);
    const visibleHeight = 2 * d * Math.tan((this.camera.fov * Math.PI) / 360);
    const pixelRatio = this.renderer ? this.renderer.getPixelRatio() : window.devicePixelRatio;
    return (height * pixelRatio) / visibleHeight;
  }

  private snapVal(val: number): number {
    if (!this.pixelPerfectEnabled) return val;
    const pixelsPerUnit = this.getDynamicPixelsPerUnit();
    return Math.round(val * pixelsPerUnit) / pixelsPerUnit;
  }

  private createStylizedShadowMesh(isBoss: boolean = false): THREE.Mesh {
    const radius = isBoss ? 0.75 : 0.38;
    const geo = new THREE.CircleGeometry(radius, 16);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x020617, // slate-950 dark tone
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.01;
    return mesh;
  }

  private getPixelPerfectSpriteScale(isBoss: boolean = false): number {
    if (!this.pixelPerfectEnabled) return isBoss ? 3.5 : 2.3;
    const pixelsPerUnit = this.getDynamicPixelsPerUnit();
    const baseScale = 256 / pixelsPerUnit;
    return isBoss ? baseScale * 1.5 : baseScale;
  }

  private envGen: EnvironmentGenerator;

  constructor(container: HTMLElement) {
    this.container = container;

    // Detect low-power/mobile targets to scale rendering quality (L2).
    this.deviceHighQuality = !(
      (typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)) ||
      (typeof navigator !== 'undefined' && navigator.hardwareConcurrency != null && navigator.hardwareConcurrency <= 4)
    );

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0f1d);
    
    this.envGen = new EnvironmentGenerator();

    const aspect = container.clientWidth / (container.clientHeight || 1);

    // Initialize submodules
    this.cameraManager = new CameraManager(aspect);

    // Groups
    this.tileGroup = new THREE.Group();
    this.entityGroup = new THREE.Group();
    this.vfxGroup = new THREE.Group();
    this.lightGroup = new THREE.Group();
    this.telegraphGroup = new THREE.Group();

    this.instancingManager = new SpriteInstancingManager(this.entityGroup);
    const initRatio = this.deviceHighQuality ? window.devicePixelRatio : Math.min(window.devicePixelRatio, 1.5);
    this.postProcessingManager = new PostProcessingManager(
      container.clientWidth,
      container.clientHeight,
      initRatio
    );

    // Renderer — Pixel-Perfect setup with crisp image rendering on canvas
    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    // Clamp pixel ratio on mobile/low-power devices to protect frame budget (L2).
    const ratio = this.deviceHighQuality ? window.devicePixelRatio : Math.min(window.devicePixelRatio, 1.5);
    this.renderer.setPixelRatio(ratio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    // Tone mapping for AAA-grade highlight rolloff (L1): ACES on capable devices,
    // cheaper Reinhard on low-power/mobile targets.
    this.renderer.toneMapping = this.deviceHighQuality ? THREE.ACESFilmicToneMapping : THREE.ReinhardToneMapping;
    this.renderer.toneMappingExposure = this.deviceHighQuality ? 1.0 : 1.0;

    // Set CSS image-rendering to force pixelated upscale
    this.renderer.domElement.style.imageRendering = 'pixelated';
    (this.renderer.domElement.style as any).imageRendering = '-moz-crisp-edges';
    (this.renderer.domElement.style as any).imageRendering = 'crisp-edges';
    (this.renderer.domElement.style as any).imageRendering = '-webkit-optimize-contrast';
    container.appendChild(this.renderer.domElement);

    this.scene.add(this.tileGroup);
    this.scene.add(this.entityGroup);
    this.scene.add(this.vfxGroup);
    this.scene.add(this.lightGroup);
    this.scene.add(this.telegraphGroup);
    this.scene.add(this.debugGroup);

    // Alignment Line (§5.1 & §5.2)
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.05, 0),
      new THREE.Vector3(0, 0.05, 0),
    ]);
    const lineMat = new THREE.LineDashedMaterial({
      color: 0x22c55e,
      dashSize: 0.25,
      gapSize: 0.1,
      linewidth: 3,
      transparent: true,
      opacity: 0.9,
    });
    this.alignmentLine = new THREE.Line(lineGeo, lineMat);
    this.alignmentLine.computeLineDistances();
    this.alignmentLine.visible = false;
    this.vfxGroup.add(this.alignmentLine);

    // Ground Target Reticle System
    this.initGroundReticle();

    // Player Facing Direction Ground Indicator
    this.initPlayerFacingIndicator();

    // Raycast click/tap to target
    this.initRaycastingEvents();

    this.initGlobalLights();
    this.initInputListeners();
    this.startLoop();
  }

  /**
   * Universal texture scaling function to ensure consistent mapping across all assets.
   * Maps a mesh's geometry to the global TextureAtlas while eliminating stretching.
   */
  public scaleAtlasTextureOnMesh(mesh: THREE.Mesh, type: AtlasTextureType, unitsPerTile: number = 1.0) {
    if (!mesh.geometry) return;
    const atlas = TextureAtlas.getInstance();
    atlas.applyConsistentUVs(mesh.geometry, type, unitsPerTile);
    mesh.material = atlas.getMaterial(type);
  }

  private initGroundReticle() {
    this.groundReticleGroup = new THREE.Group();
    this.groundReticleGroup.visible = false;

    // 1. Outer Rotating Ring — reduced opacity for clean visual blending under sprites
    const outerGeo = new THREE.RingGeometry(0.55, 0.65, 32);
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    this.reticleOuterRing = new THREE.Mesh(outerGeo, outerMat);
    this.reticleOuterRing.rotation.x = -Math.PI / 2;
    this.reticleOuterRing.position.y = 0.03;
    this.groundReticleGroup.add(this.reticleOuterRing);

    // 2. Inner Rotating Ring — reduced opacity for clean visual blending
    const innerGeo = new THREE.RingGeometry(0.35, 0.42, 32);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    this.reticleInnerRing = new THREE.Mesh(innerGeo, innerMat);
    this.reticleInnerRing.rotation.x = -Math.PI / 2;
    this.reticleInnerRing.position.y = 0.035;
    this.groundReticleGroup.add(this.reticleInnerRing);

    // 3. Inner Pulsing Core Disc — reduced opacity and disabled depthWrite
    const pulseGeo = new THREE.CircleGeometry(0.48, 32);
    const pulseMat = new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
    });
    this.reticleInnerPulse = new THREE.Mesh(pulseGeo, pulseMat);
    this.reticleInnerPulse.rotation.x = -Math.PI / 2;
    this.reticleInnerPulse.position.y = 0.025;
    this.groundReticleGroup.add(this.reticleInnerPulse);

    // 4. Cardinal Crosshair Ticks — reduced opacity and disabled depthWrite
    this.reticleBrackets = new THREE.Group();
    const tickGeo = new THREE.PlaneGeometry(0.08, 0.24);
    const tickMat = new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });

    // North
    const tickN = new THREE.Mesh(tickGeo, tickMat);
    tickN.rotation.x = -Math.PI / 2;
    tickN.position.set(0, 0.04, -0.72);
    this.reticleBrackets.add(tickN);

    // South
    const tickS = new THREE.Mesh(tickGeo, tickMat);
    tickS.rotation.x = -Math.PI / 2;
    tickS.position.set(0, 0.04, 0.72);
    this.reticleBrackets.add(tickS);

    // East
    const tickE = new THREE.Mesh(tickGeo, tickMat);
    tickE.rotation.x = -Math.PI / 2;
    tickE.rotation.z = Math.PI / 2;
    tickE.position.set(0.72, 0.04, 0);
    this.reticleBrackets.add(tickE);

    // West
    const tickW = new THREE.Mesh(tickGeo, tickMat);
    tickW.rotation.x = -Math.PI / 2;
    tickW.rotation.z = Math.PI / 2;
    tickW.position.set(-0.72, 0.04, 0);
    this.reticleBrackets.add(tickW);

    this.groundReticleGroup.add(this.reticleBrackets);

    // 5. Reticle Status Badge Sprite on Floor
    const statusMat = new THREE.SpriteMaterial({ transparent: true, opacity: 0.95 });
    this.reticleStatusSprite = new THREE.Sprite(statusMat);
    this.reticleStatusSprite.scale.set(1.6, 0.4, 1);
    this.reticleStatusSprite.position.set(0, 0.15, 0.75);
    this.groundReticleGroup.add(this.reticleStatusSprite);

    this.vfxGroup.add(this.groundReticleGroup);
  }

  private initPlayerFacingIndicator() {
    this.playerFacingIndicator = new THREE.Group();

    // Directional ground chevron
    const chevronGeo = new THREE.ConeGeometry(0.2, 0.4, 3);
    const chevronMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.8,
    });
    const chevronMesh = new THREE.Mesh(chevronGeo, chevronMat);
    chevronMesh.rotation.x = Math.PI / 2;
    chevronMesh.position.set(0, 0.02, -0.6);
    this.playerFacingIndicator.add(chevronMesh);

    // Subtle foot circle
    const footRingGeo = new THREE.RingGeometry(0.3, 0.36, 16);
    const footRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4,
    });
    const footRing = new THREE.Mesh(footRingGeo, footRingMat);
    footRing.rotation.x = -Math.PI / 2;
    footRing.position.y = 0.015;
    this.playerFacingIndicator.add(footRing);

    this.vfxGroup.add(this.playerFacingIndicator);
  }

  private initRaycastingEvents() {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!this.container || this.isDestroyed) return;
      const rect = this.container.getBoundingClientRect();
      const clientX = 'touches' in event ? event.touches[0]?.clientX ?? 0 : event.clientX;
      const clientY = 'touches' in event ? event.touches[0]?.clientY ?? 0 : event.clientY;

      this.mouseVector.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      this.mouseVector.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouseVector, this.cameraManager.getCamera());

      // Check intersection with instanced mob billboards and NPC meshes
      const meshesToTest: THREE.Object3D[] = [
        ...this.instancingManager.getMeshesForRaycast()
      ];
      const meshToNpcMap = new Map<THREE.Object3D, NPC>();

      if (this.currentMap) {
        this.currentMap.npcs.forEach((npc) => {
          const mesh = this.npcSprites.get(npc.id);
          if (mesh) {
            meshesToTest.push(mesh);
            meshToNpcMap.set(mesh, npc);
          }
        });
      }

      const intersects = this.raycaster.intersectObjects(meshesToTest, false);
      if (intersects.length > 0) {
        const hitMesh = intersects[0].object;
        const instanceId = intersects[0].instanceId;

        const selectedMob = this.instancingManager.getMobFromIntersection(hitMesh, instanceId);
        const selectedNpc = meshToNpcMap.get(hitMesh);

        if (selectedMob && this.onTargetSelectedCallback) {
          this.onTargetSelectedCallback({ type: 'mob', mob: selectedMob });
        } else if (selectedNpc && this.onTargetSelectedCallback) {
          this.onTargetSelectedCallback({ type: 'npc', npc: selectedNpc });
        }
      } else {
        if (this.onTargetSelectedCallback) {
          this.onTargetSelectedCallback(null);
        }
      }
    };

    this.container.addEventListener('click', handlePointerDown);
  }

  public setOnTargetSelectedCallback(cb: (target: SelectedTarget) => void) {
    this.onTargetSelectedCallback = cb;
  }

  private initGlobalLights() {
    this.lightGroup.clear();

    // Warm daylight sky + cool ambient ground bounce
    this.hemiLight = new THREE.HemisphereLight(0xfffbeb, 0x475569, 0.85);
    this.lightGroup.add(this.hemiLight);

    // Global fill light to prevent black crush in shadowed crevices on mobile displays
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    this.lightGroup.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xfff7ed, 1.25); // Warm golden sunlight
    this.dirLight.position.set(15, 30, 20);
    this.dirLight.castShadow = true;
    // Scale shadow resolution by device quality (1024 low-power / 2048 desktop) (L2)
    const shadowRes = this.deviceHighQuality ? 2048 : 1024;
    this.dirLight.shadow.mapSize.width = shadowRes;
    this.dirLight.shadow.mapSize.height = shadowRes;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 100;
    const d = 30;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0005;
    this.lightGroup.add(this.dirLight);

    // Torch / player aura light
    this.playerLight = new THREE.PointLight(0xfef08a, 0.8, 8, 1.5);
    this.playerLight.position.set(0, 1.5, 0);
    this.lightGroup.add(this.playerLight);
  }

  public updateLightingByTime(timeProgress: number, isNight: boolean) {
    if (!this.hemiLight || !this.ambientLight || !this.dirLight) return;

    if (isNight) {
      // Night lighting: deep indigo/blue night
      this.hemiLight.color.setHex(0x1e1b4b);
      this.hemiLight.groundColor.setHex(0x090d16);
      this.hemiLight.intensity = 0.35;

      this.ambientLight.color.setHex(0x38bdf8);
      this.ambientLight.intensity = 0.2;

      this.dirLight.color.setHex(0x60a5fa);
      this.dirLight.intensity = 0.35;

      if (this.playerLight) {
        this.playerLight.intensity = 1.35;
        this.playerLight.distance = 10;
      }
    } else if (timeProgress >= 0.22 && timeProgress < 0.28) {
      // Sunrise
      this.hemiLight.color.setHex(0xfde047);
      this.hemiLight.groundColor.setHex(0x334155);
      this.hemiLight.intensity = 0.65;

      this.ambientLight.color.setHex(0xfef08a);
      this.ambientLight.intensity = 0.35;

      this.dirLight.color.setHex(0xfb923c);
      this.dirLight.intensity = 0.95;
    } else if (timeProgress >= 0.72 && timeProgress < 0.78) {
      // Sunset
      this.hemiLight.color.setHex(0xf97316);
      this.hemiLight.groundColor.setHex(0x1e293b);
      this.hemiLight.intensity = 0.6;

      this.ambientLight.color.setHex(0xfdb241);
      this.ambientLight.intensity = 0.3;

      this.dirLight.color.setHex(0xea580c);
      this.dirLight.intensity = 0.8;
    } else {
      // Day
      this.hemiLight.color.setHex(0xfffbeb);
      this.hemiLight.groundColor.setHex(0x475569);
      this.hemiLight.intensity = 0.85;

      this.ambientLight.color.setHex(0xffffff);
      this.ambientLight.intensity = 0.45;

      this.dirLight.color.setHex(0xfff7ed);
      this.dirLight.intensity = 1.25;

      if (this.playerLight) {
        this.playerLight.intensity = 0.8;
        this.playerLight.distance = 8;
      }
    }
  }

  public handleResize() {
    if (!this.container || this.isDestroyed) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight || 1;
    this.cameraManager.handleResize(width, height);
    this.renderer.setSize(width, height);
    // Keep post-processing rendering resolution aligned with the clamped pixel ratio (L2).
    const ratio = this.deviceHighQuality ? window.devicePixelRatio : Math.min(window.devicePixelRatio, 1.5);
    this.renderer.setPixelRatio(ratio);
    this.postProcessingManager.setSize(width, height, ratio);
  }

  // --- MAP BUILDING ---
  public loadMap(map: GameMap) {
    this.currentMap = map;
    this.currentMapId = map.id;
    this.hasRenderedCurrentMap = false;
    this.smoothPlayerPos = null;
    this.playerWalkDistance = 0;
    this.playerLastAnimFrame = -1;
    this.smoothMobPos.clear();
    this.mobWalkDistances.clear();
    this.mobLastAnimFrames.clear();
    this.mobRenderParams.clear();
    this.tileGroup.clear();
    this.chestMeshes.clear();
    this.gatherMeshes.clear();

    // Clear transient VFX/telegraph/debug between maps to avoid resource leaks (R8).
    // Persistent reticle/facing indicator/alignment line are preserved.
    this.clearTransientVfx();
    this.disposeGroupChildren(this.telegraphGroup);
    this.disposeGroupChildren(this.debugGroup);

    // Map theme background & fog
    this.scene.background = new THREE.Color(map.fogColor || '#0a0f1d');
    this.scene.fog = new THREE.FogExp2(map.fogColor || '#0a0f1d', map.isDungeon ? 0.035 : 0.02);

    this.envGen.buildMap(map, this.tileGroup);

    // Build NPCs with pixel-perfect scaling, crisp alpha-test, normal maps, and billboard rendering
    this.npcSprites.clear();
    map.npcs.forEach((npc) => {
      const npcUrl = NPC_SPRITES[npc.id] || DEFAULT_NPC_SPRITE;
      const spriteTextures = this.getOrCreateSpriteTextures(
        npc.sprite,
        npc.color,
        npc.name,
        false,
        1.0,
        false,
        npcUrl,
        'down',
        0
      );
      const spriteMat = this.create2DSpriteMaterial(spriteTextures);

      const mesh = new THREE.Mesh(this.sharedBillboardGeometry, spriteMat);
      mesh.frustumCulled = false;
      
      const scale = this.getPixelPerfectSpriteScale(false);
      mesh.scale.set(scale, scale, 1);
      
      const snappedX = this.snapVal(npc.x);
      const snappedY = this.snapVal(npc.y);
      mesh.position.set(snappedX, 0, snappedY);
      this.entityGroup.add(mesh);
      this.npcSprites.set(npc.id, mesh);
    });
  }

  // --- SPRITE CANVAS 2D RENDERER ---
  private renderSpriteCanvas(
    emojiOrIcon: string,
    glowColor: string,
    label?: string,
    isGhost = false,
    hpPercent = 1.0,
    showHp = false,
    spriteUrl?: string,
    facing: 'up' | 'down' | 'left' | 'right' = 'down',
    animFrame: number = 0
  ): HTMLCanvasElement {
    const isPixelMode = this.pixelPerfectEnabled;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Transparent background
    ctx.clearRect(0, 0, 256, 256);

    if (isGhost) {
      ctx.globalAlpha = 0.45;
    }

    let debugDestX = 32;
    let debugDestY = 50;
    let debugDestW = 192;
    let debugDestH = 192;

    const img = spriteUrl ? this.getOrLoadImage(spriteUrl) : null;

    if (img) {
      // 4x4 Spritesheet frame rendering with exact integer cell boundaries
      const frameW = Math.floor(img.width / 4);
      const frameH = Math.floor(img.height / 4);
      const col = animFrame % 4;
      let row = 0; // down
      if (facing === 'left') row = 1;
      else if (facing === 'right') row = 2;
      else if (facing === 'up') row = 3;

      const sx = Math.floor(col * frameW);
      const sy = Math.floor(row * frameH);

      // Disable canvas image smoothing explicitly
      ctx.imageSmoothingEnabled = false;
      (ctx as any).webkitImageSmoothingEnabled = false;
      (ctx as any).mozImageSmoothingEnabled = false;
      (ctx as any).msImageSmoothingEnabled = false;

      // Target max dimension within 256x256 texture (max height = 180 to fit label at y=22 and feet at y=236)
      const targetMaxDim = 180;
      const maxDim = Math.max(frameW, frameH);
      const scale = isPixelMode
        ? Math.max(1, Math.floor(targetMaxDim / maxDim))
        : (targetMaxDim / maxDim);

      let destW = Math.floor(frameW * scale);
      let destH = Math.floor(frameH * scale);

      if (destH > 180) {
        const ratio = 180 / destH;
        destH = 180;
        destW = Math.floor(destW * ratio);
      }
      if (destW > 220) {
        const ratio = 220 / destW;
        destW = 220;
        destH = Math.floor(destH * ratio);
      }

      const destX = Math.floor((256 - destW) / 2);
      // Feet anchored at y = 242, giving top of head destY >= 24 (never cropped at canvas top, below label at 22)
      const destY = Math.max(24, Math.floor(242 - destH));

      debugDestX = destX;
      debugDestY = destY;
      debugDestW = destW;
      debugDestH = destH;

      // Draw original sprite artwork WITHOUT shadow blur so pixels remain 100% crisp and unpolluted
      ctx.save();
      ctx.drawImage(img, sx, sy, frameW, frameH, destX, destY, destW, destH);
      ctx.restore();
    } else {
      // Fallback emoji icon while loading
      ctx.font = '96px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emojiOrIcon, 128, 120);
    }

    // Label on top (positioned cleanly above head at y = 22 with 28px clearance to head)
    if (label) {
      ctx.shadowBlur = 4;
      ctx.shadowColor = '#000000';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, 128, 22);
    }

    // Health bar on bottom
    if (showHp) {
      const barW = 160;
      const barH = 10;
      const barX = Math.floor((256 - barW) / 2);
      const barY = 244;

      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);

      const fillW = Math.floor(Math.max(0, Math.min(barW, barW * hpPercent)));
      ctx.fillStyle = hpPercent > 0.5 ? '#22c55e' : hpPercent > 0.25 ? '#eab308' : '#ef4444';
      ctx.fillRect(barX, barY, fillW, barH);
    }

    // DEBUG VISUALIZER OVERLAY (Draw bounds & collision box debugging)
    if (this.showDebugBounds) {
      ctx.save();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.strokeRect(0, 0, 256, 256);

      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.strokeRect(debugDestX, debugDestY, debugDestW, debugDestH);

      ctx.strokeStyle = '#eab308';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, debugDestY);
      ctx.lineTo(256, debugDestY);
      ctx.stroke();

      ctx.strokeStyle = '#06b6d4';
      ctx.beginPath();
      ctx.moveTo(0, 242);
      ctx.lineTo(256, 242);
      ctx.stroke();

      ctx.strokeStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(0, 22);
      ctx.lineTo(256, 22);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`CANVAS 256x256`, 6, 16);
      ctx.fillStyle = '#22c55e';
      ctx.fillText(`DRAW: [${debugDestX},${debugDestY},${debugDestW},${debugDestH}]`, 6, 32);
      ctx.restore();
    }

    return canvas;
  }

  // --- DYNAMIC 2.5D NORMAL & SPECULAR MAP GENERATOR (AAA HD-2D ARCHITECTURE) ---
  private generateSpriteMaterialTextures(
    sourceCanvas: HTMLCanvasElement,
    key: string
  ): { normalTexture: THREE.Texture; roughnessTexture: THREE.Texture; metalnessTexture: THREE.Texture } {
    return this.pbrGenerator.generateSpriteMaterialTextures(sourceCanvas, key);
  }

  // --- TEXTURE & NORMAL/SPECULAR MAP PROVIDER ---
  /**
   * LRU get: refreshes recency so the bounded sprite-texture cache evicts the
   * least-recently-used entries, bounding GPU memory during combat (T3).
   */
  private getCachedSpriteTexture(key: string): THREE.Texture | undefined {
    const tex = this.spriteTextureCache.get(key);
    if (tex) {
      // Refresh recency by re-inserting (Map preserves insertion order).
      this.spriteTextureCache.delete(key);
      this.spriteTextureCache.set(key, tex);
    }
    return tex;
  }

  /**
   * LRU set: inserts a texture and evicts the oldest entry (LRU) once the cache
   * exceeds SPRITE_TEXTURE_CACHE_MAX, disposing released textures.
   */
  private setCachedSpriteTexture(key: string, texture: THREE.Texture): void {
    if (this.spriteTextureCache.has(key)) {
      this.spriteTextureCache.delete(key);
    }
    this.spriteTextureCache.set(key, texture);
    if (this.spriteTextureCache.size > this.SPRITE_TEXTURE_CACHE_MAX) {
      const oldestKey = this.spriteTextureCache.keys().next().value as string | undefined;
      if (oldestKey !== undefined) {
        const evicted = this.spriteTextureCache.get(oldestKey);
        this.spriteTextureCache.delete(oldestKey);
        if (evicted) evicted.dispose();
      }
    }
  }

  public getOrCreateSpriteTextures(
    emojiOrIcon: string,
    glowColor: string,
    label?: string,
    isGhost = false,
    hpPercent = 1.0,
    showHp = false,
    spriteUrl?: string,
    facing: 'up' | 'down' | 'left' | 'right' = 'down',
    animFrame: number = 0
  ): SpriteMaterialTextures {
    const isPixelMode = this.pixelPerfectEnabled;
    const isDebug = this.showDebugBounds;
    const key = `${spriteUrl || emojiOrIcon}_${glowColor}_${label || ''}_${isGhost}_${Math.round(hpPercent * 10)}_${showHp}_${facing}_${animFrame}_pp${isPixelMode}_dbg${isDebug}`;

    let texture = this.getCachedSpriteTexture(key);
    let normalTexture: THREE.Texture | undefined;
    let roughnessTexture: THREE.Texture | undefined;
    let metalnessTexture: THREE.Texture | undefined;

    if (!texture) {
      const canvas = this.renderSpriteCanvas(
        emojiOrIcon,
        glowColor,
        label,
        isGhost,
        hpPercent,
        showHp,
        spriteUrl,
        facing,
        animFrame
      );

      texture = new THREE.CanvasTexture(canvas);
      texture.generateMipmaps = false;
      texture.magFilter = isPixelMode ? THREE.NearestFilter : THREE.LinearFilter;
      texture.minFilter = isPixelMode ? THREE.NearestFilter : THREE.LinearFilter;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;
      this.setCachedSpriteTexture(key, texture);

      const generated = this.generateSpriteMaterialTextures(canvas, key);
      normalTexture = generated.normalTexture;
      roughnessTexture = generated.roughnessTexture;
      metalnessTexture = generated.metalnessTexture;
    } else {
      const generated = this.generateSpriteMaterialTextures(texture.image as HTMLCanvasElement, key);
      normalTexture = generated.normalTexture;
      roughnessTexture = generated.roughnessTexture;
      metalnessTexture = generated.metalnessTexture;
    }

    return { texture, normalTexture, roughnessTexture, metalnessTexture };
  }

  // --- SPRITE 2.5D PBR & CUSTOM SPECULAR SHADER FACTORY ---
  public create2DSpriteMaterial(textures: SpriteMaterialTextures): THREE.MeshStandardMaterial {
    return this.pbrGenerator.create2DSpriteMaterial(textures);
  }

  public update2DSpriteMaterial(mat: THREE.MeshStandardMaterial, textures: SpriteMaterialTextures): void {
    mat.map = textures.texture;
    mat.normalMap = this.spriteNormalEnabled ? textures.normalTexture : null;
    mat.normalScale.set(this.spriteNormalStrength, this.spriteNormalStrength);
    mat.roughnessMap = textures.roughnessTexture;
    mat.metalnessMap = textures.metalnessTexture;
    mat.userData.normalMap = textures.normalTexture;
    mat.userData.roughnessMap = textures.roughnessTexture;
    mat.userData.metalnessMap = textures.metalnessTexture;
    mat.alphaTest = this.pixelPerfectEnabled ? 0.5 : 0.05;
    
    if (mat.userData.shader && mat.userData.shader.uniforms) {
      if (mat.userData.shader.uniforms.uSpecularIntensity) {
        mat.userData.shader.uniforms.uSpecularIntensity.value = this.spriteSpecularIntensity;
      }
      if (mat.userData.shader.uniforms.uSpecularShininess) {
        mat.userData.shader.uniforms.uSpecularShininess.value = this.spriteSpecularShininess;
      }
      if (mat.userData.shader.uniforms.uSpecularRimPower) {
        mat.userData.shader.uniforms.uSpecularRimPower.value = this.spriteSpecularRimPower;
      }
    }
    mat.needsUpdate = true;
  }

  // Backward compatibility sprite texture generator
  public generateSpriteTexture(
    emojiOrIcon: string,
    glowColor: string,
    label?: string,
    isGhost = false,
    hpPercent = 1.0,
    showHp = false,
    spriteUrl?: string,
    facing: 'up' | 'down' | 'left' | 'right' = 'down',
    animFrame: number = 0
  ): THREE.Texture {
    return this.getOrCreateSpriteTextures(
      emojiOrIcon,
      glowColor,
      label,
      isGhost,
      hpPercent,
      showHp,
      spriteUrl,
      facing,
      animFrame
    ).texture;
  }

  // --- ENTITY UPDATE LOOP ---
  public updateEntities(
    player: PlayerCharacter,
    activeMobs: ActiveMob[],
    selectedTarget: SelectedTarget,
    weaponRange: number
  ) {
    if (this.isDestroyed) return;

    // Store target player position for 60 FPS lerp smoothing
    this.currentPlayerPos = { x: player.x, y: player.y };
    if (!this.smoothPlayerPos) {
      this.smoothPlayerPos = { x: player.x, y: player.y };
    }

    // Initialize or check teleportation for precision movement (Dash, Auto-align, Portals)
    const dx = Math.abs(player.x - this.logicalPlayerPos.x);
    const dy = Math.abs(player.y - this.logicalPlayerPos.y);
    if (dx > 1.5 || dy > 1.5) {
      this.logicalPlayerPos.set(player.x, player.y);
      this.smoothPlayerPos = { x: player.x, y: player.y };
    }

    // 1. Cache Player Render Parameters
    const playerIcon = player.classType === 'guerrero' ? '🛡️🗡️' : player.classType === 'cazador' ? '🏹🧝' : player.classType === 'mago' ? '🧙‍♂️✨' : '🗡️🥷';
    const playerGlow = player.classType === 'mago' ? '#38bdf8' : player.classType === 'picaro' ? '#a855f7' : player.classType === 'guerrero' ? '#eab308' : '#22c55e';
    const playerUrl = CLASS_SPRITES[player.classType] || SPRITESHEETS.luci;

    const newPlayerParams = {
      icon: playerIcon,
      glowColor: playerGlow,
      name: player.name,
      isStealthed: player.isStealthed,
      facing: player.facing,
      spriteUrl: playerUrl,
    };

    if (
      !this.playerRenderParams ||
      this.playerRenderParams.facing !== newPlayerParams.facing ||
      this.playerRenderParams.isStealthed !== newPlayerParams.isStealthed ||
      this.playerRenderParams.name !== newPlayerParams.name ||
      this.playerRenderParams.spriteUrl !== newPlayerParams.spriteUrl
    ) {
      this.playerNeedsTextureRefresh = true;
    }
    this.playerRenderParams = newPlayerParams;

    // Update Player Facing Indicator Rotation
    if (this.playerFacingIndicator) {
      if (player.facing === 'up') this.playerFacingIndicator.rotation.y = 0;
      else if (player.facing === 'down') this.playerFacingIndicator.rotation.y = Math.PI;
      else if (player.facing === 'left') this.playerFacingIndicator.rotation.y = Math.PI / 2;
      else if (player.facing === 'right') this.playerFacingIndicator.rotation.y = -Math.PI / 2;
    }

    // 2. Cache Mobs Render Parameters
    this.currentActiveMobs = activeMobs;
    const currentMobIds = new Set<string>();

    activeMobs.forEach((mob) => {
      currentMobIds.add(mob.instanceId);
      const hpPct = mob.currentHp / mob.maxHp;
      const isBoss = mob.isBoss;
      const mobUrl = DEFAULT_MOB_SPRITE;
      const mobFacing = mob.facing || 'down';
      const glowColor = mob.isRevengeTarget ? '#dc2626' : mob.color;

      const newMobParams = {
        sprite: mob.sprite,
        glowColor,
        name: mob.name,
        hpPct,
        spriteUrl: mobUrl,
        facing: mobFacing,
        isBoss,
      };

      const existingMobParams = this.mobRenderParams.get(mob.instanceId);
      if (
        !existingMobParams ||
        existingMobParams.facing !== newMobParams.facing ||
        existingMobParams.hpPct !== newMobParams.hpPct ||
        existingMobParams.glowColor !== newMobParams.glowColor
      ) {
        this.mobsNeedTextureRefresh = true;
      }
      this.mobRenderParams.set(mob.instanceId, newMobParams);
    });

    // Remove dead/unspawned mob params
    this.smoothMobPos.forEach((_, instanceId) => {
      if (!currentMobIds.has(instanceId)) {
        this.smoothMobPos.delete(instanceId);
        this.mobRenderParams.delete(instanceId);
        this.mobWalkDistances.delete(instanceId);
        this.mobLastAnimFrames.delete(instanceId);
      }
    });

    // 3. Ground Target Reticle & Alignment Line (§5.1 & §5.2)
    if (selectedTarget) {
      if (selectedTarget.type === 'mob') {
        const targetMob = selectedTarget.mob;
        const dx = targetMob.x - player.x;
        const dy = targetMob.y - player.y;
        const isStraightX = dx === 0 && dy !== 0;
        const isStraightY = dy === 0 && dx !== 0;
        const isAxisAligned = isStraightX || isStraightY;
        const distance = isAxisAligned ? (isStraightX ? Math.abs(dy) : Math.abs(dx)) : Math.hypot(dx, dy);
        const isInRange = isAxisAligned && distance <= weaponRange;

        let status: 'in_range' | 'aligned_far' | 'misaligned' = 'misaligned';
        let colorHex = 0xef4444; // Red for enemies
        let colorCss = '#ef4444';

        if (isInRange) {
          status = 'in_range';
          colorHex = 0x22c55e; // Green
          colorCss = '#22c55e';
        } else if (isAxisAligned) {
          status = 'aligned_far';
          colorHex = 0xf59e0b; // Amber
          colorCss = '#f59e0b';
        }

        this.currentAlignmentStatus = status;
        this.currentReticleColor = colorHex;

        // Update Ground Reticle Group
        if (this.groundReticleGroup) {
          this.groundReticleGroup.visible = true;
          this.groundReticleGroup.position.set(targetMob.x, 0.02, targetMob.y);

          // Update colors of reticle parts
          if (this.reticleOuterRing) {
            (this.reticleOuterRing.material as THREE.MeshBasicMaterial).color.setHex(colorHex);
          }
          if (this.reticleInnerRing) {
            (this.reticleInnerRing.material as THREE.MeshBasicMaterial).color.setHex(colorHex);
          }
          if (this.reticleInnerPulse) {
            (this.reticleInnerPulse.material as THREE.MeshBasicMaterial).color.setHex(colorHex);
          }
          if (this.reticleBrackets) {
            this.reticleBrackets.children.forEach((child) => {
              if ((child as THREE.Mesh).material) {
                ((child as THREE.Mesh).material as THREE.MeshBasicMaterial).color.setHex(colorHex);
              }
            });
          }

          // Update floor status badge
          if (this.reticleStatusSprite) {
            const statusTex = this.generateReticleStatusTexture(status, distance, weaponRange, colorCss);
            this.reticleStatusSprite.material.map = statusTex;
            this.reticleStatusSprite.material.needsUpdate = true;
          }
        }

        // Update Alignment Line
        if (this.alignmentLine) {
          this.alignmentLine.visible = true;
          const positions = new Float32Array([
            player.x, 0.06, player.y,
            targetMob.x, 0.06, targetMob.y,
          ]);
          this.alignmentLine.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
          const lineMat = this.alignmentLine.material as THREE.LineDashedMaterial;
          lineMat.color.setHex(colorHex);
          lineMat.dashSize = status === 'in_range' ? 0.2 : status === 'aligned_far' ? 0.35 : 0.15;
          lineMat.gapSize = status === 'in_range' ? 0.08 : status === 'aligned_far' ? 0.15 : 0.25;
          lineMat.opacity = status === 'misaligned' ? 0.55 : 0.95;
          this.alignmentLine.computeLineDistances();
        }

        // Highlight Player Facing Indicator if aligned
        if (this.playerFacingIndicator) {
          const chevron = this.playerFacingIndicator.children[0] as THREE.Mesh;
          if (chevron && chevron.material) {
            (chevron.material as THREE.MeshBasicMaterial).color.setHex(isInRange ? 0x22c55e : 0x38bdf8);
          }
        }
      } else if (selectedTarget.type === 'npc') {
        const npc = selectedTarget.npc;
        const colorHex = 0x22c55e; // Green for NPC / allies
        const colorCss = '#22c55e';

        this.currentAlignmentStatus = 'in_range';
        this.currentReticleColor = colorHex;

        if (this.groundReticleGroup) {
          this.groundReticleGroup.visible = true;
          this.groundReticleGroup.position.set(npc.x, 0.02, npc.y);

          if (this.reticleOuterRing) {
            (this.reticleOuterRing.material as THREE.MeshBasicMaterial).color.setHex(colorHex);
          }
          if (this.reticleInnerRing) {
            (this.reticleInnerRing.material as THREE.MeshBasicMaterial).color.setHex(colorHex);
          }
          if (this.reticleInnerPulse) {
            (this.reticleInnerPulse.material as THREE.MeshBasicMaterial).color.setHex(colorHex);
          }
          if (this.reticleBrackets) {
            this.reticleBrackets.children.forEach((child) => {
              if ((child as THREE.Mesh).material) {
                ((child as THREE.Mesh).material as THREE.MeshBasicMaterial).color.setHex(colorHex);
              }
            });
          }

          if (this.reticleStatusSprite) {
            const statusTex = this.generateReticleStatusTexture('npc', 0, 0, colorCss);
            this.reticleStatusSprite.material.map = statusTex;
            this.reticleStatusSprite.material.needsUpdate = true;
          }
        }

        if (this.alignmentLine) {
          this.alignmentLine.visible = false;
        }

        if (this.playerFacingIndicator) {
          const chevron = this.playerFacingIndicator.children[0] as THREE.Mesh;
          if (chevron && chevron.material) {
            (chevron.material as THREE.MeshBasicMaterial).color.setHex(0x38bdf8);
          }
        }
      }
    } else {
      if (this.groundReticleGroup) {
        this.groundReticleGroup.visible = false;
      }
      if (this.alignmentLine) {
        this.alignmentLine.visible = false;
      }
      if (this.playerFacingIndicator) {
        const chevron = this.playerFacingIndicator.children[0] as THREE.Mesh;
        if (chevron && chevron.material) {
          (chevron.material as THREE.MeshBasicMaterial).color.setHex(0x38bdf8);
        }
      }
    }

    // 4. Boss Telegraph AoE Zones (§5.9) — dispose previous frame's resources (P4)
    this.disposeGroupChildren(this.telegraphGroup);
    activeMobs.forEach((mob) => {
      if (mob.state === 'telegraphing' && mob.telegraphRadius) {
        const circleGeo = new THREE.RingGeometry(0.2, mob.telegraphRadius, 32);
        const circleMat = new THREE.MeshBasicMaterial({
          color: 0xef4444,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.6,
        });
        const mesh = new THREE.Mesh(circleGeo, circleMat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(mob.x, 0.08, mob.y);
        this.telegraphGroup.add(mesh);
      }
    });
  }

  /**
   * Releases geometry/material/texture resources of every child in a group
   * and empties it. Prevents GPU/CPU memory leaks from per-frame `new` + clear.
   */
  private disposeGroupChildren(group: THREE.Group) {
    const toRemove: THREE.Object3D[] = [];
    group.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) {
        mat.forEach((m) => m.dispose());
      } else if (mat) {
        mat.dispose();
      }
      if ((child as THREE.Sprite).material) {
        ((child as THREE.Sprite).material as THREE.SpriteMaterial).dispose();
      }
    });
    group.children.forEach((child) => toRemove.push(child));
    toRemove.forEach((child) => group.remove(child));
  }

  /**
   * Clears transient VFX from the vfx group (projectiles, telegraphs, loot hops,
   * dust/impact/miss particles) while preserving the persistent target reticle,
   * player-facing indicator and alignment line. Resources are released.
   */
  private clearTransientVfx() {
    const persistent: THREE.Object3D[] = [];
    if (this.groundReticleGroup) persistent.push(this.groundReticleGroup);
    if (this.playerFacingIndicator) persistent.push(this.playerFacingIndicator);
    if (this.alignmentLine) persistent.push(this.alignmentLine);

    const transient: THREE.Object3D[] = [];
    this.vfxGroup.children.forEach((child) => {
      if (!persistent.includes(child)) transient.push(child);
    });
    transient.forEach((child) => {
      this.vfxGroup.remove(child);
      const mesh = child as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      if ((child as THREE.Sprite).material) {
        ((child as THREE.Sprite).material as THREE.SpriteMaterial).dispose();
      } else {
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else if (mat) mat.dispose();
      }
      child.traverse((sub) => {
        if (sub !== child) {
          const subMesh = sub as THREE.Mesh;
          if (subMesh.geometry) subMesh.geometry.dispose();
          const subMat = subMesh.material as THREE.Material | THREE.Material[] | undefined;
          if (Array.isArray(subMat)) subMat.forEach((m) => m.dispose());
          else if (subMat) subMat.dispose();
        }
      });
    });
  }

  // --- SPELL PROJECTILE ANIMATION ---
  public spawnSpellEffect(
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    color: string
  ) {
    const spellMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 8, 8),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color) })
    );
    spellMesh.position.set(startX, 0.8, startY);
    this.vfxGroup.add(spellMesh);

    const startTime = Date.now();
    const duration = 250;

    const animateProjectile = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(1, elapsed / duration);

      spellMesh.position.x = startX + (targetX - startX) * t;
      spellMesh.position.z = startY + (targetY - startY) * t;

      if (t < 1) {
        requestAnimationFrame(animateProjectile);
      } else {
        this.vfxGroup.remove(spellMesh);
        spellMesh.geometry.dispose();
        (spellMesh.material as THREE.Material).dispose();
      }
    };

    animateProjectile();
  }

  // --- AUTO-ALIGN DESTINATION INDICATOR ---
  public spawnAutoAlignIndicator(x: number, y: number) {
    const group = new THREE.Group();
    group.position.set(x, 0.04, y);
    this.vfxGroup.add(group);

    // 1. A targeting ring
    const ringGeo = new THREE.RingGeometry(0.32, 0.45, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b, // Amber
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    group.add(ringMesh);

    // 2. An inner spinning cross/plus to mark the precise destination
    const crossGeo = new THREE.PlaneGeometry(0.6, 0.6);
    // Draw crosshair/target texture in a canvas
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, 128, 128);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(14, 64); ctx.lineTo(114, 64);
    ctx.moveTo(64, 14); ctx.lineTo(64, 114);
    ctx.stroke();

    const crossTex = new THREE.CanvasTexture(canvas);
    const crossMat = new THREE.MeshBasicMaterial({
      map: crossTex,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    });
    const crossMesh = new THREE.Mesh(crossGeo, crossMat);
    crossMesh.rotation.x = -Math.PI / 2;
    group.add(crossMesh);

    // 3. Floating text banner "ATACAR AQUÍ"
    const textCanvas = document.createElement('canvas');
    textCanvas.width = 128;
    textCanvas.height = 32;
    const textCtx = textCanvas.getContext('2d')!;
    textCtx.clearRect(0, 0, 128, 32);
    textCtx.fillStyle = 'rgba(8, 8, 12, 0.85)';
    textCtx.strokeStyle = '#f59e0b';
    textCtx.lineWidth = 2;
    textCtx.beginPath();
    textCtx.roundRect(4, 2, 120, 28, 6);
    textCtx.fill();
    textCtx.stroke();
    textCtx.fillStyle = '#f59e0b';
    textCtx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
    textCtx.textAlign = 'center';
    textCtx.textBaseline = 'middle';
    textCtx.fillText('ATACAR AQUÍ', 64, 16);

    const textTex = new THREE.CanvasTexture(textCanvas);
    const textMat = new THREE.SpriteMaterial({ map: textTex, transparent: true, opacity: 0.9 });
    const textSprite = new THREE.Sprite(textMat);
    textSprite.position.set(0, 0.75, 0);
    textSprite.scale.set(1.4, 0.35, 1);
    group.add(textSprite);

    const startTime = Date.now();
    const duration = 1800; // Lives for 1.8s (or until finished/fade)

    const animateIndicator = () => {
      if (this.isDestroyed) {
        cleanUp();
        return;
      }

      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Pulse ring size slightly
      const pulse = 1.0 + Math.sin(Date.now() * 0.01) * 0.1;
      ringMesh.scale.set(pulse, pulse, 1);

      // Rotate inner crosshair
      crossMesh.rotation.z += 0.02;

      // Bob floating text sprite
      textSprite.position.y = 0.75 + Math.sin(Date.now() * 0.006) * 0.06;

      // Fade out
      if (progress > 0.6) {
        const fadeRatio = (1 - progress) / 0.4;
        ringMat.opacity = 0.85 * fadeRatio;
        crossMat.opacity = 0.9 * fadeRatio;
        textMat.opacity = 0.9 * fadeRatio;
      }

      if (progress < 1) {
        requestAnimationFrame(animateIndicator);
      } else {
        cleanUp();
      }
    };

    const cleanUp = () => {
      this.vfxGroup.remove(group);
      ringGeo.dispose();
      ringMat.dispose();
      crossGeo.dispose();
      crossMat.dispose();
      crossTex.dispose();
      textTex.dispose();
      textMat.dispose();
    };

    animateIndicator();
  }

  // --- RETICLE STATUS TEXTURE GENERATOR ---
  private generateReticleStatusTexture(
    status: 'in_range' | 'aligned_far' | 'misaligned' | 'npc',
    distance: number,
    weaponRange: number,
    color: string
  ): THREE.Texture {
    const distRound = Math.round(distance * 10) / 10;
    const key = `reticle_status_${status}_${distRound}_${weaponRange}_${color}`;
    const cached = this.getCachedSpriteTexture(key);
    if (cached) {
      return cached;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 256, 64);

    // Background pill badge
    ctx.fillStyle = 'rgba(8, 8, 12, 0.9)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(8, 8, 240, 48, 24);
    ctx.fill();
    ctx.stroke();

    // Text & icon
    ctx.fillStyle = color;
    ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let text = '';
    if (status === 'npc') {
      text = `🛡️ NPC / ALIADO`;
    } else if (status === 'in_range') {
      text = `🎯 EN RANGO (${distRound} ${distRound === 1 ? 'casilla' : 'casillas'})`;
    } else if (status === 'aligned_far') {
      text = `📏 ALINEADO (${distRound} / Max ${weaponRange})`;
    } else {
      text = `⚠️ DESALINEADO (${distRound} en diagonal)`;
    }

    ctx.fillText(text, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearFilter;
    this.setCachedSpriteTexture(key, texture);
    return texture;
  }

  // --- SCREEN SHAKE & MISS DUST EFFECTS ---
  public triggerScreenShake(intensity = 0.35, durationMs = 250) {
    this.cameraManager.triggerShake(intensity, durationMs);
  }

  public triggerCriticalHitShake(
    isPlayerDealing = true,
    intensity = 0.68,
    durationMs = 400,
    x?: number,
    y?: number
  ) {
    // 1. Camera Rotational Time Tilt & FOV Punch Shake
    const tiltRad = isPlayerDealing ? 0.065 : 0.085;
    const fovPunch = isPlayerDealing ? 3.8 : 4.5;
    this.cameraManager.triggerCriticalImpact(intensity, durationMs, tiltRad, fovPunch);

    // 2. Spawn 3D Critical Impact VFX if position provided
    if (x !== undefined && y !== undefined) {
      this.spawnCriticalImpactVfx(x, y, isPlayerDealing);
    }
  }

  public spawnCriticalImpactVfx(x: number, y: number, isPlayerDealing = true) {
    const shockColor = isPlayerDealing ? 0xa855f7 : 0xef4444; // Purple/Gold vs Crimson
    const particleColor = isPlayerDealing ? 0xfacc15 : 0xd97706;

    // Expanding shockwave ring
    const ringGeo = new THREE.RingGeometry(0.15, 0.45, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: shockColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.set(x, 0.05, y);
    this.vfxGroup.add(ringMesh);

    // Radial Sparks
    const particleCount = 18;
    const particles: Array<{
      mesh: THREE.Mesh;
      vx: number;
      vy: number;
      vz: number;
    }> = [];

    const sparkMat = new THREE.MeshBasicMaterial({
      color: particleColor,
      transparent: true,
      opacity: 1,
    });

    for (let i = 0; i < particleCount; i++) {
      const pGeo = new THREE.PlaneGeometry(0.12, 0.12);
      const pMesh = new THREE.Mesh(pGeo, sparkMat.clone());
      pMesh.rotation.x = -Math.PI / 2;
      pMesh.position.set(x, 0.2 + Math.random() * 0.3, y);

      const angle = (i / particleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const speed = 0.08 + Math.random() * 0.08;
      particles.push({
        mesh: pMesh,
        vx: Math.cos(angle) * speed,
        vy: 0.04 + Math.random() * 0.06,
        vz: Math.sin(angle) * speed,
      });
      this.vfxGroup.add(pMesh);
    }

    const startTime = Date.now();
    const duration = 450;

    const animateImpact = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress >= 1) {
        this.vfxGroup.remove(ringMesh);
        ringGeo.dispose();
        ringMat.dispose();

        particles.forEach((p) => {
          this.vfxGroup.remove(p.mesh);
          p.mesh.geometry.dispose();
          (p.mesh.material as THREE.Material).dispose();
        });
        return;
      }

      // Expand ring
      const scale = 1 + progress * 3.5;
      ringMesh.scale.set(scale, scale, 1);
      ringMat.opacity = 0.9 * (1 - progress);

      // Animate particles
      particles.forEach((p) => {
        p.mesh.position.x += p.vx;
        p.mesh.position.y += p.vy;
        p.mesh.position.z += p.vz;
        p.vy -= 0.002; // gravity
        (p.mesh.material as THREE.MeshBasicMaterial).opacity = 1 - progress;
      });

      requestAnimationFrame(animateImpact);
    };

    requestAnimationFrame(animateImpact);
  }

  public triggerMissEffects(x: number, y: number) {
    // 1. Camera screen shake
    this.triggerScreenShake(0.38, 260);

    // 2. Expanding dust ring on ground
    const ringGeo = new THREE.RingGeometry(0.1, 0.25, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xcbd5e1,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.set(x, 0.03, y);
    this.vfxGroup.add(ringMesh);

    // 3. Smoke / Dust particle puff animation
    const particleCount = 12;
    const particles: Array<{
      mesh: THREE.Mesh;
      vx: number;
      vy: number;
      vz: number;
      initialOpacity: number;
    }> = [];

    const dustGeo = new THREE.SphereGeometry(0.14, 8, 8);

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 0.018 + Math.random() * 0.025;
      const opacity = 0.65 + Math.random() * 0.3;

      const dustMat = new THREE.MeshBasicMaterial({
        color: Math.random() > 0.4 ? 0x94a3b8 : 0xe2e8f0,
        transparent: true,
        opacity,
      });

      const particleMesh = new THREE.Mesh(dustGeo, dustMat);
      particleMesh.position.set(
        x + (Math.random() - 0.5) * 0.25,
        0.1 + Math.random() * 0.2,
        y + (Math.random() - 0.5) * 0.25
      );

      const scale = 0.8 + Math.random() * 0.8;
      particleMesh.scale.set(scale, scale, scale);

      this.vfxGroup.add(particleMesh);

      particles.push({
        mesh: particleMesh,
        vx: Math.cos(angle) * speed,
        vy: 0.015 + Math.random() * 0.02,
        vz: Math.sin(angle) * speed,
        initialOpacity: opacity,
      });
    }

    const startTime = Date.now();
    const duration = 380;

    const animateMissVfx = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      const remainingRatio = 1 - progress;

      // Expand ground ring
      if (ringMesh) {
        const ringScale = 1 + progress * 3.2;
        ringMesh.scale.set(ringScale, ringScale, 1);
        ringMat.opacity = 0.85 * remainingRatio;
      }

      // Animate smoke particles
      particles.forEach((p) => {
        p.mesh.position.x += p.vx;
        p.mesh.position.y += p.vy;
        p.mesh.position.z += p.vz;

        p.vx *= 0.93;
        p.vz *= 0.93;

        const scaleProgress = 1 + progress * 1.1;
        p.mesh.scale.set(scaleProgress, scaleProgress, scaleProgress);

        (p.mesh.material as THREE.MeshBasicMaterial).opacity = p.initialOpacity * remainingRatio;
      });

      if (progress < 1) {
        requestAnimationFrame(animateMissVfx);
      } else {
        // Cleanup
        this.vfxGroup.remove(ringMesh);
        ringGeo.dispose();
        ringMat.dispose();

        particles.forEach((p) => {
          this.vfxGroup.remove(p.mesh);
          p.mesh.geometry.dispose();
          (p.mesh.material as THREE.Material).dispose();
        });
      }
    };

    animateMissVfx();
  }

  // --- RENDER LOOP ---
  private startLoop() {
    const animate = () => {
      if (this.isDestroyed) return;
      this.animationFrameId = requestAnimationFrame(animate);

      const now = performance.now();
      if (!this.lastFrameTime) {
        this.lastFrameTime = now;
      }
      const deltaTime = Math.min(0.05, (now - this.lastFrameTime) / 1000); // Clamp deltaTime to avoid giant jumps
      this.lastFrameTime = now;

      // Animated world fluids (stylized water waves / lava pulse)
      this.envGen.update(deltaTime);

      // Flickering torch lights
      if (this.playerLight) {
        this.playerLight.intensity = 1.1 + Math.sin(Date.now() * 0.01) * 0.15;
      }

      // 1. Move Player Deterministically and Immediate Stride Animation
      if (this.currentPlayerPos) {
        if (!this.smoothPlayerPos) {
          this.smoothPlayerPos = { x: this.currentPlayerPos.x, y: this.currentPlayerPos.y };
          this.logicalPlayerPos.set(this.currentPlayerPos.x, this.currentPlayerPos.y);
          this.logicalCameraTarget.set(this.currentPlayerPos.x, 0.8, this.currentPlayerPos.y);
          this.logicalCameraPos.set(this.currentPlayerPos.x, 13.5, this.currentPlayerPos.y + 10.5);

          this.smoothCameraTarget.copy(this.logicalCameraTarget);
          this.camera.position.copy(this.logicalCameraPos);
          this.camera.lookAt(this.smoothCameraTarget);
        }

        // Compute input direction from keys or joystick
        let moveX = 0;
        let moveY = 0;
        if (this.joystickInput.lengthSq() > 0.0001) {
          moveX = this.joystickInput.x;
          moveY = this.joystickInput.y;
        } else {
          moveX = this.activeInput.x;
          moveY = this.activeInput.y;
        }

        const inputLength = Math.hypot(moveX, moveY);
        if (inputLength > 0.001) {
          let normX = moveX;
          let normY = moveY;
          if (inputLength > 1.0) {
            normX /= inputLength;
            normY /= inputLength;
          }

          // Compute continuous physical step with custom speed config
          const velocityX = normX * this.moveSpeed;
          const velocityY = normY * this.moveSpeed;

          const nextX = this.logicalPlayerPos.x + velocityX * deltaTime;
          const nextY = this.logicalPlayerPos.y + velocityY * deltaTime;

          // Slide-collision resolution (AABB walls + borders + NPCs + mobs)
          const resolved = this.resolvePlayerCollision(nextX, nextY);
          this.logicalPlayerPos.set(resolved.x, resolved.y);

          // Update facing immediately
          let facing: 'up' | 'down' | 'left' | 'right' = this.playerRenderParams?.facing || 'down';
          if (Math.abs(normX) > Math.abs(normY)) {
            facing = normX > 0 ? 'right' : 'left';
          } else if (normY !== 0) {
            facing = normY > 0 ? 'down' : 'up';
          }

          if (this.playerRenderParams) {
            if (this.playerRenderParams.facing !== facing) {
              this.playerRenderParams.facing = facing;
              this.playerNeedsTextureRefresh = true;
            }
          }

          // Sync integer coordinates back to React to trigger map transition & targeting
          const targetX = Math.round(this.logicalPlayerPos.x);
          const targetY = Math.round(this.logicalPlayerPos.y);
          if (targetX !== this.lastSyncedX || targetY !== this.lastSyncedY || facing !== this.lastSyncedFacing) {
            this.lastSyncedX = targetX;
            this.lastSyncedY = targetY;
            this.lastSyncedFacing = facing;
            if (this.onPlayerMoveContinuousCallback) {
              this.onPlayerMoveContinuousCallback(targetX, targetY, facing);
            }
          }
        }

        const prevPx = this.smoothPlayerPos.x;
        const prevPy = this.smoothPlayerPos.y;

        // Position directly (No movement lag/lerp!)
        this.smoothPlayerPos.x = this.logicalPlayerPos.x;
        this.smoothPlayerPos.y = this.logicalPlayerPos.y;

        const px = this.smoothPlayerPos.x;
        const py = this.smoothPlayerPos.y;

        // Calculate physical 3D distance moved THIS FRAME for sprite strides
        const pDistThisFrame = Math.hypot(px - prevPx, py - prevPy);

        let pAnimFrame = 0;
        if (pDistThisFrame > 0.001) {
          this.playerWalkDistance += pDistThisFrame;
          // Stride ratio: 1 tile (1.0 3D unit) = 1 complete 4-step walk cycle
          pAnimFrame = Math.floor(this.playerWalkDistance * 4.0) % 4;
        } else {
          pAnimFrame = 0;
        }

        if (this.playerRenderParams) {
          if (!this.playerMesh) {
            const spriteTextures = this.getOrCreateSpriteTextures(
              this.playerRenderParams.icon,
              this.playerRenderParams.glowColor,
              this.playerRenderParams.name,
              this.playerRenderParams.isStealthed,
              1.0,
              false,
              this.playerRenderParams.spriteUrl,
              this.playerRenderParams.facing,
              pAnimFrame
            );
            const mat = this.create2DSpriteMaterial(spriteTextures);

            this.playerMesh = new THREE.Mesh(this.sharedBillboardGeometry, mat);
            this.playerMesh.frustumCulled = false;
            this.entityGroup.add(this.playerMesh);
            this.playerLastAnimFrame = pAnimFrame;
          } else if (pAnimFrame !== this.playerLastAnimFrame || this.playerNeedsTextureRefresh) {
            this.playerLastAnimFrame = pAnimFrame;
            this.playerNeedsTextureRefresh = false;

            const spriteTextures = this.getOrCreateSpriteTextures(
              this.playerRenderParams.icon,
              this.playerRenderParams.glowColor,
              this.playerRenderParams.name,
              this.playerRenderParams.isStealthed,
              1.0,
              false,
              this.playerRenderParams.spriteUrl,
              this.playerRenderParams.facing,
              pAnimFrame
            );
            this.update2DSpriteMaterial(this.playerMesh.material, spriteTextures);
          }

          const renderPx = this.snapVal(px);
          const renderPy = this.snapVal(py);

          // Always update scale dynamically to keep screen-pixel density consistent
          const pScale = this.getPixelPerfectSpriteScale(false);
          this.playerMesh.scale.set(pScale, pScale, 1);
          this.playerMesh.position.set(renderPx, 0, renderPy);
          this.playerMesh.quaternion.copy(this.camera.quaternion);

          if (this.playerLight) {
            this.playerLight.position.set(renderPx, 1.5, renderPy);
          }
          if (this.dirLight) {
            this.dirLight.position.set(renderPx + 15, 30, renderPy + 20);
            this.dirLight.target.position.set(renderPx, 0, renderPy);
            this.dirLight.target.updateMatrixWorld();
          }
          if (this.playerFacingIndicator) {
            this.playerFacingIndicator.position.set(renderPx, 0.02, renderPy);
          }

          // Responsive Camera Target Adaptation for Mobile Portrait vs Desktop Viewports
          const aspect = this.container.clientWidth / (this.container.clientHeight || 1);

          this.cameraManager.update(px, py, aspect, this.pixelPerfectEnabled, (val) => this.snapVal(val));

          if (this.showDebugBounds) {
            this.updateDebugWireframes(px, py);
          }
        }
      }

      // Reset instanced mob batch counts and shadow index
      this.instancingManager.beginFrame();

      const camQuat = this.cameraManager.getCamera().quaternion;

      // Pack Player Shadow into Instanced Shadow Mesh
      if (this.smoothPlayerPos && this.playerRenderParams) {
        const renderPx = this.snapVal(this.smoothPlayerPos.x);
        const renderPy = this.snapVal(this.smoothPlayerPos.y);
        this.instancingManager.packShadowInstance(renderPx, renderPy, 0.38);
      }

      // 2. Smooth Mobs Position Lerp & Instanced Billboard Rendering
      this.currentActiveMobs.forEach((mob) => {
        const mobData = this.mobRenderParams.get(mob.instanceId);
        if (!mobData) return;

        let smoothMob = this.smoothMobPos.get(mob.instanceId);
        if (!smoothMob) {
          smoothMob = { x: mob.x, y: mob.y };
          this.smoothMobPos.set(mob.instanceId, smoothMob);
        }

        const prevMx = smoothMob.x;
        const prevMy = smoothMob.y;

        smoothMob.x += (mob.x - smoothMob.x) * 0.15;
        smoothMob.y += (mob.y - smoothMob.y) * 0.15;

        const mobDistThisFrame = Math.hypot(smoothMob.x - prevMx, smoothMob.y - prevMy);
        let mobWalkDist = this.mobWalkDistances.get(mob.instanceId) || 0;
        let mobAnimFrame = 0;

        if (mobDistThisFrame > 0.001) {
          mobWalkDist += mobDistThisFrame;
          this.mobWalkDistances.set(mob.instanceId, mobWalkDist);
          mobAnimFrame = Math.floor(mobWalkDist * 4.0) % 4;
        } else {
          mobAnimFrame = 0;
        }

        const spriteTextures = this.getOrCreateSpriteTextures(
          mobData.sprite,
          mobData.glowColor,
          mobData.name,
          false,
          mobData.hpPct,
          true,
          mobData.spriteUrl,
          mobData.facing,
          mobAnimFrame
        );

        const isPixelMode = this.pixelPerfectEnabled;
        const isDebug = this.showDebugBounds;
        const batchKey = `${mobData.spriteUrl || mobData.sprite}_${mobData.glowColor}_${mobData.name}_${Math.round(mobData.hpPct * 10)}_${mobData.facing}_${mobAnimFrame}_pp${isPixelMode}_dbg${isDebug}`;

        const renderMx = this.snapVal(smoothMob.x);
        const renderMy = this.snapVal(smoothMob.y);
        const mScale = this.getPixelPerfectSpriteScale(mobData.isBoss);

        this.instancingManager.addMobInstance(
          batchKey,
          mob,
          renderMx,
          renderMy,
          mScale,
          camQuat,
          () => this.create2DSpriteMaterial(spriteTextures),
          (mat) => {
            if (this.mobsNeedTextureRefresh) {
              this.update2DSpriteMaterial(mat, spriteTextures);
            }
          }
        );

        this.instancingManager.packShadowInstance(renderMx, renderMy, mobData.isBoss ? 0.75 : 0.38);
      });
      this.mobsNeedTextureRefresh = false;

      // 3. Update NPCs & Pack NPC Shadows
      if (this.currentMap) {
        this.npcSprites.forEach((mesh, npcId) => {
          const npc = this.currentMap!.npcs.find((n) => n.id === npcId);
          if (npc) {
            const scale = this.getPixelPerfectSpriteScale(false);
            mesh.scale.set(scale, scale, 1);
            mesh.quaternion.copy(camQuat);

            const renderNx = this.snapVal(npc.x);
            const renderNy = this.snapVal(npc.y);
            mesh.position.set(renderNx, 0, renderNy);

            this.instancingManager.packShadowInstance(renderNx, renderNy, 0.38);
          }
        });
      }

      // Update Instanced Mesh Counts and Matrices
      this.instancingManager.commitFrame();

      // Re-orient world-art billboards (Cainos props/plants) toward the camera
      this.envGen.updateBillboardOrientations(camQuat);

      // Ground Reticle Continuous Animation
      if (this.groundReticleGroup && this.groundReticleGroup.visible) {
        if (this.reticleOuterRing) {
          this.reticleOuterRing.rotation.z += 0.015;
        }
        if (this.reticleInnerRing) {
          this.reticleInnerRing.rotation.z -= 0.02;
        }
        if (this.reticleInnerPulse) {
          const pulse = 0.92 + Math.sin(Date.now() * 0.007) * 0.12;
          this.reticleInnerPulse.scale.set(pulse, pulse, pulse);
          (this.reticleInnerPulse.material as THREE.MeshBasicMaterial).opacity =
            (this.currentAlignmentStatus === 'in_range' ? 0.22 : 0.1) + Math.sin(Date.now() * 0.007) * 0.05;
        }
      }

      this.postProcessingManager.render(this.renderer, this.scene, this.cameraManager.getCamera());

      if (!this.hasRenderedCurrentMap && this.currentMap) {
        this.hasRenderedCurrentMap = true;
        if (this.onMapRenderedCallback) {
          this.onMapRenderedCallback();
        }
      }
    };
    animate();
  }

  private resolvePlayerCollision(px: number, py: number): { x: number, y: number } {
    if (!this.currentMap) return { x: px, y: py };

    const radius = 0.35;

    // 1. Map boundaries
    px = Math.max(-0.5 + radius, Math.min(this.currentMap.width - 0.5 - radius, px));
    py = Math.max(-0.5 + radius, Math.min(this.currentMap.height - 0.5 - radius, py));

    // 2. Tile collisions (AABB vs Circle)
    const playerGridX = Math.round(px);
    const playerGridY = Math.round(py);

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const tx = playerGridX + dx;
        const ty = playerGridY + dy;

        // Skip out of bounds tiles
        if (tx < 0 || tx >= this.currentMap.width || ty < 0 || ty >= this.currentMap.height) {
          continue;
        }

        const tileType = this.currentMap.tiles[ty]?.[tx] ?? 1;
        const isBlocking = (t: number) => [1, 2, 5, 6, 7].includes(t);
        if (isBlocking(tileType)) {
          // Solid tile center tx, ty
          const minX = tx - 0.5;
          const maxX = tx + 0.5;
          const minY = ty - 0.5;
          const maxY = ty + 0.5;

          // Closest point on AABB
          const cx = Math.max(minX, Math.min(px, maxX));
          const cy = Math.max(minY, Math.min(py, maxY));

          const diffX = px - cx;
          const diffY = py - cy;
          const dist = Math.sqrt(diffX * diffX + diffY * diffY);

          if (dist < radius) {
            const overlap = radius - dist;
            if (dist > 0.0001) {
              px += (diffX / dist) * overlap;
              py += (diffY / dist) * overlap;
            } else {
              const pushX = px - tx;
              const pushY = py - ty;
              const pushDist = Math.hypot(pushX, pushY);
              if (pushDist > 0.0001) {
                px += (pushX / pushDist) * overlap;
                py += (pushY / pushDist) * overlap;
              }
            }
          }
        }
      }
    }

    // 3. NPC collisions (Circle vs Circle)
    this.currentMap.npcs.forEach((npc) => {
      const dx = px - npc.x;
      const dy = py - npc.y;
      const dist = Math.hypot(dx, dy);
      const minDist = 0.70;
      if (dist < minDist) {
        const overlap = minDist - dist;
        const normalX = dist > 0.0001 ? dx / dist : 1;
        const normalY = dist > 0.0001 ? dy / dist : 0;
        px += normalX * overlap;
        py += normalY * overlap;
      }
    });

    // 4. Mob collisions (Circle vs Circle)
    this.currentActiveMobs.forEach((mob) => {
      const dx = px - mob.x;
      const dy = py - mob.y;
      const dist = Math.hypot(dx, dy);
      const isBoss = mob.isBoss;
      const minDist = isBoss ? 1.0 : 0.70;
      if (dist < minDist) {
        const overlap = minDist - dist;
        const normalX = dist > 0.0001 ? dx / dist : 1;
        const normalY = dist > 0.0001 ? dy / dist : 0;
        px += normalX * overlap;
        py += normalY * overlap;
      }
    });

    return { x: px, y: py };
  }

  private updateDebugWireframes(px: number, py: number): void {
    if (!this.showDebugBounds) return;

    this.clearDebugWireframes();

    // 1. Player 3D Sprite Quad Box (Green Wireframe)
    const quadYCenter = (0.5 - 14 / 256) * 2.3;
    const quadGeo = new THREE.BoxGeometry(2.3, 2.3, 0.05);
    const quadMat = new THREE.MeshBasicMaterial({ color: 0x22c55e, wireframe: true });
    const quadBox = new THREE.Mesh(quadGeo, quadMat);
    quadBox.position.set(px, quadYCenter, py);
    this.debugGroup.add(quadBox);
    this.debugWireframes.push(quadBox);

    // 2. Player Collision Box (Cyan Wireframe)
    const colGeo = new THREE.BoxGeometry(1.0, 2.0, 1.0);
    const colMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, wireframe: true });
    const colBox = new THREE.Mesh(colGeo, colMat);
    colBox.position.set(px, 1.0, py);
    this.debugGroup.add(colBox);
    this.debugWireframes.push(colBox);

    // 3. Player Head Top Marker (Yellow Pointer Sphere)
    const head3DY = ((256 - 50) - 14) / 256 * 2.3;
    const headGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const headMat = new THREE.MeshBasicMaterial({ color: 0xeab308 });
    const headPoint = new THREE.Mesh(headGeo, headMat);
    headPoint.position.set(px, head3DY, py);
    this.debugGroup.add(headPoint);
    this.debugWireframes.push(headPoint);

    // 4. Mob Wireframes (Red & Orange Wireframes)
    this.currentActiveMobs.forEach((mob) => {
      const mobData = this.mobRenderParams.get(mob.instanceId);
      const isBoss = mobData?.isBoss;
      const mSize = isBoss ? 3.5 : 2.3;
      const mQuadYCenter = (0.5 - 14 / 256) * mSize;

      const mQuadGeo = new THREE.BoxGeometry(mSize, mSize, 0.05);
      const mQuadMat = new THREE.MeshBasicMaterial({ color: 0xef4444, wireframe: true });
      const mQuadBox = new THREE.Mesh(mQuadGeo, mQuadMat);
      mQuadBox.position.set(this.snapVal(mob.x), mQuadYCenter, this.snapVal(mob.y));
      this.debugGroup.add(mQuadBox);
      this.debugWireframes.push(mQuadBox);

      const mColGeo = new THREE.BoxGeometry(isBoss ? 2.0 : 1.0, isBoss ? 3.0 : 1.8, isBoss ? 2.0 : 1.0);
      const mColMat = new THREE.MeshBasicMaterial({ color: 0xf97316, wireframe: true });
      const mColBox = new THREE.Mesh(mColGeo, mColMat);
      mColBox.position.set(this.snapVal(mob.x), isBoss ? 1.5 : 0.9, this.snapVal(mob.y));
      this.debugGroup.add(mColBox);
      this.debugWireframes.push(mColBox);
    });

    // 5. Camera Deadzone representation on the ground (Magenta Circle)
    const deadzoneRadius = this.getCameraDeadzoneUnits();
    const deadzoneGeo = new THREE.RingGeometry(deadzoneRadius - 0.03, deadzoneRadius + 0.03, 32);
    const deadzoneMat = new THREE.MeshBasicMaterial({ color: 0xec4899, side: THREE.DoubleSide });
    const deadzoneRing = new THREE.Mesh(deadzoneGeo, deadzoneMat);
    deadzoneRing.rotation.x = -Math.PI / 2;
    deadzoneRing.position.set(this.logicalCameraTarget.x, 0.02, this.logicalCameraTarget.z);
    this.debugGroup.add(deadzoneRing);
    this.debugWireframes.push(deadzoneRing);
  }

  // --- LOOT ANIMATION WITH PARTICLE TRAIL ---
  public spawnLootAnimation(
    mobX: number,
    mobY: number,
    itemIcon: string,
    onArrive: () => void
  ) {
    if (this.isDestroyed) return;

    // 1. Create a 2D Canvas to draw the item icon as a glowing sphere
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    // Draw glowing gold/amber backdrop circle
    const grad = ctx.createRadialGradient(64, 64, 10, 64, 64, 60);
    grad.addColorStop(0, 'rgba(255, 230, 100, 1)');
    grad.addColorStop(0.4, 'rgba(245, 158, 11, 0.95)');
    grad.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(64, 64, 60, 0, Math.PI * 2);
    ctx.fill();

    // Draw the emoji icon in the middle
    ctx.font = '64px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(itemIcon, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = false;
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearFilter;

    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 1,
      depthWrite: false,
    });

    const sprite = new THREE.Sprite(material);
    // Position slightly offset from the exact tile to give a random hop velocity
    const randomAngle = Math.random() * Math.PI * 2;
    const spreadDistance = 0.2 + Math.random() * 0.3;
    const startX = mobX + Math.cos(randomAngle) * spreadDistance;
    const startZ = mobY + Math.sin(randomAngle) * spreadDistance;
    const startY = 0.25;

    sprite.position.set(startX, startY, startZ);
    sprite.scale.set(0.65, 0.65, 1);
    this.vfxGroup.add(sprite);

    // Track state variables for flight logic
    const startTime = Date.now();
    const hopDuration = 600; // Duration of initial jump arc (0.6s)
    const flyDuration = 800; // Time spent flying to player (0.8s)
    let reachedPlayer = false;

    // Reuse a single geometry for particles to keep memory super clean
    const pGeo = new THREE.SphereGeometry(0.05, 4, 4);

    // We'll create a local particles array to update trails
    const trailParticles: Array<{
      mesh: THREE.Mesh;
      age: number;
      maxAge: number;
      vel: THREE.Vector3;
    }> = [];

    // Helper to spawn a trail particle
    const spawnTrailParticle = (pos: THREE.Vector3) => {
      const pColor = new THREE.Color(Math.random() > 0.45 ? 0xf59e0b : 0xfef08a);
      const pMat = new THREE.MeshBasicMaterial({
        color: pColor,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      
      const pVel = new THREE.Vector3(
        (Math.random() - 0.5) * 0.25,
        (Math.random() - 0.2) * 0.2,
        (Math.random() - 0.5) * 0.25
      );

      pMesh.position.copy(pos);
      // Add random slight variation in particle starting scale
      const rScale = 0.7 + Math.random() * 0.6;
      pMesh.scale.set(rScale, rScale, rScale);

      this.vfxGroup.add(pMesh);

      trailParticles.push({
        mesh: pMesh,
        age: 0,
        maxAge: 15 + Math.floor(Math.random() * 12),
        vel: pVel,
      });
    };

    const animateLoot = () => {
      if (this.isDestroyed || reachedPlayer) {
        cleanUpAll();
        return;
      }

      const now = Date.now();
      const elapsed = now - startTime;

      let currentPos = new THREE.Vector3().copy(sprite.position);

      // Phase 1: Bounce Hop (parabolic arc)
      if (elapsed < hopDuration) {
        const t = elapsed / hopDuration;
        const currentHeight = startY + Math.sin(t * Math.PI) * 1.35; // hop height
        sprite.position.x = startX;
        sprite.position.z = startZ;
        sprite.position.y = currentHeight;
        currentPos.copy(sprite.position);

        const s = 0.65 + Math.sin(t * Math.PI) * 0.15;
        sprite.scale.set(s, s, 1);
        
        if (Math.random() > 0.4) {
          spawnTrailParticle(currentPos);
        }
      }
      // Phase 2: Magnetized Flight towards player
      else {
        const flyElapsed = elapsed - hopDuration;
        const t = Math.min(1, flyElapsed / flyDuration);

        // Fetch player's current smooth position
        let pX = startX;
        let pY = startZ;
        if (this.currentPlayerPos) {
          pX = this.currentPlayerPos.x;
          pY = this.currentPlayerPos.y;
        }

        const targetX = pX;
        const targetZ = pY;
        const targetY = 0.75; // chest level

        // Starting peak of Phase 1 height
        const startPeakY = startY + Math.sin(1.0 * Math.PI) * 1.35;

        // Accelerate as it gets closer
        const easeT = Math.pow(t, 2.5);
        
        sprite.position.x = THREE.MathUtils.lerp(startX, targetX, easeT);
        sprite.position.z = THREE.MathUtils.lerp(startZ, targetZ, easeT);
        sprite.position.y = THREE.MathUtils.lerp(startPeakY, targetY, easeT);
        
        const s = 0.65 * (1 - easeT * 0.5);
        sprite.scale.set(s, s, 1);

        currentPos.copy(sprite.position);

        // Spawn multiple trail particles during active fly
        for (let i = 0; i < 2; i++) {
          spawnTrailParticle(currentPos);
        }

        if (t >= 1) {
          reachedPlayer = true;
          onArrive();
        }
      }

      // Update and fade trail particles
      for (let i = trailParticles.length - 1; i >= 0; i--) {
        const p = trailParticles[i];
        p.age += 1;
        
        p.mesh.position.addScaledVector(p.vel, 0.05);
        p.vel.y -= 0.003; // mild gravity drop

        const mat = p.mesh.material as THREE.MeshBasicMaterial;
        const lifeRatio = 1 - p.age / p.maxAge;
        mat.opacity = lifeRatio * 0.95;
        p.mesh.scale.setScalar(lifeRatio * (p.mesh.scale.x || 1.0));

        if (p.age >= p.maxAge) {
          this.vfxGroup.remove(p.mesh);
          mat.dispose();
          trailParticles.splice(i, 1);
        }
      }

      requestAnimationFrame(animateLoot);
    };

    const cleanUpAll = () => {
      this.vfxGroup.remove(sprite);
      texture.dispose();
      material.dispose();
      
      // Clean remaining particles
      trailParticles.forEach((p) => {
        this.vfxGroup.remove(p.mesh);
        (p.mesh.material as THREE.Material).dispose();
      });
      trailParticles.length = 0;
      pGeo.dispose();
    };

    animateLoot();
  }

  // --- SHADER PASS CONTROLS ---
  public getPixelShaderConfig(): PixelShaderConfig {
    return this.postProcessingManager.getConfig();
  }

  public updatePixelShaderConfig(cfg: Partial<PixelShaderConfig>): void {
    this.postProcessingManager.updateConfig(cfg);
  }

  public applyPixelShaderPreset(mode: ShaderPresetMode): void {
    this.postProcessingManager.applyPreset(mode);
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.postProcessingManager) {
      this.postProcessingManager.dispose();
    }
    if (this.instancingManager) {
      this.instancingManager.dispose();
    }

    // Release all remaining GPU resources in every group (R7) — no leaks on unmount/hot-reload.
    this.disposeGroupChildren(this.tileGroup);
    this.disposeGroupChildren(this.entityGroup);
    this.disposeGroupChildren(this.vfxGroup);
    this.disposeGroupChildren(this.telegraphGroup);
    this.disposeGroupChildren(this.lightGroup);
    this.disposeGroupChildren(this.debugGroup);

    this.spriteTextureCache.forEach((tex) => tex.dispose());
    this.spriteTextureCache.clear();
    this.pbrGenerator.clearCaches();
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.boundKeyDown) {
      window.removeEventListener('keydown', this.boundKeyDown);
    }
    if (this.boundKeyUp) {
      window.removeEventListener('keyup', this.boundKeyUp);
    }
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
