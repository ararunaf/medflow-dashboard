/**
 * Última linha de defesa contra "tela branca": se um erro escapar de todos os
 * error boundaries (ex.: `throw undefined` do roteador numa rota presa em
 * "pending/redirected", ou um erro acima do GlobalErrorBoundary), o React
 * desmonta a árvore inteira e a página fica vazia, sem nenhuma mensagem.
 *
 * Depois de um erro não tratado, confere se a página ficou sem conteúdo e, só
 * nesse caso, desenha um aviso mínimo em DOM puro (não depende do React, que
 * já foi desmontado) com opção de recarregar. Não recarrega sozinho, para não
 * entrar em laço.
 */
const FALLBACK_ID = "medflow-blank-screen-fallback";
const CHECK_DELAY_MS = 1500;

function pageLooksBlank(): boolean {
  const body = document.body;
  if (!body || document.getElementById(FALLBACK_ID)) return false;
  const hasAppContent = body.querySelector("main, nav, form, [role='main'], [role='dialog']");
  return !hasAppContent && (body.innerText ?? "").trim().length < 20;
}

function renderFallback(): void {
  const wrap = document.createElement("div");
  wrap.id = FALLBACK_ID;
  wrap.setAttribute("role", "alert");
  wrap.style.cssText =
    "min-height:100vh;display:flex;align-items:center;justify-content:center;padding:16px;" +
    "font-family:system-ui,-apple-system,'Segoe UI',sans-serif;background:#f8fafc;color:#0f172a";
  wrap.innerHTML = `
    <div style="max-width:420px;text-align:center">
      <h1 style="font-size:20px;font-weight:600;margin:0">Não foi possível carregar esta página</h1>
      <p style="font-size:14px;color:#475569;margin:10px 0 22px">
        Ocorreu um erro inesperado ao abrir o MedicFlow-AI. Recarregue a página; se o problema
        persistir, informe o suporte com o horário aproximado.
      </p>
      <button type="button" data-action="reload"
        style="background:#0f172a;color:#fff;border:0;border-radius:8px;padding:10px 18px;font-size:14px;cursor:pointer">
        Recarregar
      </button>
      <a href="/login" style="margin-left:8px;font-size:14px;color:#0f172a">Ir para o login</a>
    </div>`;
  wrap.querySelector("[data-action='reload']")?.addEventListener("click", () => {
    window.location.reload();
  });
  document.body.appendChild(wrap);
}

export function initBlankScreenRecovery(): void {
  if (typeof window === "undefined") return;
  let scheduled = false;
  const check = () => {
    if (scheduled) return;
    scheduled = true;
    window.setTimeout(() => {
      scheduled = false;
      if (pageLooksBlank()) renderFallback();
    }, CHECK_DELAY_MS);
  };
  window.addEventListener("error", check);
  window.addEventListener("unhandledrejection", check);
}
