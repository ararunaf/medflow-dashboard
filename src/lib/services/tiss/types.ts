import type { Database } from "@/lib/database.types";

export type InsuranceProviderRow = Database["public"]["Tables"]["insurance_providers"]["Row"];
export type InsuranceContractRow = Database["public"]["Tables"]["insurance_contracts"]["Row"];
export type InsuranceRuleRow = Database["public"]["Tables"]["insurance_rules"]["Row"];
export type TussProcedureRow = Database["public"]["Tables"]["tuss_procedures"]["Row"];
export type TissGuideRow = Database["public"]["Tables"]["tiss_guides"]["Row"];
export type TissGuideItemRow = Database["public"]["Tables"]["tiss_guide_items"]["Row"];
export type TissBatchRow = Database["public"]["Tables"]["tiss_batches"]["Row"];
export type TissBatchExportRow = Database["public"]["Tables"]["tiss_batch_exports"]["Row"];
export type TissReturnRow = Database["public"]["Tables"]["tiss_returns"]["Row"];
export type TissDenialRow = Database["public"]["Tables"]["tiss_denials"]["Row"];
export type TissDenialAppealRow = Database["public"]["Tables"]["tiss_denial_appeals"]["Row"];
