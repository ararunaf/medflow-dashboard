import type { Database, MedicalPayoutStatus, PayoutRuleType } from "@/lib/database.types";

export type MedicalProductionRow = Database["public"]["Tables"]["medical_production"]["Row"];
export type MedicalPayoutRow = Database["public"]["Tables"]["medical_payouts"]["Row"];
export type MedicalPayoutItemRow = Database["public"]["Tables"]["medical_payout_items"]["Row"];
export type PayoutRuleRow = Database["public"]["Tables"]["payout_rules"]["Row"];
export type MedicalPayoutAuditRow = Database["public"]["Tables"]["medical_payout_audit"]["Row"];

export type { MedicalPayoutStatus, PayoutRuleType };
