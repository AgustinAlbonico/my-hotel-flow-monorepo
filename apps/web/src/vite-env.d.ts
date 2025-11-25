/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_JWT_TOKEN_KEY: string;
  readonly VITE_JWT_REFRESH_TOKEN_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
