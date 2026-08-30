export interface EnvironmentAesthetics {
  materials: {
    stoneBase: number;
    woodBase: number;
    water: number;
    lava: number;
    defaultWall: number;
    leaves: number;
    trunk: number;
    ore: number;
    herb: number;
    bush: number;
    pebble: number;
    mushroomStem: number;
    mushroomCap: number;
  };
  terrain: {
    groundHeight: number;
    waterHeight: number;
    stoneHeight: number;
    woodHeight: number;
  };
  objectVariances: Record<string, {
    scaleMin: number;
    scaleMax: number;
    scatterRadius: number; // max offset from center
    wobbleRotation: number; // small tilt rotation
  }>;
}

export const ENV_AESTHETICS: EnvironmentAesthetics = {
  materials: {
    stoneBase: 0x64748b,
    woodBase: 0x854d0e,
    water: 0x0284c7,
    lava: 0xef4444,
    defaultWall: 0x526173,
    leaves: 0x327838,
    trunk: 0x5c3317,
    ore: 0x94a3b8,
    herb: 0x22c55e,
    bush: 0x3b8543,
    pebble: 0x94a3b8,
    mushroomStem: 0xfef3c7,
    mushroomCap: 0xef4444,
  },
  terrain: {
    groundHeight: 0,
    waterHeight: -0.1,
    stoneHeight: 0.02,
    woodHeight: 0.05,
  },
  objectVariances: {
    tree: { scaleMin: 0.8, scaleMax: 1.2, scatterRadius: 0, wobbleRotation: 0.05 },
    ore: { scaleMin: 0.6, scaleMax: 1.4, scatterRadius: 0, wobbleRotation: 0.1 },
    grassTuft: { scaleMin: 0.6, scaleMax: 1.4, scatterRadius: 0.4, wobbleRotation: 0.1 },
    herb: { scaleMin: 0.8, scaleMax: 1.2, scatterRadius: 0, wobbleRotation: 0 },
    bush: { scaleMin: 0.6, scaleMax: 1.4, scatterRadius: 0.4, wobbleRotation: 0.1 },
    pebble: { scaleMin: 0.6, scaleMax: 1.4, scatterRadius: 0.4, wobbleRotation: 0.1 },
    mushroom: { scaleMin: 0.6, scaleMax: 1.4, scatterRadius: 0.4, wobbleRotation: 0.2 },
    wall: { scaleMin: 0.98, scaleMax: 1.02, scatterRadius: 0, wobbleRotation: 0 },
  }
};

export interface BiomeConfig {
  groundColor: number;
  wallColor?: number;
  decorDensity: number; // 0.0 to 1.0
  allowedDecor: string[]; 
  boundaryReplacement?: number; // Visual override for tile === 1 (e.g. 5 for Tree, 6 for Rock)
}

export const BIOMES: Record<string, BiomeConfig> = {
  forest: {
    groundColor: 0x27592b,
    decorDensity: 0.45,
    allowedDecor: ['grassTuft', 'grassTuft', 'bush', 'mushroom'],
    boundaryReplacement: 5,
  },
  coast: {
    groundColor: 0xd6b37a, 
    decorDensity: 0.15,
    allowedDecor: ['pebble', 'grassTuft', 'bush'],
    boundaryReplacement: 6,
  },
  town: {
    groundColor: 0x48793b,
    wallColor: 0x64748b,
    decorDensity: 0.08,
    allowedDecor: ['grassTuft', 'pebble'],
  },
  crypt: {
    groundColor: 0x24283b,
    wallColor: 0x414868,
    decorDensity: 0.05,
    allowedDecor: ['pebble', 'mushroom'],
  },
  fire_temple: {
    groundColor: 0x3d1a1a,
    wallColor: 0x6b2b2b,
    decorDensity: 0.08,
    allowedDecor: ['pebble'],
  },
  ruins: {
    groundColor: 0x3e4c59,
    wallColor: 0x5a6978,
    decorDensity: 0.25,
    allowedDecor: ['pebble', 'bush', 'grassTuft'],
    boundaryReplacement: 6, 
  },
  lighthouse: {
    groundColor: 0x1e3a5f,
    wallColor: 0x2563eb,
    decorDensity: 0.0,
    allowedDecor: [],
  },
  plains: {
    groundColor: 0x447738,
    decorDensity: 0.2,
    allowedDecor: ['grassTuft', 'pebble'],
    boundaryReplacement: 5,
  }
};
