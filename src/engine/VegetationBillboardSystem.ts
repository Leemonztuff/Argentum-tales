import * as THREE from 'three';
import type { VegetationAtlas, VegetationCellUV } from './VegetationAtlas';
import { createVegetationMaterial } from './VegetationBillboardShader';
import { ENV_AESTHETICS } from '../data/environmentConfig';

/**
 * Manages ALL vegetation as a single InstancedMesh + ShaderMaterial.
 *
 * One draw call for the entire vegetation layer (trees, bushes, grass, herbs,
 * mushrooms, pebbles). Each instance stores per-cell UV attributes so the
 * shader can sample the correct region of the unified atlas.
 *
 * Billboard orientation is driven by the camera quaternion each frame.
 */
export class VegetationBillboardSystem {
  private atlas: VegetationAtlas;
  private material: THREE.ShaderMaterial;
  private mesh: THREE.InstancedMesh | null = null;
  private dummy = new THREE.Object3D();
  private yawEuler = new THREE.Euler(0, 0, 0, 'YXZ');

  private instanceData: Array<{
    x: number;
    z: number;
    scale: number;
    uvOffset: [number, number];
    uvScale: [number, number];
  }> = [];

  private uvOffsets: Float32Array = new Float32Array(0);
  private uvScales: Float32Array = new Float32Array(0);

  private built = false;

  constructor(atlas: VegetationAtlas) {
    this.atlas = atlas;
    this.material = createVegetationMaterial(atlas);
  }

  /** Register a vegetation instance. Call before build(). */
  addInstance(
    x: number,
    z: number,
    cellId: string,
    worldScale: number,
  ): void {
    const uv = this.atlas.getCellUV(cellId);
    if (!uv) {
      console.warn(`[VegBillboard] Unknown cell: ${cellId}`);
      return;
    }
    this.instanceData.push({
      x,
      z,
      scale: worldScale,
      uvOffset: [uv.u0, uv.v0],
      uvScale: [uv.u1 - uv.u0, uv.v1 - uv.v0],
    });
  }

  /** Actualiza el uniform si el atlas terminó de cargar después del constructor. */
  syncAtlasTexture(): void {
    const tex = this.atlas.getTexture();
    if (tex && this.material.uniforms.atlasMap.value !== tex) {
      this.material.uniforms.atlasMap.value = tex;
      this.material.needsUpdate = false;
    }
  }

  /**
   * Upload all instance data to the GPU. Call once after all addInstance()
   * calls are complete (end of buildMap).
   */
  build(): void {
    if (this.built) this.dispose();
    // El atlas puede haber terminado de cargar entre addInstance() y build().
    this.syncAtlasTexture();
    const count = this.instanceData.length;
    if (count === 0) return;
    if (!this.atlas.isReady() || !this.atlas.getTexture()) {
      console.warn('[VegBillboard] build() sin atlas listo: se omite vegetación');
      return;
    }

    // InstancedMesh espera una BufferGeometry normal; los atributos
    // instanciados (uvOffset/uvScale) viven en la geometría como
    // InstancedBufferAttribute. NO usar InstancedBufferGeometry aquí
    // (doble-instanciado = 0 instancias renderizadas en three moderno).
    const geo = new THREE.PlaneGeometry(1, 1);
    geo.translate(0, 0.5, 0);

    this.uvOffsets = new Float32Array(count * 2);
    this.uvScales = new Float32Array(count * 2);

    for (let i = 0; i < count; i++) {
      const d = this.instanceData[i];
      this.uvOffsets[i * 2] = d.uvOffset[0];
      this.uvOffsets[i * 2 + 1] = d.uvOffset[1];
      this.uvScales[i * 2] = d.uvScale[0];
      this.uvScales[i * 2 + 1] = d.uvScale[1];
    }

    geo.setAttribute(
      'uvOffset',
      new THREE.InstancedBufferAttribute(this.uvOffsets, 2),
    );
    geo.setAttribute(
      'uvScale',
      new THREE.InstancedBufferAttribute(this.uvScales, 2),
    );

    this.mesh = new THREE.InstancedMesh(geo, this.material, count);
    this.mesh.frustumCulled = false;
    this.mesh.castShadow = false;
    this.mesh.receiveShadow = false;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    // Write initial matrices (pies en suelo; orientación la pone updateOrientations)
    const ground = ENV_AESTHETICS.terrain.groundHeight;
    for (let i = 0; i < count; i++) {
      const d = this.instanceData[i];
      this.dummy.position.set(d.x, ground + 0.015, d.z);
      this.dummy.scale.set(d.scale, d.scale, 1);
      this.dummy.quaternion.identity();
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    this.built = true;
  }

  /**
   * Re-orienta cada billboard hacia la cámara (cilíndrico: solo yaw).
   * Copiar el quaternion completo tumbaba los árboles 45° con la cámara
   * isométrica y los enterraba en el suelo. Call each frame.
   */
  updateOrientations(cameraQuaternion: THREE.Quaternion): void {
    if (!this.mesh) return;
    this.syncAtlasTexture();
    this.yawEuler.setFromQuaternion(cameraQuaternion, 'YXZ');
    this.yawEuler.x = 0;
    this.yawEuler.z = 0;
    const ground = ENV_AESTHETICS.terrain.groundHeight;
    const count = this.instanceData.length;
    for (let i = 0; i < count; i++) {
      const d = this.instanceData[i];
      this.dummy.position.set(d.x, ground + 0.015, d.z);
      this.dummy.scale.set(d.scale, d.scale, 1);
      this.dummy.quaternion.setFromEuler(this.yawEuler);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  getMesh(): THREE.InstancedMesh | null {
    return this.mesh;
  }

  getMaterial(): THREE.ShaderMaterial {
    return this.material;
  }

  getInstanceCount(): number {
    return this.instanceData.length;
  }

  dispose(): void {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.mesh = null;
    }
    this.instanceData = [];
    this.built = false;
  }
}
