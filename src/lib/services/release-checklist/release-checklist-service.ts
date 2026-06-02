import type { ProductionValidationReport } from "@/lib/services/production-validation/production-validation-service";
import type { ReadinessItem } from "@/lib/services/readiness-check/readiness-check-service";

export type ReleaseChecklistKind =
  | "release"
  | "production"
  | "go_live"
  | "tenant_onboarding"
  | "smoke_test";

export type ReleaseChecklistItem = ReadinessItem & {
  kind: ReleaseChecklistKind;
  manual?: boolean;
};

export type ReleaseChecklistBundle = {
  release: ReleaseChecklistItem[];
  production: ReleaseChecklistItem[];
  goLive: ReleaseChecklistItem[];
  tenantOnboarding: ReleaseChecklistItem[];
  smokeTest: ReleaseChecklistItem[];
  overallPercent: number;
};

export function buildReleaseChecklistBundle(args: {
  productionReport: ProductionValidationReport;
  operationalDone: number;
  operationalTotal: number;
  deploymentPercent: number;
  wizardPercent: number;
  smokeAllPassed: boolean;
}): ReleaseChecklistBundle {
  const { productionReport: pr } = args;
  const envOk = pr.startup.publicEnv.supabaseConfigured;
  const prodScoreOk = pr.scorePercent >= 80;

  const release: ReleaseChecklistItem[] = [
    {
      id: "rel_tag",
      kind: "release",
      done: pr.startup.publicEnv.isProductionBuild,
      title: "Build de produção gerado",
      hint: "Execute npm run build antes do deploy Cloudflare.",
    },
    {
      id: "rel_migrations",
      kind: "release",
      manual: true,
      done: false,
      title: "Migrations Supabase aplicadas no projeto",
      hint: "Confirme supabase/migrations no painel ou CLI.",
    },
    {
      id: "rel_secrets",
      kind: "release",
      manual: true,
      done: false,
      title: "Secrets VITE_ e MEDFLOW_ no painel Cloudflare",
      hint: "Nunca commite .env com chaves reais.",
    },
  ];

  const production: ReleaseChecklistItem[] = pr.items.slice(0, 8).map((i) => ({
    id: `prod_${i.id}`,
    kind: "production" as const,
    done: i.done,
    title: i.title,
    hint: i.hint,
  }));

  const goLive: ReleaseChecklistItem[] = [
    {
      id: "gl_domain",
      kind: "go_live",
      done: pr.startup.publicEnv.appUrlConfigured,
      title: "Domínio institucional configurado",
      hint: "DNS → Cloudflare Workers + VITE_MEDFLOW_APP_URL.",
    },
    {
      id: "gl_validation",
      kind: "go_live",
      done: pr.ok,
      title: "Validação de produção (itens críticos)",
      hint: `${pr.scorePercent}% do score de produção.`,
    },
    {
      id: "gl_smoke",
      kind: "go_live",
      done: args.smokeAllPassed,
      title: "Smoke tests operacionais",
      hint: "Login, dashboard, financeiro, conciliação, onboarding.",
    },
    {
      id: "gl_pilot",
      kind: "go_live",
      done: args.deploymentPercent >= 85,
      title: "Checklist piloto ≥ 85%",
      hint: `Atual: ${args.deploymentPercent}%.`,
    },
  ];

  const tenantOnboarding: ReleaseChecklistItem[] = [
    {
      id: "on_tenant",
      kind: "tenant_onboarding",
      manual: true,
      done: false,
      title: "Tenant criado no Supabase (tenants + profiles)",
      hint: "Slug único e usuário admin vinculado.",
    },
    {
      id: "on_branding",
      kind: "tenant_onboarding",
      done: pr.items.some((i) => i.id === "tenant_institution" && i.done),
      title: "Instituição e contato configurados",
      hint: "Página Instituição no app.",
    },
    {
      id: "on_wizard",
      kind: "tenant_onboarding",
      done: args.wizardPercent >= 80,
      title: "Wizard de onboarding ≥ 80%",
      hint: `Atual: ${args.wizardPercent}%.`,
    },
    {
      id: "on_ops",
      kind: "tenant_onboarding",
      done:
        args.operationalTotal > 0 &&
        Math.round((args.operationalDone / args.operationalTotal) * 100) >= 75,
      title: "Readiness operacional ≥ 75%",
      hint: "Conectividade, branding e contato.",
    },
  ];

  const smokeTest: ReleaseChecklistItem[] = [
    {
      id: "sm_login",
      kind: "smoke_test",
      done: envOk,
      title: "Login e sessão",
      hint: "Supabase auth + perfil tenant.",
    },
    {
      id: "sm_dashboard",
      kind: "smoke_test",
      done: prodScoreOk,
      title: "Dashboard / home",
      hint: "Carregamento SSR sem erro 500.",
    },
    {
      id: "sm_tiss",
      kind: "smoke_test",
      done: args.smokeAllPassed,
      title: "TISS (lotes / guias)",
      hint: "Leitura de tiss_batches conforme RBAC.",
    },
    {
      id: "sm_finance",
      kind: "smoke_test",
      done: args.smokeAllPassed,
      title: "Módulos financeiros (leitura)",
      hint: "Fechamento e conciliação acessíveis conforme RBAC.",
    },
    {
      id: "sm_recon",
      kind: "smoke_test",
      done: args.smokeAllPassed,
      title: "Conciliação operacional",
      hint: "Lista e detalhe respondem.",
    },
    {
      id: "sm_onboarding",
      kind: "smoke_test",
      done: args.wizardPercent >= 50,
      title: "Fluxo de onboarding piloto",
      hint: "Página /piloto e wizard.",
    },
  ];

  const all = [...release, ...production, ...goLive, ...tenantOnboarding, ...smokeTest];
  const done = all.filter((i) => i.done).length;
  const overallPercent = all.length ? Math.round((done / all.length) * 100) : 0;

  return { release, production, goLive, tenantOnboarding, smokeTest, overallPercent };
}
