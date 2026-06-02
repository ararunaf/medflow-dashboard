/**
 * Testes comportamentais de classificação e fallbacks (executado via vite-node).
 * Saída: linhas "PASS label" / "FAIL label — detail"; exit 1 se alguma falha.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { classifyError, isAuthFailureKind } from "../src/lib/errors/classify.ts";
import { OperationalError, describeError } from "../src/lib/queries/result.ts";
import { renderErrorPage } from "../src/lib/error-page.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const src = join(root, "src");

const failures = [];

function pass(label) {
  console.log(`PASS ${label}`);
}

function fail(label, detail) {
  failures.push({ label, detail });
  console.log(`FAIL ${label} — ${detail}`);
}

function assert(label, condition, detail = "assertion failed") {
  if (condition) pass(label);
  else fail(label, detail);
}

function read(rel) {
  return readFileSync(join(src, rel), "utf8");
}

// --- classifyError: auth ---
{
  const r = classifyError(
    new OperationalError("unauthenticated", "Sessão encerrada", null),
  );
  assert("auth: unauthenticated → session_expired", r.kind === "session_expired");
  assert("auth: requires redirect", r.requiresAuthRedirect === true);
  assert("auth: isAuthFailureKind", isAuthFailureKind(r.kind));
}

{
  const r = classifyError(new Error("JWT expired"));
  assert("auth: jwt expired → invalid_token", r.kind === "invalid_token");
  assert("auth: jwt requires redirect", r.requiresAuthRedirect === true);
}

{
  const r = classifyError(new Error("not authenticated"));
  assert("auth: not authenticated → session_expired", r.kind === "session_expired");
}

{
  const r = classifyError(new Error("invalid refresh token"));
  assert("auth: invalid token", r.kind === "invalid_token");
  assert("auth: invalid token redirect", r.requiresAuthRedirect === true);
}

{
  const r = classifyError(
    new OperationalError("permission_denied", "negado", null),
  );
  assert("auth: permission_denied sem redirect", r.requiresAuthRedirect === false);
  assert("auth: permission_denied kind", r.kind === "permission_denied");
}

// --- classifyError: fetch / network ---
{
  const r = classifyError(new TypeError("Failed to fetch"));
  assert("fetch: failed to fetch → offline", r.kind === "offline");
  assert("fetch: sem redirect auth", r.requiresAuthRedirect === false);
}

{
  const r = classifyError(new Error("NetworkError when attempting to fetch resource."));
  assert("network: NetworkError → offline", r.kind === "offline");
}

{
  const prev = globalThis.navigator;
  Object.defineProperty(globalThis, "navigator", {
    value: { onLine: false },
    configurable: true,
    writable: true,
  });
  try {
    const r = classifyError(new Error("something else"));
    assert("network: navigator offline → offline", r.kind === "offline");
  } finally {
    if (prev === undefined) delete globalThis.navigator;
    else Object.defineProperty(globalThis, "navigator", { value: prev, configurable: true });
  }
}

{
  const r = classifyError(new Error("request timed out"));
  assert("fetch: timeout kind", r.kind === "timeout");
  assert("fetch: timeout sem redirect", r.requiresAuthRedirect === false);
}

// --- tenant (domínio, sem redirect global de auth) ---
{
  const err = new OperationalError("tenant_mismatch", "raw", null);
  const d = describeError(err);
  assert("tenant: describeError code", d.code === "tenant_mismatch");
  assert("tenant: mensagem amigável", d.message === "Operação fora do tenant.");
  const c = classifyError(err);
  assert("tenant: classify sem auth redirect", c.requiresAuthRedirect === false);
}

// --- SSR fallback HTML ---
{
  const html = renderErrorPage();
  assert("SSR: lang pt-BR", html.includes('lang="pt-BR"'));
  assert("SSR: reload", html.includes("location.reload()"));
  assert("SSR: link início", html.includes('href="/"'));
  assert("SSR: tentar novamente", html.includes("Tentar novamente"));
}

// --- UI / navegação preservada (wiring estático) ---
{
  const boundary = read("components/global-error-boundary.tsx");
  assert("boundary: retry limpa estado", boundary.includes('setState({ error: null })'));
  assert("boundary: link início", boundary.includes('href="/"'));
  assert("boundary: não força location", !boundary.includes("location.assign"));
  assert("boundary: não desmonta layout pai", boundary.includes("return this.props.children"));
}

{
  const root = read("routes/__root.tsx");
  assert(
    "layout: offline fora do boundary",
    root.indexOf("<OfflineFallback />") < root.indexOf("<GlobalErrorBoundary>"),
  );
  assert(
    "layout: deployment fora do boundary",
    root.indexOf("<DeploymentFallback />") < root.indexOf("<GlobalErrorBoundary>"),
  );
  assert("route error: router.invalidate", root.includes("router.invalidate()"));
  assert("route error: reset preserva rota", root.includes("reset()"));
  assert("route error: link início", root.includes('href="/"'));
  assert("404: Link home", root.includes('<Link') && root.includes('to="/"'));
}

{
  const login = read("routes/login.tsx");
  assert("tenant login: mensagem inline", login.includes("não pertence à instituição"));
  assert("tenant login: signOut sem redirect", login.includes("tenant_mismatch") && login.includes("signOut"));
  const messages = read("lib/errors/messages.ts");
  assert(
    "tenant: sem reason na URL de login",
    !messages.includes("tenant_mismatch"),
  );
}

{
  const authActions = read("lib/errors/auth-actions.ts");
  assert("auth redirect: idempotente", authActions.includes("redirectInFlight"));
  assert("auth redirect: pula /login", authActions.includes('path === "/login"'));
  assert("auth redirect: pula /site", authActions.includes('"/site"'));
}

{
  const qc = read("lib/errors/create-query-client.ts");
  const handler = qc.slice(
    qc.indexOf("function handleGlobalQueryError"),
    qc.indexOf("function shouldRetry"),
  );
  assert(
    "query: auth redirect antes de log genérico",
    handler.indexOf("redirectToLoginWithReason") < handler.indexOf("logClient"),
  );
  assert("query: sem retry offline/auth", qc.includes('kind === "offline"'));
}

if (failures.length > 0) {
  console.error(`\n${failures.length} falha(s) comportamental(is)\n`);
  process.exit(1);
}

console.log("\nTodos os testes comportamentais passaram.\n");
