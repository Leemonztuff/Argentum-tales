import { describe, it, expect } from 'vitest';
import { getRarity, getRarityMeta, RARITY_ORDER } from '../../utils/itemRarity';

describe('getRarity', () => {
  it('returns comun for price < 100', () => {
    expect(getRarity({ price: 50 })).toBe('comun');
  });

  it('returns poco_comun for price 100-199', () => {
    expect(getRarity({ price: 100 })).toBe('poco_comun');
    expect(getRarity({ price: 199 })).toBe('poco_comun');
  });

  it('returns raro for price 200-499', () => {
    expect(getRarity({ price: 200 })).toBe('raro');
    expect(getRarity({ price: 499 })).toBe('raro');
  });

  it('returns epico for price 500-999', () => {
    expect(getRarity({ price: 500 })).toBe('epico');
    expect(getRarity({ price: 999 })).toBe('epico');
  });

  it('returns legendario for price >= 1000', () => {
    expect(getRarity({ price: 1000 })).toBe('legendario');
    expect(getRarity({ price: 5000 })).toBe('legendario');
  });

  it('explicit rarity overrides price-based tier', () => {
    expect(getRarity({ price: 10, rarity: 'legendario' })).toBe('legendario');
    expect(getRarity({ price: 5000, rarity: 'comun' })).toBe('comun');
  });

  it('boundary: price 99 is comun', () => {
    expect(getRarity({ price: 99 })).toBe('comun');
  });

  it('boundary: price 0 is comun', () => {
    expect(getRarity({ price: 0 })).toBe('comun');
  });
});

describe('getRarityMeta', () => {
  it('returns correct label for each rarity', () => {
    expect(getRarityMeta({ price: 50 }).label).toBe('Común');
    expect(getRarityMeta({ price: 150 }).label).toBe('Poco Común');
    expect(getRarityMeta({ price: 300 }).label).toBe('Raro');
    expect(getRarityMeta({ price: 700 }).label).toBe('Épico');
    expect(getRarityMeta({ price: 2000 }).label).toBe('Legendario');
  });

  it('returns all 5 rarity orders', () => {
    expect(RARITY_ORDER.length).toBe(5);
    expect(RARITY_ORDER).toEqual(['comun', 'poco_comun', 'raro', 'epico', 'legendario']);
  });
});
