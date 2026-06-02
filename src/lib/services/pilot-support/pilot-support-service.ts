export type PilotTroubleshootItem = {
  id: string;
  title: string;
  fix: string;
  route?: string;
};

export type PilotOperationalStatus = {
  label: string;
  ok: boolean;
  detail: string;
};

/** Resumo simplificado para painel de suporte inicial. */
export function buildPilotOperationalStatus(args: {
  dbOk: boolean;
  deploymentPercent: number;
  envWarningCount: number;
  contactConfigured: boolean;
}): PilotOperationalStatus[] {
  return [
    {
      label: "Banco de dados",
      ok: args.dbOk,
      detail: args.dbOk ? "Conectividade OK" : "Verifique Supabase e RLS",
    },
    {
      label: "Implantação piloto",
      ok: args.deploymentPercent >= 85,
      detail: `${args.deploymentPercent}% do checklist concluído`,
    },
    {
      label: "Ambiente público",
      ok: args.envWarningCount === 0,
      detail:
        args.envWarningCount === 0
          ? "Sem avisos VITE_"
          : `${args.envWarningCount} aviso(s) — revisar com infra`,
    },
    {
      label: "Contato institucional",
      ok: args.contactConfigured,
      detail: args.contactConfigured ? "Canal configurado" : "Configure e-mail ou telefone",
    },
  ];
}

export const pilot_troubleshoot_quick: PilotTroubleshootItem[] = [
  {
    id: "blank",
    title: "Tela em branco após deploy",
    fix: "Confirme variáveis VITE_SUPABASE_* e limpe cache CDN. Gere export de diagnóstico.",
    route: "/operacao",
  },
  {
    id: "rls",
    title: "Erro ao salvar parametrização",
    fix: "Verifique papel tenant_admin e políticas RLS do tenant_settings.",
    route: "/instituicao",
  },
  {
    id: "realtime",
    title: "Indicadores parados",
    fix: "Teste rede sem proxy; use Atualizar na Home e veja latência no painel ops.",
    route: "/operacao",
  },
  {
    id: "demo",
    title: "Demo guiada não aparece",
    fix: "Ative em Piloto e implantação; a faixa usa sessionStorage desta aba.",
    route: "/piloto",
  },
  {
    id: "checklist",
    title: "Checklist não avança",
    fix: "Itens automáticos dependem de dados reais; confirme manualmente permissões e readiness.",
    route: "/piloto",
  },
];

export type PilotDiagnosticExport = {
  kind: "medflow_pilot_diagnostic_v1";
  generatedAt: string;
  tenantId: string | null;
  userAgent: string;
  checklistSummary?: { id: string; done: boolean; title: string }[];
  healthSummary?: { id: string; ok: boolean; label: string }[];
  publicEnvWarnings?: string[];
};

export function buildPilotDiagnosticExport(
  payload: Omit<PilotDiagnosticExport, "kind" | "generatedAt">,
): PilotDiagnosticExport {
  return {
    kind: "medflow_pilot_diagnostic_v1",
    generatedAt: new Date().toISOString(),
    ...payload,
  };
}
