import * as THREE from 'three';
import type { VegetationAtlas } from './VegetationAtlas';

/**
 * Single ShaderMaterial for ALL vegetation billboards.
 *
 * - Samples from the unified VegetationAtlas texture
 * - Per-instance UV offset via InstancedBufferAttribute
 * - alphaTest: 0.12 eliminates alpha-sorting issues
 * - Fog integration (dungeon + exterior)
 * - One draw call for the entire vegetation layer
 */
export function createVegetationMaterial(atlas: VegetationAtlas): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    name: 'VegetationBillboard',
    uniforms: {
      atlasMap: { value: atlas.getTexture() },
      fogColor: { value: new THREE.Color(0x000000) },
      fogDensity: { value: 0.02 },
    },
    vertexShader: /* glsl */ `
      attribute vec2 uvOffset;
      attribute vec2 uvScale;

      varying vec2 vUv;
      varying float vFogDepth;

      void main() {
        vUv = uv * uvScale + uvOffset;
        vec4 mvPos = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        vFogDepth = -mvPos.z;
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D atlasMap;
      uniform vec3  fogColor;
      uniform float fogDensity;

      varying vec2 vUv;
      varying float vFogDepth;

      void main() {
        vec4 texel = texture2D(atlasMap, vUv);
        if (texel.a < 0.12) discard;

        float fogFactor = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
        gl_FragColor = vec4(mix(texel.rgb, fogColor, fogFactor), 1.0);
      }
    `,
    transparent: false,
    depthWrite: true,
    side: THREE.DoubleSide,
  });
}
