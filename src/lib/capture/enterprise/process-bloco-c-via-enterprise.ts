/**
 * EPC-24D — Bloco C (Workflow / Batch / Protocol) via Enterprise Runtime.
 *
 * Fluxo oficial:
 *   Produto → resolveCaptureEnterpriseRuntime() [= getEnterpriseRuntime()]
 *     → WorkflowRuntimePort (C-10)
 *     → BatchRuntimePort (C-06)
 *     → ProtocolRuntimePort (C-07)
 *     → (probe) Authorization / Operator / SOAP / Return / Reconciliation / XML-TISS
 *
 * Sem cutover. Sem alteração de regras TISS / UI / banco / APIs.
 * Foundations 4–7 preservadas.
 *
 * Não há engine de produto Bloco C separada: o caminho funcional de lotes/guias
 * TISS permanece nos services legados (`services/tiss/*`) como fallback até
 * EPC-24E. Este gateway apenas coordena Ports estruturais e expõe o handoff
 * Review→Bloco C sem side-effects de negócio.
 *
 * Nenhum módulo de produto deve importar runtimes Bloco C diretamente —
 * apenas este módulo (e o composition root `getEnterpriseRuntime`).
 */
import { resolveCaptureEnterpriseRuntime } from "./resolve-enterprise-runtime";

export type BlocoCCoordinationTrigger = "review-approved" | "probe" | "manual";

export type CoordinateBlocoCViaEnterpriseInput = {
  sessionId: string;
  trigger: BlocoCCoordinationTrigger;
  batchRef?: string;
};

export type CoordinateBlocoCViaEnterpriseResult = {
  viaEnterpriseRuntime: true;
  coordinationId: string;
  workflowExecutionId: string | null;
  batchId: string | null;
  protocolProfileId: string | null;
  blocoCFallback: "legacy-tiss-product-services";
  trigger: BlocoCCoordinationTrigger;
};

export type CaptureBlocoCViaEnterpriseProbe = {
  runtimeId: string;
  entry: "getEnterpriseRuntime";
  workflowRuntimeOk: boolean;
  batchRuntimeOk: boolean;
  protocolRuntimeOk: boolean;
  authorizationRuntimeOk: boolean;
  operatorRuntimeOk: boolean;
  soapRuntimeOk: boolean;
  returnRuntimeOk: boolean;
  reconciliationRuntimeOk: boolean;
  xmlTissRuntimeOk: boolean;
  providerId: string;
};

/**
 * Probe estrutural: produto alcança Ports do Bloco C via Runtime.
 * Best-effort; nunca lança.
 */
export async function probeCaptureBlocoCViaEnterprise(): Promise<CaptureBlocoCViaEnterpriseProbe | null> {
  try {
    const runtime = resolveCaptureEnterpriseRuntime();
    const [
      workflowHealth,
      batchHealth,
      protocolHealth,
      authorizationHealth,
      operatorHealth,
      soapHealth,
      returnHealth,
      reconciliationHealth,
      xmlTissHealth,
    ] = await Promise.all([
      runtime.getWorkflowRuntimePort().health(),
      runtime.getBatchRuntimePort().health(),
      runtime.getProtocolRuntimePort().health(),
      runtime.getAuthorizationRuntimePort().health(),
      runtime.getOperatorRuntimePort().health(),
      runtime.getSOAPRuntimePort().health(),
      runtime.getReturnRuntimePort().health(),
      runtime.getReconciliationRuntimePort().health(),
      runtime.getXMLTISSRuntimePort().health(),
    ]);
    return {
      runtimeId: runtime.runtimeId,
      entry: "getEnterpriseRuntime",
      workflowRuntimeOk: workflowHealth.ok,
      batchRuntimeOk: batchHealth.ok,
      protocolRuntimeOk: protocolHealth.ok,
      authorizationRuntimeOk: authorizationHealth.ok,
      operatorRuntimeOk: operatorHealth.ok,
      soapRuntimeOk: soapHealth.ok,
      returnRuntimeOk: returnHealth.ok,
      reconciliationRuntimeOk: reconciliationHealth.ok,
      xmlTissRuntimeOk: xmlTissHealth.ok,
      providerId: runtime.getWorkflowRuntimePort().providerId,
    };
  } catch {
    return null;
  }
}

/**
 * Coordena handoff estrutural Bloco C (Workflow → Batch → Protocol).
 * Não cria lote/guia real; services TISS legados permanecem o fallback funcional.
 */
export async function coordinateBlocoCViaEnterprise(
  input: CoordinateBlocoCViaEnterpriseInput,
): Promise<CoordinateBlocoCViaEnterpriseResult> {
  const runtime = resolveCaptureEnterpriseRuntime();
  const workflow = runtime.getWorkflowRuntimePort();
  const batch = runtime.getBatchRuntimePort();
  const protocol = runtime.getProtocolRuntimePort();

  const coordinationId = `bloco-c-${input.trigger}-${input.sessionId}`;
  let workflowExecutionId: string | null = null;
  let batchId: string | null = null;
  let protocolProfileId: string | null = null;

  try {
    const wf = await workflow.prepareWorkflowExecution({
      requestId: `bloco-c-wf-${input.sessionId}`,
      correlationId: input.sessionId,
      workflowId: coordinationId,
      tags: ["epc-24d", "bloco-c", input.trigger],
      owner: "epc-24d-capture-review-handoff",
    });
    workflowExecutionId = wf.execution?.workflowExecutionId ?? null;
  } catch {
    /* coordenação Workflow estrutural best-effort */
  }

  try {
    const preparedBatch = await batch.prepareBatch({
      requestId: `bloco-c-batch-${input.sessionId}`,
      batchName: input.batchRef ?? `review-handoff-${input.sessionId}`,
      tags: ["epc-24d", "bloco-c", input.trigger],
      owner: "epc-24d-capture-review-handoff",
    });
    batchId = preparedBatch.manifest?.batchId ?? null;
  } catch {
    /* coordenação Batch estrutural best-effort */
  }

  try {
    const preparedProtocol = await protocol.prepareProfile({
      requestId: `bloco-c-protocol-${input.sessionId}`,
      profileName: `review-handoff-${input.sessionId}`,
      tags: ["epc-24d", "bloco-c", input.trigger],
      owner: "epc-24d-capture-review-handoff",
    });
    protocolProfileId = preparedProtocol.profile?.profileId ?? null;
  } catch {
    /* coordenação Protocol estrutural best-effort */
  }

  return {
    viaEnterpriseRuntime: true,
    coordinationId,
    workflowExecutionId,
    batchId,
    protocolProfileId,
    blocoCFallback: "legacy-tiss-product-services",
    trigger: input.trigger,
  };
}
