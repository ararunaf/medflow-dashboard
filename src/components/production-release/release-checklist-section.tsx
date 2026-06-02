import { StatusBadge } from "@/components/ui-kit";
import { ProgressBar } from "@/components/pilot-launch/progress-bar";
import type { ReleaseChecklistItem } from "@/lib/services/release-checklist/release-checklist-service";
import { ClipboardCheck } from "lucide-react";

export function ReleaseChecklistSection({
  title,
  items,
  progressPercent,
}: {
  title: string;
  items: ReleaseChecklistItem[];
  progressPercent: number;
}) {
  return (
    <section className="rounded-xl border border-border bg-card ring-soft p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">{title}</h2>
        </div>
        <span className="text-xs font-medium text-muted-foreground tabular-nums">
          {progressPercent}%
        </span>
      </div>
      <ProgressBar percent={progressPercent} className="mb-4" />
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 rounded-lg border border-border/80 px-3 py-2.5"
          >
            <div className="min-w-0">
              <div className="text-sm font-medium text-foreground">{item.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{item.hint}</div>
              {item.manual ? (
                <span className="mt-1 inline-block text-[10px] uppercase tracking-wide text-muted-foreground">
                  Confirmação manual
                </span>
              ) : null}
            </div>
            <StatusBadge status={item.done ? "confirmado" : "pendente"} />
          </li>
        ))}
      </ul>
    </section>
  );
}
