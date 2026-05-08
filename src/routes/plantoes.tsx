import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader, StatusBadge } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Check, X, ArrowLeftRight, Clock, MapPin } from "lucide-react";

export const Route = createFileRoute("/plantoes")({
  head: () => ({
    meta: [
      { title: "Plantões — MedFlow-IA" },
      { name: "description", content: "Aceite, recuse ou solicite trocas." },
    ],
  }),
  component: PlantoesPage,
});

type Tab = "disponiveis" | "meus";

const disponiveis = [
  { id: "p1", unit: "Pediatria", date: "08/05", time: "19:00 — 07:00", value: "R$ 2.400", local: "Bloco B · 3º andar" },
  { id: "p2", unit: "UTI Neo", date: "10/05", time: "07:00 — 19:00", value: "R$ 2.800", local: "Bloco C · 5º andar" },
  { id: "p3", unit: "Pronto Socorro", date: "11/05", time: "13:00 — 19:00", value: "R$ 1.350", local: "Térreo" },
];

const meus = [
  { id: "m1", unit: "UTI Adulto", date: "08/05", time: "07:00 — 19:00", status: "confirmado" as const, local: "Bloco A · 4º andar" },
  { id: "m2", unit: "Centro Cirúrgico", date: "09/05", time: "13:00 — 19:00", status: "trocar" as const, local: "Bloco D · 2º andar" },
];

function PlantoesPage() {
  const [tab, setTab] = useState<Tab>("disponiveis");

  return (
    <AppShell>
      <PageHeader title="Plantões" subtitle="Workflow operacional" />

      <div className="inline-flex p-1 bg-muted rounded-lg mb-4">
        {(["disponiveis", "meus"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              tab === t ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {t === "disponiveis" ? "Disponíveis" : "Meus plantões"}
          </button>
        ))}
      </div>

      {tab === "disponiveis" && (
        <div className="space-y-3">
          {disponiveis.map((p) => (
            <div key={p.id} className="rounded-xl bg-card border border-border ring-soft p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold">{p.unit}</h3>
                  <div className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {p.date} · {p.time}</div>
                    <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {p.local}</div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-base font-semibold text-[color:var(--success)]">{p.value}</div>
                  <StatusBadge status="disponivel" />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <X className="h-4 w-4" /> Recusar
                </Button>
                <Button size="sm" className="gap-1.5">
                  <Check className="h-4 w-4" /> Aceitar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "meus" && (
        <div className="space-y-3">
          {meus.map((p) => (
            <div key={p.id} className="rounded-xl bg-card border border-border ring-soft p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold">{p.unit}</h3>
                  <div className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {p.date} · {p.time}</div>
                    <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {p.local}</div>
                  </div>
                </div>
                <StatusBadge status={p.status} />
              </div>
              <div className="mt-4">
                <Button variant="outline" size="sm" className="w-full gap-1.5">
                  <ArrowLeftRight className="h-4 w-4" /> Solicitar troca
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
