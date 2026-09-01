import { Item, ItemRarity } from '../types/game';

export const RARITY_ORDER: ItemRarity[] = ['comun', 'poco_comun', 'raro', 'epico', 'legendario'];

export interface RarityMeta {
  label: string;
  color: string;
  borderClass: string;
  textClass: string;
  glowClass: string;
}

export const RARITY_META: Record<ItemRarity, RarityMeta> = {
  comun: {
    label: 'Común',
    color: '#A8A29E',
    borderClass: 'border-white/10',
    textClass: 'text-stone-300',
    glowClass: '',
  },
  poco_comun: {
    label: 'Poco Común',
    color: '#57A65A',
    borderClass: 'border-emerald-500/50',
    textClass: 'text-emerald-300',
    glowClass: 'shadow-[0_0_8px_rgba(87,166,90,0.45)]',
  },
  raro: {
    label: 'Raro',
    color: '#4C9BE8',
    borderClass: 'border-sky-500/50',
    textClass: 'text-sky-300',
    glowClass: 'shadow-[0_0_10px_rgba(76,155,232,0.55)]',
  },
  epico: {
    label: 'Épico',
    color: '#9B6DFF',
    borderClass: 'border-purple-500/50',
    textClass: 'text-purple-300',
    glowClass: 'shadow-[0_0_12px_rgba(155,109,255,0.6)]',
  },
  legendario: {
    label: 'Legendario',
    color: '#E8B43E',
    borderClass: 'border-amber-500/60',
    textClass: 'text-amber-300',
    glowClass: 'shadow-[0_0_14px_rgba(232,180,62,0.7)]',
  },
};

/**
 * Resolves the rarity of an item. Explicit `item.rarity` wins; otherwise the
 * rank is derived from `price` so legacy data and drops tier up naturally.
 */
export function getRarity(item: Pick<Item, 'rarity' | 'price'>): ItemRarity {
  if (item.rarity) return item.rarity;
  const p = item.price;
  if (p >= 1000) return 'legendario';
  if (p >= 500) return 'epico';
  if (p >= 200) return 'raro';
  if (p >= 100) return 'poco_comun';
  return 'comun';
}

export function getRarityMeta(item: Pick<Item, 'rarity' | 'price'>): RarityMeta {
  return RARITY_META[getRarity(item)];
}