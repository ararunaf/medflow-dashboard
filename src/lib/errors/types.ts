/** Categorias de falha expostas à UI e ao roteamento de auth. */
export type AppErrorKind =
  | "session_expired"
  | "invalid_token"
  | "timeout"
  | "offline"
  | "permission_denied"
  | "unknown";

export type ClassifiedError = {
  kind: AppErrorKind;
  message: string;
  /** Se true, a sessão deve ser encerrada e o usuário enviado ao login. */
  requiresAuthRedirect: boolean;
};

export const QUERY_DEFAULT_TIMEOUT_MS = 45_000;
