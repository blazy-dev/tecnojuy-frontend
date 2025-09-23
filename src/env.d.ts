/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare global {
  const __API_URL__: string;
}

interface ImportMetaEnv {
  readonly PUBLIC_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}


