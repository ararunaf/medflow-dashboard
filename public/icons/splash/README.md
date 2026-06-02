# Splash screens (iOS / PWA)

Arquivos referenciados em `getBrandingHeadExtras()` via `rel="apple-touch-startup-image"`.

| Arquivo | Dispositivo (lógico) |
| --- | --- |
| `apple-splash-1170x2532.png` | iPhone 12/13/14 (390×844 @3x) |
| `apple-splash-1179x2556.png` | iPhone 14 Pro (393×852 @3x) |
| `apple-splash-1290x2796.png` | iPhone 14 Pro Max (430×932 @3x) |
| `apple-splash-750x1334.png` | iPhone SE (375×667 @2x) |
| `apple-splash-2048x2732.png` | iPad Pro 12.9" (1024×1366 @2x) |

Regenerar a partir de `public/LogoMedicFlow192.png`:

```bash
npm run pwa:generate
```

Fundo alinhado a `BRANDING.backgroundColor` (`#0f172a`).
