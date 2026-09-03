import { useCallback, useState } from 'react';
import type { GameSettingsState } from '../components/SettingsModal';
import { DEFAULT_AUTO_PICKUP_FILTERS } from '../utils/inventoryUtils';

const STORAGE_KEY = 'argentum_game_settings';

function loadSettings(): GameSettingsState {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        autoPickup: parsed.autoPickup ?? true,
        autoPickupFilters: parsed.autoPickupFilters || DEFAULT_AUTO_PICKUP_FILTERS,
        critShake: parsed.critShake ?? true,
        showLootToasts: parsed.showLootToasts ?? true,
        autoAlignGrid: parsed.autoAlignGrid ?? false,
        soundMuted: parsed.soundMuted ?? false,
      };
    } catch (e) {
      // fallback to defaults below
    }
  }
  return {
    autoPickup: true,
    autoPickupFilters: DEFAULT_AUTO_PICKUP_FILTERS,
    critShake: true,
    showLootToasts: true,
    autoAlignGrid: false,
    soundMuted: false,
  };
}

export function useGameSettings() {
  const [gameSettings, setGameSettings] = useState<GameSettingsState>(loadSettings);

  const updateGameSettings = useCallback((newSettings: Partial<GameSettingsState>) => {
    setGameSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { gameSettings, updateGameSettings };
}
