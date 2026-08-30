import React, { useState, useEffect } from 'react';
import { Spell } from '../types/game';
import { SPELLS } from '../data/spells';
import { Settings2, X, Plus, BookOpen, Wand2, ShieldAlert } from 'lucide-react';

interface VerticalSkillBarProps {
  equippedSpells: (string | null)[];
  knownSpells: string[];
  playerMp: number;
  lastSpellTimestamps: Record<string, number>;
  onCastSpell: (spell: Spell) => void;
  onUpdateEquippedSpells: (newEquipped: (string | null)[]) => void;
  onOpenSpellbook?: () => void;
}

export const VerticalSkillBar: React.FC<VerticalSkillBarProps> = ({
  equippedSpells,
  knownSpells,
  playerMp,
  lastSpellTimestamps,
  onCastSpell,
  onUpdateEquippedSpells,
  onOpenSpellbook,
}) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [selectedSlotForEdit, setSelectedSlotForEdit] = useState<number | null>(null);
  const [activeCastSlot, setActiveCastSlot] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  // 50ms interval loop to drive smooth cooldown timers
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 50);
    return () => clearInterval(timer);
  }, []);

  // Ensure 4 slots
  const slots = [0, 1, 2, 3].map((idx) => equippedSpells[idx] || null);

  const handleSlotClick = (slotIdx: number, spellId: string | null) => {
    if (isConfigOpen) {
      setSelectedSlotForEdit(slotIdx);
      return;
    }

    if (!spellId) {
      setIsConfigOpen(true);
      setSelectedSlotForEdit(slotIdx);
      return;
    }

    const spell = SPELLS[spellId];
    if (!spell) return;

    // Check cooldown
    const lastCast = lastSpellTimestamps[spell.id] || 0;
    const cooldownMs = (spell.cooldownSec || 1.0) * 1000;
    const elapsed = now - lastCast;

    if (elapsed < cooldownMs) {
      return; // On cooldown
    }

    if (playerMp < spell.manaCost) {
      return; // Out of MP
    }

    // Trigger activation feedback
    setActiveCastSlot(slotIdx);
    setTimeout(() => setActiveCastSlot(null), 350);

    onCastSpell(spell);
  };

  const handleAssignSpellToSlot = (slotIdx: number, spellId: string | null) => {
    const newEquipped = [...slots];
    newEquipped[slotIdx] = spellId;
    onUpdateEquippedSpells(newEquipped);
    setSelectedSlotForEdit(null);
  };

  return (
    <div className="relative pointer-events-auto flex flex-col items-end gap-1.5 select-none max-w-full">
      {/* Header Bar: WoW / Ragnarok Style Dock Label & Config Toggle */}
      <div className="flex items-center gap-1.5 bg-[#080d1a]/90 backdrop-blur-md border border-amber-500/30 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-xl shadow-lg">
        <span className="text-[9px] sm:text-[10px] font-bold font-medieval text-amber-300 tracking-wider flex items-center gap-1">
          <Wand2 className="w-3 h-3 text-sky-400" />
          HOTBAR
        </span>
        <button
          onClick={() => {
            setIsConfigOpen(!isConfigOpen);
            setSelectedSlotForEdit(null);
          }}
          className={`p-1 rounded-lg transition ${
            isConfigOpen
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/10'
          }`}
          title="Personalizar Orden de Hechizos"
        >
          <Settings2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </button>
      </div>

      {/* Vertical 4-Slot Action Dock */}
      <div className="flex flex-col gap-1.5 p-1 sm:p-1.5 bg-[#050811]/90 backdrop-blur-xl border border-sky-500/30 rounded-2xl shadow-2xl gold-glow">
        {slots.map((spellId, slotIdx) => {
          const spell = spellId ? SPELLS[spellId] : null;
          const keyLabel = slotIdx + 1;

          // Cooldown math
          let cooldownPercent = 0;
          let cooldownRemainingSec = 0;
          let isOnCooldown = false;

          if (spell) {
            const lastCast = lastSpellTimestamps[spell.id] || 0;
            const cooldownMs = (spell.cooldownSec || 1.0) * 1000;
            const elapsed = now - lastCast;
            if (elapsed < cooldownMs) {
              isOnCooldown = true;
              cooldownRemainingSec = Math.ceil((cooldownMs - elapsed) / 100) / 10;
              cooldownPercent = Math.max(0, Math.min(100, ((cooldownMs - elapsed) / cooldownMs) * 100));
            }
          }

          const hasEnoughMp = spell ? playerMp >= spell.manaCost : true;
          const isCastActive = activeCastSlot === slotIdx;

          return (
            <div key={slotIdx} className="relative group">
              <button
                id={`hotbar-slot-${slotIdx + 1}`}
                onClick={() => handleSlotClick(slotIdx, spellId)}
                className={`relative w-11 h-11 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl border flex flex-col items-center justify-center transition overflow-hidden shadow-xl active:scale-95 ${
                  isCastActive
                    ? 'scale-110 border-amber-300 bg-amber-500/30 shadow-amber-500/60 shadow-2xl ring-2 ring-amber-400'
                    : spell
                    ? hasEnoughMp && !isOnCooldown
                      ? 'bg-gradient-to-br from-slate-900 via-slate-950 to-sky-950/70 border-sky-400/50 hover:border-sky-300 hover:bg-sky-900/40 mana-glow'
                      : !hasEnoughMp
                      ? 'bg-slate-950/90 border-red-500/40 opacity-75'
                      : 'bg-slate-950/90 border-slate-700 opacity-90'
                    : 'bg-slate-950/60 border-dashed border-white/20 hover:border-amber-400/50 hover:bg-white/5'
                }`}
              >
                {/* Hotkey Indicator Badge [1..4] */}
                <span className="absolute top-0.5 left-0.5 sm:left-1 text-[8px] sm:text-[9px] font-bold font-pixel text-slate-300 bg-slate-950/90 px-0.5 sm:px-1 py-0.2 rounded border border-white/10 z-20">
                  {keyLabel}
                </span>

                {spell ? (
                  <>
                    {/* Spell Icon */}
                    <span
                      className={`text-xl sm:text-2xl transition-transform ${
                        isCastActive ? 'scale-125 animate-bounce' : 'group-hover:scale-110'
                      }`}
                    >
                      {spell.icon}
                    </span>

                    {/* MP Cost Pill */}
                    <span
                      className={`absolute bottom-0.5 right-0.5 text-[7px] sm:text-[8px] font-bold font-pixel px-0.5 sm:px-1 py-0.2 rounded border z-20 ${
                        hasEnoughMp
                          ? 'bg-sky-950/90 text-sky-300 border-sky-500/40'
                          : 'bg-red-950/90 text-red-400 border-red-500/40'
                      }`}
                    >
                      {spell.manaCost}MP
                    </span>

                    {/* Cooldown Dark Sweep Overlay */}
                    {isOnCooldown && (
                      <div
                        className="absolute inset-0 bg-slate-950/85 backdrop-blur-[1px] flex flex-col items-center justify-center z-10 transition-all duration-75"
                        style={{
                          clipPath: `inset(0 0 0 0)`,
                        }}
                      >
                        <div
                          className="absolute inset-0 bg-sky-950/80 border-t-2 border-t-sky-400 transition-all duration-75"
                          style={{ height: `${cooldownPercent}%` }}
                        />
                        <span className="relative z-20 text-[10px] sm:text-[11px] font-bold font-pixel text-amber-300 drop-shadow-md">
                          {cooldownRemainingSec.toFixed(1)}s
                        </span>
                      </div>
                    )}

                    {/* Out of Mana Minimal Tint Overlay */}
                    {!hasEnoughMp && !isOnCooldown && (
                      <div className="absolute inset-0 bg-red-950/20 pointer-events-none z-10" />
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-500 hover:text-amber-400 transition">
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-[7px] sm:text-[8px] font-pixel text-slate-400 mt-0.5">Vacío</span>
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Popover Customizer / Reorder Drawer */}
      {isConfigOpen && (
        <div className="absolute right-0 top-10 z-50 w-72 sm:w-80 max-w-[calc(100vw-1.5rem)] hud-panel border border-amber-500/40 bg-[#060a12]/95 backdrop-blur-2xl rounded-2xl p-3.5 shadow-2xl flex flex-col gap-3 border-r-2 border-r-amber-400 animate-in fade-in zoom-in-95 gold-glow">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold font-medieval text-slate-100">
                {selectedSlotForEdit !== null
                  ? `Asignar Hechizo a Slot [${selectedSlotForEdit + 1}]`
                  : 'Organizar Barra de Habilidades'}
              </span>
            </div>
            <button
              onClick={() => {
                setIsConfigOpen(false);
                setSelectedSlotForEdit(null);
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Current Slots Quick View */}
          <div className="grid grid-cols-4 gap-1.5 p-2 bg-slate-950/80 rounded-xl border border-white/10">
            {slots.map((sId, sIdx) => {
              const sp = sId ? SPELLS[sId] : null;
              const isSelected = selectedSlotForEdit === sIdx;

              return (
                <button
                  key={sIdx}
                  onClick={() => setSelectedSlotForEdit(sIdx)}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-xl border transition ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-2 ring-amber-400'
                      : sp
                      ? 'bg-slate-900 border-sky-500/30 text-slate-200'
                      : 'bg-slate-950 border-white/10 text-slate-500'
                  }`}
                >
                  <span className="text-[9px] font-pixel text-slate-400">Slot {sIdx + 1}</span>
                  <span className="text-lg drop-shadow">{sp ? sp.icon : '➕'}</span>
                  <span className="text-[8px] truncate max-w-[50px] font-bold">
                    {sp ? sp.name : 'Vacío'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Unlocked Spells Picker */}
          <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
            <span className="text-[10px] font-bold font-pixel text-slate-400 uppercase tracking-wider">
              {selectedSlotForEdit !== null
                ? `Elige un hechizo para el Slot ${selectedSlotForEdit + 1}:`
                : 'Toca un slot arriba y elige su hechizo:'}
            </span>

            {/* Clear slot option */}
            {selectedSlotForEdit !== null && slots[selectedSlotForEdit] !== null && (
              <button
                onClick={() => handleAssignSpellToSlot(selectedSlotForEdit, null)}
                className="flex items-center justify-between p-2 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 text-red-300 text-xs font-bold transition"
              >
                <span>🚫 Desequipar / Dejar Slot Vacío</span>
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {knownSpells.map((spellId) => {
              const spell = SPELLS[spellId];
              if (!spell) return null;

              const isEquippedInSlot = slots.indexOf(spellId);

              return (
                <button
                  key={spellId}
                  onClick={() => {
                    const targetSlot = selectedSlotForEdit !== null ? selectedSlotForEdit : 0;
                    handleAssignSpellToSlot(targetSlot, spellId);
                  }}
                  className={`flex items-center justify-between p-2 rounded-xl border transition text-left ${
                    isEquippedInSlot !== -1
                      ? 'bg-sky-950/40 border-sky-500/50 text-sky-200'
                      : 'bg-slate-900/80 hover:bg-slate-800 border-white/10 text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{spell.icon}</span>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">{spell.name}</span>
                      <span className="text-[9px] text-amber-300 font-pixel">
                        {spell.type === 'heal' ? `💚 +${spell.minDamage}-${spell.maxDamage} HP` : `⚔️ ${spell.minDamage}-${spell.maxDamage} Daño`}
                      </span>
                    </div>
                  </div>

                  {isEquippedInSlot !== -1 ? (
                    <span className="text-[9px] font-bold font-pixel px-2 py-0.5 rounded bg-sky-900 text-sky-300 border border-sky-400/40">
                      En Slot {isEquippedInSlot + 1}
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold font-pixel px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40">
                      Equipar ➔
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Full Spellbook Button */}
          {onOpenSpellbook && (
            <button
              onClick={() => {
                setIsConfigOpen(false);
                onOpenSpellbook();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-gradient-to-r from-amber-700 to-yellow-700 hover:from-amber-600 hover:to-yellow-600 text-white font-bold text-xs shadow-md transition"
            >
              <BookOpen className="w-4 h-4" />
              <span>Abrir Libro de Hechizos Completo [K]</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
