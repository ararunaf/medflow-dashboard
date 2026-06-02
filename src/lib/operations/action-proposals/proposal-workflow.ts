import type { OperationalActionProposalState } from "@/lib/database.types";

/** Estados que podem ser persistidos como `expired` após TTL. */
export const PROPOSAL_EXPIRABLE_STATES: OperationalActionProposalState[] = [
  "draft",
  "suggested",
  "awaiting_confirmation",
];

export function effectiveProposalState(input: {
  stored: OperationalActionProposalState;
  expiresAtIso: string;
  nowMs?: number;
}): OperationalActionProposalState {
  const now = input.nowMs ?? Date.now();
  if (input.stored === "approved" || input.stored === "rejected" || input.stored === "expired") {
    return input.stored;
  }
  const exp = Date.parse(input.expiresAtIso);
  if (Number.isFinite(exp) && now > exp) {
    return "expired";
  }
  return input.stored;
}
