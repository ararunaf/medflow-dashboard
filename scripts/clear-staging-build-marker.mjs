#!/usr/bin/env node
/** Remove marcador staging quando dist é gerado por build production. */
import { existsSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const markerPath = join(dirname(fileURLToPath(import.meta.url)), "..", "dist", ".staging-build-marker.json");

if (existsSync(markerPath)) {
  unlinkSync(markerPath);
  console.log("[medflow] staging build marker removido (build production)");
}
