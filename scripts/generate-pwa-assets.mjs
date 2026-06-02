#!/usr/bin/env node
/**
 * Gera ícones PWA, splash iOS, favicons e manifests a partir do logo MedicFlow-AI.
 *
 * Fonte: `src/assets/branding/logos/logo-medicflow-ai.png` (recorte do símbolo ~56% superior).
 * Fallback: `public/LogoMedicFlow192.png`.
 *
 * Uso: npm run pwa:generate
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import pngToIco from "png-to-ico";
import {
  PWA_BRANDING,
  PWA_ICON_SIZES,
  PWA_SPLASH_SCREENS,
  buildWebManifest,
} from "./lib/pwa-branding.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const brandLogo = join(root, "src", "assets", "branding", "logos", "logo-medicflow-ai.png");
const legacyIcon = join(root, "public", "LogoMedicFlow192.png");
const publicDir = join(root, "public");
const pwaDir = join(publicDir, "icons", "pwa");
const faviconDir = join(publicDir, "icons", "favicons");
const androidDir = join(publicDir, "icons", "android");
const splashDir = join(publicDir, "icons", "splash");
const ogDir = join(publicDir, "icons", "opengraph");

/** Recorte vertical do símbolo (sem wordmark) no logo completo 1254×1254. */
const BRAND_LOGO_ICON_CROP_RATIO = 0.56;

let sourcePipeline = null;

async function ensureDirs() {
  await mkdir(pwaDir, { recursive: true });
  await mkdir(faviconDir, { recursive: true });
  await mkdir(androidDir, { recursive: true });
  await mkdir(splashDir, { recursive: true });
  await mkdir(ogDir, { recursive: true });
}

async function loadSourcePipeline() {
  const brand = await readFile(brandLogo).catch(() => null);
  if (brand) {
    const meta = await sharp(brand).metadata();
    const cropHeight = Math.round(meta.width * BRAND_LOGO_ICON_CROP_RATIO);
    return sharp(brand).extract({
      left: 0,
      top: 0,
      width: meta.width,
      height: Math.min(cropHeight, meta.height),
    });
  }
  const legacy = await readFile(legacyIcon).catch(() => null);
  if (!legacy) return null;
  return sharp(legacy);
}

async function persistMasterIcon() {
  const buf = await sourcePipeline
    .clone()
    .resize(512, 512, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writeFile(legacyIcon, buf);
}

async function writePng(buffer, dest) {
  await writeFile(dest, buffer);
}

function parseHex(hex) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

async function resizeIcon(size) {
  return sourcePipeline
    .clone()
    .resize(size, size, { fit: "contain", background: PWA_BRANDING.backgroundColor })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
}

async function resizeMaskable(size) {
  const padding = Math.round(size * 0.1);
  const inner = size - padding * 2;
  const logo = await sourcePipeline
    .clone()
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const bg = parseHex(PWA_BRANDING.themeColor);
  return sharp({
    create: { width: size, height: size, channels: 4, background: { ...bg, alpha: 1 } },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function buildSplash({ width, height }) {
  const maxLogo = Math.round(Math.min(width, height) * 0.38);
  const logo = await sourcePipeline
    .clone()
    .resize(maxLogo, maxLogo, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const bg = parseHex(PWA_BRANDING.backgroundColor);
  return sharp({
    create: { width, height, channels: 4, background: { ...bg, alpha: 1 } },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function writeManifests() {
  const manifest = buildWebManifest();
  const json = `${JSON.stringify(manifest, null, 2)}\n`;
  await writeFile(join(publicDir, "manifest.webmanifest"), json, "utf8");
  await writeFile(join(publicDir, "manifest.json"), json, "utf8");
}

async function main() {
  await ensureDirs();
  sourcePipeline = await loadSourcePipeline();
  if (!sourcePipeline) {
    console.error(`Fonte ausente: ${brandLogo} ou ${legacyIcon}`);
    process.exit(1);
  }

  console.log("Atualizando LogoMedicFlow192.png…");
  await persistMasterIcon();

  console.log("Gerando ícones PWA…");
  for (const size of PWA_ICON_SIZES) {
    const buf = await resizeIcon(size);
    await writePng(buf, join(pwaDir, `icon-${size}x${size}.png`));
  }
  await writePng(await resizeMaskable(512), join(pwaDir, "icon-512x512-maskable.png"));

  console.log("Gerando favicons…");
  const favicon16Path = join(faviconDir, "favicon-16x16.png");
  const favicon32Path = join(faviconDir, "favicon-32x32.png");
  await writePng(await resizeIcon(16), favicon16Path);
  await writePng(await resizeIcon(32), favicon32Path);
  await writePng(await resizeIcon(180), join(faviconDir, "apple-touch-icon.png"));

  const faviconIco = await pngToIco([favicon16Path, favicon32Path]);
  await writeFile(join(publicDir, "favicon.ico"), faviconIco);

  console.log("Gerando ícones Android (Chrome)…");
  await writePng(await resizeIcon(192), join(androidDir, "android-chrome-192x192.png"));
  await writePng(await resizeIcon(512), join(androidDir, "android-chrome-512x512.png"));

  console.log("Gerando splash screens…");
  for (const splash of PWA_SPLASH_SCREENS) {
    const buf = await buildSplash(splash);
    await writePng(buf, join(splashDir, splash.file));
  }

  console.log("Atualizando OG (placeholder proporcional)…");
  const og = await sourcePipeline
    .clone()
    .resize(1200, 630, {
      fit: "contain",
      background: PWA_BRANDING.backgroundColor,
    })
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writePng(og, join(ogDir, "og-default.png"));

  await writeManifests();
  console.log("PWA assets gerados: manifest.json, manifest.webmanifest, ícones e splash.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
