import { PHASE3_PLACEHOLDERS, flattenNavItems, navGroupsForRole } from "./nav-config";
import type { BreadcrumbCrumb, NavRole } from "./types";

const STATIC_CRUMBS: Record<string, BreadcrumbCrumb[]> = {
  "/": [{ label: "Centro Operacional" }],
  "/captura": [{ label: "Operação", to: "/" }, { label: "Captura Inteligente" }],
  "/processamento": [{ label: "Operação", to: "/" }, { label: "Processamento de Guias" }],
  "/plantoes": [{ label: "Operação", to: "/" }, { label: "Pega Plantão" }],
  "/escalas": [{ label: "Operação", to: "/" }, { label: "Escalas" }],
  "/tiss": [{ label: "Faturamento", to: "/financeiro" }, { label: "Guias TISS" }],
  "/financeiro": [{ label: "Faturamento" }, { label: "Financeiro" }],
  "/financeiro/dashboard-executivo": [
    { label: "Faturamento", to: "/financeiro" },
    { label: "Dashboard Financeiro" },
  ],
  "/financeiro/fechamento-operacional": [
    { label: "Faturamento", to: "/financeiro" },
    { label: "Fechamento" },
  ],
  "/financeiro/conciliacao-operacional": [
    { label: "Faturamento", to: "/financeiro" },
    { label: "Conciliação" },
  ],
  "/executivo": [{ label: "Faturamento", to: "/financeiro" }, { label: "Executivo" }],
  "/analytics": [{ label: "Monitoramento", to: "/operacao" }, { label: "Analytics" }],
  "/operacao": [{ label: "Monitoramento" }, { label: "Saúde da Plataforma" }],
  "/central": [{ label: "Inteligência Artificial" }, { label: "Central IA" }],
  "/instituicao": [{ label: "Administração" }, { label: "Instituição" }],
  "/piloto": [{ label: "Administração", to: "/instituicao" }, { label: "Piloto" }],
  "/lancamento": [{ label: "Administração", to: "/instituicao" }, { label: "Go-live" }],
  "/ajuda": [{ label: "Administração" }, { label: "Ajuda" }],
  "/perfil": [{ label: "Administração" }, { label: "Perfil" }],
};

const QUEUE_LABELS: Record<string, string> = {
  ocr_pendente: "OCR Pendente",
  parser: "Parser",
  auditoria: "Auditoria",
  correcao: "Correção",
  aguardando_revisao: "Aguardando Revisão",
  aprovadas: "Aprovadas",
  reprovadas: "Reprovadas",
};

export function buildBreadcrumbs(
  pathname: string,
  searchStr: string,
  role: NavRole,
): BreadcrumbCrumb[] {
  if (pathname.startsWith("/fase3/")) {
    const slug = pathname.slice("/fase3/".length).split("/")[0] ?? "";
    const meta = PHASE3_PLACEHOLDERS[slug];
    return [
      { label: meta?.groupLabel ?? "MedicFlow", to: "/" },
      { label: meta?.title ?? "Disponível na Fase 3" },
    ];
  }

  if (pathname.startsWith("/captura/revisao/")) {
    return [
      { label: "Operação", to: "/" },
      { label: "Captura Inteligente", to: "/captura" },
      { label: "Revisão" },
    ];
  }

  if (pathname === "/processamento") {
    const params = new URLSearchParams(searchStr.startsWith("?") ? searchStr.slice(1) : searchStr);
    const queue = params.get("queue");
    const base = STATIC_CRUMBS["/processamento"] ?? [];
    if (queue && QUEUE_LABELS[queue]) {
      return [
        ...base.slice(0, -1),
        { label: "Processamento", to: "/processamento" },
        { label: QUEUE_LABELS[queue] },
      ];
    }
    return base;
  }

  const staticTrail = STATIC_CRUMBS[pathname];
  if (staticTrail) return staticTrail;

  const items = flattenNavItems(navGroupsForRole(role));
  const hit = items.find((i) => i.to === pathname && !i.search);
  if (hit) {
    return [{ label: "Centro Operacional", to: "/" }, { label: hit.label }];
  }

  return [{ label: "Centro Operacional", to: "/" }];
}
