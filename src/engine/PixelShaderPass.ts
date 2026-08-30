import * as THREE from 'three';

export type ShaderPresetMode = 'PIXEL_OUTLINE' | 'CEL_OUTLINE' | 'RETRO_DITHER' | 'OFF';

export interface PixelShaderConfig {
  mode: ShaderPresetMode;
  pixelSize: number;
  outlineThickness: number;
  outlineIntensity: number;
  outlineColor: string;
  depthSensitivity: number;
  colorSensitivity: number;
  ditherStrength: number;
  colorLevels: number;
  ambientWarmth: number;
  bloomIntensity: number;
  bloomThreshold: number;
  vignetteStrength: number;
}

export const DEFAULT_PIXEL_SHADER_CONFIG: PixelShaderConfig = {
  mode: 'PIXEL_OUTLINE',
  pixelSize: 2.0,
  outlineThickness: 1.0,
  outlineIntensity: 0.65,
  outlineColor: '#1e293b',
  depthSensitivity: 8.0,
  colorSensitivity: 1.2,
  ditherStrength: 0.0,
  colorLevels: 0,
  ambientWarmth: 0.06,
  bloomIntensity: 0.35,
  bloomThreshold: 0.72,
  vignetteStrength: 0.25,
};

export const SHADER_PRESETS: Record<ShaderPresetMode, { name: string; desc: string; config: Partial<PixelShaderConfig> }> = {
  PIXEL_OUTLINE: {
    name: 'Pixel Art HD-2D (Recomendado)',
    desc: 'Estilo HD-2D retro con pixelado nítido, resplandor bloom suave, profundización cinematográfica y colores vibrantes',
    config: {
      mode: 'PIXEL_OUTLINE',
      pixelSize: 2.0,
      outlineThickness: 1.0,
      outlineIntensity: 0.60,
      outlineColor: '#1e293b',
      depthSensitivity: 8.0,
      colorSensitivity: 1.1,
      ditherStrength: 0.0,
      colorLevels: 0,
      ambientWarmth: 0.06,
      bloomIntensity: 0.35,
      bloomThreshold: 0.70,
      vignetteStrength: 0.28,
    },
  },
  CEL_OUTLINE: {
    name: 'Cel-Shaded / Anime HD',
    desc: 'Resolución nativa HD con delineado tipo tinta manga, sombras toon nítidas y bloom sutil',
    config: {
      mode: 'CEL_OUTLINE',
      pixelSize: 1.0,
      outlineThickness: 1.2,
      outlineIntensity: 0.75,
      outlineColor: '#0f172a',
      depthSensitivity: 10.0,
      colorSensitivity: 1.3,
      ditherStrength: 0.0,
      colorLevels: 0,
      ambientWarmth: 0.04,
      bloomIntensity: 0.25,
      bloomThreshold: 0.78,
      vignetteStrength: 0.20,
    },
  },
  RETRO_DITHER: {
    name: 'Retro 16-Bit / SNES',
    desc: 'Pixelado marcado con tramado Bayer clásico, paleta posterizada y viñeta vintage',
    config: {
      mode: 'RETRO_DITHER',
      pixelSize: 3.0,
      outlineThickness: 0.8,
      outlineIntensity: 0.55,
      outlineColor: '#1e1b4b',
      depthSensitivity: 6.0,
      colorSensitivity: 1.0,
      ditherStrength: 0.25,
      colorLevels: 20,
      ambientWarmth: 0.08,
      bloomIntensity: 0.20,
      bloomThreshold: 0.75,
      vignetteStrength: 0.35,
    },
  },
  OFF: {
    name: 'Clásico Puro (Sin Shader)',
    desc: 'Renderizado 3D directo sin procesado de pixel ni bordes de post-procesado',
    config: {
      mode: 'OFF',
      pixelSize: 1.0,
      outlineThickness: 0.0,
      outlineIntensity: 0.0,
      ditherStrength: 0.0,
      colorLevels: 0,
      ambientWarmth: 0.0,
      bloomIntensity: 0.0,
      bloomThreshold: 1.0,
      vignetteStrength: 0.0,
    },
  },
};

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;
  varying vec2 vUv;

  uniform sampler2D tDiffuse;
  uniform sampler2D tDepth;
  uniform vec2 uResolution;
  uniform float uPixelSize;
  uniform float uOutlineThickness;
  uniform float uOutlineIntensity;
  uniform vec3 uOutlineColor;
  uniform float uDepthSensitivity;
  uniform float uColorSensitivity;
  uniform float uDitherStrength;
  uniform float uColorLevels;
  uniform float uAmbientWarmth;
  uniform float uBloomIntensity;
  uniform float uBloomThreshold;
  uniform float uVignetteStrength;
  uniform int uMode; // 0 = OFF, 1 = PIXEL_OUTLINE, 2 = CEL_OUTLINE, 3 = RETRO_DITHER
  uniform float cameraNear;
  uniform float cameraFar;

  // Linearize depth buffer for perspective camera [0, 1] mapped to cameraNear..cameraFar
  float linearizeDepth(float depth) {
    float z = depth * 2.0 - 1.0;
    return (2.0 * cameraNear * cameraFar) / max(0.001, (cameraFar + cameraNear - z * (cameraFar - cameraNear)));
  }

  // 4x4 Bayer Matrix for authentic retro dithering
  float getBayerValue(vec2 pixelPos) {
    int x = int(mod(pixelPos.x, 4.0));
    int y = int(mod(pixelPos.y, 4.0));
    int idx = x + y * 4;
    
    if (idx == 0) return 0.0 / 16.0;
    if (idx == 1) return 8.0 / 16.0;
    if (idx == 2) return 2.0 / 16.0;
    if (idx == 3) return 10.0 / 16.0;
    if (idx == 4) return 12.0 / 16.0;
    if (idx == 5) return 4.0 / 16.0;
    if (idx == 6) return 14.0 / 16.0;
    if (idx == 7) return 6.0 / 16.0;
    if (idx == 8) return 3.0 / 16.0;
    if (idx == 9) return 11.0 / 16.0;
    if (idx == 10) return 1.0 / 16.0;
    if (idx == 11) return 9.0 / 16.0;
    if (idx == 12) return 15.0 / 16.0;
    if (idx == 13) return 7.0 / 16.0;
    if (idx == 14) return 13.0 / 16.0;
    return 5.0 / 16.0;
  }

  void main() {
    if (uMode == 0) {
      gl_FragColor = texture2D(tDiffuse, vUv);
      return;
    }

    // 1. Pixel Grid Coordinate Quantization
    float effectivePixelSize = max(1.0, uPixelSize);
    vec2 pixelCoord = floor(vUv * uResolution / effectivePixelSize) * effectivePixelSize;
    vec2 quantizedUv = effectivePixelSize <= 1.05 ? vUv : (pixelCoord + 0.5 * effectivePixelSize) / uResolution;

    vec2 texelSize = (effectivePixelSize * max(0.5, uOutlineThickness)) / uResolution;

    // 2. Base Color Fetch
    vec4 baseColor = texture2D(tDiffuse, quantizedUv);

    // 3. Multi-tap Edge Detection with Adaptive Normal/Depth Threshold
    float dCenter = linearizeDepth(texture2D(tDepth, quantizedUv).r);
    float dTop    = linearizeDepth(texture2D(tDepth, quantizedUv + vec2(0.0, texelSize.y)).r);
    float dBottom = linearizeDepth(texture2D(tDepth, quantizedUv - vec2(0.0, texelSize.y)).r);
    float dLeft   = linearizeDepth(texture2D(tDepth, quantizedUv - vec2(texelSize.x, 0.0)).r);
    float dRight  = linearizeDepth(texture2D(tDepth, quantizedUv + vec2(texelSize.x, 0.0)).r);

    // Adaptive depth delta: scale with distance to avoid false positives on continuous floor planes
    float depthScale = max(1.0, dCenter * 0.15);
    float depthDiff = (abs(dTop - dCenter) + abs(dBottom - dCenter) + abs(dLeft - dCenter) + abs(dRight - dCenter)) / depthScale;
    
    // Smooth threshold for depth edge (reject tiny continuous plane slopes)
    float depthEdge = smoothstep(0.45, 1.4, depthDiff * (uDepthSensitivity * 0.15));

    // Screen-space Depth Contact Shadows (Ambient Occlusion)
    float aoFactor = clamp(1.0 - depthDiff * 0.12 * uDepthSensitivity, 0.70, 1.0);

    // 4. Color & Luminance Edge Detection (Silhouettes only)
    vec3 cCenter = baseColor.rgb;
    vec3 cTop    = texture2D(tDiffuse, quantizedUv + vec2(0.0, texelSize.y)).rgb;
    vec3 cBottom = texture2D(tDiffuse, quantizedUv - vec2(0.0, texelSize.y)).rgb;
    vec3 cLeft   = texture2D(tDiffuse, quantizedUv - vec2(texelSize.x, 0.0)).rgb;
    vec3 cRight  = texture2D(tDiffuse, quantizedUv + vec2(texelSize.x, 0.0)).rgb;

    vec3 lumWeights = vec3(0.299, 0.587, 0.114);
    float lCenter = dot(cCenter, lumWeights);
    float lTop    = dot(cTop, lumWeights);
    float lBottom = dot(cBottom, lumWeights);
    float lLeft   = dot(cLeft, lumWeights);
    float lRight  = dot(cRight, lumWeights);

    float lumDiff = (abs(lTop - lCenter) + abs(lBottom - lCenter) + abs(lLeft - lCenter) + abs(lRight - lCenter)) * 0.25;
    float colDist = (distance(cTop, cCenter) + distance(cBottom, cCenter) + distance(cLeft, cCenter) + distance(cRight, cCenter)) * 0.25;
    
    float colorEdge = smoothstep(0.22, 0.55, (lumDiff * 1.2 + colDist * 1.5) * (uColorSensitivity * 0.7));

    // Combined Edge Factor
    float finalEdge = clamp(max(depthEdge, colorEdge * 0.7) * uOutlineIntensity, 0.0, 1.0);

    vec3 color = cCenter * aoFactor;

    // 5. HD-2D Bloom Glow Filter (Light Bleed for Emissive & Highlights)
    if (uBloomIntensity > 0.01) {
      vec3 bloomAcc = vec3(0.0);
      vec2 bStep = vec2(2.5) / uResolution;
      
      for (int dy = -2; dy <= 2; dy++) {
        for (int dx = -2; dx <= 2; dx++) {
          vec3 sCol = texture2D(tDiffuse, quantizedUv + vec2(float(dx), float(dy)) * bStep).rgb;
          float sLum = dot(sCol, lumWeights);
          if (sLum > uBloomThreshold) {
            float w = 1.0 - length(vec2(float(dx), float(dy))) / 3.0;
            if (w > 0.0) {
              bloomAcc += (sCol - vec3(uBloomThreshold)) * w;
            }
          }
        }
      }
      color += max(vec3(0.0), bloomAcc) * (uBloomIntensity * 0.18);
    }

    // 6. Stylized Bayer Dithering & Color Quantization (Palette Stepping)
    if (uDitherStrength > 0.001) {
      vec2 screenPixel = floor(vUv * uResolution / effectivePixelSize);
      float bayer = getBayerValue(screenPixel) - 0.5;
      color += bayer * uDitherStrength * 0.15;
    }

    if (uColorLevels > 1.5) {
      color = floor(color * uColorLevels + 0.5) / uColorLevels;
    }

    // 7. Apply Stylized Fantasy Outlines (Soft tint blend instead of harsh black crushing)
    color = mix(color, uOutlineColor, finalEdge * 0.85);

    // 8. Ambient Warmth & HD-2D Color Grading (Warm Highlights + Cool Shadows)
    if (uAmbientWarmth > 0.001) {
      // Warm golden highlights
      color.r = min(1.0, color.r + uAmbientWarmth * 0.05);
      color.g = min(1.0, color.g + uAmbientWarmth * 0.025);
      
      // Slight cool shadow tint for rich HD-2D depth
      color.b = mix(color.b, color.b * 1.05 + 0.01, 1.0 - clamp(dot(color, lumWeights), 0.0, 1.0));
      
      // Gentle contrast curve that NEVER crushes dark values
      color = pow(color, vec3(0.96));
    }

    // 9. Vignette (Cinematic Corner Frame)
    if (uVignetteStrength > 0.01) {
      vec2 uvCentered = vUv * 2.0 - 1.0;
      float dist = length(uvCentered * vec2(1.0, uResolution.y / uResolution.x));
      float vignette = smoothstep(1.3, 0.4, dist * uVignetteStrength);
      color *= mix(1.0, vignette, uVignetteStrength);
    }

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), baseColor.a);
  }
`;

export class PixelShaderPass {
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private renderTarget: THREE.WebGLRenderTarget | null = null;
  private quadMesh: THREE.Mesh;
  private material: THREE.ShaderMaterial;
  private config: PixelShaderConfig;
  private width: number = 1;
  private height: number = 1;

  constructor(initialConfig: Partial<PixelShaderConfig> = {}) {
    this.config = { ...DEFAULT_PIXEL_SHADER_CONFIG, ...initialConfig };

    // Setup full-screen orthographic rendering quad
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const outlineCol = new THREE.Color(this.config.outlineColor);

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        tDiffuse: { value: null },
        tDepth: { value: null },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uPixelSize: { value: this.config.pixelSize },
        uOutlineThickness: { value: this.config.outlineThickness },
        uOutlineIntensity: { value: this.config.outlineIntensity },
        uOutlineColor: { value: new THREE.Vector3(outlineCol.r, outlineCol.g, outlineCol.b) },
        uDepthSensitivity: { value: this.config.depthSensitivity },
        uColorSensitivity: { value: this.config.colorSensitivity },
        uDitherStrength: { value: this.config.ditherStrength },
        uColorLevels: { value: this.config.colorLevels },
        uAmbientWarmth: { value: this.config.ambientWarmth },
        uBloomIntensity: { value: this.config.bloomIntensity },
        uBloomThreshold: { value: this.config.bloomThreshold },
        uVignetteStrength: { value: this.config.vignetteStrength },
        uMode: { value: this.getModeIndex(this.config.mode) },
        cameraNear: { value: 0.1 },
        cameraFar: { value: 1000.0 },
      },
      depthWrite: false,
      depthTest: false,
    });

    const quadGeo = new THREE.PlaneGeometry(2, 2);
    this.quadMesh = new THREE.Mesh(quadGeo, this.material);
    this.scene.add(this.quadMesh);
  }

  private getModeIndex(mode: ShaderPresetMode): number {
    switch (mode) {
      case 'OFF': return 0;
      case 'PIXEL_OUTLINE': return 1;
      case 'CEL_OUTLINE': return 2;
      case 'RETRO_DITHER': return 3;
      default: return 1;
    }
  }

  public setSize(width: number, height: number, pixelRatio: number = 1): void {
    const w = Math.max(1, Math.floor(width * pixelRatio));
    const h = Math.max(1, Math.floor(height * pixelRatio));

    this.width = w;
    this.height = h;

    this.material.uniforms.uResolution.value.set(w, h);

    if (this.renderTarget) {
      this.renderTarget.dispose();
      if (this.renderTarget.depthTexture) {
        this.renderTarget.depthTexture.dispose();
      }
    }

    const depthTexture = new THREE.DepthTexture(w, h);
    depthTexture.type = THREE.UnsignedShortType;
    depthTexture.format = THREE.DepthFormat;
    depthTexture.minFilter = THREE.NearestFilter;
    depthTexture.magFilter = THREE.NearestFilter;

    this.renderTarget = new THREE.WebGLRenderTarget(w, h, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      depthTexture,
      depthBuffer: true,
      stencilBuffer: false,
    });
  }

  public updateConfig(newConfig: Partial<PixelShaderConfig>): void {
    this.config = { ...this.config, ...newConfig };

    const outlineCol = new THREE.Color(this.config.outlineColor);

    this.material.uniforms.uMode.value = this.getModeIndex(this.config.mode);
    this.material.uniforms.uPixelSize.value = this.config.pixelSize;
    this.material.uniforms.uOutlineThickness.value = this.config.outlineThickness;
    this.material.uniforms.uOutlineIntensity.value = this.config.outlineIntensity;
    this.material.uniforms.uOutlineColor.value.set(outlineCol.r, outlineCol.g, outlineCol.b);
    this.material.uniforms.uDepthSensitivity.value = this.config.depthSensitivity;
    this.material.uniforms.uColorSensitivity.value = this.config.colorSensitivity;
    this.material.uniforms.uDitherStrength.value = this.config.ditherStrength;
    this.material.uniforms.uColorLevels.value = this.config.colorLevels;
    this.material.uniforms.uAmbientWarmth.value = this.config.ambientWarmth;
    this.material.uniforms.uBloomIntensity.value = this.config.bloomIntensity;
    this.material.uniforms.uBloomThreshold.value = this.config.bloomThreshold;
    this.material.uniforms.uVignetteStrength.value = this.config.vignetteStrength;
  }

  public applyPreset(presetMode: ShaderPresetMode): void {
    const preset = SHADER_PRESETS[presetMode];
    if (preset) {
      this.updateConfig(preset.config);
    }
  }

  public getConfig(): PixelShaderConfig {
    return { ...this.config };
  }

  public render(
    renderer: THREE.WebGLRenderer,
    mainScene: THREE.Scene,
    mainCamera: THREE.PerspectiveCamera
  ): void {
    if (!this.renderTarget) return;

    if (this.config.mode === 'OFF') {
      // Direct render to screen if shader pass is fully disabled
      renderer.setRenderTarget(null);
      renderer.render(mainScene, mainCamera);
      return;
    }

    // 1. Render main 3D scene + depth to offscreen RenderTarget
    renderer.setRenderTarget(this.renderTarget);
    renderer.clear();
    renderer.render(mainScene, mainCamera);

    // 2. Feed textures & camera matrices into custom post-processing shader
    this.material.uniforms.tDiffuse.value = this.renderTarget.texture;
    this.material.uniforms.tDepth.value = this.renderTarget.depthTexture;
    this.material.uniforms.cameraNear.value = mainCamera.near;
    this.material.uniforms.cameraFar.value = mainCamera.far;

    // 3. Render post-processing quad to screen canvas
    renderer.setRenderTarget(null);
    renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    if (this.renderTarget) {
      this.renderTarget.dispose();
      if (this.renderTarget.depthTexture) {
        this.renderTarget.depthTexture.dispose();
      }
      this.renderTarget = null;
    }
    this.quadMesh.geometry.dispose();
    this.material.dispose();
  }
}


