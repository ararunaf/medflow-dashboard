import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BreadcrumbCrumb } from "@/lib/navigation";

export function Breadcrumbs({
  crumbs,
  className,
}: {
  crumbs: BreadcrumbCrumb[];
  className?: string;
}) {
  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn("mb-4", className)}>
      <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1;
          return (
            <li key={`${crumb.label}-${index}`} className="inline-flex items-center gap-1 min-w-0">
              {index > 0 ? (
                <ChevronRight className="h-3 w-3 shrink-0 opacity-60" aria-hidden />
              ) : null}
              {crumb.to && !last ? (
                <Link
                  to={crumb.to}
                  className="truncate hover:text-foreground transition-colors max-w-[12rem]"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    "truncate max-w-[16rem]",
                    last ? "font-medium text-foreground" : undefined,
                  )}
                  aria-current={last ? "page" : undefined}
                >
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
