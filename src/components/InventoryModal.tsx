import React, { useState } from 'react';
import { PlayerCharacter, Item, ItemType } from '../types/game';
import { X, Shield, Swords, Sparkles, Footprints, Trash2, ArrowUpCircle, Layers } from 'lucide-react';

interface InventoryModalProps {
  player: PlayerCharacter;
  onClose: () => void;
  onEquipItem: (item: Item, index: number) => void;
  onUnequipItem: (slot: keyof PlayerCharacter['equipment']) => void;
  onUseItem: (item: Item, index: number) => void;
  onDropItem: (index: number) => void;
  onConsolidateInventory?: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  player,
  onClose,
  onEquipItem,
  onUnequipItem,
  onUseItem,
  onDropItem,
  onConsolidateInventory,
}) => {
  const [selectedItem, setSelectedItem] = useState<{ item: Item; index?: number; isEquipped?: boolean; slot?: keyof PlayerCharacter['equipment'] } | null>(null);

  const eq = player.equipment;

  // Equipment slots configuration
  const equipSlots: Array<{ key: keyof PlayerCharacter['equipment']; label: string; placeholderIcon: string; item: Item | null }> = [
    { key: 'helmet', label: 'Casco', placeholderIcon: '🪖', item: eq.helmet },
    { key: 'amulet', label: 'Amuleto', placeholderIcon: '📿', item: eq.amulet },
    { key: 'weapon', label: 'Arma Principal', placeholderIcon: '⚔️', item: eq.weapon },
    { key: 'shield', label: 'Escudo / Secundaria', placeholderIcon: '🛡️', item: eq.shield },
    { key: 'armor', label: 'Armadura / Túnica', placeholderIcon: '🦺', item: eq.armor },
    { key: 'ring1', label: 'Anillo 1', placeholderIcon: '💍', item: eq.ring1 },
    { key: 'ring2', label: 'Anillo 2', placeholderIcon: '💍', item: eq.ring2 },
    { key: 'boots', label: 'Botas', placeholderIcon: '👢', item: eq.boots },
    { key: 'arrows', label: 'Carcaj de Flechas', placeholderIcon: '🎯', item: eq.arrows },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 bg-[#08080c]/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-4xl max-h-[94vh] sm:max-h-[90vh] hud-panel border border-amber-500/20 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto gold-glow">
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 sm:px-5 sm:py-3.5 border-b border-white/10 hud-blur">
          <div className="flex items-center gap-2">
            <span className="text-lg sm:text-xl">🎒</span>
            <h2 className="text-sm sm:text-lg font-bold font-medieval text-slate-100">Inventario y Equipamiento</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 sm:p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Content Layout */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-5">
          {/* Left Column: Equipment & Character Stats (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-3 sm:gap-4">
            {/* Equipment Grid */}
            <div className="hud-blur border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-inner">
              <h3 className="text-[11px] sm:text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 sm:mb-3">Equipo Activo</h3>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
                {equipSlots.map((slot) => (
                  <div
                    key={slot.key}
                    onClick={() => {
                      if (slot.item) {
                        setSelectedItem({ item: slot.item, isEquipped: true, slot: slot.key });
                      }
                    }}
                    className={`relative flex flex-col items-center justify-center h-14 sm:h-18 rounded-xl border transition cursor-pointer ${
                      slot.item
                        ? selectedItem?.item?.id === slot.item.id && selectedItem?.isEquipped
                          ? 'border-amber-400 bg-amber-950/40 amber-glow'
                          : 'border-white/10 bg-slate-900/80 hover:border-slate-500'
                        : 'border-dashed border-white/5 bg-[#08080c]/40'
                    }`}
                  >
                    {slot.item ? (
                      <>
                        <span className="text-xl sm:text-2xl drop-shadow">{slot.item.icon}</span>
                        <span className="text-[9px] sm:text-[10px] font-medium text-slate-300 truncate max-w-[70px] sm:max-w-[80px] text-center mt-0.5 sm:mt-1">
                          {slot.item.name}
                        </span>
                        {slot.item.count && slot.item.count > 1 && (
                          <span className="absolute top-1 right-1 sm:right-1.5 text-[8px] sm:text-[9px] font-bold text-amber-300 font-pixel">
                            x{slot.item.count}
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="text-base sm:text-xl opacity-30">{slot.placeholderIcon}</span>
                        <span className="text-[8px] sm:text-[9px] text-slate-500 mt-0.5">{slot.label}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Attributes & Stats Card */}
            <div className="hud-blur border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col gap-1.5 sm:gap-2 text-[11px] sm:text-xs shadow-inner">
              <h3 className="text-[11px] sm:text-xs font-bold text-sky-400 uppercase tracking-wider">Atributos del Héroe</h3>
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-slate-300">
                <div className="flex justify-between bg-slate-900/70 border border-white/5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg">
                  <span className="text-slate-400">Fuerza:</span>
                  <span className="font-bold text-amber-300">{player.stats.fuerza}</span>
                </div>
                <div className="flex justify-between bg-slate-900/70 border border-white/5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg">
                  <span className="text-slate-400">Agilidad:</span>
                  <span className="font-bold text-emerald-300">{player.stats.agilidad}</span>
                </div>
                <div className="flex justify-between bg-slate-900/70 border border-white/5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg">
                  <span className="text-slate-400">Inteligencia:</span>
                  <span className="font-bold text-sky-300">{player.stats.inteligencia}</span>
                </div>
                <div className="flex justify-between bg-slate-900/70 border border-white/5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg">
                  <span className="text-slate-400">Constitución:</span>
                  <span className="font-bold text-rose-300">{player.stats.constitucion}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: 20-Slot Bag & Item Details (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-3 sm:gap-4">
            {/* Bag Grid */}
            <div className="hud-blur border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex-1 shadow-inner">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h3 className="text-[11px] sm:text-xs font-bold text-amber-400 uppercase tracking-wider">Mochila (20 ranuras)</h3>
                <div className="flex items-center gap-2">
                  {onConsolidateInventory && (
                    <button
                      id="btn-consolidate-inventory"
                      onClick={onConsolidateInventory}
                      className="flex items-center gap-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[10px] sm:text-[11px] font-bold font-pixel px-2 py-0.5 rounded-lg transition"
                      title="Agrupar y apilar ítems duplicados"
                    >
                      <Layers className="w-3 h-3 text-amber-400" />
                      <span>Apilar</span>
                    </button>
                  )}
                  <span className="text-[10px] sm:text-xs font-pixel text-slate-400">
                    {player.inventory.filter((i) => i !== null).length} / 20
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 sm:gap-2">
                {player.inventory.map((item, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      if (item) {
                        setSelectedItem({ item, index, isEquipped: false });
                      } else {
                        setSelectedItem(null);
                      }
                    }}
                    className={`relative flex flex-col items-center justify-center h-14 sm:h-16 rounded-xl border transition cursor-pointer ${
                      item
                        ? selectedItem?.item?.id === item.id && !selectedItem?.isEquipped && selectedItem?.index === index
                          ? 'border-amber-400 bg-amber-950/50 shadow-lg amber-glow'
                          : 'border-white/10 bg-slate-900/80 hover:border-slate-500'
                        : 'border-dashed border-white/5 bg-[#08080c]/40'
                    }`}
                  >
                    {item && (
                      <>
                        <span className="text-xl sm:text-2xl drop-shadow">{item.icon}</span>
                        {item.count && item.count > 1 && (
                          <span className="absolute bottom-1 right-1 sm:right-1.5 bg-[#08080c]/90 text-amber-300 text-[9px] sm:text-[10px] font-bold font-pixel px-1 rounded border border-amber-500/20">
                            x{item.count}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Item Detail / Action Box */}
            {selectedItem?.item ? (
              <div className="hud-panel border border-amber-500/40 rounded-2xl p-4 flex flex-col gap-3 shadow-xl gold-glow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl p-2 bg-slate-900/90 border border-white/10 rounded-xl">
                      {selectedItem.item.icon}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-amber-200">{selectedItem.item.name}</h4>
                      <p className="text-xs text-slate-400 capitalize">{selectedItem.item.type}</p>
                    </div>
                  </div>
                  <span className="text-xs font-pixel font-bold text-amber-400">🪙 {selectedItem.item.price} Oro</span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{selectedItem.item.description}</p>

                {/* Stats details */}
                <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
                  {selectedItem.item.minHit !== undefined && (
                    <span className="bg-slate-900/80 px-2.5 py-1 rounded-lg border border-white/5">
                      Daño: <strong className="text-amber-400">{selectedItem.item.minHit} - {selectedItem.item.maxHit}</strong>
                    </span>
                  )}
                  {selectedItem.item.minDef !== undefined && (
                    <span className="bg-slate-900/80 px-2.5 py-1 rounded-lg border border-white/5">
                      Defensa: <strong className="text-sky-400">{selectedItem.item.minDef} - {selectedItem.item.maxDef}</strong>
                    </span>
                  )}
                  {selectedItem.item.blockChanceBonus !== undefined && (
                    <span className="bg-slate-900/80 px-2.5 py-1 rounded-lg border border-white/5">
                      Bloqueo: <strong className="text-emerald-400">+{selectedItem.item.blockChanceBonus}%</strong>
                    </span>
                  )}
                  {selectedItem.item.baseIntervalMs !== undefined && (
                    <span className="bg-slate-900/80 px-2.5 py-1 rounded-lg border border-white/5">
                      Intervalo: <strong className="text-purple-400">{selectedItem.item.baseIntervalMs} ms</strong>
                    </span>
                  )}
                  {selectedItem.item.hpRestore !== undefined && (
                    <span className="bg-slate-900/80 px-2.5 py-1 rounded-lg border border-white/5">
                      Restaura: <strong className="text-red-400">+{selectedItem.item.hpRestore} HP</strong>
                    </span>
                  )}
                  {selectedItem.item.mpRestore !== undefined && (
                    <span className="bg-slate-900/80 px-2.5 py-1 rounded-lg border border-white/5">
                      Restaura: <strong className="text-sky-400">+{selectedItem.item.mpRestore} MP</strong>
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                  {selectedItem.isEquipped ? (
                    <button
                      onClick={() => {
                        if (selectedItem.slot) onUnequipItem(selectedItem.slot);
                        setSelectedItem(null);
                      }}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-bold py-2.5 rounded-xl transition border border-white/5"
                    >
                      Desequipar
                    </button>
                  ) : (
                    <>
                      {['weapon', 'shield', 'helmet', 'armor', 'boots', 'ring', 'amulet', 'arrow'].includes(selectedItem.item.type) && (
                        <button
                          onClick={() => {
                            if (selectedItem.index !== undefined) onEquipItem(selectedItem.item, selectedItem.index);
                            setSelectedItem(null);
                          }}
                          className="flex-1 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 active:scale-95 text-white text-xs font-bold py-2.5 rounded-xl shadow-lg transition flex items-center justify-center gap-1.5"
                        >
                          <ArrowUpCircle className="w-4 h-4" /> Equipar
                        </button>
                      )}
                      {selectedItem.item.type === 'potion' && (
                        <button
                          onClick={() => {
                            if (selectedItem.index !== undefined) onUseItem(selectedItem.item, selectedItem.index);
                            setSelectedItem(null);
                          }}
                          className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white text-xs font-bold py-2.5 rounded-xl shadow-lg transition"
                        >
                          Usar / Beber
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (selectedItem.index !== undefined) onDropItem(selectedItem.index);
                          setSelectedItem(null);
                        }}
                        className="px-3 bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 text-xs font-bold py-2.5 rounded-xl transition"
                        title="Tirar objeto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-[#08080c]/50 border border-dashed border-white/5 rounded-2xl p-6 text-center text-xs text-slate-500">
                Selecciona un objeto para ver sus estadísticas o equiparlo.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
