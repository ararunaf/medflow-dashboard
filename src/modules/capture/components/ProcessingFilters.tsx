import type { ProcessingCenterFilters } from "@/lib/capture/processing";
import { RISK_LEVELS } from "@/lib/capture/risk/types/risk-assessment";
import { Button } from "@/components/ui/button";

type ProcessingFiltersProps = {
  filters: ProcessingCenterFilters;
  onChange: (filters: ProcessingCenterFilters) => void;
  onClear: () => void;
};

export function ProcessingFilters({ filters, onChange, onClear }: ProcessingFiltersProps) {
  const set = (patch: Partial<ProcessingCenterFilters>) => {
    onChange({ ...filters, ...patch });
  };

  return (
    <section
      className="rounded-lg border bg-card p-4 shadow-sm space-y-3"
      data-testid="processing-filters"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Filtros</h2>
        <Button type="button" variant="ghost" size="sm" onClick={onClear}>
          Limpar
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="space-y-1 text-xs">
          <span className="text-muted-foreground">Operadora</span>
          <input
            type="text"
            className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
            placeholder="Nome ou ANS"
            value={filters.operator ?? ""}
            onChange={(e) => set({ operator: e.target.value || undefined })}
            data-testid="filter-operator"
          />
        </label>

        <label className="space-y-1 text-xs">
          <span className="text-muted-foreground">Tipo da guia</span>
          <input
            type="text"
            className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
            placeholder="Ex.: consulta, SP/SADT"
            value={filters.guideType ?? ""}
            onChange={(e) => set({ guideType: e.target.value || undefined })}
            data-testid="filter-guide-type"
          />
        </label>

        <label className="space-y-1 text-xs">
          <span className="text-muted-foreground">Risco</span>
          <select
            className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
            value={filters.riskLevel ?? ""}
            onChange={(e) =>
              set({
                riskLevel: (e.target.value || undefined) as ProcessingCenterFilters["riskLevel"],
              })
            }
            data-testid="filter-risk"
          >
            <option value="">Todos</option>
            {RISK_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-xs">
          <span className="text-muted-foreground">Período — início</span>
          <input
            type="date"
            className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
            value={filters.periodFrom?.slice(0, 10) ?? ""}
            onChange={(e) =>
              set({ periodFrom: e.target.value ? `${e.target.value}T00:00:00.000Z` : undefined })
            }
            data-testid="filter-period-from"
          />
        </label>

        <label className="space-y-1 text-xs">
          <span className="text-muted-foreground">Período — fim</span>
          <input
            type="date"
            className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
            value={filters.periodTo?.slice(0, 10) ?? ""}
            onChange={(e) =>
              set({ periodTo: e.target.value ? `${e.target.value}T23:59:59.999Z` : undefined })
            }
            data-testid="filter-period-to"
          />
        </label>

        <label className="space-y-1 text-xs">
          <span className="text-muted-foreground">Responsável (profile ID)</span>
          <input
            type="text"
            className="w-full rounded-md border bg-background px-2 py-1.5 text-sm font-mono text-xs"
            placeholder="UUID do revisor"
            value={filters.responsible ?? ""}
            onChange={(e) => set({ responsible: e.target.value || undefined })}
            data-testid="filter-responsible"
          />
        </label>
      </div>
    </section>
  );
}
