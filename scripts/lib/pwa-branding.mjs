/**
 * Fonte compartilhada para `scripts/generate-pwa-assets.mjs`.
 * Mantenha alinhado a `src/lib/assets/branding.ts`.
 */
export const PWA_BRANDING = {
  productName: "MedicFlow-AI",
  shortName: "MedicFlow",
  manifestName: "MedicFlow-AI — Operação Hospitalar Inteligente",
  description:
    "Plataforma operacional hospitalar: escalas, plantões, TISS, fechamento financeiro e conciliação multi-tenant.",
  themeColor: "#1e3a5f",
  backgroundColor: "#0f172a",
  lang: "pt-BR",
};

/** Ícones PWA servidos em `public/icons/pwa/`. */
export const PWA_ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

/** Splash iOS — largura×altura lógica e pixel ratio → arquivo PNG. */
export const PWA_SPLASH_SCREENS = [
  {
    file: "apple-splash-1170x2532.png",
    width: 1170,
    height: 2532,
    media:
      "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
  },
  {
    file: "apple-splash-1179x2556.png",
    width: 1179,
    height: 2556,
    media:
      "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
  },
  {
    file: "apple-splash-1290x2796.png",
    width: 1290,
    height: 2796,
    media:
      "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
  },
  {
    file: "apple-splash-750x1334.png",
    width: 750,
    height: 1334,
    media:
      "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
  },
  {
    file: "apple-splash-2048x2732.png",
    width: 2048,
    height: 2732,
    media:
      "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
  },
];

export function buildWebManifest() {
  const { manifestName, shortName, description, themeColor, backgroundColor, lang } = PWA_BRANDING;

  const icons = [
    ...PWA_ICON_SIZES.map((size) => ({
      src: `/icons/pwa/icon-${size}x${size}.png`,
      sizes: `${size}x${size}`,
      type: "image/png",
      purpose: "any",
    })),
    {
      src: "/icons/pwa/icon-512x512-maskable.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
  ];

  return {
    id: "/",
    name: manifestName,
    short_name: shortName,
    description,
    lang,
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui", "browser"],
    orientation: "any",
    background_color: backgroundColor,
    theme_color: themeColor,
    categories: ["medical", "business", "productivity"],
    icons,
    screenshots: [
      {
        src: "/icons/opengraph/og-default.png",
        sizes: "1200x630",
        type: "image/png",
        form_factor: "wide",
        label: `${PWA_BRANDING.productName} — painel operacional`,
      },
    ],
  };
}
