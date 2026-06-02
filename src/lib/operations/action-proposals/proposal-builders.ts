import { createHash } from "node:crypto";
import type { OperationalActionKind } from "@/lib/database.types";
import type { OperationalProposalReference } from "./types";

/** Chave determinística curta para deduplicação best-effort (não criptográfica). */
export function buildProposalDedupeKey(input: {
  tenantId: string;
  actionKind: OperationalActionKind;
  title: string;
  references: OperationalProposalReference[];
}): string {
  const refFingerprint = input.references
    .map((r) => `${r.kind}:${r.ref}`)
    .sort()
    .join("|");
  const raw = `${input.tenantId}|${input.actionKind}|${input.title.trim().toLowerCase()}|${refFingerprint}`;
  return createHash("sha256").update(raw, "utf8").digest("hex").slice(0, 48);
}
