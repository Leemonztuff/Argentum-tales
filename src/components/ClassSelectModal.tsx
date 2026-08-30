import React, { useState } from 'react';
import { CharacterClass } from '../types/game';
import { Shield, Footprints, Flame, Swords, Play, Sparkles } from 'lucide-react';
import { SpriteAvatar } from './SpriteAvatar';
import { CLASS_SPRITES } from '../data/spritesheets';

interface ClassSelectModalProps {
  onStartGame: (name: string, classType: CharacterClass) => void;
}

export const ClassSelectModal: React.FC<ClassSelectModalProps> = ({ onStartGame }) => {
  const [name, setName] = useState('Valerius');
  const [selectedClass, setSelectedClass] = useState<CharacterClass>('novicio');

  const classesConfig: Array<{
    id: CharacterClass;
    name: string;
    icon: string;
    subtitle: string;
    description: string;
    agite: string;
    punteria: string;
    hp: number;
    mp: number;
    badgeColor: string;
  }> = [
    {
      id: 'novicio',
      name: 'Novicio (Recomendado)',
      icon: '🛡️🎒',
      subtitle: 'Aventurero Principiante — Campo de Novicios',
      description: 'Empieza en el Campo de Entrenamiento. Aprende alineación, agite y combate básico antes de elegir Job en la Villa.',
      agite: '1.0x (Aprendizaje)',
      punteria: '1.0 Cuerpo a Cuerpo',
      hp: 100,
      mp: 30,
      badgeColor: 'border-yellow-400 text-yellow-300 font-bold',
    },
    {
      id: 'guerrero',
      name: 'Guerrero',
      icon: '🛡️⚔️',
      subtitle: 'Maestro del Acero y la Resistencia',
      description: 'Gran armadura pesada, altos puntos de vida y sólida probabilidad de bloqueo con escudos.',
      agite: '1.0x (Balanceado)',
      punteria: '1.0 Melee',
      hp: 140,
      mp: 20,
      badgeColor: 'border-amber-500 text-amber-300',
    },
    {
      id: 'cazador',
      name: 'Cazador',
      icon: '🏹🧝',
      subtitle: 'Tirador y Rastreador Silvestre',
      description: 'Ataques a distancia con arco y flechas, alta evasión y agilidad para eludir el peligro.',
      agite: '1.1x (Rango)',
      punteria: '1.0 Rango',
      hp: 115,
      mp: 35,
      badgeColor: 'border-emerald-500 text-emerald-300',
    },
    {
      id: 'mago',
      name: 'Mago',
      icon: '🧙‍♂️✨',
      subtitle: 'Canalizador de las Artes Arcanas',
      description: 'Hechizos elementales destructivos que nunca fallan por evasión física y curación mágica.',
      agite: '1.25x (Poder Mágico)',
      punteria: 'Poder de Hechizos',
      hp: 85,
      mp: 120,
      badgeColor: 'border-sky-500 text-sky-300',
    },
    {
      id: 'picaro',
      name: 'Pícaro',
      icon: '🗡️🥷',
      subtitle: 'Asesino de las Sombras',
      description: 'El agite más veloz del juego (0.85x), crítico devastador de apuñalar y habilidad de sigilo.',
      agite: '0.85x (Ultra Rápido)',
      punteria: '0.9 + Crítico Apuñalar',
      hp: 105,
      mp: 30,
      badgeColor: 'border-purple-500 text-purple-300',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#08080c]/90 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl max-h-[94vh] sm:max-h-[90vh] hud-panel border border-amber-500/30 rounded-2xl sm:rounded-3xl shadow-2xl overflow-y-auto flex flex-col p-4 sm:p-7 my-auto gold-glow">
        {/* Title & Banner */}
        <div className="text-center mb-3 sm:mb-5">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-amber-400 font-pixel">
            RPG 2D con Render 3D • Agite en Tiempo Real
          </span>
          <h1 className="text-xl sm:text-3xl font-black font-medieval text-slate-100 mt-0.5 sm:mt-1">
            Argentum Agite: Crónicas de Arandor
          </h1>
          <p className="text-[11px] sm:text-sm text-slate-400 mt-0.5">
            Crea tu personaje y adéntrate en mazmorras, fortalezas y costas conectadas.
          </p>
        </div>

        {/* Name Input */}
        <div className="mb-3 sm:mb-5 flex flex-col gap-1">
          <label className="text-[11px] sm:text-xs font-bold text-slate-300 uppercase tracking-wider">Nombre del Héroe</label>
          <input
            id="input-hero-name"
            type="text"
            value={name}
            maxLength={18}
            onChange={(e) => setName(e.target.value)}
            placeholder="Escribe el nombre de tu aventurero..."
            className="w-full hud-blur border border-white/10 focus:border-amber-400 rounded-xl px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-100 outline-none transition"
          />
        </div>

        {/* Class Selection Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
          {classesConfig.map((cls) => {
            const isSelected = selectedClass === cls.id;
            return (
              <div
                key={cls.id}
                onClick={() => setSelectedClass(cls.id)}
                className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between gap-1.5 sm:gap-2 hud-blur ${
                  isSelected
                    ? 'border-amber-400 bg-amber-950/40 shadow-xl amber-glow'
                    : 'border-white/10 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SpriteAvatar
                      spriteUrl={CLASS_SPRITES[cls.id]}
                      fallbackEmoji={cls.icon}
                      size={36}
                    />
                    <h3 className="text-xs sm:text-sm font-bold text-slate-100">{cls.name}</h3>
                  </div>
                  <span className={`text-[9px] sm:text-[10px] font-bold font-pixel px-2 py-0.5 rounded-full border ${cls.badgeColor}`}>
                    {cls.agite}
                  </span>
                </div>

                <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">{cls.description}</p>

                <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-pixel text-slate-400 border-t border-white/10 pt-1.5 sm:pt-2">
                  <span>❤️ {cls.hp} HP</span>
                  <span>💧 {cls.mp} MP</span>
                  <span className="text-amber-300">{cls.punteria}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Start Game Button */}
        <button
          id="btn-start-game"
          onClick={() => onStartGame(name, selectedClass)}
          className="w-full py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-500 hover:from-amber-500 hover:to-yellow-400 active:scale-98 text-slate-950 font-black font-medieval text-sm sm:text-base shadow-xl gold-glow transition flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" /> Comenzar Aventura
        </button>
      </div>
    </div>
  );
};
