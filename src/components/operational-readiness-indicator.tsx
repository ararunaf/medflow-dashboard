import { validatePublicEnv } from "@/lib/env/public-env-validation";
import { Activity } from "lucide-react";

type Props = {
  scorePercent?: number;
  ready?: boolean;
  compact?: boolean;
};

/** Indicador discreto de readiness operacional (header / lançamento). */
export function OperationalReadinessIndicator({ scorePercent, ready, compact }: Props) {
  const env = validatePublicEnv();
  const envOk = env.supabaseConfigured && env.warnings.length === 0;
  const isReady = ready ?? (envOk && (scorePercent == null || scorePercent >= 80));

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 text-[10px] font-medium tabular-nums ${
          isReady ? "text-[color:var(--success)]" : "text-[color:var(--warning)]"
        }`}
        title={scorePercent != null ? `Readiness ${scorePercent}%` : "Readiness operacional"}
      >
        <Activity className="h-3 w-3" />
        {scorePercent != null ? `${scorePercent}%` : isReady ? "OK" : "!"}
      </span>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs ${
        isReady
          ? "border-[color:var(--success)]/40 bg-[color:var(--success)]/10"
          : "border-[color:var(--warning)]/40 bg-[color:var(--warning)]/10"
      }`}
    >
      <Activity className="h-3.5 w-3.5" />
      <span className="font-medium">{isReady ? "Pronto para operação" : "Readiness pendente"}</span>
      {scorePercent != null ? (
        <span className="text-muted-foreground tabular-nums">{scorePercent}%</span>
      ) : null}
    </div>
  );
}
