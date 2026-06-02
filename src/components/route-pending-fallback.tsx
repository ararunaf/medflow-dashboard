import { BrandingLoading } from "@/components/branding-loading";
import { SkeletonRow } from "@/components/ui-kit";

/** Estado global de carregamento durante navegação / preload de rotas. */
export function RoutePendingFallback() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <BrandingLoading />
      <div className="space-y-4">
        <div className="h-8 w-48 rounded-lg bg-muted animate-pulse" />
        <SkeletonRow height={72} />
        <SkeletonRow height={72} />
        <SkeletonRow height={120} />
      </div>
    </div>
  );
}
