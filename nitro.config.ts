import { defineNitroConfig } from "nitro/config";

import { securityHeaders } from "./src/lib/security/csp";

const productionSecurityHeaders = securityHeaders(true);

/** Cache longo para assets com hash (Vite → /assets/*). */
const immutableCache = "public, max-age=31536000, immutable";
const staticAssetCache = "public, max-age=2592000";
const htmlCache = "private, no-cache, no-store, must-revalidate";

export default defineNitroConfig({
  preset: "vercel",
  compatibilityDate: "2025-09-24",

  /** Variáveis de servidor acessíveis via useRuntimeConfig() (opcional). */
  runtimeConfig: {
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    medflowOpenAiApiKey: process.env.MEDFLOW_OPENAI_API_KEY ?? process.env.OPENAI_API_KEY ?? "",
    medflowAuditHashSalt: process.env.MEDFLOW_AUDIT_HASH_SALT ?? "",
  },

  routeRules: {
    "/health": {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        ...productionSecurityHeaders,
      },
    },
    "/health/**": {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        ...productionSecurityHeaders,
      },
    },
    "/assets/**": {
      headers: {
        "Cache-Control": immutableCache,
        ...productionSecurityHeaders,
      },
    },
    "/manifest.webmanifest": {
      headers: {
        "Cache-Control": "public, max-age=86400",
        "Content-Type": "application/manifest+json",
        ...productionSecurityHeaders,
      },
    },
    "/manifest.json": {
      headers: {
        "Cache-Control": "public, max-age=86400",
        "Content-Type": "application/manifest+json",
        ...productionSecurityHeaders,
      },
    },
    "/icons/**": {
      headers: {
        "Cache-Control": staticAssetCache,
        ...productionSecurityHeaders,
      },
    },
    "/favicon.ico": {
      headers: {
        "Cache-Control": staticAssetCache,
        ...productionSecurityHeaders,
      },
    },
    "/**/*.{woff,woff2,ttf,eot}": {
      headers: {
        "Cache-Control": immutableCache,
        ...productionSecurityHeaders,
      },
    },
    "/**/*.{png,jpg,jpeg,gif,webp,svg,ico}": {
      headers: {
        "Cache-Control": staticAssetCache,
        ...productionSecurityHeaders,
      },
    },
    "/**/*.css": {
      headers: {
        "Cache-Control": "public, max-age=604800",
        ...productionSecurityHeaders,
      },
    },
    "/**": {
      headers: {
        "Cache-Control": htmlCache,
        ...productionSecurityHeaders,
      },
    },
  },

  vercel: {
    config: {
      bypassToken: process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
    },
  },
});
