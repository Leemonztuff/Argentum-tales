import { describe, it, expect } from 'vitest';
import {
  SPRITE_CANVAS,
  SPRITE_LAYOUT,
  feetAnchorY,
  headTopY,
  bodyCanvasHeight,
  ENTITY_BASE_WORLD_HEIGHT,
  QUAD_WORLD_HEIGHT,
  QUAD_CENTER_TO_FEET_UNIT,
  ENTITY_SCALE,
  SHADOW_RADIUS,
  HP_BAR,
  EntityKind,
  getEntityWorldScale,
  getFeetOffsetWorld,
  canvasYToWorldY,
  worldToCanvas,
  getAnchorContract,
  SpriteAnchorContract,
} from '../../engine/worldScale';

const KINDS: EntityKind[] = ['player', 'npc', 'mob', 'boss'];

describe('worldScale layout contract', () => {
  it('authored canvas constants are internally consistent', () => {
    expect(SPRITE_LAYOUT.feet).toBe(feetAnchorY);
    expect(SPRITE_LAYOUT.bodyMax).toBe(bodyCanvasHeight);
    expect(bodyCanvasHeight).toBe(feetAnchorY - headTopY);
    // Body must fit between the top margin and the feet line.
    expect(SPRITE_LAYOUT.topMargin + SPRITE_LAYOUT.bodyMax).toBeLessThanOrEqual(SPRITE_LAYOUT.feet);
    // Label sits inside the top margin.
    expect(SPRITE_LAYOUT.labelY).toBeLessThan(SPRITE_LAYOUT.topMargin);
  });

  it('QUAD_CENTER_TO_FEET_UNIT matches the unit-quad feet-line math', () => {
    expect(QUAD_CENTER_TO_FEET_UNIT).toBeCloseTo(SPRITE_LAYOUT.feet / SPRITE_CANVAS - 0.5, 12);
    expect(QUAD_CENTER_TO_FEET_UNIT).toBeCloseTo(0.4453125, 9);
  });

  it('quad world height covers the full canvas for the base humanoid', () => {
    expect(QUAD_WORLD_HEIGHT).toBeCloseTo(
      (ENTITY_BASE_WORLD_HEIGHT * SPRITE_CANVAS) / bodyCanvasHeight,
      12,
    );
  });

  it.each(KINDS)('%s: feet anchor maps to the ground plane (y=0)', (kind) => {
    expect(canvasYToWorldY(SPRITE_LAYOUT.feet, kind)).toBeCloseTo(0, 12);
    // Anchoring rule: quad center sits ABOVE ground by scale × unit offset.
    const center = getFeetOffsetWorld(kind);
    expect(center).toBeCloseTo(getEntityWorldScale(kind) * QUAD_CENTER_TO_FEET_UNIT, 12);
    expect(center).toBeGreaterThan(0);
  });

  it.each(KINDS)('%s: head top maps to the visible body height (1.5 × kind scale)', (kind) => {
    const scale = getEntityWorldScale(kind);
    expect(canvasYToWorldY(headTopY, kind)).toBeCloseTo(
      (scale * (SPRITE_LAYOUT.feet - headTopY)) / SPRITE_CANVAS,
      12,
    );
    // Visible body height in world units for this kind.
    expect(ENTITY_BASE_WORLD_HEIGHT * ENTITY_SCALE[kind]).toBeCloseTo(
      1.5 * ENTITY_SCALE[kind],
      12,
    );
  });

  it('scales preserve entity ordering: boss > player = npc > mob', () => {
    const s = (k: EntityKind) => getEntityWorldScale(k);
    expect(s('boss')).toBeGreaterThan(s('player'));
    expect(s('player')).toBeCloseTo(s('npc'), 12);
    expect(s('mob')).toBeLessThan(s('player'));
    expect(s('mob')).toBeGreaterThan(0);
  });

  it('HP bar anchors above the head top with positive lift', () => {
    for (const kind of KINDS) {
      const headY = canvasYToWorldY(headTopY, kind);
      const barY = HP_BAR.anchorFor(kind) + HP_BAR.lift;
      expect(HP_BAR.anchorFor(kind)).toBeCloseTo(headY, 12);
      expect(barY).toBeGreaterThan(headY);
    }
  });

  it('shadow radii stay within one tile and scale with boss size', () => {
    for (const kind of KINDS) {
      expect(SHADOW_RADIUS[kind]).toBeGreaterThan(0);
      expect(SHADOW_RADIUS[kind]).toBeLessThan(1);
    }
    expect(SHADOW_RADIUS.boss).toBeGreaterThan(SHADOW_RADIUS.player);
  });

  it('worldToCanvas round-trips canvasYToWorldY for the base humanoid', () => {
    // canvasYToWorldY converts canvas px → world; worldToCanvas is its inverse
    // for heights measured from the feet line.
    const worldH = canvasYToWorldY(headTopY, 'player');
    expect(worldToCanvas(worldH)).toBeCloseTo(bodyCanvasHeight, 6);
  });

  // --- Canvas layout invariants ---

  it('SPRITE_CANVAS is exactly 256 (guard against accidental resize)', () => {
    expect(SPRITE_CANVAS).toBe(256);
  });

  it('SPRITE_LAYOUT.feet is within the canvas and above center', () => {
    expect(SPRITE_LAYOUT.feet).toBeGreaterThan(SPRITE_CANVAS / 2);
    expect(SPRITE_LAYOUT.feet).toBeLessThan(SPRITE_CANVAS);
  });

  it('body fits entirely between topMargin and feet line', () => {
    expect(SPRITE_LAYOUT.topMargin + SPRITE_LAYOUT.bodyMax).toBeLessThanOrEqual(SPRITE_LAYOUT.feet);
  });

  // --- SpriteAnchorContract tests ---

  it.each(KINDS)('%s: getAnchorContract feetOffsetWorld matches getFeetOffsetWorld', (kind) => {
    const contract = getAnchorContract(kind);
    expect(contract.feetOffsetWorld).toBeCloseTo(getFeetOffsetWorld(kind), 12);
  });

  it.each(KINDS)('%s: getAnchorContract worldScale matches getEntityWorldScale', (kind) => {
    const contract = getAnchorContract(kind);
    expect(contract.worldScale).toBeCloseTo(getEntityWorldScale(kind), 12);
  });

  it.each(KINDS)('%s: getAnchorContract feetCanvasY matches SPRITE_LAYOUT.feet', (kind) => {
    const contract = getAnchorContract(kind);
    expect(contract.feetCanvasY).toBe(SPRITE_LAYOUT.feet);
  });

  it.each(KINDS)('%s: feet-on-ground invariant — feetOffsetWorld > 0', (kind) => {
    const contract = getAnchorContract(kind);
    expect(contract.feetOffsetWorld).toBeGreaterThan(0);
  });

  it('anchor contracts preserve entity ordering: boss > player = npc > mob', () => {
    const c = (k: EntityKind): SpriteAnchorContract => getAnchorContract(k);
    expect(c('boss').feetOffsetWorld).toBeGreaterThan(c('player').feetOffsetWorld);
    expect(c('player').feetOffsetWorld).toBeCloseTo(c('npc').feetOffsetWorld, 12);
    expect(c('mob').feetOffsetWorld).toBeLessThan(c('player').feetOffsetWorld);
  });
});
