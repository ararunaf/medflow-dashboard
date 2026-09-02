import { CheckSquare, GitCommitHorizontal, History, Wrench } from "lucide-react";
import type {
  CaptureHistoryEvent,
  CaptureHistoryEventKind,
} from "@/lib/capture/review/history-timeline";

const KIND_ICON: Record<CaptureHistoryEventKind, typeof GitCommitHorizontal> = {
  pipeline: GitCommitHorizontal,
  aprovacao: CheckSquare,
  correcao: Wrench,
};

const KIND_STYLE: Record<CaptureHistoryEventKind, string> = {
  pipeline: "bg-muted text-muted-foreground",
  aprovacao: "bg-primary/15 text-primary",
  correcao: "bg-[color:var(--warning)]/15 text-[color:var(--warning)]",
};

function formatEventAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CaptureHistoryPanel({ events }: { events: CaptureHistoryEvent[] }) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div className="flex items-center gap-2">
        <History className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Histórico da sessão</h2>
      </div>
      <p className="text-xs text-muted-foreground">
        Linha do tempo unificada: transições de pipeline, decisões de aprovação e correções
        decididas — em ordem cronológica, mais recente primeiro.
      </p>

      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          Ainda não há eventos registrados nesta sessão.
        </p>
      ) : (
        <ol className="relative space-y-4 border-l border-border pl-4">
          {events.map((event, idx) => {
            const Icon = KIND_ICON[event.kind];
            return (
              <li key={`${event.kind}-${event.at}-${idx}`} className="relative">
                <span
                  className={`absolute -left-[21px] flex h-6 w-6 items-center justify-center rounded-full ${KIND_STYLE[event.kind]}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="text-xs text-muted-foreground">{formatEventAt(event.at)}</div>
                <div className="text-sm font-medium">{event.label}</div>
                {event.detail ? (
                  <div className="text-xs text-muted-foreground mt-0.5">{event.detail}</div>
                ) : null}
                {event.actorProfileId ? (
                  <div className="text-[11px] font-mono text-muted-foreground/70 mt-0.5">
                    por {event.actorProfileId.slice(0, 8)}…
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
