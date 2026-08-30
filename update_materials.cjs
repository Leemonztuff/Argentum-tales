const fs = require('fs');

let content = fs.readFileSync('src/engine/EnvironmentGenerator.ts', 'utf8');

// Insert createToonGradient before the EnvironmentGenerator class
const toonGradientCode = `
function createToonGradient() {
  const colors = new Uint8Array(4 * 4);
  // 4 steps for a nice fantasy lighting
  const levels = [70, 130, 190, 255];
  for (let i = 0; i < 4; i++) {
    colors[i * 4] = levels[i];
    colors[i * 4 + 1] = levels[i];
    colors[i * 4 + 2] = levels[i];
    colors[i * 4 + 3] = 255;
  }
  const gradientMap = new THREE.DataTexture(colors, 4, 1, THREE.RGBAFormat);
  gradientMap.needsUpdate = true;
  gradientMap.minFilter = THREE.NearestFilter;
  gradientMap.magFilter = THREE.NearestFilter;
  gradientMap.generateMipmaps = false;
  return gradientMap;
}
const toonGradient = createToonGradient();
`;

content = content.replace(
  "export class EnvironmentGenerator {",
  toonGradientCode + "\nexport class EnvironmentGenerator {"
);

// Replace MeshLambertMaterial with MeshToonMaterial and add gradientMap
const materialDefinitions = `
  private materials = {
    grass: new THREE.MeshToonMaterial({ color: 0x4ade80, gradientMap: toonGradient }),
    stoneBase: new THREE.MeshToonMaterial({ color: ENV_AESTHETICS.materials.stoneBase, gradientMap: toonGradient }),
    woodBase: new THREE.MeshToonMaterial({ color: ENV_AESTHETICS.materials.woodBase, gradientMap: toonGradient }),
    water: new THREE.MeshToonMaterial({ color: ENV_AESTHETICS.materials.water, transparent: true, opacity: 0.8, gradientMap: toonGradient }),
    lava: new THREE.MeshToonMaterial({ color: ENV_AESTHETICS.materials.lava, emissive: 0xb91c1c, gradientMap: toonGradient }),
    wall: new THREE.MeshToonMaterial({ color: ENV_AESTHETICS.materials.defaultWall, gradientMap: toonGradient }),
    leaves1: new THREE.MeshToonMaterial({ color: ENV_AESTHETICS.materials.leaves, gradientMap: toonGradient }),
    trunk: new THREE.MeshToonMaterial({ color: ENV_AESTHETICS.materials.trunk, gradientMap: toonGradient }),
    ore: new THREE.MeshToonMaterial({ color: ENV_AESTHETICS.materials.ore, gradientMap: toonGradient }),
    herb: new THREE.MeshToonMaterial({ color: ENV_AESTHETICS.materials.herb, emissive: 0x14532d, gradientMap: toonGradient }),
    
    // Procedural Decor Materials
    bush: new THREE.MeshToonMaterial({ color: ENV_AESTHETICS.materials.bush, gradientMap: toonGradient }),
    pebble: new THREE.MeshToonMaterial({ color: ENV_AESTHETICS.materials.pebble, gradientMap: toonGradient }),
    mushroomStem: new THREE.MeshToonMaterial({ color: ENV_AESTHETICS.materials.mushroomStem, gradientMap: toonGradient }),
    mushroomCap: new THREE.MeshToonMaterial({ color: ENV_AESTHETICS.materials.mushroomCap, gradientMap: toonGradient }),
  };
`;

const matRegex = /private materials = \{[\s\S]*?mushroomCap:.*?\n  \};/;
content = content.replace(matRegex, materialDefinitions.trim());

fs.writeFileSync('src/engine/EnvironmentGenerator.ts', content);
