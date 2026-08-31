import React, { useCallback, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { colors } from '../tokens';

/**
 * Modal — Base AAA modal shell.
 * ------------------------------------------------------------------
 * Centralizes the behaviours every modal shares (and that were
 * previously hand-rolled / inconsistent across components):
 *  - fixed backdrop + responsive centering
 *  - optional Escape-to-close and backdrop-click-to-close
 *  - focus trap + focus restore (keyboard/a11y)
 *  - aria-modal / role="dialog" / labelled-by
 *  - consistent panel styling via hud-panel + Design Tokens
 *
 * It is intentionally render-prop / children based so it can wrap any
 * existing modal content without rewiring their props. Consume it in
 * new components or migrate existing modals incrementally.
 */

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  accent?: string; // border/accent color hex or tailwind-friendly value
  children: React.ReactNode;
  labelledBy?: string;
  /** Optional custom header content replacing the default (title + icon + close). */
  header?: React.ReactNode;
  /** Optional custom footer rendered after the scrollable content. */
  footer?: React.ReactNode;
}

const SIZE_CLASSES: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  size = 'lg',
  closeOnBackdrop = true,
  closeOnEscape = true,
  accent = '#f59e0b',
  children,
  labelledBy,
  header,
  footer,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = labelledBy || `modal-title-${Math.random().toString(36).slice(2)}`;
  const contentId = `modal-content-${titleId}`;

  // Lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Escape to close
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, closeOnEscape, onClose]);

  // Focus trap + initial focus
  useEffect(() => {
    if (!isOpen) return;
    const panel = panelRef.current;
    if (!panel) return;
    const prevActive = document.activeElement as HTMLElement | null;
    const focusables = (): HTMLElement[] => {
      const elements = panel.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const list: HTMLElement[] = [];
      elements.forEach((el) => {
        const h = el as HTMLElement;
        if (!h.hasAttribute('disabled')) list.push(h);
      });
      return list;
    };
    const first = focusables()[0];
    first?.focus();

    const onKeydown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const list = focusables();
      if (list.length === 0) return;
      const firstEl = list[0];
      const lastEl = list[list.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    panel.addEventListener('keydown', onKeydown);
    return () => {
      panel.removeEventListener('keydown', onKeydown);
      prevActive?.focus?.();
    };
  }, [isOpen]);

  const handleBackdrop = useCallback(() => {
    if (closeOnBackdrop) onClose();
  }, [closeOnBackdrop, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 bg-[#08080c]/85 backdrop-blur-md animate-in fade-in"
      style={{ backgroundColor: colors.background.overlay }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleBackdrop();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={contentId}
        className={`relative w-full ${SIZE_CLASSES[size]} max-h-[94vh] sm:max-h-[90vh] hud-panel rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto`}
        style={{ borderColor: `${accent}33`, boxShadow: `0 0 20px ${colors.gold.glow}` }}
      >
        {/* Header */}
        {header != null ? (
          header
        ) : (
          <div className="flex items-center justify-between px-3.5 py-2.5 sm:px-5 sm:py-3.5 border-b border-white/10 hud-blur">
            <div className="flex items-center gap-2 min-w-0">
              {icon != null && <span className="text-lg sm:text-xl shrink-0">{icon}</span>}
              <h2 id={titleId} className="text-sm sm:text-lg font-bold font-medieval text-slate-100 truncate">
                {title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="p-1 sm:p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div id={contentId} className="flex-1 overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer != null && (
          <div className="shrink-0">{footer}</div>
        )}
      </div>
    </div>
  );
};
