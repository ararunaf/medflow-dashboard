/**
 * Wrapper React que ativa a camada realtime operacional.
 *
 * É montado uma única vez na árvore (perto do `<AuthSync />`) e
 * apenas chama `useOperationalRealtime()` — toda a lógica fica no
 * hook. Em SSR ou sem Supabase configurado, é totalmente inerte.
 *
 * Renderiza condicionalmente: só ativa o hook se há sessão. Isso
 * evita disparar `useMyContextQuery` na rota `/login` antes do
 * redirect oficial.
 *
 * Não renderiza nada na DOM: a única saída visual associada à
 * camada realtime é o `<ToastHost />`, que é um overlay separado e
 * pode ser montado em qualquer lugar da árvore.
 */
import { useOperationalRealtime } from "@/hooks/use-operational-realtime";

export function RealtimeProvider({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;
  return <RealtimeInner />;
}

function RealtimeInner() {
  useOperationalRealtime();
  return null;
}
