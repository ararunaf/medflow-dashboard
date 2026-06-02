import type { Database } from "@/lib/database.types";

export type OperationalReconciliationRow =
  Database["public"]["Tables"]["operational_reconciliations"]["Row"];
export type OperationalReconciliationItemRow =
  Database["public"]["Tables"]["operational_reconciliation_items"]["Row"];
export type OperationalReconciliationIssueRow =
  Database["public"]["Tables"]["operational_reconciliation_issues"]["Row"];
export type OperationalReconciliationAuditRow =
  Database["public"]["Tables"]["operational_reconciliation_audit"]["Row"];

export type OperationalReconciliationStatus =
  Database["public"]["Enums"]["operational_reconciliation_status"];
export type OperationalReconciliationItemStatus =
  Database["public"]["Enums"]["operational_reconciliation_item_status"];
export type OperationalReconciliationItemReferenceType =
  Database["public"]["Enums"]["operational_reconciliation_item_reference_type"];
export type OperationalReconciliationIssueSeverity =
  Database["public"]["Enums"]["operational_reconciliation_issue_severity"];
export type OperationalReconciliationAuditAction =
  Database["public"]["Enums"]["operational_reconciliation_audit_action"];

export type ReconciliationMatchingMode = "competence" | "batch" | "guide" | "insurance" | "payout";

export type OperationalReconciliationIssueType =
  | "financial_difference"
  | "glosa_not_reflected"
  | "payout_inconsistent"
  | "closing_divergent"
  | "partial_receipt"
  | "operational_pending";
