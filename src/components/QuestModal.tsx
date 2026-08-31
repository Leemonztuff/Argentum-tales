import React from 'react';
import { Quest } from '../types/game';
import { X, CheckCircle, Award, Compass } from 'lucide-react';
import { useUIStore } from '../ui';

interface QuestModalProps {
  quests: Quest[];
  onClose?: () => void;
  onClaimReward: (questId: string) => void;
}

export const QuestModal: React.FC<QuestModalProps> = ({ quests, onClose, onClaimReward }) => {
  const isOpen = useUIStore((s) => s.openModals.quests);
  const handleClose = onClose ?? (() => useUIStore.getState().closeModal('quests'));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 bg-[#08080c]/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[94vh] sm:max-h-[85vh] hud-panel border border-amber-500/20 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto gold-glow">
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 sm:px-5 sm:py-3.5 border-b border-white/10 hud-blur">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <span className="text-lg sm:text-xl">📜</span>
            <div>
              <h2 className="text-sm sm:text-lg font-bold font-medieval text-slate-100">Misiones de Arandor</h2>
              <p className="text-[10px] sm:text-xs text-slate-400">Guía de mazmorras y objetivos del reino (§9).</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 sm:p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Quests List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 flex flex-col gap-2.5 sm:gap-3.5">
          {quests.map((quest) => {
            const isCompleted = quest.currentAmount >= quest.requiredAmount;
            return (
              <div
                key={quest.id}
                className={`border rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col gap-2 sm:gap-2.5 transition ${
                  quest.claimed
                    ? 'hud-blur border-white/5 opacity-60'
                    : isCompleted
                    ? 'hud-blur border-emerald-500/60 shadow-xl bg-emerald-950/20'
                    : 'hud-blur border-white/10 hover:border-amber-500/30'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
                    <h3 className="text-xs sm:text-sm font-bold text-slate-100">{quest.title}</h3>
                  </div>
                  {quest.claimed ? (
                    <span className="text-[9px] sm:text-[10px] font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                      Completada
                    </span>
                  ) : isCompleted ? (
                    <span className="text-[9px] sm:text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                      <CheckCircle className="w-3 h-3" /> ¡Lista!
                    </span>
                  ) : (
                    <span className="text-[9px] sm:text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800/80 px-2 py-0.5 rounded-full font-pixel">
                      {quest.currentAmount} / {quest.requiredAmount}
                    </span>
                  )}
                </div>

                <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">{quest.description}</p>

                {/* Rewards Bar */}
                <div className="flex items-center justify-between pt-1.5 sm:pt-2 border-t border-white/10 text-[11px] sm:text-xs">
                  <div className="flex items-center gap-2 sm:gap-3 text-slate-400">
                    <span>🪙 <strong className="text-amber-300 font-pixel">{quest.goldReward} Oro</strong></span>
                    <span>⭐ <strong className="text-sky-300 font-pixel">{quest.expReward} EXP</strong></span>
                    {quest.itemReward && (
                      <span className="text-slate-300">🎁 Objeto</span>
                    )}
                  </div>

                  {!quest.claimed && isCompleted && (
                    <button
                      onClick={() => onClaimReward(quest.id)}
                      className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 active:scale-95 text-white font-bold text-xs px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl shadow-lg flex items-center gap-1.5 transition"
                    >
                      <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Reclamar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
