import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AuthFallback } from "@/components/auth-fallback";
import { Button } from "@/components/ui/button";
import { parseLoginReason } from "@/lib/errors/auth-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Database } from "@/lib/database.types";
import { checkLoginGateFn, recordLoginOutcomeFn } from "@/lib/security/auth-security-server";
import { isValidEmailFormat, sanitizeEmail, sanitizeString } from "@/lib/security/sanitize-input";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { BRANDING, brandPageTitle, defaultLogoUrl as logo } from "@/lib/assets";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    reason: parseLoginReason(search),
  }),
  head: () => ({
    meta: [
      { title: brandPageTitle("Entrar") },
      { name: "description", content: "Acesse sua operação hospitalar inteligente." },
    ],
  }),
  component: LoginPage,
});

type TenantRow = Pick<Database["public"]["Tables"]["tenants"]["Row"], "id" | "name" | "slug">;

function LoginPage() {
  const { reason } = Route.useSearch();
  const navigate = useNavigate();
  const cfg = useMemo(() => getSupabasePublicConfig(), []);
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [tenantSlug, setTenantSlug] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [tenantsError, setTenantsError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!cfg) {
      setLoadingTenants(false);
      setTenantsError(
        "Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para carregar instituições.",
      );
      return;
    }

    const supabase = getBrowserSupabase();
    void supabase
      .from("tenants")
      .select("id, name, slug")
      .order("name")
      .then(({ data, error: fetchError }) => {
        setLoadingTenants(false);
        if (fetchError || !data?.length) {
          setTenants([]);
          setTenantsError(
            "Não foi possível carregar instituições. Verifique o projeto Supabase e a política de leitura pública em tenants.",
          );
          return;
        }
        setTenants(data);
        setTenantSlug(data[0]!.slug);
      });
  }, [cfg]);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="hidden lg:flex flex-1 bg-brand-gradient relative overflow-hidden">
        <div className="relative z-10 p-12 flex flex-col justify-between text-primary-foreground">
          <div className="text-sm font-medium opacity-80">
            {BRANDING.productName} · Plataforma Operacional
          </div>
          <div>
            <h2 className="text-4xl font-semibold leading-tight max-w-md">
              Inteligência que conecta. Operação que transforma.
            </h2>
            <p className="mt-4 text-base opacity-80 max-w-md">
              Escalas, plantões e indicadores clínicos em tempo real, em um único fluxo.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-10 bg-background">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-8 bg-surface rounded-2xl p-6 border border-border">
            <img src={logo} alt={BRANDING.productName} style={{ height: "6.25rem" }} className="w-auto" />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-center">Entrar</h1>
          <p className="text-sm text-muted-foreground text-center mt-1">
            Acesse sua operação hospitalar
          </p>

          {reason ? (
            <div className="mt-4">
              <AuthFallback reason={reason} variant="banner" />
            </div>
          ) : null}

          <form
            className="mt-6 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              if (!cfg) {
                setError("Configure as variáveis de ambiente do Supabase.");
                return;
              }
              const tenant = tenants.find((t) => t.slug === tenantSlug);
              if (!tenant) {
                setError("Selecione uma instituição válida.");
                return;
              }
              const normalizedEmail = sanitizeEmail(email);
              const normalizedPassword = sanitizeString(password, { maxLength: 256 });
              if (!isValidEmailFormat(normalizedEmail)) {
                setError("Informe um e-mail válido.");
                return;
              }

              setSubmitting(true);
              try {
                const gate = await checkLoginGateFn({
                  data: {
                    email: normalizedEmail,
                    tenantId: tenant.id,
                    tenantSlug: tenant.slug,
                  },
                });
                if (!gate.allowed) {
                  setError(gate.message ?? "Muitas tentativas. Aguarde e tente novamente.");
                  return;
                }

                const supabase = getBrowserSupabase();
                const { data: signData, error: signError } = await supabase.auth.signInWithPassword(
                  {
                    email: normalizedEmail,
                    password: normalizedPassword,
                  },
                );
                if (signError) {
                  await recordLoginOutcomeFn({
                    data: {
                      email: normalizedEmail,
                      success: false,
                      reason: "supabase_auth_error",
                      tenantId: tenant.id,
                      tenantSlug: tenant.slug,
                    },
                  });
                  setError(signError.message);
                  return;
                }
                const userId = signData.user?.id;
                if (!userId) {
                  setError("Não foi possível obter o usuário após o login.");
                  await recordLoginOutcomeFn({
                    data: {
                      email: normalizedEmail,
                      success: false,
                      reason: "no_user",
                      tenantId: tenant.id,
                      tenantSlug: tenant.slug,
                    },
                  });
                  await supabase.auth.signOut();
                  return;
                }
                const { data: profile, error: profileError } = await supabase
                  .from("profiles")
                  .select("*")
                  .eq("id", userId)
                  .maybeSingle();
                if (profileError || !profile) {
                  await recordLoginOutcomeFn({
                    data: {
                      email: normalizedEmail,
                      success: false,
                      reason: "no_profile",
                      tenantId: tenant.id,
                      tenantSlug: tenant.slug,
                      profileId: userId,
                    },
                  });
                  await supabase.auth.signOut();
                  setError(
                    `Seu usuário ainda não possui perfil vinculado. Solicite ao administrador do ${BRANDING.shortName}.`,
                  );
                  return;
                }
                if (profile.tenant_id !== tenant.id) {
                  await recordLoginOutcomeFn({
                    data: {
                      email: normalizedEmail,
                      success: false,
                      reason: "tenant_mismatch",
                      tenantId: tenant.id,
                      tenantSlug: tenant.slug,
                      profileId: userId,
                    },
                  });
                  await supabase.auth.signOut();
                  setError("Este usuário não pertence à instituição selecionada.");
                  return;
                }
                await recordLoginOutcomeFn({
                  data: {
                    email: normalizedEmail,
                    success: true,
                    reason: "success",
                    tenantId: tenant.id,
                    tenantSlug: tenant.slug,
                    profileId: userId,
                  },
                });
                await navigate({ to: "/" });
              } catch (err) {
                setError(err instanceof Error ? err.message : "Erro ao entrar.");
              } finally {
                setSubmitting(false);
              }
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="tenant">Instituição</Label>
              <select
                id="tenant"
                value={tenantSlug}
                onChange={(e) => setTenantSlug(e.target.value)}
                disabled={loadingTenants || tenants.length === 0}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.slug}>
                    {t.name}
                  </option>
                ))}
              </select>
              {tenantsError ? <p className="text-xs text-destructive">{tenantsError}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="voce@hospital.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="password">Senha</Label>
                <Link
                  to="/login/esqueci-senha"
                  className="text-xs text-muted-foreground hover:text-foreground whitespace-nowrap"
                >
                  Esqueci minha senha?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
              />
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button
              type="submit"
              className="w-full"
              disabled={submitting || tenants.length === 0 || !!tenantsError}
            >
              {submitting ? "Entrando…" : "Entrar"}
            </Button>
            <Link
              to="/site"
              className="block text-center text-xs text-muted-foreground hover:text-foreground"
            >
              Conheça o {BRANDING.productName}
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
