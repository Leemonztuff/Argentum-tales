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
export const BODY_SPRITES: Record<string, string> = {
  humano02: '/players/Jobs/Mago_clothes01_body01.png',
};

export const HEAD_SPRITES: Record<string, string> = {
  head_humano02: '/players/Jobs/base_head_spritesheet.png',
  head_humano02_hairtyle01: '/players/Jobs/base_head_spritesheet.png',
};
