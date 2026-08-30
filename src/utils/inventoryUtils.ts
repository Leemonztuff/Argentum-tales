import { Item, ItemType } from '../types/game';

export interface AutoPickupTypeFilters {
  gold: boolean;
  consumables: boolean;
  materials: boolean;
  equipment: boolean;
  quest: boolean;
}

export const DEFAULT_AUTO_PICKUP_FILTERS: AutoPickupTypeFilters = {
  gold: true,
  consumables: true,
  materials: true,
  equipment: true,
  quest: true,
};

/**
 * Determines whether an item type or item object can stack in inventory.
 */
export function isStackableItem(item: Item): boolean {
  if (item.stackable === false) return false;
  if (item.stackable === true) return true;

  const stackableTypes: ItemType[] = ['potion', 'material', 'arrow', 'quest'];
  const unstackableTypes: ItemType[] = ['weapon', 'shield', 'helmet', 'armor', 'boots', 'ring', 'amulet'];

  if (unstackableTypes.includes(item.type)) {
    return false;
  }

  return stackableTypes.includes(item.type) || item.count !== undefined;
}

/**
 * Checks if a specific item or gold should be automatically picked up based on user filters.
 */
export function shouldAutoPickupItem(
  item: Item | 'gold' | string,
  filters: AutoPickupTypeFilters = DEFAULT_AUTO_PICKUP_FILTERS
): boolean {
  if (item === 'gold') {
    return filters.gold !== false;
  }

  if (typeof item === 'string') {
    // String id check fallback (e.g. 'pocion_roja')
    if (item.includes('pocion') || item.includes('elixir')) return filters.consumables !== false;
    if (item.includes('madera') || item.includes('mineral') || item.includes('hierba') || item.includes('hueso') || item.includes('perla') || item.includes('escama')) return filters.materials !== false;
    if (item.includes('libro')) return filters.quest !== false;
    return true;
  }

  switch (item.type) {
    case 'potion':
    case 'arrow':
      return filters.consumables !== false;
    case 'material':
      return filters.materials !== false;
    case 'weapon':
    case 'shield':
    case 'helmet':
    case 'armor':
    case 'boots':
    case 'ring':
    case 'amulet':
      return filters.equipment !== false;
    case 'quest':
      return filters.quest !== false;
    default:
      return true;
  }
}

/**
 * Adds an item into an inventory array, stacking it into an existing slot if possible.
 */
export function addItemToInventory(
  inventory: (Item | null)[],
  itemToAdd: Item,
  countToAdd: number = 1
): { inventory: (Item | null)[]; success: boolean; stacked: boolean; slotIndex: number } {
  const newInv = [...inventory];
  const amount = countToAdd || itemToAdd.count || 1;

  if (isStackableItem(itemToAdd)) {
    // 1. Check for existing stackable slot with same item id
    const existingIdx = newInv.findIndex((i) => i !== null && i.id === itemToAdd.id);
    if (existingIdx !== -1) {
      const currentSlot = newInv[existingIdx]!;
      newInv[existingIdx] = {
        ...currentSlot,
        stackable: true,
        count: (currentSlot.count || 1) + amount,
      };
      return { inventory: newInv, success: true, stacked: true, slotIndex: existingIdx };
    }
  }

  // 2. Find first empty slot
  const emptyIdx = newInv.findIndex((i) => i === null);
  if (emptyIdx !== -1) {
    newInv[emptyIdx] = {
      ...itemToAdd,
      stackable: isStackableItem(itemToAdd),
      count: amount,
    };
    return { inventory: newInv, success: true, stacked: false, slotIndex: emptyIdx };
  }

  // 3. Inventory full
  return { inventory: newInv, success: false, stacked: false, slotIndex: -1 };
}

/**
 * Consolidates and sorts inventory slots:
 * Groups all stackable items of the same ID together into single stacked elements.
 */
export function consolidateInventory(inventory: (Item | null)[]): (Item | null)[] {
  const result: (Item | null)[] = new Array(20).fill(null);
  const stackedMap = new Map<string, Item>();
  const unstackables: Item[] = [];

  for (const item of inventory) {
    if (!item) continue;

    if (isStackableItem(item)) {
      if (stackedMap.has(item.id)) {
        const existing = stackedMap.get(item.id)!;
        existing.count = (existing.count || 1) + (item.count || 1);
      } else {
        stackedMap.set(item.id, {
          ...item,
          stackable: true,
          count: item.count || 1,
        });
      }
    } else {
      unstackables.push({ ...item });
    }
  }

  let index = 0;
  // Place stacked items first
  for (const item of stackedMap.values()) {
    if (index < 20) {
      result[index++] = item;
    }
  }
  // Place unstackables next
  for (const item of unstackables) {
    if (index < 20) {
      result[index++] = item;
    }
  }

  return result;
}
