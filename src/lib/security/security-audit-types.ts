export type SecurityAuditCategory =
  | "auth"
  | "login_attempt"
  | "session"
  | "ssr"
  | "tenant_access";

export type SecurityAuditOutcome = "success" | "failure" | "blocked" | "error";

export type SecurityAuditEventType =
  | "sign_in_success"
  | "sign_in_failure"
  | "login_gate_blocked"
  | "login_page_rate_limited"
  | "tenant_mismatch"
  | "no_profile"
  | "session_expired"
  | "token_refresh_failed"
  | "session_validation_failed"
  | "get_user_failed"
  | "sign_out"
  | "ssr_catastrophic"
  | "ssr_middleware_error"
  | "ssr_worker_uncaught";

export type SecurityAuditInput = {
  category: SecurityAuditCategory;
  eventType: SecurityAuditEventType;
  outcome: SecurityAuditOutcome;
  message?: string;
  tenantId?: string | null;
  profileId?: string | null;
  email?: string | null;
  ip?: string | null;
  metadata?: Record<string, unknown>;
};
