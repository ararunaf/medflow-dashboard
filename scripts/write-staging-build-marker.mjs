#!/usr/bin/env node
/**
 * Grava marcador pós `vite build --mode staging`.
 * Usado por validate-staging-build para garantir que o dist veio de build staging.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { STAGING_SUPABASE_HOST } from "./lib/staging-supabase.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = join(root, "dist");
const markerPath = join(distDir, ".staging-build-marker.json");

mkdirSync(distDir, { recursive: true });

const marker = {
  mode: "staging",
  builtAt: new Date().toISOString(),
  supabaseHost: STAGING_SUPABASE_HOST,
  viteMode: "staging",
};

writeFileSync(markerPath, `${JSON.stringify(marker, null, 2)}\n`, "utf8");
console.log(`[medflow] staging build marker → ${markerPath}`);
