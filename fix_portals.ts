import * as fs from 'fs';

let content = fs.readFileSync('src/data/maps.ts', 'utf8');

// Fix Pueblo East Portal (was x: 23, should be 24)
content = content.replace(/x: 23,\s*y: 12,\s*targetMapId: 'costa_01',/g, "x: 24,\n        y: 12,\n        targetMapId: 'costa_01',");

// Fix Costa West Portal (was targetX: 22, should be 23 since Pueblo width is 25, so inside the gate is 23)
content = content.replace(/targetX: 22,\s*targetY: 12,\s*label: 'Retorno a Villa Ullathorpe \(Oeste\)',/g, "targetX: 23,\n        targetY: 12,\n        label: 'Retorno a Villa Ullathorpe (Oeste)',");

// Fix Pueblo West Portal (was x: 0, targetX: 10, targetY: 19 - Novicio is 22x22 so inside is fine)
// Wait, novicio width is 22, height is 22. South portal is at 10, 21.

fs.writeFileSync('src/data/maps.ts', content);
