// Index de spritesheets WebP locales (generado desde public/spritesheets).
// Los 4x4 (Armor/Clothes) y Npc-0x.webp son bodies SIN cabeza; las cabezas
// siguen siendo PNG (HEAD_SPRITES). Frames 320px, gap 10px, rows: 0=down,
// 1=left, 2=right, 3=up.
export interface SpritesheetEntry {
  url: string;
  /** Nombre corto para mostrar en editores. */
  label: string;
  slug: string;
}

const toEntry = (url: string): SpritesheetEntry => ({
  url,
  label: url.split('/').pop()?.replace('.webp', '') || url,
  slug: url.split('/').slice(-2).join('/').replace('.webp', ''),
});

export const SPRITESHEET_INDEX_ARMOR: SpritesheetEntry[] = [
    '/spritesheets/Armor/frame_000.webp',
    '/spritesheets/Armor/frame_001.webp',
    '/spritesheets/Armor/frame_002.webp',
    '/spritesheets/Armor/frame_007.webp',
    '/spritesheets/Armor/frame_009.webp',
    '/spritesheets/Armor/frame_010.webp',
    '/spritesheets/Armor/frame_013.webp',
    '/spritesheets/Armor/frame_046.webp',
    '/spritesheets/Armor/frame_052.webp',
    '/spritesheets/Armor/frame_054.webp',
    '/spritesheets/Armor/frame_056.webp',
    '/spritesheets/Armor/frame_058.webp',
    '/spritesheets/Armor/frame_059.webp',
    '/spritesheets/Armor/frame_067.webp',
    '/spritesheets/Armor/frame_069.webp',
    '/spritesheets/Armor/frame_071.webp',
].map(toEntry);

export const SPRITESHEET_INDEX_CLOTHES: SpritesheetEntry[] = [
    '/spritesheets/Clothes/archer_005.webp',
    '/spritesheets/Clothes/archer_068.webp',
    '/spritesheets/Clothes/assasin_065.webp',
    '/spritesheets/Clothes/assasin_081.webp',
    '/spritesheets/Clothes/clothes_072.webp',
    '/spritesheets/Clothes/dancer_006.webp',
    '/spritesheets/Clothes/druid_061.webp',
    '/spritesheets/Clothes/druid_078.webp',
    '/spritesheets/Clothes/frame_014.webp',
    '/spritesheets/Clothes/frame_015.webp',
    '/spritesheets/Clothes/frame_016.webp',
    '/spritesheets/Clothes/frame_017.webp',
    '/spritesheets/Clothes/frame_018.webp',
    '/spritesheets/Clothes/frame_020.webp',
    '/spritesheets/Clothes/frame_021.webp',
    '/spritesheets/Clothes/frame_022.webp',
    '/spritesheets/Clothes/frame_023.webp',
    '/spritesheets/Clothes/frame_025.webp',
    '/spritesheets/Clothes/frame_026.webp',
    '/spritesheets/Clothes/frame_027.webp',
    '/spritesheets/Clothes/frame_028.webp',
    '/spritesheets/Clothes/frame_029.webp',
    '/spritesheets/Clothes/frame_030.webp',
    '/spritesheets/Clothes/frame_031.webp',
    '/spritesheets/Clothes/frame_032.webp',
    '/spritesheets/Clothes/frame_033.webp',
    '/spritesheets/Clothes/frame_034.webp',
    '/spritesheets/Clothes/frame_035.webp',
    '/spritesheets/Clothes/frame_036.webp',
    '/spritesheets/Clothes/frame_037.webp',
    '/spritesheets/Clothes/frame_038.webp',
    '/spritesheets/Clothes/frame_039.webp',
    '/spritesheets/Clothes/frame_040.webp',
    '/spritesheets/Clothes/frame_041.webp',
    '/spritesheets/Clothes/frame_042.webp',
    '/spritesheets/Clothes/frame_043.webp',
    '/spritesheets/Clothes/frame_044.webp',
    '/spritesheets/Clothes/frame_045.webp',
    '/spritesheets/Clothes/frame_047.webp',
    '/spritesheets/Clothes/frame_048.webp',
    '/spritesheets/Clothes/frame_050.webp',
    '/spritesheets/Clothes/frame_051.webp',
    '/spritesheets/Clothes/frame_053.webp',
    '/spritesheets/Clothes/frame_055.webp',
    '/spritesheets/Clothes/frame_057.webp',
    '/spritesheets/Clothes/frame_060.webp',
    '/spritesheets/Clothes/ginobi_019.webp',
    '/spritesheets/Clothes/ginobi_064.webp',
    '/spritesheets/Clothes/ginobi_066.webp',
    '/spritesheets/Clothes/ginobi_070.webp',
    '/spritesheets/Clothes/ginobi_074.webp',
    '/spritesheets/Clothes/gunslinger_004.webp',
    '/spritesheets/Clothes/hunter_080.webp',
    '/spritesheets/Clothes/mage_003.webp',
    '/spritesheets/Clothes/mage_008.webp',
    '/spritesheets/Clothes/mage_062.webp',
    '/spritesheets/Clothes/necromancer_063.webp',
    '/spritesheets/Clothes/priest_011.webp',
    '/spritesheets/Clothes/rouge_024.webp',
    '/spritesheets/Clothes/rouge_076.webp',
    '/spritesheets/Clothes/rouge_077.webp',
    '/spritesheets/Clothes/thief_012.webp',
].map(toEntry);

export const SPRITESHEET_INDEX_NPC: SpritesheetEntry[] = [
    '/spritesheets/Npc-00.webp',
    '/spritesheets/Npc-01.webp',
    '/spritesheets/Npc-02.webp',
    '/spritesheets/Npc-03.webp',
    '/spritesheets/Npc-04.webp',
    '/spritesheets/Npc-05.webp',
    '/spritesheets/Npc-06.webp',
    '/spritesheets/Npc-07.webp',
    '/spritesheets/Npc-08.webp',
    '/spritesheets/Npc-09.webp',
    '/spritesheets/Npc-10.webp',
].map(toEntry);

/** Todos los bodies disponibles para equipamiento/armaduras. */
export const SPRITESHEET_INDEX_BODIES: SpritesheetEntry[] = [
  ...SPRITESHEET_INDEX_ARMOR,
  ...SPRITESHEET_INDEX_CLOTHES,
];

export function findSpritesheetBySlug(slug: string): SpritesheetEntry | undefined {
  return SPRITESHEET_INDEX_BODIES.find((s) => s.slug === slug);
}
