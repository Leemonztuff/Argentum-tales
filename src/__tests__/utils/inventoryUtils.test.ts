import { describe, it, expect } from 'vitest';
import {
  isStackableItem,
  shouldAutoPickupItem,
  addItemToInventory,
  consolidateInventory,
  DEFAULT_AUTO_PICKUP_FILTERS,
} from '../../utils/inventoryUtils';
import { Item } from '../../types/game';

const makeItem = (overrides: Partial<Item> = {}): Item => ({
  id: 'test_item',
  name: 'Test Item',
  description: 'A test item',
  type: 'material',
  icon: '🧪',
  price: 10,
  sellPrice: 5,
  ...overrides,
});

describe('isStackableItem', () => {
  it('returns true for potions', () => {
    expect(isStackableItem(makeItem({ type: 'potion' }))).toBe(true);
  });

  it('returns true for materials', () => {
    expect(isStackableItem(makeItem({ type: 'material' }))).toBe(true);
  });

  it('returns true for arrows', () => {
    expect(isStackableItem(makeItem({ type: 'arrow' }))).toBe(true);
  });

  it('returns true for quest items', () => {
    expect(isStackableItem(makeItem({ type: 'quest' }))).toBe(true);
  });

  it('returns false for weapons', () => {
    expect(isStackableItem(makeItem({ type: 'weapon' }))).toBe(false);
  });

  it('returns false for shields', () => {
    expect(isStackableItem(makeItem({ type: 'shield' }))).toBe(false);
  });

  it('returns false for armor', () => {
    expect(isStackableItem(makeItem({ type: 'armor' }))).toBe(false);
  });

  it('returns false when stackable is explicitly false', () => {
    expect(isStackableItem(makeItem({ type: 'potion', stackable: false }))).toBe(false);
  });

  it('returns true when stackable is explicitly true for non-stackable type', () => {
    expect(isStackableItem(makeItem({ type: 'weapon', stackable: true }))).toBe(true);
  });
});

describe('shouldAutoPickupItem', () => {
  it('picks up gold when filter is on', () => {
    expect(shouldAutoPickupItem('gold')).toBe(true);
  });

  it('skips gold when filter is off', () => {
    expect(shouldAutoPickupItem('gold', { ...DEFAULT_AUTO_PICKUP_FILTERS, gold: false })).toBe(false);
  });

  it('picks up potions (item object)', () => {
    expect(shouldAutoPickupItem(makeItem({ type: 'potion' }))).toBe(true);
  });

  it('skips potions when consumables filter is off', () => {
    expect(shouldAutoPickupItem(makeItem({ type: 'potion' }), { ...DEFAULT_AUTO_PICKUP_FILTERS, consumables: false })).toBe(false);
  });

  it('picks up weapons when equipment filter is on', () => {
    expect(shouldAutoPickupItem(makeItem({ type: 'weapon' }))).toBe(true);
  });

  it('skips weapons when equipment filter is off', () => {
    expect(shouldAutoPickupItem(makeItem({ type: 'weapon' }), { ...DEFAULT_AUTO_PICKUP_FILTERS, equipment: false })).toBe(false);
  });

  it('detects potions by string id', () => {
    expect(shouldAutoPickupItem('pocion_roja')).toBe(true);
  });

  it('detects materials by string id', () => {
    expect(shouldAutoPickupItem('madera_bosque')).toBe(true);
  });
});

describe('addItemToInventory', () => {
  it('adds item to empty slot', () => {
    const inv: (Item | null)[] = new Array(20).fill(null);
    const result = addItemToInventory(inv, makeItem());
    expect(result.success).toBe(true);
    expect(result.stacked).toBe(false);
    expect(result.slotIndex).toBe(0);
    expect(result.inventory[0]?.id).toBe('test_item');
    expect(result.inventory[0]?.count).toBe(1);
  });

  it('stacks same item into existing slot', () => {
    const inv: (Item | null)[] = new Array(20).fill(null);
    inv[0] = makeItem({ count: 3 });
    const result = addItemToInventory(inv, makeItem(), 2);
    expect(result.success).toBe(true);
    expect(result.stacked).toBe(true);
    expect(result.slotIndex).toBe(0);
    expect(result.inventory[0]?.count).toBe(5);
  });

  it('returns failure when inventory is full', () => {
    const inv: (Item | null)[] = new Array(20).fill(makeItem({ type: 'weapon', id: 'unique_weapon' }));
    const result = addItemToInventory(inv, makeItem({ type: 'weapon', id: 'another_weapon' }));
    expect(result.success).toBe(false);
    expect(result.slotIndex).toBe(-1);
  });

  it('does not mutate original inventory', () => {
    const inv: (Item | null)[] = new Array(20).fill(null);
    addItemToInventory(inv, makeItem());
    expect(inv[0]).toBeNull();
  });
});

describe('consolidateInventory', () => {
  it('merges duplicate stackable items', () => {
    const inv: (Item | null)[] = new Array(20).fill(null);
    inv[0] = makeItem({ count: 3 });
    inv[1] = makeItem({ count: 2 });
    const result = consolidateInventory(inv);
    const stacked = result.find((i) => i?.id === 'test_item');
    expect(stacked?.count).toBe(5);
  });

  it('keeps unstackable items separate', () => {
    const inv: (Item | null)[] = new Array(20).fill(null);
    inv[0] = makeItem({ type: 'weapon', id: 'sword1' });
    inv[1] = makeItem({ type: 'weapon', id: 'sword2' });
    const result = consolidateInventory(inv);
    const weapons = result.filter((i) => i?.type === 'weapon');
    expect(weapons.length).toBe(2);
  });

  it('returns array of length 20', () => {
    const result = consolidateInventory([]);
    expect(result.length).toBe(20);
  });
});
