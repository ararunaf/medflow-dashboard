import { createFileRoute, useNavigate, useRouteContext } from "@tanstack/react-router";
import { brandPageTitle } from "@/lib/assets";
import { useMemo, type ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { ErrorState, PageHeader, SkeletonRow } from "@/components/ui-kit";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { LogOut, Bell, ShieldCheck, Building2, Stethoscope } from "lucide-react";
import { teardownOperationalRealtime } from "@/hooks/use-operational-realtime";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import {
  myAvailabilityQueryOptions,
  myContextQueryOptions,
  useMyAvailabilityQuery,
  useMyContextQuery,
} from "@/hooks/use-operations";
import { useUpdateAvailability } from "@/hooks/use-operational-mutations";
import { describeError } from "@/lib/queries/result";
import { initialsFromName } from "@/lib/queries/adapters";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: brandPageTitle("Perfil") },
      { name: "description", content: "Suas configurações e disponibilidade." },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.prefetchQuery(myContextQueryOptions()),
      context.queryClient.prefetchQuery(myAvailabilityQueryOptions()),
    ]).catch(() => undefined);
  },
  component: PerfilPage,
});

const DEFAULT_AVAILABILITY = [
  { weekday: 1, startTime: "07:00", endTime: "19:00" },
  { weekday: 2, startTime: "07:00", endTime: "19:00" },
  { weekday: 3, startTime: "07:00", endTime: "19:00" },
  { weekday: 4, startTime: "07:00", endTime: "19:00" },
  { weekday: 5, startTime: "07:00", endTime: "19:00" },
] as const;

function PerfilPage() {
  const { auth } = useRouteContext({ from: "__root__" });
  const navigate = useNavigate();

  const meQuery = useMyContextQuery();
  const availabilityQuery = useMyAvailabilityQuery();
  const updateAvailability = useUpdateAvailability();

  const displayName = useMemo(
    () => meQuery.data?.fullName?.trim() || auth.user?.email || "Conta",
    [meQuery.data?.fullName, auth.user?.email],
  );
  const email = auth.user?.email ?? "";
  const roleLabel = (meQuery.data?.role ?? auth.profile?.role ?? "").replace(/_/g, " ") || "—";

  const tenantName = meQuery.data?.tenant.name ?? null;

  const isAvailableForShifts = (availabilityQuery.data?.length ?? 0) > 0;

  async function handleToggleAvailability(next: boolean) {
    const professionalId = meQuery.data?.professionalId;
    if (!professionalId) return;
    const windows = next
      ? DEFAULT_AVAILABILITY.map((w) => ({
          weekday: w.weekday,
          startTime: w.startTime,
          endTime: w.endTime,
          available: true,
        }))
      : [];
    try {
      await updateAvailability.mutateAsync({ professionalId, windows });
    } catch {
      // erro tratado via banner abaixo
    }
  }

  return (
    <AppShell>
      <PageHeader title="Perfil" />

      <div className="rounded-xl bg-card border border-border ring-soft p-5 flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
            {initialsFromName(displayName, email.slice(0, 2).toUpperCase() || "MF")}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h2 className="text-base font-semibold truncate">{displayName}</h2>
          <p className="text-xs text-muted-foreground capitalize">{roleLabel}</p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{email || "—"}</p>
          {meQuery.data?.specialty || meQuery.data?.crm ? (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {meQuery.data?.specialty ?? ""}
              {meQuery.data?.crm ? ` · CRM ${meQuery.data.crm}` : ""}
            </p>
          ) : null}
        </div>
      </div>

      {meQuery.isError ? (
        <div className="mt-4">
          <ErrorState
            message={describeError(meQuery.error).message}
            onRetry={() => meQuery.refetch()}
          />
        </div>
      ) : null}

      {updateAvailability.isError ? (
        <div className="mt-4">
          <ErrorState
            message={describeError(updateAvailability.error).message}
            onRetry={() => updateAvailability.reset()}
          />
        </div>
      ) : null}

      <div className="mt-4 grid gap-3" id="disponibilidade-operacional">
        <Row
          icon={<Bell className="h-4 w-4" />}
          title="Disponível para plantões"
          desc={
            meQuery.data?.professionalId
              ? isAvailableForShifts
                ? "Janela padrão de seg–sex registrada."
                : "Nenhuma janela cadastrada."
              : "Apenas para profissionais vinculados."
          }
        >
          {availabilityQuery.isLoading ? (
            <SkeletonRow height={24} />
          ) : (
            <Switch
              checked={isAvailableForShifts}
              disabled={!meQuery.data?.professionalId || updateAvailability.isPending}
              onCheckedChange={(v) => void handleToggleAvailability(v)}
            />
          )}
        </Row>

        <Row
          icon={<ShieldCheck className="h-4 w-4" />}
          title="Notificações de troca"
          desc="Avisar sobre solicitações"
        >
          <Switch defaultChecked disabled title="Disponível com realtime na próxima etapa." />
        </Row>

        <Row
          icon={<Building2 className="h-4 w-4" />}
          title="Instituição"
          desc={
            meQuery.isLoading
              ? "Carregando instituição…"
              : tenantName
                ? `${tenantName} · Ativo`
                : "—"
          }
        >
          <Button variant="ghost" size="sm" disabled>
            Trocar
          </Button>
        </Row>

        {meQuery.data?.professionalId ? (
          <Row
            icon={<Stethoscope className="h-4 w-4" />}
            title="Disponibilidade semanal"
            desc={
              availabilityQuery.isLoading
                ? "Carregando…"
                : `${availabilityQuery.data?.length ?? 0} janelas cadastradas`
            }
          >
            <span className="text-xs text-muted-foreground">
              {updateAvailability.isPending ? "Salvando…" : ""}
            </span>
          </Row>
        ) : null}
      </div>

      <div className="mt-6">
        <Button
          variant="outline"
          className="w-full gap-2"
          type="button"
          onClick={async () => {
            teardownOperationalRealtime();
            try {
              const supabase = getBrowserSupabase();
              await supabase.auth.signOut();
            } catch {
              // sem config -> apenas redireciona
            }
            await navigate({ to: "/login" });
          }}
        >
          <LogOut className="h-4 w-4" /> Sair da conta
        </Button>
      </div>
    </AppShell>
  );
}

function Row({
  icon,
  title,
  desc,
  children,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-card border border-border ring-soft p-4">
      <span className="h-9 w-9 grid place-items-center rounded-lg bg-muted text-primary">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      {children}
    </div>
  );
}
