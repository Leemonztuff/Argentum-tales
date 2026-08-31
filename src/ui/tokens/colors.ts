/**
 * Design Tokens — Colors
 * ------------------------------------------------------------------
 * Single source of truth for the Argentum Agite UI palette.
 * These values mirror the previously hardcoded hex/Tailwind classes
 * used across HUD/modals/settings so the visual identity is unchanged
 * while becoming centralized, consistent and retunable globally.
 *
 * Conventions: names in Spanish (repo convention); use these tokens
 * instead of raw hex in new components.
 */

export const colors = {
  // Base surfaces
  background: {
    base: '#08080c',
    panel: '#0f172a',
    panelDeep: '#08080e',
    overlay: 'rgba(8, 8, 14, 0.82)',
  },

  // Semantic resource colors
  health: {
    base: '#ef4444',
    from: '#dc2626',
    via: '#f43f5e',
    to: '#ef4444',
    glow: 'rgba(225, 29, 72, 0.45)',
    border: '#7f1d1d',
    text: '#fca5a5',
  },
  mana: {
    base: '#3b82f6',
    from: '#0284c7',
    via: '#22d3ee',
    to: '#3b82f6',
    glow: 'rgba(37, 99, 235, 0.45)',
    border: '#075985',
    text: '#bae6fd',
  },
  exp: {
    from: '#f59e0b',
    via: '#facc15',
    to: '#fcd34d',
    glow: 'rgba(245, 158, 11, 0.35)',
  },
  gold: {
    base: '#f59e0b',
    text: '#fbbf24',
    glow: 'rgba(245, 158, 11, 0.35)',
    border: 'rgba(245, 158, 11, 0.30)',
  },

  // Borders
  border: {
    subtle: 'rgba(255, 255, 255, 0.08)',
    divider: 'rgba(255, 255, 255, 0.05)',
  },

  // Text
  text: {
    primary: '#f1f5f9',
    secondary: '#cbd5e1',
    muted: '#94a3b8',
    label: '#e2e8f0',
  },
} as const;
