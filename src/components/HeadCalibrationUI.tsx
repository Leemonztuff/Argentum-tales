import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Sliders, RotateCcw, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import { Modal, useUIStore } from '../ui';
import {
  getHeadCalibration,
  setHeadCalibration,
  DEFAULT_HEAD_CALIBRATION,
  HeadCalibrationConfig,
  getActiveRenderer,
} from '../engine/Game3DRenderer';
import { HEAD_SPRITES, NEW_BODY_SPRITES } from '../data/spritesheets';

type Facing = 'down' | 'left' | 'right' | 'up';

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

  const [calib, setCalib] = useState<HeadCalibrationConfig>(() => getHeadCalibration());
  const [facing, setFacing] = useState<Facing>('down');
  const previewRef = useRef<HTMLCanvasElement>(null);

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
    const composite = renderer.renderPlayerComposite(bodyUrl, headUrl, facing, 0);
    // Upright, pixel-art preview anchored at the feet (authoring feet row ≈ 0.946 h).
    const H = canvas.height;
    const scale = H / (composite.height * 0.95);
    const dw = Math.round(composite.width * scale);
    const dh = Math.round(composite.height * scale);
    const dx = Math.round((canvas.width - dw) / 2);
    const dy = Math.round(canvas.height - composite.height * 0.946 * scale);
    ctx.drawImage(composite, 0, 0, composite.width, composite.height, dx, dy, dw, dh);
  }, [facing]);

  // Re-render preview whenever calibration/facing/open state change.
  useEffect(() => {
    if (!isOpen) return;
    const id = requestAnimationFrame(() => {
      renderPreview();
      const id2 = requestAnimationFrame(renderPreview);
      return () => cancelAnimationFrame(id2);
    });
    return () => cancelAnimationFrame(id);
  }, [isOpen, calib, facing, renderPreview]);

  const update = useCallback((key: keyof HeadCalibrationConfig, value: number) => {
    setCalib((prev) => {
      const next = { ...prev, [key]: value };
      setHeadCalibration(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setCalib({ ...DEFAULT_HEAD_CALIBRATION });
    setHeadCalibration({ ...DEFAULT_HEAD_CALIBRATION });
  }, []);

  const sliders: { key: keyof HeadCalibrationConfig; label: string; min: number; max: number; step: number; desc: string }[] = [
    { key: 'scaleRatio', label: 'Escala Head', min: 0.4, max: 2.2, step: 0.01, desc: 'Tamaño relativo del head al body (chibi base 0.44)' },
    { key: 'overlap', label: 'Overlap Cuello', min: -10, max: 80, step: 1, desc: 'Cuánto hunde el mentón en el pecho (más = cabeza más baja)' },
    { key: 'offsetY', label: 'Offset Vertical', min: -60, max: 60, step: 1, desc: 'Mueve la cabeza arriba/abajo (la coronilla nunca se corta)' },
    { key: 'offsetX', label: 'Offset Horizontal', min: -20, max: 20, step: 1, desc: 'Posición X del head (píxeles)' },
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
            Guardado en localStorage
          </span>
          <div className="flex gap-2">
            <button
              onClick={reset}
              className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold text-xs transition active:scale-95 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
            <button
              onClick={handleClose}
              className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition active:scale-95"
            >
              Aceptar
            </button>
          </div>
        </div>
      }
    >
      <div className="p-4 flex flex-col gap-4">
        <p className="text-[11px] text-slate-400 font-pixel leading-relaxed">
          Preview en vivo del sprite compuesto (body + head). Los cambios se aplican en tiempo real.
        </p>

        {/* Live preview — no hace falta ver el juego a través del modal */}
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-xl border border-slate-700/60 bg-[radial-gradient(circle_at_center,#0f172a,#020617)] p-1 flex items-center justify-center">
            <canvas
              ref={previewRef}
              width={PREVIEW_SIZE * 1.5}
              height={PREVIEW_SIZE}
              className="[image-rendering:pixelated] rounded-lg w-full h-auto"
            />
          </div>
          <div className="flex gap-1.5">
            {FACING_ORDER.map((f) => (
              <button
                key={f}
                onClick={() => setFacing(f)}
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
          <span className="text-[10px] text-slate-500 font-pixel -mt-1">Misma escala en las 4 vistas</span>
        </div>

        {sliders.map(({ key, label, min, max, step, desc }) => (
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
              onChange={(e) => update(key, parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-cyan-500"
            />
            <span className="text-[10px] text-slate-500 font-pixel">{desc}</span>
          </div>
        ))}

        <div className="mt-2 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
          <div className="text-[10px] text-slate-400 font-pixel mb-2">Valores actuales:</div>
          <pre className="text-[11px] text-slate-300 font-mono whitespace-pre-wrap">
{JSON.stringify(calib, null, 2)}
          </pre>
        </div>
      </div>
    </Modal>
  );
};