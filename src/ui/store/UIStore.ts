import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { NPC } from '../../types/game';
import type { GameSettingsState } from '../../components/SettingsModal';
import type { ToastMessage } from '../../components/ToastNotification';
import { DEFAULT_AUTO_PICKUP_FILTERS } from '../../utils/inventoryUtils';

/**
 * UIStore — Central UI state for Argentum Agite.
 * ------------------------------------------------------------------
 * PPP AAA UI system foundation. Decouples UI state from the game
 * controller (App.tsx): a single store with atomic setters so
 * subscribers re-render only when the slice they read changes.
 *
 * Currently models the modal/shop/crafting/dialogue/death/toasts/settings
 * that were previously loose useState booleans in App.tsx, without
 * changing runtime behaviour. Later phases migrate consumers onto it
 * and replace the flat booleans with a proper modal stack.
 */

export type ShopType = 'weapons' | 'potions' | 'crafting' | 'general';
export type CraftingType = 'smith' | 'alchemy';
export type DeathInfo = { killerName: string; goldLost: number };
export type GameSettings = GameSettingsState;

export type ModalId =
  | 'inventory'
  | 'skills'
  | 'quests'
  | 'help'
  | 'dataStudio'
  | 'settings';

export interface UIStoreState {
  // --- Modals ---
  openModals: Record<ModalId, boolean>;
  toggleModal: (id: ModalId) => void;
  openModal: (id: ModalId) => void;
  closeModal: (id: ModalId) => void;
  closeAllModals: () => void;

  // --- Contextual overlays ---
  activeShop: ShopType | null;
  setActiveShop: (v: ShopType | null) => void;
  activeCrafting: CraftingType | null;
  setActiveCrafting: (v: CraftingType | null) => void;
  activeDialogueNpc: NPC | null;
  setActiveDialogueNpc: (v: NPC | null) => void;
  deathInfo: DeathInfo | null;
  setDeathInfo: (v: DeathInfo | null) => void;

  // --- Toasts ---
  toasts: ToastMessage[];
  pushToast: (t: ToastMessage) => void;
  removeToast: (id: string) => void;

  // --- Settings (persisted) ---
  settings: GameSettings;
  updateSettings: (patch: Partial<GameSettings>) => void;
}

const DEFAULT_SETTINGS: GameSettings = {
  autoPickup: true,
  autoPickupFilters: { ...DEFAULT_AUTO_PICKUP_FILTERS },
  critShake: true,
  showLootToasts: true,
  autoAlignGrid: true,
  soundMuted: false,
};

export const useUIStore = create<UIStoreState>()(
  persist(
    (set, get) => ({
      openModals: {
        inventory: false,
        skills: false,
        quests: false,
        help: false,
        dataStudio: false,
        settings: false,
      },
      toggleModal: (id) =>
        set((s) => ({
          openModals: { ...s.openModals, [id]: !s.openModals[id] },
        })),
      openModal: (id) =>
        set((s) => ({ openModals: { ...s.openModals, [id]: true } })),
      closeModal: (id) =>
        set((s) => ({ openModals: { ...s.openModals, [id]: false } })),
      closeAllModals: () =>
        set(() => ({
          openModals: {
            inventory: false,
            skills: false,
            quests: false,
            help: false,
            dataStudio: false,
            settings: false,
          },
        })),

      activeShop: null,
      setActiveShop: (v) => set({ activeShop: v, activeCrafting: null }),
      activeCrafting: null,
      setActiveCrafting: (v) => set({ activeCrafting: v }),
      activeDialogueNpc: null,
      setActiveDialogueNpc: (v) => set({ activeDialogueNpc: v }),
      deathInfo: null,
      setDeathInfo: (v) => set({ deathInfo: v }),

      toasts: [],
      pushToast: (t) => set((s) => ({ toasts: [...s.toasts, t] })),
      removeToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      settings: DEFAULT_SETTINGS,
      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),
    }),
    {
      name: 'argentum-ui-settings',
      // Only persist the settings slice to avoid coupling storage to modal state.
      partialize: (s) => ({ settings: s.settings }),
    }
  )
);
