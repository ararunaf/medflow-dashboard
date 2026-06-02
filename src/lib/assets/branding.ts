/**
 * Branding e assets estáticos — URLs estáveis em `public/` para PWA/favicons/OG (SSR-safe),
 * imports Vite em `src/assets/branding/` para UI (hash + pipeline de build).
 */
import defaultLogo from "@/assets/branding/logos/logo-medicflow-ai.png";

export const BRANDING = {
  productName: "MedicFlow-AI",
  shortName: "MedicFlow",
  /** Nome completo no Web App Manifest (`name`). */
  manifestName: "MedicFlow-AI — Operação Hospitalar Inteligente",
  tagline: "Inteligência que conecta. Operação que transforma.",
  description:
    "Plataforma operacional hospitalar: escalas, plantões, TISS, fechamento financeiro e conciliação multi-tenant.",
  themeColor: "#1e3a5f",
  backgroundColor: "#0f172a",
} as const;

/** Título de página no padrão `Seção — MedicFlow-AI`. */
export function brandPageTitle(section: string): string {
  return `${section} — ${BRANDING.productName}`;
}

/** Logo padrão para componentes (URL com hash no build). */
export const defaultLogoUrl = defaultLogo;

/** Caminhos em `public/` — idênticos no servidor e no cliente. */
export const PUBLIC_ASSET_PATHS = {
  favicon: "/favicon.ico",
  favicon16: "/icons/favicons/favicon-16x16.png",
  favicon32: "/icons/favicons/favicon-32x32.png",
  appleTouchIcon: "/icons/favicons/apple-touch-icon.png",
  androidChrome192: "/icons/android/android-chrome-192x192.png",
  androidChrome512: "/icons/android/android-chrome-512x512.png",
  manifest: "/manifest.json",
  manifestWebmanifest: "/manifest.webmanifest",
  ogDefault: "/icons/opengraph/og-default.png",
  pwa72: "/icons/pwa/icon-72x72.png",
  pwa192: "/icons/pwa/icon-192x192.png",
  pwa512: "/icons/pwa/icon-512x512.png",
  pwa512Maskable: "/icons/pwa/icon-512x512-maskable.png",
} as const;

/** Splash iOS (`apple-touch-startup-image`) — gerados por `scripts/generate-pwa-assets.mjs`. */
export const PWA_SPLASH_SCREENS = [
  {
    href: "/icons/splash/apple-splash-1170x2532.png",
    media:
      "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
  },
  {
    href: "/icons/splash/apple-splash-1179x2556.png",
    media:
      "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
  },
  {
    href: "/icons/splash/apple-splash-1290x2796.png",
    media:
      "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
  },
  {
    href: "/icons/splash/apple-splash-750x1334.png",
    media:
      "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
  },
  {
    href: "/icons/splash/apple-splash-2048x2732.png",
    media:
      "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
  },
] as const;

export type PublicAssetPath = (typeof PUBLIC_ASSET_PATHS)[keyof typeof PUBLIC_ASSET_PATHS];

/** Resolve URL absoluta para meta OG/Twitter quando `VITE_MEDFLOW_APP_URL` está definida. */
export function resolvePublicAssetUrl(path: PublicAssetPath | string, baseUrl?: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const base = baseUrl?.trim();
  if (!base) return normalized;
  return `${base.replace(/\/$/, "")}${normalized}`;
}

export function getBrandingHeadExtras(appUrl?: string) {
  const ogImage = resolvePublicAssetUrl(PUBLIC_ASSET_PATHS.ogDefault, appUrl);

  const meta = [
    { name: "application-name", content: BRANDING.shortName },
    { name: "apple-mobile-web-app-title", content: BRANDING.shortName },
    { name: "apple-mobile-web-app-capable", content: "yes" },
    { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
    { name: "mobile-web-app-capable", content: "yes" },
    { name: "format-detection", content: "telephone=no" },
    { property: "og:image", content: ogImage },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: `${BRANDING.productName} — ${BRANDING.tagline}` },
    { name: "twitter:image", content: ogImage },
    { name: "twitter:image:alt", content: `${BRANDING.productName} — ${BRANDING.tagline}` },
  ];

  const links = [
    { rel: "icon", href: PUBLIC_ASSET_PATHS.favicon, type: "image/x-icon" },
    { rel: "icon", href: PUBLIC_ASSET_PATHS.favicon32, type: "image/png", sizes: "32x32" },
    { rel: "icon", href: PUBLIC_ASSET_PATHS.favicon16, type: "image/png", sizes: "16x16" },
    { rel: "apple-touch-icon", href: PUBLIC_ASSET_PATHS.appleTouchIcon, sizes: "180x180" },
    {
      rel: "icon",
      href: PUBLIC_ASSET_PATHS.androidChrome192,
      type: "image/png",
      sizes: "192x192",
    },
    {
      rel: "icon",
      href: PUBLIC_ASSET_PATHS.androidChrome512,
      type: "image/png",
      sizes: "512x512",
    },
    { rel: "manifest", href: PUBLIC_ASSET_PATHS.manifest },
    ...PWA_SPLASH_SCREENS.map((splash) => ({
      rel: "apple-touch-startup-image" as const,
      href: splash.href,
      media: splash.media,
    })),
  ];

  return { meta, links };
}
