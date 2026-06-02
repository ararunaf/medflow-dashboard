import type { Database } from "@/lib/database.types";

export type FinancialClosingRow = Database["public"]["Tables"]["financial_closings"]["Row"];
export type FinancialClosingInsert = Database["public"]["Tables"]["financial_closings"]["Insert"];
export type FinancialClosingSnapshotRow =
  Database["public"]["Tables"]["financial_closing_snapshots"]["Row"];
export type FinancialClosingAuditRow =
  Database["public"]["Tables"]["financial_closing_audit"]["Row"];
export type FinancialClosingStatus = Database["public"]["Enums"]["financial_closing_status"];
export type FinancialClosingSnapshotType =
  Database["public"]["Enums"]["financial_closing_snapshot_type"];

export type ProviderConsolidationRow = {
  insurance_provider_id: string;
  provider_name: string;
  guide_count: number;
  total_billed: number;
  total_denied: number;
  total_approved: number;
};

export type ProfessionalConsolidationRow = {
  professional_id: string;
  display_name: string;
  guide_count: number;
  total_billed: number;
  total_denied: number;
  total_approved: number;
  payout_final_value: number;
};

export type OperationalConsolidationBundle = {
  competence_month: string;
  total_guides: number;
  total_billed: number;
  total_denied: number;
  total_approved: number;
  total_net_billed: number;
  total_payouts: number;
  operational_difference: number;
  by_provider: ProviderConsolidationRow[];
  by_professional: ProfessionalConsolidationRow[];
};
