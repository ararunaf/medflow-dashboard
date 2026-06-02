import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig, loadEnv, mergeConfig, type Plugin, type UserConfig } from "vite";

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
  const plugins: Plugin[] = [
    tailwindcss(),
    tsconfigPaths({ projects: ["./tsconfig.json"] }),
    devServerFnErrorLogger(),
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
