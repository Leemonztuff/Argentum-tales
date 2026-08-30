import React, { useState } from 'react';
import { PlayerCharacter, Item } from '../types/game';
import { ITEMS } from '../data/items';
import { X, ShoppingBag, ArrowRightLeft, Check } from 'lucide-react';

import { contentRegistry } from '../services/ContentRegistry';

interface ShopModalProps {
  shopType: 'weapons' | 'potions' | 'crafting' | 'general';
  player: PlayerCharacter;
  onClose: () => void;
  onBuyItem: (item: Item) => void;
  onSellItem: (index: number) => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  shopType,
  player,
  onClose,
  onBuyItem,
  onSellItem,
}) => {
  const [tab, setTab] = useState<'buy' | 'sell'>('buy');

  // Shop Catalog items
  const catalogItemIds: string[] =
    shopType === 'weapons'
      ? ['daga_simple', 'espada_corta', 'espada_larga', 'hacha_barbara', 'arco_simple', 'flechas', 'escudo_madera', 'escudo_hierro', 'armadura_cuero', 'casco_hierro']
      : shopType === 'crafting'
      ? ['libro_herreria_intermedia', 'libro_hechizo_apocalipsis', 'mineral_hierro', 'madera_roble', 'perla_abismo', 'hueso_maldito']
      : ['pocion_roja', 'pocion_azul', 'elixir_fuerza', 'hierba_curativa', 'madera_roble', 'mineral_hierro'];

  const shopItems = catalogItemIds.map((id) => contentRegistry.getItem(id) || ITEMS[id]).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 bg-[#08080c]/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-3xl max-h-[94vh] sm:max-h-[85vh] hud-panel border border-amber-500/20 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto gold-glow">
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 sm:px-5 sm:py-3.5 border-b border-white/10 hud-blur">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <span className="text-lg sm:text-xl">
              {shopType === 'weapons' ? '🔨' : shopType === 'crafting' ? '📜' : '🧪'}
            </span>
            <div>
              <h2 className="text-sm sm:text-lg font-bold font-medieval text-slate-100">
                {shopType === 'weapons'
                  ? 'Herrería de Thorin'
                  : shopType === 'crafting'
                  ? 'El Coleccionista Errante'
                  : 'Botica de Eliana'}
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-400">
                {shopType === 'crafting'
                  ? 'Tomos de habilidad, recetas y grimorios antiguos (§8.4).'
                  : 'Comercio oficial de la Villa de Ullathorpe (§8).'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 hud-blur px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl border border-amber-500/30 gold-glow">
              <span className="text-xs sm:text-sm">🪙</span>
              <span className="text-[11px] sm:text-xs font-bold text-amber-400 font-pixel">{player.gold} Oro</span>
            </div>
            <button onClick={onClose} className="p-1 sm:p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition">
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-white/10 hud-blur px-3.5 sm:px-5 pt-1.5 sm:pt-2">
          <button
            onClick={() => setTab('buy')}
            className={`pb-2 sm:pb-2.5 px-3 sm:px-4 font-bold text-[11px] sm:text-xs border-b-2 transition ${
              tab === 'buy' ? 'border-amber-400 text-amber-300' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Comprar Mercancía
          </button>
          <button
            onClick={() => setTab('sell')}
            className={`pb-2 sm:pb-2.5 px-3 sm:px-4 font-bold text-[11px] sm:text-xs border-b-2 transition ${
              tab === 'sell' ? 'border-amber-400 text-amber-300' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Vender Objetos
          </button>
        </div>

        {/* Catalog List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5">
          {tab === 'buy' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              {shopItems.map((item) => {
                const canAfford = player.gold >= item.price;
                return (
                  <div
                    key={item.id}
                    className="hud-blur border border-white/10 rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 flex items-center justify-between gap-2.5 sm:gap-3 hover:border-amber-500/30 transition shadow-inner"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <span className="text-2xl sm:text-3xl p-1.5 sm:p-2 bg-slate-900/90 border border-white/10 rounded-xl">{item.icon}</span>
                      <div>
                        <h4 className="text-[11px] sm:text-xs font-bold text-slate-100">{item.name}</h4>
                        <p className="text-[9px] sm:text-[10px] text-slate-400 line-clamp-1">{item.description}</p>
                        <span className="text-[10px] sm:text-xs font-pixel font-bold text-amber-400 mt-0.5 inline-block">
                          🪙 {item.price} Oro
                        </span>
                      </div>
                    </div>

                    <button
                      disabled={!canAfford}
                      onClick={() => onBuyItem(item)}
                      className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition shrink-0 ${
                        canAfford
                          ? 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 active:scale-95 text-white shadow-lg gold-glow'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      Comprar
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              {player.inventory.map((item, index) => {
                if (!item) return null;
                return (
                  <div
                    key={index}
                    className="hud-blur border border-white/10 rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 flex items-center justify-between gap-2.5 sm:gap-3 hover:border-emerald-500/30 transition shadow-inner"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <span className="text-2xl sm:text-3xl p-1.5 sm:p-2 bg-slate-900/90 border border-white/10 rounded-xl">{item.icon}</span>
                      <div>
                        <h4 className="text-[11px] sm:text-xs font-bold text-slate-100">{item.name}</h4>
                        <span className="text-[10px] sm:text-xs font-pixel font-bold text-emerald-400">
                          🪙 +{item.sellPrice || Math.floor(item.price * 0.4)} Oro
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onSellItem(index)}
                      className="px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white transition shrink-0 shadow-lg"
                    >
                      Vender
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
