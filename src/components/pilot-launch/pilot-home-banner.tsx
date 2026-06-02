import { Link } from "@tanstack/react-router";
import { Rocket } from "lucide-react";
import { ProgressBar } from "@/components/pilot-launch/progress-bar";

export function PilotHomeBanner({
  overallPercent,
  pilotReady,
}: {
  overallPercent: number;
  pilotReady: boolean;
}) {
  if (pilotReady) return null;

  return (
    <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 px-5 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <Rocket className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">Implantação piloto em andamento</p>
            <p className="text-xs text-muted-foreground mt-1">
              Continue o wizard e o checklist para liberar operação com clientes reais.
            </p>
            <ProgressBar percent={overallPercent} className="mt-3 max-w-xs" />
          </div>
        </div>
        <Link
          to="/piloto"
          className="shrink-0 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground"
        >
          Continuar implantação
        </Link>
      </div>
    </div>
  );
}
