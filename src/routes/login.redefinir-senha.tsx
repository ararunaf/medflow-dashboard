import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sanitizeString } from "@/lib/security/sanitize-input";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { BRANDING, brandPageTitle, defaultLogoUrl as logo } from "@/lib/assets";

export const Route = createFileRoute("/login/redefinir-senha")({
  head: () => ({
    meta: [
      { title: brandPageTitle("Redefinir senha") },
      { name: "description", content: "Defina uma nova senha para sua conta MedicFlow-AI." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const cfg = useMemo(() => getSupabasePublicConfig(), []);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    if (!cfg) {
      setCheckingSession(false);
      return;
    }

    const supabase = getBrowserSupabase();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (session && event === "SIGNED_IN")) {
        setRecoveryReady(true);
        setCheckingSession(false);
      }
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setRecoveryReady(true);
      }
      setCheckingSession(false);
    });

    return () => subscription.unsubscribe();
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
              Defina uma nova senha segura.
            </h2>
            <p className="mt-4 text-base opacity-80 max-w-md">
              Use ao menos 8 caracteres. Você entrará com a nova senha na próxima vez.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-10 bg-background">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-8 bg-surface rounded-2xl p-6 border border-border">
            <img src={logo} alt={BRANDING.productName} style={{ height: "6.25rem" }} className="w-auto" />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-center">Redefinir senha</h1>
          <p className="text-sm text-muted-foreground text-center mt-1">
            Escolha uma nova senha para sua conta
          </p>

          {checkingSession ? (
            <p className="mt-6 text-sm text-muted-foreground text-center">Validando link…</p>
          ) : !recoveryReady ? (
            <div className="mt-6 space-y-4">
              <p className="text-sm text-destructive text-center">
                Link inválido ou expirado. Solicite um novo e-mail de recuperação.
              </p>
              <Link
                to="/login/esqueci-senha"
                className="block text-center text-sm text-primary hover:text-primary/90"
              >
                Solicitar novo link
              </Link>
            </div>
          ) : (
            <form
              className="mt-6 space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setError(null);
                if (!cfg) {
                  setError("Configure as variáveis de ambiente do Supabase.");
                  return;
                }
                const normalizedPassword = sanitizeString(password, { maxLength: 256 });
                const normalizedConfirm = sanitizeString(confirmPassword, { maxLength: 256 });
                if (normalizedPassword.length < 8) {
                  setError("A senha deve ter pelo menos 8 caracteres.");
                  return;
                }
                if (normalizedPassword !== normalizedConfirm) {
                  setError("As senhas não coincidem.");
                  return;
                }

                setSubmitting(true);
                try {
                  const supabase = getBrowserSupabase();
                  const { error: updateError } = await supabase.auth.updateUser({
                    password: normalizedPassword,
                  });
                  if (updateError) {
                    setError(updateError.message);
                    return;
                  }
                  await supabase.auth.signOut({ scope: "local" });
                  await navigate({ to: "/login" });
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Erro ao redefinir senha.");
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="password">Nova senha</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">Confirmar senha</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={submitting}
                />
              </div>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Salvando…" : "Salvar nova senha"}
              </Button>
            </form>
          )}

          <Link
            to="/login"
            className="mt-4 block text-center text-xs text-muted-foreground hover:text-foreground"
          >
            Voltar para login
          </Link>
        </div>
      </div>
    </div>
  );
}
