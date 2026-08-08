/**
 * Capabilities oficiais do Bloco H — TISS Enterprise Integration.
 */

export interface TISSIntegrationCapabilities {
  readonly tissCommunicationImplemented: boolean;
  readonly tissSoapImplemented: boolean;
  readonly tissAuthenticationImplemented: boolean;
  readonly tissSubmissionImplemented: boolean;
  readonly tissBatchImplemented: boolean;
  readonly tissReturnProcessingImplemented: boolean;
  readonly tissStatusTrackingImplemented: boolean;
  readonly tissRetryImplemented: boolean;
  readonly tissAuditImplemented: boolean;
  readonly tissIntegrationEngineImplemented: boolean;
}

export const H01_TISS_INTEGRATION_CAPABILITIES: TISSIntegrationCapabilities = {
  tissCommunicationImplemented: true,
  tissSoapImplemented: false,
  tissAuthenticationImplemented: false,
  tissSubmissionImplemented: false,
  tissBatchImplemented: false,
  tissReturnProcessingImplemented: false,
  tissStatusTrackingImplemented: false,
  tissRetryImplemented: false,
  tissAuditImplemented: false,
  tissIntegrationEngineImplemented: false,
};

export const H02_TISS_INTEGRATION_CAPABILITIES: TISSIntegrationCapabilities = {
  ...H01_TISS_INTEGRATION_CAPABILITIES,
  tissSoapImplemented: true,
};

export const H03_TISS_INTEGRATION_CAPABILITIES: TISSIntegrationCapabilities = {
  ...H02_TISS_INTEGRATION_CAPABILITIES,
  tissAuthenticationImplemented: true,
};

export const H04_TISS_INTEGRATION_CAPABILITIES: TISSIntegrationCapabilities = {
  ...H03_TISS_INTEGRATION_CAPABILITIES,
  tissSubmissionImplemented: true,
};
