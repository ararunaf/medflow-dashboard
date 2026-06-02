import { Link } from "@tanstack/react-router";
import { ClipboardList } from "lucide-react";
import { useEffect, useState } from "react";
import { ProgressBar } from "@/components/pilot-launch/progress-bar";
import { useClientMounted } from "@/hooks/use-client-mounted";
import {
  onboarding_wizard_steps,
  readWizardStepIndex,
  wizardProgressPercent,
  writeWizardStepIndex,
} from "@/lib/services/onboarding-wizard/onboarding-wizard-service";

export function OnboardingWizardPanel() {
  const mounted = useClientMounted();
  const [wizardIdx, setWizardIdx] = useState(0);

  useEffect(() => {
    if (!mounted) return;
    setWizardIdx(readWizardStepIndex());
  }, [mounted]);

  const step = onboarding_wizard_steps[wizardIdx];
  const pct = mounted ? wizardProgressPercent() : 0;

  return (
    <section className="rounded-xl border border-border bg-card ring-soft p-5">
      <div className="flex items-center gap-2 mb-3">
        <ClipboardList className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Quick setup wizard</h2>
      </div>
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-xs text-muted-foreground">Progresso do assistente</span>
        <span className="text-xs font-semibold tabular-nums text-primary">{pct}%</span>
      </div>
      <ProgressBar percent={pct} className="mb-4" />
      <div className="rounded-lg border border-border/80 bg-muted/20 p-4">
        <div className="text-sm font-medium text-foreground">
          Passo {wizardIdx + 1} — {step?.title}
        </div>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{step?.description}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            to={step?.route ?? "/piloto"}
            className="inline-flex items-center rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"
          >
            {step?.cta ?? "Abrir"}
          </Link>
          <button
            type="button"
            className="rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted/50"
            onClick={() => {
              const n = Math.max(0, wizardIdx - 1);
              writeWizardStepIndex(n);
              setWizardIdx(n);
            }}
          >
            Voltar
          </button>
          <button
            type="button"
            className="rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted/50"
            onClick={() => {
              const n = Math.min(onboarding_wizard_steps.length - 1, wizardIdx + 1);
              writeWizardStepIndex(n);
              setWizardIdx(n);
            }}
          >
            Avançar
          </button>
        </div>
      </div>
    </section>
  );
}
