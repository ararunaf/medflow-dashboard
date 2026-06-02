import type { OperationalHealthCheck } from "@/lib/services/operational-health/operational-health-service";
import type { ReadinessItem } from "@/lib/services/readiness-check/readiness-check-service";
import type { PilotDeploymentSnapshot } from "@/lib/services/pilot-deployment/pilot-deployment-snapshot-service";
import type { TenantSettingsRow } from "@/lib/services/tenant-settings/tenant-settings-service";

export type PilotDeploymentChecklistItem = ReadinessItem & {
  id: string;
  /** Itens subjetivos ou visíveis só para papéis específicos podem exigir confirmação manual. */
  manualKey?: "permissions_reviewed" | "readiness_validated" | "competence_acknowledged";
};

export type PilotManualKey = NonNullable<PilotDeploymentChecklistItem["manualKey"]>;

const PREFIX = "medflow:pilot_manual:";

export function readPilotManualFlag(tenantId: string | undefined, key: PilotManualKey): boolean {
  if (typeof window === "undefined" || !tenantId) return false;
  return window.localStorage.getItem(`${PREFIX}${tenantId}:${key}`) === "1";
}

export function writePilotManualFlag(
  tenantId: string | undefined,
  key: PilotManualKey,
  done: boolean,
): void {
  if (typeof window === "undefined" || !tenantId) return;
  window.localStorage.setItem(`${PREFIX}${tenantId}:${key}`, done ? "1" : "0");
}

/**
 * Checklist de implantação piloto — combina parametrização, contagens e readiness técnico.
 */
export function buildPilotDeploymentChecklist(args: {
  settings: TenantSettingsRow | null;
  health: OperationalHealthCheck[];
  operationalChecklist: ReadinessItem[];
  snapshot: PilotDeploymentSnapshot;
  manual: Partial<Record<PilotManualKey, boolean>>;
}): PilotDeploymentChecklistItem[] {
  const { settings, health, operationalChecklist, snapshot, manual } = args;
  const dbOk = health.find((h) => h.id === "database")?.ok ?? false;
  const allOpsDone = operationalChecklist.length > 0 && operationalChecklist.every((i) => i.done);

  const brandingDone = !!(settings?.logo_url?.trim() || settings?.banner_url?.trim());

  const usersDone = snapshot.profileCount >= 2;
  const conveniosDone = snapshot.insuranceProviderCount >= 1;
  const competenceDone =
    snapshot.openOrActiveClosingCount === null
      ? !!manual.competence_acknowledged
      : snapshot.openOrActiveClosingCount > 0;

  return [
    {
      id: "pilot_branding",
      done: brandingDone,
      title: "Branding configurado",
      hint: "Logo, banner ou paleta na tela Instituição.",
    },
    {
      id: "pilot_users",
      done: usersDone,
      title: "Usuários criados",
      hint: "Recomendamos ao menos dois perfis ativos no tenant para piloto.",
    },
    {
      id: "pilot_permissions",
      done: !!manual.permissions_reviewed,
      title: "Permissões revisadas",
      hint: "Confirme papéis (RBAC) com o responsável do hospital.",
      manualKey: "permissions_reviewed",
    },
    {
      id: "pilot_convenios",
      done: conveniosDone,
      title: "Convênios cadastrados",
      hint: "Ao menos um convênio ativo ou catálogo demo aplicado.",
    },
    {
      id: "pilot_competence",
      done: competenceDone,
      title: "Competências abertas / acompanhadas",
      hint:
        snapshot.openOrActiveClosingCount === null
          ? "Sem leitura de fechamento neste papel — confirme com o financeiro ou marque após revisão conjunta."
          : "Existe fechamento operacional não finalizado para acompanhamento.",
      manualKey: snapshot.openOrActiveClosingCount === null ? "competence_acknowledged" : undefined,
    },
    {
      id: "pilot_health",
      done: dbOk,
      title: "Health operacional OK",
      hint: "Check de banco verde no readiness institucional ou painel operacional.",
    },
    {
      id: "pilot_readiness",
      done: !!manual.readiness_validated || allOpsDone,
      title: "Readiness validado",
      hint: "Checklist operacional completo ou confirmação explícita do sponsor do piloto.",
      manualKey: "readiness_validated",
    },
  ];
}
