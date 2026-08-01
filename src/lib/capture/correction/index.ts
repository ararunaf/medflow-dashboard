/**
 * Correção Assistida — exports públicos.
 * MEDICFLOW-CORRECTION-ASSISTANT-01
 */
export type {
  CorrectionProposal,
  CorrectionProposalStatus,
  CorrectionProposalStore,
  CorrectionProposalSummaryMeta,
  CorrectionSource,
  UpdateCorrectionProposalInput,
} from "./types/correction-proposal";
export { CORRECTION_PROPOSAL_STATUSES, CORRECTION_SOURCES } from "./types/correction-proposal";

export {
  CorrectionProposalEngine,
  CORRECTION_ENGINE_VERSION,
  getDefaultCorrectionProposalEngine,
  generateCorrectionProposals,
  buildFindingId,
  buildProposalId,
} from "./engine/correction-proposal-engine";

export {
  CORRECTION_PROPOSALS_FILENAME,
  buildCorrectionProposalsStoragePath,
  persistCorrectionProposals,
  loadCorrectionProposals,
  getCorrectionProposalsSignedUrl,
  buildCorrectionSummaryFromStore,
  buildCorrectionSummaryFromMetadata,
} from "./infrastructure/correction-storage";

export {
  CorrectionAssistantService,
  getDefaultCorrectionAssistantService,
  runCaptureCorrectionAssistant,
  getCaptureCorrectionProposals,
  updateCaptureCorrectionProposal,
  decideProposalInStore,
  proposalDecisionEventType,
  type GenerateCorrectionProposalsResult,
} from "./services/correction-assistant-service";
