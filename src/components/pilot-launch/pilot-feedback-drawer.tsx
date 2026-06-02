import { useEffect, useState } from "react";
import { X, MessageSquare, AlertTriangle, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PilotFeedbackSeverity, PilotIncidentSeverity } from "@/lib/services/pilot-execution";

export type PilotFeedbackDrawerMode = "feedback" | "incident" | "suggestion";

const MODE_META: Record<
  PilotFeedbackDrawerMode,
  { title: string; subtitle: string; icon: typeof MessageSquare; submitLabel: string }
> = {
  feedback: {
    title: "Enviar feedback",
    subtitle: "Conte o que aconteceu na operação — resposta em até 1 dia útil no piloto.",
    icon: MessageSquare,
    submitLabel: "Enviar feedback",
  },
  incident: {
    title: "Reportar problema",
    subtitle: "Incidente operacional — priorizamos impacto em plantão e fechamento.",
    icon: AlertTriangle,
    submitLabel: "Registrar incidente",
  },
  suggestion: {
    title: "Sugerir melhoria",
    subtitle: "Ideias para evoluir a V1 com base no uso real.",
    icon: Lightbulb,
    submitLabel: "Enviar sugestão",
  },
};

export function PilotFeedbackDrawer({
  open,
  mode,
  contextRoute,
  contextModule,
  submitting,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: PilotFeedbackDrawerMode;
  contextRoute?: string | null;
  contextModule?: string | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    description: string;
    severity: PilotFeedbackSeverity | PilotIncidentSeverity;
    category: string;
  }) => void;
}) {
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<PilotFeedbackSeverity | PilotIncidentSeverity>("medium");
  const [category, setCategory] = useState("other");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    setDescription("");
    setSeverity("medium");
    setCategory(mode === "feedback" ? "ux" : mode === "incident" ? "operational" : "improvement");
  }, [open, mode]);

  if (!open) return null;

  const meta = MODE_META[mode];
  const Icon = meta.icon;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Fechar"
        onClick={onClose}
      />
      <aside className="relative h-full w-full max-w-md bg-card border-l border-border shadow-xl flex flex-col">
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border">
          <div className="flex gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-semibold">{meta.title}</h2>
              <p className="text-xs text-muted-foreground mt-1 leading-snug">{meta.subtitle}</p>
              {contextRoute ? (
                <p className="text-[10px] text-muted-foreground mt-2 font-mono truncate">
                  {contextModule ? `${contextModule} · ` : ""}
                  {contextRoute}
                </p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <label className="block text-xs font-medium text-foreground">
            Categoria
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              {mode === "feedback" ? (
                <>
                  <option value="ux">Experiência (UX)</option>
                  <option value="performance">Performance</option>
                  <option value="data">Dados</option>
                  <option value="workflow">Fluxo</option>
                  <option value="support">Suporte</option>
                  <option value="other">Outro</option>
                </>
              ) : mode === "incident" ? (
                <>
                  <option value="operational">Operacional</option>
                  <option value="access">Acesso / permissão</option>
                  <option value="data">Dados incorretos</option>
                  <option value="integration">Integração</option>
                  <option value="other">Outro</option>
                </>
              ) : (
                <>
                  <option value="improvement">Melhoria geral</option>
                  <option value="ux">UX</option>
                  <option value="workflow">Fluxo</option>
                  <option value="reporting">Relatórios</option>
                  <option value="other">Outro</option>
                </>
              )}
            </select>
          </label>

          <label className="block text-xs font-medium text-foreground">
            Prioridade
            <select
              value={severity}
              onChange={(e) =>
                setSeverity(e.target.value as PilotFeedbackSeverity | PilotIncidentSeverity)
              }
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              {mode === "incident" ? (
                <>
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                  <option value="critical">Crítica</option>
                </>
              ) : (
                <>
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                </>
              )}
            </select>
          </label>

          <label className="block text-xs font-medium text-foreground">
            Descrição
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              maxLength={4000}
              placeholder="Descreva o que ocorreu, passos para reproduzir e impacto operacional."
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none"
            />
          </label>
        </div>

        <div className="px-5 py-4 border-t border-border flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted/50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={submitting || description.trim().length < 8}
            onClick={() => onSubmit({ description: description.trim(), severity, category })}
            className={
              "flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground " +
              "disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90"
            }
          >
            {submitting ? "Enviando…" : meta.submitLabel}
          </button>
        </div>
      </aside>
    </div>
  );
}
