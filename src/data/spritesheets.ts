export const SPRITESHEETS = {
  luci: 'https://raw.githubusercontent.com/Leemonztuff/gameassets/bed361d2a6947f097454460c5d8c1a07c0d7de18/luci.png',
  darky: 'https://raw.githubusercontent.com/Leemonztuff/gameassets/bed361d2a6947f097454460c5d8c1a07c0d7de18/darky.png',
  explorer: 'https://raw.githubusercontent.com/Leemonztuff/gameassets/bed361d2a6947f097454460c5d8c1a07c0d7de18/explorer.png',
  novice_custom: 'https://raw.githubusercontent.com/Leemonztuff/gameassets/main/usando_el_dise%C3%B1o%2C_202604281006.jpeg.png',
};

// Map player classes to spritesheet placeholders
export const CLASS_SPRITES: Record<string, string> = {
  novicio: SPRITESHEETS.explorer,
  guerrero: SPRITESHEETS.luci,
  cazador: SPRITESHEETS.luci,
  mago: SPRITESHEETS.darky,
  picaro: SPRITESHEETS.darky,
};

// Default NPC spritesheet (luci for guards/warriors, darky for mages/alchemists)
export const NPC_SPRITES: Record<string, string> = {
  sabio_elias: SPRITESHEETS.darky,
  herrero_boris: SPRITESHEETS.luci,
  alquimista_elena: SPRITESHEETS.darky,
  guardia_marcus: SPRITESHEETS.luci,
};

export const DEFAULT_NPC_SPRITE = SPRITESHEETS.luci;
export const DEFAULT_MOB_SPRITE = SPRITESHEETS.explorer;

// Composable human sprite parts. Body and head are separate 4×4 spritesheets
// loaded via texture.repeat + offset in the 3D renderer. Body pivot = bottom
// center, head pivot = neck (~0.75 height). Head is positioned at
// neckY = 0.65 * bodyHeight relative to the body's top. Both sprites share
// the same frame index and direction row. Swap the body to change the outfit,
// swap the head to change the hairstyle.
//
// Walk sheets apuntan a las copias normalizadas de normalize_sprites.py
// (pies a baseline comun, centro estable, fondo magenta). Ver
// public/players/.normalized/ — los originales quedan intactos.
const NORMALIZED_BODY = '/players/.normalized/players/Jobs/Nueva coleccion/Body';
export const BODY_SPRITES: Record<string, string> = {
  humano02: `${NORMALIZED_BODY}/Mago/spritesheet_01.normalized.png`,
  novicio: `${NORMALIZED_BODY}/Priest/spritesheet_01.normalized.png`,
  guerrero: `${NORMALIZED_BODY}/Guerrero/spritesheet_01.normalized.png`,
  cazador: `${NORMALIZED_BODY}/Arquero/spritesheet_01.normalized.png`,
  mago: `${NORMALIZED_BODY}/Mago/spritesheet_01.normalized.png`,
  picaro: `${NORMALIZED_BODY}/Picaro/spritesheet_01.normalized.png`,
};

export const HEAD_SPRITES: Record<string, string> = {
  head_humano02: '/players/Jobs/base_head_spritesheet.png',
  head_humano02_hairtyle01: '/players/Jobs/base_head_spritesheet.png',
};
export type PlayerAction = 'attack1' | 'attack2' | 'casting' | 'damage';

export interface PlayerActionSlice {
  url: string;
  col: number;
  row: number;
  durationMs: number;
}

export const PLAYER_ACTION_SPRITES: Record<string, Partial<Record<PlayerAction, PlayerActionSlice>>> = {
  guerrero: {
    attack1: { url: `${NORMALIZED_BODY}/Guerrero/spritesheet_02_action.normalized.png`, col: 3, row: 0, durationMs: 420 },
    attack2: { url: `${NORMALIZED_BODY}/Guerrero/spritesheet_02_action.normalized.png`, col: 0, row: 1, durationMs: 520 },
    casting: { url: `${NORMALIZED_BODY}/Guerrero/spritesheet_02_action.normalized.png`, col: 1, row: 1, durationMs: 620 },
    damage: { url: `${NORMALIZED_BODY}/Guerrero/spritesheet_02_action.normalized.png`, col: 1, row: 2, durationMs: 300 },
  },
  // NOTA: Mago/Picaro action quedan en originales porque esas hojas traen
  // etiquetas incrustadas ("IDLE", "OFFICIAL POSE SHEET") que el renderer
  // dibujaria como parte del sprite. Re-exportar sin texto y normalizar.
  mago: {
    attack1: { url: '/players/Jobs/Nueva coleccion/Body/Mago/spritesheet_01_action.png', col: 0, row: 2, durationMs: 420 },
    attack2: { url: '/players/Jobs/Nueva coleccion/Body/Mago/spritesheet_01_action.png', col: 1, row: 2, durationMs: 520 },
    casting: { url: '/players/Jobs/Nueva coleccion/Body/Mago/spritesheet_01_action.png', col: 2, row: 2, durationMs: 720 },
    damage: { url: '/players/Jobs/Nueva coleccion/Body/Mago/spritesheet_01_action.png', col: 2, row: 1, durationMs: 300 },
  },
  picaro: {
    attack1: { url: '/players/Jobs/Nueva coleccion/Body/Picaro/spritesheet_01_action.png', col: 1, row: 0, durationMs: 380 },
    attack2: { url: '/players/Jobs/Nueva coleccion/Body/Picaro/spritesheet_01_action.png', col: 2, row: 0, durationMs: 480 },
    casting: { url: '/players/Jobs/Nueva coleccion/Body/Picaro/spritesheet_01_action.png', col: 0, row: 1, durationMs: 700 },
    damage: { url: '/players/Jobs/Nueva coleccion/Body/Picaro/spritesheet_01_action.png', col: 2, row: 1, durationMs: 300 },
  },
};
