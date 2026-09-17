import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Save, Plus, Shirt, Search, Image as ImageIcon } from 'lucide-react';
import { Modal, ItemIcon, useUIStore } from '../ui';
import { contentRegistry } from '../services/ContentRegistry';
import { Item, ItemType, ItemRarity } from '../types/game';
import { SPRITESHEET_INDEX_BODIES, SpritesheetEntry } from '../data/spritesheetIndex';

const RARITIES: ItemRarity[] = ['comun', 'poco_comun', 'raro', 'epico', 'legendario'];
const ITEM_TYPES: ItemType[] = [
  'weapon', 'shield', 'helmet', 'armor', 'boots', 'ring', 'amulet', 'potion', 'arrow', 'material', 'quest',
];
const STAT_KEYS = ['fuerza', 'agilidad', 'inteligencia', 'constitucion', 'carisma'] as const;

const MAGENTA_TOLERANCE = 60;
function applyMagentaKey(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    if (r > 200 && g < 80 && b > 200 && Math.abs(r - b) < MAGENTA_TOLERANCE) {
      d[i + 3] = 0;
    }
  }
  ctx.putImageData(imgData, 0, 0);
}

const number = (v: string): number | undefined => {
  if (v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

interface DraftItem {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  icon: string;
  iconPath: string;
  price: string;
  sellPrice: string;
  weight: string;
  spriteSheet: string;
  stackable: boolean;
  rarity: '' | ItemRarity;

  minHit: string;
  maxHit: string;
  range: string;
  weaponType: '' | NonNullable<Item['weaponType']>;
  baseIntervalMs: string;
  punteriaBonus: string;

  minDef: string;
  maxDef: string;
  blockChanceBonus: string;
  evasionBonus: string;
  magicResistBonus: string;

  fuerza: string;
  agilidad: string;
  inteligencia: string;
  constitucion: string;
  carisma: string;

  hpRestore: string;
  mpRestore: string;
  buffType: '' | NonNullable<Item['buffType']>;
  buffDurationSec: string;
}

const emptyDraft = (): DraftItem => ({
  id: '',
  name: '',
  description: '',
  type: 'armor',
  icon: '🛡️',
  iconPath: '',
  price: '50',
  sellPrice: '',
  weight: '',
  spriteSheet: '',
  stackable: false,
  rarity: '',
  minHit: '', maxHit: '', range: '', weaponType: '', baseIntervalMs: '', punteriaBonus: '',
  minDef: '', maxDef: '', blockChanceBonus: '', evasionBonus: '', magicResistBonus: '',
  fuerza: '', agilidad: '', inteligencia: '', constitucion: '', carisma: '',
  hpRestore: '', mpRestore: '', buffType: '', buffDurationSec: '',
});

const toDraft = (item: Item): DraftItem => {
  const d = emptyDraft();
  const str = (v: number | undefined) => (v === undefined ? '' : String(v));
  Object.assign(d, {
    id: item.id,
    name: item.name,
    description: item.description,
    type: item.type,
    icon: item.icon,
    iconPath: item.iconPath || '',
    price: String(item.price),
    sellPrice: str(item.sellPrice),
    weight: str(item.weight),
    spriteSheet: item.spriteSheet || '',
    stackable: !!item.stackable,
    rarity: item.rarity || '',
    minHit: str(item.minHit),
    maxHit: str(item.maxHit),
    range: str(item.range),
    weaponType: item.weaponType || '',
    baseIntervalMs: str(item.baseIntervalMs),
    punteriaBonus: str(item.punteriaBonus),
    minDef: str(item.minDef),
    maxDef: str(item.maxDef),
    blockChanceBonus: str(item.blockChanceBonus),
    evasionBonus: str(item.evasionBonus),
    magicResistBonus: str(item.magicResistBonus),
    fuerza: str(item.statsBonus?.fuerza),
    agilidad: str(item.statsBonus?.agilidad),
    inteligencia: str(item.statsBonus?.inteligencia),
    constitucion: str(item.statsBonus?.constitucion),
    carisma: str(item.statsBonus?.carisma),
    hpRestore: str(item.hpRestore),
    mpRestore: str(item.mpRestore),
    buffType: item.buffType || '',
    buffDurationSec: str(item.buffDurationSec),
  });
  return d;
};

const toItem = (d: DraftItem): Item => {
  const statsBonus: Partial<Record<(typeof STAT_KEYS)[number], number>> = {};
  for (const k of STAT_KEYS) {
    const v = number(d[k]);
    if (v !== undefined) statsBonus[k] = v;
  }
  return {
    id: d.id.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_'),
    name: d.name.trim(),
    description: d.description.trim(),
    type: d.type,
    icon: d.icon.trim() || '📦',
    ...(d.iconPath.trim() ? { iconPath: d.iconPath.trim() } : {}),
    price: number(d.price) ?? 0,
    ...(number(d.sellPrice) !== undefined ? { sellPrice: number(d.sellPrice)! } : { sellPrice: Math.floor((number(d.price) ?? 0) * 0.5) }),
    ...(number(d.weight) !== undefined ? { weight: number(d.weight)! } : {}),
    ...(d.spriteSheet ? { spriteSheet: d.spriteSheet } : {}),
    ...(d.stackable ? { stackable: true } : {}),
    ...(d.rarity ? { rarity: d.rarity } : {}),
    ...(number(d.minHit) !== undefined || number(d.maxHit) !== undefined
      ? {
          minHit: number(d.minHit) ?? 0,
          maxHit: number(d.maxHit) ?? 0,
        }
      : {}),
    ...(d.weaponType ? { weaponType: d.weaponType } : {}),
    ...(number(d.range) !== undefined ? { range: number(d.range)! } : {}),
    ...(number(d.baseIntervalMs) !== undefined ? { baseIntervalMs: number(d.baseIntervalMs)! } : {}),
    ...(number(d.punteriaBonus) !== undefined ? { punteriaBonus: number(d.punteriaBonus)! } : {}),
    ...(number(d.minDef) !== undefined || number(d.maxDef) !== undefined
      ? { minDef: number(d.minDef) ?? 0, maxDef: number(d.maxDef) ?? 0 }
      : {}),
    ...(number(d.blockChanceBonus) !== undefined ? { blockChanceBonus: number(d.blockChanceBonus)! } : {}),
    ...(number(d.evasionBonus) !== undefined ? { evasionBonus: number(d.evasionBonus)! } : {}),
    ...(number(d.magicResistBonus) !== undefined ? { magicResistBonus: number(d.magicResistBonus)! } : {}),
    ...(Object.keys(statsBonus).length > 0 ? { statsBonus } : {}),
    ...(number(d.hpRestore) !== undefined ? { hpRestore: number(d.hpRestore)! } : {}),
    ...(number(d.mpRestore) !== undefined ? { mpRestore: number(d.mpRestore)! } : {}),
    ...(d.buffType ? { buffType: d.buffType, buffDurationSec: number(d.buffDurationSec) ?? 10 } : {}),
  };
};

/** Dibuja el frame 0 (orientación "down") de un spritesheet 4x4 en un canvas. */
function FrameThumb({
  url,
  selected,
  onClick,
  size = 64,
}: {
  url: string;
  selected: boolean;
  onClick: () => void;
  size?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      const fw = Math.max(1, Math.floor(img.width / 4));
      const fh = Math.max(1, Math.floor(img.height / 4));
      ctx.imageSmoothingEnabled = false;
      const s = Math.min(canvas.width / fw, canvas.height / fh);
      const dw = Math.floor(fw * s);
      const dh = Math.floor(fh * s);
      ctx.drawImage(img, 0, 0, fw, fh, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh);
      applyMagentaKey(canvas);
    };
    img.src = url;
    return () => {
      img.onload = null;
    };
  }, [url]);
  return (
    <button
      type="button"
      onClick={onClick}
      title={url}
      className={`aspect-square flex items-center justify-center rounded-lg border transition-colors ${
        selected
          ? 'border-amber-400 bg-amber-500/15 shadow-lg shadow-amber-500/10'
          : 'border-slate-700 bg-slate-900 hover:border-amber-500/50'
      }`}
    >
      <canvas ref={canvasRef} width={size} height={size} className="max-w-full max-h-full" />
    </button>
  );
}

const inputCls =
  'w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500/60';
const labelCls = 'block text-[11px] font-medium text-slate-400 mb-1';

export const ObjectEditorModal: React.FC = () => {
  const isOpen = useUIStore((s) => s.openModals.objectEditor);
  const editingItemId = useUIStore((s) => s.editingItemId);
  const handleClose = () => useUIStore.getState().closeObjectEditor();

  const [draft, setDraft] = useState<DraftItem>(emptyDraft());
  const [sheetSearch, setSheetSearch] = useState('');
  const [status, setStatus] = useState<{ success: boolean; msg: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (editingItemId) {
      const item = contentRegistry.getItem(editingItemId);
      if (item) {
        setDraft(toDraft(item));
        setStatus(null);
        return;
      }
    }
    setDraft(emptyDraft());
    setStatus(null);
  }, [isOpen, editingItemId]);

  const set = <K extends keyof DraftItem>(k: K, v: DraftItem[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const previewItem: Item = useMemo(() => toItem(draft), [draft]);

  const isNew = !editingItemId;
  const isEquip = ['weapon', 'shield', 'helmet', 'armor', 'boots'].includes(draft.type);
  const isArmor = draft.type === 'armor' || draft.type === 'helmet' || draft.type === 'boots' || draft.type === 'shield';
  const isWeapon = draft.type === 'weapon';
  const isConsumable = draft.type === 'potion';

  const filteredSheets = useMemo(() => {
    const q = sheetSearch.toLowerCase();
    return SPRITESHEET_INDEX_BODIES.filter(
      (s) => !q || s.url.toLowerCase().includes(q)
    );
  }, [sheetSearch]);

  const handleSave = () => {
    if (!draft.name.trim()) {
      setStatus({ success: false, msg: 'El nombre es obligatorio.' });
      return;
    }
    const item = toItem(draft);
    if (!item.id) {
      setStatus({ success: false, msg: 'El ID no es válido.' });
      return;
    }
    contentRegistry.updateItem(item.id, item);
    setStatus({ success: true, msg: `'${item.name}' guardado en el registro (${item.id}).` });
    setTimeout(handleClose, 600);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editingItemId ? `Editor de Objetos — ${editingItemId}` : 'Editor de Objetos — Nuevo'}
      icon={<Shirt className="w-5 h-5 text-amber-400" />}
      size="xl"
      accent="#C89B3C"
    >
      <div className="p-4 space-y-4">
        {/* Estado */}
        {status && (
          <div
            className={`px-4 py-2 text-xs rounded-xl border flex items-center justify-between ${
              status.success
                ? 'bg-emerald-950/70 border-emerald-800/60 text-emerald-300'
                : 'bg-red-950/70 border-red-800/60 text-red-300'
            }`}
          >
            <span>{status.msg}</span>
            <button onClick={() => setStatus(null)} className="underline ml-2 text-[11px]">
              Cerrar
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* COLUMNA PREVIEW */}
          <div className="lg:col-span-2 space-y-3">
            <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4" /> Spritesheet de Cuerpo (4x4, sin cabeza)
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                  {draft.spriteSheet ? draft.spriteSheet.split('/').pop() : '—'}
                </span>
              </div>

              {/* Preview grande */}
              <div className="flex items-center gap-3 bg-slate-950 rounded-xl border border-slate-800 p-3">
                <div className="w-24 h-24 shrink-0 border border-slate-700 rounded-lg bg-slate-900 overflow-hidden flex items-center justify-center">
                  {draft.spriteSheet ? (
                    <FrameThumb url={draft.spriteSheet} selected onClick={() => {}} size={96} />
                  ) : (
                    <ItemIcon item={previewItem} size="w-14 h-14" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-100 truncate">{draft.name || 'Sin nombre'}</p>
                  <p className="text-[11px] text-slate-400 truncate">{draft.description || 'Sin descripción'}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono">
                      {draft.type}
                    </span>
                    {draft.rarity && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-purple-300 font-mono">
                        {draft.rarity}
                      </span>
                    )}
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-yellow-300 font-mono">
                      💰 {number(draft.price) ?? 0}g
                    </span>
                    {draft.weight && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                        ⚖️ {draft.weight} kg
                      </span>
                    )}
                  </div>
                  {(previewItem.minDef !== undefined || previewItem.maxDef !== undefined) && (
                    <p className="text-[11px] text-blue-400 font-mono mt-1">
                      Defensa: {previewItem.minDef}-{previewItem.maxDef}
                    </p>
                  )}
                  {(previewItem.minHit !== undefined || previewItem.maxHit !== undefined) && (
                    <p className="text-[11px] text-red-400 font-mono mt-1">
                      Daño: {previewItem.minHit}-{previewItem.maxHit}
                    </p>
                  )}
                </div>
              </div>

              {/* Buscador + grid de spritesheets */}
              <div className="relative mt-3">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar spritesheet (ej. frame_000, archer...)"
                  value={sheetSearch}
                  onChange={(e) => setSheetSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500/60"
                />
              </div>
              <div className="mt-2 grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-[260px] overflow-y-auto pr-1">
                {filteredSheets.map((s: SpritesheetEntry) => (
                  <div key={s.url}>
                    <FrameThumb
                      url={s.url}
                      selected={draft.spriteSheet === s.url}
                      onClick={() => set('spriteSheet', s.url)}
                    />
                  </div>
                ))}
                {filteredSheets.length === 0 && (
                  <p className="col-span-full text-[11px] text-slate-500 italic py-3">
                    Sin resultados para "{sheetSearch}"
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* COLUMNA FORMULARIO */}
          <div className="lg:col-span-3 space-y-3">
            {/* Básico */}
            <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-3">
              <h3 className="text-xs font-bold text-amber-300 mb-2">General</h3>
              <div className="grid grid-cols-2 gap-3">
                {isNew && (
                  <div>
                    <label className={labelCls}>ID (único)</label>
                    <input
                      type="text"
                      value={draft.id}
                      onChange={(e) => set('id', e.target.value)}
                      placeholder="ej. armadura_dragon"
                      className={inputCls}
                    />
                  </div>
                )}
                <div>
                  <label className={labelCls}>Nombre</label>
                  <input
                    type="text"
                    value={draft.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="ej. Armadura del Dragón"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Tipo</label>
                  <select
                    value={draft.type}
                    onChange={(e) => set('type', e.target.value as ItemType)}
                    className={inputCls}
                  >
                    {ITEM_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Descripción</label>
                  <textarea
                    value={draft.description}
                    onChange={(e) => set('description', e.target.value)}
                    rows={2}
                    className={`${inputCls} resize-none`}
                  />
                </div>
                <div>
                  <label className={labelCls}>Icono (emoji)</label>
                  <input
                    type="text"
                    value={draft.icon}
                    onChange={(e) => set('icon', e.target.value)}
                    placeholder="🛡️"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Icono PNG (ruta, opcional)</label>
                  <input
                    type="text"
                    value={draft.iconPath}
                    onChange={(e) => set('iconPath', e.target.value)}
                    placeholder="/icons/armor.png"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Precio (oro)</label>
                  <input
                    type="number"
                    value={draft.price}
                    onChange={(e) => set('price', e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Precio de venta</label>
                  <input
                    type="number"
                    value={draft.sellPrice}
                    onChange={(e) => set('sellPrice', e.target.value)}
                    placeholder="vacío = 50% del precio"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Peso (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={draft.weight}
                    onChange={(e) => set('weight', e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Rareza</label>
                  <select
                    value={draft.rarity}
                    onChange={(e) => set('rarity', e.target.value as DraftItem['rarity'])}
                    className={inputCls}
                  >
                    <option value="">Auto (por precio)</option>
                    {RARITIES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-300 mt-2">
                  <input
                    type="checkbox"
                    checked={draft.stackable}
                    onChange={(e) => set('stackable', e.target.checked)}
                    className="accent-amber-500"
                  />
                  Apilable
                </label>
              </div>
            </div>

            {/* Equipamiento */}
            {isEquip && (
              <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-3">
                <h3 className="text-xs font-bold text-amber-300 mb-2">Atributos</h3>
                <div className="grid grid-cols-3 gap-3">
                  {isArmor && (
                    <>
                      <div>
                        <label className={labelCls}>Defensa min</label>
                        <input type="number" value={draft.minDef} onChange={(e) => set('minDef', e.target.value)} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Defensa max</label>
                        <input type="number" value={draft.maxDef} onChange={(e) => set('maxDef', e.target.value)} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Bonus evasión %</label>
                        <input type="number" value={draft.evasionBonus} onChange={(e) => set('evasionBonus', e.target.value)} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Block chance %</label>
                        <input type="number" value={draft.blockChanceBonus} onChange={(e) => set('blockChanceBonus', e.target.value)} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Resist. mágica %</label>
                        <input type="number" value={draft.magicResistBonus} onChange={(e) => set('magicResistBonus', e.target.value)} className={inputCls} />
                      </div>
                    </>
                  )}
                  {isWeapon && (
                    <>
                      <div>
                        <label className={labelCls}>Daño min</label>
                        <input type="number" value={draft.minHit} onChange={(e) => set('minHit', e.target.value)} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Daño max</label>
                        <input type="number" value={draft.maxHit} onChange={(e) => set('maxHit', e.target.value)} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Alcance</label>
                        <input type="number" value={draft.range} onChange={(e) => set('range', e.target.value)} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Tipo de arma</label>
                        <select
                          value={draft.weaponType}
                          onChange={(e) => set('weaponType', e.target.value as DraftItem['weaponType'])}
                          className={inputCls}
                        >
                          <option value="">—</option>
                          <option value="dagger">Daga</option>
                          <option value="sword">Espada</option>
                          <option value="axe">Hacha</option>
                          <option value="bow">Arco</option>
                          <option value="staff">Báculo</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Intervalo (ms)</label>
                        <input type="number" value={draft.baseIntervalMs} onChange={(e) => set('baseIntervalMs', e.target.value)} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Puntería bonus</label>
                        <input type="number" value={draft.punteriaBonus} onChange={(e) => set('punteriaBonus', e.target.value)} className={inputCls} />
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-3">
                  <label className={labelCls}>Bonus de atributos (stats)</label>
                  <div className="grid grid-cols-5 gap-2">
                    {STAT_KEYS.map((k) => (
                      <div key={k}>
                        <label className="text-[10px] text-slate-500">{k}</label>
                        <input
                          type="number"
                          value={draft[k]}
                          onChange={(e) => set(k, e.target.value)}
                          className={`${inputCls} px-2`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Efectos consumible */}
            {isConsumable && (
              <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-3">
                <h3 className="text-xs font-bold text-amber-300 mb-2">Efectos</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>HP restaurado</label>
                    <input type="number" value={draft.hpRestore} onChange={(e) => set('hpRestore', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>MP restaurado</label>
                    <input type="number" value={draft.mpRestore} onChange={(e) => set('mpRestore', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Buff</label>
                    <select
                      value={draft.buffType}
                      onChange={(e) => set('buffType', e.target.value as DraftItem['buffType'])}
                      className={inputCls}
                    >
                      <option value="">—</option>
                      <option value="speed">Velocidad</option>
                      <option value="strength">Fuerza</option>
                      <option value="invis">Invisibilidad</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Duración buff (s)</label>
                    <input type="number" value={draft.buffDurationSec} onChange={(e) => set('buffDurationSec', e.target.value)} className={inputCls} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-colors shadow-lg shadow-amber-500/20"
          >
            {isNew ? <Plus className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {isNew ? 'Crear item' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </Modal>
  );
};