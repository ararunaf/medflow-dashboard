import { BRANDING, defaultLogoUrl } from "@/lib/assets";

type BrandingLoadingProps = {
  message?: string;
  className?: string;
};

/** Logo + mensagem para estados de carregamento (navegação, produção, etc.). */
export function BrandingLoading({ message = "Carregando…", className = "" }: BrandingLoadingProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 py-10 ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <img
        src={defaultLogoUrl}
        alt={BRANDING.productName}
        className="h-16 w-auto max-w-[220px] object-contain motion-safe:animate-pulse"
        decoding="async"
      />
      <p className="text-xs text-muted-foreground text-center motion-safe:animate-pulse">
        {message}
      </p>
    </div>
  );
}
