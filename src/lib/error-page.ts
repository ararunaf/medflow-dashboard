import { BRANDING } from "@/lib/assets/branding";

/** HTML estático de fallback quando o SSR falha catastroficamente (sem bundle React). */
export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>${BRANDING.productName} — não foi possível carregar</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="${BRANDING.themeColor}" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; background: #f8fafc; color: #0f172a; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; border: 1px solid #e2e8f0; border-radius: 1rem; background: #fff; box-shadow: 0 4px 24px rgba(15,23,42,.06); }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; font-weight: 600; }
      p { color: #64748b; margin: 0 0 1.5rem; line-height: 1.5; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.5rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #1e3a5f; color: #fff; }
      .secondary { background: #fff; color: #1e3a5f; border-color: #cbd5e1; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Não foi possível carregar esta página</h1>
      <p>Ocorreu um erro inesperado no servidor. Tente recarregar ou volte ao início. Se o problema persistir, informe o suporte com o horário aproximado.</p>
      <div class="actions">
        <button class="primary" type="button" onclick="location.reload()">Tentar novamente</button>
        <a class="secondary" href="/">Início</a>
      </div>
    </div>
  </body>
</html>`;
}
