import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  guided_demo_steps,
  guidedDemoProgress,
  isGuidedDemoActive,
  isPathOnCurrentDemoStep,
  readGuidedDemoStepIndex,
  setGuidedDemoActive,
  syncGuidedDemoStepForPathname,
  writeGuidedDemoStepIndex,
} from "@/lib/services/guided-demo";
import { ChevronRight, X } from "lucide-react";

/**
 * Faixa contextual leve — sessionStorage, sem animações pesadas.
 */
export function GuidedDemoStrip() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [active, setActive] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    setActive(isGuidedDemoActive());
    setStepIdx(syncGuidedDemoStepForPathname(pathname));
  }, [pathname]);

  if (!active) return null;

  const step = guided_demo_steps[stepIdx] ?? guided_demo_steps[0]!;
  const { current, total, percent } = guidedDemoProgress();
  const onPath = isPathOnCurrentDemoStep(pathname);

  return (
    <div
      className={`fixed bottom-20 lg:bottom-6 left-4 right-4 z-40 max-w-lg mx-auto lg:ml-[calc(16rem+1rem)] lg:mr-8 rounded-xl border px-4 py-3 shadow-md text-sm motion-safe:transition-colors ${
        onPath ? "border-primary/30 bg-primary/10" : "border-border bg-card"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            <span>Demo guiada</span>
            <span className="tabular-nums">
              {current}/{total} · {percent}%
            </span>
          </div>
          <div className="font-medium text-foreground mt-0.5 truncate">{step.title}</div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{step.context}</p>
          <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${percent}%` }} />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link
              to={step.to}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Ir ao passo
              <ChevronRight className="h-3 w-3" />
            </Link>
            {stepIdx > 0 ? (
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  const n = stepIdx - 1;
                  writeGuidedDemoStepIndex(n);
                  setStepIdx(n);
                }}
              >
                Voltar passo
              </button>
            ) : null}
            {stepIdx < guided_demo_steps.length - 1 ? (
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  const n = stepIdx + 1;
                  writeGuidedDemoStepIndex(n);
                  setStepIdx(n);
                }}
              >
                Próximo passo
              </button>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          aria-label="Encerrar demo"
          className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={() => {
            setGuidedDemoActive(false);
            setActive(false);
          }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
