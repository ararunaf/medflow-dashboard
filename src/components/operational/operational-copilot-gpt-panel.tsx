/**
 * Copiloto GPT supervisionado — interpretação, narrativa e registro de propostas (sem execução operacional).
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { ListTree, MessageSquareText, Send, Sparkles, Wand2, Wrench } from "lucide-react";
import { OperationalLiveChrome } from "@/components/operational/operational-live-chrome";
import { useOperationalCopilotDerived } from "@/hooks/use-operational-copilot-derived";
import { useToast } from "@/hooks/use-toast";
import { operationalCopilotGptFn } from "@/lib/operations/api";
import {
  buildOperationalAiSummaryCard,
  OPERATIONAL_COPILOT_SUGGESTED_PROMPTS_PT,
} from "@/lib/operations/copilot-gpt";
import type { OperationalCommandCenterSnapshot } from "@/lib/operations/api/queries/command-center";
import type { OperationalCopilotGptResponseData } from "@/lib/operations/copilot-gpt/types";
import type { OperationalAlert } from "@/lib/operations/alerts/types";
import { unwrap, describeError, isOperationalError } from "@/lib/queries/result";
import { opsKeys } from "@/lib/queries/keys";
import { cn } from "@/lib/utils";

export function OperationalCopilotGptPanel(props: {
  snapshot: OperationalCommandCenterSnapshot | undefined;
  alerts: OperationalAlert[];
  isFetching: boolean;
  className?: string;
}) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { canSee, derived, analyticsQuery } = useOperationalCopilotDerived({
    snapshot: props.snapshot,
    alerts: props.alerts,
  });

  const [question, setQuestion] = useState("");
  const [chatReply, setChatReply] = useState<string | null>(null);
  const [narrativeReply, setNarrativeReply] = useState<string | null>(null);
  const [lastMeta, setLastMeta] = useState<{
    model: string;
    correlationId: string;
    toolCallCount?: number;
    toolRounds?: number;
  } | null>(null);
  const [lastToolTrace, setLastToolTrace] = useState<
    NonNullable<OperationalCopilotGptResponseData["toolTrace"]>
  >([]);

  const scrollToTimeline = useCallback(() => {
    document
      .getElementById("ops-anchor-timeline")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const toolTraceTouchesTimeline = useMemo(
    () =>
      lastToolTrace.some(
        (t) => t.name === "get_operational_timeline" || t.name === "get_operational_events",
      ),
    [lastToolTrace],
  );

  const toolTraceTouchesProposal = useMemo(
    () => lastToolTrace.some((t) => t.name === "submit_operational_action_proposal"),
    [lastToolTrace],
  );

  const scrollToProposals = useCallback(() => {
    document
      .getElementById("ops-anchor-action-proposals")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const summaryCard = useMemo(() => {
    if (!derived) return null;
    return buildOperationalAiSummaryCard(derived.payload, derived.semantic);
  }, [derived]);

  const gptMut = useMutation({
    mutationFn: async (input: { mode: "chat" | "executive_narrative"; question?: string }) => {
      if (!derived) throw new Error("Contexto indisponível.");
      return unwrap(
        await operationalCopilotGptFn({
          data: {
            mode: input.mode,
            question: input.question,
            operationalContextPayload: derived.payload,
            semanticSnapshot: derived.semantic,
          },
        }),
      );
    },
    onSuccess: (data, vars) => {
      setLastMeta({
        model: data.model,
        correlationId: data.correlationId,
        toolCallCount: data.toolCallCount,
        toolRounds: data.toolRounds,
      });
      if (vars.mode === "executive_narrative") {
        setLastToolTrace([]);
        setNarrativeReply(data.assistantMessage);
        toast.success("Narrativa IA", "Resposta gerada com base no contexto atual.");
      } else {
        setLastToolTrace(data.toolTrace ?? []);
        setChatReply(data.assistantMessage);
        const n = data.toolCallCount ?? 0;
        if (data.toolTrace?.some((t) => t.name === "submit_operational_action_proposal")) {
          void queryClient.invalidateQueries({ queryKey: opsKeys.actionProposals() });
        }
        toast.success(
          "Copiloto",
          n > 0
            ? `Resposta gerada · ${n} chamada(s) ao servidor (leitura / proposta).`
            : "Resposta gerada.",
        );
      }
    },
    onError: (err: unknown) => {
      const msg = isOperationalError(err) ? err.message : describeError(err).message;
      toast.warning("Copiloto IA", msg);
    },
  });

  const askChat = useCallback(() => {
    const q = question.trim();
    if (!q) {
      toast.warning("Copiloto", "Digite uma pergunta.");
      return;
    }
    void gptMut.mutateAsync({ mode: "chat", question: q });
  }, [gptMut, question, toast]);

  const askNarrative = useCallback(() => {
    void gptMut.mutateAsync({ mode: "executive_narrative" });
  }, [gptMut]);

  if (!canSee) return null;
  if (!props.snapshot || !derived || !summaryCard) return null;

  return (
    <section
      id="ops-anchor-copilot-gpt"
      className={cn("scroll-mt-24", props.className)}
      aria-label="Copiloto operacional IA (supervisionado)"
    >
      <OperationalLiveChrome
        isFetching={props.isFetching || analyticsQuery.isFetching}
        className="p-0 overflow-hidden"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <MessageSquareText className="h-4 w-4 text-primary" />
            <div>
              <h2 className="text-sm font-semibold text-foreground">Copiloto operacional (IA)</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Read-only + proposta supervisionada (sem mutações operacionais) · fingerprint{" "}
                {derived.payload.fingerprint}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={gptMut.isPending}
            onClick={() => void askNarrative()}
            className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/15 disabled:opacity-50"
          >
            <Wand2 className="h-3.5 w-3.5" />
            Narrativa executiva
          </button>
        </div>

        {analyticsQuery.isError ? (
          <p className="px-4 py-2 text-xs text-destructive">
            Analytics não anexado: {describeError(analyticsQuery.error).message}
          </p>
        ) : null}

        <div className="p-4 space-y-4">
          <div className="rounded-lg border border-border/90 bg-muted/20 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Resumo determinístico (auditável)
            </div>
            <p className="text-sm font-medium text-foreground mt-1">{summaryCard.headline}</p>
            <ul className="mt-2 text-xs text-foreground space-y-1 list-disc pl-4">
              {summaryCard.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
            <p className="mt-2 text-[10px] text-muted-foreground">{summaryCard.footer}</p>
          </div>

          {narrativeReply ? (
            <div className="rounded-lg border border-primary/25 bg-primary/[0.03] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Narrativa operacional (IA)
              </p>
              <p className="mt-2 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {narrativeReply}
              </p>
            </div>
          ) : null}

          <div className="space-y-2">
            <label
              className="text-[11px] font-medium text-muted-foreground"
              htmlFor="ops-copilot-question"
            >
              Pergunta ao copiloto
            </label>
            <textarea
              id="ops-copilot-question"
              rows={3}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ex.: Qual o maior risco operacional atual?"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              maxLength={2000}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={gptMut.isPending}
                onClick={() => void askChat()}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                Enviar pergunta
              </button>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-medium text-muted-foreground mb-2">Insights sugeridos</p>
            <div className="flex flex-wrap gap-1.5">
              {OPERATIONAL_COPILOT_SUGGESTED_PROMPTS_PT.map((p) => (
                <button
                  key={p}
                  type="button"
                  disabled={gptMut.isPending}
                  onClick={() => {
                    setQuestion(p);
                    void gptMut.mutateAsync({ mode: "chat", question: p });
                  }}
                  className="rounded-full border border-border bg-background/80 px-2.5 py-1 text-[10px] text-left text-foreground hover:bg-accent/60 disabled:opacity-50 max-w-full"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {chatReply ? (
            <div className="rounded-lg border border-border p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Resposta explicável
              </p>
              <p className="mt-2 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {chatReply}
              </p>
            </div>
          ) : null}

          {lastToolTrace.length > 0 ? (
            <div className="rounded-lg border border-dashed border-primary/30 bg-primary/[0.04] p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Wrench className="h-3.5 w-3.5 text-primary shrink-0" />
                Contexto expandido (tools — leitura + proposta supervisionada)
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Consultas dinâmicas no servidor (tenant isolado, RBAC). A tool{" "}
                <span className="font-mono">submit_operational_action_proposal</span> apenas
                registra intenção para aprovação humana — não executa mudanças operacionais.
              </p>
              <ul className="space-y-1.5">
                {lastToolTrace.map((t, idx) => (
                  <li
                    key={`${t.name}-${idx}`}
                    className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[11px] text-foreground"
                  >
                    <span className="font-mono text-[10px] rounded bg-muted px-1 py-0.5">
                      {t.name}
                    </span>
                    <span
                      className={
                        t.ok ? "text-emerald-700 dark:text-emerald-400" : "text-destructive"
                      }
                    >
                      {t.ok ? "ok" : "falhou"}
                    </span>
                    {typeof t.rowCount === "number" ? (
                      <span className="text-muted-foreground tabular-nums">
                        {t.rowCount} linhas
                      </span>
                    ) : null}
                    {t.argsSummary ? (
                      <span className="text-muted-foreground truncate max-w-full">
                        {t.argsSummary}
                      </span>
                    ) : null}
                    {t.detail ? (
                      <span className="text-muted-foreground truncate max-w-full" title={t.detail}>
                        · {t.detail}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
              {toolTraceTouchesProposal ? (
                <button
                  type="button"
                  onClick={() => scrollToProposals()}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-[11px] font-medium text-foreground hover:bg-accent/50"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Ver fila de propostas supervisionadas
                </button>
              ) : null}
              {toolTraceTouchesTimeline ? (
                <button
                  type="button"
                  onClick={() => scrollToTimeline()}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-[11px] font-medium text-foreground hover:bg-accent/50"
                >
                  <ListTree className="h-3.5 w-3.5" />
                  Drill-down na timeline ao vivo
                </button>
              ) : null}
            </div>
          ) : null}

          {lastMeta ? (
            <p className="text-[10px] text-muted-foreground font-mono">
              Modelo {lastMeta.model} · correlação {lastMeta.correlationId}
              {typeof lastMeta.toolCallCount === "number" && lastMeta.toolCallCount > 0
                ? ` · ${lastMeta.toolCallCount} tool(s) · ${lastMeta.toolRounds ?? "?"} rodada(s)`
                : ""}
            </p>
          ) : null}

          <p className="text-[10px] text-muted-foreground leading-relaxed border-t border-border pt-3">
            O copiloto não executa plantões, trocas ou atribuições automaticamente. As tools de
            leitura enriquecem a resposta; a tool de proposta apenas registra sugestão auditável
            para coordenação aprovar ou rejeitar.
          </p>
        </div>
      </OperationalLiveChrome>
    </section>
  );
}
