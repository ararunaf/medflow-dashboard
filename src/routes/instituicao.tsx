import { createFileRoute, Link } from "@tanstack/react-router";
import { brandPageTitle } from "@/lib/assets";
import { AppShell } from "@/components/app-shell";
import { EmptyState, ErrorState, PageHeader, SkeletonRow, StatusBadge } from "@/components/ui-kit";
import {
  operationalReadinessQueryOptions,
  useApplyDemoCatalogMutation,
  useOperationalReadinessQuery,
  useSaveTenantSettingsMutation,
} from "@/hooks/use-commercial-readiness";
import { can } from "@/lib/auth/rbac";
import { reportOperationalFailureClient } from "@/lib/observability/report-operational-failure-client";
import { describeError } from "@/lib/queries/result";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { Activity, ImagePlus, RefreshCw, Server, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { OPERATIONAL_UPLOAD_MAX_BYTES } from "@/lib/operational/constants";
import { validateBrandingUpload } from "@/lib/security/upload-validation";
import { useToast } from "@/hooks/use-toast";

export const Route = createFileRoute("/instituicao")({
  head: () => ({
    meta: [
      { title: brandPageTitle("Instituição") },
      {
        name: "description",
        content: "Branding, parametrização e readiness operacional por tenant.",
      },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient
      .prefetchQuery(operationalReadinessQueryOptions())
      .catch(() => undefined);
  },
  component: InstituicaoPage,
});

function InstituicaoPage() {
  const { auth } = Route.useRouteContext();
  const role = auth.profile?.role ?? null;
  const canWrite = can(role, "tenant_settings:write");
  const canSeed = can(role, "demo_seed:apply");

  const q = useOperationalReadinessQuery();
  const save = useSaveTenantSettingsMutation();
  const seed = useApplyDemoCatalogMutation();
  const fileRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const s = q.data?.settings;
  const [uploadKind, setUploadKind] = useState<"logo" | "banner" | "favicon">("logo");
  const [form, setForm] = useState({
    institution_name: "",
    primary_color: "",
    secondary_color: "",
    contact_email: "",
    support_phone: "",
    operational_timezone: "",
    currency: "",
  });

  useEffect(() => {
    if (!s) return;
    setForm({
      institution_name: s.institution_name ?? "",
      primary_color: s.primary_color ?? "#1e3a5f",
      secondary_color: s.secondary_color ?? "#0d9488",
      contact_email: s.contact_email ?? "",
      support_phone: s.support_phone ?? "",
      operational_timezone: s.operational_timezone ?? "America/Sao_Paulo",
      currency: s.currency ?? "BRL",
    });
  }, [s]);

  async function onUpload(kind: "logo" | "banner" | "favicon", file: File) {
    const env = getSupabasePublicConfig();
    if (!env || !auth.tenantId) return;
    const uploadCheck = validateBrandingUpload(file);
    if (!uploadCheck.ok) {
      toast.warning("Upload inválido", uploadCheck.reason);
      return;
    }
    if (file.size > OPERATIONAL_UPLOAD_MAX_BYTES) {
      toast.warning(
        "Arquivo grande demais",
        `Use imagens até ${Math.round(OPERATIONAL_UPLOAD_MAX_BYTES / 1000)}KB (limite operacional).`,
      );
      return;
    }
    const sb = getBrowserSupabase();
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${auth.tenantId}/${kind}-${Date.now()}.${ext}`;
    const { error: upErr } = await sb.storage.from("tenant-branding").upload(path, file, {
      upsert: true,
      contentType: file.type || "image/png",
    });
    if (upErr) {
      toast.error("Falha no upload", upErr.message);
      void reportOperationalFailureClient({
        source: "upload",
        err: new Error(upErr.message),
      });
      return;
    }
    const { data } = sb.storage.from("tenant-branding").getPublicUrl(path);
    const url = data.publicUrl;
    const patch =
      kind === "logo"
        ? { logo_url: url }
        : kind === "banner"
          ? { banner_url: url }
          : { favicon_url: url };
    await save.mutateAsync(patch);
  }

  return (
    <AppShell>
      <PageHeader
        title="Instituição e readiness"
        subtitle="Branding multi-tenant, parametrização e estabilidade operacional para demo e go-live."
        actions={
          <div className="flex flex-wrap gap-2 items-center">
            <Link
              to="/lancamento"
              className="text-xs font-medium text-primary hover:underline whitespace-nowrap"
            >
              Go-live / lançamento →
            </Link>
            <Link
              to="/piloto"
              className="text-xs font-medium text-muted-foreground hover:text-foreground whitespace-nowrap"
            >
              Piloto →
            </Link>
            <Link
              to="/ajuda"
              className="text-xs font-medium text-muted-foreground hover:text-foreground whitespace-nowrap"
            >
              Ajuda →
            </Link>
            <button
              type="button"
              onClick={() => void q.refetch()}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-muted/50"
            >
              <RefreshCw className={q.isFetching ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
              Atualizar status
            </button>
          </div>
        }
      />

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml,.ico"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onUpload(uploadKind, f);
          e.target.value = "";
        }}
      />

      {q.isLoading ? (
        <div className="space-y-3">
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : q.isError ? (
        <ErrorState message={describeError(q.error).message} onRetry={() => void q.refetch()} />
      ) : !q.data ? (
        <EmptyState title="Sem dados" description="Não foi possível carregar a parametrização." />
      ) : (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <section className="rounded-xl border border-border bg-card ring-soft p-5">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold">Checklist operacional</h2>
              </div>
              <ul className="space-y-2">
                {q.data.checklist.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border/80 px-3 py-2.5"
                  >
                    <div>
                      <div className="text-sm font-medium text-foreground">{item.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{item.hint}</div>
                    </div>
                    <StatusBadge status={item.done ? "confirmado" : "pendente"} />
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl border border-border bg-card ring-soft p-5">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold">Health checks</h2>
              </div>
              <ul className="space-y-2">
                {q.data.health.map((h) => (
                  <li key={h.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-foreground">{h.label}</span>
                    <span
                      className={
                        h.ok
                          ? "text-[color:var(--success)] text-xs font-medium"
                          : "text-destructive text-xs"
                      }
                    >
                      {h.ok ? "OK" : "Atenção"}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">
                {q.data.health.find((h) => h.id === "database")?.detail}
              </p>
            </section>

            <section className="rounded-xl border border-border bg-card ring-soft p-5">
              <div className="flex items-center gap-2 mb-4">
                <Server className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold">Readiness de deploy</h2>
              </div>
              {q.data.publicEnv.warnings.length > 0 ? (
                <div className="mb-3 rounded-lg border border-[color:var(--warning)]/30 bg-[color:var(--warning)]/10 px-3 py-2 text-xs text-foreground">
                  {q.data.publicEnv.warnings.join(" · ")}
                </div>
              ) : null}
              <ul className="space-y-2">
                {q.data.deploymentChecklist.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border/80 px-3 py-2.5"
                  >
                    <div>
                      <div className="text-sm font-medium text-foreground">{item.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{item.hint}</div>
                    </div>
                    <StatusBadge status={item.done ? "confirmado" : "pendente"} />
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="space-y-4">
            <section className="rounded-xl border border-border bg-card ring-soft p-5 space-y-4">
              <h2 className="text-sm font-semibold">Branding e contato</h2>
              {!canWrite ? (
                <EmptyState
                  title="Visualização"
                  description="Apenas administradores do tenant podem alterar branding e contatos."
                />
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted/50"
                      onClick={() => {
                        setUploadKind("logo");
                        queueMicrotask(() => fileRef.current?.click());
                      }}
                    >
                      <ImagePlus className="h-3.5 w-3.5" />
                      Logo
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted/50"
                      onClick={() => {
                        setUploadKind("banner");
                        queueMicrotask(() => fileRef.current?.click());
                      }}
                    >
                      Banner
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted/50"
                      onClick={() => {
                        setUploadKind("favicon");
                        queueMicrotask(() => fileRef.current?.click());
                      }}
                    >
                      Favicon
                    </button>
                  </div>

                  <label className="block text-xs font-medium text-muted-foreground">
                    Nome institucional
                  </label>
                  <input
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    value={form.institution_name}
                    onChange={(e) => setForm((p) => ({ ...p, institution_name: e.target.value }))}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground">
                        Cor primária
                      </label>
                      <input
                        type="color"
                        className="mt-1 h-9 w-full rounded cursor-pointer border border-input"
                        value={form.primary_color?.startsWith("#") ? form.primary_color : "#1e3a5f"}
                        onChange={(e) => setForm((p) => ({ ...p, primary_color: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground">
                        Cor secundária
                      </label>
                      <input
                        type="color"
                        className="mt-1 h-9 w-full rounded cursor-pointer border border-input"
                        value={
                          form.secondary_color?.startsWith("#") ? form.secondary_color : "#0d9488"
                        }
                        onChange={(e) =>
                          setForm((p) => ({ ...p, secondary_color: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <label className="block text-xs font-medium text-muted-foreground">
                    E-mail de contato
                  </label>
                  <input
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    value={form.contact_email}
                    onChange={(e) => setForm((p) => ({ ...p, contact_email: e.target.value }))}
                  />

                  <label className="block text-xs font-medium text-muted-foreground">
                    Telefone suporte
                  </label>
                  <input
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    value={form.support_phone}
                    onChange={(e) => setForm((p) => ({ ...p, support_phone: e.target.value }))}
                  />

                  <label className="block text-xs font-medium text-muted-foreground">
                    Fuso (IANA)
                  </label>
                  <input
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    value={form.operational_timezone}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, operational_timezone: e.target.value }))
                    }
                  />

                  <label className="block text-xs font-medium text-muted-foreground">
                    Moeda (ISO)
                  </label>
                  <input
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    value={form.currency}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, currency: e.target.value.toUpperCase() }))
                    }
                  />

                  <button
                    type="button"
                    disabled={save.isPending}
                    onClick={() =>
                      void save.mutateAsync({
                        institution_name: form.institution_name,
                        primary_color: form.primary_color,
                        secondary_color: form.secondary_color,
                        contact_email: form.contact_email,
                        support_phone: form.support_phone,
                        operational_timezone: form.operational_timezone,
                        currency: form.currency,
                      })
                    }
                    className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                  >
                    {save.isPending ? "Salvando…" : "Salvar parametrização"}
                  </button>
                  {save.isError ? (
                    <p className="text-xs text-destructive">{describeError(save.error).message}</p>
                  ) : null}
                </>
              )}
            </section>

            {canSeed ? (
              <section className="rounded-xl border border-dashed border-border bg-muted/20 p-5 space-y-3">
                <h2 className="text-sm font-semibold">Ambiente demo (leve)</h2>
                <p className="text-xs text-muted-foreground">
                  Insere até dois convênios fictícios e um contrato de catálogo quando o tenant
                  ainda tem poucos cadastros. Não cria glosas, repasses ou timelines completas — use
                  dados reais após onboarding clínico.
                </p>
                <button
                  type="button"
                  disabled={seed.isPending}
                  onClick={() => void seed.mutateAsync()}
                  className="w-full rounded-lg border border-border bg-card py-2 text-sm font-medium hover:bg-muted/50 disabled:opacity-50"
                >
                  {seed.isPending ? "Aplicando…" : "Aplicar seed de convênios"}
                </button>
                {seed.isError ? (
                  <p className="text-xs text-destructive">{describeError(seed.error).message}</p>
                ) : null}
              </section>
            ) : null}
          </div>
        </div>
      )}
    </AppShell>
  );
}
