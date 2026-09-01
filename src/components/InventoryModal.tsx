import React, { useState } from 'react';
import { useUIStore, Modal } from '../ui';
import { PlayerCharacter, Item, ItemType } from '../types/game';
import { Shield, Swords, Sparkles, Footprints, Trash2, ArrowUpCircle, Layers } from 'lucide-react';
import { getRarityMeta } from '../utils/itemRarity';

interface InventoryModalProps {
  player: PlayerCharacter;
  onClose?: () => void;
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

  const isOpen = useUIStore((s) => s.openModals.inventory);
  const handleClose = onClose ?? (() => useUIStore.getState().closeModal('inventory'));

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
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Inventario y Equipamiento"
      icon={<span>🎒</span>}
      size="xl"
      accent="#C89B3C"
    >
      {/* Content Layout */}
      <div className="p-3 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-5">
        {/* Left Column: Equipment & Character Stats (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-3 sm:gap-4">
          {/* Equipment Grid */}
          <div className="hud-blur border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-inner">
            <h3 className="text-[11px] sm:text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 sm:mb-3">Equipo Activo</h3>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
              {equipSlots.map((slot) => {
                const rarityMeta = slot.item ? getRarityMeta(slot.item) : null;
                return (
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
                          ? `border-amber-400 bg-amber-950/40 amber-glow ${rarityMeta?.glowClass ?? ''}`
                          : `${rarityMeta?.borderClass ?? 'border-white/10'} bg-slate-900/80 hover:border-slate-500 ${rarityMeta?.glowClass ?? ''}`
                        : 'border-dashed border-white/5 bg-[#08080c]/40'
                    }`}
                  >
                    {slot.item ? (
                      <>
                        {rarityMeta && (
                          <span
                            className="absolute top-0.5 left-0.5 text-[6px] sm:text-[7px] font-bold font-pixel px-1 rounded-sm leading-tight"
                            style={{ color: rarityMeta.color, backgroundColor: `${rarityMeta.color}20` }}
                            title={rarityMeta.label}
                          >
                            {rarityMeta.label}
                          </span>
                        )}
                        <span className="text-xl sm:text-2xl drop-shadow">{slot.item.icon}</span>
                        <span className={`text-[9px] sm:text-[10px] font-medium truncate max-w-[70px] sm:max-w-[80px] text-center mt-0.5 sm:mt-1 ${rarityMeta?.textClass ?? 'text-slate-300'}`}>
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
                );
              })}
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
              {player.inventory.map((item, index) => {
                const rarityMeta = item ? getRarityMeta(item) : null;
                return (
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
                          ? `border-amber-400 bg-amber-950/50 shadow-lg amber-glow ${rarityMeta?.glowClass ?? ''}`
                          : `${rarityMeta?.borderClass ?? 'border-white/10'} bg-slate-900/80 hover:border-slate-500 ${rarityMeta?.glowClass ?? ''}`
                        : 'border-dashed border-white/5 bg-[#08080c]/40'
                    }`}
                  >
                    {item && (
                      <>
                        {rarityMeta && (
                          <span
                            className="absolute top-0.5 left-0.5 text-[6px] sm:text-[7px] font-bold font-pixel px-0.5 rounded-sm leading-tight"
                            style={{ color: rarityMeta.color, backgroundColor: `${rarityMeta.color}20` }}
                            title={rarityMeta.label}
                          >
                            {rarityMeta.label}
                          </span>
                        )}
                        <span className="text-xl sm:text-2xl drop-shadow">{item.icon}</span>
                        {item.count && item.count > 1 && (
                          <span className="absolute bottom-1 right-1 sm:right-1.5 bg-[#08080c]/90 text-amber-300 text-[9px] sm:text-[10px] font-bold font-pixel px-1 rounded border border-amber-500/20">
                            x{item.count}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Item Detail / Action Box */}
          {selectedItem?.item ? (
            <Selected_item_detail
              item={selectedItem.item}
              isEquipped={selectedItem.isEquipped}
              slot={selectedItem.slot}
              index={selectedItem.index}
              onEquipItem={onEquipItem}
              onUnequipItem={onUnequipItem}
              onUseItem={onUseItem}
              onDropItem={onDropItem}
              onDeselect={() => setSelectedItem(null)}
            />
          ) : (
            <div className="bg-[#08080c]/50 border border-dashed border-white/5 rounded-2xl p-6 text-center text-xs text-slate-500">
              Selecciona un objeto para ver sus estadísticas o equiparlo.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

/** Selected item detail panel — extracted to keep the main component readable. */
const Selected_item_detail: React.FC<{
  item: Item;
  isEquipped?: boolean;
  slot?: keyof PlayerCharacter['equipment'];
  index?: number;
  onEquipItem: (item: Item, index: number) => void;
  onUnequipItem: (slot: keyof PlayerCharacter['equipment']) => void;
  onUseItem: (item: Item, index: number) => void;
  onDropItem: (index: number) => void;
  onDeselect: () => void;
}> = ({ item, isEquipped, slot, index, onEquipItem, onUnequipItem, onUseItem, onDropItem, onDeselect }) => {
  const rarityMeta = getRarityMeta(item);

  return (
    <div className={`hud-panel border rounded-2xl p-4 flex flex-col gap-3 shadow-xl ${rarityMeta.borderClass} ${rarityMeta.glowClass}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className={`text-3xl p-2 bg-slate-900/90 border rounded-xl ${rarityMeta.borderClass}`}>
            {item.icon}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h4 className={`text-sm font-bold ${rarityMeta.textClass}`}>{item.name}</h4>
              <span
                className="text-[8px] sm:text-[9px] font-bold font-pixel px-1.5 py-0.5 rounded-sm"
                style={{ color: rarityMeta.color, backgroundColor: `${rarityMeta.color}20` }}
              >
                {rarityMeta.label}
              </span>
            </div>
            <p className="text-xs text-slate-400 capitalize">{item.type}</p>
          </div>
        </div>
        <span className="text-xs font-pixel font-bold text-amber-400">🪙 {item.price} Oro</span>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>

      {/* Stats details */}
      <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
        {item.minHit !== undefined && (
          <span className="bg-slate-900/80 px-2.5 py-1 rounded-lg border border-white/5">
            Daño: <strong className="text-amber-400">{item.minHit} - {item.maxHit}</strong>
          </span>
        )}
        {item.minDef !== undefined && (
          <span className="bg-slate-900/80 px-2.5 py-1 rounded-lg border border-white/5">
            Defensa: <strong className="text-sky-400">{item.minDef} - {item.maxDef}</strong>
          </span>
        )}
        {item.blockChanceBonus !== undefined && (
          <span className="bg-slate-900/80 px-2.5 py-1 rounded-lg border border-white/5">
            Bloqueo: <strong className="text-emerald-400">+{item.blockChanceBonus}%</strong>
          </span>
        )}
        {item.baseIntervalMs !== undefined && (
          <span className="bg-slate-900/80 px-2.5 py-1 rounded-lg border border-white/5">
            Intervalo: <strong className="text-purple-400">{item.baseIntervalMs} ms</strong>
          </span>
        )}
        {item.hpRestore !== undefined && (
          <span className="bg-slate-900/80 px-2.5 py-1 rounded-lg border border-white/5">
            Restaura: <strong className="text-red-400">+{item.hpRestore} HP</strong>
          </span>
        )}
        {item.mpRestore !== undefined && (
          <span className="bg-slate-900/80 px-2.5 py-1 rounded-lg border border-white/5">
            Restaura: <strong className="text-sky-400">+{item.mpRestore} MP</strong>
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-2 border-t border-white/10">
        {isEquipped ? (
          <button
            onClick={() => {
              if (slot) onUnequipItem(slot);
              onDeselect();
            }}
            className="flex-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-bold py-2.5 rounded-xl transition border border-white/5"
          >
            Desequipar
          </button>
        ) : (
          <>
            {['weapon', 'shield', 'helmet', 'armor', 'boots', 'ring', 'amulet', 'arrow'].includes(item.type) && (
              <button
                onClick={() => {
                  if (index !== undefined) onEquipItem(item, index);
                  onDeselect();
                }}
                className="flex-1 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 active:scale-95 text-white text-xs font-bold py-2.5 rounded-xl shadow-lg transition flex items-center justify-center gap-1.5"
              >
                <ArrowUpCircle className="w-4 h-4" /> Equipar
              </button>
            )}
            {item.type === 'potion' && (
              <button
                onClick={() => {
                  if (index !== undefined) onUseItem(item, index);
                  onDeselect();
                }}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white text-xs font-bold py-2.5 rounded-xl shadow-lg transition"
              >
                Usar / Beber
              </button>
            )}
            <button
              onClick={() => {
                if (index !== undefined) onDropItem(index);
                onDeselect();
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
  );
};
