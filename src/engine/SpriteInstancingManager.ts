import * as THREE from 'three';
import { ActiveMob } from '../types/game';
import { SpriteMaterialTextures } from './SpritePBRGenerator';

export interface MobBatch {
  instancedMesh: THREE.InstancedMesh;
  material: THREE.MeshStandardMaterial;
  mobMap: Map<number, ActiveMob>;
  activeCount: number;
}

export class SpriteInstancingManager {
  private entityGroup: THREE.Group;
  private sharedBillboardGeometry: THREE.PlaneGeometry;
  private sharedShadowGeometry: THREE.CircleGeometry;
  private sharedShadowMaterial: THREE.MeshBasicMaterial;
  private instancedShadowMesh: THREE.InstancedMesh;

  private mobInstancedBatches: Map<string, MobBatch> = new Map();
  private shadowIndex: number = 0;
  private dummyObj: THREE.Object3D = new THREE.Object3D();

  constructor(entityGroup: THREE.Group) {
    this.entityGroup = entityGroup;

    // Shared 2.5D billboard plane geometry anchored at feet y = 242 (256x256 coordinate system)
    this.sharedBillboardGeometry = new THREE.PlaneGeometry(1, 1);
    this.sharedBillboardGeometry.translate(0, 0.5 - 14 / 256, 0);
    this.sharedBillboardGeometry.computeVertexNormals();
    this.sharedBillboardGeometry.computeTangents();

    // Shared shadow geometry & material
    this.sharedShadowGeometry = new THREE.CircleGeometry(1, 16);
    this.sharedShadowGeometry.rotateX(-Math.PI / 2);
    this.sharedShadowMaterial = new THREE.MeshBasicMaterial({
      color: 0x020617,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
    });

    this.instancedShadowMesh = new THREE.InstancedMesh(
      this.sharedShadowGeometry,
      this.sharedShadowMaterial,
      512
    );
    this.instancedShadowMesh.frustumCulled = false;
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

  public packShadowInstance(x: number, y: number, radius: number): void {
    if (!this.instancedShadowMesh) return;
    this.dummyObj.position.set(x, 0.01, y);
    this.dummyObj.rotation.set(0, 0, 0);
    this.dummyObj.scale.set(radius, 1, radius);
    this.dummyObj.updateMatrix();

    this.instancedShadowMesh.setMatrixAt(this.shadowIndex++, this.dummyObj.matrix);
  }

  public addMobInstance(
    batchKey: string,
    mob: ActiveMob,
    x: number,
    y: number,
    scale: number,
    cameraQuaternion: THREE.Quaternion,
    createMaterialCallback: () => THREE.MeshStandardMaterial,
    updateMaterialCallback?: (mat: THREE.MeshStandardMaterial) => void
  ): void {
    let batch = this.mobInstancedBatches.get(batchKey);
    if (!batch) {
      const mat = createMaterialCallback();
      const instancedMesh = new THREE.InstancedMesh(this.sharedBillboardGeometry, mat, 256);
      instancedMesh.frustumCulled = false;
      this.entityGroup.add(instancedMesh);
      batch = {
        instancedMesh,
        material: mat,
        mobMap: new Map(),
        activeCount: 0,
      };
      this.mobInstancedBatches.set(batchKey, batch);
    } else if (updateMaterialCallback) {
      updateMaterialCallback(batch.material);
    }

    const idx = batch.activeCount;
    this.dummyObj.position.set(x, 0, y);
    this.dummyObj.scale.set(scale, scale, 1);
    this.dummyObj.quaternion.copy(cameraQuaternion);
    this.dummyObj.updateMatrix();

    batch.instancedMesh.setMatrixAt(idx, this.dummyObj.matrix);
    batch.mobMap.set(idx, mob);
    batch.activeCount++;
  }

  public commitFrame(): void {
    const emptyKeys: string[] = [];
    this.mobInstancedBatches.forEach((batch, key) => {
      batch.instancedMesh.count = batch.activeCount;
      if (batch.activeCount > 0) {
        batch.instancedMesh.instanceMatrix.needsUpdate = true;
        batch.instancedMesh.visible = true;
      } else {
        batch.instancedMesh.visible = false;
        // Track empty batches for recycling below (R1) — prevents unbounded draw-call/V-RAM growth.
        emptyKeys.push(key);
      }
    });

    // Any batch with no active mobs this frame is no longer needed (state combos like
    // HP decay/orientation/anim-frame go idle as mobs change state). Reclaim it so
    // combat does not accumulate an ever-growing set of InstancedMeshes.
    for (const key of emptyKeys) {
      const batch = this.mobInstancedBatches.get(key);
      if (!batch) continue;
      this.mobInstancedBatches.delete(key);
      this.entityGroup.remove(batch.instancedMesh);
      batch.instancedMesh.dispose();
      batch.material.dispose();
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
    for (const batch of this.mobInstancedBatches.values()) {
      if (batch.instancedMesh === object) {
        return batch.mobMap.get(instanceId);
      }
    }
    return undefined;
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
  }
}
