import React from 'react';
import { Skull, RefreshCw, Flame } from 'lucide-react';
import { Modal } from '../ui';

interface DeathModalProps {
  killerMobName: string;
  goldLost: number;
  onRespawn: () => void;
}

export const DeathModal: React.FC<DeathModalProps> = ({
  killerMobName,
  goldLost,
  onRespawn,
}) => {
  return (
    <Modal
      isOpen={true}
      onClose={onRespawn}
      title="Has Caído en Batalla"
      icon={<Skull className="w-5 h-5 text-red-400" />}
      size="sm"
      closeOnBackdrop={false}
      closeOnEscape={false}
      accent="#A83A32"
    >
      <div className="p-4 sm:p-6 text-center flex flex-col items-center gap-3 sm:gap-4">
        {/* Skull Icon */}
        <div className="p-2.5 sm:p-3.5 bg-red-950/80 border border-red-500/60 rounded-full shadow-2xl text-red-400 animate-pulse health-glow">
          <Skull className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>

        <div>
          <p className="text-[11px] sm:text-sm text-slate-300 mt-0.5 sm:mt-1">
            Fuiste derrotado por <strong className="text-red-300">{killerMobName}</strong>.
          </p>
        </div>

        {/* Penalty & Revenge Notice (§5.8) */}
        <div className="w-full hud-blur border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col gap-2 text-[11px] sm:text-xs text-slate-300 shadow-inner">
          <div className="flex items-center justify-between text-red-400 font-pixel font-bold">
            <span>Oro perdido por el asalto:</span>
            <span>-{goldLost} Oro</span>
          </div>

          <div className="flex items-center gap-2 text-amber-300 bg-amber-950/40 p-2 sm:p-2.5 rounded-xl border border-amber-500/30 text-[10px] sm:text-[11px] text-left gold-glow">
            <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-amber-400" />
            <span>
              <strong>¡Objetivo de Venganza!</strong> Si regresas y derrotas a este enemigo, obtendrás bonificación de botín y EXP.
            </span>
          </div>
        </div>

        {/* Respawn Button */}
        <button
          id="btn-respawn"
          onClick={onRespawn}
          className="w-full py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 active:scale-95 text-white font-bold font-medieval text-xs sm:text-sm shadow-xl health-glow transition flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Reaparecer en Villa Ullathorpe
        </button>
      </div>
    </Modal>
  );
};
