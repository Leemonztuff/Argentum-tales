const fs = require('fs');

let content = fs.readFileSync('src/engine/EnvironmentGenerator.ts', 'utf8');

content = content.replace(
  /const portalMat = new THREE\.MeshToonMaterial\(\{\n\s+color: 0x38bdf8,\n\s+emissive: 0x0284c7,\n\s+flatShading: true\n\s+\}\);/,
  `const portalMat = new THREE.MeshToonMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        gradientMap: toonGradient
      });`
);

content = content.replace(
  /const chestMat = new THREE\.MeshToonMaterial\(\{\n\s+color: chest\.isOpened \? 0x78716c : 0xf59e0b,\n\s+flatShading: true\n\s+\}\);/,
  `const chestMat = new THREE.MeshToonMaterial({
        color: chest.isOpened ? 0x78716c : 0xf59e0b,
        gradientMap: toonGradient
      });`
);

fs.writeFileSync('src/engine/EnvironmentGenerator.ts', content);
