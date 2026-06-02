import { StatusBadge } from "@/components/ui-kit";
import { ProgressBar } from "@/components/pilot-launch/progress-bar";
import { useClientMounted } from "@/hooks/use-client-mounted";
import type {
  PilotDeploymentChecklistItem,
  PilotManualKey,
} from "@/lib/services/deployment-checklist/deployment-checklist-service";
import { readPilotManualFlag } from "@/lib/services/deployment-checklist/deployment-checklist-service";
import { BookOpen } from "lucide-react";

function ManualConfirmCheckbox({
  tenantId,
  manualKey,
  onToggle,
}: {
  tenantId?: string;
  manualKey: PilotManualKey;
  onToggle: () => void;
}) {
  const mounted = useClientMounted();
  const checked = mounted && readPilotManualFlag(tenantId, manualKey);
  return (
    <label className="mt-2 inline-flex items-center gap-2 text-xs text-foreground cursor-pointer">
      <input
        type="checkbox"
        className="rounded border-border"
        checked={checked}
        onChange={onToggle}
      />
      Confirmar manualmente
    </label>
  );
}

export function DeploymentChecklistPanel({
  title,
  items,
  progressPercent,
  footer,
  tenantId,
  onToggleManual,
}: {
  title: string;
  items: PilotDeploymentChecklistItem[];
  progressPercent: number;
  footer?: string;
  tenantId?: string;
  onToggleManual?: (key: PilotManualKey) => void;
}) {
  return (
    <section className="rounded-xl border border-border bg-card ring-soft p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
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
              {item.manualKey && onToggleManual ? (
                <ManualConfirmCheckbox
                  tenantId={tenantId}
                  manualKey={item.manualKey}
                  onToggle={() => onToggleManual(item.manualKey!)}
                />
              ) : null}
            </div>
            <StatusBadge status={item.done ? "confirmado" : "pendente"} />
          </li>
        ))}
      </ul>
      {footer ? <p className="mt-3 text-xs text-muted-foreground">{footer}</p> : null}
    </section>
  );
}
