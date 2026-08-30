const fs = require('fs');

let content = fs.readFileSync('src/engine/Game3DRenderer.ts', 'utf8');

// Tweak Hemispheric light for better Toon contrast
content = content.replace(
  /const hemiLight = new THREE\.HemisphereLight\(0xffffff, 0x1e293b, 0\.4\);/,
  `const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.35); // Slightly dimmer ambient for better toon banding`
);

// Tweak Directional light for better Toon highlights
content = content.replace(
  /this\.dirLight = new THREE\.DirectionalLight\(0xffedd5, 1\.3\);/,
  `this.dirLight = new THREE.DirectionalLight(0xfff7ed, 1.4); // Brighter and warmer for fantasy toon highlights`
);

fs.writeFileSync('src/engine/Game3DRenderer.ts', content);
