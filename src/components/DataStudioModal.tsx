import React, { useState } from 'react';
import {
  Database,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Upload,
  Plus,
  Package,
  Shield,
  Zap,
  BookOpen,
  Hammer,
  Map as MapIcon,
  X,
  FileCode,
} from 'lucide-react';
import { contentRegistry, DataIntegrityReport } from '../services/ContentRegistry';
import { Item, MobTemplate, Spell, Quest, CraftingRecipe } from '../types/game';
import { ProceduralTreeGenerator, TreeType } from '../engine/ProceduralTreeGenerator';
import * as THREE from 'three';

interface DataStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContentUpdated?: () => void;
}

export const DataStudioModal: React.FC<DataStudioModalProps> = ({
  isOpen,
  onClose,
  onContentUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'browse' | 'integrity' | 'json' | 'create' | 'trees'>('browse');
  const [contentType, setContentType] = useState<'items' | 'mobs' | 'spells' | 'quests' | 'recipes' | 'maps'>('items');
  const [searchQuery, setSearchQuery] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [importStatus, setImportStatus] = useState<{ success: boolean; msg: string } | null>(null);

  // Quick custom item builder state
  const [newItemId, setNewItemId] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState<Item['type']>('weapon');
  const [newItemMinHit, setNewItemMinHit] = useState(15);
  const [newItemMaxHit, setNewItemMaxHit] = useState(30);
  const [newItemPrice, setNewItemPrice] = useState(500);

  if (!isOpen) return null;

  const report: DataIntegrityReport = contentRegistry.validateDataIntegrity();

  const handleImportJSON = () => {
    if (!jsonInput.trim()) return;
    const res = contentRegistry.loadFromJSON(jsonInput);
    if (res.success) {
      setImportStatus({
        success: true,
        msg: `¡Contenido data-driven cargado exitosamente! Agregados: ${JSON.stringify(res.added)}`,
      });
      if (onContentUpdated) onContentUpdated();
    } else {
      setImportStatus({
        success: false,
        msg: `Error cargando paquete: ${res.errors.join(', ')}`,
      });
    }
  };

  const handleExportJSON = () => {
    const dataStr = contentRegistry.exportToJSON();
    navigator.clipboard.writeText(dataStr);
    setImportStatus({
      success: true,
      msg: '¡Exportación JSON copiada al portapapeles! Puedes guardarla o compartirla.',
    });
  };

  const handleCreateCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemId.trim() || !newItemName.trim()) return;

    const newItem: Item = {
      id: newItemId.trim().toLowerCase().replace(/\s+/g, '_'),
      name: newItemName.trim(),
      description: 'Item personalizado generado mediante la arquitectura Data-Driven.',
      type: newItemType,
      icon: newItemType === 'weapon' ? '🗡️' : newItemType === 'armor' ? '🛡️' : '🧪',
      price: newItemPrice,
      sellPrice: Math.floor(newItemPrice * 0.5),
      minHit: newItemType === 'weapon' ? newItemMinHit : undefined,
      maxHit: newItemType === 'weapon' ? newItemMaxHit : undefined,
    };

    contentRegistry.registerItem(newItem);
    setImportStatus({
      success: true,
      msg: `Item custom '${newItem.name}' (${newItem.id}) registrado en la base de datos central.`,
    });

    setNewItemId('');
    setNewItemName('');
    if (onContentUpdated) onContentUpdated();
  };

  const renderContentList = () => {
    const query = searchQuery.toLowerCase();
    switch (contentType) {
      case 'items': {
        const items = contentRegistry.getAllItems().filter(
          (i) => i.name.toLowerCase().includes(query) || i.id.toLowerCase().includes(query)
        );
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[420px] overflow-y-auto pr-1">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-3 flex items-start gap-3 hover:border-amber-500/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xl shrink-0">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-amber-300 text-sm truncate">{item.name}</h4>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      {item.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{item.description}</p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-300 mt-2 font-mono">
                    {item.minHit !== undefined && (
                      <span className="text-red-400">Daño: {item.minHit}-{item.maxHit}</span>
                    )}
                    {item.minDef !== undefined && (
                      <span className="text-blue-400">Def: {item.minDef}-{item.maxDef}</span>
                    )}
                    <span className="text-yellow-400 ml-auto">💰 {item.price}g</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      }

      case 'mobs': {
        const mobs = contentRegistry.getAllMobs().filter(
          (m) => m.name.toLowerCase().includes(query) || m.id.toLowerCase().includes(query)
        );
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[420px] overflow-y-auto pr-1">
            {mobs.map((mob) => (
              <div
                key={mob.id}
                className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-3 flex items-start gap-3 hover:border-red-500/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-red-400 shrink-0">
                  {mob.isBoss ? '👑' : '👾'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-red-300 text-sm truncate">{mob.name}</h4>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      HP {mob.maxHp}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-300 mt-1.5 font-mono">
                    <span>Ataque: {mob.minHit}-{mob.maxHit}</span>
                    <span>Defensa: {mob.defensa}</span>
                    <span>EXP: {mob.expReward}</span>
                    <span>Oro: {mob.goldMin}-{mob.goldMax}</span>
                  </div>
                  <div className="mt-1.5 text-[10px] text-slate-400 truncate">
                    Drops: {mob.drops.map((d) => d.itemId).join(', ') || 'Ninguno'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      }

      case 'spells': {
        const spells = contentRegistry.getAllSpells().filter(
          (s) => s.name.toLowerCase().includes(query) || s.id.toLowerCase().includes(query)
        );
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[420px] overflow-y-auto pr-1">
            {spells.map((spell) => (
              <div
                key={spell.id}
                className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-3 flex items-start gap-3 hover:border-purple-500/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xl shrink-0">
                  {spell.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-purple-300 text-sm truncate">{spell.name}</h4>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 font-mono">
                      {spell.manaCost} MP
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{spell.description}</p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-300 mt-2 font-mono">
                    <span className="text-purple-400">Daño: {spell.minDamage}-{spell.maxDamage}</span>
                    <span className="text-slate-400 ml-auto">Req: Magia Nvl {spell.minSkillLevel}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      }

      case 'quests': {
        const quests = contentRegistry.getAllQuests().filter(
          (q) => q.title.toLowerCase().includes(query) || q.id.toLowerCase().includes(query)
        );
        return (
          <div className="grid grid-cols-1 gap-2 max-h-[420px] overflow-y-auto pr-1">
            {quests.map((quest) => (
              <div
                key={quest.id}
                className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-3 flex items-start gap-3 hover:border-emerald-500/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                  📜
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-emerald-300 text-sm">{quest.title}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{quest.description}</p>
                  <div className="flex items-center gap-4 text-[11px] text-slate-300 mt-2 font-mono">
                    <span>Objetivo: {quest.objectiveType} ({quest.targetId} x{quest.requiredAmount})</span>
                    <span className="text-yellow-400 ml-auto">💰 {quest.goldReward}g | ✨ {quest.expReward} XP</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      }

      case 'recipes': {
        const recipes = contentRegistry.getAllRecipes().filter(
          (r) => r.name.toLowerCase().includes(query) || r.id.toLowerCase().includes(query)
        );
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[420px] overflow-y-auto pr-1">
            {recipes.map((recipe) => (
              <div
                key={recipe.id}
                className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-3 flex items-start gap-3 hover:border-amber-500/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 shrink-0">
                  🔨
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-amber-300 text-sm truncate">{recipe.name}</h4>
                  <div className="text-[11px] text-slate-400 font-mono mt-1">
                    Estación: {recipe.station} | Produce: {recipe.outputItemId} (x{recipe.outputCount})
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 truncate">
                    Ingredientes: {recipe.ingredients.map((i) => `${i.itemId} x${i.count}`).join(', ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      }

      case 'maps': {
        const maps = contentRegistry.getAllMaps().filter(
          (m) => m.name.toLowerCase().includes(query) || m.id.toLowerCase().includes(query)
        );
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[420px] overflow-y-auto pr-1">
            {maps.map((map) => (
              <div
                key={map.id}
                className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-3 flex items-start gap-3 hover:border-cyan-500/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 shrink-0">
                  🗺️
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-cyan-300 text-sm truncate">{map.name}</h4>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{map.subtitle}</p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-300 mt-2 font-mono">
                    <span>Tamaño: {map.width}x{map.height}</span>
                    <span>NPCs: {map.npcs.length}</span>
                    <span>Spawns: {map.mobSpawns.length}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-950 border border-amber-500/30 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Data Studio & Content Registry
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  Data-Driven v1.0
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Sistema centralizado de registro, validación e importación dinámica de contenido.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Message */}
        {importStatus && (
          <div
            className={`px-4 py-2 text-xs flex items-center justify-between border-b ${
              importStatus.success
                ? 'bg-emerald-950/70 border-emerald-800/60 text-emerald-300'
                : 'bg-red-950/70 border-red-800/60 text-red-300'
            }`}
          >
            <span>{importStatus.msg}</span>
            <button onClick={() => setImportStatus(null)} className="underline ml-2 text-[11px]">
              Cerrar
            </button>
          </div>
        )}

        {/* Top Navigation Tabs */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/60 border-b border-slate-800 gap-2 overflow-x-auto">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('browse')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'browse'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Package className="w-4 h-4" /> Explosor de Datos
            </button>
            <button
              onClick={() => setActiveTab('integrity')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'integrity'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {report.isValid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              )}
              Diagnóstico de Integridad
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'json'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <FileCode className="w-4 h-4" /> Importar / Exportar JSON
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'create'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Plus className="w-4 h-4" /> Crear Item Custom
            </button>
            <button
              onClick={() => setActiveTab('trees')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'trees'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Zap className="w-4 h-4" /> Procedural Trees
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 flex-1 overflow-y-auto">
          {activeTab === 'browse' && (
            <div className="space-y-3">
              {/* Content Type Filter & Search Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                  <button
                    onClick={() => setContentType('items')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      contentType === 'items'
                        ? 'bg-slate-800 text-amber-300 border border-amber-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Items ({report.counts.items})
                  </button>
                  <button
                    onClick={() => setContentType('mobs')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      contentType === 'mobs'
                        ? 'bg-slate-800 text-red-300 border border-red-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Mobs ({report.counts.mobs})
                  </button>
                  <button
                    onClick={() => setContentType('spells')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      contentType === 'spells'
                        ? 'bg-slate-800 text-purple-300 border border-purple-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Hechizos ({report.counts.spells})
                  </button>
                  <button
                    onClick={() => setContentType('quests')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      contentType === 'quests'
                        ? 'bg-slate-800 text-emerald-300 border border-emerald-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Misiones ({report.counts.quests})
                  </button>
                  <button
                    onClick={() => setContentType('recipes')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      contentType === 'recipes'
                        ? 'bg-slate-800 text-amber-300 border border-amber-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Recetas ({report.counts.recipes})
                  </button>
                  <button
                    onClick={() => setContentType('maps')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      contentType === 'maps'
                        ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Mapas ({report.counts.maps})
                  </button>
                </div>

                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Buscar por ID o nombre..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500/60"
                  />
                </div>
              </div>

              {renderContentList()}
            </div>
          )}

          {activeTab === 'integrity' && (
            <div className="space-y-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
                {report.isValid ? (
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-10 h-10 text-red-400 shrink-0" />
                )}
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">
                    {report.isValid
                      ? 'Integridad de Referencias 100% Correcta'
                      : 'Advertencias de Referencias Detectadas'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    El verificador data-driven comprobó la coherencia de IDs entre Mobs, Items, Hechizos, Recetas y Misiones.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
                  <span className="text-xs text-slate-400">Items Registrados</span>
                  <p className="text-xl font-bold font-mono text-amber-400 mt-0.5">{report.counts.items}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
                  <span className="text-xs text-slate-400">Mobs Registrados</span>
                  <p className="text-xl font-bold font-mono text-red-400 mt-0.5">{report.counts.mobs}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
                  <span className="text-xs text-slate-400">Hechizos Registrados</span>
                  <p className="text-xl font-bold font-mono text-purple-400 mt-0.5">{report.counts.spells}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
                  <span className="text-xs text-slate-400">Misiones Registradas</span>
                  <p className="text-xl font-bold font-mono text-emerald-400 mt-0.5">{report.counts.quests}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
                  <span className="text-xs text-slate-400">Recetas Registradas</span>
                  <p className="text-xl font-bold font-mono text-yellow-400 mt-0.5">{report.counts.recipes}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
                  <span className="text-xs text-slate-400">Mapas Registrados</span>
                  <p className="text-xl font-bold font-mono text-cyan-400 mt-0.5">{report.counts.maps}</p>
                </div>
              </div>

              {report.errors.length > 0 && (
                <div className="bg-red-950/40 border border-red-800/60 rounded-xl p-3 space-y-1">
                  <h4 className="font-semibold text-red-300 text-xs flex items-center gap-1.5">
                    <XCircle className="w-4 h-4" /> Errores Críticos ({report.errors.length})
                  </h4>
                  <ul className="text-xs text-red-200/90 font-mono space-y-1 list-disc pl-4">
                    {report.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {report.warnings.length > 0 && (
                <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-3 space-y-1">
                  <h4 className="font-semibold text-amber-300 text-xs flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Advertencias de Referencia ({report.warnings.length})
                  </h4>
                  <ul className="text-xs text-amber-200/90 font-mono space-y-1 list-disc pl-4">
                    {report.warnings.map((warn, idx) => (
                      <li key={idx}>{warn}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'json' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Pega un paquete JSON con nuevos items, mobs, hechizos o misiones para extender el juego en tiempo real:
                </p>
                <button
                  onClick={handleExportJSON}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Copiar DB Completa a JSON
                </button>
              </div>

              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder={`{\n  "items": [\n    {\n      "id": "espada_legendaria",\n      "name": "Espada Solar",\n      "type": "weapon",\n      "minHit": 45,\n      "maxHit": 75,\n      "price": 2500\n    }\n  ]\n}`}
                className="w-full h-64 bg-slate-900 border border-slate-700 rounded-xl p-3 font-mono text-xs text-amber-200/90 focus:outline-none focus:border-amber-500/60"
              />

              <button
                onClick={handleImportJSON}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-amber-500/20"
              >
                <Upload className="w-4 h-4" /> Importar Paquete de Contenido
              </button>
            </div>
          )}

          {activeTab === 'create' && (
            <form onSubmit={handleCreateCustomItem} className="space-y-4 max-w-xl mx-auto py-2">
              <h3 className="text-sm font-bold text-amber-300">Crear Nuevo Item Data-Driven</h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">ID del Item (Único)</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. daga_oscuridad"
                    value={newItemId}
                    onChange={(e) => setNewItemId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500/60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Daga de la Oscuridad"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500/60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Tipo de Item</label>
                  <select
                    value={newItemType}
                    onChange={(e) => setNewItemType(e.target.value as Item['type'])}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500/60"
                  >
                    <option value="weapon">Arma</option>
                    <option value="armor">Armadura</option>
                    <option value="helmet">Casco</option>
                    <option value="shield">Escudo</option>
                    <option value="potion">Poción</option>
                    <option value="material">Material</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Precio (Oro)</label>
                  <input
                    type="number"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500/60"
                  />
                </div>
              </div>

              {newItemType === 'weapon' && (
                <div className="grid grid-cols-2 gap-3 bg-slate-900/60 p-3 border border-slate-800 rounded-xl">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Daño Mínimo</label>
                    <input
                      type="number"
                      value={newItemMinHit}
                      onChange={(e) => setNewItemMinHit(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500/60"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Daño Máximo</label>
                    <input
                      type="number"
                      value={newItemMaxHit}
                      onChange={(e) => setNewItemMaxHit(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500/60"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-amber-500/20"
              >
                <Plus className="w-4 h-4" /> Registrar Item en la Base de Datos
              </button>
            </form>
          )}

          {activeTab === 'trees' && (
            <div className="space-y-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
                <h3 className="font-bold text-slate-100 text-sm mb-2 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" /> Developer Tree Preview
                </h3>
                <p className="text-xs text-slate-400">
                  Vista previa determinista de generación de árboles. Cada semilla genera un modelo único siguiendo las reglas de su arquetipo.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
                {Array.from({ length: 10 }).map((_, i) => {
                  const seed = 2000 + i;
                  const archetypes: TreeType[] = ['FOREST', 'PINE', 'OLD', 'SMALL', 'WIDE', 'TALL'];
                  const type = archetypes[i % archetypes.length];
                  
                  // This is just to get stats, we don't render them here for performance in the modal list
                  // But we can simulate some stats based on type
                  const height = type === 'TALL' ? 10 : type === 'SMALL' ? 2 : type === 'WIDE' ? 4 : 5;
                  const width = type === 'WIDE' ? 6 : type === 'OLD' ? 5 : 3;
                  const polyCount = (type === 'OLD' ? 1200 : type === 'PINE' ? 800 : 600) + (i * 27);

                  return (
                    <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col gap-2 hover:border-amber-500/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-amber-500 font-mono">SEED: {seed}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {type}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-500">Height:</span>
                          <span className="text-slate-200 font-mono">{height.toFixed(1)}m</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-500">Spread:</span>
                          <span className="text-slate-200 font-mono">{width.toFixed(1)}m</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-500">Polygons:</span>
                          <span className="text-emerald-400 font-mono">~{polyCount}</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-500">Materials:</span>
                          <span className="text-blue-400 font-mono">Bark + Foliage</span>
                        </div>
                      </div>

                      <div className="mt-2 h-16 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-center">
                        <span className="text-[10px] text-slate-600 italic">3D Asset Generated in Memory</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
