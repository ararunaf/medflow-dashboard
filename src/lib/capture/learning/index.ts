/**
 * Learning Loop — exports públicos.
 * MEDICFLOW-LEARNING-LOOP-01
 */
export type {
  LearningAction,
  LearningRecord,
  LearningRecordsStore,
  LearningMetricsStore,
  RuleMetrics,
  FieldMetrics,
  TemporalBucket,
  LearningRecommendation,
  LearningDashboardView,
  LearningSummaryMeta,
} from "./types/learning-record";
export { LEARNING_ACTIONS } from "./types/learning-record";

export {
  LearningLoopEngine,
  LEARNING_ENGINE_VERSION,
  getDefaultLearningLoopEngine,
  buildLearningId,
  mapProposalStatusToAction,
  resolveFinalValue,
  proposalToLearningRecord,
  extractDecidedRecordsFromStore,
  appendRecordIfNew,
  appendRecordsIfNew,
  calculateRuleMetrics,
  calculateFieldMetrics,
  calculateTemporalEvolution,
  calculateMetricsFromRecords,
  buildEmptyRecordsStore,
} from "./engine/learning-loop-engine";

export {
  RecommendationEngine,
  getDefaultRecommendationEngine,
  generateRecommendations,
  buildDashboardView,
} from "./engine/recommendation-engine";

export {
  LEARNING_RECORDS_FILENAME,
  LEARNING_METRICS_FILENAME,
  buildLearningStorageBasePath,
  buildLearningRecordsStoragePath,
  buildLearningMetricsStoragePath,
  loadLearningRecords,
  persistLearningRecords,
  loadLearningMetrics,
  persistLearningMetrics,
  persistLearningArtifacts,
  buildLearningSummaryFromStore,
  buildLearningSummaryFromMetadata,
} from "./infrastructure/learning-storage";

export {
  LearningLoopService,
  getDefaultLearningLoopService,
  recordCaptureLearningDecision,
  getCaptureLearningDashboard,
  getCaptureLearningMetrics,
  getCaptureLearningRecords,
  type RecordLearningDecisionResult,
} from "./services/learning-loop-service";
