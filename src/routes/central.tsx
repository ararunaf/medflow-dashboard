import { createFileRoute } from "@tanstack/react-router";
import { brandPageTitle } from "@/lib/assets";
import { AppShell } from "@/components/app-shell";
import { CommandCenterView } from "@/components/operational/command-center-view";
import {
  operationalCommandCenterQueryOptions,
  useOperationalCommandCenterQuery,
} from "@/hooks/use-operational-metrics";
import type { CentralOpsSearch } from "@/lib/operations/actions";

function parseOpsFocus(raw: unknown): CentralOpsSearch["opsFocus"] | undefined {
  if (typeof raw !== "string") return undefined;
  const allowed: CentralOpsSearch["opsFocus"][] = [
    "availability",
    "pressure",
    "coverage",
    "swaps",
    "conflicts",
    "assignments",
    "detail",
  ];
  return (allowed as readonly string[]).includes(raw)
    ? (raw as CentralOpsSearch["opsFocus"])
    : undefined;
}

export const Route = createFileRoute("/central")({
  head: () => ({
    meta: [
      { title: brandPageTitle("Central operacional") },
      { name: "description", content: "Command center e indicadores em tempo real." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): CentralOpsSearch => ({
    opsFocus: parseOpsFocus(search.opsFocus),
  }),
  loader: async ({ context }) => {
    await context.queryClient
      .prefetchQuery(operationalCommandCenterQueryOptions())
      .catch(() => undefined);
  },
  component: CentralPage,
});

function CentralPage() {
  const q = useOperationalCommandCenterQuery();
  const { opsFocus } = Route.useSearch();

  return (
    <AppShell>
      <CommandCenterView query={q} opsFocus={opsFocus} />
    </AppShell>
  );
}
