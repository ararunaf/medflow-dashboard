export type DemoStepId =
  | "welcome"
  | "home_ops"
  | "executive"
  | "finance_exec"
  | "tiss"
  | "institution"
  | "ops_panel";

export type GuidedDemoStep = {
  id: DemoStepId;
  title: string;
  /** Destaque curto para narrativa comercial */
  highlight: string;
  to: string;
  /** Texto curto para tooltip / drawer */
  context: string;
};

const DEMO_STORAGE = "medflow:guided_demo:active";
const DEMO_STEP = "medflow:guided_demo:step";

export const guided_demo_steps: GuidedDemoStep[] = [
  {
    id: "welcome",
    title: "Abertura executiva",
    highlight: "Visão unificada operação + suporte na V1.",
    to: "/piloto",
    context: "Use este roteiro em calls — cada passo abre uma tela acessível ao perfil convidado.",
  },
  {
    id: "home_ops",
    title: "Operação do dia",
    highlight: "Escala, trocas e sinais em tempo real.",
    to: "/",
    context: "Mostre como a equipe vê plantões e confirmações sem planilhas paralelas.",
  },
  {
    id: "executive",
    title: "Central operacional",
    highlight: "Indicadores e foco de pressão assistencial.",
    to: "/central",
    context: "Ideal para narrativa de gestão assistencial em tempo real.",
  },
  {
    id: "finance_exec",
    title: "Walkthrough executivo",
    highlight: "KPIs financeiros e narrativa para diretoria.",
    to: "/executivo",
    context: "Use o início executivo antes do dashboard detalhado — linguagem comercial clara.",
  },
  {
    id: "tiss",
    title: "TISS e faturamento assistencial",
    highlight: "Base documental e fluxo TISS.",
    to: "/tiss",
    context: "Conecte operação clínica ao ciclo de faturamento sem prometer fiscal completo.",
  },
  {
    id: "institution",
    title: "Multi-tenant & branding",
    highlight: "Logo, cores e contatos institucionais.",
    to: "/instituicao",
    context: "Demonstração white-label leve, sem rebuild.",
  },
  {
    id: "ops_panel",
    title: "Confiança operacional",
    highlight: "Health, logs e export para suporte.",
    to: "/operacao",
    context: "Feche a demo com transparência de observabilidade.",
  },
];

export function isGuidedDemoActive(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(DEMO_STORAGE) === "1";
}

export function setGuidedDemoActive(active: boolean): void {
  if (typeof window === "undefined") return;
  if (active) {
    window.sessionStorage.setItem(DEMO_STORAGE, "1");
  } else {
    window.sessionStorage.removeItem(DEMO_STORAGE);
    window.sessionStorage.removeItem(DEMO_STEP);
  }
}

export function readGuidedDemoStepIndex(): number {
  if (typeof window === "undefined") return 0;
  const n = Number(window.sessionStorage.getItem(DEMO_STEP) ?? "0");
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, guided_demo_steps.length - 1);
}

export function writeGuidedDemoStepIndex(i: number): void {
  if (typeof window === "undefined") return;
  const clamped = Math.max(0, Math.min(i, guided_demo_steps.length - 1));
  window.sessionStorage.setItem(DEMO_STEP, String(clamped));
}

export function guidedDemoProgress(): { current: number; total: number; percent: number } {
  const total = guided_demo_steps.length;
  const current = readGuidedDemoStepIndex();
  return { current: current + 1, total, percent: Math.round(((current + 1) / total) * 100) };
}

function pathMatchesStep(pathname: string, stepTo: string): boolean {
  if (stepTo === "/") return pathname === "/";
  return pathname === stepTo || pathname.startsWith(`${stepTo}/`);
}

/** Sincroniza o passo da demo quando o usuário navega manualmente — sem animações. */
export function syncGuidedDemoStepForPathname(pathname: string): number {
  if (!isGuidedDemoActive()) return readGuidedDemoStepIndex();
  const idx = guided_demo_steps.findIndex((s) => pathMatchesStep(pathname, s.to));
  if (idx >= 0 && idx !== readGuidedDemoStepIndex()) {
    writeGuidedDemoStepIndex(idx);
    return idx;
  }
  return readGuidedDemoStepIndex();
}

export function isPathOnCurrentDemoStep(pathname: string): boolean {
  const idx = readGuidedDemoStepIndex();
  const step = guided_demo_steps[idx];
  if (!step) return false;
  return pathMatchesStep(pathname, step.to);
}
