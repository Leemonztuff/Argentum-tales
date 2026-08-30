import * as THREE from 'three';

export interface CameraManagerConfig {
  fov?: number;
  near?: number;
  far?: number;
  cameraMode?: 'DEADZONE' | 'HARD_FOLLOW';
  cameraPixelSnap?: boolean;
  cameraSmoothing?: boolean;
}

export class CameraManager {
  private camera: THREE.PerspectiveCamera;
  private baseFov: number = 30;

  // Logical camera states for separating logical simulation from snapped rendering
  private logicalCameraPos: THREE.Vector3 = new THREE.Vector3(12, 13.5, 13.5);
  private logicalCameraTarget: THREE.Vector3 = new THREE.Vector3(12, 0.8, 12);
  private smoothCameraTarget: THREE.Vector3 = new THREE.Vector3(12, 0.8, 12);

  // Configuration options
  public cameraMode: 'DEADZONE' | 'HARD_FOLLOW' = 'DEADZONE';
  public cameraPixelSnap: boolean = true;
  public cameraSmoothing: boolean = false;

  // Screen shake & rotational tilt state
  private shakeIntensity: number = 0;
  private shakeEndTime: number = 0;
  private shakeDuration: number = 250;
  private tiltIntensity: number = 0;
  private tiltDirection: number = 1;
  private fovPunchIntensity: number = 0;

  constructor(aspect: number, config?: CameraManagerConfig) {
    const fov = config?.fov ?? 30;
    this.baseFov = fov;
    const near = config?.near ?? 0.1;
    const far = config?.far ?? 1000;

    if (config?.cameraMode) this.cameraMode = config.cameraMode;
    if (config?.cameraPixelSnap !== undefined) this.cameraPixelSnap = config.cameraPixelSnap;
    if (config?.cameraSmoothing !== undefined) this.cameraSmoothing = config.cameraSmoothing;

    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera.position.set(12, 13.5, 13.5);
    this.camera.lookAt(12, 0.8, 12);
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  public getLogicalPosition(): THREE.Vector3 {
    return this.logicalCameraPos;
  }

  public getLogicalTarget(): THREE.Vector3 {
    return this.logicalCameraTarget;
  }

  public handleResize(width: number, height: number): void {
    this.camera.aspect = width / (height || 1);
    this.camera.updateProjectionMatrix();
  }

  /**
   * Triggers normal or heavy screen shake
   */
  public triggerShake(intensity: number = 0.35, durationMs: number = 250): void {
    this.shakeIntensity = intensity;
    this.shakeDuration = durationMs;
    this.shakeEndTime = Date.now() + durationMs;
    this.tiltIntensity = intensity * 0.03;
    this.tiltDirection = Math.random() < 0.5 ? 1 : -1;
    this.fovPunchIntensity = 0;
  }

  /**
   * Triggers a violent Critical Hit impact shake with rotational time-tilt and FOV punch
   */
  public triggerCriticalImpact(
    intensity: number = 0.65,
    durationMs: number = 380,
    tiltRad: number = 0.06,
    fovPunch: number = 3.5
  ): void {
    this.shakeIntensity = intensity;
    this.shakeDuration = durationMs;
    this.shakeEndTime = Date.now() + durationMs;
    this.tiltIntensity = tiltRad;
    this.tiltDirection = Math.random() < 0.5 ? 1 : -1;
    this.fovPunchIntensity = fovPunch;
  }

  public setPosition(x: number, y: number, z: number): void {
    this.logicalCameraPos.set(x, y, z);
    this.camera.position.set(x, y, z);
  }

  public setTarget(x: number, y: number, z: number): void {
    this.logicalCameraTarget.set(x, y, z);
    this.smoothCameraTarget.set(x, y, z);
    this.camera.lookAt(this.smoothCameraTarget);
  }

  public getCameraDeadzoneUnits(aspect: number): number {
    const baseDeadzone = aspect < 1.0 ? 1.8 : 2.5;
    return baseDeadzone;
  }

  public update(
    playerPx: number,
    playerPy: number,
    aspect: number,
    pixelPerfectEnabled: boolean,
    snapValFn: (val: number) => number
  ): void {
    const cameraTargetY = aspect < 1.0 ? 1.35 : 0.8;

    if (this.cameraMode === 'DEADZONE') {
      const dx = playerPx - this.logicalCameraTarget.x;
      const dy = playerPy - this.logicalCameraTarget.z;
      const dist = Math.hypot(dx, dy);
      const dynamicDeadzone = this.getCameraDeadzoneUnits(aspect);
      if (dist > dynamicDeadzone) {
        const pushDist = dist - dynamicDeadzone;
        const dirX = dx / dist;
        const dirY = dy / dist;
        this.logicalCameraTarget.x += dirX * pushDist;
        this.logicalCameraTarget.z += dirY * pushDist;
      }
      this.logicalCameraTarget.y = cameraTargetY;
    } else {
      this.logicalCameraTarget.set(playerPx, cameraTargetY, playerPy);
    }

    const heightOffset = 13.5;
    const depthOffset = aspect < 1.0 ? 11.5 : 10.5;
    const targetCamPos = new THREE.Vector3(
      this.logicalCameraTarget.x,
      heightOffset,
      this.logicalCameraTarget.z + depthOffset
    );

    const now = Date.now();
    if (now >= this.shakeEndTime) {
      if (this.cameraSmoothing) {
        this.logicalCameraPos.lerp(targetCamPos, 0.12);
      } else {
        this.logicalCameraPos.copy(targetCamPos);
      }

      if (this.cameraPixelSnap && pixelPerfectEnabled) {
        this.camera.position.set(
          snapValFn(this.logicalCameraPos.x),
          this.logicalCameraPos.y,
          snapValFn(this.logicalCameraPos.z)
        );
        this.smoothCameraTarget.set(
          snapValFn(this.logicalCameraTarget.x),
          this.logicalCameraTarget.y,
          snapValFn(this.logicalCameraTarget.z)
        );
      } else {
        this.camera.position.copy(this.logicalCameraPos);
        this.smoothCameraTarget.copy(this.logicalCameraTarget);
      }
      this.camera.lookAt(this.smoothCameraTarget);

      // Restore base FOV if altered during critical punch
      if (this.camera.fov !== this.baseFov) {
        this.camera.fov = this.baseFov;
        this.camera.updateProjectionMatrix();
      }
    } else {
      if (this.cameraSmoothing) {
        this.logicalCameraPos.lerp(targetCamPos, 0.12);
      } else {
        this.logicalCameraPos.copy(targetCamPos);
      }

      const remainingRatio = (this.shakeEndTime - now) / this.shakeDuration;
      const currentIntensity = this.shakeIntensity * remainingRatio;
      const offsetX = (Math.random() - 0.5) * 2 * currentIntensity;
      const offsetZ = (Math.random() - 0.5) * 2 * currentIntensity;

      const shakenCamPos = new THREE.Vector3(
        this.logicalCameraPos.x + offsetX,
        this.logicalCameraPos.y,
        this.logicalCameraPos.z + offsetZ
      );
      const shakenLookAt = new THREE.Vector3(
        this.logicalCameraTarget.x + offsetX,
        this.logicalCameraTarget.y,
        this.logicalCameraTarget.z + offsetZ
      );

      if (this.cameraPixelSnap && pixelPerfectEnabled) {
        this.camera.position.set(
          snapValFn(shakenCamPos.x),
          shakenCamPos.y,
          snapValFn(shakenCamPos.z)
        );
        const snappedLookAt = new THREE.Vector3(
          snapValFn(shakenLookAt.x),
          shakenLookAt.y,
          snapValFn(shakenLookAt.z)
        );
        this.camera.lookAt(snappedLookAt);
      } else {
        this.camera.position.copy(shakenCamPos);
        this.camera.lookAt(shakenLookAt);
      }

      // Apply Rotational Time Tilt (Z-Roll oscillation and pitch tilt)
      const currentTilt = this.tiltIntensity * remainingRatio * Math.sin(now * 0.05) * this.tiltDirection;
      this.camera.rotation.z += currentTilt;

      // Apply Momentary FOV Punch
      if (this.fovPunchIntensity > 0) {
        const currentFovPunch = this.fovPunchIntensity * remainingRatio;
        this.camera.fov = this.baseFov - currentFovPunch;
        this.camera.updateProjectionMatrix();
      }
    }
  }
}
