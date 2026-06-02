import { StatusBadge } from "@/components/ui-kit";
import type { SmokeTestReport } from "@/lib/services/smoke-test/smoke-test-service";
import { FlaskConical, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SmokeTestPanel({
  report,
  running,
  onRun,
}: {
  report?: SmokeTestReport | null;
  running: boolean;
  onRun: () => void;
}) {
  return (
    <section className="rounded-xl border border-border bg-card ring-soft p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Smoke tests</h2>
        </div>
        <Button type="button" size="sm" variant="outline" disabled={running} onClick={onRun}>
          <Play className="h-3.5 w-3.5 mr-1.5" />
          {running ? "Executando…" : "Executar agora"}
        </Button>
      </div>
      {!report ? (
        <p className="text-xs text-muted-foreground">
          Valida login, dashboard, TISS, financeiro, conciliação e onboarding institucional.
        </p>
      ) : (
        <ul className="space-y-2">
          {report.results.map((r) => (
            <li
              key={r.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-border/80 px-3 py-2"
            >
              <div>
                <div className="text-sm font-medium">{r.label}</div>
                <div className="text-xs text-muted-foreground">{r.detail}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {r.durationMs} ms
                </span>
                <StatusBadge status={r.passed ? "confirmado" : "pendente"} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
