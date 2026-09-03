import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { PlayerCharacter } from '../types/game';
import type { GameMap } from '../types/game';
import { MAPS } from '../data/maps';
import {
  loadCharacterSlots,
  deleteCharacterSlot,
  setActiveSlotIndex,
  getActiveSlotIndex,
} from '../services/saveGame';

interface UseCharacterSlotsOptions {
  setPlayer: Dispatch<SetStateAction<PlayerCharacter | null>>;
  setCurrentMap: Dispatch<SetStateAction<GameMap>>;
  spawnMobsForMap: (map: GameMap, revengeTargetTemplateId?: string) => void;
}

/** Owns the character select/creation flow (title screen character slots). */
export function useCharacterSlots({ setPlayer, setCurrentMap, spawnMobsForMap }: UseCharacterSlotsOptions) {
  const [isCharacterCreating, setIsCharacterCreating] = useState(false);
  const [characterSlots, setCharacterSlots] = useState(() => loadCharacterSlots());
  const [activeSlotIndex, setActiveSlotIndexState] = useState(() => getActiveSlotIndex());
  const [creatingSlotIndex, setCreatingSlotIndex] = useState<number | null>(null);

  const handleSelectSlot = (index: number) => {
    const char = characterSlots[index];
    if (char) {
      setActiveSlotIndexState(index);
      setActiveSlotIndex(index);
      setPlayer(char);
      const map = MAPS[char.currentMapId] || MAPS.pueblo_inicial;
      setCurrentMap(map);
      spawnMobsForMap(map, char.revengeTargetTemplateId);
    }
  };

  const handleDeleteSlot = (index: number) => {
    const updated = deleteCharacterSlot(index);
    setCharacterSlots([...updated]);
  };

  const handleStartCreateCharacter = (index: number) => {
    setCreatingSlotIndex(index);
    setIsCharacterCreating(true);
  };

  // Persist + set the active slot in one step (used when creating/returning to title).
  const saveActiveSlot = (index: number) => {
    setActiveSlotIndexState(index);
    setActiveSlotIndex(index);
  };

  // Reload the slots from storage (used when returning to title screen).
  const refreshSlots = () => {
    setCharacterSlots(loadCharacterSlots());
  };

  return {
    characterSlots,
    activeSlotIndex,
    creatingSlotIndex,
    isCharacterCreating,
    handleSelectSlot,
    handleDeleteSlot,
    handleStartCreateCharacter,
    setCharacterSlots,
    setIsCharacterCreating,
    setActiveSlotIndexState,
    setCreatingSlotIndex,
    saveActiveSlot,
    refreshSlots,
  };
}
