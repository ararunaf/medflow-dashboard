import type { OperationalHealthCheck } from "@/lib/services/operational-health/operational-health-service";
import type { TenantSettingsRow } from "@/lib/services/tenant-settings/tenant-settings-service";

export type ReadinessItem = {
  id: string;
  done: boolean;
  title: string;
  hint: string;
};

export function buildOperationalReadinessChecklist(
  settings: TenantSettingsRow | null,
  health: OperationalHealthCheck[],
): ReadinessItem[] {
  const dbOk = health.find((h) => h.id === "database")?.ok ?? false;
  const settingsRow = settings;

  return [
    {
      id: "db",
      done: dbOk,
      title: "Conectividade e leitura de dados",
      hint: "Garante que o tenant responde no Supabase com políticas RLS ativas.",
    },
    {
      id: "institution_name",
      done: !!(settingsRow?.institution_name?.trim().length ?? 0),
      title: "Nome institucional configurado",
      hint: "Aparece no título do browser, relatórios e landing executiva.",
    },
    {
      id: "contact",
      done: !!(settingsRow?.contact_email?.trim() || settingsRow?.support_phone?.trim()),
      title: "Canal de contato ou suporte",
      hint: "E-mail ou telefone ajudam na operação e onboarding.",
    },
    {
      id: "branding",
      done: !!(settingsRow?.logo_url?.trim() || settingsRow?.banner_url?.trim()),
      title: "Identidade visual (logo ou banner)",
      hint: "Opcional na V1, recomendado para demos comerciais.",
    },
  ];
}
