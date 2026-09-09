import * as THREE from 'three';
import { ActiveMob } from '../types/game';
import { SpriteMaterialTextures } from './SpritePBRGenerator';
import { QUAD_CENTER_TO_FEET_UNIT } from './worldScale';

/** Hard capacity per instanced batch (mobs per spritesheet). */
export const MAX_INSTANCES_PER_BATCH = 256;
/** Hard capacity of the shared instanced shadow mesh. */
export const MAX_INSTANCED_SHADOWS = 512;
/** Consecutive empty frames before an idle batch is disposed. */
const EMPTY_BATCH_LIFETIME_FRAMES = 5;

export interface MobBatch {
  instancedMesh: THREE.InstancedMesh;
  material: THREE.MeshStandardMaterial;
  mobMap: Map<number, ActiveMob>;
  activeCount: number;
  /** Per-instance frame index (0-3) for 4-frame atlas UV offset. */
  frameAttribute?: THREE.InstancedBufferAttribute;
}

/**
 * Creates a high-fidelity radial gradient texture for 2.5D contact shadows.
 * Features a tight ambient occlusion core and soft quadratic penumbra falloff.
 */
function createSoftShadowTexture(): THREE.Texture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2;

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
  grad.addColorStop(0.0, 'rgba(2, 6, 23, 0.85)');    // Inner ambient occlusion core directly under feet
  grad.addColorStop(0.25, 'rgba(3, 7, 26, 0.65)');   // Contact body shadow
  grad.addColorStop(0.55, 'rgba(8, 15, 32, 0.32)');  // Soft penumbra
  grad.addColorStop(0.85, 'rgba(15, 23, 42, 0.08)'); // Outer feathering
  grad.addColorStop(1.0, 'rgba(15, 23, 42, 0.0)');   // Smooth edge fade

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

/**
 * GPU instancing for mob billboards + shared instanced contact shadows.
 *
 * Per frame the renderer calls beginFrame(), packs instances, then
 * commitFrame() uploads only dirty buffers and disposes batches that have
 * been empty for EMPTY_BATCH_LIFETIME_FRAMES consecutive frames.
 *
 * addMobInstance() returns false when the batch capacity is exceeded so the
 * renderer can fall back to a non-instanced path instead of silently
 * dropping the entity.
 */
export class SpriteInstancingManager {
  private entityGroup: THREE.Group;
  private sharedBillboardGeometry: THREE.PlaneGeometry;
  private sharedShadowGeometry: THREE.PlaneGeometry;
  private sharedShadowMaterial: THREE.MeshBasicMaterial;
  private instancedShadowMesh: THREE.InstancedMesh;

  private mobInstancedBatches: Map<string, MobBatch> = new Map();
  /** Tracks how many consecutive frames each batch has been empty. */
  private batchEmptyFrames: Map<string, number> = new Map();
  private shadowIndex: number = 0;
  private dummyObj: THREE.Object3D = new THREE.Object3D();

  constructor(entityGroup: THREE.Group) {
    this.entityGroup = entityGroup;

    // Shared 2.5D billboard plane geometry anchored so the authored feet line
    // (SPRITE_LAYOUT.feet of the 256px canvas) sits at the instance origin (y=0).
    this.sharedBillboardGeometry = new THREE.PlaneGeometry(1, 1);
    this.sharedBillboardGeometry.translate(0, QUAD_CENTER_TO_FEET_UNIT, 0);
    this.sharedBillboardGeometry.computeVertexNormals();
    this.sharedBillboardGeometry.computeTangents();

    // Shared soft contact shadow geometry & material
    this.sharedShadowGeometry = new THREE.PlaneGeometry(1, 1);
    this.sharedShadowGeometry.rotateX(-Math.PI / 2);

    this.sharedShadowMaterial = new THREE.MeshBasicMaterial({
      map: createSoftShadowTexture(),
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });

    this.instancedShadowMesh = new THREE.InstancedMesh(
      this.sharedShadowGeometry,
      this.sharedShadowMaterial,
      MAX_INSTANCED_SHADOWS
    );
    this.instancedShadowMesh.frustumCulled = true;
    this.instancedShadowMesh.count = 0;
    this.entityGroup.add(this.instancedShadowMesh);
  }

  public getSharedBillboardGeometry(): THREE.PlaneGeometry {
    return this.sharedBillboardGeometry;
  }

  public beginFrame(): void {
    this.mobInstancedBatches.forEach((batch) => {
      batch.activeCount = 0;
      batch.mobMap.clear();
    });
    this.shadowIndex = 0;
  }

  /**
   * Packs one elliptical contact shadow instance. Silently ignored when the
   * shared shadow mesh is full (rendering continues without that shadow).
   */
  public packShadowInstance(x: number, y: number, radius: number): void {
    if (!this.instancedShadowMesh || this.shadowIndex >= MAX_INSTANCED_SHADOWS) return;
    // 2.5D Elliptical proportion: slightly wider in X and foreshortened in Z
    const scaleX = radius * 2.6;
    const scaleZ = radius * 1.8;

    this.dummyObj.position.set(x, 0.015, y);
    this.dummyObj.rotation.set(0, 0, 0);
    this.dummyObj.scale.set(scaleX, 1, scaleZ);
    this.dummyObj.updateMatrix();

    this.instancedShadowMesh.setMatrixAt(this.shadowIndex++, this.dummyObj.matrix);
  }

  /**
   * Packs one mob billboard instance into the batch identified by batchKey.
   * Returns false when the batch is at capacity — the caller must render the
   * entity through an alternative (non-instanced) path.
   */
  public addMobInstance(
    batchKey: string,
    mob: ActiveMob,
    x: number,
    y: number,
    scale: number,
    cameraQuaternion: THREE.Quaternion,
    createMaterialCallback: () => THREE.MeshStandardMaterial,
    updateMaterialCallback?: (mat: THREE.MeshStandardMaterial) => void,
    frameIndex: number = 0
  ): boolean {
    let batch = this.mobInstancedBatches.get(batchKey);
    if (!batch) {
      const mat = createMaterialCallback();
      // Clone geometry to attach per-instance frame attribute
      const geo = this.sharedBillboardGeometry.clone();
      const frameData = new Float32Array(MAX_INSTANCES_PER_BATCH).fill(0);
      const frameAttr = new THREE.InstancedBufferAttribute(frameData, 1);
      geo.setAttribute('aFrameIndex', frameAttr);

      const instancedMesh = new THREE.InstancedMesh(geo, mat, MAX_INSTANCES_PER_BATCH);
      instancedMesh.frustumCulled = true;
      instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

      this.entityGroup.add(instancedMesh);
      batch = {
        instancedMesh,
        material: mat,
        mobMap: new Map(),
        activeCount: 0,
        frameAttribute: frameAttr,
      };
      // O(1) batch lookup on raycast hits (getMobFromIntersection).
      instancedMesh.userData.mobBatch = batch;
      this.mobInstancedBatches.set(batchKey, batch);
    } else if (updateMaterialCallback) {
      updateMaterialCallback(batch.material);
    }

    if (batch.activeCount >= MAX_INSTANCES_PER_BATCH) {
      return false;
    }

    const idx = batch.activeCount;
    const bobOffset = 0;

    this.dummyObj.position.set(x, bobOffset, y);
    this.dummyObj.scale.set(scale, scale, 1);
    this.dummyObj.quaternion.copy(cameraQuaternion);
    this.dummyObj.updateMatrix();

    batch.instancedMesh.setMatrixAt(idx, this.dummyObj.matrix);
    if (batch.frameAttribute) {
      (batch.frameAttribute.array as Float32Array)[idx] = frameIndex;
    }
    batch.mobMap.set(idx, mob);
    batch.activeCount++;
    return true;
  }

  public commitFrame(): void {
    const keysToDelete: string[] = [];

    this.mobInstancedBatches.forEach((batch, key) => {
      batch.instancedMesh.count = batch.activeCount;
      if (batch.activeCount > 0) {
        batch.instancedMesh.instanceMatrix.needsUpdate = true;
        if (batch.frameAttribute) batch.frameAttribute.needsUpdate = true;
        batch.instancedMesh.visible = true;
        this.batchEmptyFrames.delete(key);
      } else {
        batch.instancedMesh.visible = false;
        const emptyCount = (this.batchEmptyFrames.get(key) || 0) + 1;
        if (emptyCount >= EMPTY_BATCH_LIFETIME_FRAMES) {
          keysToDelete.push(key);
        } else {
          this.batchEmptyFrames.set(key, emptyCount);
        }
      }
    });

    // Dispose batches idle for EMPTY_BATCH_LIFETIME_FRAMES+ consecutive frames
    for (const key of keysToDelete) {
      const batch = this.mobInstancedBatches.get(key);
      if (batch) {
        this.entityGroup.remove(batch.instancedMesh);
        batch.instancedMesh.geometry.dispose();
        batch.material.dispose();
        batch.instancedMesh.dispose();
        this.mobInstancedBatches.delete(key);
        this.batchEmptyFrames.delete(key);
      }
    }

    if (this.instancedShadowMesh) {
      this.instancedShadowMesh.count = this.shadowIndex;
      if (this.shadowIndex > 0) {
        this.instancedShadowMesh.instanceMatrix.needsUpdate = true;
        this.instancedShadowMesh.visible = true;
      } else {
        this.instancedShadowMesh.visible = false;
      }
    }
  }

  public getMeshesForRaycast(): THREE.Object3D[] {
    const meshes: THREE.Object3D[] = [];
    this.mobInstancedBatches.forEach((batch) => {
      if (batch.activeCount > 0 && batch.instancedMesh.visible) {
        meshes.push(batch.instancedMesh);
      }
    });
    return meshes;
  }

  public getMobFromIntersection(object: THREE.Object3D, instanceId: number | undefined): ActiveMob | undefined {
    if (instanceId === undefined) return undefined;
    const batch = (object as THREE.InstancedMesh).userData?.mobBatch as MobBatch | undefined;
    return batch ? batch.mobMap.get(instanceId) : undefined;
  }

  public setNormalMapEnabled(enabled: boolean): void {
    this.mobInstancedBatches.forEach((batch) => {
      batch.material.normalMap = enabled ? ((batch.material.userData.normalMap as THREE.Texture) || null) : null;
      batch.material.needsUpdate = true;
    });
  }

  public setNormalScale(strength: number): void {
    this.mobInstancedBatches.forEach((batch) => {
      batch.material.normalScale.set(strength, strength);
    });
  }

  public updateSpecularUniforms(intensity: number, shininess: number, rimPower: number): void {
    this.mobInstancedBatches.forEach((batch) => {
      const mat = batch.material;
      if (mat && mat.userData && mat.userData.shader && mat.userData.shader.uniforms) {
        if (mat.userData.shader.uniforms.uSpecularIntensity) {
          mat.userData.shader.uniforms.uSpecularIntensity.value = intensity;
        }
        if (mat.userData.shader.uniforms.uSpecularShininess) {
          mat.userData.shader.uniforms.uSpecularShininess.value = shininess;
        }
        if (mat.userData.shader.uniforms.uSpecularRimPower) {
          mat.userData.shader.uniforms.uSpecularRimPower.value = rimPower;
        }
      }
    });
  }

  public dispose(): void {
    if (this.sharedBillboardGeometry) {
      this.sharedBillboardGeometry.dispose();
    }
    if (this.instancedShadowMesh) {
      this.entityGroup.remove(this.instancedShadowMesh);
      this.instancedShadowMesh.dispose();
    }
    if (this.sharedShadowGeometry) {
      this.sharedShadowGeometry.dispose();
    }
    if (this.sharedShadowMaterial) {
      this.sharedShadowMaterial.dispose();
    }
    this.mobInstancedBatches.forEach((batch) => {
      this.entityGroup.remove(batch.instancedMesh);
      batch.instancedMesh.dispose();
      batch.material.dispose();
    });
    this.mobInstancedBatches.clear();
    this.batchEmptyFrames.clear();
  }
}
