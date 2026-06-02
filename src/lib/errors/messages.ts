import type { AppErrorKind } from "./types";

export const APP_ERROR_MESSAGES: Record<AppErrorKind, string> = {
  session_expired: "Sessão expirada. Faça login novamente.",
  invalid_token: "Credenciais inválidas ou corrompidas. Entre novamente.",
  timeout: "A operação demorou demais. Verifique a conexão e tente de novo.",
  offline: "Sem conexão com a internet. As alterações serão sincronizadas ao voltar online.",
  permission_denied: "Você não tem permissão para esta operação.",
  unknown: "Erro inesperado. Tente novamente em instantes.",
};

export function messageForKind(kind: AppErrorKind): string {
  return APP_ERROR_MESSAGES[kind];
}

/** Mensagens na tela de login conforme `?reason=` na URL. */
export const LOGIN_REASON_MESSAGES: Partial<Record<AppErrorKind, string>> = {
  session_expired: APP_ERROR_MESSAGES.session_expired,
  invalid_token: APP_ERROR_MESSAGES.invalid_token,
};
