import React from 'react';
import { PlayerCharacter, GameMap } from '../types/game';
import { Backpack, Sparkles, BookOpen, Volume2, VolumeX, Shield, Swords, Flame, Footprints, HelpCircle, Database, Sliders, Magnet } from 'lucide-react';
import { SpriteAvatar } from './SpriteAvatar';
import { CLASS_SPRITES, SPRITESHEETS } from '../data/spritesheets';

interface HUDProps {
  player: PlayerCharacter;
  currentMap: GameMap;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenInventory: () => void;
  onOpenSkills: () => void;
  onOpenQuests: () => void;
  onOpenHelp: () => void;
  onOpenDataStudio?: () => void;
  onOpenSettings?: () => void;
  autoPickupEnabled?: boolean;
  onUsePotion?: (type: 'hp' | 'mp') => void;
  hpPotionCount?: number;
  mpPotionCount?: number;
  isAutoAligning?: boolean;
  critEffect?: { type: 'deal' | 'receive'; key: number } | null;
  timeProgress?: number;
  isNight?: boolean;
  comboCount?: number;
  comboTargetName?: string | null;
  comboTimeLeftPercent?: number;
}

export const HUD: React.FC<HUDProps> = ({
  player,
  currentMap,
  isMuted,
  onToggleMute,
  onOpenInventory,
  onOpenSkills,
  onOpenQuests,
  onOpenHelp,
  onOpenDataStudio,
  onOpenSettings,
  autoPickupEnabled = true,
  onUsePotion,
  hpPotionCount = 0,
  mpPotionCount = 0,
  isAutoAligning = false,
  critEffect = null,
  timeProgress = 0.35,
  isNight = false,
  comboCount = 0,
  comboTargetName = null,
  comboTimeLeftPercent = 100,
}) => {
  const hpPercent = Math.max(0, Math.min(100, (player.currentHp / player.maxHp) * 100));
  const mpPercent = Math.max(0, Math.min(100, (player.currentMp / player.maxMp) * 100));
  const expPercent = Math.max(0, Math.min(100, (player.exp / player.expToNextLevel) * 100));

  const totalMinutes = timeProgress * 24 * 60;
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = Math.floor(totalMinutes % 60);
  const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  const timeIcon = isNight ? '🌙' : (hours >= 6 && hours < 18 ? '☀️' : '🌅');

  const critAnimClass = critEffect
    ? critEffect.type === 'deal'
      ? 'animate-hud-crit-deal'
      : 'animate-hud-crit-receive'
    : '';

  const getClassIcon = () => {
    switch (player.classType) {
      case 'novicio':
        return <Shield className="w-4 h-4 text-yellow-400" />;
      case 'guerrero':
        return <Shield className="w-4 h-4 text-amber-400" />;
      case 'cazador':
        return <Footprints className="w-4 h-4 text-emerald-400" />;
      case 'mago':
        return <Flame className="w-4 h-4 text-sky-400" />;
      case 'picaro':
        return <Swords className="w-4 h-4 text-purple-400" />;
    }
  };

  const getClassName = () => {
    if (player.jobTitle) return player.jobTitle;
    switch (player.classType) {
      case 'novicio': return 'Novicio';
      case 'guerrero': return 'Guerrero';
      case 'cazador': return 'Cazador';
      case 'mago': return 'Mago';
      case 'picaro': return 'Pícaro';
    }
  };

  return (
    <header className={`absolute top-0 left-0 right-0 p-1.5 sm:p-3 pointer-events-none z-30 flex flex-col gap-1 sm:gap-2 max-w-full overflow-hidden ${critAnimClass}`}>
      {/* Top row */}
      <div className="flex items-center justify-between w-full gap-1 sm:gap-2">
        {/* Player Status Card */}
        <div key={critEffect?.key ? `status-${critEffect.key}` : 'status-default'} className={`pointer-events-auto flex items-center gap-1.5 sm:gap-2.5 hud-blur rounded-2xl p-1.5 sm:p-2.5 shadow-2xl shadow-black/80 shrink-0 ${critAnimClass}`}>
          <div className="relative shrink-0">
            <SpriteAvatar
              spriteUrl={player.classType === 'novicio' ? SPRITESHEETS.novice_custom : CLASS_SPRITES[player.classType]}
              facing={player.facing}
              size={44}
              cropMode={player.classType === 'novicio' ? 'bust' : 'none'}
              className={player.classType === 'novicio' ? 'rounded-full border-2 border-amber-500/50 overflow-hidden' : ''}
            />
            <span className="absolute -bottom-1 -right-1 text-[7px] sm:text-[8px] font-bold text-amber-300 font-pixel bg-slate-950/90 border border-amber-500/40 px-1 rounded shadow">
              Nv.{player.level}
            </span>
          </div>

          <div className="flex flex-col gap-0.5 w-24 sm:w-44 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] sm:text-xs font-bold text-slate-100 truncate tracking-wide">{player.name}</span>
              {isAutoAligning ? (
                <span className="text-[7px] sm:text-[8px] bg-amber-500/20 text-amber-300 font-pixel font-bold px-1 py-0.5 rounded border border-amber-500/40 animate-pulse tracking-wide flex items-center gap-0.5 shrink-0">
                  <span className="w-1 h-1 rounded-full bg-amber-400 animate-ping" />
                  ALINEANDO
                </span>
              ) : (
                <span className="text-[9px] text-amber-400 font-medium capitalize hidden sm:inline">{getClassName()}</span>
              )}
            </div>

            {/* HP Bar */}
            <div className="w-full bg-[#08080c]/90 rounded-full h-2.5 sm:h-3 border border-red-900/60 overflow-hidden relative shadow-inner">
              <div
                className="bg-gradient-to-r from-red-600 via-rose-500 to-red-500 h-full transition-all duration-150 health-glow"
                style={{ width: `${hpPercent}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[8px] sm:text-[9px] font-bold text-white font-pixel leading-none drop-shadow">
                {player.currentHp}/{player.maxHp}
              </span>
            </div>

            {/* MP Bar */}
            <div className="w-full bg-[#08080c]/90 rounded-full h-2 sm:h-2.5 border border-sky-900/60 overflow-hidden relative shadow-inner">
              <div
                className="bg-gradient-to-r from-sky-600 via-cyan-500 to-blue-500 h-full transition-all duration-150 mana-glow"
                style={{ width: `${mpPercent}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[7px] sm:text-[8px] font-bold text-sky-100 font-pixel leading-none drop-shadow">
                {player.currentMp}/{player.maxMp}
              </span>
            </div>
          </div>
        </div>

        {/* Location, Quick Potions & Nav Bar */}
        <div className="pointer-events-auto flex items-center justify-end gap-1 sm:gap-2 flex-wrap min-w-0">
          {/* Quick Potions Bar on Desktop */}
          {onUsePotion && (
            <div className="hidden lg:flex items-center gap-1.5 hud-blur rounded-2xl p-1 shadow-2xl">
              <button
                id="btn-hud-quick-hp"
                onClick={() => onUsePotion('hp')}
                title="Tomar Poción de Vida (Tecla Q)"
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 active:scale-95 border border-red-500/40 text-red-300 transition health-glow"
              >
                <span className="text-xs">🧪</span>
                <span className="text-[10px] font-bold font-pixel">{hpPotionCount}</span>
                <span className="text-[8px] bg-red-950 text-red-400 px-1 rounded border border-red-500/30">[Q]</span>
              </button>
              <button
                id="btn-hud-quick-mp"
                onClick={() => onUsePotion('mp')}
                title="Tomar Poción de Maná (Tecla R)"
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-sky-950/40 hover:bg-sky-900/60 active:scale-95 border border-sky-500/40 text-sky-300 transition mana-glow"
              >
                <span className="text-xs">🧪</span>
                <span className="text-[10px] font-bold font-pixel">{mpPotionCount}</span>
                <span className="text-[8px] bg-sky-950 text-sky-400 px-1 rounded border border-sky-500/30">[R]</span>
              </button>
            </div>
          )}

          <div className="hidden md:flex flex-col items-end hud-blur rounded-2xl px-3 py-1.5 shadow-2xl shadow-black/80">
            <span className="text-xs font-bold text-amber-300 font-medieval">{currentMap.name}</span>
            <span className="text-[10px] text-slate-400">{currentMap.subtitle}</span>
          </div>

          <div className="flex items-center gap-1.5 hud-blur border-slate-700/40 rounded-xl px-2 py-1 shadow-2xl shrink-0" title={`Hora del Día: ${timeString} (${isNight ? 'Noche' : 'Día'})`}>
            <span className="text-xs sm:text-sm">{timeIcon}</span>
            <span className="text-[10px] sm:text-xs font-bold text-slate-200 font-pixel tracking-wider">{timeString}</span>
          </div>

          <div className="flex items-center gap-1 hud-blur border-amber-500/30 rounded-xl px-2 py-1 shadow-2xl gold-glow shrink-0">
            <span className="text-xs sm:text-sm">🪙</span>
            <span className="text-[11px] sm:text-xs font-bold text-amber-400 font-pixel tracking-wider">{player.gold}</span>
          </div>

          {/* Nav Quick Buttons */}
          <div className="flex items-center gap-0.5 sm:gap-1.5 hud-blur rounded-xl p-0.5 sm:p-1 shadow-2xl shrink-0">
            <button
              id="btn-hud-inventory"
              onClick={onOpenInventory}
              title="Inventario y Equipo [I]"
              className="w-11 h-11 flex items-center justify-center rounded-lg bg-slate-900/80 hover:bg-slate-800 active:scale-95 text-slate-200 hover:text-amber-300 border border-white/5 hover:border-amber-400/40 transition"
            >
              <Backpack className="w-5 h-5" />
            </button>
            <button
              id="btn-hud-skills"
              onClick={onOpenSkills}
              title="Habilidades y Maestría [K]"
              className="w-11 h-11 flex items-center justify-center rounded-lg bg-slate-900/80 hover:bg-slate-800 active:scale-95 text-slate-200 hover:text-sky-300 border border-white/5 hover:border-sky-400/40 transition"
            >
              <Sparkles className="w-5 h-5" />
            </button>
            <button
              id="btn-hud-quests"
              onClick={onOpenQuests}
              title="Misiones del Reino [L]"
              className="w-11 h-11 flex items-center justify-center rounded-lg bg-slate-900/80 hover:bg-slate-800 active:scale-95 text-slate-200 hover:text-emerald-300 border border-white/5 hover:border-emerald-400/40 transition"
            >
              <BookOpen className="w-5 h-5" />
            </button>
            <button
              id="btn-hud-help"
              onClick={onOpenHelp}
              title="Guía y Controles [H / ?]"
              className="w-11 h-11 flex items-center justify-center rounded-lg bg-slate-900/80 hover:bg-slate-800 active:scale-95 text-slate-200 hover:text-amber-300 border border-white/5 hover:border-amber-400/40 transition"
            >
              <HelpCircle className="w-5 h-5 text-amber-400" />
            </button>
            {onOpenDataStudio && (
              <button
                id="btn-hud-datastudio"
                onClick={onOpenDataStudio}
                title="Data Studio & Content Registry [Data-Driven]"
                className="w-11 h-11 flex items-center justify-center rounded-lg bg-slate-900/80 hover:bg-slate-800 active:scale-95 text-slate-200 hover:text-amber-300 border border-amber-500/30 hover:border-amber-400/60 transition"
              >
                <Database className="w-5 h-5 text-amber-400" />
              </button>
            )}
            {onOpenSettings && (
              <button
                id="btn-hud-settings"
                onClick={onOpenSettings}
                title={`Ajustes de Juego [O] ${autoPickupEnabled ? '(Recogido Automático Activo)' : ''}`}
                className={`relative p-1 sm:p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 active:scale-95 text-slate-200 hover:text-amber-300 border transition ${
                  autoPickupEnabled 
                    ? 'border-amber-500/40 hover:border-amber-400' 
                    : 'border-white/5 hover:border-white/20'
                }`}
              >
                <Sliders className="w-5 h-5 text-amber-400" />
                {autoPickupEnabled && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                  </span>
                )}
              </button>
            )}
            <button
              id="btn-hud-mute"
              onClick={onToggleMute}
              title="Sonido [M]"
              className="w-11 h-11 flex items-center justify-center rounded-lg bg-slate-900/80 hover:bg-slate-800 active:scale-95 text-slate-200 hover:text-slate-100 border border-white/5 transition"
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* Combo Counter HUD Widget */}
      {comboCount >= 2 && (
        <div className="self-center pointer-events-auto flex flex-col items-center justify-center gap-1 bg-[#08080c]/95 border border-amber-500/40 px-5 py-2.5 rounded-2xl shadow-2xl shadow-black/90 animate-in fade-in zoom-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">⚔️</span>
            <span className="text-[9px] sm:text-[10px] text-slate-300 font-pixel uppercase tracking-widest">COMBO DE ATAQUES</span>
            <span className="text-xs">⚔️</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl sm:text-4xl font-black font-pixel text-amber-400 tracking-wide select-none filter drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">
              {comboCount}
            </span>
            <span className="text-xs sm:text-sm font-black font-pixel text-amber-500 tracking-wider">
              X
            </span>
          </div>
          {comboTargetName && (
            <span className="text-[10px] sm:text-xs text-slate-400 font-pixel text-center truncate max-w-[160px]">
              vs {comboTargetName}
            </span>
          )}
          {/* Smooth visual countdown timer */}
          <div className="w-28 bg-slate-950 rounded-full h-1.5 border border-amber-500/10 overflow-hidden mt-1 relative">
            <div
              className="bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 h-full transition-all duration-75 ease-linear"
              style={{ width: `${comboTimeLeftPercent}%` }}
            />
          </div>
          <span className="text-[9px] text-amber-400/90 font-bold font-pixel tracking-wider mt-0.5">
            +{Math.min(50, (comboCount - 1) * 5)}% EXP BONUS
          </span>
        </div>
      )}

      {/* EXP Progress Bar */}
      <div className="w-full bg-[#08080c]/80 backdrop-blur border border-white/5 rounded-full h-1.5 overflow-hidden shadow-inner">
        <div
          className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 h-full transition-all duration-200 gold-glow"
          style={{ width: `${expPercent}%` }}
        />
      </div>
    </header>
  );
};

