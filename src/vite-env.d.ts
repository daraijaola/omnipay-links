/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PUBLIC_APP_URL: string;
  readonly VITE_OMNISTON_API_URL: string;
  readonly VITE_TONAPI_BASE_URL: string;
  readonly VITE_TELEGRAM_BOT_USERNAME: string;
  readonly VITE_TONCONNECT_MANIFEST_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
