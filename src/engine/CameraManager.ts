import * as THREE from 'three';

/**
 * Camera framing constants — SINGLE SOURCE OF TRUTH.
 * The renderer, deadzone math and pixel-density helpers all read from here;
 * changing a value updates camera framing, deadzone size and pixel snapping
 * coherently everywhere.
 */
export const CAMERA_BASE_HEIGHT = 13.5;
export const CAMERA_DEPTH_LANDSCAPE = 10.5;
export const CAMERA_DEPTH_PORTRAIT = 11.5;
export const CAMERA_TARGET_Y_LANDSCAPE = 0.8;
export const CAMERA_TARGET_Y_PORTRAIT = 1.35;

/** Reference camera pitch distance (world units) at zoom 1.0. */
export function getCameraReferenceDistance(aspect: number): number {
  const dY = CAMERA_BASE_HEIGHT - (aspect < 1.0 ? CAMERA_TARGET_Y_PORTRAIT : CAMERA_TARGET_Y_LANDSCAPE);
  const dZ = aspect < 1.0 ? CAMERA_DEPTH_PORTRAIT : CAMERA_DEPTH_LANDSCAPE;
  return Math.sqrt(dY * dY + dZ * dZ);
}

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
  private logicalCameraPos: THREE.Vector3 = new THREE.Vector3(12, CAMERA_BASE_HEIGHT, 13.5);
  private logicalCameraTarget: THREE.Vector3 = new THREE.Vector3(12, CAMERA_TARGET_Y_LANDSCAPE, 12);
  private smoothCameraTarget: THREE.Vector3 = new THREE.Vector3(12, CAMERA_TARGET_Y_LANDSCAPE, 12);

  // Configuration options
  public cameraMode: 'DEADZONE' | 'HARD_FOLLOW' = 'DEADZONE';
  public cameraPixelSnap: boolean = true;
  public cameraSmoothing: boolean = false;
  /** Fraction of the smallest visible screen dimension reserved as deadzone radius. */
  public cameraDeadzonePercent: number = 0.30;

  // Screen shake & rotational tilt state
  private shakeIntensity: number = 0;
  private shakeEndTime: number = 0;
  private shakeDuration: number = 250;
  private tiltIntensity: number = 0;
  private tiltDirection: number = 1;
  private fovPunchIntensity: number = 0;

  // Zoom management
  private zoomFactor: number = 1.0;
  private targetZoomFactor: number = 1.0;
  private minZoom: number = 0.6; // Close-up action
  private maxZoom: number = 2.5; // Tactical bird's eye view

  // Reusable vectors: zero allocations per frame in update()
  private _targetCamPos: THREE.Vector3 = new THREE.Vector3();
  private _shakenCamPos: THREE.Vector3 = new THREE.Vector3();
  private _shakenLookAt: THREE.Vector3 = new THREE.Vector3();
  private _snappedLookAt: THREE.Vector3 = new THREE.Vector3();

  constructor(aspect: number, config?: CameraManagerConfig) {
    const fov = config?.fov ?? 30;
    this.baseFov = fov;
    const near = config?.near ?? 0.1;
    const far = config?.far ?? 1000;

    if (config?.cameraMode) this.cameraMode = config.cameraMode;
    if (config?.cameraPixelSnap !== undefined) this.cameraPixelSnap = config.cameraPixelSnap;
    if (config?.cameraSmoothing !== undefined) this.cameraSmoothing = config.cameraSmoothing;

    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera.position.set(12, CAMERA_BASE_HEIGHT, 13.5);
    this.camera.lookAt(12, CAMERA_TARGET_Y_LANDSCAPE, 12);
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  public getZoom(): number {
    return this.zoomFactor;
  }

  public setZoom(factor: number): void {
    this.targetZoomFactor = Math.max(this.minZoom, Math.min(this.maxZoom, factor));
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

  /**
   * Screen-relative deadzone radius in world units.
   *
   * The deadzone covers a fixed FRACTION of the visible play area on any
   * viewport (portrait or landscape), computed from the reference camera
   * framing constants — the only deadzone implementation in the codebase.
   */
  public getCameraDeadzoneUnits(aspect: number): number {
    if (!this.camera) return 2.2;
    const targetY = aspect < 1.0 ? CAMERA_TARGET_Y_PORTRAIT : CAMERA_TARGET_Y_LANDSCAPE;
    const d = getCameraReferenceDistance(aspect) * this.zoomFactor;
    const visibleHeight = 2 * d * Math.tan((this.camera.fov * Math.PI) / 360);
    const visibleWidth = visibleHeight * aspect;
    // Radius (not diameter) of the box → percent / 2
    return Math.min(visibleWidth, visibleHeight) * (this.cameraDeadzonePercent / 2);
  }

  public update(
    playerPx: number,
    playerPy: number,
    aspect: number,
    pixelPerfectEnabled: boolean,
    snapValFn: (val: number) => number
  ): void {
    const cameraTargetY = aspect < 1.0 ? CAMERA_TARGET_Y_PORTRAIT : CAMERA_TARGET_Y_LANDSCAPE;
    const baseDepthOffset = aspect < 1.0 ? CAMERA_DEPTH_PORTRAIT : CAMERA_DEPTH_LANDSCAPE;

    if (this.cameraMode === 'DEADZONE') {
      const dx = playerPx - this.logicalCameraTarget.x;
      const dy = playerPy - this.logicalCameraTarget.z;
      const dist = Math.hypot(dx, dy);
      const dynamicDeadzone = this.getCameraDeadzoneUnits(aspect);
      if (dist > dynamicDeadzone && dist > 0.0001) {
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

    // Interpolate zoom factor for smoothness
    this.zoomFactor += (this.targetZoomFactor - this.zoomFactor) * 0.08;

    const heightOffset = CAMERA_BASE_HEIGHT * this.zoomFactor;
    const depthOffset = baseDepthOffset * this.zoomFactor;

    this._targetCamPos.set(
      this.logicalCameraTarget.x,
      heightOffset,
      this.logicalCameraTarget.z + depthOffset
    );

    const now = Date.now();
    if (now >= this.shakeEndTime) {
      if (this.cameraSmoothing) {
        this.logicalCameraPos.lerp(this._targetCamPos, 0.12);
      } else {
        this.logicalCameraPos.copy(this._targetCamPos);
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
        this.logicalCameraPos.lerp(this._targetCamPos, 0.12);
      } else {
        this.logicalCameraPos.copy(this._targetCamPos);
      }

      const remainingRatio = (this.shakeEndTime - now) / this.shakeDuration;
      const currentIntensity = this.shakeIntensity * remainingRatio;
      const offsetX = (Math.random() - 0.5) * 2 * currentIntensity;
      const offsetZ = (Math.random() - 0.5) * 2 * currentIntensity;

      this._shakenCamPos.set(this.logicalCameraPos.x + offsetX, this.logicalCameraPos.y, this.logicalCameraPos.z + offsetZ);
      this._shakenLookAt.set(this.logicalCameraTarget.x + offsetX, this.logicalCameraTarget.y, this.logicalCameraTarget.z + offsetZ);

      if (this.cameraPixelSnap && pixelPerfectEnabled) {
        this.camera.position.set(
          snapValFn(this._shakenCamPos.x),
          this._shakenCamPos.y,
          snapValFn(this._shakenCamPos.z)
        );
        this._snappedLookAt.set(
          snapValFn(this._shakenLookAt.x),
          this._shakenLookAt.y,
          snapValFn(this._shakenLookAt.z)
        );
        this.camera.lookAt(this._snappedLookAt);
      } else {
        this.camera.position.copy(this._shakenCamPos);
        this.camera.lookAt(this._shakenLookAt);
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
