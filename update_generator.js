const fs = require('fs');

let content = fs.readFileSync('src/engine/EnvironmentGenerator.ts', 'utf8');

// Add import
content = content.replace(
  "import { GameMap } from '../types/game';",
  "import { GameMap } from '../types/game';\nimport { ENV_AESTHETICS, BIOMES, BiomeConfig } from '../data/environmentConfig';"
);

// Remove local BiomeConfig and BIOMES
const biomeStart = content.indexOf('// BIOME GENERATOR CONFIGURATIONS');
const biomeEnd = content.indexOf('// ASSET FAMILIES DEFINITION');
if (biomeStart !== -1 && biomeEnd !== -1) {
  content = content.substring(0, biomeStart) + content.substring(biomeEnd - 60);
}

// Update materials
const matRegex = /private materials = {[\s\S]*?mushroomCap:.*?\n  };/;
content = content.replace(matRegex, `private materials = {
    grass: new THREE.MeshLambertMaterial({ color: 0x4ade80 }),
    stoneBase: new THREE.MeshLambertMaterial({ color: ENV_AESTHETICS.materials.stoneBase, flatShading: true }),
    woodBase: new THREE.MeshLambertMaterial({ color: ENV_AESTHETICS.materials.woodBase }),
    water: new THREE.MeshLambertMaterial({ color: ENV_AESTHETICS.materials.water, transparent: true, opacity: 0.8 }),
    lava: new THREE.MeshLambertMaterial({ color: ENV_AESTHETICS.materials.lava, emissive: 0xb91c1c }),
    wall: new THREE.MeshLambertMaterial({ color: ENV_AESTHETICS.materials.defaultWall, flatShading: true }),
    leaves1: new THREE.MeshLambertMaterial({ color: ENV_AESTHETICS.materials.leaves, flatShading: true }),
    trunk: new THREE.MeshLambertMaterial({ color: ENV_AESTHETICS.materials.trunk, flatShading: true }),
    ore: new THREE.MeshLambertMaterial({ color: ENV_AESTHETICS.materials.ore, flatShading: true }),
    herb: new THREE.MeshLambertMaterial({ color: ENV_AESTHETICS.materials.herb, emissive: 0x14532d, flatShading: true }),
    
    // New Procedural Decor Materials
    bush: new THREE.MeshLambertMaterial({ color: ENV_AESTHETICS.materials.bush, flatShading: true }),
    pebble: new THREE.MeshLambertMaterial({ color: ENV_AESTHETICS.materials.pebble, flatShading: true }),
    mushroomStem: new THREE.MeshLambertMaterial({ color: ENV_AESTHETICS.materials.mushroomStem, flatShading: true }),
    mushroomCap: new THREE.MeshLambertMaterial({ color: ENV_AESTHETICS.materials.mushroomCap, flatShading: true }),
  };`);

// Update logic in buildMap
content = content.replace(
  "this.materials.wall.color.setHex(0x475569);",
  "this.materials.wall.color.setHex(ENV_AESTHETICS.materials.defaultWall);"
);

fs.writeFileSync('src/engine/EnvironmentGenerator.ts', content);
