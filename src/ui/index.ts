/**
 * Argentum Agite UI System — barrel exports.
 * Central UI framework: store + tokens + base components.
 */
export { useUIStore } from './store/UIStore';
export type {
  UIStoreState,
  ModalId,
  ShopType,
  CraftingType,
  DeathInfo,
} from './store/UIStore';
export { Modal } from './components/Modal';
export type { ModalProps } from './components/Modal';
export { colors } from './tokens';
