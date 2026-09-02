// src/utils/theme.js
// Color palette — logo-matched: deep indigo-purple primary + vivid orange accent
// Zero blue (#1A73E8 etc.) anywhere in auth/brand UI

export const theme = {
  colors: {
    // ── Brand (logo-derived: navy #01152D + orange #FD5C02) ───
    primary:        '#01152D',   // deep navy (logo dark)
    primaryDark:    '#000B18',   // near-black navy for gradient bottom
    primaryMid:     '#02203F',   // mid navy
    primaryLight:   '#E8EDF3',   // very light navy tint
    accent:         '#FD5C02',   // brand orange (logo accent)
    accentDark:     '#D94B00',   // dark orange for pressed states
    accentLight:    '#FFF3EC',   // light orange bg tint
    // ── Secondary / Status ────────────────────────────────────
    secondary:      '#10B981',   // green for success highlights
    warning:        '#F59E0B',
    danger:         '#EF4444',
    success:        '#10B981',
    // ── Surfaces ─────────────────────────────────────────────
    background:     '#F4F6F9',   // soft neutral bg
    surface:        '#FFFFFF',
    surfaceTint:    '#FAFBFC',
    border:         '#E2E8F0',
    // ── Text ─────────────────────────────────────────────────
    textPrimary:    '#01152D',   // navy
    textSecondary:  '#64748B',   // slate-gray
    textDisabled:   '#94A3B8',
    textOnPrimary:  '#FFFFFF',
    textOnAccent:   '#FFFFFF',
    // ── Tab Bar ──────────────────────────────────────────────
    tabBar:         '#FFFFFF',
    tabBarActive:   '#FD5C02',
    tabBarInactive: '#94A3B8',
    // ── Splash ───────────────────────────────────────────────
    splashBg:       '#01152D',
    splashBg2:      '#02203F',
    // ── Orange ───────────────────────────────────────────────
    orange:         '#FD5C02',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  fontSize: { sm: 12, md: 14, lg: 16, xl: 20, xxl: 24 },
  borderRadius: { sm: 4, md: 8, lg: 16 },
  navigation: {
    dark: false,
    colors: {
      primary:      '#FD5C02',
      background:   '#F4F6F9',
      card:         '#FFFFFF',
      text:         '#01152D',
      border:       '#E2E8F0',
      notification: '#EF4444',
    },
    fonts: {
      regular: { fontFamily: 'System', fontWeight: '400' },
      medium:  { fontFamily: 'System', fontWeight: '500' },
      bold:    { fontFamily: 'System', fontWeight: '700' },
      heavy:   { fontFamily: 'System', fontWeight: '900' },
    },
  },
};
