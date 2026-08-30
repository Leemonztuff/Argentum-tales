import React, { useState, useEffect } from 'react';
import { RotateCcw, X, Smartphone } from 'lucide-react';

interface OrientationPromptProps {
  onDismiss?: () => void;
}

export const OrientationPrompt: React.FC<OrientationPromptProps> = ({ onDismiss }) => {
  const [isPortraitMobile, setIsPortraitMobile] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    const checkOrientation = () => {
      const isMobile = window.innerWidth <= 850 || /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
      const isPortrait = window.innerHeight > window.innerWidth;
      setIsPortraitMobile(isMobile && isPortrait);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!isPortraitMobile || dismissed) {
    return null;
  }

  const handleClose = () => {
    setDismissed(true);
    if (onDismiss) onDismiss();
  };

  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-md pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="hud-blur border border-amber-500/40 rounded-2xl p-3 shadow-2xl shadow-black/80 flex items-center justify-between gap-3 gold-glow">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-300 animate-pulse shrink-0">
            <Smartphone className="w-5 h-5 rotate-90" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold font-medieval text-amber-200 flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-amber-400 animate-spin" /> Modo Horizontal Recomendado
            </span>
            <span className="text-[11px] text-slate-300 leading-tight">
              Gira tu pantalla para un campo de visión panorámico y agite táctil óptimo.
            </span>
          </div>
        </div>

        <button
          onClick={handleClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition shrink-0"
          title="Entendido / Cerrar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
