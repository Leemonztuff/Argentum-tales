import React from 'react';
import { NPC, CharacterClass } from '../types/game';
import { X, MessageSquare, ShoppingBag, Hammer, BookOpen, Sparkles } from 'lucide-react';
import { SpriteAvatar } from './SpriteAvatar';
import { NPC_SPRITES, DEFAULT_NPC_SPRITE } from '../data/spritesheets';

interface DialogueModalProps {
  npc: NPC;
  onClose: () => void;
  onOpenShop?: (type: 'weapons' | 'potions' | 'crafting' | 'general') => void;
  onOpenCrafting?: (station: 'smith' | 'alchemy') => void;
  onOpenQuests?: () => void;
  onPromoteJob?: (jobClass: CharacterClass) => void;
  playerClass?: CharacterClass;
}

export const DialogueModal: React.FC<DialogueModalProps> = ({
  npc,
  onClose,
  onOpenShop,
  onOpenCrafting,
  onOpenQuests,
  onPromoteJob,
  playerClass,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#08080c]/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl max-h-[94vh] sm:max-h-[85vh] hud-panel border border-amber-500/20 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto gold-glow">
        {/* Top Header with Avatar */}
        <div className="flex items-center justify-between px-3.5 py-2.5 sm:px-5 sm:py-4 border-b border-white/10 hud-blur">
          <div className="flex items-center gap-2 sm:gap-3">
            <SpriteAvatar
              spriteUrl={NPC_SPRITES[npc.id] || DEFAULT_NPC_SPRITE}
              fallbackEmoji={npc.sprite}
              size={44}
              glowColor={npc.color}
            />
            <div>
              <h2 className="text-sm sm:text-base font-bold font-medieval text-amber-200">{npc.name}</h2>
              <span className="text-[10px] sm:text-xs text-slate-400 font-medium">{npc.title}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 sm:p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition">
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Dialogue Body */}
        <div className="p-3 sm:p-5 flex-1 overflow-y-auto flex flex-col gap-2 sm:gap-3">
          {npc.dialogue.map((line, idx) => (
            <p key={idx} className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans hud-blur p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-white/5 shadow-inner">
              "{line}"
            </p>
          ))}
        </div>

        {/* Action Options */}
        <div className="flex flex-wrap items-center gap-2 p-3 sm:p-4 hud-blur border-t border-white/10">
          {npc.shopType && onOpenShop && (
            <button
              onClick={() => {
                onClose();
                onOpenShop(npc.shopType!);
              }}
              className="flex-1 min-w-[130px] bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 active:scale-95 text-slate-950 font-medieval text-xs font-bold py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl shadow-lg gold-glow transition flex items-center justify-center gap-1.5 sm:gap-2"
            >
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Comerciar
            </button>
          )}

          {npc.id === 'npc_herrero' && onOpenCrafting && (
            <button
              onClick={() => {
                onClose();
                onOpenCrafting('smith');
              }}
              className="flex-1 min-w-[130px] bg-slate-800/90 hover:bg-slate-700 active:scale-95 text-amber-300 text-xs font-bold py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl border border-white/10 transition flex items-center justify-center gap-1.5 sm:gap-2"
            >
              <Hammer className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Forjar Equipo
            </button>
          )}

          {npc.id === 'npc_alquimista' && onOpenCrafting && (
            <button
              onClick={() => {
                onClose();
                onOpenCrafting('alchemy');
              }}
              className="flex-1 min-w-[130px] bg-slate-800/90 hover:bg-slate-700 active:scale-95 text-emerald-300 text-xs font-bold py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl border border-white/10 transition flex items-center justify-center gap-1.5 sm:gap-2"
            >
              <Hammer className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Destilar Pociones
            </button>
          )}

          {npc.givesQuestId && onOpenQuests && (
            <button
              onClick={() => {
                onClose();
                onOpenQuests();
              }}
              className="flex-1 min-w-[130px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white text-xs font-bold py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl shadow-lg transition flex items-center justify-center gap-1.5 sm:gap-2"
            >
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Ver Misiones
            </button>
          )}

          {npc.jobPromotionClass && onPromoteJob && (
            <button
              onClick={() => {
                onClose();
                onPromoteJob(npc.jobPromotionClass!);
              }}
              className="w-full mt-1 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 active:scale-95 text-slate-950 font-medieval text-xs sm:text-sm font-extrabold py-2.5 sm:py-3 px-4 rounded-xl shadow-xl gold-glow transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-slate-900 animate-pulse" />
              {playerClass === 'novicio'
                ? `Promocionar a Job: ${npc.jobPromotionClass.toUpperCase()}`
                : `Aceptar Maestría de Job: ${npc.jobPromotionClass.toUpperCase()}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
