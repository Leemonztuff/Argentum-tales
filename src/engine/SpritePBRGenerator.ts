import * as THREE from 'three';

export interface SpriteMaterialTextures {
  texture: THREE.Texture;
  normalTexture: THREE.Texture;
  roughnessTexture: THREE.Texture;
  metalnessTexture: THREE.Texture;
}

export class SpritePBRGenerator {
  // Texture and Image Caches
  private spriteTextureCache: Map<string, THREE.Texture> = new Map();
  private spriteNormalTextureCache: Map<string, THREE.Texture> = new Map();
  private spriteRoughnessTextureCache: Map<string, THREE.Texture> = new Map();
  private spriteMetalnessTextureCache: Map<string, THREE.Texture> = new Map();
  private imageCache: Map<string, HTMLImageElement> = new Map();

  // Lightweight profiling counter
  public perfCounters = { cacheHits: 0, cacheMisses: 0 };

  // Settings
  public spriteNormalEnabled: boolean = true;
  public spriteNormalStrength: number = 1.4;
  public spriteSpecularIntensity: number = 1.2;
  public spriteSpecularShininess: number = 48.0;
  public spriteSpecularRimPower: number = 0.35;
  public pixelPerfectEnabled: boolean = false;

  public clearCaches(): void {
    this.spriteTextureCache.clear();
    this.spriteNormalTextureCache.clear();
    this.spriteRoughnessTextureCache.clear();
    this.spriteMetalnessTextureCache.clear();
  }

  public updateUniformsOnMaterials(materials: Iterable<THREE.MeshStandardMaterial>): void {
    for (const mat of materials) {
      if (mat.userData && mat.userData.shader) {
        const u = mat.userData.shader.uniforms;
        if (u.uSpecularIntensity) u.uSpecularIntensity.value = this.spriteSpecularIntensity;
        if (u.uSpecularShininess) u.uSpecularShininess.value = this.spriteSpecularShininess;
        if (u.uSpecularRimPower) u.uSpecularRimPower.value = this.spriteSpecularRimPower;
      }
    }
  }

  // --- DYNAMIC 2.5D NORMAL & SPECULAR MAP GENERATOR (AAA HD-2D ARCHITECTURE) ---
  public generateSpriteMaterialTextures(
    sourceCanvas: HTMLCanvasElement,
    key: string
  ): { normalTexture: THREE.Texture; roughnessTexture: THREE.Texture; metalnessTexture: THREE.Texture } {
    if (
      this.spriteNormalTextureCache.has(key) &&
      this.spriteRoughnessTextureCache.has(key) &&
      this.spriteMetalnessTextureCache.has(key)
    ) {
      this.perfCounters.cacheHits++;
      return {
        normalTexture: this.spriteNormalTextureCache.get(key)!,
        roughnessTexture: this.spriteRoughnessTextureCache.get(key)!,
        metalnessTexture: this.spriteMetalnessTextureCache.get(key)!,
      };
    }
    this.perfCounters.cacheMisses++;

    const w = sourceCanvas.width;
    const h = sourceCanvas.height;
    const srcCtx = sourceCanvas.getContext('2d')!;
    const srcData = srcCtx.getImageData(0, 0, w, h).data;

    // Normal Map Canvas
    const normalCanvas = document.createElement('canvas');
    normalCanvas.width = w;
    normalCanvas.height = h;
    const normalCtx = normalCanvas.getContext('2d')!;
    const normalImg = normalCtx.createImageData(w, h);
    const dstNormalData = normalImg.data;

    // Roughness Map Canvas
    const roughCanvas = document.createElement('canvas');
    roughCanvas.width = w;
    roughCanvas.height = h;
    const roughCtx = roughCanvas.getContext('2d')!;
    const roughImg = roughCtx.createImageData(w, h);
    const dstRoughData = roughImg.data;

    // Metalness Map Canvas
    const metalCanvas = document.createElement('canvas');
    metalCanvas.width = w;
    metalCanvas.height = h;
    const metalCtx = metalCanvas.getContext('2d')!;
    const metalImg = metalCtx.createImageData(w, h);
    const dstMetalData = metalImg.data;

    // 1. Scan Sprite Silhouette Bounds (excluding UI zones y < 35 and y > 240)
    let minX = w, maxX = 0, minY = h, maxY = 0;
    for (let y = 35; y <= 240; y++) {
      for (let x = 0; x < w; x++) {
        const a = srcData[(y * w + x) * 4 + 3];
        if (a > 30) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    const spriteWidth = Math.max(1, maxX - minX);
    const spriteHeight = Math.max(1, maxY - minY);
    const centerX = minX + spriteWidth * 0.5;

    // 2. Compute Distance Transform / Silhouette Bevel Field
    const silhouetteDist = new Float32Array(w * h);
    for (let y = 35; y <= 240; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        const a = srcData[idx * 4 + 3];
        if (a > 30) {
          let minDist = 6.0;
          for (let dy = -3; dy <= 3; dy++) {
            for (let dx = -3; dx <= 3; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx < 0 || nx >= w || ny < 35 || ny > 240) {
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < minDist) minDist = d;
              } else if (srcData[(ny * w + nx) * 4 + 3] <= 30) {
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < minDist) minDist = d;
              }
            }
          }
          silhouetteDist[idx] = Math.min(1.0, minDist / 3.5);
        } else {
          silhouetteDist[idx] = 0;
        }
      }
    }

    // 3. Bilateral / Gaussian Anti-Dither Filter on Luminance
    const rawLum = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) {
      const pIdx = i * 4;
      if (srcData[pIdx + 3] > 30) {
        const r = srcData[pIdx] / 255;
        const g = srcData[pIdx + 1] / 255;
        const b = srcData[pIdx + 2] / 255;
        rawLum[i] = 0.299 * r + 0.587 * g + 0.114 * b;
      }
    }

    const filteredRelief = new Float32Array(w * h);
    for (let y = 35; y <= 240; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        if (srcData[idx * 4 + 3] <= 30) continue;

        let sum = 0;
        let weightSum = 0;
        const centerL = rawLum[idx];

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const sampleIdx = (y + dy) * w + (x + dx);
            if (sampleIdx >= 0 && sampleIdx < w * h && srcData[sampleIdx * 4 + 3] > 30) {
              const sampleL = rawLum[sampleIdx];
              const spatialW = (dx === 0 && dy === 0) ? 4.0 : (dx === 0 || dy === 0) ? 2.0 : 1.0;
              const photoW = Math.max(0.1, 1.0 - Math.abs(sampleL - centerL) * 3.0);
              const wVal = spatialW * photoW;
              sum += sampleL * wVal;
              weightSum += wVal;
            }
          }
        }
        filteredRelief[idx] = weightSum > 0 ? sum / weightSum : centerL;
      }
    }

    // 4. Synthesize Combined Heightmap: 50% Volumetric Body Curvature + 30% Silhouette Bevel + 20% Smoothed Micro-Relief
    const heightMap = new Float32Array(w * h);
    for (let y = 35; y <= 240; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        if (srcData[idx * 4 + 3] <= 30) {
          heightMap[idx] = 0;
          continue;
        }

        const normY = (y - minY) / spriteHeight;
        const normX = (x - centerX) / (spriteWidth * 0.5);
        const radiusSq = Math.max(0, 1.0 - normX * normX);
        const volumetricDome = Math.sqrt(radiusSq) * (normY < 0.35 ? 1.0 : 0.85);

        const bevel = silhouetteDist[idx];
        const relief = filteredRelief[idx];

        heightMap[idx] = volumetricDome * 0.45 * bevel + bevel * 0.30 + relief * 0.25;
      }
    }

    // 5. Sobel Filter & Intelligent Material PBR Segmentation
    const strength = Math.max(0.1, this.spriteNormalStrength);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const alpha = srcData[idx + 3];

        if (alpha < 15 || y < 35 || y > 240) {
          dstNormalData[idx] = 128;     // Nx = 0
          dstNormalData[idx + 1] = 128; // Ny = 0
          dstNormalData[idx + 2] = 255; // Nz = 1 (facing forward)
          dstNormalData[idx + 3] = alpha;

          dstRoughData[idx] = 255;
          dstRoughData[idx + 1] = 255;
          dstRoughData[idx + 2] = 255;
          dstRoughData[idx + 3] = alpha;

          dstMetalData[idx] = 0;
          dstMetalData[idx + 1] = 0;
          dstMetalData[idx + 2] = 0;
          dstMetalData[idx + 3] = alpha;
          continue;
        }

        const h00 = heightMap[Math.max(0, y - 1) * w + Math.max(0, x - 1)];
        const h10 = heightMap[Math.max(0, y - 1) * w + x];
        const h20 = heightMap[Math.max(0, y - 1) * w + Math.min(w - 1, x + 1)];
        const h01 = heightMap[y * w + Math.max(0, x - 1)];
        const h21 = heightMap[y * w + Math.min(w - 1, x + 1)];
        const h02 = heightMap[Math.min(h - 1, y + 1) * w + Math.max(0, x - 1)];
        const h12 = heightMap[Math.min(h - 1, y + 1) * w + x];
        const h22 = heightMap[Math.min(h - 1, y + 1) * w + Math.min(w - 1, x + 1)];

        const dx = (h20 + 2 * h21 + h22) - (h00 + 2 * h01 + h02);
        const dy = (h02 + 2 * h12 + h22) - (h00 + 2 * h10 + h20);
        const dz = 1.0 / (strength * 1.8);

        const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1.0;
        const nx = -dx / len;
        const ny = -dy / len;
        const nz = dz / len;

        dstNormalData[idx] = Math.floor((nx * 0.5 + 0.5) * 255);
        dstNormalData[idx + 1] = Math.floor((ny * 0.5 + 0.5) * 255);
        dstNormalData[idx + 2] = Math.floor((nz * 0.5 + 0.5) * 255);
        dstNormalData[idx + 3] = alpha;

        // 6. Intelligent Material Classification (AAA HD-2D Physical Rules)
        const r = srcData[idx] / 255;
        const g = srcData[idx + 1] / 255;
        const b = srcData[idx + 2] / 255;
        const lum = rawLum[y * w + x];
        const maxC = Math.max(r, g, b);
        const minC = Math.min(r, g, b);
        const sat = maxC > 0 ? (maxC - minC) / maxC : 0;

        let roughness = 0.78;
        let metalness = 0.0;

        const isSkin = r > 0.45 && g > 0.25 && b > 0.18 && r > g && g >= b && (r - b) > 0.08 && (r - g) < 0.35;
        const isLightHairOrCloth = lum > 0.65 && sat < 0.25 && !isSkin;
        const isGoldOrBrass = r > 0.65 && g > 0.45 && b < 0.35 && (r - b) > 0.35 && sat > 0.45;
        const isSteelBladeOrArmor = (lum > 0.85 && sat < 0.10 && silhouetteDist[y * w + x] < 0.4) || (isGoldOrBrass);

        if (isSkin) {
          roughness = 0.72;
          metalness = 0.0;
        } else if (isLightHairOrCloth) {
          roughness = 0.62;
          metalness = 0.0;
        } else if (isGoldOrBrass) {
          roughness = 0.28;
          metalness = 0.85;
        } else if (isSteelBladeOrArmor) {
          roughness = 0.35;
          metalness = 0.70;
        } else if (lum < 0.20) {
          roughness = 0.58;
          metalness = 0.0;
        } else {
          roughness = 0.82;
          metalness = 0.0;
        }

        const rVal = Math.floor(Math.min(1.0, Math.max(0.0, roughness)) * 255);
        const mVal = Math.floor(Math.min(1.0, Math.max(0.0, metalness)) * 255);

        dstRoughData[idx] = rVal;
        dstRoughData[idx + 1] = rVal;
        dstRoughData[idx + 2] = rVal;
        dstRoughData[idx + 3] = alpha;

        dstMetalData[idx] = mVal;
        dstMetalData[idx + 1] = mVal;
        dstMetalData[idx + 2] = mVal;
        dstMetalData[idx + 3] = alpha;
      }
    }

    normalCtx.putImageData(normalImg, 0, 0);
    roughCtx.putImageData(roughImg, 0, 0);
    metalCtx.putImageData(metalImg, 0, 0);

    const normalTex = new THREE.CanvasTexture(normalCanvas);
    normalTex.generateMipmaps = false;
    normalTex.magFilter = this.pixelPerfectEnabled ? THREE.NearestFilter : THREE.LinearFilter;
    normalTex.minFilter = this.pixelPerfectEnabled ? THREE.NearestFilter : THREE.LinearFilter;
    normalTex.wrapS = THREE.ClampToEdgeWrapping;
    normalTex.wrapT = THREE.ClampToEdgeWrapping;
    normalTex.needsUpdate = true;

    const roughTex = new THREE.CanvasTexture(roughCanvas);
    roughTex.generateMipmaps = false;
    roughTex.magFilter = this.pixelPerfectEnabled ? THREE.NearestFilter : THREE.LinearFilter;
    roughTex.minFilter = this.pixelPerfectEnabled ? THREE.NearestFilter : THREE.LinearFilter;
    roughTex.wrapS = THREE.ClampToEdgeWrapping;
    roughTex.wrapT = THREE.ClampToEdgeWrapping;
    roughTex.needsUpdate = true;

    const metalTex = new THREE.CanvasTexture(metalCanvas);
    metalTex.generateMipmaps = false;
    metalTex.magFilter = this.pixelPerfectEnabled ? THREE.NearestFilter : THREE.LinearFilter;
    metalTex.minFilter = this.pixelPerfectEnabled ? THREE.NearestFilter : THREE.LinearFilter;
    metalTex.wrapS = THREE.ClampToEdgeWrapping;
    metalTex.wrapT = THREE.ClampToEdgeWrapping;
    metalTex.needsUpdate = true;

    this.spriteNormalTextureCache.set(key, normalTex);
    this.spriteRoughnessTextureCache.set(key, roughTex);
    this.spriteMetalnessTextureCache.set(key, metalTex);

    return { normalTexture: normalTex, roughnessTexture: roughTex, metalnessTexture: metalTex };
  }

  // --- SPRITE 2.5D PBR & CUSTOM SPECULAR SHADER FACTORY ---
  public create2DSpriteMaterial(textures: SpriteMaterialTextures): THREE.MeshStandardMaterial {
    const isPixelMode = this.pixelPerfectEnabled;
    const mat = new THREE.MeshStandardMaterial({
      map: textures.texture,
      normalMap: this.spriteNormalEnabled ? textures.normalTexture : null,
      normalScale: new THREE.Vector2(this.spriteNormalStrength, this.spriteNormalStrength),
      roughnessMap: textures.roughnessTexture,
      metalnessMap: textures.metalnessTexture,
      roughness: 0.85,
      metalness: 0.35,
      transparent: true,
      alphaTest: isPixelMode ? 0.5 : 0.05,
      side: THREE.FrontSide,
    });

    mat.userData.normalMap = textures.normalTexture;
    mat.userData.roughnessMap = textures.roughnessTexture;
    mat.userData.metalnessMap = textures.metalnessTexture;

    // Advanced Normal-Reactive Specular Shader Injection
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uSpecularIntensity = { value: this.spriteSpecularIntensity };
      shader.uniforms.uSpecularShininess = { value: this.spriteSpecularShininess };
      shader.uniforms.uSpecularRimPower = { value: this.spriteSpecularRimPower };
      mat.userData.shader = shader;

      shader.fragmentShader = `
        uniform float uSpecularIntensity;
        uniform float uSpecularShininess;
        uniform float uSpecularRimPower;
      \n` + shader.fragmentShader;

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <lights_fragment_end>',
        `
        #include <lights_fragment_end>

        // --- Precise 2.5D Normal-Based Specular & Curvature Reflection (AAA HD-2D) ---
        #if defined( USE_NORMALMAP ) && defined( USE_ROUGHNESSMAP )
          float specRoughness = texture2D( roughnessMap, vRoughnessMapUv ).g;
          float specMetalness = texture2D( metalnessMap, vMetalnessMapUv ).b;
          
          float specMask = (1.0 - smoothstep(0.70, 0.98, specRoughness));
          
          if (specMask > 0.005 && uSpecularIntensity > 0.0) {
            vec3 N = normalize( geometryNormal );
            vec3 V = normalize( geometryViewDir );
            vec3 F0 = mix(vec3(0.04), gl_FragColor.rgb, specMetalness);
            
            #if NUM_DIR_LIGHTS > 0
              #pragma unroll_loop_start
              for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
                {
                  vec3 dirL = normalize( directionalLights[ i ].direction );
                  vec3 dirH = normalize( dirL + V );
                  float dirNdotH = max( dot( N, dirH ), 0.0 );
                  float dirNdotL = max( dot( N, dirL ), 0.0 );
                  float dirVdotH = max( dot( V, dirH ), 0.0 );
                  
                  if (dirNdotL > 0.0) {
                    float roughnessVal = max(0.04, specRoughness);
                    float specPower = mix(uSpecularShininess * 0.4, uSpecularShininess * 2.0, 1.0 - roughnessVal);
                    
                    float normFactor = (specPower + 2.0) * 0.125;
                    float D = pow( dirNdotH, specPower ) * normFactor;
                    vec3 F = F0 + (vec3(1.0) - F0) * pow(clamp(1.0 - dirVdotH, 0.0, 1.0), 5.0);
                    
                    vec3 specColor = directionalLights[ i ].color * D * dirNdotL * F * specMask * (uSpecularIntensity * 0.35);
                    gl_FragColor.rgb += specColor;
                  }
                }
              }
              #pragma unroll_loop_end
            #endif

            #if NUM_POINT_LIGHTS > 0
              #pragma unroll_loop_start
              for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
                {
                  vec3 ptVector = pointLights[ i ].position + vViewPosition;
                  float ptDist = length( ptVector );
                  if ( pointLights[ i ].distance <= 0.0 || ptDist < pointLights[ i ].distance ) {
                    vec3 ptL = normalize( ptVector );
                    vec3 ptH = normalize( ptL + V );
                    float ptNdotH = max( dot( N, ptH ), 0.0 );
                    float ptNdotL = max( dot( N, ptL ), 0.0 );
                    float ptVdotH = max( dot( V, ptH ), 0.0 );
                    
                    if (ptNdotL > 0.0) {
                      float ptAttenuation = 1.0;
                      if ( pointLights[ i ].distance > 0.0 ) {
                        ptAttenuation = clamp(1.0 - pow(ptDist / pointLights[ i ].distance, pointLights[ i ].decay), 0.0, 1.0);
                      }
                      float roughnessVal = max(0.04, specRoughness);
                      float specPower = mix(uSpecularShininess * 0.4, uSpecularShininess * 1.8, 1.0 - roughnessVal);
                      float normFactor = (specPower + 2.0) * 0.125;
                      float D = pow( ptNdotH, specPower ) * normFactor;
                      vec3 F = F0 + (vec3(1.0) - F0) * pow(clamp(1.0 - ptVdotH, 0.0, 1.0), 5.0);
                      
                      vec3 specColor = pointLights[ i ].color * D * ptNdotL * ptAttenuation * F * specMask * (uSpecularIntensity * 0.45);
                      gl_FragColor.rgb += specColor;
                    }
                  }
                }
              }
              #pragma unroll_loop_end
            #endif

            if (uSpecularRimPower > 0.0) {
              float NdotV = max( dot( N, V ), 0.0 );
              float rim = pow( clamp(1.0 - NdotV, 0.0, 1.0), 3.2 ) * uSpecularRimPower * specMask * 0.40;
              vec3 rimTint = mix(vec3(0.92, 0.96, 1.0), gl_FragColor.rgb, specMetalness);
              gl_FragColor.rgb += rimTint * rim;
            }
          }
        #endif
        `
      );
    };

    return mat;
  }
}
