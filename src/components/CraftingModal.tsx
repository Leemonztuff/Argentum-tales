import React from 'react';
import { PlayerCharacter, CraftingRecipe } from '../types/game';
import { CRAFTING_RECIPES } from '../data/crafting';
import { ITEMS } from '../data/items';
import { contentRegistry } from '../services/ContentRegistry';
import { Hammer } from 'lucide-react';
import { Modal } from '../ui';

interface CraftingModalProps {
  station: 'smith' | 'alchemy';
  player: PlayerCharacter;
  onClose: () => void;
  onCraft: (recipe: CraftingRecipe) => void;
}

export const CraftingModal: React.FC<CraftingModalProps> = ({
  station,
  player,
  onClose,
  onCraft,
}) => {
  const recipes = CRAFTING_RECIPES.filter((r) => r.station === station);

  // Helper to count item quantity in player's inventory
  const getIngredientCount = (itemId: string): number => {
    let count = 0;
    player.inventory.forEach((item) => {
      if (item?.id === itemId) {
        count += item.count || 1;
      }
    });
    return count;
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={station === 'smith' ? 'Estación de Forja y Herrería' : 'Laboratorio de Alquimia'}
      icon={<span>{station === 'smith' ? '⚒️' : '⚗️'}</span>}
      size="lg"
      accent="#C89B3C"
    >
      <div className="p-3 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5">
        {recipes.map((recipe) => {
          const outputItem = contentRegistry.getItem(recipe.outputItemId) || ITEMS[recipe.outputItemId];
          if (!outputItem) return null;

          // Check if player has all ingredients & gold
          const hasGold = player.gold >= recipe.goldCost;
          let hasAllIngredients = hasGold;

          // Crafting probability formula according to GDD §8.3
          const skillLevel = recipe.skillType ? (player.skills[recipe.skillType]?.level || 10) : 10;
          const diff = recipe.difficulty || 10;
          const successChance = Math.min(95, Math.max(10, Math.round(50 + (skillLevel - diff) * 2)));

          return (
            <div
              key={recipe.id}
              className="hud-blur border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col justify-between gap-2.5 sm:gap-3 shadow-inner hover:border-amber-500/30 transition"
            >
              <div className="flex items-start gap-2.5 sm:gap-3">
                <span className="text-2xl sm:text-3xl p-1.5 sm:p-2 bg-slate-900/90 border border-white/10 rounded-xl">
                  {outputItem.icon}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="text-xs font-bold text-slate-100">{recipe.name}</h3>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      recipe.tier === 'avanzada' ? 'bg-purple-950/80 text-purple-300 border border-purple-500/30' :
                      recipe.tier === 'intermedia' ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {recipe.tier || 'Básica'}
                    </span>
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 line-clamp-1">{outputItem.description}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] font-pixel text-amber-400 font-bold">
                      Coste: 🪙 {recipe.goldCost} Oro
                    </span>
                    <span className={`text-[10px] font-bold ${successChance >= 75 ? 'text-emerald-400' : successChance >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                      Éxito: {successChance}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Ingredients List */}
              <div className="flex flex-col gap-1 hud-blur bg-slate-900/70 p-2 sm:p-2.5 rounded-xl text-[10px] sm:text-[11px] border border-white/5">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">Materiales Requeridos:</span>
                {recipe.ingredients.map((ing) => {
                  const ingItem = contentRegistry.getItem(ing.itemId) || ITEMS[ing.itemId];
                  const currentCount = getIngredientCount(ing.itemId);
                  const isEnough = currentCount >= ing.count;
                  if (!isEnough) hasAllIngredients = false;

                  return (
                    <div key={ing.itemId} className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1">
                        {ingItem?.icon} {ingItem?.name}
                      </span>
                      <span className={`font-pixel font-bold ${isEnough ? 'text-emerald-400' : 'text-red-400'}`}>
                        {currentCount} / {ing.count}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Craft Button */}
              <button
                disabled={!hasAllIngredients}
                onClick={() => onCraft(recipe)}
                className={`w-full py-2 sm:py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                  hasAllIngredients
                    ? 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 active:scale-95 text-slate-950 font-medieval shadow-lg gold-glow'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Hammer className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Forjar / Elaborar
              </button>
            </div>
          );
        })}
      </div>
    </Modal>
  );
};
