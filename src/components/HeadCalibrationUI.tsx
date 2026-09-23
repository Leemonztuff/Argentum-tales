import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Sliders, RotateCcw, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, User, Sword } from 'lucide-react';
import { Modal, useUIStore } from '../ui';
import {
  getHeadCalibration,
  setHeadCalibration,
  resetHeadCalibration,
  DEFAULT_HEAD_CALIBRATION,
  HeadCalibrationConfig,
  HeadFacing,
  getActiveRenderer,
} from '../engine/Game3DRenderer';
import {
  getHandSocket,
  setSocketOverride,
  resetSocketOverrides,
  DEFAULT_HAND_SOCKETS,
  getWeaponScale,
  setWeaponScale,
  HandSocket,
  WEAPON_HEIGHT_RATIO,
} from '../engine/SpriteSockets';
import { HEAD_SPRITES, NEW_BODY_SPRITES } from '../data/spritesheets';

type Facing = HeadFacing;
type Tab = 'cabeza' | 'arma';

const FACING_ORDER: Facing[] = ['down', 'left', 'right', 'up'];
const FACING_LABEL: Record<Facing, string> = { down: 'Frente', left: 'Izq.', right: 'Der.', up: 'Atrás' };
const FACING_ICON: Record<Facing, React.ReactNode> = {
  down: <ChevronDown className="w-4 h-4" />,
  left: <ChevronLeft className="w-4 h-4" />,
  right: <ChevronRight className="w-4 h-4" />,
  up: <ChevronUp className="w-4 h-4" />,
};

const PREVIEW_SIZE = 180;

export const HeadCalibrationUI: React.FC = () => {
  const isOpen = useUIStore((s) => s.openModals.headCalibration);
  const handleClose = useCallback(() => useUIStore.getState().closeModal('headCalibration'), []);

  const [tab, setTab] = useState<Tab>('cabeza');
  const [facing, setFacing] = useState<Facing>('down');
  const [calib, setCalib] = useState<HeadCalibrationConfig>(() => getHeadCalibration('down'));
  const [socket, setSocket] = useState<HandSocket>(() => getHandSocket('down'));
  const [weaponScale, setWeaponScaleState] = useState<number>(() => getWeaponScale());
  const previewRef = useRef<HTMLCanvasElement>(null);

  // Al cambiar de vista: recargar los valores efectivos de ESA vista.
  const switchFacing = useCallback((f: Facing) => {
    setFacing(f);
    setCalib(getHeadCalibration(f));
    setSocket(getHandSocket(f));
  }, []);

  const renderPreview = useCallback(() => {
    const canvas = previewRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const renderer = getActiveRenderer();
    if (!renderer) return;
    const rp = renderer.getPlayerRenderParams();
    const bodyUrl = rp?.spriteUrl || NEW_BODY_SPRITES.novicio;
    const headUrl = rp?.headUrl || HEAD_SPRITES.head_humano02;
    const weaponUrl = tab === 'arma' ? rp?.weaponUrl : undefined;
    const composite = renderer.renderPlayerComposite(bodyUrl, headUrl, facing, 0, undefined, weaponUrl);
    // Upright, pixel-art preview anchored at the feet (authoring feet row ≈ 0.946 h).
    const H = canvas.height;
    const scale = H / (composite.height * 0.95);
    const dw = Math.round(composite.width * scale);
    const dh = Math.round(composite.height * scale);
    const dx = Math.round((canvas.width - dw) / 2);
    const dy = Math.round(canvas.height - composite.height * 0.946 * scale);
    ctx.drawImage(composite, 0, 0, composite.width, composite.height, dx, dy, dw, dh);
  }, [facing, tab]);

  // Re-render preview whenever calibration/socket/facing/open state change.
  useEffect(() => {
    if (!isOpen) return;
    const id = requestAnimationFrame(() => {
      renderPreview();
      const id2 = requestAnimationFrame(renderPreview);
      return () => cancelAnimationFrame(id2);
    });
    return () => cancelAnimationFrame(id);
  }, [isOpen, calib, socket, weaponScale, facing, tab, renderPreview]);

  // --- Cabeza (por vista) ---
  const updateHead = useCallback((key: keyof HeadCalibrationConfig, value: number) => {
    setCalib((prev) => {
      const next = { ...prev, [key]: value };
      setHeadCalibration({ [key]: value }, facing);
      return next;
    });
  }, [facing]);

  const resetHeadFacing = useCallback(() => {
    resetHeadCalibration(facing);
    setCalib(getHeadCalibration(facing));
  }, [facing]);

  const resetHeadAll = useCallback(() => {
    resetHeadCalibration();
    setCalib(getHeadCalibration(facing));
  }, [facing]);

  // --- Arma (socket por vista + escala global) ---
  const updateSocket = useCallback((key: keyof HandSocket, value: number | boolean) => {
    setSocket((prev) => {
      const next = { ...prev, [key]: value };
      setSocketOverride(facing, { [key]: value } as Partial<HandSocket>);
      return next;
    });
  }, [facing]);

  const updateWeaponScale = useCallback((value: number) => {
    setWeaponScaleState(value);
    setWeaponScale(value);
  }, []);

  const resetWeaponFacing = useCallback(() => {
    setSocketOverride(facing, DEFAULT_HAND_SOCKETS[facing]);
    setSocket(getHandSocket(facing));
  }, [facing]);

  const resetWeaponAll = useCallback(() => {
    resetSocketOverrides();
    setWeaponScale(null);
    setSocket(getHandSocket(facing));
    setWeaponScaleState(getWeaponScale());
  }, [facing]);

  const headIsOverridden = JSON.stringify(calib) !== JSON.stringify({ ...DEFAULT_HEAD_CALIBRATION });

  const headSliders: { key: keyof HeadCalibrationConfig; label: string; min: number; max: number; step: number; desc: string }[] = [
    { key: 'scaleRatio', label: 'Escala Head', min: 0.4, max: 2.2, step: 0.01, desc: 'Tamaño relativo del head al body (chibi base 0.44)' },
    { key: 'overlap', label: 'Overlap Cuello', min: -10, max: 80, step: 1, desc: 'Cuánto hunde el mentón en el pecho (más = cabeza más baja)' },
    { key: 'offsetY', label: 'Offset Vertical', min: -60, max: 60, step: 1, desc: 'Mueve la cabeza arriba/abajo en ESTA vista' },
    { key: 'offsetX', label: 'Offset Horizontal', min: -20, max: 20, step: 1, desc: 'Posición X del head en ESTA vista (píxeles)' },
  ];

  const socketSliders: { key: 'x' | 'y' | 'angleDeg'; label: string; min: number; max: number; step: number; desc: string }[] = [
    { key: 'x', label: 'Socket X', min: 0, max: 1, step: 0.01, desc: 'Horizontal relativo del body (0 izq, 1 der) en ESTA vista' },
    { key: 'y', label: 'Socket Y', min: 0, max: 1, step: 0.01, desc: 'Vertical relativo del body (0 cuello, 1 pies) en ESTA vista' },
    { key: 'angleDeg', label: 'Ángulo', min: -360, max: 360, step: 1, desc: 'Rotación del arma (0 = hoja hacia arriba)' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Calibración de Sprites"
      icon={<Sliders className="w-5 h-5 text-cyan-400" />}
      size="sm"
      accent="#06b6d4"
      footer={
        <div className="p-3 border-t border-white/10 hud-blur flex items-center justify-between bg-slate-900/90">
          <span className="text-[11px] text-slate-400 font-pixel flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            Guardado en localStorage (por vista)
          </span>
          <button
            onClick={handleClose}
            className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition active:scale-95"
          >
            Aceptar
          </button>
        </div>
      }
    >
      <div className="p-4 flex flex-col gap-4">
        {/* Tabs */}
        <div className="flex gap-1.5">
          <button
            onClick={() => setTab('cabeza')}
            className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition active:scale-95 ${
              tab === 'cabeza'
                ? 'bg-cyan-500/90 text-slate-950 border-cyan-400'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <User className="w-3.5 h-3.5" /> Cabeza
          </button>
          <button
            onClick={() => setTab('arma')}
            className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition active:scale-95 ${
              tab === 'arma'
                ? 'bg-cyan-500/90 text-slate-950 border-cyan-400'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Sword className="w-3.5 h-3.5" /> Arma
          </button>
        </div>

        {/* Live preview */}
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-xl border border-slate-700/60 bg-[radial-gradient(circle_at_center,#0f172a,#020617)] p-1 flex items-center justify-center">
            <canvas
              ref={previewRef}
              width={PREVIEW_SIZE * 1.5}
              height={PREVIEW_SIZE}
              className="[image-rendering:pixelated] rounded-lg w-full h-auto"
            />
          </div>
          {/* Facing selector: también define QUÉ vista se calibra */}
          <div className="flex gap-1.5">
            {FACING_ORDER.map((f) => (
              <button
                key={f}
                onClick={() => switchFacing(f)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1 transition active:scale-95 ${
                  facing === f
                    ? 'bg-cyan-500/90 text-slate-950 border-cyan-400'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {FACING_ICON[f]}
                {FACING_LABEL[f]}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-slate-500 font-pixel -mt-1">
            Los sliders editan SOLO la vista seleccionada ({FACING_LABEL[facing]})
          </span>
        </div>

        {tab === 'cabeza' ? (
          <>
            {headSliders.map(({ key, label, min, max, step, desc }) => (
              <div key={key} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 font-medieval">{label}</label>
                  <span className="text-[11px] font-mono text-cyan-400 bg-slate-800 px-2 py-0.5 rounded">
                    {typeof calib[key] === 'number' ? calib[key].toFixed(step < 1 ? 2 : 0) : '—'}
                  </span>
                </div>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={calib[key] ?? 0}
                  onChange={(e) => updateHead(key, parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-cyan-500"
                />
                <span className="text-[10px] text-slate-500 font-pixel">{desc}</span>
              </div>
            ))}

            <div className="flex gap-2">
              <button
                onClick={resetHeadFacing}
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold text-xs transition active:scale-95 flex items-center justify-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset vista ({FACING_LABEL[facing]})
              </button>
              <button
                onClick={resetHeadAll}
                className="flex-1 px-3 py-1.5 rounded-xl bg-red-900/70 hover:bg-red-800 text-red-200 font-bold text-xs transition active:scale-95 flex items-center justify-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset todo
              </button>
            </div>

            <div className="mt-1 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <div className="text-[10px] text-slate-400 font-pixel mb-2">
                Valores de {FACING_LABEL[facing]}{headIsOverridden ? '' : ' (defaults)'}:
              </div>
              <pre className="text-[11px] text-slate-300 font-mono whitespace-pre-wrap">
{JSON.stringify(calib, null, 2)}
              </pre>
            </div>
          </>
        ) : (
          <>
            {socketSliders.map(({ key, label, min, max, step, desc }) => (
              <div key={key} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 font-medieval">{label}</label>
                  <span className="text-[11px] font-mono text-cyan-400 bg-slate-800 px-2 py-0.5 rounded">
                    {socket[key].toFixed(step < 1 ? step < 0.1 ? 2 : 1 : 0)}
                  </span>
                </div>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={socket[key]}
                  onChange={(e) => updateSocket(key, parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-cyan-500"
                />
                <span className="text-[10px] text-slate-500 font-pixel">{desc}</span>
              </div>
            ))}

            {/* Escala global del arma */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 font-medieval">Escala Arma (global)</label>
                <span className="text-[11px] font-mono text-cyan-400 bg-slate-800 px-2 py-0.5 rounded">
                  {weaponScale.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min={0.2}
                max={1.2}
                step={0.01}
                value={weaponScale}
                onChange={(e) => updateWeaponScale(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-cyan-500"
              />
              <span className="text-[10px] text-slate-500 font-pixel">
                Alto del arma como fracción del cuerpo (default {WEAPON_HEIGHT_RATIO})
              </span>
            </div>

            {/* Toggles */}
            <div className="flex gap-2">
              <button
                onClick={() => updateSocket('flipX', !socket.flipX)}
                className={`flex-1 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition active:scale-95 ${
                  socket.flipX
                    ? 'bg-cyan-500/90 text-slate-950 border-cyan-400'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                Espejo H: {socket.flipX ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={() => updateSocket('behindBody', !socket.behindBody)}
                className={`flex-1 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition active:scale-95 ${
                  socket.behindBody
                    ? 'bg-cyan-500/90 text-slate-950 border-cyan-400'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                Detrás del cuerpo: {socket.behindBody ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={resetWeaponFacing}
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold text-xs transition active:scale-95 flex items-center justify-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset vista ({FACING_LABEL[facing]})
              </button>
              <button
                onClick={resetWeaponAll}
                className="flex-1 px-3 py-1.5 rounded-xl bg-red-900/70 hover:bg-red-800 text-red-200 font-bold text-xs transition active:scale-95 flex items-center justify-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset todo
              </button>
            </div>

            <div className="mt-1 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <div className="text-[10px] text-slate-400 font-pixel mb-2">Socket de {FACING_LABEL[facing]}:</div>
              <pre className="text-[11px] text-slate-300 font-mono whitespace-pre-wrap">
{JSON.stringify(socket, null, 2)}
              </pre>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
