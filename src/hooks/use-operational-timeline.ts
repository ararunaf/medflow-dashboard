import { useInfiniteQuery } from "@tanstack/react-query";
import {
  listOperationalTimelinePageFn,
  type ListOperationalTimelineInput,
  type OperationalTimelinePage,
} from "@/lib/operations/api";
import type { TimelineScope } from "@/lib/operations/timeline";
import type { QueryResult } from "@/lib/server/fn-helpers";
import { opsKeys } from "@/lib/queries/keys";
import { unwrap } from "@/lib/queries/result";

function serializeTimelineScope(scope: TimelineScope): string {
  if (scope.kind === "global") return "g";
  if (scope.kind === "shift") return `s:${scope.shiftId}`;
  if (scope.kind === "professional") return `p:${scope.professionalId}`;
  return `w:${scope.swapId}`;
}

export function useOperationalTimelineInfinite(base: Omit<ListOperationalTimelineInput, "cursor">) {
  const scopeKey = serializeTimelineScope(base.scope);
  const limit = base.limit ?? 25;
  const severity = base.severity;
  const entityType = base.entityType;

  return useInfiniteQuery({
    queryKey: [
      ...opsKeys.timeline(),
      scopeKey,
      limit,
      severity ?? null,
      entityType ?? null,
    ] as const,
    initialPageParam: undefined as { createdAt: string; id: string } | undefined,
    queryFn: async ({ pageParam }): Promise<OperationalTimelinePage> =>
      unwrap(
        (await listOperationalTimelinePageFn({
          data: {
            scope: base.scope,
            limit,
            severity,
            entityType,
            cursor: pageParam,
          },
        })) as QueryResult<OperationalTimelinePage>,
      ),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 15_000,
  });
}
