import { BRANDING, defaultLogoUrl } from "@/lib/assets";

const LOGIN_PANEL_DESCRIPTION =
  "Escalas, plantões e indicadores clínicos em tempo real, em um único fluxo.";

/** Card de logomarca — mesmo padrão visual do painel direito (`login.tsx`). */
const LOGIN_LOGO_CARD =
  "flex justify-center bg-surface rounded-2xl border border-border w-full";

/** Painel esquerdo de branding nas telas de autenticação (desktop/tablet ≥ lg). */
export function LoginBrandingPanel() {
  return (
    <div className="hidden lg:flex flex-1 bg-brand-gradient relative overflow-hidden">
      <div
        className="relative z-10 p-10 lg:p-12 xl:p-16 flex flex-col h-full w-full min-h-0 text-primary-foreground"
        aria-hidden="true"
      >
        <div className="flex-1 flex flex-col items-center justify-center min-h-0 w-full">
          <div className="w-full max-w-md flex flex-col items-center text-center">
            <div className={`${LOGIN_LOGO_CARD} p-7 lg:p-8 mb-6 lg:mb-8`}>
              <img
                src={defaultLogoUrl}
                alt=""
                style={{ height: "7.5rem" }}
                className="w-auto object-contain"
                decoding="async"
              />
            </div>
            <p className="text-2xl lg:text-3xl font-semibold tracking-tight leading-tight">
              {BRANDING.productName}
            </p>
            <p className="mt-2 text-sm lg:text-base font-medium text-primary-foreground/90">
              Plataforma Operacional Inteligente
            </p>
          </div>
        </div>

        <div className="shrink-0 w-full max-w-md mx-auto pb-2 text-center">
          <h2 className="text-3xl lg:text-4xl font-semibold leading-tight">{BRANDING.tagline}</h2>
          <p className="mt-4 text-sm lg:text-base text-primary-foreground/80 leading-relaxed">
            {LOGIN_PANEL_DESCRIPTION}
          </p>
        </div>
      </div>
    </div>
  );
}
