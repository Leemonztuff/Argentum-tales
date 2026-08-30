import React, { useState, useEffect } from 'react';
import { PlayerCharacter, CharacterClass } from '../types/game';
import { SpriteAvatar } from './SpriteAvatar';
import { CLASS_SPRITES } from '../data/spritesheets';
import { Play, Trash2, Plus, Shield, Sparkles, User, MapPin, Coins } from 'lucide-react';

interface TitleScreenProps {
  slots: (PlayerCharacter | null)[];
  onSelectSlot: (index: number) => void;
  onCreateCharacter: (index: number) => void;
  onDeleteSlot: (index: number) => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  slots,
  onSelectSlot,
  onCreateCharacter,
  onDeleteSlot,
}) => {
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);
  const [animFrame, setAnimFrame] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setAnimFrame((prev) => (prev + 1) % 4);
    }, 300);
    return () => clearInterval(timer);
  }, []);

  const totalCharacters = slots.filter((s) => s !== null).length;

  const colPos = animFrame === 0 ? '0%' : animFrame === 1 ? '33.333333%' : animFrame === 2 ? '66.666666%' : '100%';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#060810] bg-radial from-slate-900 via-[#060810] to-black overflow-y-auto select-none">
      <div className="relative w-full max-w-4xl hud-panel border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col p-4 sm:p-8 my-auto gold-glow">
        
        {/* Decorative background ambient glow */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Title */}
        <div className="text-center mb-6 sm:mb-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] sm:text-xs font-pixel uppercase tracking-widest mb-2">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>Sistema Clásico de Rol en Tiempo Real</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black font-medieval text-slate-100 tracking-wide drop-shadow-md">
            Argentum Agite: Crónicas de Arandor
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Selecciona tu héroe (hasta 3 personajes) o crea uno nuevo para comenzar la aventura.
          </p>
        </div>

        {/* 3 Character Slots Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 relative z-10">
          {slots.map((char, index) => {
            const isDeleting = deleteConfirmIndex === index;

            return (
              <div
                key={index}
                className={`relative rounded-2xl border-2 transition flex flex-col justify-between p-4 sm:p-5 hud-blur ${
                  char
                    ? 'border-amber-500/40 bg-slate-900/90 shadow-xl hover:border-amber-400 group'
                    : 'border-dashed border-white/20 bg-slate-950/40 hover:border-amber-500/40'
                }`}
              >
                {/* Slot header badge */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                  <span className="text-[11px] font-pixel text-amber-400 uppercase tracking-widest">
                    Ranura de Héroe #{index + 1}
                  </span>
                  {char && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-pixel">
                      Nv. {char.level}
                    </span>
                  )}
                </div>

                {char ? (
                  /* Occupied Slot - Two Columns: Sprite & Info */
                  <div className="grid grid-cols-[108px_1fr] gap-4 py-2 items-center">
                    {/* Column 1: Full-body Sprite Preview (Walking South, No Box) */}
                    <div className="flex flex-col items-center justify-center my-auto">
                      <div
                        className="w-24 h-32 bg-no-repeat bg-center pixel-art"
                        style={{
                          backgroundImage: `url("${CLASS_SPRITES[char.classType]}")`,
                          backgroundSize: '400% 400%',
                          backgroundPosition: `${colPos} 0%`, // row 0 = facing down (south walk)
                          imageRendering: 'pixelated',
                        }}
                      />
                    </div>

                    {/* Column 2: Information & Actions */}
                    <div className="flex flex-col justify-between overflow-hidden gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-slate-100 font-medieval truncate">
                          {char.name}
                        </h3>
                        <span className="text-[11px] text-amber-300/90 font-medium capitalize block truncate">
                          {char.jobTitle || char.classType}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5 truncate">
                          <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="truncate">{char.currentMapId}</span>
                        </div>
                      </div>

                      {/* Minimal Stats Info */}
                      <div className="grid grid-cols-2 gap-1.5 bg-slate-950/60 p-2 rounded-lg border border-white/5 text-[11px]">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-400 font-pixel">VIDA</span>
                          <span className="font-bold text-emerald-400 font-pixel text-xs">
                            {char.currentHp}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-400 font-pixel">ORO</span>
                          <span className="font-bold text-amber-400 font-pixel text-xs flex items-center gap-0.5">
                            <Coins className="w-2.5 h-2.5" /> {char.gold}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons (Span across columns) */}
                    <div className="col-span-2 mt-2">
                      {isDeleting ? (
                        <div className="flex flex-col gap-2 p-2 rounded-xl bg-red-950/40 border border-red-500/50">
                          <span className="text-[11px] text-red-300 text-center font-bold">
                            ¿Estás seguro de borrar a {char.name}?
                          </span>
                          <div className="flex gap-2">
                            <button
                              id={`btn-confirm-delete-${index}`}
                              onClick={() => {
                                onDeleteSlot(index);
                                setDeleteConfirmIndex(null);
                              }}
                              className="flex-1 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition"
                            >
                              Sí, Borrar
                            </button>
                            <button
                              id={`btn-cancel-delete-${index}`}
                              onClick={() => setDeleteConfirmIndex(null)}
                              className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            id={`btn-play-slot-${index}`}
                            onClick={() => onSelectSlot(index)}
                            className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold font-medieval text-xs flex items-center justify-center gap-1.5 shadow-lg transition transform active:scale-95"
                          >
                            <Play className="w-3.5 h-3.5 fill-slate-950" />
                            <span>Jugar</span>
                          </button>
                          <button
                            id={`btn-delete-slot-${index}`}
                            onClick={() => setDeleteConfirmIndex(index)}
                            title="Borrar Personaje"
                            className="p-2 rounded-xl bg-slate-950/80 hover:bg-red-950/60 text-slate-400 hover:text-red-400 border border-white/10 hover:border-red-500/40 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Empty Slot */
                  <div className="flex flex-col items-center justify-center py-8 gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center text-slate-600 group-hover:text-amber-400 group-hover:border-amber-500/30 transition">
                      <User className="w-7 h-7" />
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-bold text-slate-400 block font-medieval">
                        Ranura Vacía
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Crea un nuevo personaje
                      </span>
                    </div>
                    <button
                      id={`btn-create-slot-${index}`}
                      onClick={() => onCreateCharacter(index)}
                      className="mt-2 py-2 px-4 rounded-xl bg-slate-900 hover:bg-amber-500/10 text-amber-400 hover:text-amber-300 border border-amber-500/30 hover:border-amber-400 font-pixel text-xs flex items-center gap-1.5 transition shadow"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Crear Personaje</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="text-center pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2 relative z-10">
          <span>Personajes creados: {totalCharacters} / 3 máx.</span>
          <span className="font-pixel">Argentum Agite v2.5 — Todos los derechos reservados</span>
        </div>

      </div>
    </div>
  );
};

