import { describe, it, expect } from 'vitest';
import { CRAFTING_RECIPES } from '../../data/crafting';
import { ITEMS } from '../../data/items';

describe('CRAFTING_RECIPES', () => {
  it('has at least one recipe', () => {
    expect(CRAFTING_RECIPES.length).toBeGreaterThan(0);
  });

  it('all recipes reference valid output items', () => {
    for (const recipe of CRAFTING_RECIPES) {
      expect(ITEMS).toHaveProperty(recipe.outputItemId);
    }
  });

  it('all recipes reference valid ingredient items', () => {
    for (const recipe of CRAFTING_RECIPES) {
      for (const ing of recipe.ingredients) {
        expect(ITEMS).toHaveProperty(ing.itemId);
      }
    }
  });

  it('all recipes have positive counts', () => {
    for (const recipe of CRAFTING_RECIPES) {
      expect(recipe.outputCount).toBeGreaterThan(0);
      for (const ing of recipe.ingredients) {
        expect(ing.count).toBeGreaterThan(0);
      }
    }
  });

  it('all recipes have valid tier', () => {
    const validTiers = ['basica', 'intermedia', 'avanzada'];
    for (const recipe of CRAFTING_RECIPES) {
      expect(validTiers).toContain(recipe.tier);
    }
  });

  it('all recipes have valid station', () => {
    const validStations = ['smith', 'alchemy'];
    for (const recipe of CRAFTING_RECIPES) {
      expect(validStations).toContain(recipe.station);
    }
  });
});
