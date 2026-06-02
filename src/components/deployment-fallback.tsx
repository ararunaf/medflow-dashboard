import { validatePublicEnv } from "@/lib/env/public-env-validation";
import { Link } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";

/**
 * Fallback quando ambiente público impede operação segura (ex.: sem Supabase).
 */
export function DeploymentFallback() {
  const env = validatePublicEnv();
  if (env.supabaseConfigured) return null;

  return (
    <div
      role="alert"
      className="mx-4 mt-4 rounded-lg border border-[color:var(--warning)]/50 bg-[color:var(--warning)]/10 p-4"
    >
      <div className="flex gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-[color:var(--warning)]" />
        <div>
          <p className="text-sm font-semibold">Configuração de deploy pendente</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY em .env.local (desenvolvimento) ou nas
            variáveis de build/deploy. Consulte LOCAL_SETUP.md.
          </p>
          <Link
            to="/instituicao"
            className="mt-2 inline-block text-xs text-primary hover:underline"
          >
            Instituição →
          </Link>
        </div>
      </div>
    </div>
  );
}
