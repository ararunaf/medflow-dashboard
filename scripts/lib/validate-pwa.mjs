import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  PWA_BRANDING,
  PWA_ICON_SIZES,
  PWA_SPLASH_SCREENS,
  buildWebManifest,
} from "./pwa-branding.mjs";

const REQUIRED_MANIFEST_KEYS = [
  "id",
  "name",
  "short_name",
  "start_url",
  "scope",
  "display",
  "icons",
  "theme_color",
  "background_color",
];

const INSTALL_ICON_SIZES = [192, 512];

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function pngDimensions(filePath) {
  const buf = readFileSync(filePath);
  if (buf.length < 24 || buf[0] !== 0x89 || buf[1] !== 0x50) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function stableJson(obj) {
  return `${JSON.stringify(obj, null, 2)}\n`;
}

/**
 * Valida PWA (manifest, ícones, splash, nome) em `public/` e opcionalmente `dist/client/`.
 * @param {string} cwd
 * @param {{ dist?: boolean }} [opts]
 */
export function validatePwa(cwd, opts = {}) {
  const errors = [];
  const warnings = [];
  const passes = [];

  const publicDir = join(cwd, "public");
  const distClient = join(cwd, "dist", "client");

  const manifestPath = join(publicDir, "manifest.json");
  const manifestAltPath = join(publicDir, "manifest.webmanifest");

  if (!existsSync(manifestPath)) {
    errors.push("public/manifest.json ausente");
  }
  if (!existsSync(manifestAltPath)) {
    errors.push("public/manifest.webmanifest ausente");
  }
  if (errors.length) {
    return { ok: false, errors, warnings, passes };
  }

  const onDisk = readJson(manifestPath);
  const onDiskAlt = readFileSync(manifestAltPath, "utf8");
  const canonical = buildWebManifest();

  if (onDiskAlt !== stableJson(onDisk)) {
    errors.push("manifest.webmanifest difere de manifest.json");
  } else {
    passes.push("manifest.json e manifest.webmanifest idênticos");
  }

  if (stableJson(onDisk) !== stableJson(canonical)) {
    errors.push(
      "manifest.json desatualizado — rode npm run pwa:generate (diverge de scripts/lib/pwa-branding.mjs)",
    );
  } else {
    passes.push("Manifest alinhado com pwa-branding.mjs");
  }

  for (const key of REQUIRED_MANIFEST_KEYS) {
    if (onDisk[key] == null || (key === "icons" && !onDisk.icons?.length)) {
      errors.push(`Manifest sem campo obrigatório: ${key}`);
    }
  }

  if (onDisk.name !== PWA_BRANDING.manifestName) {
    errors.push(`name incorreto: "${onDisk.name}" (esperado: "${PWA_BRANDING.manifestName}")`);
  } else {
    passes.push(`Nome do app (manifest.name): ${onDisk.name}`);
  }

  if (onDisk.short_name !== PWA_BRANDING.shortName) {
    errors.push(
      `short_name incorreto: "${onDisk.short_name}" (esperado: "${PWA_BRANDING.shortName}")`,
    );
  } else {
    passes.push(`Nome curto (instalação): ${onDisk.short_name}`);
  }

  if (onDisk.display !== "standalone") {
    warnings.push(`display="${onDisk.display}" — recomendado "standalone" para instalação`);
  } else {
    passes.push('display: "standalone" (instalável como app)');
  }

  if (onDisk.start_url !== "/" || onDisk.scope !== "/") {
    warnings.push("start_url/scope diferentes de / — confira deep links pós-instalação");
  }

  const iconSrcs = new Set((onDisk.icons ?? []).map((i) => i.src));
  for (const size of PWA_ICON_SIZES) {
    const rel = `/icons/pwa/icon-${size}x${size}.png`;
    if (!iconSrcs.has(rel)) {
      errors.push(`Manifest sem entrada de ícone ${size}x${size}`);
    }
  }
  if (!iconSrcs.has("/icons/pwa/icon-512x512-maskable.png")) {
    errors.push("Manifest sem ícone maskable 512x512");
  }

  for (const size of INSTALL_ICON_SIZES) {
    const rel = `/icons/pwa/icon-${size}x${size}.png`;
    const abs = join(publicDir, rel.replace(/^\//, ""));
    if (!existsSync(abs)) {
      errors.push(`Ícone obrigatório para instalação ausente: ${rel}`);
      continue;
    }
    const dim = pngDimensions(abs);
    if (!dim || dim.width !== size || dim.height !== size) {
      errors.push(`Ícone ${rel}: dimensão ${dim?.width ?? "?"}×${dim?.height ?? "?"} (esperado ${size}×${size})`);
    }
  }
  passes.push("Ícones 192×192 e 512×512 presentes e com dimensões corretas");

  for (const size of PWA_ICON_SIZES) {
    const abs = join(publicDir, "icons", "pwa", `icon-${size}x${size}.png`);
    if (!existsSync(abs)) {
      errors.push(`Arquivo ausente: icons/pwa/icon-${size}x${size}.png`);
      continue;
    }
    if (statSync(abs).size < 200) {
      warnings.push(`icons/pwa/icon-${size}x${size}.png muito pequeno (${statSync(abs).size} B)`);
    }
  }

  const maskable = join(publicDir, "icons", "pwa", "icon-512x512-maskable.png");
  if (!existsSync(maskable)) {
    errors.push("icon-512x512-maskable.png ausente");
  } else {
    passes.push("Ícone maskable 512 presente");
  }

  for (const splash of PWA_SPLASH_SCREENS) {
    const abs = join(publicDir, "icons", "splash", splash.file);
    if (!existsSync(abs)) {
      errors.push(`Splash ausente: icons/splash/${splash.file}`);
      continue;
    }
    const dim = pngDimensions(abs);
    if (!dim || dim.width !== splash.width || dim.height !== splash.height) {
      errors.push(
        `Splash ${splash.file}: ${dim?.width ?? "?"}×${dim?.height ?? "?"} (esperado ${splash.width}×${splash.height})`,
      );
    }
  }
  if (errors.every((e) => !e.startsWith("Splash"))) {
    passes.push(`${PWA_SPLASH_SCREENS.length} splash screens iOS com dimensões corretas`);
  }

  const headAssets = [
    ["favicon.ico", "favicon"],
    ["icons/favicons/favicon-16x16.png", "favicon 16"],
    ["icons/favicons/favicon-32x32.png", "favicon 32"],
    ["icons/favicons/apple-touch-icon.png", "apple-touch-icon"],
    ["icons/android/android-chrome-192x192.png", "android 192"],
    ["icons/android/android-chrome-512x512.png", "android 512"],
    ["icons/opengraph/og-default.png", "og-default"],
  ];
  for (const [rel, label] of headAssets) {
    const abs = join(publicDir, rel);
    if (!existsSync(abs)) {
      errors.push(`Asset de cabeçalho ausente (${label}): public/${rel}`);
    }
  }
  if (!errors.some((e) => e.includes("cabeçalho"))) {
    passes.push("Favicons, apple-touch e OG presentes em public/");
  }

  const og = join(publicDir, "icons", "opengraph", "og-default.png");
  if (existsSync(og)) {
    const dim = pngDimensions(og);
    if (!dim || dim.width !== 1200 || dim.height !== 630) {
      warnings.push(`og-default.png: ${dim?.width ?? "?"}×${dim?.height ?? "?"} (recomendado 1200×630)`);
    }
  }

  if (opts.dist) {
    if (!existsSync(distClient)) {
      warnings.push("dist/client ausente — pule --dist ou rode build:staging");
    } else {
      for (const file of ["manifest.json", "manifest.webmanifest", "favicon.ico"]) {
        if (!existsSync(join(distClient, file))) {
          errors.push(`dist/client/${file} ausente após build`);
        }
      }
      const distIcon = join(distClient, "icons", "pwa", "icon-512x512.png");
      if (!existsSync(distIcon)) {
        errors.push("dist/client/icons/pwa/icon-512x512.png ausente após build");
      } else {
        passes.push("Assets PWA copiados para dist/client");
      }
    }
  }

  return { ok: errors.length === 0, errors, warnings, passes };
}
