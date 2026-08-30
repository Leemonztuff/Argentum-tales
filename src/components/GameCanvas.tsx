import React, { useEffect, useRef } from 'react';
import { Game3DRenderer } from '../engine/Game3DRenderer';
import { GameMap, PlayerCharacter, ActiveMob, FloatingText, SelectedTarget } from '../types/game';
import { Crosshair, X, ShieldAlert, CheckCircle2, AlertCircle, Sliders, Settings2, Eye, Gamepad2, Info, Sparkles, Palette, Layers, Tv } from 'lucide-react';
import { SpriteAvatar } from './SpriteAvatar';
import { DEFAULT_MOB_SPRITE, DEFAULT_NPC_SPRITE, NPC_SPRITES } from '../data/spritesheets';
import { AssetLoader } from '../engine/AssetLoader';
import { ShaderPresetMode, SHADER_PRESETS, PixelShaderConfig } from '../engine/PixelShaderPass';

interface GameCanvasProps {
  currentMap: GameMap;
  player: PlayerCharacter;
  activeMobs: ActiveMob[];
  selectedTarget: SelectedTarget;
  floatingTexts: FloatingText[];
  onSelectTarget: (target: SelectedTarget) => void;
  onPlayerMove?: (x: number, y: number, facing: 'up' | 'down' | 'left' | 'right') => void;
  rendererRef: React.MutableRefObject<Game3DRenderer | null>;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  currentMap,
  player,
  activeMobs,
  selectedTarget,
  floatingTexts,
  onSelectTarget,
  onPlayerMove,
  rendererRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isShaking, setIsShaking] = React.useState(false);
  const [isPixelPerfect, React_useState_isPixelPerfect] = React.useState(true);
  const [isDebugBounds, React_useState_isDebugBounds] = React.useState(false);
  const [mapLoading, setMapLoading] = React.useState(true);
  const [progressPercent, setProgressPercent] = React.useState(0);
  const [loadingStatusText, setLoadingStatusText] = React.useState('Iniciando...');

  const targetMob = selectedTarget?.type === 'mob' ? selectedTarget.mob : null;
  const targetNpc = selectedTarget?.type === 'npc' ? selectedTarget.npc : null;

  const [showDevConsole, setShowDevConsole] = React.useState(false);
  const [devConsoleTab, setDevConsoleTab] = React.useState<'SHADER' | 'CONTROLS'>('SHADER');
  
  // Pixel Shader Pass State
  const [shaderMode, setShaderMode] = React.useState<ShaderPresetMode>('PIXEL_OUTLINE');
  const [pixelSize, setPixelSize] = React.useState(2.0);
  const [outlineThickness, setOutlineThickness] = React.useState(1.0);
  const [outlineIntensity, setOutlineIntensity] = React.useState(0.60);
  const [ditherStrength, setDitherStrength] = React.useState(0.0);
  const [colorLevels, setColorLevels] = React.useState(0);
  const [outlineColor, setOutlineColor] = React.useState('#1e293b');

  // 2.5D Normal Map & Specular Shader State for Sprites (Calibrated AAA HD-2D)
  const [spriteNormalEnabled, setSpriteNormalEnabled] = React.useState(true);
  const [spriteNormalStrength, setSpriteNormalStrength] = React.useState(1.4);
  const [spriteSpecularIntensity, setSpriteSpecularIntensity] = React.useState(1.2);
  const [spriteSpecularShininess, setSpriteSpecularShininess] = React.useState(48.0);
  const [spriteSpecularRimPower, setSpriteSpecularRimPower] = React.useState(0.35);

  // Controls & Camera State
  const [moveSpeed, setMoveSpeed] = React.useState(4.5);
  const [joystickDeadzone, setJoystickDeadzone] = React.useState(0.12);
  const [cameraDeadzonePercent, setCameraDeadzonePercent] = React.useState(0.30);
  const [cameraMode, setCameraMode] = React.useState<'DEADZONE' | 'HARD_FOLLOW'>('DEADZONE');
  const [cameraPixelSnap, setCameraPixelSnap] = React.useState(true);
  const [cameraSmoothing, setCameraSmoothing] = React.useState(false);

  // Apply shader configuration changes to 3D Renderer
  const handleSelectShaderPreset = (mode: ShaderPresetMode) => {
    setShaderMode(mode);
    const preset = SHADER_PRESETS[mode];
    if (preset && preset.config) {
      if (preset.config.pixelSize !== undefined) setPixelSize(preset.config.pixelSize);
      if (preset.config.outlineThickness !== undefined) setOutlineThickness(preset.config.outlineThickness);
      if (preset.config.outlineIntensity !== undefined) setOutlineIntensity(preset.config.outlineIntensity);
      if (preset.config.ditherStrength !== undefined) setDitherStrength(preset.config.ditherStrength);
      if (preset.config.colorLevels !== undefined) setColorLevels(preset.config.colorLevels);
    }
    if (rendererRef.current) {
      rendererRef.current.applyPixelShaderPreset(mode);
    }
  };

  // Close dev console on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showDevConsole) {
        setShowDevConsole(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDevConsole]);

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.updatePixelShaderConfig({
        mode: shaderMode,
        pixelSize,
        outlineThickness,
        outlineIntensity,
        ditherStrength,
        colorLevels,
        outlineColor,
      });
    }
  }, [shaderMode, pixelSize, outlineThickness, outlineIntensity, ditherStrength, colorLevels, outlineColor, rendererRef.current]);

  // Synchronize dynamic developer console values to the 3D renderer instance
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.moveSpeed = moveSpeed;
      rendererRef.current.joystickDeadzone = joystickDeadzone;
      rendererRef.current.cameraDeadzonePercent = cameraDeadzonePercent;
      rendererRef.current.cameraMode = cameraMode;
      rendererRef.current.cameraPixelSnap = cameraPixelSnap;
      rendererRef.current.cameraSmoothing = cameraSmoothing;
      rendererRef.current.setSpriteNormalEnabled(spriteNormalEnabled);
      rendererRef.current.setSpriteNormalStrength(spriteNormalStrength);
      rendererRef.current.setSpriteSpecularIntensity(spriteSpecularIntensity);
      rendererRef.current.setSpriteSpecularShininess(spriteSpecularShininess);
      rendererRef.current.setSpriteSpecularRimPower(spriteSpecularRimPower);
    }
  }, [
    moveSpeed,
    joystickDeadzone,
    cameraDeadzonePercent,
    cameraMode,
    cameraPixelSnap,
    cameraSmoothing,
    spriteNormalEnabled,
    spriteNormalStrength,
    spriteSpecularIntensity,
    spriteSpecularShininess,
    spriteSpecularRimPower,
    rendererRef.current,
  ]);

  const handleTogglePixelPerfect = () => {
    if (rendererRef.current) {
      const nextState = rendererRef.current.togglePixelPerfect();
      React_useState_isPixelPerfect(nextState);
    }
  };

  const handleToggleDebugBounds = () => {
    if (rendererRef.current) {
      const nextState = rendererRef.current.toggleDebugBounds();
      React_useState_isDebugBounds(nextState);
    }
  };

  // Trigger CSS shake on miss floating texts
  useEffect(() => {
    const hasMissText = floatingTexts.some(
      (ft) =>
        ft.text.includes('FALLO') ||
        ft.text.includes('DESALINEADO') ||
        ft.text.includes('Sin Flechas')
    );
    if (hasMissText) {
      setIsShaking(true);
      const timer = setTimeout(() => setIsShaking(false), 250);
      return () => clearTimeout(timer);
    }
  }, [floatingTexts]);

  // Initialize Three.js renderer
  useEffect(() => {
    if (!containerRef.current) return;

    const renderer = new Game3DRenderer(containerRef.current);
    rendererRef.current = renderer;
    
    // Wire up map rendering callback
    renderer.setOnMapRenderedCallback(() => {
      setTimeout(() => {
        setMapLoading(false);
      }, 500); // smooth cinematic fade timing
    });

    renderer.setOnTargetSelectedCallback((mob) => {
      onSelectTarget(mob);
    });

    if (onPlayerMove) {
      renderer.setOnPlayerMoveContinuous(onPlayerMove);
    }

    const handleResize = () => {
      renderer.handleResize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.destroy();
      rendererRef.current = null;
    };
  }, []);

  // Update target callback if onSelectTarget changes
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setOnTargetSelectedCallback(onSelectTarget);
    }
  }, [onSelectTarget]);

  useEffect(() => {
    if (rendererRef.current && onPlayerMove) {
      rendererRef.current.setOnPlayerMoveContinuous(onPlayerMove);
    }
  }, [onPlayerMove]);

  // When map changes, reload map geometry in renderer after preloading spritesheets
  useEffect(() => {
    let active = true;

    const loadAssetsAndMap = async () => {
      setMapLoading(true);
      setProgressPercent(0);
      setLoadingStatusText('Cargando recursos...');

      await AssetLoader.getInstance().preloadMapAssets(currentMap.id, (percent, status) => {
        if (active) {
          setProgressPercent(percent);
          setLoadingStatusText(status);
        }
      });

      if (active && rendererRef.current) {
        rendererRef.current.loadMap(currentMap);
      }
    };

    loadAssetsAndMap();

    return () => {
      active = false;
    };
  }, [currentMap.id]);

  // Update entities
  useEffect(() => {
    if (rendererRef.current) {
      const weaponRange = player.equipment.weapon?.range || 1;
      rendererRef.current.updateEntities(player, activeMobs, selectedTarget, weaponRange);
    }
  }, [player, activeMobs, selectedTarget]);

  // Target alignment calculations for HUD banner
  const weaponRange = player.equipment.weapon?.range || 1;
  const dx = targetMob ? targetMob.x - player.x : 0;
  const dy = targetMob ? targetMob.y - player.y : 0;
  const isStraightX = dx === 0 && dy !== 0;
  const isStraightY = dy === 0 && dx !== 0;
  const isAxisAligned = isStraightX || isStraightY;
  const distance = targetMob
    ? isAxisAligned
      ? isStraightX
        ? Math.abs(dy)
        : Math.abs(dx)
      : Math.round(Math.hypot(dx, dy) * 10) / 10
    : 0;
  const isInRange = isAxisAligned && distance <= weaponRange;

  const targetHpPercent = targetMob ? Math.max(0, Math.min(100, (targetMob.currentHp / targetMob.maxHp) * 100)) : 0;

  return (
    <div
      ref={containerRef}
      id="game-canvas-container"
      className={`relative w-full h-full overflow-hidden cursor-crosshair select-none ${isShaking ? 'animate-miss-shake' : ''}`}
    >
      {/* Tactical Targeting Reticle Overlay (Landscape / Mobile Combat Precision) */}
      {selectedTarget && (
        <div className="absolute top-14 sm:top-18 left-1/2 -translate-x-1/2 z-20 pointer-events-auto max-w-[92vw] sm:max-w-md w-full px-2 animate-in fade-in slide-in-from-top-2 duration-200">
          {targetMob && (
            <div
              className={`hud-blur rounded-2xl p-2.5 sm:p-3 border shadow-2xl transition-all duration-200 flex flex-col gap-1.5 ${
                isInRange
                  ? 'border-emerald-500/70 shadow-emerald-950/50 bg-emerald-950/70'
                  : isAxisAligned
                  ? 'border-amber-500/70 shadow-amber-950/50 bg-amber-950/70 gold-glow'
                  : 'border-red-500/60 shadow-red-950/40 bg-slate-950/80'
              }`}
            >
              {/* Header: Target Name, Sprite & Quick Deselect */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <SpriteAvatar
                    spriteUrl={DEFAULT_MOB_SPRITE}
                    fallbackEmoji={targetMob.sprite}
                    size={32}
                    glowColor={targetMob.isRevengeTarget ? '#dc2626' : targetMob.color}
                  />
                  <div className="truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs sm:text-sm text-slate-100 truncate">{targetMob.name}</span>
                      {targetMob.isBoss && (
                        <span className="text-[9px] font-pixel bg-red-600/90 text-white px-1.5 py-0.2 rounded font-bold">
                          JEFE
                        </span>
                      )}
                      {targetMob.isRevengeTarget && (
                        <span className="text-[9px] font-pixel bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded font-bold">
                          VENGANZA
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-300 font-pixel">
                      HP: {targetMob.currentHp} / {targetMob.maxHp}
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {isInRange ? (
                    <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold animate-pulse">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>¡EN RANGO!</span>
                    </div>
                  ) : isAxisAligned ? (
                    <div className="flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-400/50 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold">
                      <Crosshair className="w-3.5 h-3.5" />
                      <span>ALINEADO ({distance}p)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 bg-red-500/20 text-red-300 border border-red-400/50 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>DESALINEADO</span>
                    </div>
                  )}

                  <button
                    onClick={() => onSelectTarget(null)}
                    className="p-1 text-slate-400 hover:text-white bg-black/40 hover:bg-black/70 rounded-lg transition"
                    title="Deseleccionar objetivo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Target HP Bar */}
              <div className="w-full bg-black/60 rounded-full h-1.5 sm:h-2 overflow-hidden border border-white/10">
                <div
                  className={`h-full transition-all duration-200 ${
                    targetHpPercent > 50 ? 'bg-emerald-500' : targetHpPercent > 25 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${targetHpPercent}%` }}
                />
              </div>

              {/* Precision hint */}
              <div className="flex items-center justify-between text-[10px] text-slate-300 font-pixel">
                <span className="text-slate-400">
                  {isInRange
                    ? '🎯 Listo para impactar cuerpo a cuerpo o proyectil'
                    : isAxisAligned
                    ? `📏 En línea recta a ${distance} casilleros (Alcance de arma: ${weaponRange})`
                    : '📐 Ataque en cruz: alinea posición horizontal o vertical'}
                </span>
                <span className="text-slate-400 shrink-0">Dist: {distance}</span>
              </div>
            </div>
          )}

          {targetNpc && (
            <div className="hud-blur rounded-2xl p-2.5 sm:p-3 border border-emerald-500/70 shadow-2xl shadow-emerald-950/50 bg-emerald-950/70 transition-all duration-200 flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <SpriteAvatar
                    spriteUrl={NPC_SPRITES[targetNpc.id] || DEFAULT_NPC_SPRITE}
                    fallbackEmoji={targetNpc.sprite}
                    size={32}
                    glowColor="#22c55e"
                  />
                  <div className="truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs sm:text-sm text-slate-100 truncate">{targetNpc.name}</span>
                      <span className="text-[9px] font-pixel bg-emerald-600/90 text-white px-1.5 py-0.2 rounded font-bold">
                        NPC / ALIADO
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-300 font-pixel truncate">
                      {targetNpc.title}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>SELECCIONADO</span>
                  </div>

                  <button
                    onClick={() => onSelectTarget(null)}
                    className="p-1 text-slate-400 hover:text-white bg-black/40 hover:bg-black/70 rounded-lg transition"
                    title="Deseleccionar objetivo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating combat numbers */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {floatingTexts.map((ft) => {
          // Floating damage visual offset
          const elapsed = Date.now() - ft.created;
          const progress = Math.min(1, elapsed / ft.durationMs);
          const offsetY = progress * -40;
          const opacity = 1 - progress;

          return (
            <div
              key={ft.id}
              className="absolute font-pixel font-bold text-lg sm:text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] transition-transform duration-75"
              style={{
                left: `${50 + (ft.x - player.x) * 4.5}%`,
                top: `${45 + (ft.y - player.y) * 4.5}%`,
                transform: `translate(-50%, calc(-50% + ${offsetY}px)) scale(${1 + (1 - progress) * 0.3})`,
                color: ft.color,
                opacity,
              }}
            >
              {ft.text}
            </div>
          );
        })}
      </div>

      {/* Cinematic RPG Loading Screen Overlay */}
      <div
        className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md transition-all duration-700 ease-out ${
          mapLoading ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex flex-col items-center gap-6 max-w-sm px-6 text-center animate-in fade-in zoom-in-95 duration-500">
          {/* Pulsing RPG Golden Shield */}
          <div className="relative flex items-center justify-center">
            <div className="absolute w-16 h-16 rounded-full border border-amber-500/20 animate-ping" style={{ animationDuration: '1.5s' }} />
            <div className="w-14 h-14 rounded-full border border-amber-500/50 bg-slate-900/90 flex items-center justify-center shadow-2xl">
              <span className="text-2xl">🗺️</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-amber-500 text-[10px] tracking-widest font-bold uppercase font-pixel animate-pulse">
              Invocando Reino 3D
            </span>
            <h3 className="text-slate-100 font-bold text-lg sm:text-xl font-sans tracking-tight">
              {currentMap.name}
            </h3>
            <p className="text-slate-400 text-xs italic font-pixel">
              {currentMap.subtitle}
            </p>
          </div>

          {/* Clean animated progress bar */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-56 bg-slate-800/60 rounded-full h-2 overflow-hidden border border-white/5 relative">
              <div 
                className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-300 ease-out" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between w-56 text-[10px] text-slate-400 font-pixel">
              <span className="truncate max-w-[130px] text-left">{loadingStatusText}</span>
              <span className="text-amber-400 font-bold whitespace-nowrap">{progressPercent}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toggle Developer Console Button */}
      <button
        id="dev-console-toggle-btn"
        onClick={() => setShowDevConsole((prev) => !prev)}
        className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 z-40 bg-slate-900/95 hover:bg-slate-800/95 text-amber-500 hover:text-amber-400 border border-amber-500/50 hover:border-amber-400/80 p-2.5 sm:p-3 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.25)] transition duration-200 flex items-center justify-center cursor-pointer active:scale-90"
        title="Configuración de Motor 3D & Shaders"
        aria-label="Abrir configuración de motor 3D"
      >
        <Sliders className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
      </button>

      {/* Interactive Precision Dev Console / Graphic Engine Modal Dialog */}
      {showDevConsole && (
        <div
          id="precision-dev-console-backdrop"
          onClick={() => setShowDevConsole(false)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150"
        >
          <div
            id="precision-dev-console"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[420px] max-h-[90vh] bg-slate-950/98 border border-amber-500/40 text-slate-100 rounded-2xl shadow-[0_10px_50px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 my-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-white/10 bg-slate-900/90 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0 animate-spin-slow" />
                <div className="flex flex-col">
                  <span className="font-bold text-xs sm:text-sm tracking-wide text-amber-400 font-pixel uppercase truncate">
                    Motor Gráfico & Precisión
                  </span>
                  <span className="text-[10px] text-slate-400 font-sans">
                    Ajustes de Shaders 3D, Pixel Art y Cámara
                  </span>
                </div>
              </div>
              <button
                id="btn-close-dev-console"
                onClick={() => setShowDevConsole(false)}
                className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-white bg-white/5 hover:bg-red-500/20 hover:border-red-500/40 border border-white/10 rounded-xl transition cursor-pointer active:scale-90 shrink-0 ml-2"
                title="Cerrar ventana"
                aria-label="Cerrar configuración"
              >
                <X className="w-5 h-5 text-slate-300" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="px-4 sm:px-5 pt-3 pb-1 shrink-0 bg-slate-950">
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-white/5">
                <button
                  onClick={() => setDevConsoleTab('SHADER')}
                  className={`py-2 px-2 rounded-lg text-xs font-pixel font-bold flex items-center justify-center gap-1.5 transition active:scale-95 ${
                    devConsoleTab === 'SHADER'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span className="truncate">Pixel Shader & FX</span>
                </button>
                <button
                  onClick={() => setDevConsoleTab('CONTROLS')}
                  className={`py-2 px-2 rounded-lg text-xs font-pixel font-bold flex items-center justify-center gap-1.5 transition active:scale-95 ${
                    devConsoleTab === 'CONTROLS'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Gamepad2 className="w-3.5 h-3.5" />
                  <span className="truncate">Cámara & Controles</span>
                </button>
              </div>
            </div>

            {/* Scrollable Content Body */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 custom-scrollbar space-y-4 text-xs">
              {devConsoleTab === 'SHADER' ? (
                <div className="flex flex-col gap-4 text-xs">
                  {/* Preset Selector */}
                  <div>
                    <span className="block mb-2 font-bold text-slate-200 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-400" />
                      <span>Presets de Estilo 3D</span>
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {(Object.keys(SHADER_PRESETS) as ShaderPresetMode[]).map((mode) => {
                        const preset = SHADER_PRESETS[mode];
                        const isSelected = shaderMode === mode;
                        return (
                          <button
                            key={mode}
                            onClick={() => handleSelectShaderPreset(mode)}
                            className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all active:scale-95 ${
                              isSelected
                                ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                                : 'bg-slate-900/50 border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20'
                            }`}
                          >
                            <div className="font-bold text-[11px] font-pixel mb-1 flex items-center justify-between">
                              <span>{preset.name}</span>
                              {isSelected && <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>}
                            </div>
                            <span className="text-[9px] text-slate-400 line-clamp-2 leading-tight">
                              {preset.desc}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pixel Size / Downsampling */}
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5">
                    <div className="flex justify-between mb-1 font-semibold text-slate-300">
                      <span>Tamaño de Pixel (Pixelation)</span>
                      <span className="font-pixel text-amber-400">{pixelSize.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="5.0"
                      step="0.5"
                      value={pixelSize}
                      onChange={(e) => setPixelSize(parseFloat(e.target.value))}
                      className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                      <span>1.0x (HD Nítido)</span>
                      <span>2.5x (RPG Clásico)</span>
                      <span>5.0x (Ultra Pixel)</span>
                    </div>
                  </div>

                  {/* Outline Thickness */}
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5">
                    <div className="flex justify-between mb-1 font-semibold text-slate-300">
                      <span>Grosor de Delineado (Outlines)</span>
                      <span className="font-pixel text-amber-400">{outlineThickness.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="3.0"
                      step="0.2"
                      value={outlineThickness}
                      onChange={(e) => setOutlineThickness(parseFloat(e.target.value))}
                      className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                      <span>0.0 (Sin borde)</span>
                      <span>1.2 (Equilibrado)</span>
                      <span>3.0 (Cómic marcado)</span>
                    </div>
                  </div>

                  {/* Outline Intensity */}
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5">
                    <div className="flex justify-between mb-1 font-semibold text-slate-300">
                      <span>Intensidad de Tinta / Contraste</span>
                      <span className="font-pixel text-amber-400">{Math.round(outlineIntensity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.05"
                      value={outlineIntensity}
                      onChange={(e) => setOutlineIntensity(parseFloat(e.target.value))}
                      className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Bayer Dithering Strength */}
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5">
                    <div className="flex justify-between mb-1 font-semibold text-slate-300">
                      <span>Tramado Bayer 4x4 (Retro Dither)</span>
                      <span className="font-pixel text-amber-400">{Math.round(ditherStrength * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="0.8"
                      step="0.05"
                      value={ditherStrength}
                      onChange={(e) => setDitherStrength(parseFloat(e.target.value))}
                      className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                      <span>Suave / Cel-Shading</span>
                      <span>Marcado (16-Bit)</span>
                    </div>
                  </div>

                  {/* Outline Color Tint */}
                  <div>
                    <span className="block mb-1.5 font-semibold text-slate-300">Tono de la Tinta de Delineado</span>
                    <div className="flex items-center gap-2">
                      {[
                        { name: 'Obsidiana', color: '#0b0f19' },
                        { name: 'Noche Azul', color: '#0f172a' },
                        { name: 'Sombra Carmesí', color: '#2a0a0a' },
                        { name: 'Musgo Profundo', color: '#092115' },
                        { name: 'Bronce Oscuro', color: '#261b0d' },
                      ].map((tint) => (
                        <button
                          key={tint.color}
                          onClick={() => setOutlineColor(tint.color)}
                          className={`flex-1 h-8 rounded-lg border transition active:scale-95 ${
                            outlineColor === tint.color ? 'border-amber-400 scale-105 shadow-md' : 'border-white/10 opacity-70 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: tint.color }}
                          title={tint.name}
                        />
                      ))}
                    </div>
                  </div>

                  {/* 2.5D Normal Maps & Dynamic Sprite Relieves */}
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-amber-500/20 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200">Normal Maps 2.5D en Sprites</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-pixel font-bold uppercase tracking-wider ${
                          spriteNormalEnabled ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {spriteNormalEnabled ? 'ACTIVO' : 'INACTIVO'}
                        </span>
                      </div>
                      <button
                        onClick={() => setSpriteNormalEnabled(!spriteNormalEnabled)}
                        className={`px-3 py-1 text-[11px] rounded-lg font-semibold transition active:scale-95 ${
                          spriteNormalEnabled 
                            ? 'bg-amber-500 text-slate-950 hover:bg-amber-400' 
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {spriteNormalEnabled ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">
                      Genera mapas de normales tangentes en tiempo real a partir del contorno y luminancia de los sprites. Permite que las luces dinámicas (sol cenital y antorchas) reaccionen al volumen de los personajes.
                    </p>

                    {spriteNormalEnabled && (
                      <div className="pt-2 border-t border-white/5 space-y-3">
                        <div>
                          <div className="flex justify-between mb-1 font-semibold text-slate-300 text-[11px]">
                            <span>Intensidad de Relieve (Normal Scale)</span>
                            <span className="font-pixel text-amber-400">{spriteNormalStrength.toFixed(1)}x</span>
                          </div>
                          <input
                            type="range"
                            min="0.2"
                            max="3.5"
                            step="0.1"
                            value={spriteNormalStrength}
                            onChange={(e) => setSpriteNormalStrength(parseFloat(e.target.value))}
                            className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                            <span>0.2 (Sutil)</span>
                            <span>1.6 (HD-2D Óptimo)</span>
                            <span>3.5 (Esculpido)</span>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-1 font-semibold text-slate-300 text-[11px]">
                            <span>Brillo Especular (Specular Highlight)</span>
                            <span className="font-pixel text-cyan-400">{spriteSpecularIntensity.toFixed(1)}x</span>
                          </div>
                          <input
                            type="range"
                            min="0.0"
                            max="4.0"
                            step="0.1"
                            value={spriteSpecularIntensity}
                            onChange={(e) => setSpriteSpecularIntensity(parseFloat(e.target.value))}
                            className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                            <span>0.0 (Matte)</span>
                            <span>1.6 (Brillo 2.5D)</span>
                            <span>4.0 (Metálico Intenso)</span>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-1 font-semibold text-slate-300 text-[11px]">
                            <span>Concentración del Brillo (Shininess)</span>
                            <span className="font-pixel text-cyan-400">{Math.round(spriteSpecularShininess)}</span>
                          </div>
                          <input
                            type="range"
                            min="8"
                            max="96"
                            step="4"
                            value={spriteSpecularShininess}
                            onChange={(e) => setSpriteSpecularShininess(parseFloat(e.target.value))}
                            className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                            <span>8 (Difuso)</span>
                            <span>32 (Nítido)</span>
                            <span>96 (Puntual / Pulido)</span>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-1 font-semibold text-slate-300 text-[11px]">
                            <span>Luz de Borde Curvatura (Rim Reflection)</span>
                            <span className="font-pixel text-cyan-400">{spriteSpecularRimPower.toFixed(2)}</span>
                          </div>
                          <input
                            type="range"
                            min="0.0"
                            max="1.2"
                            step="0.05"
                            value={spriteSpecularRimPower}
                            onChange={(e) => setSpriteSpecularRimPower(parseFloat(e.target.value))}
                            className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                            <span>0.0 (Sin borde)</span>
                            <span>0.4 (Borde Suave)</span>
                            <span>1.2 (Fresnel Intenso)</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4 text-xs">
                  {/* 1. DIRECT Movement Status */}
                  <div className="bg-slate-900/80 rounded-xl p-3 border border-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-300">Movimiento Personaje</span>
                      <span className="text-[10px] font-pixel text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold">DIRECTO</span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Aceleración: <strong className="text-slate-300">0</strong> | Desaceleración: <strong className="text-slate-300">0</strong>. Respuesta instantánea y determinista frame-rate independiente.
                    </p>
                  </div>

                  {/* 2. Joystick Deadzone */}
                  <div>
                    <div className="flex justify-between mb-1 font-semibold text-slate-300">
                      <span>Rango Deadzone de Joystick</span>
                      <span className="font-pixel text-amber-400">{joystickDeadzone.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.25"
                      step="0.01"
                      value={joystickDeadzone}
                      onChange={(e) => setJoystickDeadzone(parseFloat(e.target.value))}
                      className="w-full accent-amber-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                      <span>Fina (0.05)</span>
                      <span>Gruesa (0.25)</span>
                    </div>
                  </div>

                  {/* 3. Camera Mode */}
                  <div>
                    <span className="block mb-1.5 font-semibold text-slate-300">Seguimiento de Cámara</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setCameraMode('DEADZONE')}
                        className={`py-1.5 px-2 rounded-lg border font-pixel text-[10px] transition font-bold ${
                          cameraMode === 'DEADZONE'
                            ? 'bg-amber-500/25 border-amber-500 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                            : 'bg-slate-900/40 border-white/10 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        CAJA DEADZONE
                      </button>
                      <button
                        onClick={() => setCameraMode('HARD_FOLLOW')}
                        className={`py-1.5 px-2 rounded-lg border font-pixel text-[10px] transition font-bold ${
                          cameraMode === 'HARD_FOLLOW'
                            ? 'bg-amber-500/25 border-amber-500 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                            : 'bg-slate-900/40 border-white/10 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        HARD FOLLOW
                      </button>
                    </div>
                  </div>

                  {/* 4. Camera Deadzone Area (Only show if DEADZONE) */}
                  {cameraMode === 'DEADZONE' && (
                    <div>
                      <div className="flex justify-between mb-1 font-semibold text-slate-300">
                        <span>Tamaño Deadzone de Cámara</span>
                        <span className="font-pixel text-amber-400">{Math.round(cameraDeadzonePercent * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.15"
                        max="0.45"
                        step="0.01"
                        value={cameraDeadzonePercent}
                        onChange={(e) => setCameraDeadzonePercent(parseFloat(e.target.value))}
                        className="w-full accent-amber-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                        <span>Estrecho (15%)</span>
                        <span>Ancho (45%)</span>
                      </div>
                    </div>
                  )}

                  {/* 5. Camera Smoothing Toggle */}
                  <div className="flex items-center justify-between py-1 border-t border-white/5 pt-3">
                    <div>
                      <span className="block font-semibold text-slate-300">Suavizado de Cámara</span>
                      <span className="text-[9px] text-slate-500">
                        {cameraSmoothing ? 'Lerp activo (Smooth follow)' : 'OFF (Seguimiento inmediato)'}
                      </span>
                    </div>
                    <button
                      onClick={() => setCameraSmoothing((prev) => !prev)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        cameraSmoothing ? 'bg-amber-500' : 'bg-slate-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          cameraSmoothing ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* 6. Pixel Snapping Toggle */}
                  <div className="flex items-center justify-between py-1">
                    <div>
                      <span className="block font-semibold text-slate-300">Pixel Snapping (Ajuste a Pixel)</span>
                      <span className="text-[9px] text-slate-500">
                        {cameraPixelSnap ? 'Bloqueo activo' : 'Movimiento flotante subpixel'}
                      </span>
                    </div>
                    <button
                      onClick={() => setCameraPixelSnap((prev) => !prev)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        cameraPixelSnap ? 'bg-amber-500' : 'bg-slate-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          cameraPixelSnap ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* 7. Show Debug Bounds (Visualizar área) */}
                  <div className="flex items-center justify-between py-1 border-t border-white/5 pt-3">
                    <div className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-pink-500" />
                      <div>
                        <span className="block font-semibold text-slate-300">Visualizar Deadzone y Wireframes</span>
                        <span className="text-[9px] text-slate-500">Muestra área y colisiones en tiempo real</span>
                      </div>
                    </div>
                    <button
                      onClick={handleToggleDebugBounds}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isDebugBounds ? 'bg-amber-500' : 'bg-slate-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isDebugBounds ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Bottom Footer */}
            <div className="p-3 sm:p-4 border-t border-white/10 bg-slate-900/95 shrink-0">
              <button
                id="btn-apply-close-dev-console"
                onClick={() => setShowDevConsole(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold font-pixel text-xs tracking-wider uppercase transition active:scale-95 shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>Cerrar & Guardar Ajustes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
