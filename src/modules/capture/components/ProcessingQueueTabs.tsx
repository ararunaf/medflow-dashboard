import { cn } from "@/lib/utils";
import {
  PROCESSING_QUEUE_IDS,
  PROCESSING_QUEUE_LABELS,
  type ProcessingQueueId,
} from "@/lib/capture/processing";

type ProcessingQueueTabsProps = {
  activeQueue: ProcessingQueueId | undefined;
  queueCounts: Record<ProcessingQueueId, number> | undefined;
  onSelect: (queue: ProcessingQueueId | undefined) => void;
};

export function ProcessingQueueTabs({
  activeQueue,
  queueCounts,
  onSelect,
}: ProcessingQueueTabsProps) {
  return (
    <div
      className="flex flex-wrap gap-2"
      role="tablist"
      aria-label="Filas operacionais"
      data-testid="processing-queue-tabs"
    >
      <button
        type="button"
        role="tab"
        aria-selected={!activeQueue}
        onClick={() => onSelect(undefined)}
        className={cn(
          "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
          !activeQueue
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border hover:bg-muted/60",
        )}
      >
        Todas
        {queueCounts ? (
          <span className="ml-1 opacity-80">
            ({PROCESSING_QUEUE_IDS.reduce((s, q) => s + (queueCounts[q] ?? 0), 0)})
          </span>
        ) : null}
      </button>

      {PROCESSING_QUEUE_IDS.map((queue) => {
        const count = queueCounts?.[queue] ?? 0;
        const selected = activeQueue === queue;
        return (
          <button
            key={queue}
            type="button"
            role="tab"
            aria-selected={selected}
            data-testid={`queue-tab-${queue}`}
            onClick={() => onSelect(queue)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-muted/60",
            )}
          >
            {PROCESSING_QUEUE_LABELS[queue]}
            <span className="ml-1 opacity-80">({count})</span>
          </button>
        );
      })}
    </div>
  );
}
