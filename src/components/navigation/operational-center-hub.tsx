import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  Brain,
  CalendarDays,
  ClipboardCheck,
  Layers,
  MessageSquareWarning,
  ScanLine,
  Stethoscope,
  Wallet,
  type LucideIcon,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { can, isOperationalManager } from "@/lib/auth/rbac";
import type { UserRole } from "@/lib/database.types";

type HubCard = {
  id: string;
  title: string;
  description: string;
  to: string;
  search?: Record<string, string>;
  icon: LucideIcon;
  require?: "financial" | "operational_manager";
  tone?: "primary" | "secondary" | "default";
};

const HUB_CARDS: HubCard[] = [
  {
    id: "hub-processamento",
    title: "Processamento de Guias",
    description: "Filas operacionais, priorização e revisão em escala.",
    to: "/processamento",
    icon: Layers,
    require: "financial",
    tone: "primary",
  },
  {
    id: "hub-captura",
    title: "Captura Inteligente",
    description: "Ingestão e OCR de documentos TISS.",
    to: "/captura",
    icon: ScanLine,
    require: "financial",
    tone: "primary",
  },
  {
    id: "hub-auditoria",
    title: "Auditorias",
    description: "Fila de auditoria preventiva de guias.",
    to: "/processamento",
    search: { queue: "auditoria" },
    icon: ClipboardCheck,
    require: "financial",
  },
  {
    id: "hub-correcoes",
    title: "Correções",
    description: "Pendências de correção antes do faturamento.",
    to: "/processamento",
    search: { queue: "correcao" },
    icon: MessageSquareWarning,
    require: "financial",
  },
  {
    id: "hub-faturamento",
    title: "Faturamento",
    description: "Guias, lotes, convênios e fechamento.",
    to: "/tiss",
    icon: Wallet,
    tone: "secondary",
  },
  {
    id: "hub-monitoramento",
    title: "Monitoramento",
    description: "Analytics e saúde da plataforma.",
    to: "/analytics",
    icon: BarChart3,
    require: "financial",
  },
  {
    id: "hub-plantao",
    title: "Pega Plantão",
    description: "Vagas, confirmações e trocas.",
    to: "/plantoes",
    icon: Stethoscope,
  },
  {
    id: "hub-escalas",
    title: "Escalas",
    description: "Programação e cobertura da escala.",
    to: "/escalas",
    icon: CalendarDays,
  },
  {
    id: "hub-ia",
    title: "Central IA",
    description: "Comando operacional com inteligência artificial.",
    to: "/central",
    icon: Brain,
    require: "operational_manager",
  },
];

function visibleCards(role: UserRole | null | undefined): HubCard[] {
  return HUB_CARDS.filter((card) => {
    if (card.require === "financial") return can(role, "financial_closing:read");
    if (card.require === "operational_manager") return isOperationalManager(role);
    return true;
  });
}

export function OperationalCenterHub({
  role,
  className,
}: {
  role: UserRole | null | undefined;
  className?: string;
}) {
  const cards = visibleCards(role);
  if (cards.length === 0) return null;

  return (
    <section className={cn("space-y-3", className)} aria-label="Fluxos do Centro Operacional">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Fluxos operacionais</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Receber → Capturar → Processar → Auditar → Corrigir → Faturar → Monitorar
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.id}
              to={card.to}
              search={card.search}
              className={cn(
                "group relative rounded-xl border border-border bg-card p-4 ring-soft",
                "hover:border-primary/35 hover:bg-accent/30 transition-colors motion-safe:duration-150",
                index < 2 && "sm:col-span-1",
                card.tone === "primary" && "border-primary/25 bg-primary/[0.03]",
                card.tone === "secondary" && "border-[color:var(--secondary)]/25",
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-primary",
                    card.tone === "primary" && "bg-primary/10",
                    card.tone === "secondary" &&
                      "bg-[color:var(--secondary)]/10 text-[color:var(--secondary)]",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-foreground truncate">{card.title}</h3>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
