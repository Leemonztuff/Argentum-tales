/**
 * worldScale — Global relative sizing system for the 2.5D scene.
 * ------------------------------------------------------------------
 * SINGLE SOURCE OF TRUTH for how big entities are in world units.
 *
 * Design contract (mobile-first, resolution-independent):
 *  - The ground grid is 1 world unit = 1 tile.
 *  - A standard humanoid's VISIBLE body (head top → feet) measures
 *    ENTITY_BASE_WORLD_HEIGHT world units = 1.5 tiles, the classic 2.5D
 *    hero proportion. Every entity's quad scale derives from its entity-type
 *    multiplier — never from viewport size or device pixel ratio — so
 *    proportions are stable on any screen and zoom never re-scales actors.
 *  - Sprite textures are authored on SPRITE_CANVAS×SPRITE_CANVAS canvases
 *    where the visible body spans bodyCanvasHeight pixels (headTopY →
 *    feetAnchorY). The billboard quad covers the FULL canvas, hence the
 *    QUAD_CANVAS_TO_BODY ratio in the scale formula below.
 *  - worldToCanvas() converts world-unit heights into canvas pixels so
 *    overlays (HP bars, labels) land exactly on the anchor points of any
 *    entity type.
 *
 * Correctness notes:
 *  - Entity scales are exact (no per-frame LOD drift). Distance culling
 *    handles far entities; mipmapping handles minification.
 *  - The reference camera framing lives in CameraManager; sizing here is
 *    deliberately independent of it.
 */

/** Sprite texture canvases are authored at this resolution. */
export const SPRITE_CANVAS = 256;

/** Canvas Y (from top) where entity feet are drawn. */
export const feetAnchorY = 242;

/** Canvas Y (from top) of the top-of-head line for a base humanoid. */
export const headTopY = 62;

/** Canvas pixels of visible body between headTopY and feetAnchorY. */
export const bodyCanvasHeight = feetAnchorY - headTopY; // 180

/**
 * Visible-body geometry on the authored canvas (industry layout contract).
 * All sprite composition code and debug overlays MUST derive their layout
 * from these values instead of hard-coding 22/24/180/242 literals.
 */
export const SPRITE_LAYOUT = {
  /** Feet line — bottom anchor of the composed sprite. */
  feet: feetAnchorY,
  /** Hard ceiling for the visible body so labels keep clearance. */
  bodyMax: bodyCanvasHeight,
  /** Label text baseline near the canvas top. */
  labelY: 22,
  /** Minimum top edge for the composed sprite: label baseline + 2px breathing gap. */
  topMargin: 24,
  /** Width cap so wide sprites never touch the canvas edge. */
  maxBodyWidth: 220,
} as const;

/** World units of VISIBLE body height for a base humanoid standing on a tile. */
export const ENTITY_BASE_WORLD_HEIGHT = 1.5;

/** World height of the full-canvas billboard quad for a base humanoid. */
export const QUAD_WORLD_HEIGHT =
  (ENTITY_BASE_WORLD_HEIGHT * SPRITE_CANVAS) / bodyCanvasHeight;

/** Relative size multiplier per entity type. Tune the whole game here. */
export type EntityKind = 'player' | 'npc' | 'mob' | 'boss';

export const ENTITY_SCALE: Record<EntityKind, number> = {
  player: 1.0,
  npc: 1.0,
  mob: 0.95,
  boss: 1.45,
};

/**
 * Unit-quad vertical offset (dimensionless) from a centered 1×1 billboard's
 * geometric center to its authored feet line. Positive because the feet line
 * sits BELOW the canvas center (canvas Y grows downward, world Y grows up).
 *
 * Anchoring rule (one rule for players, mobs and NPCs):
 *   quad center world Y = getFeetOffsetWorld(kind)  →  feet land exactly at y=0.
 */
export const QUAD_CENTER_TO_FEET_UNIT = SPRITE_LAYOUT.feet / SPRITE_CANVAS - 0.5; // +0.4453

/**
 * World Y where the CENTER of an entity's billboard quad must sit so its
 * authored feet line lands exactly on the ground (y=0). No floating feet.
 */
export function getFeetOffsetWorld(kind: EntityKind = 'player'): number {
  return getEntityWorldScale(kind) * QUAD_CENTER_TO_FEET_UNIT;
}

/**
 * World Y (relative to ground) of an authored canvas line for an entity kind.
 * canvasYToWorldY(SPRITE_LAYOUT.feet) === 0 (feet on the ground);
 * canvasYToWorldY(headTopY) === visible body height (head top).
 */
export function canvasYToWorldY(canvasY: number, kind: EntityKind = 'player'): number {
  return (getEntityWorldScale(kind) * (SPRITE_LAYOUT.feet - canvasY)) / SPRITE_CANVAS;
}

/** Contact-shadow radius (world units) per entity type. */
export const SHADOW_RADIUS: Record<EntityKind, number> = {
  player: 0.38,
  npc: 0.38,
  mob: 0.36,
  boss: 0.72,
};

/** HP bar geometry in world units, anchored above the head. */
export const HP_BAR = {
  width: 0.9,
  height: 0.075,
  /** Gap above the head so the bar never overlaps hair. */
  lift: 0.12,
  /** Head-top world height of an entity kind — the bar anchor point. */
  anchorFor(kind: EntityKind): number {
    return canvasYToWorldY(headTopY, kind);
  },
} as const;

/**
 * World quad scale for an entity kind. The ONLY way callers may size
 * character billboards; one tweak here re-scales every entity class.
 */
export function getEntityWorldScale(kind: EntityKind): number {
  return QUAD_WORLD_HEIGHT * ENTITY_SCALE[kind];
}

/**
 * Formal anchor contract for all sprite billboards.
 * Every entity type must satisfy this contract to land feet-on-ground.
 * Use this to verify that a billboard is correctly positioned: the quad
 * center world Y must equal feetOffsetWorld for the entity kind.
 */
export interface SpriteAnchorContract {
  /** World Y where the billboard quad center sits so feet land at y=0. */
  readonly feetOffsetWorld: number;
  /** World scale multiplier for this entity kind. */
  readonly worldScale: number;
  /** Canvas Y (from top) where the feet line is authored. */
  readonly feetCanvasY: number;
}

/**
 * Returns the anchor contract for an entity kind.
 * Callers (renderer, instancing manager) should verify their billboard
 * positioning against this contract to prevent floating or buried feet.
 */
export function getAnchorContract(kind: EntityKind): SpriteAnchorContract {
  return {
    feetOffsetWorld: getFeetOffsetWorld(kind),
    worldScale: getEntityWorldScale(kind),
    feetCanvasY: SPRITE_LAYOUT.feet,
  };
}

/** Convert a world-unit height into authored canvas pixels. */
export function worldToCanvas(worldHeight: number): number {
  return (worldHeight / ENTITY_BASE_WORLD_HEIGHT) * bodyCanvasHeight;
}
