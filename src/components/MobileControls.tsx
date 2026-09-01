import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Swords, Eye, Hand, ShieldAlert, BookOpen, Footprints, Crosshair, Zap } from 'lucide-react';
import { Spell } from '../types/game';
import { SPELLS } from '../data/spells';
import { VerticalSkillBar } from './VerticalSkillBar';

interface MobileControlsProps {
  onMove: (dx: number, dy: number) => void;
  onAttack: () => void;
  onDash: () => void;
  onCastSpell: (spell: Spell) => void;
  onUsePotion: (type: 'hp' | 'mp') => void;
  onToggleStealth: () => void;
  onInteract: () => void;
  interactLabel: string | null;
  attackCooldownPercent: number; // 0 (ready) to 1 (full cooldown)
  dashCooldownPercent: number; // 0 (ready) to 1 (full cooldown)
  isStealthed: boolean;
  canStealth: boolean;
  knownSpells: string[];
  equippedSpells?: (string | null)[];
  lastSpellTimestamps?: Record<string, number>;
  onUpdateEquippedSpells?: (newEquipped: (string | null)[]) => void;
  playerMp?: number;
  hpPotionCount: number;
  mpPotionCount: number;
  isAlignedWithTarget: boolean;
  onCycleTarget?: () => void;
  onToggleInventory?: () => void;
  onToggleSkills?: () => void;
  onToggleQuests?: () => void;
  onToggleHelp?: () => void;
  onToggleSettings?: () => void;
  onCloseModals?: () => void;
  isAutoAligning?: boolean;
  rendererRef?: React.RefObject<any>;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onMove,
  onAttack,
  onDash,
  onCastSpell,
  onUsePotion,
  onToggleStealth,
  onInteract,
  interactLabel,
  attackCooldownPercent,
  dashCooldownPercent,
  isStealthed,
  canStealth,
  knownSpells,
  equippedSpells = [knownSpells[0] || null, knownSpells[1] || null, knownSpells[2] || null, knownSpells[3] || null],
  lastSpellTimestamps = {},
  onUpdateEquippedSpells = () => {},
  playerMp = 100,
  hpPotionCount,
  mpPotionCount,
  isAlignedWithTarget,
  onCycleTarget,
  onToggleInventory,
  onToggleSkills,
  onToggleQuests,
  onToggleHelp,
  onToggleSettings,
  onCloseModals,
  isAutoAligning = false,
  rendererRef,
}) => {
  // Joystick & Movement Cadence State
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const joystickTouchIdRef = useRef<number | null>(null);
  const activeMoveDirRef = useRef<{ dx: number; dy: number } | null>(null);
  const [perfectFlash, setPerfectFlash] = useState(false);

  const handleAttackClick = () => {
    // Check if within the optimal agite timing window (last 20% of the cooldown)
    if (attackCooldownPercent > 0 && attackCooldownPercent <= 0.20) {
      setPerfectFlash(true);
      setTimeout(() => setPerfectFlash(false), 400);
    }
    onAttack();
  };

  // Handle Joystick Touch Events
  const handleJoystickStart = (e: React.TouchEvent) => {
    if (joystickTouchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    joystickTouchIdRef.current = touch.identifier;
    setJoystickActive(true);
    updateJoystick(touch.clientX, touch.clientY);
  };

  const updateJoystick = useCallback(
    (clientX: number, clientY: number) => {
      if (!joystickBaseRef.current) return;
      const rect = joystickBaseRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = clientX - centerX;
      const deltaY = clientY - centerY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const maxRadius = rect.width / 2;

      let clampedX = deltaX;
      let clampedY = deltaY;

      if (distance > maxRadius) {
        clampedX = (deltaX / distance) * maxRadius;
        clampedY = (deltaY / distance) * maxRadius;
      }

      setJoystickPos({ x: clampedX, y: clampedY });

      if (distance > 5) {
        const normDist = Math.min(1.0, distance / maxRadius);
        const deadzone = rendererRef?.current?.joystickDeadzone ?? 0.15;

        if (normDist > deadzone) {
          const scale = (normDist - deadzone) / (1.0 - deadzone);
          const dx = (deltaX / distance) * scale;
          const dy = (deltaY / distance) * scale;
          rendererRef?.current?.setJoystickInput(dx, dy);
        } else {
          rendererRef?.current?.setJoystickInput(0, 0);
        }
      } else {
        rendererRef?.current?.setJoystickInput(0, 0);
      }
    },
    [rendererRef]
  );

  const handleJoystickMove = useCallback(
    (e: TouchEvent) => {
      if (joystickTouchIdRef.current === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === joystickTouchIdRef.current) {
          updateJoystick(touch.clientX, touch.clientY);
          break;
        }
      }
    },
    [updateJoystick]
  );

  const handleJoystickEnd = useCallback((e: TouchEvent) => {
    if (joystickTouchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joystickTouchIdRef.current) {
        joystickTouchIdRef.current = null;
        setJoystickActive(false);
        setJoystickPos({ x: 0, y: 0 });
        activeMoveDirRef.current = null;
        rendererRef?.current?.setJoystickInput(0, 0);
        break;
      }
    }
  }, [rendererRef]);

  useEffect(() => {
    window.addEventListener('touchmove', handleJoystickMove, { passive: false });
    window.addEventListener('touchend', handleJoystickEnd);
    window.addEventListener('touchcancel', handleJoystickEnd);
    return () => {
      window.removeEventListener('touchmove', handleJoystickMove);
      window.removeEventListener('touchend', handleJoystickEnd);
      window.removeEventListener('touchcancel', handleJoystickEnd);
    };
  }, [handleJoystickMove, handleJoystickEnd]);

  // Keyboard Shortcuts (Desktop & Mobile Keyboard support)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) return;

      if (['Space', 'KeyF'].includes(e.code)) {
        e.preventDefault();
        onAttack();
      } else if (['KeyE'].includes(e.code) && interactLabel) {
        e.preventDefault();
        onInteract();
      } else if (['KeyX'].includes(e.code)) {
        e.preventDefault();
        onDash();
      } else if (['KeyQ'].includes(e.code)) {
        e.preventDefault();
        onUsePotion('hp');
      } else if (['KeyR'].includes(e.code)) {
        e.preventDefault();
        onUsePotion('mp');
      } else if (e.code === 'Tab') {
        e.preventDefault();
        if (onCycleTarget) onCycleTarget();
      } else if (['KeyI'].includes(e.code)) {
        if (onToggleInventory) onToggleInventory();
      } else if (['KeyK'].includes(e.code)) {
        if (onToggleSkills) onToggleSkills();
      } else if (['KeyL'].includes(e.code)) {
        if (onToggleQuests) onToggleQuests();
      } else if (['KeyH'].includes(e.code) || e.key === '?') {
        if (onToggleHelp) onToggleHelp();
      } else if (['KeyO'].includes(e.code)) {
        if (onToggleSettings) onToggleSettings();
      } else if (e.code === 'Escape') {
        if (onCloseModals) onCloseModals();
      } else if (['Digit1', 'Digit2', 'Digit3', 'Digit4'].includes(e.code)) {
        const slotIdx = parseInt(e.code.replace('Digit', ''), 10) - 1;
        const spellId = equippedSpells[slotIdx] || knownSpells[slotIdx];
        if (spellId && SPELLS[spellId]) {
          onCastSpell(SPELLS[spellId]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    onAttack,
    onDash,
    onInteract,
    interactLabel,
    onUsePotion,
    onCastSpell,
    knownSpells,
    equippedSpells,
    onCycleTarget,
    onToggleInventory,
    onToggleSkills,
    onToggleQuests,
    onToggleHelp,
    onCloseModals,
  ]);

  return (
    <div className="fixed inset-0 pointer-events-none z-30 flex flex-col justify-between p-1.5 sm:p-4 max-w-full overflow-hidden box-border select-none">
      {/* Auto-alignment feedback banner */}
      {isAutoAligning && (
        <div className="absolute top-28 sm:top-32 left-1/2 -translate-x-1/2 z-50 pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0a0805]/95 border border-amber-500/60 text-amber-200 shadow-2xl animate-pulse font-pixel text-[9px] sm:text-xs">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
          <Footprints className="w-3.5 h-3.5 text-amber-400 animate-bounce shrink-0" />
          <span className="tracking-wide">AUTO-ALINEANDO AL RANGO DE COMBATE...</span>
          <button
            onClick={() => onMove(0, 0)}
            className="ml-1 px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-[8px] sm:text-[9px] font-bold transition active:scale-90 shadow"
          >
            DETENER
          </button>
        </div>
      )}

      {/* Upper Contextual Banner */}
      <div className="w-full flex justify-center items-start pt-1 sm:pt-2">
        {interactLabel && (
          <button
            id="btn-contextual-interact"
            onClick={onInteract}
            className="pointer-events-auto flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-bold text-xs sm:text-sm border-2 border-amber-300 shadow-2xl animate-bounce-subtle active:scale-95 transition gold-glow max-w-[90vw] truncate"
          >
            <Hand className="w-4 h-4 text-amber-200 shrink-0" />
            <span className="truncate">{interactLabel}</span>
            <span className="text-[10px] font-pixel text-amber-200 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-400/30 shrink-0">
              [E]
            </span>
          </button>
        )}
      </div>

      {/* Main Controls Section (Bottom Area) */}
      <div className="w-full flex items-end justify-between gap-2 sm:gap-4 pb-0.5 sm:pb-2 max-w-full overflow-hidden">
        {/* Left Side: Virtual Analog Joystick */}
        <div className="pointer-events-auto flex flex-col items-center shrink-0">
          <div
            ref={joystickBaseRef}
            onTouchStart={handleJoystickStart}
            className={`relative w-28 h-28 sm:w-34 sm:h-34 rounded-full border-2 hud-blur flex items-center justify-center transition shadow-2xl ${
              joystickActive
                ? 'border-amber-400/80 bg-slate-900/80 shadow-amber-500/20 shadow-2xl'
                : 'border-white/10 bg-slate-950/60'
            }`}
          >
            {/* Center Axis Grid Crosshair */}
            <div className="absolute w-full h-[1px] bg-white/5" />
            <div className="absolute h-full w-[1px] bg-white/5" />

            {/* Directional Arrow Hints */}
            <span className="absolute top-1.5 text-[9px] sm:text-[10px] font-pixel text-slate-500 font-bold">W</span>
            <span className="absolute bottom-1.5 text-[9px] sm:text-[10px] font-pixel text-slate-500 font-bold">S</span>
            <span className="absolute left-1.5 text-[9px] sm:text-[10px] font-pixel text-slate-500 font-bold">A</span>
            <span className="absolute right-1.5 text-[9px] sm:text-[10px] font-pixel text-slate-500 font-bold">D</span>

            {/* Moveable Stick Thumb Knob */}
            <div
              className={`w-12 h-12 sm:w-15 sm:h-15 rounded-full border-2 shadow-xl flex items-center justify-center transition-transform ${
                joystickActive
                  ? 'bg-gradient-to-br from-amber-500 to-yellow-600 border-amber-200 text-slate-950 scale-105 shadow-amber-500/50'
                  : 'bg-slate-800/90 border-slate-600 text-slate-400'
              }`}
              style={{
                transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
              }}
            >
              <div className="w-3.5 h-3.5 rounded-full border border-slate-950/30 bg-slate-950/20" />
            </div>
          </div>
          <span className="text-[9px] sm:text-[10px] text-slate-400 font-pixel mt-1 drop-shadow tracking-wider">WASD / Joystick</span>
        </div>

        {/* Right Side: Vertical Skill Bar + Potions + Main Attack Button */}
        <div className="pointer-events-auto flex flex-col items-end gap-1.5 max-w-[65vw] sm:max-w-none shrink-0">
          {/* Vertical Skill Hotbar (WoW / Ragnarok M Style 4-Slot Bar) */}
          <VerticalSkillBar
            equippedSpells={equippedSpells}
            knownSpells={knownSpells}
            playerMp={playerMp}
            lastSpellTimestamps={lastSpellTimestamps}
            onCastSpell={onCastSpell}
            onUpdateEquippedSpells={onUpdateEquippedSpells}
            onOpenSpellbook={onToggleSkills}
          />

          {/* Quick Potions & Main Tactical Arc Control Pad */}
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 select-none shrink-0 mt-1">
            {/* Main Action / Attack Button - Bottom-Right Anchor */}
            <div className="absolute bottom-0 right-0 z-30">
              {/* Target Alignment indicator glow */}
              {isAlignedWithTarget && !perfectFlash && attackCooldownPercent === 0 && (
                <div className="absolute -inset-2 rounded-full bg-amber-500/35 blur-lg animate-pulse pointer-events-none" />
              )}

              {/* Perfect agite timing flash ring */}
              {perfectFlash && (
                <div className="absolute -inset-4 rounded-full bg-cyan-400/80 animate-ping pointer-events-none z-40" />
              )}

              {/* Agite timing optimal window preview ring */}
              {attackCooldownPercent > 0 && attackCooldownPercent <= 0.20 && (
                <div className="absolute -inset-1.5 rounded-full border-2 border-cyan-400/60 animate-pulse pointer-events-none z-20" />
              )}

              <button
                id="btn-attack-main"
                onClick={handleAttackClick}
                className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 shadow-2xl active:scale-95 flex flex-col items-center justify-center overflow-hidden transition-all duration-300 ${
                  isAutoAligning
                    ? 'bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-700 border-yellow-300 text-slate-900 shadow-yellow-500/50'
                    : perfectFlash
                    ? 'bg-gradient-to-br from-cyan-400 via-teal-400 to-emerald-400 border-white text-slate-950 scale-105 shadow-[0_0_25px_rgba(34,211,238,1)] z-30'
                    : attackCooldownPercent === 0
                    ? isAlignedWithTarget
                      ? 'bg-gradient-to-br from-amber-600 via-rose-600 to-amber-700 border-amber-300 text-white shadow-amber-500/70 animate-pulse-glow'
                      : 'bg-gradient-to-br from-red-600 via-rose-600 to-red-800 border-rose-400 text-white health-glow'
                    : attackCooldownPercent <= 0.20
                    ? 'bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 border-cyan-400 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.7)]'
                    : 'bg-[#1a0505] border-red-600/95 text-red-500/90 shadow-[0_0_15px_rgba(239,68,68,0.45)] font-bold'
                }`}
              >
                {/* Radial Cooldown Overlay */}
                {attackCooldownPercent > 0 && !perfectFlash && (
                  <div
                    className={`absolute inset-0 pointer-events-none z-10 ${
                      attackCooldownPercent <= 0.20 ? 'bg-cyan-950/70' : 'bg-[#150202]/85'
                    }`}
                    style={{
                      clipPath: `polygon(50% 50%, 50% 0%, ${
                        attackCooldownPercent >= 0.25 ? '100% 0%, ' : ''
                      }${attackCooldownPercent >= 0.5 ? '100% 100%, ' : ''}${
                        attackCooldownPercent >= 0.75 ? '0% 100%, ' : ''
                      }${
                        attackCooldownPercent < 0.25
                           ? `${50 + 50 * Math.tan(attackCooldownPercent * 2 * Math.PI)}% 0%`
                           : attackCooldownPercent < 0.5
                           ? `100% ${50 + 50 * Math.tan((attackCooldownPercent - 0.25) * 2 * Math.PI)}%`
                           : attackCooldownPercent < 0.75
                           ? `${50 - 50 * Math.tan((attackCooldownPercent - 0.5) * 2 * Math.PI)}% 100%`
                           : `0% ${50 - 50 * Math.tan((attackCooldownPercent - 0.75) * 2 * Math.PI)}%`
                      })`,
                    }}
                  />
                )}

                {isAutoAligning ? (
                  <div className="animate-spin text-yellow-300 mb-0.5">
                    <Footprints className="w-7 h-7 sm:w-8 sm:h-8" />
                  </div>
                ) : (
                  <Swords className={`w-7 h-7 sm:w-8 sm:h-8 relative z-10 drop-shadow ${perfectFlash ? 'text-slate-950 animate-bounce' : ''}`} />
                )}
                <span className="text-[9px] sm:text-[10px] font-bold font-pixel relative z-10 tracking-wider mt-0.5">
                  {isAutoAligning
                    ? 'CAMINANDO'
                    : perfectFlash
                    ? '¡AGITE!'
                    : attackCooldownPercent > 0
                    ? attackCooldownPercent <= 0.20
                      ? '¡YAA!'
                      : 'ESPERA'
                    : 'ATACAR'}
                </span>
              </button>
            </div>

            {/* Quick HP Potion - Located directly left of Attack */}
            <button
              id="btn-quick-hp"
              onClick={() => onUsePotion('hp')}
              className="absolute bottom-1 right-22 sm:right-26 min-w-11 min-h-11 p-2 sm:p-2.5 rounded-full hud-blur border border-red-500/40 active:scale-90 text-red-400 shadow-xl hover:bg-red-950/40 transition flex items-center justify-center health-glow z-20 shrink-0"
              title="Poción de Vida (Tecla Q)"
            >
              <span className="text-base sm:text-xl">🧪</span>
              <span className="absolute -bottom-1 -right-1 bg-red-600 text-white text-[8px] sm:text-[9px] font-bold font-pixel px-1.5 py-0.2 rounded-full border border-red-300 shadow">
                {hpPotionCount}
              </span>
            </button>

            {/* Dash Ability Button */}
            <button
              id="btn-dash"
              onClick={onDash}
              className="absolute bottom-1 right-34 sm:right-38 min-w-12 min-h-12 p-2.5 sm:p-3 rounded-full hud-blur border border-cyan-500/60 active:scale-90 text-cyan-300 shadow-xl hover:bg-cyan-950/40 transition flex items-center justify-center z-20 shrink-0 overflow-hidden"
              title="Dash / Esquive (Tecla X)"
            >
              {dashCooldownPercent > 0 && (
                <div
                  className="absolute inset-0 bg-slate-950/80 pointer-events-none z-10"
                  style={{
                    clipPath: `polygon(50% 50%, 50% 0%, ${
                      dashCooldownPercent >= 0.25 ? '100% 0%, ' : ''
                    }${dashCooldownPercent >= 0.5 ? '100% 100%, ' : ''}${
                      dashCooldownPercent >= 0.75 ? '0% 100%, ' : ''
                    }${
                      dashCooldownPercent < 0.25
                        ? `${50 + 50 * Math.tan(dashCooldownPercent * 2 * Math.PI)}% 0%`
                        : dashCooldownPercent < 0.5
                        ? `100% ${50 + 50 * Math.tan((dashCooldownPercent - 0.25) * 2 * Math.PI)}%`
                        : dashCooldownPercent < 0.75
                        ? `${50 - 50 * Math.tan((dashCooldownPercent - 0.5) * 2 * Math.PI)}% 100%`
                        : `0% ${50 - 50 * Math.tan((dashCooldownPercent - 0.75) * 2 * Math.PI)}%`
                    })`,
                  }}
                />
              )}
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 relative z-10 text-cyan-300" />
            </button>

            {/* Quick MP Potion - Located diagonally left-down of HP / bottom-left of Attack */}
            <button
              id="btn-quick-mp"
              onClick={() => onUsePotion('mp')}
              className="absolute bottom-16 sm:bottom-20 right-16 sm:right-20 min-w-11 min-h-11 p-2 sm:p-2.5 rounded-full hud-blur border border-sky-500/40 active:scale-90 text-sky-400 shadow-xl hover:bg-sky-950/40 transition flex items-center justify-center mana-glow z-20 shrink-0"
              title="Poción de Maná (Tecla R)"
            >
              <span className="text-base sm:text-xl">🧪</span>
              <span className="absolute -bottom-1 -right-1 bg-sky-600 text-white text-[8px] sm:text-[9px] font-bold font-pixel px-1.5 py-0.2 rounded-full border border-sky-300 shadow">
                {mpPotionCount}
              </span>
            </button>

            {/* Cycle Target - Located directly above Attack */}
            {onCycleTarget && (
              <button
                id="btn-cycle-target"
                onClick={onCycleTarget}
                className="absolute bottom-22 sm:bottom-26 right-1 sm:right-2 min-w-11 min-h-11 p-2 sm:p-2.5 rounded-full hud-blur border border-amber-500/40 text-amber-300 active:scale-90 hover:bg-amber-950/40 transition flex items-center justify-center gold-glow z-20 shadow-xl shrink-0"
                title="Cambiar Objetivo (Tecla Tab)"
              >
                <Crosshair className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
              </button>
            )}

            {/* Stealth Button (For Rogue / Active) - Located left of HP */}
            {canStealth && (
              <button
                id="btn-stealth"
                onClick={onToggleStealth}
                className={`absolute bottom-1 sm:bottom-1.5 right-34 sm:right-40 min-w-11 min-h-11 p-2 sm:p-2.5 rounded-full border shadow-xl active:scale-90 transition shrink-0 z-20 ${
                  isStealthed
                    ? 'bg-purple-600/90 border-purple-300 text-white animate-pulse shadow-purple-500/50'
                    : 'hud-blur border-white/10 text-purple-400 hover:bg-slate-800/80'
                }`}
                title="Modo Sigilo"
              >
                <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}

            {/* Open Full Spellbook Modal Button - Located left-up of HP / MP */}
            {onToggleSkills && (
              <button
                id="btn-open-skills"
                onClick={onToggleSkills}
                className={`absolute ${
                  canStealth ? 'bottom-12 sm:bottom-15 right-26 sm:right-32' : 'absolute bottom-1 sm:bottom-1.5 right-34 sm:right-40'
                } min-w-11 min-h-11 p-2 sm:p-2.5 rounded-full hud-blur border border-amber-500/40 text-amber-300 active:scale-90 hover:bg-amber-950/40 transition flex items-center justify-center gold-glow shrink-0 z-20 shadow-xl`}
                title="Abrir Hechizos [K]"
              >
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
