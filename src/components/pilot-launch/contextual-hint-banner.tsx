import type { ReactNode } from "react";
import { X } from "lucide-react";
import { dismissHint, isHintDismissed } from "@/lib/services/onboarding";
import { useEffect, useState } from "react";
import { useClientMounted } from "@/hooks/use-client-mounted";

export function ContextualHintBanner({
  hintId,
  title,
  children,
  action,
}: {
  hintId: string;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  const mounted = useClientMounted();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!mounted) return;
    setDismissed(isHintDismissed(hintId));
  }, [mounted, hintId]);

  if (mounted && dismissed) return null;

  return (
    <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-foreground">{title}</div>
          <div className="mt-1 text-xs text-muted-foreground leading-relaxed">{children}</div>
          {action ? <div className="mt-3">{action}</div> : null}
        </div>
        <button
          type="button"
          aria-label="Dispensar dica"
          className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          onClick={() => {
            dismissHint(hintId);
            setDismissed(true);
          }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
