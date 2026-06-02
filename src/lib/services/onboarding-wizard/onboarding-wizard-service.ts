export type WizardStepId =
  | "welcome"
  | "branding"
  | "health"
  | "catalog"
  | "finance_smoke"
  | "demo_wrap";

export type OnboardingWizardStep = {
  id: WizardStepId;
  title: string;
  description: string;
  route: string;
  /** Texto curto para card de onboarding */
  cta: string;
};

export const onboarding_wizard_steps: OnboardingWizardStep[] = [
  {
    id: "welcome",
    title: "Boas-vindas ao piloto",
    description: "Objetivo: colocar o tenant em estado demonstrável com risco controlado.",
    route: "/piloto",
    cta: "Entender escopo",
  },
  {
    id: "branding",
    title: "Branding e contato",
    description: "Configure identidade visual e canais de suporte visíveis aos usuários.",
    route: "/instituicao",
    cta: "Abrir instituição",
  },
  {
    id: "health",
    title: "Health checks",
    description: "Valide conectividade e latência antes de liberar acessos amplos.",
    route: "/operacao",
    cta: "Painel operacional",
  },
  {
    id: "catalog",
    title: "Convênios base",
    description: "Cadastre operadoras ou aplique catálogo demo apenas em ambiente controlado.",
    route: "/tiss",
    cta: "Abrir TISS",
  },
  {
    id: "finance_smoke",
    title: "Smoke financeiro",
    description:
      "Com papel financeiro: percorra hub, dashboard e conciliação. Sem acesso, valide com o sponsor.",
    route: "/financeiro",
    cta: "Hub financeiro",
  },
  {
    id: "demo_wrap",
    title: "Demonstração guiada",
    description: "Ative o modo demo comercial para walkthrough executivo.",
    route: "/piloto",
    cta: "Modo demo",
  },
];

const WIZARD_KEY = "medflow:onboarding_wizard:idx";

export function readWizardStepIndex(): number {
  if (typeof window === "undefined") return 0;
  const n = Number(window.localStorage.getItem(WIZARD_KEY) ?? "0");
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, onboarding_wizard_steps.length - 1);
}

export function writeWizardStepIndex(i: number): void {
  if (typeof window === "undefined") return;
  const clamped = Math.max(0, Math.min(i, onboarding_wizard_steps.length - 1));
  window.localStorage.setItem(WIZARD_KEY, String(clamped));
}

export function wizardProgressPercent(): number {
  const i = readWizardStepIndex();
  return Math.round(((i + 1) / onboarding_wizard_steps.length) * 100);
}
