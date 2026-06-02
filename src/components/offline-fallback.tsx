import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { messageForKind } from "@/lib/errors/messages";

/**
 * Faixa fixa quando o navegador está offline — queries TanStack pausam com networkMode online.
 */
export function OfflineFallback() {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-[60] border-b border-[color:var(--warning)]/40 bg-[color:var(--warning)]/10 px-4 py-2"
    >
      <div className="mx-auto flex max-w-5xl items-center gap-2 text-sm text-foreground">
        <WifiOff className="h-4 w-4 shrink-0 text-[color:var(--warning)]" aria-hidden />
        <span>{messageForKind("offline")}</span>
      </div>
    </div>
  );
}
