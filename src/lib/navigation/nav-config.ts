import {
  Activity,
  BarChart3,
  Brain,
  Building2,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FileCheck2,
  FileStack,
  FileText,
  Flag,
  FolderOpen,
  Gauge,
  HelpCircle,
  History,
  Layers,
  LayoutDashboard,
  Lock,
  type LucideIcon,
  MessageSquareWarning,
  Scale,
  ScanLine,
  Settings2,
  Shield,
  Sparkles,
  Stethoscope,
  Timer,
  User,
  UserCog,
  Users,
  Wallet,
  Wrench,
  Rocket,
  Radio,
  Home,
  Bot,
  HeartPulse,
  CalendarClock,
  ScrollText,
} from "lucide-react";
import { can, isOperationalManager } from "@/lib/auth/rbac";
import type { NavGroup, NavItem, NavRole, NavRequire } from "./types";

/** Catálogo de placeholders Fase 3 (rota `/fase3/$slug`). */
export const PHASE3_PLACEHOLDERS: Record<
  string,
  { title: string; groupLabel: string; description?: string }
> = {
  "processamento-lote": {
    title: "Processamento em Lote",
    groupLabel: "Operação",
    description: "Orquestração unificada de lotes documentais em escala.",
  },
  pacientes: {
    title: "Pacientes",
    groupLabel: "Clínico",
    description: "Cadastro e visão consolidada de pacientes.",
  },
  prontuarios: {
    title: "Prontuários",
    groupLabel: "Clínico",
    description: "Prontuário eletrônico integrado ao fluxo operacional.",
  },
  evolucoes: {
    title: "Evoluções",
    groupLabel: "Clínico",
    description: "Registro clínico de evoluções e acompanhamentos.",
  },
  agendamentos: {
    title: "Agendamentos",
    groupLabel: "Clínico",
    description: "Agenda clínica e encaixes.",
  },
  "documentos-clinicos": {
    title: "Documentos Clínicos",
    groupLabel: "Clínico",
    description: "Repositório de documentos clínicos.",
  },
  historico: {
    title: "Histórico",
    groupLabel: "Monitoramento",
    description: "Histórico consolidado de processamentos e eventos.",
  },
  jobs: {
    title: "Jobs",
    groupLabel: "Monitoramento",
    description: "Visibilidade de jobs e workers de plataforma.",
  },
  sla: {
    title: "SLA",
    groupLabel: "Monitoramento",
    description: "Painel de SLA e compromissos operacionais 24×7.",
  },
  "auditor-ia": {
    title: "Auditor IA",
    groupLabel: "Inteligência Artificial",
    description: "Auditor documental assistido por IA.",
  },
  "supervisor-ia": {
    title: "Supervisor IA",
    groupLabel: "Inteligência Artificial",
    description: "Supervisão inteligente do fluxo de guias.",
  },
  "correcoes-inteligentes": {
    title: "Correções Inteligentes",
    groupLabel: "Inteligência Artificial",
    description: "Sugestões e correções assistidas por IA.",
  },
  "agentes-especializados": {
    title: "Agentes Especializados",
    groupLabel: "Inteligência Artificial",
    description: "Agentes de domínio para operação e faturamento.",
  },
  usuarios: {
    title: "Usuários",
    groupLabel: "Administração",
    description: "Gestão de usuários da instituição.",
  },
  perfis: {
    title: "Perfis",
    groupLabel: "Administração",
    description: "Perfis e papéis de acesso.",
  },
  logs: {
    title: "Logs",
    groupLabel: "Administração",
    description: "Consulta de logs operacionais e de segurança.",
  },
  "ferramentas-tecnicas": {
    title: "Ferramentas Técnicas",
    groupLabel: "Administração",
    description: "Utilitários técnicos de suporte à operação.",
  },
};

function phase3(
  slug: keyof typeof PHASE3_PLACEHOLDERS,
  icon: LucideIcon,
  require?: NavRequire,
): NavItem {
  const meta = PHASE3_PLACEHOLDERS[slug];
  return {
    id: `fase3-${slug}`,
    to: `/fase3/${slug}`,
    label: meta.title,
    icon,
    placeholder: true,
    require,
  };
}

/** Arquitetura de navegação por fluxos operacionais (UX-02). */
export function buildNavGroups(): NavGroup[] {
  return [
    {
      id: "operacao",
      label: "Operação",
      accent: true,
      defaultOpen: true,
      items: [
        { id: "centro-operacional", to: "/", label: "Centro Operacional", icon: Home, exact: true },
        {
          id: "processamento-guias",
          to: "/processamento",
          label: "Processamento de Guias",
          icon: Layers,
          require: "financial",
        },
        {
          id: "captura-inteligente",
          to: "/captura",
          label: "Captura Inteligente",
          icon: ScanLine,
          require: "financial",
        },
        {
          id: "auditoria-guias",
          to: "/processamento",
          label: "Auditoria de Guias",
          icon: ClipboardCheck,
          require: "financial",
          search: { queue: "auditoria" },
        },
        {
          id: "correcoes-pendentes",
          to: "/processamento",
          label: "Correções Pendentes",
          icon: MessageSquareWarning,
          require: "financial",
          search: { queue: "correcao" },
        },
        phase3("processamento-lote", FileStack, "financial"),
        { id: "pega-plantao", to: "/plantoes", label: "Pega Plantão", icon: Stethoscope },
        { id: "escalas", to: "/escalas", label: "Escalas", icon: CalendarDays },
      ],
    },
    {
      id: "clinico",
      label: "Clínico",
      defaultOpen: false,
      items: [
        phase3("pacientes", Users),
        phase3("prontuarios", HeartPulse),
        phase3("evolucoes", Activity),
        phase3("agendamentos", CalendarClock),
        phase3("documentos-clinicos", FolderOpen),
      ],
    },
    {
      id: "faturamento",
      label: "Faturamento",
      defaultOpen: true,
      items: [
        { id: "guias", to: "/tiss", label: "Guias", icon: ClipboardList, search: { tab: "guias" } },
        { id: "lotes", to: "/tiss", label: "Lotes", icon: Layers, search: { tab: "lotes" } },
        {
          id: "convenios",
          to: "/tiss",
          label: "Convênios",
          icon: Building2,
          search: { tab: "convenios" },
        },
        {
          id: "revisao-contratos",
          to: "/contratos",
          label: "Revisão de Contratos",
          icon: FileCheck2,
          require: "financial",
        },
        { id: "glosas", to: "/tiss", label: "Glosas", icon: Scale, search: { tab: "glosas" } },
        {
          id: "financeiro",
          to: "/financeiro",
          label: "Financeiro",
          icon: Wallet,
          require: "financial",
        },
        {
          id: "dashboard-financeiro",
          to: "/financeiro/dashboard-executivo",
          label: "Dashboard Financeiro",
          icon: LayoutDashboard,
          require: "financial",
        },
        {
          id: "fechamento",
          to: "/financeiro/fechamento-operacional",
          label: "Fechamento",
          icon: Lock,
          require: "financial",
        },
        {
          id: "conciliacao",
          to: "/financeiro/conciliacao-operacional",
          label: "Conciliação",
          icon: Gauge,
          require: "financial",
        },
        {
          id: "executivo",
          to: "/executivo",
          label: "Executivo",
          icon: Sparkles,
          require: "financial",
        },
      ],
    },
    {
      id: "monitoramento",
      label: "Monitoramento",
      defaultOpen: false,
      items: [
        {
          id: "filas",
          to: "/processamento",
          label: "Fila — OCR Pendente",
          icon: Layers,
          require: "financial",
          search: { queue: "ocr_pendente" },
        },
        {
          id: "processamentos",
          to: "/processamento",
          label: "Fila — Parser",
          icon: FileText,
          require: "financial",
          search: { queue: "parser" },
        },
        {
          id: "analytics",
          to: "/analytics",
          label: "Analytics",
          icon: BarChart3,
          require: "financial",
        },
        {
          id: "saude-plataforma",
          to: "/operacao",
          label: "Saúde da Plataforma",
          icon: Radio,
          require: "tenant_settings_read",
        },
        phase3("historico", History, "financial"),
        phase3("jobs", Timer, "tenant_settings_read"),
        phase3("sla", Shield, "financial"),
      ],
    },
    {
      id: "ia",
      label: "Inteligência Artificial",
      defaultOpen: false,
      items: [
        {
          id: "central-ia",
          to: "/central",
          label: "Central IA",
          icon: Brain,
          require: "operational_manager",
        },
        phase3("auditor-ia", Bot, "operational_manager"),
        phase3("supervisor-ia", Brain, "operational_manager"),
        phase3("correcoes-inteligentes", Sparkles, "operational_manager"),
        phase3("agentes-especializados", Bot, "operational_manager"),
      ],
    },
    {
      id: "administracao",
      label: "Administração",
      defaultOpen: false,
      items: [
        { id: "instituicao", to: "/instituicao", label: "Instituição", icon: Building2 },
        phase3("usuarios", Users, "tenant_settings_read"),
        phase3("perfis", UserCog, "tenant_settings_read"),
        phase3("logs", ScrollText, "tenant_settings_read"),
        phase3("ferramentas-tecnicas", Wrench, "tenant_settings_read"),
        {
          id: "piloto",
          to: "/piloto",
          label: "Piloto",
          icon: Rocket,
          require: "tenant_settings_read",
        },
        {
          id: "go-live",
          to: "/lancamento",
          label: "Go-live",
          icon: Flag,
          require: "tenant_settings_read",
        },
        { id: "ajuda", to: "/ajuda", label: "Ajuda", icon: HelpCircle },
        { id: "perfil", to: "/perfil", label: "Perfil", icon: User },
      ],
    },
  ];
}

function passesRequire(role: NavRole, require?: NavRequire): boolean {
  if (!require) return true;
  if (require === "financial") return can(role, "financial_closing:read");
  if (require === "tenant_settings_read") return can(role, "tenant_settings:read");
  if (require === "operational_manager") return isOperationalManager(role);
  return true;
}

/** Filtra grupos/itens pelos mesmos gates RBAC já usados na UI. */
export function navGroupsForRole(role: NavRole): NavGroup[] {
  return buildNavGroups()
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => passesRequire(role, item.require)),
    }))
    .filter((group) => group.items.length > 0);
}

export function flattenNavItems(groups: NavGroup[]): NavItem[] {
  return groups.flatMap((g) => g.items);
}

/**
 * Primários do bottom nav mobile (≤5) + drawer “Mais”.
 * Role-aware: operadores financeiros priorizam fluxo documental.
 */
export function mobilePrimaryIdsForRole(role: NavRole): string[] {
  const financial = can(role, "financial_closing:read");
  const manager = isOperationalManager(role);

  if (financial) {
    return [
      "centro-operacional",
      "processamento-guias",
      "captura-inteligente",
      manager ? "central-ia" : "guias",
      "pega-plantao",
    ];
  }

  return ["centro-operacional", "pega-plantao", "escalas", "perfil", "ajuda"];
}

export function itemMatchKey(item: NavItem): string {
  if (!item.search || Object.keys(item.search).length === 0) return item.to;
  const q = new URLSearchParams(item.search).toString();
  return `${item.to}?${q}`;
}

/** Resolve o item ativo (prioriza match mais específico com search). */
export function resolveActiveNavItem(
  items: NavItem[],
  pathname: string,
  searchStr: string,
): NavItem | null {
  const params = new URLSearchParams(searchStr.startsWith("?") ? searchStr.slice(1) : searchStr);
  const scored = items
    .map((item) => {
      const pathOk = item.exact
        ? pathname === item.to
        : pathname === item.to || pathname.startsWith(`${item.to}/`);
      if (!pathOk) return null;

      let score = item.to.length;
      if (item.search && Object.keys(item.search).length > 0) {
        const allMatch = Object.entries(item.search).every(([k, v]) => params.get(k) === v);
        if (!allMatch) return null;
        score += 100;
      } else if (item.to === "/processamento" && params.has("queue")) {
        // Evita marcar "Processamento" genérico quando há fila específica no menu.
        const hasQueueSibling = items.some(
          (other) =>
            other.id !== item.id &&
            other.to === "/processamento" &&
            other.search?.queue &&
            params.get("queue") === other.search.queue,
        );
        if (hasQueueSibling) score -= 50;
      }
      return { item, score };
    })
    .filter((x): x is { item: NavItem; score: number } => x != null)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.item ?? null;
}

/** Ícone Settings para o slot “Mais” no mobile. */
export const MoreNavIcon = Settings2;
