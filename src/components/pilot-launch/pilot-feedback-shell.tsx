import { useLocation } from "@tanstack/react-router";
import { MessageSquarePlus, AlertTriangle, Lightbulb, X } from "lucide-react";
import { useState } from "react";
import {
  PilotFeedbackDrawer,
  type PilotFeedbackDrawerMode,
} from "@/components/pilot-launch/pilot-feedback-drawer";
import {
  useReportPilotIncidentMutation,
  useSubmitPilotFeedbackMutation,
  useSubmitPilotSuggestionMutation,
} from "@/hooks/use-pilot-execution";
import { useToast } from "@/hooks/use-toast";
import { moduleFromPath } from "@/lib/pilot-execution/module-from-path";
import { cn } from "@/lib/utils";

type Props = {
  enabled: boolean;
  openIncidentCount?: number;
};

export function PilotFeedbackShell({ enabled, openIncidentCount = 0 }: Props) {
  const location = useLocation();
  const toast = useToast();
  const [expanded, setExpanded] = useState(false);
  const [drawerMode, setDrawerMode] = useState<PilotFeedbackDrawerMode | null>(null);

  const feedbackMut = useSubmitPilotFeedbackMutation();
  const incidentMut = useReportPilotIncidentMutation();
  const suggestionMut = useSubmitPilotSuggestionMutation();

  if (!enabled) return null;

  const contextRoute = location.pathname;
  const contextModule = moduleFromPath(contextRoute);

  const submitting = feedbackMut.isPending || incidentMut.isPending || suggestionMut.isPending;

  async function handleSubmit(payload: {
    description: string;
    severity: string;
    category: string;
  }) {
    const base = {
      description: payload.description,
      severity: payload.severity,
      category: payload.category,
      context_route: contextRoute,
      context_module: contextModule,
    };
    try {
      if (drawerMode === "feedback") {
        await feedbackMut.mutateAsync(base);
        toast.success("Feedback enviado. Obrigado!");
      } else if (drawerMode === "incident") {
        await incidentMut.mutateAsync({
          ...base,
          operationalSource: contextModule,
        });
        toast.success("Incidente registrado. A equipe piloto acompanhará.");
      } else if (drawerMode === "suggestion") {
        await suggestionMut.mutateAsync(base);
        toast.success("Sugestão registrada!");
      }
      setDrawerMode(null);
      setExpanded(false);
    } catch {
      toast.error("Não foi possível enviar. Tente novamente.");
    }
  }

  return (
    <>
      <div className="fixed bottom-24 lg:bottom-8 right-4 z-50 flex flex-col items-end gap-2">
        {expanded ? (
          <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-card p-2 shadow-lg ring-soft">
            <button
              type="button"
              onClick={() => {
                setDrawerMode("feedback");
                setExpanded(false);
              }}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium hover:bg-muted/60 text-left whitespace-nowrap"
            >
              <MessageSquarePlus className="h-4 w-4 text-primary shrink-0" /> Feedback rápido
            </button>
            <button
              type="button"
              onClick={() => {
                setDrawerMode("incident");
                setExpanded(false);
              }}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium hover:bg-muted/60 text-left whitespace-nowrap"
            >
              <AlertTriangle className="h-4 w-4 text-[color:var(--warning)] shrink-0" /> Reportar
              problema
            </button>
            <button
              type="button"
              onClick={() => {
                setDrawerMode("suggestion");
                setExpanded(false);
              }}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium hover:bg-muted/60 text-left whitespace-nowrap"
            >
              <Lightbulb className="h-4 w-4 text-primary shrink-0" /> Sugerir melhoria
            </button>
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className={cn(
            "relative flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg",
            "hover:bg-primary/90 motion-safe:transition-transform",
          )}
          aria-label={expanded ? "Fechar menu de feedback" : "Abrir feedback piloto"}
        >
          {expanded ? <X className="h-5 w-5" /> : <MessageSquarePlus className="h-5 w-5" />}
          {openIncidentCount > 0 && !expanded ? (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[color:var(--warning)] px-1 text-[9px] font-bold text-foreground">
              {openIncidentCount > 9 ? "9+" : openIncidentCount}
            </span>
          ) : null}
        </button>
      </div>

      <PilotFeedbackDrawer
        open={drawerMode != null}
        mode={drawerMode ?? "feedback"}
        contextRoute={contextRoute}
        contextModule={contextModule}
        submitting={submitting}
        onClose={() => setDrawerMode(null)}
        onSubmit={handleSubmit}
      />
    </>
  );
}
