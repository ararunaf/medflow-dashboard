import { Link } from "@tanstack/react-router";
import { Rocket } from "lucide-react";
import { ProgressBar } from "@/components/pilot-launch/progress-bar";
import type { OnboardingProgressSnapshot } from "@/lib/services/onboarding-progress";
import type { TenantPilotValidation } from "@/lib/services/onboarding-wizard/tenant-validation";

export function PilotLaunchStatusCard({
  progress,
  validation,
}: {
  progress: OnboardingProgressSnapshot;
  validation: TenantPilotValidation;
}) {
  return (
    <section
      className={`rounded-xl border p-5 ring-soft ${
        progress.pilotReady
          ? "border-[color:var(--success)]/40 bg-[color:var(--success)]/5"
          : "border-primary/25 bg-primary/5"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Rocket className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">Readiness comercial piloto</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {progress.pilotReady
                ? "Tenant pronto para go-live controlado com clientes reais."
                : "Complete wizard, checklist e validação antes do go-live."}
            </p>
          </div>
        </div>
        <span className="text-lg font-semibold tabular-nums text-primary">
          {progress.overallPercent}%
        </span>
      </div>
      <ProgressBar percent={progress.overallPercent} className="mb-3" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">Wizard</span>
          <div className="font-semibold tabular-nums">{progress.wizardPercent}%</div>
        </div>
        <div>
          <span className="text-muted-foreground">Implantação</span>
          <div className="font-semibold tabular-nums">{progress.deploymentPercent}%</div>
        </div>
        <div>
          <span className="text-muted-foreground">Operacional</span>
          <div className="font-semibold tabular-nums">{progress.operationalPercent}%</div>
        </div>
        <div>
          <span className="text-muted-foreground">Demo</span>
          <div className="font-semibold tabular-nums">
            {progress.demoActive ? `${progress.demoPercent}%` : "—"}
          </div>
        </div>
      </div>
      {!validation.ok ? (
        <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
          {validation.issues.map((issue) => (
            <li key={issue.id}>
              <span className="text-foreground font-medium">Pendente:</span> {issue.message}
              {issue.route ? (
                <>
                  {" "}
                  <Link to={issue.route} className="text-primary hover:underline">
                    Corrigir
                  </Link>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
