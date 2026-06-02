import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { logAuth } from "@/lib/monitoring/channels/auth";
import { logClient } from "@/lib/monitoring/channels/client";
import { classifyError, isAuthFailureKind } from "./classify";
import { redirectToLoginWithReason } from "./auth-actions";

function handleGlobalQueryError(error: unknown, source: "query" | "mutation"): void {
  const classified = classifyError(error);

  if (classified.requiresAuthRedirect && isAuthFailureKind(classified.kind)) {
    logAuth(`query_${source}_${classified.kind}`, {
      err: error,
      message: classified.message,
      metadata: { kind: classified.kind },
    });
    void redirectToLoginWithReason(
      classified.kind === "invalid_token" ? "invalid_token" : "session_expired",
    );
    return;
  }

  logClient(`query_${source}_error`, {
    err: error,
    message: classified.message,
    metadata: { kind: classified.kind },
  });
}

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 1) return false;
  const { kind } = classifyError(error);
  if (kind === "offline" || kind === "timeout" || isAuthFailureKind(kind)) return false;
  return true;
}

export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => handleGlobalQueryError(error, "query"),
    }),
    mutationCache: new MutationCache({
      onError: (error) => handleGlobalQueryError(error, "mutation"),
    }),
    defaultOptions: {
      queries: {
        retry: shouldRetry,
        staleTime: 12_000,
        refetchOnWindowFocus: false,
        networkMode: "online",
      },
      mutations: {
        retry: 0,
        networkMode: "online",
      },
    },
  });
}
