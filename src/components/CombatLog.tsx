import React, { useState } from 'react';
import { CombatLogEntry } from '../types/game';
import { ChevronUp, ChevronDown, Terminal, Sparkles } from 'lucide-react';

interface CombatLogProps {
  logs: CombatLogEntry[];
}

export const CombatLog: React.FC<CombatLogProps> = ({ logs }) => {
  const [expanded, setExpanded] = useState(false);

  const latestLog = logs[logs.length - 1];

  const getLogColor = (type?: CombatLogEntry['type']) => {
    switch (type) {
      case 'player_hit': return 'text-amber-300';
      case 'player_miss': return 'text-slate-400';
      case 'mob_hit': return 'text-rose-400 font-bold';
      case 'block': return 'text-sky-300 font-bold';
      case 'stab': return 'text-purple-300 font-bold';
      case 'spell': return 'text-cyan-300 font-medium';
      case 'loot': return 'text-yellow-400 font-bold';
      case 'system': return 'text-emerald-400 font-bold';
      default: return 'text-slate-200';
    }
  };

  const getLogIcon = (type?: CombatLogEntry['type']) => {
    switch (type) {
      case 'player_hit': return '⚔️';
      case 'mob_hit': return '💥';
      case 'block': return '🛡️';
      case 'spell': return '✨';
      case 'loot': return '🪙';
      case 'system': return '🌟';
      default: return '📜';
    }
  };

  return (
    <div className="absolute bottom-28 sm:bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-auto max-w-[72vw] sm:max-w-md w-full transition-all flex flex-col items-center">
      {/* Expanded History Popup */}
      {expanded && (
        <div className="w-full mb-1.5 p-2 bg-slate-950/95 hud-blur border border-amber-500/30 rounded-xl shadow-2xl flex flex-col gap-1 max-h-28 overflow-y-auto font-pixel text-[10px] sm:text-xs">
          {logs.length === 0 ? (
            <span className="text-slate-500 text-center py-1">Sin eventos de combate aún...</span>
          ) : (
            logs.slice(-6).map((log) => (
              <div key={log.id} className={`flex items-start gap-1.5 ${getLogColor(log.type)}`}>
                <span className="opacity-40 select-none shrink-0">[{log.timestamp}]</span>
                <span className="break-words">{log.text}</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Main Bottom Zócalo Ticker Bar */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="w-full bg-slate-950/90 hud-blur border border-amber-500/30 hover:border-amber-400/60 rounded-full px-3 py-1 sm:py-1.5 shadow-2xl shadow-black/80 cursor-pointer flex items-center justify-between gap-2 select-none transition"
      >
        <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
          <span className="text-xs shrink-0">{getLogIcon(latestLog?.type)}</span>
          <span className={`font-pixel text-[10px] sm:text-xs truncate tracking-wide ${getLogColor(latestLog?.type)}`}>
            {latestLog ? latestLog.text : 'Explorando las tierras de Aethelgard...'}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0 text-slate-400 hover:text-amber-300">
          <span className="text-[9px] font-pixel text-slate-500 hidden sm:inline">Historial</span>
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </div>
      </div>
    </div>
  );
};

