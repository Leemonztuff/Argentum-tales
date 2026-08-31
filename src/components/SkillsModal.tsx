import React, { useState } from 'react';
import { PlayerCharacter, SkillName, Spell } from '../types/game';
import { SPELLS } from '../data/spells';
import { useUIStore } from '../ui';
import { X, Sparkles, Shield, Swords, Eye, Zap, Crosshair, Flame, BookOpen, Lock, CheckCircle2, Wand2, Settings2 } from 'lucide-react';

interface SkillsModalProps {
  player: PlayerCharacter;
  onClose?: () => void;
  onCastSpell?: (spell: Spell) => void;
  onUpdateEquippedSpells?: (newEquipped: (string | null)[]) => void;
}

export const SkillsModal: React.FC<SkillsModalProps> = ({
  player,
  onClose,
  onCastSpell,
  onUpdateEquippedSpells,
}) => {
  const [activeTab, setActiveTab] = useState<'spells' | 'skills'>('spells');
  const isOpen = useUIStore((s) => s.openModals.skills);
  const handleClose = onClose ?? (() => useUIStore.getState().closeModal('skills'));

  if (!isOpen) return null;

  const getSkillIcon = (skillKey: SkillName) => {
    switch (skillKey) {
      case 'tacticas_combate': return <Shield className="w-5 h-5 text-amber-400" />;
      case 'combate_armas': return <Swords className="w-5 h-5 text-red-400" />;
      case 'combate_distancia': return <Crosshair className="w-5 h-5 text-emerald-400" />;
      case 'combate_sin_armas': return <Zap className="w-5 h-5 text-yellow-400" />;
      case 'defensa_escudos': return <Shield className="w-5 h-5 text-blue-400" />;
      case 'apunalar': return <Eye className="w-5 h-5 text-purple-400" />;
      case 'evasion': return <Sparkles className="w-5 h-5 text-teal-400" />;
      case 'magia': return <Flame className="w-5 h-5 text-sky-400" />;
    }
  };

  const getSpellElementBadge = (animation: Spell['animation']) => {
    switch (animation) {
      case 'fire':
        return <span className="bg-orange-500/20 text-orange-400 border border-orange-500/40 px-2 py-0.5 rounded-full text-[9px] font-bold">🔥 Fuego</span>;
      case 'holy':
        return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full text-[9px] font-bold">💚 Sagrado</span>;
      case 'lightning':
        return <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 px-2 py-0.5 rounded-full text-[9px] font-bold">⚡ Rayo</span>;
      case 'dark':
        return <span className="bg-purple-500/20 text-purple-400 border border-purple-500/40 px-2 py-0.5 rounded-full text-[9px] font-bold">☄️ Oscuro</span>;
      default:
        return <span className="bg-sky-500/20 text-sky-400 border border-sky-500/40 px-2 py-0.5 rounded-full text-[9px] font-bold">✨ Arcano</span>;
    }
  };

  const skillsList = Object.entries(player.skills) as [SkillName, typeof player.skills[SkillName]][];
  const allSpells = Object.values(SPELLS);

  const equipped = [0, 1, 2, 3].map((idx) => player.equippedSpells?.[idx] || null);

  const handleEquipSpellToSlot = (spellId: string, slotIdx: number) => {
    if (!onUpdateEquippedSpells) return;
    const nextEquipped = [...equipped];

    // If already equipped in another slot, remove it from that slot
    const existingIdx = nextEquipped.indexOf(spellId);
    if (existingIdx !== -1) {
      nextEquipped[existingIdx] = null;
    }

    nextEquipped[slotIdx] = spellId;
    onUpdateEquippedSpells(nextEquipped);
  };

  const handleUnequipSlot = (slotIdx: number) => {
    if (!onUpdateEquippedSpells) return;
    const nextEquipped = [...equipped];
    nextEquipped[slotIdx] = null;
    onUpdateEquippedSpells(nextEquipped);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 bg-[#08080c]/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[94vh] sm:max-h-[85vh] hud-panel border border-amber-500/30 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto gold-glow">
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 sm:px-5 sm:py-3.5 border-b border-white/10 hud-blur">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-900 border border-amber-500/40 rounded-xl">
              <Wand2 className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-medieval text-slate-100">Libro de Hechizos y Maestría</h2>
              <p className="text-[10px] sm:text-xs text-slate-400">
                Maná Actual: <span className="text-sky-300 font-bold font-pixel">{player.currentMp} / {player.maxMp} MP</span>
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector Bar */}
        <div className="flex border-b border-white/10 bg-slate-950/80 p-1 gap-1">
          <button
            onClick={() => setActiveTab('spells')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'spells'
                ? 'bg-gradient-to-r from-sky-900/80 to-indigo-900/80 text-sky-200 border border-sky-400/50 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <BookOpen className="w-4 h-4 text-sky-400" />
            <span>Libro de Hechizos ({player.knownSpells.length}/{allSpells.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'skills'
                ? 'bg-gradient-to-r from-amber-900/80 to-yellow-900/80 text-amber-200 border border-amber-400/50 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Maestría de Habilidades</span>
          </button>
        </div>

        {/* Tab 1: Spells Catalog */}
        {activeTab === 'spells' && (
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 flex flex-col gap-4">
            {/* Active Hotbar Configuration Dock (4 Slots) */}
            <div className="p-3 bg-slate-950/90 border border-sky-500/40 rounded-2xl flex flex-col gap-2.5 shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold font-medieval text-slate-100">
                    🎯 Barra de Habilidades Activas (4 Slots)
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-pixel">
                  Asigna o reordena tus hechizos de combate
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {equipped.map((spellId, slotIdx) => {
                  const sp = spellId ? SPELLS[spellId] : null;

                  return (
                    <div
                      key={slotIdx}
                      className="relative flex flex-col items-center p-2 rounded-xl bg-slate-900 border border-white/10 text-center shadow-md group"
                    >
                      <span className="text-[9px] font-bold font-pixel text-amber-400 absolute top-1 left-1.5">
                        [{slotIdx + 1}]
                      </span>

                      {sp ? (
                        <>
                          <button
                            onClick={() => handleUnequipSlot(slotIdx)}
                            className="absolute top-1 right-1 p-0.5 rounded-full bg-slate-950 text-slate-400 hover:text-red-400 transition"
                            title="Quitar Hechizo"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <span className="text-2xl mt-2 drop-shadow">{sp.icon}</span>
                          <span className="text-[10px] font-bold text-slate-100 truncate w-full mt-1">
                            {sp.name}
                          </span>
                          <span className="text-[8px] text-sky-300 font-pixel">{sp.manaCost} MP</span>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-3 text-slate-600">
                          <span className="text-xs font-pixel">Vacío</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Catalog List */}
            <div className="flex flex-col gap-3">
              {allSpells.map((spell) => {
                const isUnlocked = player.knownSpells.includes(spell.id);
                const hasEnoughMp = player.currentMp >= spell.manaCost;
                const equippedInSlot = equipped.indexOf(spell.id);

                return (
                  <div
                    key={spell.id}
                    className={`hud-blur border rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition ${
                      isUnlocked
                        ? 'border-sky-500/30 hover:border-sky-400/60 bg-slate-900/60 shadow-lg'
                        : 'border-white/5 bg-slate-950/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="relative shrink-0 p-3 bg-slate-950/90 border border-sky-400/30 rounded-2xl flex items-center justify-center shadow-inner">
                        <span className="text-2xl sm:text-3xl drop-shadow">{spell.icon}</span>
                        {isUnlocked ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 absolute -top-1 -right-1 bg-slate-950 rounded-full" />
                        ) : (
                          <Lock className="w-4 h-4 text-slate-500 absolute -top-1 -right-1 bg-slate-950 rounded-full" />
                        )}
                      </div>

                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-xs sm:text-sm font-bold text-slate-100 tracking-wide">{spell.name}</h3>
                          {getSpellElementBadge(spell.animation)}
                          {equippedInSlot !== -1 && (
                            <span className="bg-sky-500/20 text-sky-300 border border-sky-500/40 px-2 py-0.5 rounded-full text-[9px] font-pixel font-bold">
                              🎯 Equipado en Slot [{equippedInSlot + 1}]
                            </span>
                          )}
                        </div>

                        <p className="text-[10px] sm:text-xs text-slate-300 leading-tight">{spell.description}</p>

                        <div className="flex items-center gap-3 mt-1 text-[10px] font-pixel text-slate-400 flex-wrap">
                          <span className="text-sky-300 font-bold">💧 {spell.manaCost} MP</span>
                          <span>⏳ Cooldown: {spell.cooldownSec || 1.0}s</span>
                          <span>🎯 Alcance: {spell.range > 0 ? `${spell.range} casillas` : 'En uno mismo'}</span>
                          <span className="text-amber-300">
                            {spell.type === 'heal' ? `💚 +${spell.minDamage}-${spell.maxDamage} HP` : `⚔️ ${spell.minDamage}-${spell.maxDamage} Daño`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions / Equip Bar */}
                    <div className="w-full sm:w-auto flex flex-col sm:flex-row items-end sm:items-center justify-end shrink-0 gap-2 border-t sm:border-t-0 border-white/10 pt-2 sm:pt-0">
                      {isUnlocked ? (
                        <div className="flex flex-col items-end gap-1.5 w-full sm:w-auto">
                          {/* Slot Equip Quick Selector */}
                          {onUpdateEquippedSpells && (
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] font-pixel text-slate-400 mr-1">Equipar en:</span>
                              {[0, 1, 2, 3].map((slotIdx) => {
                                const isCurrentSlot = equippedInSlot === slotIdx;
                                return (
                                  <button
                                    key={slotIdx}
                                    onClick={() => handleEquipSpellToSlot(spell.id, slotIdx)}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-pixel font-bold border transition ${
                                      isCurrentSlot
                                        ? 'bg-amber-500 text-slate-950 border-amber-300 shadow'
                                        : 'bg-slate-950 text-slate-300 border-white/10 hover:border-amber-400 hover:text-amber-300'
                                    }`}
                                  >
                                    [{slotIdx + 1}]
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {onCastSpell && (
                            <button
                              onClick={() => {
                                if (hasEnoughMp) {
                                   onCastSpell(spell);
                                   handleClose();
                                }
                              }}
                              disabled={!hasEnoughMp}
                              className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-md ${
                                hasEnoughMp
                                  ? 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white active:scale-95 mana-glow'
                                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                              }`}
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>{hasEnoughMp ? 'Lanzar' : 'Sin MP'}</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] font-pixel text-amber-400/90 bg-amber-950/40 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                          Requiere Magia Nv. {spell.minSkillLevel}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Skills Grid */}
        {activeTab === 'skills' && (
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5">
            {skillsList.map(([key, skill]) => (
              <div
                key={key}
                className="hud-blur border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col gap-2 sm:gap-2.5 shadow-inner hover:border-amber-500/30 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className="p-1.5 sm:p-2 bg-slate-900/90 border border-white/10 rounded-xl">
                      {getSkillIcon(key)}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-100">{skill.name}</h3>
                      <span className="text-[9px] sm:text-[10px] text-slate-400">{skill.description}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs sm:text-sm font-bold font-pixel text-amber-400">Nv. {skill.level}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="flex flex-col gap-1 mt-0.5 sm:mt-1">
                  <div className="flex justify-between text-[9px] sm:text-[10px] text-slate-400 font-pixel">
                    <span>Progreso de Maestría</span>
                    <span>{skill.progress} / 100 XP</span>
                  </div>
                  <div className="w-full bg-[#08080c] rounded-full h-1.5 sm:h-2 overflow-hidden border border-white/5 shadow-inner">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full transition-all duration-300 gold-glow"
                      style={{ width: `${skill.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
