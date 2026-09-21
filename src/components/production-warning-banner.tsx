import { validatePublicEnv } from "@/lib/env/public-env-validation";

/**
 * Avisos discretos em build de produção quando o ambiente público está incompleto ou arriscado.
 * Só aparece para quem já está logado como admin — nunca na tela de login/pública, onde
 * um aviso operacional interno passaria uma imagem de sistema mal configurado para clientes.
 */
export function ProductionWarningBanner({ visible }: { visible: boolean }) {
  const env = validatePublicEnv();
  if (!visible || !env.isProductionBuild || (env.ok && env.warnings.length === 0)) return null;

  return (
    <div
      role="status"
      className="border-b border-[color:var(--warning)]/40 bg-[color:var(--warning)]/10 px-3 py-2 text-center text-xs text-foreground"
    >
      <span className="font-semibold">Produção · </span>
      {env.warnings.length > 0 ? (
        <span>{env.warnings.join(" · ")}</span>
      ) : (
        <span>Revise variáveis VITE_ e checklist em Instituição antes do go-live.</span>
      )}
    </div>
  );
}
