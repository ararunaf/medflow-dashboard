import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader, StatusBadge } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";

export const Route = createFileRoute("/escalas")({
  head: () => ({
    meta: [
      { title: "Escalas — MedFlow-IA" },
      { name: "description", content: "Calendário e timeline operacional." },
    ],
  }),
  component: EscalasPage,
});

const days = Array.from({ length: 14 }, (_, i) => i + 5);
const shifts = [
  { id: "1", date: "08 Mai", time: "07:00 — 19:00", unit: "UTI Adulto", doctor: "Dra. Ana Lima", status: "confirmado" as const },
  { id: "2", date: "08 Mai", time: "19:00 — 07:00", unit: "Pediatria", doctor: "—", status: "disponivel" as const },
  { id: "3", date: "09 Mai", time: "07:00 — 13:00", unit: "Pronto Socorro", doctor: "Dr. Caio", status: "pendente" as const },
  { id: "4", date: "09 Mai", time: "13:00 — 19:00", unit: "Centro Cirúrgico", doctor: "Dr. M. Tavares", status: "trocar" as const },
  { id: "5", date: "10 Mai", time: "07:00 — 19:00", unit: "UTI Neo", doctor: "—", status: "disponivel" as const },
];

function EscalasPage() {
  return (
    <AppShell>
      <PageHeader
        title="Escalas"
        subtitle="Maio de 2026"
        actions={
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" /> Filtros
          </Button>
        }
      />

      <div className="rounded-xl bg-card border border-border ring-soft p-3 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {days.map((d) => {
            const active = d === 8;
            return (
              <button
                key={d}
                className={`flex flex-col items-center justify-center w-12 h-16 rounded-lg text-xs transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground hover:bg-accent/30"
                }`}
              >
                <span className="opacity-70">Mai</span>
                <span className="text-base font-semibold">{d}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {shifts.map((s) => (
          <Link
            key={s.id}
            to="/plantoes"
            className="block rounded-xl bg-card border border-border ring-soft p-4 hover:border-[color:var(--secondary)] transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="text-center shrink-0">
                <div className="text-xs text-muted-foreground">{s.date}</div>
                <div className="text-sm font-semibold mt-0.5">{s.time.split(" ")[0]}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground truncate">{s.unit}</h3>
                  <StatusBadge status={s.status} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{s.time} · {s.doctor}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
