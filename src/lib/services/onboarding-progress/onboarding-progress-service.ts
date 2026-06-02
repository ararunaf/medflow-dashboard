import { wizardProgressPercent } from "@/lib/services/onboarding-wizard/onboarding-wizard-service";
import { guidedDemoProgress, isGuidedDemoActive } from "@/lib/services/guided-demo";

export type OnboardingProgressSnapshot = {
  wizardPercent: number;
  deploymentPercent: number;
  operationalPercent: number;
  demoActive: boolean;
  demoPercent: number;
  /** Média ponderada: implantação e operacional pesam mais que wizard isolado. */
  overallPercent: number;
  pilotReady: boolean;
};

export function deploymentProgressPercent(done: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((done / total) * 100);
}

export function operationalProgressPercent(done: number, total: number): number {
  return deploymentProgressPercent(done, total);
}

export type BuildOnboardingProgressOptions = {
  /**
   * false no SSR e no primeiro paint do cliente (alinhado ao HTML do servidor).
   * true após mount — lê wizard/sessionStorage sem quebrar hidratação.
   */
  readClientStorage?: boolean;
};

/**
 * Progresso unificado de onboarding piloto — leve, calculado no cliente.
 */
export function buildOnboardingProgress(
  args: {
    deploymentDone: number;
    deploymentTotal: number;
    operationalDone: number;
    operationalTotal: number;
  },
  options?: BuildOnboardingProgressOptions,
): OnboardingProgressSnapshot {
  const readStorage = options?.readClientStorage === true;
  const wizardPercent = readStorage ? wizardProgressPercent() : 0;
  const deploymentPercent = deploymentProgressPercent(args.deploymentDone, args.deploymentTotal);
  const operationalPercent = operationalProgressPercent(
    args.operationalDone,
    args.operationalTotal,
  );
  const demoActive = readStorage && isGuidedDemoActive();
  const demoPercent = demoActive ? guidedDemoProgress().percent : 0;

  const core = deploymentPercent * 0.45 + operationalPercent * 0.35 + wizardPercent * 0.2;
  const overallPercent = Math.min(100, Math.round(core + (demoActive ? demoPercent * 0.05 : 0)));

  const pilotReady = deploymentPercent >= 85 && operationalPercent >= 75 && wizardPercent >= 80;

  return {
    wizardPercent,
    deploymentPercent,
    operationalPercent,
    demoActive,
    demoPercent,
    overallPercent,
    pilotReady,
  };
}
