import type { OperationalCommandCenterSnapshot } from "@/lib/operations/api/queries/command-center";
import type { OperationalAlert } from "@/lib/operations/alerts/types";
import { primaryActionForAlertRuleId } from "./alert-action-map";
import type { OperationalContextAction } from "./types";

const STABLE_QUICK: OperationalContextAction[] = [
  {
    key: "quick-escalas",
    label: "Escala 14d",
    priority: 5,
    target: { to: "/escalas", search: {} },
  },
  {
    key: "quick-opens",
    label: "Vagas abertas",
    priority: 4,
    target: { to: "/plantoes", search: { tab: "disponiveis" } },
  },
  {
    key: "quick-swaps",
    label: "Swaps",
    priority: 4,
    target: { to: "/plantoes", search: { tab: "swaps" } },
  },
  {
    key: "quick-perfil-availability",
    label: "Minha disponibilidade",
    priority: 6,
    target: { to: "/perfil", search: {} },
  },
];

function actionSignature(a: OperationalContextAction): string {
  const t = a.target;
  if (t.to === "/perfil") return "/perfil";
  return `${t.to}:${JSON.stringify(t.search ?? {})}`;
}

function dedupeActions(actions: OperationalContextAction[]): OperationalContextAction[] {
  const seen = new Set<string>();
  const out: OperationalContextAction[] = [];
  for (const a of actions) {
    const sig = actionSignature(a);
    if (seen.has(sig)) continue;
    seen.add(sig);
    out.push(a);
  }
  return out;
}

/**
 * Deriva atalhos a partir dos alertas ativos (maior severidade primeiro),
 * mesclando com atalhos estáveis da operação.
 */
export function deriveOperationalQuickActions(
  alerts: OperationalAlert[],
  snapshot: OperationalCommandCenterSnapshot | undefined,
): OperationalContextAction[] {
  const fromAlerts = [...alerts]
    .sort((a, b) => {
      const sev = (x: OperationalAlert["severity"]) =>
        x === "critical" ? 0 : x === "warning" ? 1 : 2;
      return sev(a.severity) - sev(b.severity) || a.title.localeCompare(b.title, "pt-BR");
    })
    .map((a) => primaryActionForAlertRuleId(a.id))
    .filter((x): x is OperationalContextAction => x != null);

  const contextual: OperationalContextAction[] = [...fromAlerts];

  if (snapshot && snapshot.widgets.pendingSwaps > 0) {
    contextual.push({
      key: "ctx-pending-swaps-n",
      label: `Swaps (${snapshot.widgets.pendingSwaps})`,
      priority: 2,
      target: { to: "/plantoes", search: { tab: "swaps" } },
    });
  }

  const merged = dedupeActions([...contextual, ...STABLE_QUICK]).sort(
    (a, b) => a.priority - b.priority || a.label.localeCompare(b.label, "pt-BR"),
  );
  return merged.slice(0, 8);
}
