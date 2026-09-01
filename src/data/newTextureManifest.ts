// Cainos "Pixel Art Top Down - Basic" — texture atlas mapping.
//
// Source assets live in `public/newTexture/` (PNG, sin modificaciones).
// Las celdas fueron obtenidas por análisis de píxeles (bounds de canal
// alpha por celda), porque el pack no expone frames en cuadrícula regular:
// cada hoja empaqueta sprites de tamaño no uniforme.
//
// Convenciones:
//  - Coordenadas de celda/bbox en píxeles de la hoja, con Y creciendo hacia ABAJO
//    (mismo eje que el PNG en canvas/Image).
//  - `anchor` = pivote de "pies" para billboards 2.5D: centro-X del bbox y su
//    borde inferior (la base del sprite apoya en el suelo).
//  - `kind` describe cómo debe consumirla el motor (tile / tileset / sprite / shadow).
//
// Nombres de celdas son NEUTROS (id por índice). La identificación visual
// precisa de cada prop/planta ("¿esto es una farola o una estatua?") requiere
// confirmación visual del usuario.

export interface SpriteCellRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SpriteCell {
  id: string;
  /** Celda nominal (región asignada en la hoja). */
  cell: SpriteCellRect;
  /** Bounds reales del contenido (canal alpha). */
  bbox: SpriteCellRect;
  /** Pivote de pies: centro-X del bbox + bottom del bbox. */
  anchor: { x: number; y: number };
  /** Pista de categoría sin afirmar identidad exacta. */
  hint?: string;
}

export type CainosSheetKind =
  | 'player'
  | 'sprite_sheet'
  | 'tileset'
  | 'tile'
  | 'shadow_sheet';

export interface CainosSheet {
  /** Ruta servida por Vite desde public/ (URL-encoded). */
  path: string;
  width: number;
  height: number;
  kind: CainosSheetKind;
  /** Rejilla nominal (si aplica) para animación, p. ej. player 4 framas. */
  grid?: { cols: number; rows: number } | null;
  cells: SpriteCell[];
  notes?: string;
}

const cells = {
  // ---- TX Player (128x128): 4 frames idle (1 fila), pitch ~32px ----
  player: (): SpriteCell[] => [
    { id: 'idle_0', cell: { x: 6, y: 10, w: 21, h: 50 }, bbox: { x: 8, y: 14, w: 19, h: 44 }, anchor: { x: 17.5, y: 58 }, hint: 'frame idle' },
    { id: 'idle_1', cell: { x: 38, y: 10, w: 21, h: 50 }, bbox: { x: 43, y: 10, w: 16, h: 48 }, anchor: { x: 51, y: 58 }, hint: 'frame idle' },
    { id: 'idle_2', cell: { x: 69, y: 10, w: 21, h: 50 }, bbox: { x: 69, y: 13, w: 21, h: 45 }, anchor: { x: 79.5, y: 58 }, hint: 'frame idle' },
    { id: 'idle_3', cell: { x: 99, y: 10, w: 27, h: 50 }, bbox: { x: 104, y: 32, w: 22, h: 28 }, anchor: { x: 115, y: 60 }, hint: 'frame idle' },
  ],

  // ---- TX Plant (512x512): 3 árboles + 6 plantas bajas + 4x4 tufts de hierba ----
  plant: (): SpriteCell[] => [
    { id: 'tree_0', cell: { x: 24, y: 15, w: 113, h: 138 }, bbox: { x: 24, y: 15, w: 113, h: 138 }, anchor: { x: 80.5, y: 153 }, hint: 'arbol 1 (pack: 3 trees)' },
    { id: 'tree_1', cell: { x: 161, y: 17, w: 95, h: 136 }, bbox: { x: 161, y: 17, w: 95, h: 136 }, anchor: { x: 208.5, y: 153 }, hint: 'arbol 2' },
    { id: 'tree_2', cell: { x: 295, y: 31, w: 79, h: 120 }, bbox: { x: 295, y: 31, w: 79, h: 120 }, anchor: { x: 334.5, y: 151 }, hint: 'arbol 3' },
    { id: 'plant_0', cell: { x: 38, y: 198, w: 22, h: 19 }, bbox: { x: 38, y: 198, w: 22, h: 19 }, anchor: { x: 49, y: 217 }, hint: 'planta baja 1' },
    { id: 'plant_1', cell: { x: 98, y: 195, w: 27, h: 25 }, bbox: { x: 98, y: 195, w: 27, h: 25 }, anchor: { x: 111.5, y: 220 }, hint: 'planta baja 2' },
    { id: 'plant_2', cell: { x: 156, y: 190, w: 38, h: 32 }, bbox: { x: 156, y: 190, w: 38, h: 32 }, anchor: { x: 175, y: 222 }, hint: 'planta baja 3' },
    { id: 'plant_3', cell: { x: 216, y: 185, w: 47, h: 42 }, bbox: { x: 216, y: 185, w: 47, h: 42 }, anchor: { x: 239.5, y: 227 }, hint: 'planta baja 4' },
    { id: 'plant_4', cell: { x: 282, y: 186, w: 39, h: 45 }, bbox: { x: 282, y: 186, w: 39, h: 45 }, anchor: { x: 301.5, y: 231 }, hint: 'planta baja 5' },
    { id: 'plant_5', cell: { x: 346, y: 190, w: 40, h: 35 }, bbox: { x: 346, y: 190, w: 40, h: 35 }, anchor: { x: 366, y: 225 }, hint: 'planta baja 6' },
    { id: 'grass_0', cell: { x: 8, y: 394, w: 17, h: 10 }, bbox: { x: 8, y: 394, w: 17, h: 10 }, anchor: { x: 16.5, y: 404 }, hint: 'parche hierba (pack: 15 grasses)' },
    { id: 'grass_1', cell: { x: 41, y: 394, w: 16, h: 11 }, bbox: { x: 41, y: 394, w: 16, h: 11 }, anchor: { x: 49, y: 405 }, hint: 'parche hierba' },
    { id: 'grass_2', cell: { x: 73, y: 394, w: 15, h: 11 }, bbox: { x: 73, y: 394, w: 15, h: 11 }, anchor: { x: 80.5, y: 405 }, hint: 'parche hierba' },
    { id: 'grass_3', cell: { x: 102, y: 394, w: 15, h: 12 }, bbox: { x: 102, y: 394, w: 15, h: 12 }, anchor: { x: 109.5, y: 406 }, hint: 'parche hierba' },
    { id: 'grass_4', cell: { x: 9, y: 426, w: 12, h: 10 }, bbox: { x: 9, y: 426, w: 12, h: 10 }, anchor: { x: 15, y: 436 }, hint: 'parche hierba' },
    { id: 'grass_5', cell: { x: 43, y: 427, w: 13, h: 9 }, bbox: { x: 43, y: 427, w: 13, h: 9 }, anchor: { x: 49.5, y: 436 }, hint: 'parche hierba' },
    { id: 'grass_6', cell: { x: 74, y: 427, w: 13, h: 9 }, bbox: { x: 74, y: 427, w: 13, h: 9 }, anchor: { x: 80.5, y: 436 }, hint: 'parche hierba' },
    { id: 'grass_7', cell: { x: 104, y: 428, w: 14, h: 8 }, bbox: { x: 104, y: 428, w: 14, h: 8 }, anchor: { x: 111, y: 436 }, hint: 'parche hierba' },
  ],

  // ---- TX Props (512x512): props grandes (y 180-330) + fila inferior pequeñas ----
  props: (): SpriteCell[] => [
    { id: 'prop_0', cell: { x: 57, y: 180, w: 9, h: 39 }, bbox: { x: 57, y: 180, w: 9, h: 39 }, anchor: { x: 61.5, y: 219 }, hint: 'prop alto delgado' },
    { id: 'prop_1', cell: { x: 108, y: 180, w: 6, h: 12 }, bbox: { x: 108, y: 180, w: 6, h: 12 }, anchor: { x: 111, y: 192 }, hint: 'prop alto delgado' },
    { id: 'prop_2', cell: { x: 163, y: 180, w: 26, h: 9 }, bbox: { x: 163, y: 180, w: 26, h: 9 }, anchor: { x: 176, y: 189 }, hint: 'superficie ancha baja' },
    { id: 'prop_3', cell: { x: 288, y: 180, w: 32, h: 35 }, bbox: { x: 288, y: 180, w: 32, h: 35 }, anchor: { x: 304, y: 215 }, hint: 'prop mediano' },
    { id: 'prop_4', cell: { x: 352, y: 180, w: 32, h: 71 }, bbox: { x: 352, y: 180, w: 32, h: 71 }, anchor: { x: 368, y: 251 }, hint: 'prop alto 2' },
    { id: 'prop_5', cell: { x: 227, y: 183, w: 26, h: 38 }, bbox: { x: 227, y: 183, w: 26, h: 38 }, anchor: { x: 240, y: 221 }, hint: 'prop mediano 2' },
    { id: 'prop_6', cell: { x: 3, y: 430, w: 57, h: 42 }, bbox: { x: 3, y: 430, w: 57, h: 42 }, anchor: { x: 31.5, y: 472 }, hint: 'prop grande bajo' },
    { id: 'prop_7', cell: { x: 10, y: 492, w: 11, h: 10 }, bbox: { x: 10, y: 492, w: 11, h: 10 }, anchor: { x: 15.5, y: 502 }, hint: 'prop pequeño' },
    { id: 'prop_8', cell: { x: 40, y: 490, w: 16, h: 14 }, bbox: { x: 40, y: 490, w: 16, h: 14 }, anchor: { x: 48, y: 504 }, hint: 'prop pequeño' },
    { id: 'prop_9', cell: { x: 68, y: 487, w: 24, h: 19 }, bbox: { x: 68, y: 487, w: 24, h: 19 }, anchor: { x: 80, y: 506 }, hint: 'prop pequeño' },
    { id: 'prop_10', cell: { x: 100, y: 487, w: 24, h: 19 }, bbox: { x: 100, y: 487, w: 24, h: 19 }, anchor: { x: 112, y: 506 }, hint: 'prop pequeño' },
    { id: 'prop_11', cell: { x: 130, y: 484, w: 27, h: 22 }, bbox: { x: 130, y: 484, w: 27, h: 22 }, anchor: { x: 143.5, y: 506 }, hint: 'prop pequeño' },
    { id: 'prop_12', cell: { x: 162, y: 482, w: 27, h: 27 }, bbox: { x: 162, y: 482, w: 27, h: 27 }, anchor: { x: 175.5, y: 509 }, hint: 'prop pequeño' },
    { id: 'prop_13', cell: { x: 231, y: 489, w: 18, h: 16 }, bbox: { x: 231, y: 489, w: 18, h: 16 }, anchor: { x: 240, y: 505 }, hint: 'prop pequeño (grisáceo)' },
    { id: 'prop_14', cell: { x: 263, y: 488, w: 19, h: 16 }, bbox: { x: 263, y: 488, w: 19, h: 16 }, anchor: { x: 272.5, y: 504 }, hint: 'prop pequeño (grisáceo)' },
    { id: 'prop_15', cell: { x: 289, y: 486, w: 31, h: 19 }, bbox: { x: 289, y: 486, w: 31, h: 19 }, anchor: { x: 304.5, y: 505 }, hint: 'prop pequeño (grisáceo)' },
  ],

  // ---- TX Shadow (512x512): sombras separadas que replican plantas+props ----
  shadow: (): SpriteCell[] => [
    { id: 'shadow_0', cell: { x: 3, y: 15, w: 90, h: 78 }, bbox: { x: 40, y: 30, w: 31, h: 34 }, anchor: { x: 55.5, y: 64 }, hint: 'sombra' },
    { id: 'shadow_1', cell: { x: 97, y: 15, w: 62, h: 78 }, bbox: { x: 102, y: 42, w: 31, h: 19 }, anchor: { x: 117.5, y: 61 }, hint: 'sombra' },
    { id: 'shadow_2', cell: { x: 160, y: 15, w: 39, h: 78 }, bbox: { x: 168, y: 30, w: 31, h: 34 }, anchor: { x: 183.5, y: 64 }, hint: 'sombra' },
    { id: 'shadow_3', cell: { x: 225, y: 15, w: 39, h: 78 }, bbox: { x: 235, y: 29, w: 24, h: 31 }, anchor: { x: 247, y: 60 }, hint: 'sombra' },
    { id: 'shadow_4', cell: { x: 288, y: 15, w: 224, h: 78 }, bbox: { x: 390, y: 15, w: 93, h: 78 }, anchor: { x: 436.5, y: 93 }, hint: 'sombra' },
    { id: 'shadow_5', cell: { x: 3, y: 94, w: 90, h: 65 }, bbox: { x: 51, y: 125, w: 25, h: 28 }, anchor: { x: 63.5, y: 153 }, hint: 'sombra' },
    { id: 'shadow_6', cell: { x: 97, y: 94, w: 62, h: 65 }, bbox: { x: 104, y: 94, w: 31, h: 31 }, anchor: { x: 119.5, y: 125 }, hint: 'sombra' },
    { id: 'shadow_7', cell: { x: 160, y: 94, w: 39, h: 65 }, bbox: { x: 168, y: 98, w: 26, h: 27 }, anchor: { x: 181, y: 125 }, hint: 'sombra' },
    { id: 'shadow_8', cell: { x: 225, y: 94, w: 39, h: 65 }, bbox: { x: 241, y: 114, w: 23, h: 43 }, anchor: { x: 252.5, y: 157 }, hint: 'sombra' },
    { id: 'shadow_9', cell: { x: 288, y: 94, w: 224, h: 65 }, bbox: { x: 294, y: 95, w: 187, h: 64 }, anchor: { x: 387.5, y: 159 }, hint: 'sombra' },
    { id: 'shadow_10', cell: { x: 3, y: 165, w: 90, h: 91 }, bbox: { x: 43, y: 194, w: 31, h: 25 }, anchor: { x: 58.5, y: 219 }, hint: 'sombra' },
    { id: 'shadow_11', cell: { x: 97, y: 165, w: 62, h: 91 }, bbox: { x: 117, y: 176, w: 11, h: 80 }, anchor: { x: 122.5, y: 256 }, hint: 'sombra' },
    { id: 'shadow_12', cell: { x: 160, y: 165, w: 39, h: 91 }, bbox: { x: 173, y: 165, w: 20, h: 86 }, anchor: { x: 183, y: 251 }, hint: 'sombra' },
    { id: 'shadow_13', cell: { x: 225, y: 165, w: 39, h: 91 }, bbox: { x: 233, y: 196, w: 25, h: 25 }, anchor: { x: 245.5, y: 221 }, hint: 'sombra' },
    { id: 'shadow_14', cell: { x: 288, y: 165, w: 224, h: 91 }, bbox: { x: 295, y: 166, w: 217, h: 85 }, anchor: { x: 403.5, y: 251 }, hint: 'sombra' },
    { id: 'shadow_15', cell: { x: 160, y: 257, w: 39, h: 151 }, bbox: { x: 172, y: 299, w: 20, h: 81 }, anchor: { x: 182, y: 380 }, hint: 'sombra' },
    { id: 'shadow_16', cell: { x: 225, y: 257, w: 39, h: 151 }, bbox: { x: 244, y: 257, w: 17, h: 86 }, anchor: { x: 252.5, y: 343 }, hint: 'sombra' },
    { id: 'shadow_17', cell: { x: 288, y: 257, w: 224, h: 151 }, bbox: { x: 303, y: 260, w: 195, h: 148 }, anchor: { x: 400.5, y: 408 }, hint: 'sombra' },
    { id: 'shadow_18', cell: { x: 3, y: 446, w: 90, h: 26 }, bbox: { x: 29, y: 446, w: 34, h: 26 }, anchor: { x: 46, y: 472 }, hint: 'sombra' },
    { id: 'shadow_19', cell: { x: 3, y: 491, w: 90, h: 18 }, bbox: { x: 43, y: 493, w: 50, h: 13 }, anchor: { x: 68, y: 506 }, hint: 'sombra' },
    { id: 'shadow_20', cell: { x: 97, y: 491, w: 62, h: 18 }, bbox: { x: 144, y: 491, w: 15, h: 15 }, anchor: { x: 151.5, y: 506 }, hint: 'sombra' },
    { id: 'shadow_21', cell: { x: 160, y: 491, w: 39, h: 18 }, bbox: { x: 174, y: 493, w: 17, h: 16 }, anchor: { x: 182.5, y: 509 }, hint: 'sombra' },
  ],

  // ---- TX Struct (512x512): edificios/estructuras ----
  struct: (): SpriteCell[] => [
    { id: 'struct_0', cell: { x: 32, y: 27, w: 257, h: 229 }, bbox: { x: 32, y: 32, w: 257, h: 224 }, anchor: { x: 160.5, y: 256 }, hint: 'edificio principal' },
    { id: 'struct_1', cell: { x: 408, y: 27, w: 80, h: 229 }, bbox: { x: 409, y: 27, w: 79, h: 165 }, anchor: { x: 448.5, y: 192 }, hint: 'estructura alta' },
    { id: 'struct_2', cell: { x: 32, y: 288, w: 257, h: 192 }, bbox: { x: 126, y: 288, w: 146, h: 192 }, anchor: { x: 199, y: 480 }, hint: 'estructura' },
  ],

  // ---- TX Tileset Grass (256x256) y Stone Ground (256x256): sub-tile continuo ----
  // El sub-tile continuo (tileable) es 128x128; el resto de la hoja son otros
  // tiles (transiciones/variantes). El motor consume bbox (0,0,128,128).
  tileGrass: (): SpriteCell[] => [
    { id: 'grass_ground', cell: { x: 0, y: 0, w: 128, h: 128 }, bbox: { x: 0, y: 0, w: 128, h: 128 }, anchor: { x: 64, y: 128 }, hint: 'sub-tile hierba (128x128 seam-free)' },
  ],
  tileStone: (): SpriteCell[] => [
    { id: 'stone_ground', cell: { x: 0, y: 0, w: 128, h: 128 }, bbox: { x: 0, y: 0, w: 128, h: 128 }, anchor: { x: 64, y: 128 }, hint: 'sub-tile piedra (128x128 seam-free)' },
  ],

  // ---- TX Tileset Wall (512x512): cara sólida de pared + listones/panel ----
  wall: (): SpriteCell[] => [
    { id: 'wall_main', cell: { x: 152, y: 32, w: 114, h: 104 }, bbox: { x: 152, y: 32, w: 114, h: 104 }, anchor: { x: 209, y: 136 }, hint: 'cara sólida de pared (mortero)' },
    { id: 'wall_frame', cell: { x: 32, y: 33, w: 88, h: 127 }, bbox: { x: 32, y: 33, w: 88, h: 127 }, anchor: { x: 76, y: 160 }, hint: 'marco hueco (puerta/ventana)' },
    { id: 'wall_strip_0', cell: { x: 288, y: 32, w: 10, h: 96 }, bbox: { x: 288, y: 32, w: 10, h: 96 }, anchor: { x: 293, y: 128 }, hint: 'listón vertical' },
    { id: 'wall_strip_1', cell: { x: 344, y: 32, w: 8, h: 96 }, bbox: { x: 344, y: 32, w: 8, h: 96 }, anchor: { x: 348, y: 128 }, hint: 'listón vertical' },
    { id: 'wall_panel', cell: { x: 384, y: 64, w: 64, h: 96 }, bbox: { x: 384, y: 64, w: 64, h: 96 }, anchor: { x: 416, y: 160 }, hint: 'panel/pilar' },
    { id: 'wall_band_0', cell: { x: 32, y: 192, w: 234, h: 64 }, bbox: { x: 32, y: 192, w: 192, h: 64 }, anchor: { x: 128, y: 256 }, hint: 'banda horizontal (sin verificar)' },
    { id: 'wall_band_1', cell: { x: 32, y: 288, w: 234, h: 64 }, bbox: { x: 32, y: 288, w: 160, h: 64 }, anchor: { x: 112, y: 352 }, hint: 'banda horizontal (sin verificar)' },
  ],
};

export const NEW_TEXTURE_SHEETS: Record<string, CainosSheet> = {
  player: {
    path: '/newTexture/TX%20Player.png',
    width: 128,
    height: 128,
    kind: 'player',
    grid: { cols: 4, rows: 1 },
    cells: cells.player(),
    notes: '4 frames de idle (única dirección). NO aporta frames de caminar/direcciones; el motor espera 4x4.',
  },
  plant: {
    path: '/newTexture/TX%20Plant.png',
    width: 512,
    height: 512,
    kind: 'sprite_sheet',
    grid: null,
    cells: cells.plant(),
    notes: '3 árboles + plantas bajas + parches de hierba (pack anuncia 3 trees / 15 grasses).',
  },
  props: {
    path: '/newTexture/TX%20Props.png',
    width: 512,
    height: 512,
    kind: 'sprite_sheet',
    grid: null,
    cells: cells.props(),
    notes: 'Props grandes + pequeños (pack anuncia 48 props); identidad a confirmar visualmente.',
  },
  shadow: {
    path: '/newTexture/TX%20Shadow.png',
    width: 512,
    height: 512,
    kind: 'shadow_sheet',
    grid: null,
    cells: cells.shadow(),
    notes: 'Sombras separadas (suelen aplicarse como decal sobre el suelo, sin mapa difuso). No emparejadas 1:1 con plantas/props todavía.',
  },
  struct: {
    path: '/newTexture/TX%20Struct.png',
    width: 512,
    height: 512,
    kind: 'sprite_sheet',
    grid: null,
    cells: cells.struct(),
    notes: 'Edificios/estructuras grandes.',
  },
  tileset_grass: {
    path: '/newTexture/TX%20Tileset%20Grass.png',
    width: 256,
    height: 256,
    kind: 'tile',
    grid: null,
    cells: cells.tileGrass(),
    notes: 'Tile de suelo hierba, full-bleed (única celda 256x256).',
  },
  tileset_stone: {
    path: '/newTexture/TX%20Tileset%20Stone%20Ground.png',
    width: 256,
    height: 256,
    kind: 'tile',
    grid: null,
    cells: cells.tileStone(),
    notes: 'Tile de suelo piedra, full-bleed (única celda 256x256).',
  },
  tileset_wall: {
    path: '/newTexture/TX%20Tileset%20Wall.png',
    width: 512,
    height: 512,
    kind: 'tileset',
    grid: null,
    cells: cells.wall(),
    notes: 'Losas/bandas verticales y horizontales de pared para tiles 32px.',
  },
};

/** Hojas del pack incluidas solo como referencia (art fusionado con sombra). */
export const NEW_TEXTURE_COMPOSITES: { path: string; mapsTo: string }[] = [
  { path: '/newTexture/TX%20Plant%20with%20Shadow.png', mapsTo: 'plant' },
  { path: '/newTexture/Extra/TX%20Plant%20with%20Shadow.png', mapsTo: 'plant' },
  { path: '/newTexture/Extra/TX%20Props%20with%20Shadow.png', mapsTo: 'props' },
];