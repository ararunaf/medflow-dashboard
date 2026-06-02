import { Link } from "@tanstack/react-router";
import { PlayCircle } from "lucide-react";
import { useEffect, useState } from "react";
import {
  guided_demo_steps,
  readGuidedDemoStepIndex,
  setGuidedDemoActive,
  writeGuidedDemoStepIndex,
} from "@/lib/services/guided-demo";

export function GuidedDemoPanel() {
  const [demoOn, setDemoOn] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    const active = sessionStorage.getItem("medflow:guided_demo:active") === "1";
    setDemoOn(active);
    setStepIdx(active ? readGuidedDemoStepIndex() : 0);
  }, []);

  return (
    <section className="rounded-xl border border-border bg-card ring-soft p-5">
      <div className="flex items-center gap-2 mb-3">
        <PlayCircle className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Modo demonstração guiada</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Walkthrough executivo com navegação assistida — permanece apenas nesta sessão do browser.
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          className={`rounded-lg px-3 py-2 text-xs font-medium ${
            demoOn ? "bg-primary text-primary-foreground" : "border border-border hover:bg-muted/50"
          }`}
          onClick={() => {
            const next = !demoOn;
            setGuidedDemoActive(next);
            setDemoOn(next);
            if (next) {
              writeGuidedDemoStepIndex(0);
              setStepIdx(0);
            }
          }}
        >
          {demoOn ? "Demo ativa" : "Ativar demo guiada"}
        </button>
        {demoOn ? (
          <span className="text-xs text-muted-foreground self-center">
            Passo {stepIdx + 1} de {guided_demo_steps.length}
          </span>
        ) : null}
      </div>
      <ol className="space-y-2 text-sm">
        {guided_demo_steps.map((s, i) => (
          <li key={s.id} className="flex gap-2">
            <span className="tabular-nums text-muted-foreground w-5">{i + 1}.</span>
            <div>
              <Link to={s.to} className="font-medium text-primary hover:underline">
                {s.title}
              </Link>
              <div className="text-xs text-muted-foreground">{s.highlight}</div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
