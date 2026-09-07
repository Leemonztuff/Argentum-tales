import React, { useState, useCallback } from 'react';
import { Sliders, RotateCcw, CheckCircle2 } from 'lucide-react';
import { Modal, useUIStore } from '../ui';
import { getHeadCalibration, setHeadCalibration, DEFAULT_HEAD_CALIBRATION, HeadCalibrationConfig } from '../engine/Game3DRenderer';

export const HeadCalibrationUI: React.FC = () => {
  const isOpen = useUIStore((s) => s.openModals.headCalibration);
  const handleClose = useCallback(() => useUIStore.getState().closeModal('headCalibration'), []);

  const [calib, setCalib] = useState<HeadCalibrationConfig>(() => getHeadCalibration());

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
    { key: 'scaleRatio', label: 'Escala Head', min: 0.6, max: 2.0, step: 0.01, desc: 'Tamaño relativo del head al body' },
    { key: 'offsetY', label: 'Offset Vertical', min: -40, max: 40, step: 1, desc: 'Posición Y del head (píxeles)' },
    { key: 'offsetX', label: 'Offset Horizontal', min: -20, max: 20, step: 1, desc: 'Posición X del head (píxeles)' },
    { key: 'overlap', label: 'Overlap Cuello', min: 0, max: 20, step: 1, desc: 'Solapamiento head-body en el cuello' },
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
          Ajusta la composición del sprite del jugador (body + head). Los cambios se aplican en tiempo real.
        </p>

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
