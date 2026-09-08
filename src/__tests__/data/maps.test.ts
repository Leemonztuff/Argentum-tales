import { describe, it, expect } from 'vitest';
import { MAPS } from '../../data/maps';
import { MOBS } from '../../data/mobs';

describe('MAPS', () => {
  it('has at least one map', () => {
    expect(Object.keys(MAPS).length).toBeGreaterThan(0);
  });

  it('all maps have required fields', () => {
    for (const [id, map] of Object.entries(MAPS)) {
      expect(map).toHaveProperty('id', id);
      expect(map).toHaveProperty('name');
      expect(map).toHaveProperty('width');
      expect(map).toHaveProperty('height');
      expect(map).toHaveProperty('tiles');
      expect(map.tiles.length).toBe(map.height);
      expect(map.tiles[0].length).toBe(map.width);
    }
  });

  it('all mob spawns reference valid mob templates', () => {
    for (const [id, map] of Object.entries(MAPS)) {
      if (map.mobSpawns) {
        for (const spawn of map.mobSpawns) {
          expect(MOBS).toHaveProperty(spawn.mobId);
        }
      }
    }
  });

  it('all portal targets reference valid map ids', () => {
    for (const [id, map] of Object.entries(MAPS)) {
      if (map.portals) {
        for (const portal of map.portals) {
          expect(MAPS).toHaveProperty(portal.targetMapId);
        }
      }
    }
  });
});
