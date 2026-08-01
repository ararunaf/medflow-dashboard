import {
  FileText,
  ScanText,
  Table2,
  ShieldCheck,
  BookOpen,
  ShieldAlert,
  Wrench,
  Brain,
  CheckSquare,
} from "lucide-react";
import type { ReviewPanelId } from "@/lib/capture/review";
import { REVIEW_PANEL_LABELS } from "@/lib/capture/review/review-workspace-service";
import { cn } from "@/lib/utils";

const PANEL_ICONS: Record<ReviewPanelId, typeof FileText> = {
  documento: FileText,
  ocr: ScanText,
  structured: Table2,
  auditoria: ShieldCheck,
  contrato: BookOpen,
  risco: ShieldAlert,
  correcoes: Wrench,
  learning: Brain,
  aprovacao: CheckSquare,
};

type ReviewWorkspacePanelNavProps = {
  activePanel: ReviewPanelId;
  onNavigate: (panel: ReviewPanelId) => void;
};

export function ReviewWorkspacePanelNav({ activePanel, onNavigate }: ReviewWorkspacePanelNavProps) {
  const panels = Object.keys(REVIEW_PANEL_LABELS) as ReviewPanelId[];

  return (
    <nav
      className="flex flex-wrap gap-1 rounded-lg border bg-card p-1 shadow-sm"
      aria-label="Painéis do workspace de revisão"
    >
      {panels.map((panel) => {
        const Icon = PANEL_ICONS[panel];
        const isActive = activePanel === panel;
        return (
          <button
            key={panel}
            type="button"
            onClick={() => onNavigate(panel)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {REVIEW_PANEL_LABELS[panel]}
          </button>
        );
      })}
    </nav>
  );
}
