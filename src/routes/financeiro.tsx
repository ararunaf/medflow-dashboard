import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader, StatCard } from "@/components/ui-kit";
import { Wallet, TrendingUp, Clock } from "lucide-react";

export const Route = createFileRoute("/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro — MedFlow-IA" },
      { name: "description", content: "Resumo financeiro dos plantões." },
    ],
  }),
  component: FinanceiroPage,
});

const historico = [
  { date: "07/05", unit: "UTI Adulto", value: "R$ 2.400", status: "Pago" },
  { date: "05/05", unit: "Pronto Socorro", value: "R$ 1.350", status: "Pago" },
  { date: "02/05", unit: "Pediatria", value: "R$ 2.400", status: "Previsto" },
  { date: "30/04", unit: "Centro Cirúrgico", value: "R$ 2.800", status: "Pago" },
];

function FinanceiroPage() {
  return (
    <AppShell>
      <PageHeader title="Financeiro" subtitle="Resumo do mês" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
        <StatCard label="Recebido" value="R$ 12.450" tone="success" icon={<Wallet className="h-4 w-4" />} hint="abril/2026" />
        <StatCard label="Previsto" value="R$ 8.200" tone="primary" icon={<TrendingUp className="h-4 w-4" />} hint="próximas semanas" />
        <StatCard label="Em análise" value="R$ 1.450" icon={<Clock className="h-4 w-4" />} hint="2 plantões" />
      </div>

      <div className="mt-6 rounded-xl bg-card border border-border ring-soft overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold">Histórico</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left font-medium px-5 py-3">Data</th>
                <th className="text-left font-medium px-5 py-3">Unidade</th>
                <th className="text-right font-medium px-5 py-3">Valor</th>
                <th className="text-right font-medium px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {historico.map((h, i) => (
                <tr key={i}>
                  <td className="px-5 py-3 text-foreground">{h.date}</td>
                  <td className="px-5 py-3 text-foreground">{h.unit}</td>
                  <td className="px-5 py-3 text-right font-medium">{h.value}</td>
                  <td className="px-5 py-3 text-right">
                    <span
                      className={
                        h.status === "Pago"
                          ? "text-[color:var(--success)] font-medium"
                          : "text-muted-foreground"
                      }
                    >
                      {h.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
