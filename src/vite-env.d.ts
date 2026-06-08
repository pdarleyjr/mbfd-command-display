/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string;
  readonly VITE_ORG_NAME?: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_DEV_HUB_PROXY?: string;
  /** DEV-only: set to '1' to serve mock fixtures from src/lib/devFixtures.ts. */
  readonly VITE_MOCK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
