import React, { useState } from 'react';
import { X, Gamepad2, Swords, Compass, Sparkles, Backpack, BookOpen, Hand, Shield, Target } from 'lucide-react';
import { Modal } from '../ui';
import { useUIStore } from '../ui';

interface HelpModalProps {
  onClose?: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  const [tab, setTab] = useState<'controls' | 'combat' | 'systems'>('controls');
  const isOpen = useUIStore((s) => s.openModals.help);
  const closeFromStore = useUIStore((s) => () => s.closeModal('help'));
  const handleClose = onClose ?? closeFromStore;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Guía de Aventura y Controles"
      icon={<span>📖</span>}
      size="lg"
      accent="#f59e0b"
      header={
        <div className="flex items-center justify-between px-3.5 py-2.5 sm:px-5 sm:py-3.5 border-b border-white/10 hud-blur">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <span className="text-lg sm:text-xl">📖</span>
            <div>
              <h2 className="text-sm sm:text-base font-bold font-medieval text-slate-100">Guía de Aventura y Controles</h2>
              <span className="text-[10px] sm:text-xs text-amber-400 font-pixel">Manual de Arandor</span>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      }
      footer={
        <div className="p-3 sm:p-4 hud-blur border-t border-white/10 flex justify-end">
          <button
            onClick={handleClose}
            className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 active:scale-95 text-white font-bold text-xs py-2 px-5 rounded-xl border border-amber-300/40 shadow-lg gold-glow transition"
          >
            ¡Entendido!
          </button>
        </div>
      }
    >
      {/* Navigation Tabs */}
      <div className="flex border-b border-white/10 hud-blur px-3.5 sm:px-5 pt-1.5 sm:pt-2">
        <button
          onClick={() => setTab('controls')}
          className={`pb-2 sm:pb-2.5 px-3 sm:px-4 font-bold text-[11px] sm:text-xs border-b-2 transition flex items-center gap-1.5 ${
            tab === 'controls'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Gamepad2 className="w-3.5 h-3.5" />
          <span>Controles y Atajos</span>
        </button>
        <button
          onClick={() => setTab('combat')}
          className={`pb-2 sm:pb-2.5 px-3 sm:px-4 font-bold text-[11px] sm:text-xs border-b-2 transition flex items-center gap-1.5 ${
            tab === 'combat'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Swords className="w-3.5 h-3.5" />
          <span>Combate Táctico</span>
        </button>
        <button
          onClick={() => setTab('systems')}
          className={`pb-2 sm:pb-2.5 px-3 sm:px-4 font-bold text-[11px] sm:text-xs border-b-2 transition flex items-center gap-1.5 ${
            tab === 'systems'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Mecánicas y Progreso</span>
        </button>
      </div>

      {/* Content Body */}
      <div className="p-3.5 sm:p-5 flex-1 overflow-y-auto flex flex-col gap-3 sm:gap-4">
        {tab === 'controls' && (
          <div className="flex flex-col gap-3 text-xs text-slate-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {/* Movement */}
              <div className="hud-blur border border-white/10 rounded-xl p-3 flex flex-col gap-1.5 shadow-inner">
                <div className="flex items-center gap-2 text-amber-300 font-bold">
                  <Compass className="w-4 h-4" />
                  <span>Movimiento</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Moverse:</span>
                  <span className="font-pixel text-[11px] bg-slate-900 px-2 py-0.5 rounded border border-white/10 text-amber-400">WASD / Flechas</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Móvil:</span>
                  <span className="text-[11px] text-slate-400">Joystick Virtual Táctil</span>
                </div>
              </div>

              {/* Combat Actions */}
              <div className="hud-blur border border-white/10 rounded-xl p-3 flex flex-col gap-1.5 shadow-inner">
                <div className="flex items-center gap-2 text-rose-300 font-bold">
                  <Swords className="w-4 h-4" />
                  <span>Acciones de Combate</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Atacar:</span>
                  <span className="font-pixel text-[11px] bg-slate-900 px-2 py-0.5 rounded border border-white/10 text-rose-400">Espacio / F</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Ciclar Blanco:</span>
                  <span className="font-pixel text-[11px] bg-slate-900 px-2 py-0.5 rounded border border-white/10 text-sky-400">TAB</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Fijar Objetivo:</span>
                  <span className="text-[11px] text-slate-400">Clic / Toque en criatura</span>
                </div>
              </div>

              {/* Quick Potions */}
              <div className="hud-blur border border-white/10 rounded-xl p-3 flex flex-col gap-1.5 shadow-inner">
                <div className="flex items-center gap-2 text-emerald-300 font-bold">
                  <Sparkles className="w-4 h-4" />
                  <span>Consumibles Rápidos</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Poción de Vida:</span>
                  <span className="font-pixel text-[11px] bg-slate-900 px-2 py-0.5 rounded border border-red-500/30 text-red-400">Tecla Q</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Poción de Maná:</span>
                  <span className="font-pixel text-[11px] bg-slate-900 px-2 py-0.5 rounded border border-sky-500/30 text-sky-400">Tecla R</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Hechizos:</span>
                  <span className="font-pixel text-[11px] bg-slate-900 px-2 py-0.5 rounded border border-purple-500/30 text-purple-300">Teclas 1, 2, 3</span>
                </div>
              </div>

              {/* Menus & System */}
              <div className="hud-blur border border-white/10 rounded-xl p-3 flex flex-col gap-1.5 shadow-inner">
                <div className="flex items-center gap-2 text-sky-300 font-bold">
                  <Backpack className="w-4 h-4" />
                  <span>Menús y Atajos</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Inventario:</span>
                  <span className="font-pixel text-[11px] bg-slate-900 px-2 py-0.5 rounded border border-white/10 text-amber-300">Tecla I</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Habilidades:</span>
                  <span className="font-pixel text-[11px] bg-slate-900 px-2 py-0.5 rounded border border-white/10 text-sky-300">Tecla K</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Misiones:</span>
                  <span className="font-pixel text-[11px] bg-slate-900 px-2 py-0.5 rounded border border-white/10 text-emerald-300">Tecla L</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Interactuar:</span>
                  <span className="font-pixel text-[11px] bg-slate-900 px-2 py-0.5 rounded border border-white/10 text-yellow-300">Tecla E</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Ajustes & Config:</span>
                  <span className="font-pixel text-[11px] bg-slate-900 px-2 py-0.5 rounded border border-amber-500/30 text-amber-400">Tecla O</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Cerrar Ventana:</span>
                  <span className="font-pixel text-[11px] bg-slate-900 px-2 py-0.5 rounded border border-white/10 text-slate-400">Escape</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'combat' && (
          <div className="flex flex-col gap-3 text-xs text-slate-300 leading-relaxed">
            <div className="hud-blur border border-amber-500/30 rounded-xl p-3.5 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Target className="w-4 h-4" />
                <span>Alineación Táctica en Ejes Cardinales</span>
              </div>
              <p>
                En Arandor, los ataques cuerpo a cuerpo y a distancia requieren estar en <strong>línea recta (horizontal o vertical)</strong> con el enemigo.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
                <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-lg p-2 flex flex-col items-center text-center">
                  <span className="text-emerald-400 font-bold text-[11px]">🟢 Retícula Verde</span>
                  <span className="text-[10px] text-slate-300">Alineado y en rango de arma. ¡Listo para golpear!</span>
                </div>
                <div className="bg-amber-950/40 border border-amber-500/50 rounded-lg p-2 flex flex-col items-center text-center">
                  <span className="text-amber-400 font-bold text-[11px]">🟡 Retícula Ámbar</span>
                  <span className="text-[10px] text-slate-300">Alineado pero fuera de alcance. Acércate en línea recta.</span>
                </div>
                <div className="bg-red-950/40 border border-red-500/50 rounded-lg p-2 flex flex-col items-center text-center">
                  <span className="text-red-400 font-bold text-[11px]">🔴 Retícula Roja</span>
                  <span className="text-[10px] text-slate-300">Desalineado (en diagonal). Muévete para cuadrarte.</span>
                </div>
              </div>
            </div>

            <div className="hud-blur border border-white/10 rounded-xl p-3.5 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sky-300 font-bold">
                <Shield className="w-4 h-4" />
                <span>Combate por Intervalos y Escudos</span>
              </div>
              <p>
                Cada arma tiene un intervalo de golpeo propio. El botón de ataque muestra una animación radial de recarga. Si equipas un escudo, tendrás probabilidad pasiva de <strong>bloquear daño físico</strong> según tu destreza en <em>Defensa con Escudos</em>.
              </p>
            </div>
          </div>
        )}

        {tab === 'systems' && (
          <div className="flex flex-col gap-3 text-xs text-slate-300 leading-relaxed">
            <div className="hud-blur border border-white/10 rounded-xl p-3.5 flex flex-col gap-1.5">
              <span className="text-amber-400 font-bold">✨ Progreso por Uso de Habilidades</span>
              <p>
                Tus habilidades mejoran orgánicamente a medida que las utilizas: atacar con espada sube <em>Combate con Armas</em>, disparar flechas entrena <em>Combate a Distancia</em>, y esquivar golpes incrementa tu <em>Evasión</em>.
              </p>
            </div>

            <div className="hud-blur border border-white/10 rounded-xl p-3.5 flex flex-col gap-1.5">
              <span className="text-emerald-400 font-bold">⚒️ Recolección y Forja</span>
              <p>
                Encuentra vetas de hierro y flores alquímicas en los mapas. Llévalas a los artesanos de la Villa para forjar armaduras y destilar pociones de gran potencia.
              </p>
            </div>

            <div className="hud-blur border border-white/10 rounded-xl p-3.5 flex flex-col gap-1.5">
              <span className="text-purple-400 font-bold">⚔️ Venganza Heroica</span>
              <p>
                Si eres derrotado por una criatura, quedará marcada con el aura de <strong>Venganza</strong>. Si regresas y la vences, recuperarás con creces el honor y recibirás botín y experiencia multiplicada.
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
