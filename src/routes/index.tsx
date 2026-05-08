import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader, StatCard, StatusBadge } from "@/components/ui-kit";
import { Activity, CalendarCheck, Stethoscope, Users, AlertTriangle, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — MedFlow-IA" },
      { name: "description", content: "Visão operacional em tempo real." },
    ],
  }),
  component: HomePage,
});

const todaySchedule = [
  { time: "07:00", unit: "UTI Adulto", doctor: "Dra. Ana Lima", status: "confirmado" as const },
  { time: "13:00", unit: "Pronto Socorro", doctor: "Dr. Caio Souza", status: "confirmado" as const },
  { time: "19:00", unit: "Pediatria", doctor: "—", status: "disponivel" as const },
  { time: "00:00", unit: "Centro Cirúrgico", doctor: "Dr. M. Tavares", status: "pendente" as const },
];

const alerts = [
  { title: "Plantão sem cobertura — Pediatria 19h", level: "warning" as const },
  { title: "Troca solicitada por Dr. Pedro (UTI 03/05)", level: "info" as const },
];

function HomePage() {
  return (
    <AppShell>
      <PageHeader
        title="Boa tarde, Dra. Ana"
        subtitle="Sexta, 8 de maio · Hospital São José"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard label="Plantões disponíveis" value={6} hint="próximas 48h" icon={<CalendarCheck className="h-4 w-4" />} tone="primary" />
        <StatCard label="Confirmados" value={42} hint="esta semana" icon={<Activity className="h-4 w-4" />} tone="success" />
        <StatCard label="Profissionais ativos" value={138} icon={<Users className="h-4 w-4" />} />
        <StatCard label="Alertas" value={2} hint="requer atenção" icon={<AlertTriangle className="h-4 w-4" />} tone="warning" />
      </div>

      <div className="mt-6 grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl bg-card border border-border ring-soft">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Escala do dia</h2>
            <span className="text-xs text-muted-foreground">Tempo real</span>
          </div>
          <ul className="divide-y divide-border">
            {todaySchedule.map((s) => (
              <li key={s.time} className="flex items-center gap-4 px-5 py-3.5">
                <div className="w-14 shrink-0">
                  <div className="text-sm font-semibold text-foreground">{s.time}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{s.unit}</div>
                  <div className="text-xs text-muted-foreground truncate">{s.doctor}</div>
                </div>
                <StatusBadge status={s.status} />
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card ring-soft">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[color:var(--secondary)]" />
              <h2 className="text-sm font-semibold">Insights MedFlow</h2>
            </div>
            <div className="p-5 space-y-3">
              <div className="text-sm text-foreground">
                Cobertura prevista para o fim de semana: <span className="font-semibold text-[color:var(--success)]">92%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full w-[92%] bg-[color:var(--secondary)]" />
              </div>
              <p className="text-xs text-muted-foreground">
                Sugestão: distribuir 2 plantões da Pediatria para liberar UTI noturna.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card ring-soft">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Alertas operacionais</h2>
            </div>
            <ul className="divide-y divide-border">
              {alerts.map((a) => (
                <li key={a.title} className="px-5 py-3 text-sm text-foreground">
                  {a.title}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
