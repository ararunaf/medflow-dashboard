import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPasswordResetRedirectUrl } from "@/lib/auth/password-reset";
import { isValidEmailFormat, sanitizeEmail } from "@/lib/security/sanitize-input";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { BRANDING, brandPageTitle, defaultLogoUrl as logo } from "@/lib/assets";

export const Route = createFileRoute("/login/esqueci-senha")({
  head: () => ({
    meta: [
      { title: brandPageTitle("Recuperar senha") },
      { name: "description", content: "Solicite a redefinição da sua senha no MedicFlow-AI." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const cfg = useMemo(() => getSupabasePublicConfig(), []);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="hidden lg:flex flex-1 bg-brand-gradient relative overflow-hidden">
        <div className="relative z-10 p-12 flex flex-col justify-between text-primary-foreground">
          <div className="text-sm font-medium opacity-80">
            {BRANDING.productName} · Plataforma Operacional
          </div>
          <div>
            <h2 className="text-4xl font-semibold leading-tight max-w-md">
              Recupere o acesso à sua operação.
            </h2>
            <p className="mt-4 text-base opacity-80 max-w-md">
              Enviaremos um link seguro para redefinir sua senha.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-10 bg-background">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-8 bg-surface rounded-2xl p-6 border border-border">
            <img
              src={logo}
              alt={BRANDING.productName}
              style={{ height: "6.25rem" }}
              className="w-auto"
            />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-center">Esqueci minha senha</h1>
          <p className="text-sm text-muted-foreground text-center mt-1">
            Informe seu e-mail para receber o link de redefinição
          </p>

          {success ? (
            <div
              role="status"
              className="mt-6 rounded-lg border border-[color:var(--success)]/50 bg-[color:var(--success)]/10 px-3 py-3 text-sm text-foreground"
            >
              Se existir uma conta com este e-mail, enviaremos instruções para redefinir sua senha.
              Verifique também a caixa de spam.
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
                const normalizedEmail = sanitizeEmail(email);
                if (!isValidEmailFormat(normalizedEmail)) {
                  setError("Informe um e-mail válido.");
                  return;
                }

                setSubmitting(true);
                try {
                  const supabase = getBrowserSupabase();
                  const redirectTo = getPasswordResetRedirectUrl();
                  const { error: resetError } = await supabase.auth.resetPasswordForEmail(
                    normalizedEmail,
                    { redirectTo },
                  );
                  if (resetError) {
                    setError(resetError.message);
                    return;
                  }
                  setSuccess(true);
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Erro ao solicitar recuperação.");
                } finally {
                  setSubmitting(false);
                }
              }}
            >
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

              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Enviando…" : "Enviar link de recuperação"}
              </Button>
            </form>
          )}

          <Link
            to="/login"
            search={{ reason: null }}
            className="mt-4 block text-center text-xs text-muted-foreground hover:text-foreground"
          >
            Voltar para login
          </Link>
        </div>
      </div>
    </div>
  );
}
