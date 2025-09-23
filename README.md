# Tecnojuy Frontend (Astro)

Despliegue en Cloudflare Pages.

## Requisitos
- Cuenta de Cloudflare con Pages habilitado
- Repo en GitHub (o GitLab/Bitbucket) conectado a Cloudflare Pages

## Variables de entorno
Configura en Cloudflare Pages → Settings → Environment variables:
- `PUBLIC_API_URL`: URL de tu backend en Railway, por ejemplo `https://<tu-app>.up.railway.app`

## Build en Cloudflare Pages
- Root directory: `frontend`
- Build command: `pnpm install --frozen-lockfile=false && pnpm build`
  - Alternativa npm: `npm ci && npm run build`
- Output directory: `dist`
- Node version: 20

## Desarrollo local
```bash
pnpm install
pnpm dev
```
La variable `PUBLIC_API_URL` puede ir en `.env` local si deseas apuntar a otra API.

## Notas
- En producción, el frontend llama a la API usando `PUBLIC_API_URL` (ver `astro.config.mjs` y `src/lib/config.ts`).
- Asegúrate de que el backend permita CORS desde tu dominio de Pages (`FRONTEND_URL`).

## Deploy trigger
Esta línea existe solo para forzar un nuevo build en Cloudflare Pages (actualización de backend / redirect fix).
