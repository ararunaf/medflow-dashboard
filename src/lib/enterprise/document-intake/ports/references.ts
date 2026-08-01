/**
 * Helpers de referências opacas — EPC-12.
 *
 * Somente infraestrutura. NÃO resolve referências.
 * NÃO carrega Document Identity / Storage / Metadata / Workflow / Configuration.
 * NÃO chama OCR Providers, AI Providers ou Contract Foundation.
 */
import type {
  DocumentIntake,
  IntakeConfigurationReference,
  IntakeDocumentIdentityReference,
  IntakeMetadataReference,
  IntakeOpaqueReference,
  IntakeStorageReference,
  IntakeWorkflowReference,
} from "./types";

/** Define uma referência opaca a Document Identity. */
export function defineDocumentIdentityReference(
  options: IntakeDocumentIdentityReference = {},
): IntakeDocumentIdentityReference {
  return { ...options };
}

/** Define uma referência opaca a Storage. */
export function defineStorageReference(
  options: IntakeStorageReference = {},
): IntakeStorageReference {
  return { ...options };
}

/** Define uma referência opaca a Metadata. */
export function defineMetadataReference(
  options: IntakeMetadataReference = {},
): IntakeMetadataReference {
  return { ...options };
}

/** Define uma referência opaca a Workflow. */
export function defineWorkflowReference(
  options: IntakeWorkflowReference = {},
): IntakeWorkflowReference {
  return { ...options };
}

/** Define uma referência opaca a Configuration. */
export function defineConfigurationReference(
  options: IntakeConfigurationReference = {},
): IntakeConfigurationReference {
  return { ...options };
}

/**
 * Define uma referência opaca genérica (prep OCR / AI / Contract / …).
 * Sem resolução. Sem acoplamento.
 */
export function defineOpaqueReference(options: IntakeOpaqueReference = {}): IntakeOpaqueReference {
  return { ...options };
}

/** True se o intake declara referência a um Document Identity. */
export function referencesDocumentIdentity(intake: DocumentIntake, documentId: string): boolean {
  return intake.documentIdentityReference?.documentId === documentId;
}

/** True se o intake declara referência a um Workflow. */
export function referencesWorkflow(intake: DocumentIntake, workflowId: string): boolean {
  return intake.workflowReference?.workflowId === workflowId;
}

/** Obtém documentId opaco declarado (se houver). */
export function getDocumentId(intake: DocumentIntake): string | undefined {
  const id = intake.documentIdentityReference?.documentId;
  return id != null && id !== "" ? id : undefined;
}

/** Obtém workflowId opaco declarado (se houver). */
export function getWorkflowId(intake: DocumentIntake): string | undefined {
  const id = intake.workflowReference?.workflowId;
  return id != null && id !== "" ? id : undefined;
}

/** Obtém storage key opaca declarada (se houver). */
export function getStorageKey(intake: DocumentIntake): string | undefined {
  const key = intake.storageReference?.key;
  return key != null && key !== "" ? key : undefined;
}
