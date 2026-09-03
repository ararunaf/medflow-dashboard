import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import {
  defineConfig,
  loadEnv,
  mergeConfig,
  type Plugin,
  type PluginOption,
  type UserConfig,
} from "vite";

const root = path.dirname(fileURLToPath(import.meta.url));

/** Vercel CI define VERCEL=1; local use MEDFLOW_DEPLOY_TARGET=vercel. */
function isVercelDeployTarget(): boolean {
  return process.env.VERCEL === "1" || process.env.MEDFLOW_DEPLOY_TARGET === "vercel";
}

const HMR_SEND_KEY = "__TANSTACK_SERVER_FN_HMR_SEND__";

/**
 * Surfaces TanStack server-function errors to the dev client (same behavior as
 * @lovable.dev/vite-tanstack-config, without the Lovable dependency).
 */
function devServerFnErrorLogger(): Plugin {
  return {
    name: "dev-server-fn-error-logger",
    apply: "serve",
    enforce: "pre",
    configureServer(server) {
      (
        globalThis as typeof globalThis & {
          [HMR_SEND_KEY]?: (data: unknown) => void;
        }
      )[HMR_SEND_KEY] = (data) => {
        server.ws.send({
          type: "custom",
          event: "server-fn-error",
          data,
        });
      };
    },
    transform(code, id) {
      const normalizedId = id.replace(/\\/g, "/");
      const isTargetModule =
        normalizedId.includes("/@tanstack/start-server-core/src/server-functions-handler.ts") ||
        normalizedId.includes("/@tanstack/start-server-core/dist/esm/server-functions-handler.js");
      if (!isTargetModule) {
        return null;
      }
      const needle = "const unwrapped = res.result || res.error";
      if (!code.includes(needle)) {
        return null;
      }
      return code.replace(
        needle,
        `${needle}

      if (res?.error) {
        const err = res.error
        const payload = {
          source: 'tanstack',
          type: 'server-fn-error',
          method: request.method,
          url: request.url,
          name: err?.name ?? 'Error',
          message: err?.message ?? String(err),
          stack: typeof err?.stack === 'string' ? err.stack : undefined,
        }
        globalThis.${HMR_SEND_KEY}?.(payload)
      }`,
      );
    },
  };
}

/**
 * libxml2-wasm's Emscripten glue (libxml2raw.mjs) feature-detects Node by
 * checking `process.versions.node`. Cloudflare Workers' `nodejs_compat` flag
 * polyfills that property, so the glue wrongly takes the Node branch and
 * calls `createRequire(import.meta.url)` — which throws at runtime because
 * `import.meta.url` doesn't resolve to a usable path in the bundled Workers
 * output (there is no real filesystem to require from).
 *
 * Disabling that detection alone isn't enough: the glue then falls back to
 * asynchronously fetching/instantiating the wasm binary it has embedded as
 * base64, and that async chain doesn't settle within Cloudflare's top-level
 * `await` validation window ("Top-level await in module is unsettled",
 * error 10021). The fix is to bypass Emscripten's own wasm loading entirely
 * by supplying `instantiateWasm` ourselves: `src/lib/services/tiss/xml/vendor/libxml2.wasm`
 * (the same bytes extracted from the embedded base64 — see the README next
 * to it) is imported through `@cloudflare/vite-plugin`'s native CompiledWasm
 * module support, which hands Workers a precompiled `WebAssembly.Module` at
 * build time. Instantiating that synchronously (`new WebAssembly.Instance`)
 * means the promise Emscripten wraps around `instantiateWasm` resolves in
 * the same tick it's created, so there's no unsettled top-level await left.
 *
 * Scoped to this one file via targeted string replaces so a `libxml2-wasm`
 * upgrade that changes this output fails loudly (build error) rather than
 * silently shipping the broken require call, or the unsettled fetch, again.
 */
function patchLibxml2WasmForWorkers(root: string): Plugin {
  const NODE_DETECTION_NEEDLE =
    'h="object"==typeof process&&"object"==typeof process.versions&&"string"==typeof process.versions.node&&"renderer"!=process.type;if(h){const {createRequire:a}=await ((m)=>import(m))("module");var require=a(import.meta.url)}';
  const INSTANTIATE_WASM_NEEDLE = "if(f.instantiateWasm)return new Promise(d=>{f.instantiateWasm(b,(e,g)=>{d(a(e,g))})});";
  const wasmAssetPath = path
    .join(root, "src/lib/services/tiss/xml/vendor/libxml2.wasm")
    .split(path.sep)
    .join("/");
  return {
    name: "patch-libxml2-wasm-for-workers",
    enforce: "pre",
    transform(code, id) {
      const normalizedId = id.replace(/\\/g, "/");
      if (!normalizedId.includes("libxml2-wasm/lib/libxml2raw.mjs")) {
        return null;
      }
      if (!code.includes(NODE_DETECTION_NEEDLE) || !code.includes(INSTANTIATE_WASM_NEEDLE)) {
        throw new Error(
          "patch-libxml2-wasm-for-workers: expected snippet(s) not found in libxml2raw.mjs — " +
            "the libxml2-wasm package likely changed its build output. Update the needles in " +
            "vite.config.ts (and re-extract src/lib/services/tiss/xml/vendor/libxml2.wasm if the " +
            "embedded wasm binary itself changed) before deploying.",
        );
      }
      const patched = code
        .replace(NODE_DETECTION_NEEDLE, "h=false;")
        .replace(
          INSTANTIATE_WASM_NEEDLE,
          "f.instantiateWasm=(b,cb)=>{const inst=new WebAssembly.Instance(__libxml2WasmModule,b);cb(inst,__libxml2WasmModule);return inst.exports};" +
            INSTANTIATE_WASM_NEEDLE,
        );
      return `import __libxml2WasmModule from ${JSON.stringify(wasmAssetPath)};\n${patched}`;
    },
  };
}

function applyWatchDebounceDefaults(config: UserConfig): UserConfig {
  const existingWatch = config.server?.watch ?? {};
  const existingAwaitWriteFinish = existingWatch.awaitWriteFinish;
  const hasAwaitWriteFinishObject =
    !!existingAwaitWriteFinish &&
    typeof existingAwaitWriteFinish === "object" &&
    !Array.isArray(existingAwaitWriteFinish);
  return mergeConfig(config, {
    server: {
      watch: {
        ...existingWatch,
        awaitWriteFinish: {
          ...(hasAwaitWriteFinishObject ? existingAwaitWriteFinish : {}),
          stabilityThreshold: 1000,
          pollInterval: 100,
        },
      },
    },
  });
}

export default defineConfig(({ command, mode }) => {
  const plugins: PluginOption[] = [
    tailwindcss(),
    tsconfigPaths({ projects: ["./tsconfig.json"] }),
    devServerFnErrorLogger(),
    patchLibxml2WasmForWorkers(root),
  ];

  if (command === "build") {
    if (isVercelDeployTarget()) {
      plugins.push(nitro());
    } else {
      plugins.push(
        cloudflare({
          viteEnvironment: { name: "ssr" },
        }),
      );
    }
  }

  const tanstackStartOptions = mergeConfig(
    {
      importProtection: {
        behavior: "error" as const,
        client: {
          files: ["**/server/**"],
          specifiers: ["server-only"],
        },
      },
    },
    {
      server: { entry: "server" },
    },
  );

  plugins.push(...tanstackStart(tanstackStartOptions), react());

  const loadedEnv = loadEnv(mode, process.cwd(), "VITE_");
  const envDefine: Record<string, string> = {};
  for (const [key, value] of Object.entries(loadedEnv)) {
    envDefine[`import.meta.env.${key}`] = JSON.stringify(value);
  }

  const config: UserConfig = {
    define: envDefine,
    resolve: {
      alias: {
        "@": path.join(root, "src"),
      },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return;
            if (id.includes("@tanstack")) return "tanstack";
            if (id.includes("@supabase")) return "supabase";
            if (id.includes("lucide-react")) return "icons";
            return "vendor";
          },
        },
      },
    },
    plugins,
  };

  return applyWatchDebounceDefaults(mergeConfig({ server: { host: "::", port: 8080 } }, config));
});
