import {
  CAPTURE_PHASE_LABELS,
  CAPTURE_TIMELINE_PHASES,
} from "../services/state-machine";
import type { CapturePhase, CapturePipelineEvent } from "../types";
import { cn } from "@/lib/utils";

export function CaptureStatusTimeline({
  phase,
  events,
}: {
  phase: CapturePhase;
  events: CapturePipelineEvent[];
}) {
  const currentIdx = CAPTURE_TIMELINE_PHASES.indexOf(
    phase === "failed" || phase === "cancelled" ? "waiting_ocr" : phase,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Status da captura</h2>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
            phaseBadgeClass(phase),
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {CAPTURE_PHASE_LABELS[phase]}
        </span>
      </div>

      <ol className="relative border-l border-border ml-3 space-y-4">
        {CAPTURE_TIMELINE_PHASES.map((step, idx) => {
          const done = idx < currentIdx || phase === "completed";
          const active = idx === currentIdx && !["failed", "cancelled", "completed"].includes(phase);
          const event = events.find((e) => eventMatchesPhase(e.type, step));
          return (
            <li key={step} className="ml-6">
              <span
                className={`absolute -left-1.5 flex h-3 w-3 items-center justify-center rounded-full ring-4 ring-background ${
                  done
                    ? "bg-primary"
                    : active
                      ? "bg-primary animate-pulse"
                      : "bg-muted"
                }`}
              />
              <h3
                className={`text-sm font-medium ${
                  active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {CAPTURE_PHASE_LABELS[step]}
              </h3>
              {event ? (
                <p className="text-xs text-muted-foreground font-mono">{event.type}</p>
              ) : null}
            </li>
          );
        })}
      </ol>

      {events.length > 0 ? (
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <p className="text-xs font-medium mb-2">Eventos do pipeline</p>
          <ul className="space-y-1">
            {events.map((e, i) => (
              <li key={`${e.type}-${i}`} className="text-xs font-mono text-muted-foreground">
                {e.at.slice(11, 19)} — {e.type}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function phaseBadgeClass(phase: CapturePhase): string {
  if (phase === "completed" || phase === "ocr_completed") {
    return "bg-[color:var(--success)]/15 text-[color:var(--success)]";
  }
  if (phase === "failed") return "bg-destructive/10 text-destructive";
  if (phase === "cancelled") return "bg-[color:var(--warning)]/15 text-[color:var(--warning)]";
  return "bg-accent/20 text-primary";
}

function eventMatchesPhase(eventType: string, phase: CapturePhase): boolean {
  const map: Record<string, CapturePhase> = {
    capture_uploaded: "uploaded",
    capture_preprocessed: "preprocessing",
    capture_ready_for_ocr: "waiting_ocr",
    ocr_started: "waiting_ocr",
    ocr_finished: "ocr_completed",
  };
  return map[eventType] === phase;
}
