import * as THREE from 'three';
import { PixelShaderPass, PixelShaderConfig, ShaderPresetMode } from './PixelShaderPass';

export class PostProcessingManager {
  private pixelShaderPass: PixelShaderPass;

  constructor(width: number, height: number, pixelRatio: number = 1.0) {
    this.pixelShaderPass = new PixelShaderPass();
    this.pixelShaderPass.setSize(width, height, pixelRatio);
  }

  public getPixelShaderPass(): PixelShaderPass {
    return this.pixelShaderPass;
  }

  public getConfig(): PixelShaderConfig {
    return this.pixelShaderPass.getConfig();
  }

  public updateConfig(cfg: Partial<PixelShaderConfig>): void {
    this.pixelShaderPass.updateConfig(cfg);
  }

  public applyPreset(mode: ShaderPresetMode): void {
    this.pixelShaderPass.applyPreset(mode);
  }

  /**
   * Tracks a screen-space DOF focal reference (e.g. the projected player
   * position, 0..1 from bottom to top). Pass null to restore the static
   * config focal plane.
   */
  public setFocalPlaneTarget(target: number | null): void {
    this.pixelShaderPass.setFocalPlaneTarget(target);
  }

  public setSize(width: number, height: number, pixelRatio: number = 1.0): void {
    this.pixelShaderPass.setSize(width, height, pixelRatio);
  }

  public render(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera): void {
    this.pixelShaderPass.render(renderer, scene, camera);
  }

  public dispose(): void {
    if (this.pixelShaderPass) {
      this.pixelShaderPass.dispose();
    }
  }
}
