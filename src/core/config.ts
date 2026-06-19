export const publicAppUrl = () => import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin;
export const omnistonApiUrl = () => import.meta.env.VITE_OMNISTON_API_URL || 'https://omniston.ston.fi';
export const tonApiBaseUrl = () => import.meta.env.VITE_TONAPI_BASE_URL || 'https://tonapi.io/v2';
export const telegramBotUsername = () => import.meta.env.VITE_TELEGRAM_BOT_USERNAME || '';
export const tonConnectManifestUrl = () => import.meta.env.VITE_TONCONNECT_MANIFEST_URL || `${window.location.origin}/tonconnect-manifest.json`;
