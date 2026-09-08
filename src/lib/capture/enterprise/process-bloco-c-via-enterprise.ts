/**
 * EPC-24D / EPC-24E — Bloco C (Workflow / Batch / Protocol) via Enterprise Runtime.
 *
 * Fluxo oficial único (cutover EPC-24E):
 *   Produto → resolveCaptureEnterpriseRuntime() [= getEnterpriseRuntime()]
 *     → WorkflowRuntimePort (C-10)
 *     → BatchRuntimePort (C-06)
 *     → ProtocolRuntimePort (C-07)
 *     → (probe) Authorization / Operator / SOAP / Return / Reconciliation / XML-TISS
 *
 * Sem Dual Path. Sem flag de fallback. Sem alteração de regras TISS / UI /
 * banco / APIs. Foundations 4–7 preservadas.
 *
 * Não há engine de produto Bloco C separada: services TISS (`services/tiss/*`)
 * permanecem implementação interna autorizada de lotes/guias — nunca pipeline
 * paralelo. Este gateway coordena Ports estruturais e o handoff Review→Bloco C
 * sem side-effects de negócio adicionais.
 *
 * Nenhum módulo de produto deve importar runtimes Bloco C diretamente —
 * apenas este módulo (e o composition root `getEnterpriseRuntime`).
 */
import { CaptureEnterpriseRuntimeUnavailableError } from "./capture-enterprise-runtime-unavailable-error";
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
  trigger: BlocoCCoordinationTrigger;
  singlePipeline: true;
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
 * Não cria lote/guia real; services TISS permanecem implementação interna.
 */
export async function coordinateBlocoCViaEnterprise(
  input: CoordinateBlocoCViaEnterpriseInput,
): Promise<CoordinateBlocoCViaEnterpriseResult> {
  // Gate só nos Ports que esta função de fato usa (workflow/batch/protocol).
  // Os demais campos do probe (authorization/operator/soap/return/
  // reconciliation/xmlTiss) são diagnóstico geral do Bloco C, não
  // dependência direta desta coordenação.
  const probe = await probeCaptureBlocoCViaEnterprise();
  if (!probe || !probe.workflowRuntimeOk || !probe.batchRuntimeOk || !probe.protocolRuntimeOk) {
    throw new CaptureEnterpriseRuntimeUnavailableError("bloco-c", {
      workflowRuntimeOk: probe?.workflowRuntimeOk ?? false,
      batchRuntimeOk: probe?.batchRuntimeOk ?? false,
      protocolRuntimeOk: probe?.protocolRuntimeOk ?? false,
    });
  }

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
      tags: ["epc-24e", "bloco-c", input.trigger],
      owner: "epc-24e-capture-review-handoff",
    });
    workflowExecutionId = wf.execution?.workflowExecutionId ?? null;
  } catch {
    /* coordenação Workflow estrutural */
  }

  try {
    const preparedBatch = await batch.prepareBatch({
      requestId: `bloco-c-batch-${input.sessionId}`,
      batchName: input.batchRef ?? `review-handoff-${input.sessionId}`,
      tags: ["epc-24e", "bloco-c", input.trigger],
      owner: "epc-24e-capture-review-handoff",
    });
    batchId = preparedBatch.manifest?.batchId ?? null;
  } catch {
    /* coordenação Batch estrutural */
  }

  try {
    const preparedProtocol = await protocol.prepareProfile({
      requestId: `bloco-c-protocol-${input.sessionId}`,
      profileName: `review-handoff-${input.sessionId}`,
      tags: ["epc-24e", "bloco-c", input.trigger],
      owner: "epc-24e-capture-review-handoff",
    });
    protocolProfileId = preparedProtocol.profile?.profileId ?? null;
  } catch {
    /* coordenação Protocol estrutural */
  }

  return {
    viaEnterpriseRuntime: true,
    coordinationId,
    workflowExecutionId,
    batchId,
    protocolProfileId,
    trigger: input.trigger,
    singlePipeline: true,
  };
}
