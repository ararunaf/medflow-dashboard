/**
 * Onboarding operacional V1 — preferências em localStorage (por browser).
 */
const PREFIX = "medflow:onboarding:";

function key(id: string): string {
  return `${PREFIX}${id}`;
}

export const onboardingIds = {
  executiveQuickStart: "executive_quickstart_v1",
  executiveHints: "executive_hints_bar_v1",
  financeHubIntro: "finance_hub_intro_v1",
} as const;

export type QuickStartStep = 0 | 1 | 2 | 3;

export function readQuickStartStep(id: string): QuickStartStep {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(key(`${id}:step`));
  const n = raw != null ? Number(raw) : 0;
  if (n === 1 || n === 2 || n === 3) return n;
  return 0;
}

export function writeQuickStartStep(id: string, step: QuickStartStep): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key(`${id}:step`), String(step));
}

export function isHintDismissed(id: string): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(key(`${id}:dismiss`)) === "1";
}

export function dismissHint(id: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key(`${id}:dismiss`), "1");
}
