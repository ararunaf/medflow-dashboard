import { redirect } from "@tanstack/react-router";
import { can } from "@/lib/auth/rbac";
import type { AuthContext } from "@/lib/auth/types";

export function assertFinancialReadAccess(auth: AuthContext): void {
  if (!can(auth.profile?.role ?? null, "financial_closing:read")) {
    throw redirect({ to: "/" });
  }
}
