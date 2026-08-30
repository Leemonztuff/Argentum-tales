import React from 'react';
import { Sparkles, Trophy, Star, ShieldAlert, Award } from 'lucide-react';

export interface ToastMessage {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  type?: 'level' | 'quest' | 'loot' | 'skill' | 'info';
}

interface ToastNotificationProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <aside aria-label="Notificaciones" className="fixed top-14 sm:top-16 right-3 sm:right-5 z-40 flex flex-col gap-2 pointer-events-none max-w-[90vw] sm:max-w-sm w-full">
      {toasts.map((toast) => {
        let borderClass = 'border-amber-500/50';
        let bgClass = 'hud-panel gold-glow';
        let iconElem = <Sparkles className="w-5 h-5 text-amber-400" />;

        if (toast.type === 'level') {
          borderClass = 'border-yellow-400/80';
          bgClass = 'hud-panel gold-glow bg-amber-950/80';
          iconElem = <Trophy className="w-5 h-5 text-yellow-400 animate-bounce" />;
        } else if (toast.type === 'quest') {
          borderClass = 'border-emerald-500/80';
          bgClass = 'hud-panel bg-emerald-950/80';
          iconElem = <Award className="w-5 h-5 text-emerald-400" />;
        } else if (toast.type === 'skill') {
          borderClass = 'border-sky-500/80';
          bgClass = 'hud-panel mana-glow bg-sky-950/80';
          iconElem = <Star className="w-5 h-5 text-sky-400" />;
        } else if (toast.type === 'loot') {
          borderClass = 'border-amber-500/60';
          bgClass = 'hud-panel gold-glow';
        }

        return (
          <div
            key={toast.id}
            onClick={() => onDismiss(toast.id)}
            className={`pointer-events-auto p-3 rounded-2xl border ${borderClass} ${bgClass} shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-right duration-200 cursor-pointer hover:opacity-90 transition`}
          >
            <div className="p-2 bg-black/40 rounded-xl border border-white/10 shrink-0">
              {toast.icon ? <span className="text-xl">{toast.icon}</span> : iconElem}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-bold text-xs sm:text-sm text-slate-100 font-medieval truncate">
                {toast.title}
              </span>
              {toast.subtitle && (
                <span className="text-[10px] sm:text-xs text-slate-300 font-pixel truncate">
                  {toast.subtitle}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </aside>
  );
};
