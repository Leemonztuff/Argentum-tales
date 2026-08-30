import React from 'react';
import { X, Settings, Magnet, Sparkles, Volume2, VolumeX, Eye, Grid, ShieldAlert, CheckCircle2, Sliders, Filter, Coins, FlaskConical, TreePine, Swords, Scroll } from 'lucide-react';
import { AutoPickupTypeFilters, DEFAULT_AUTO_PICKUP_FILTERS } from '../utils/inventoryUtils';

export interface GameSettingsState {
  autoPickup: boolean;
  autoPickupFilters: AutoPickupTypeFilters;
  critShake: boolean;
  showLootToasts: boolean;
  autoAlignGrid: boolean;
  soundMuted: boolean;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettingsState;
  onUpdateSettings: (newSettings: Partial<GameSettingsState>) => void;
  onToggleMute: () => void;
  onReturnToTitle?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onToggleMute,
  onReturnToTitle,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#08080c]/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl max-h-[94vh] sm:max-h-[85vh] hud-panel border border-amber-500/30 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto gold-glow">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4 border-b border-white/10 hud-blur">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <Sliders className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold font-medieval text-slate-100 flex items-center gap-2">
                Ajustes & Preferencias de Juego
              </h2>
              <span className="text-[10px] sm:text-xs text-amber-400/90 font-pixel">Configuración del Sistema de Aventura</span>
            </div>
          </div>
          <button
            id="btn-close-settings"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto flex flex-col gap-4">
          
          {/* Main Feature Highlight: AUTO PICKUP */}
          <div className="hud-blur border border-amber-500/40 rounded-2xl p-4 bg-gradient-to-r from-amber-950/30 via-slate-900/80 to-slate-900/90 shadow-lg flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl border ${
                  settings.autoPickup 
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300' 
                    : 'bg-slate-800/60 border-slate-700 text-slate-400'
                }`}>
                  <Magnet className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-amber-300 font-medieval">
                      Recogido Automático (Auto-Pickup)
                    </h3>
                    <span className={`text-[10px] font-pixel px-2 py-0.5 rounded-full border ${
                      settings.autoPickup 
                        ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400' 
                        : 'bg-slate-800 border-slate-600 text-slate-400'
                    }`}>
                      {settings.autoPickup ? 'ACTIVADO' : 'DESACTIVADO'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Recoge automáticamente monedas de oro, recompensas de mobs derrotados y recursos naturales (minerales, madera, hierbas) al pasar cerca de ellos sin necesidad de interacción manual.
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                id="toggle-autopickup"
                onClick={() => onUpdateSettings({ autoPickup: !settings.autoPickup })}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.autoPickup ? 'bg-amber-500' : 'bg-slate-700'
                }`}
                role="switch"
                aria-checked={settings.autoPickup}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-slate-950 shadow ring-0 transition duration-200 ease-in-out ${
                    settings.autoPickup ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="text-[11px] text-amber-400/80 bg-amber-950/30 p-2.5 rounded-xl border border-amber-500/20 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span>Reduce la fricción al explorar mazmorras y recolectar botín tras vencer grupos de enemigos.</span>
            </div>

            {/* Sub-filters for Auto Pickup */}
            {settings.autoPickup && (
              <div className="pt-2 border-t border-amber-500/20 flex flex-col gap-2 animate-in fade-in">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                  <Filter className="w-3.5 h-3.5 text-amber-400" />
                  <span>Filtro de Tipos de Objetos para Recogido Automático:</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {/* Gold filter */}
                  <button
                    id="filter-gold"
                    onClick={() =>
                      onUpdateSettings({
                        autoPickupFilters: {
                          ...(settings.autoPickupFilters || DEFAULT_AUTO_PICKUP_FILTERS),
                          gold: !(settings.autoPickupFilters?.gold ?? true),
                        },
                      })
                    }
                    className={`p-2 rounded-xl border flex items-center gap-2 text-xs transition ${
                      (settings.autoPickupFilters?.gold ?? true)
                        ? 'bg-amber-950/60 border-amber-400/60 text-amber-200'
                        : 'bg-slate-900/60 border-slate-700 text-slate-500 opacity-60'
                    }`}
                  >
                    <Coins className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span className="font-medium text-left">🪙 Monedas de Oro</span>
                  </button>

                  {/* Consumables filter */}
                  <button
                    id="filter-consumables"
                    onClick={() =>
                      onUpdateSettings({
                        autoPickupFilters: {
                          ...(settings.autoPickupFilters || DEFAULT_AUTO_PICKUP_FILTERS),
                          consumables: !(settings.autoPickupFilters?.consumables ?? true),
                        },
                      })
                    }
                    className={`p-2 rounded-xl border flex items-center gap-2 text-xs transition ${
                      (settings.autoPickupFilters?.consumables ?? true)
                        ? 'bg-emerald-950/60 border-emerald-400/60 text-emerald-200'
                        : 'bg-slate-900/60 border-slate-700 text-slate-500 opacity-60'
                    }`}
                  >
                    <FlaskConical className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="font-medium text-left">🧪 Consumibles</span>
                  </button>

                  {/* Materials filter */}
                  <button
                    id="filter-materials"
                    onClick={() =>
                      onUpdateSettings({
                        autoPickupFilters: {
                          ...(settings.autoPickupFilters || DEFAULT_AUTO_PICKUP_FILTERS),
                          materials: !(settings.autoPickupFilters?.materials ?? true),
                        },
                      })
                    }
                    className={`p-2 rounded-xl border flex items-center gap-2 text-xs transition ${
                      (settings.autoPickupFilters?.materials ?? true)
                        ? 'bg-sky-950/60 border-sky-400/60 text-sky-200'
                        : 'bg-slate-900/60 border-slate-700 text-slate-500 opacity-60'
                    }`}
                  >
                    <TreePine className="w-4 h-4 text-sky-400 flex-shrink-0" />
                    <span className="font-medium text-left">🌿 Materiales</span>
                  </button>

                  {/* Equipment filter */}
                  <button
                    id="filter-equipment"
                    onClick={() =>
                      onUpdateSettings({
                        autoPickupFilters: {
                          ...(settings.autoPickupFilters || DEFAULT_AUTO_PICKUP_FILTERS),
                          equipment: !(settings.autoPickupFilters?.equipment ?? true),
                        },
                      })
                    }
                    className={`p-2 rounded-xl border flex items-center gap-2 text-xs transition ${
                      (settings.autoPickupFilters?.equipment ?? true)
                        ? 'bg-rose-950/60 border-rose-400/60 text-rose-200'
                        : 'bg-slate-900/60 border-slate-700 text-slate-500 opacity-60'
                    }`}
                  >
                    <Swords className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <span className="font-medium text-left">⚔️ Equipamiento</span>
                  </button>

                  {/* Quest items filter */}
                  <button
                    id="filter-quest"
                    onClick={() =>
                      onUpdateSettings({
                        autoPickupFilters: {
                          ...(settings.autoPickupFilters || DEFAULT_AUTO_PICKUP_FILTERS),
                          quest: !(settings.autoPickupFilters?.quest ?? true),
                        },
                      })
                    }
                    className={`p-2 rounded-xl border flex items-center gap-2 text-xs transition ${
                      (settings.autoPickupFilters?.quest ?? true)
                        ? 'bg-purple-950/60 border-purple-400/60 text-purple-200'
                        : 'bg-slate-900/60 border-slate-700 text-slate-500 opacity-60'
                    }`}
                  >
                    <Scroll className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span className="font-medium text-left">📜 Misiones</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Secondary Options */}
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-pixel px-1">
              Opciones de Combate & Renderizado
            </span>

            {/* Crit Shake */}
            <div className="hud-blur border border-white/10 rounded-xl p-3 bg-slate-900/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Impacto Crítico & Sacudidas de Cámara</h4>
                  <p className="text-[11px] text-slate-400">Genera efectos de inclinación y vibración visual al asestar golpes críticos.</p>
                </div>
              </div>
              <button
                id="toggle-critshake"
                onClick={() => onUpdateSettings({ critShake: !settings.critShake })}
                className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  settings.critShake ? 'bg-amber-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-slate-950 shadow ring-0 transition duration-200 ease-in-out ${
                    settings.critShake ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Loot Toasts */}
            <div className="hud-blur border border-white/10 rounded-xl p-3 bg-slate-900/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Eye className="w-4 h-4 text-sky-400" />
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Alertas Flotantes de Botín</h4>
                  <p className="text-[11px] text-slate-400">Muestra mensajes contextuales en pantalla al recoger ítems o ganar EXP.</p>
                </div>
              </div>
              <button
                id="toggle-loottoasts"
                onClick={() => onUpdateSettings({ showLootToasts: !settings.showLootToasts })}
                className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  settings.showLootToasts ? 'bg-amber-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-slate-950 shadow ring-0 transition duration-200 ease-in-out ${
                    settings.showLootToasts ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Auto Align Grid */}
            <div className="hud-blur border border-white/10 rounded-xl p-3 bg-slate-900/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Grid className="w-4 h-4 text-emerald-400" />
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Centrado de Cuadrícula Visual</h4>
                  <p className="text-[11px] text-slate-400">Alinea la posición del personaje suavemente a las casillas del mapa.</p>
                </div>
              </div>
              <button
                id="toggle-autoalign"
                onClick={() => onUpdateSettings({ autoAlignGrid: !settings.autoAlignGrid })}
                className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  settings.autoAlignGrid ? 'bg-amber-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-slate-950 shadow ring-0 transition duration-200 ease-in-out ${
                    settings.autoAlignGrid ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Audio Mute */}
            <div className="hud-blur border border-white/10 rounded-xl p-3 bg-slate-900/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                {settings.soundMuted ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                )}
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Efectos de Sonido & Música</h4>
                  <p className="text-[11px] text-slate-400">Activa o silencia el sonido ambiental y los efectos de combate.</p>
                </div>
              </div>
              <button
                id="toggle-audio-settings"
                onClick={onToggleMute}
                className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  !settings.soundMuted ? 'bg-amber-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-slate-950 shadow ring-0 transition duration-200 ease-in-out ${
                    !settings.soundMuted ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Return to Title / Character Select */}
            {onReturnToTitle && (
              <div className="hud-blur border border-amber-500/30 rounded-xl p-3 bg-amber-950/20 flex items-center justify-between gap-3 mt-2">
                <div>
                  <h4 className="text-xs font-bold text-amber-300 font-medieval">Cambiar de Personaje / Título</h4>
                  <p className="text-[11px] text-slate-400">Guarda la partida actual y regresa al menú de selección de héroes.</p>
                </div>
                <button
                  id="btn-return-to-title"
                  onClick={() => {
                    onClose();
                    onReturnToTitle();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-pixel text-xs transition"
                >
                  Menú Principal
                </button>
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-white/10 hud-blur flex items-center justify-between bg-slate-900/90">
          <span className="text-[11px] text-slate-400 font-pixel flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Configuración guardada en almacenamiento local
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition active:scale-95"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};
