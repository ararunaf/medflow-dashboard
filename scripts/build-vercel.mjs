#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

process.env.MEDFLOW_DEPLOY_TARGET = "vercel";

const result = spawnSync(process.execPath, [join(root, "node_modules", "vite", "bin", "vite.js"), "build"], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);
