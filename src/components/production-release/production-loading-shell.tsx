import { BrandingLoading } from "@/components/branding-loading";
import { SkeletonRow } from "@/components/ui-kit";

/** Estado de carregamento para páginas de lançamento / produção. */
export function ProductionLoadingShell(_props: { rows?: number } = {}) {
  return (
    <div className="space-y-6">
      <BrandingLoading message="Validando readiness operacional…" />
      <div className="space-y-3">
        <SkeletonRow />
      </div>
    </div>
  );
}
