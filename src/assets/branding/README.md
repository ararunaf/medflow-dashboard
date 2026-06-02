# Branding assets (MedicFlow-AI)

Estrutura para logos, favicons, PWA, Open Graph e splash — compatível com **SSR** (TanStack Start), **mobile** e **PWA**.

## Layout

| Pasta | Uso | Servido por |
| --- | --- | --- |
| `logos/` | Logo em UI (sidebar, login, landing) | Vite import → `/assets/*` com hash |
| `opengraph/` | Artes fonte 1200×630 (opcional; deploy em `public/icons/opengraph/`) | `public/` para URL estável em crawlers |
| `../public/icons/favicons/` | favicon, apple-touch-icon | `public/` — mesma URL no SSR e no cliente |
| `../public/icons/android/` | android-chrome (192, 512) | `public/` |
| `../public/icons/pwa/` | ícones do manifest | `public/` |
| `../public/icons/splash/` | `apple-touch-startup-image` | `public/` |
| `../public/manifest.json` | Web App Manifest (canônico) | `public/` |
| `../public/manifest.webmanifest` | Alias do manifest | `public/` |

## Dimensões recomendadas

| Arquivo | Tamanho |
| --- | --- |
| `favicon-16x16.png` | 16×16 |
| `favicon-32x32.png` | 32×32 |
| `apple-touch-icon.png` | 180×180 |
| `android-chrome-192x192.png` | 192×192 |
| `android-chrome-512x512.png` | 512×512 |
| `icon-192x192.png` | 192×192 |
| `icon-512x512.png` | 512×512 |
| `icon-512x512-maskable.png` | 512×512 (safe zone ~80%) |
| `og-default.png` | **1200×630** |
| `apple-splash-*.png` | ver `public/icons/splash/README.md` |
| `logo-medicflow-ai.png` | altura máx. ~96px na UI; preferir WebP/AVIF &lt; 100 KB |

## Código

- Constantes: `BRANDING`, `brandPageTitle()` em `src/lib/assets/branding.ts`
- Head global: `getBrandingHeadExtras()` em `src/lib/assets/branding.ts`
- Logo em componentes: `import { defaultLogoUrl } from "@/lib/assets"`
- Loading com logo: `BrandingLoading` em `src/components/branding-loading.tsx`

Regenerar ícones PWA, favicons, splash e manifests:

```bash
npm run pwa:generate
```

Fonte: `src/assets/branding/logos/logo-medicflow-ai.png` (recorte automático do símbolo; também grava `public/LogoMedicFlow192.png`).
