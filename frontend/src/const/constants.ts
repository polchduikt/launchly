export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  ACTIVE_BOT_ID: 'activeBotId',
  THEME: 'launchly_theme',
  BLOCK_REASON: 'launchly_block_reason',
  AUTH_REDIRECT_URL: 'auth_redirect_url',
  FLOW_CLIPBOARD: 'launchly_flow_clipboard',
  FLOW_EDGE_TYPE: 'launchly_flow_edge_type',
  LANGUAGE: 'launchly_language',
  TRANSLATIONS_CACHE_PREFIX: 'launchly_translations_cache_',
} as const;

export const DEFAULT_CUSTOM_FIELDS = [
  'last_order_product',
  'last_order_price',
  'phone',
  'email',
] as const;

export const BRAND_COLORS = {
  PRIMARY: '#407BFF',
  DARK: '#0A0A0A',
  CANVAS_BG: '#F2EBDD',
  ACCENT_AMBER: '#ffb200',
} as const;

export const VARIATION_COLORS = [
  '#7C3AED',
  '#B45309',
  '#A21CAF',
  '#0F766E',
  '#1D4ED8',
  '#BE123C',
  '#047857',
  '#4338CA',
];

export const PAGINATION = {
  DEFAULT_PAGE: 0,
  DEFAULT_PAGE_SIZE: 20,
  ADMIN_PAGE_SIZE: 30,
  LOGS_PAGE_SIZE: 100,
} as const;

export const TIMING = {
  SEARCH_DEBOUNCE_MS: 300,
  POLL_INTERVAL_MS: 3000,
  AUTO_SAVE_DEBOUNCE_MS: 1000,
  ANIMATION_DURATION_MS: 300,
  FOCUS_DELAY_MS: 50,
} as const;

export const FLOW_DEFAULTS = {
  DELAY_SECONDS: 3,
  FIT_VIEW_PADDING: 0.5,
  FIT_VIEW_DURATION_MS: 300,
  AUTO_SAVE_HEAVY_ELEMENTS: 100,
  AUTO_SAVE_MEDIUM_ELEMENTS: 50,
  AUTO_SAVE_HEAVY_DELAY_MS: 3000,
  AUTO_SAVE_MEDIUM_DELAY_MS: 2000,
  AUTO_SAVE_LIGHT_DELAY_MS: 1500,
} as const;

export const CHART_DIMENSIONS = {
  MINI_BAR: {
    WIDTH: 100,
    HEIGHT: 24,
    GAP: 3,
    MIN_BAR_HEIGHT: 2,
  },
  SEMI_DONUT: {
    SIZE: 85,
    STROKE_WIDTH: 10.5,
    GAP_DEG: 2,
    START_OFFSET_DEG: 90,
  },
} as const;
