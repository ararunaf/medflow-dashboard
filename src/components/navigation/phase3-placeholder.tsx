import { Link } from "@tanstack/react-router";
import { Construction, ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";

export function Phase3PlaceholderPage({
  title,
  groupLabel,
  description,
}: {
  title: string;
  groupLabel: string;
  description?: string;
}) {
  return (
    <AppShell>
      <PageHeader title={title} subtitle={`${groupLabel} · reservado para a próxima fase`} />
      <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 md:p-12 text-center ring-soft">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-primary">
          <Construction className="h-6 w-6" aria-hidden />
        </div>
        <p className="text-base font-semibold text-foreground">Disponível na Fase 3</p>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          {description ??
            "Este módulo está preparado na navegação do Centro Operacional e será habilitado na Fase 3."}
        </p>
        <div className="mt-6 flex justify-center">
          <Button type="button" variant="outline" size="sm" className="gap-1.5" asChild>
            <Link to="/">
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar ao Centro Operacional
            </Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
