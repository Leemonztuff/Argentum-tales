/**
 * Design Tokens — Colors
 * ------------------------------------------------------------------
 * Single source of truth for the Argentum Tales UI palette, aligned
 * with the project UI Bible (`.opencode/skills/argentum-ui-bible`).
 * Medieval, desaturated, restrained: dark surfaces, warm gold accent,
 * muted metal borders and a clear text hierarchy.
 *
 * Conventions: names in Spanish (repo convention); use these tokens
 * instead of raw hex in new components. Keep surfaces few — never
 * introduce dozens of unrelated background colors.
 */

export const colors = {
  // Base surfaces (UI Bible §4)
  background: {
    base: '#111315',
    panel: '#17191C',
    panelDeep: '#0B0D0F',
    overlay: 'rgba(11, 13, 15, 0.82)',
  },

  // Semantic resource colors
  health: {
    base: '#A83A32',
    from: '#D14A3F',
    via: '#A83A32',
    to: '#A83A32',
    glow: 'rgba(209, 74, 63, 0.45)',
    border: '#7F2E29',
    text: '#C9908A',
  },
  mana: {
    base: '#356A9A',
    from: '#356A9A',
    via: '#4F8FC2',
    to: '#4F8FC2',
    glow: 'rgba(79, 143, 194, 0.45)',
    border: '#2C4E6E',
    text: '#9FC3E0',
  },
  exp: {
    from: '#8F6D2B',
    via: '#C89B3C',
    to: '#E0B85A',
    glow: 'rgba(200, 155, 60, 0.35)',
  },
  gold: {
    base: '#C89B3C',
    text: '#E0B85A',
    glow: 'rgba(200, 155, 60, 0.35)',
    border: 'rgba(200, 155, 60, 0.30)',
  },

  // Semantic feedback types (UI Bible §4)
  success: {
    base: '#547A50',
    text: '#9BBA96',
  },
  warning: {
    base: '#B17A35',
    text: '#D6AE7A',
  },
  error: {
    base: '#9A3A35',
    text: '#CE8A85',
  },

  // Borders (UI Bible §38 — subtle, muted metal)
  border: {
    subtle: 'rgba(229, 224, 214, 0.08)',
    divider: 'rgba(229, 224, 214, 0.06)',
  },

  // Text (UI Bible §4)
  text: {
    primary: '#E5E0D6',
    secondary: '#AAA59B',
    muted: '#77736C',
    label: '#E5E0D6',
    disabled: '#55524D',
    important: '#D7B45A',
  },
} as const;
