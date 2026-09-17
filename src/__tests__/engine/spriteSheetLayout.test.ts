import { describe, it, expect } from 'vitest';
import { isFullColumnSpriteUrl } from '../../engine/Game3DRenderer';

describe('isFullColumnSpriteUrl', () => {
  const base = 'https://raw.githubusercontent.com/example/Argentum-tales/main/public';

  it('detects Armor webp body sheets', () => {
    expect(isFullColumnSpriteUrl(`${base}/spritesheets/Armor/frame_000.webp`)).toBe(true);
    expect(isFullColumnSpriteUrl(`${base}/spritesheets/ARMOR/frame_046.webp`)).toBe(true);
  });

  it('detects Clothes webp body sheets', () => {
    expect(isFullColumnSpriteUrl(`${base}/spritesheets/Clothes/frame_015.webp`)).toBe(true);
  });

  it('detects Npc single-row webp sheets', () => {
    expect(isFullColumnSpriteUrl(`${base}/spritesheets/Npc-00.webp`)).toBe(true);
    expect(isFullColumnSpriteUrl(`${base}/spritesheets/Npc-10.webp`)).toBe(true);
  });

  it('keeps classic 4x4 PNG sheets in grid mode', () => {
    expect(isFullColumnSpriteUrl(`${base}/players/Cuerpos/humano02_normalized.png`)).toBe(false);
    expect(isFullColumnSpriteUrl(`${base}/players/Jobs/base_head_spritesheet.png`)).toBe(false);
    expect(isFullColumnSpriteUrl('https://aoassets.com/mobs/explorer.png')).toBe(false);
  });
});