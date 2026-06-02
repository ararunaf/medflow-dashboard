import type { OperationalHealthCheck } from "@/lib/services/operational-health/operational-health-service";
import type { TenantSettingsRow } from "@/lib/services/tenant-settings/tenant-settings-service";
import type { PilotDeploymentSnapshot } from "@/lib/services/pilot-deployment/pilot-deployment-snapshot-service";

export type TenantPilotValidation = {
  ok: boolean;
  issues: { id: string; message: string; route?: string }[];
};

/**
 * Validação inicial de tenant antes de liberar go-live piloto.
 */
export function validateTenantForPilot(args: {
  settings: TenantSettingsRow | null;
  health: OperationalHealthCheck[];
  snapshot: PilotDeploymentSnapshot;
}): TenantPilotValidation {
  const issues: TenantPilotValidation["issues"] = [];
  const dbOk = args.health.find((h) => h.id === "database")?.ok ?? false;

  if (!dbOk) {
    issues.push({
      id: "db",
      message: "Banco de dados indisponível ou RLS bloqueando leitura.",
      route: "/operacao",
    });
  }
  if (!args.settings?.institution_name?.trim()) {
    issues.push({
      id: "name",
      message: "Nome institucional não configurado.",
      route: "/instituicao",
    });
  }
  if (!args.settings?.contact_email?.trim() && !args.settings?.support_phone?.trim()) {
    issues.push({
      id: "contact",
      message: "Canal de contato institucional ausente.",
      route: "/instituicao",
    });
  }
  if (args.snapshot.profileCount < 1) {
    issues.push({
      id: "users",
      message: "Nenhum perfil ativo detectado no tenant.",
    });
  }

  return { ok: issues.length === 0, issues };
}
