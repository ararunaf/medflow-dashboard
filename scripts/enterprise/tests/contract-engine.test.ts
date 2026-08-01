#!/usr/bin/env node
/**
 * EPC-11 — Contract Foundation
 * Prova Application → ContractPort → Adapter → Store sem tocar produto.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CONTRACT_STATUSES,
  createContractFactory,
  createContractId,
  createContractPort,
  DEFAULT_CONTRACT_ADAPTER_ID,
  DefaultContractAdapter,
  DefaultContractStore,
  defineAttachment,
  defineClause,
  defineConfigurationReference,
  defineContractVersion,
  defineMetadataReference,
  defineReference,
  defineRulePackReference,
  defineSection,
  defineWorkflowReference,
  getAttachmentCount,
  getContractHealthSummary,
  getVersionInfo,
  hasKnownStatus,
  isDraft,
  isPublished,
  listRulePackIds,
  listWorkflowIds,
  MockContractAdapter,
  prepareRollbackTarget,
  referencesRulePack,
  referencesWorkflow,
  withVersionInfo,
  type Contract,
  type ContractPort,
} from "../../../src/lib/enterprise/contract/index.ts";

function sampleContract(overrides: Partial<Contract> & { name?: string } = {}): Omit<
  Contract,
  "contractId" | "status" | "version"
> & {
  contractId?: string;
  status?: Contract["status"];
  version?: string;
  name: string;
} {
  return {
    name: "generic-organizational-contract",
    description: "Canonical generic contract container",
    version: "1.0.0",
    status: "draft",
    effectiveDate: "2026-01-01",
    expirationDate: "2027-01-01",
    metadataReference: defineMetadataReference({
      id: "meta-1",
      kind: "schema",
      namespace: "enterprise.core",
    }),
    rulePackReferences: [
      defineRulePackReference({ packId: "pack-opaque-1", version: "1.0.0" }),
      defineRulePackReference({ packId: "pack-opaque-2", name: "foundation" }),
    ],
    workflowReferences: [defineWorkflowReference({ workflowId: "wf-opaque-1", version: "1" })],
    configurationReference: defineConfigurationReference({
      id: "cfg-1",
      key: "enterprise.contract.flags",
      namespace: "enterprise.core",
    }),
    attachmentReferences: [
      defineAttachment({
        id: "att-1",
        name: "master.pdf",
        mimeType: "application/pdf",
        documentIdentityReference: { documentId: "doc-opaque-1", kind: "document" },
      }),
    ],
    tags: ["foundation", "generic"],
    capabilities: ["versioning", "references"],
    customAttributes: {
      channel: "api",
      clauses: [defineClause({ id: "c-1", title: "Generic clause", sequence: 1 })],
      sections: [defineSection({ id: "s-1", title: "Generic section", clauseIds: ["c-1"] })],
      externalRefs: [defineReference({ id: "ext-1", kind: "external", target: "system-a" })],
    },
    ...overrides,
    name: overrides.name ?? "generic-organizational-contract",
  };
}

describe("EPC-11 ContractPort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: ContractPort = new MockContractAdapter({ provider: "mock" });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");

    const caps = port.capabilities();
    assert.equal(caps.adapterId, "mock-in-memory");
    assert.equal(caps.supportsCreateContract, true);
    assert.equal(caps.supportsGetContract, true);
    assert.equal(caps.supportsListContracts, true);
    assert.equal(caps.supportsVersioning, true);
    assert.equal(caps.supportsAttachments, true);
    assert.equal(caps.supportsRulePackReferences, true);
    assert.equal(caps.supportsWorkflowReferences, true);
    assert.equal(caps.supportsConfigurationReference, true);
    assert.equal(caps.supportsMetadataReference, true);
    assert.equal(caps.supportsDocumentIdentityReferences, true);
  });

  it("test adapter é resolvido pelo provider", async () => {
    const port = createContractPort({ provider: "test" });
    assert.equal(port.providerId, "test");
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("Default adapter usa store in-process e declara capacidades", async () => {
    const store = new DefaultContractStore();
    const port: ContractPort = new DefaultContractAdapter({ store });

    assert.equal(port.providerId, "default");
    const caps = port.capabilities();
    assert.equal(caps.adapterId, DEFAULT_CONTRACT_ADAPTER_ID);
    assert.equal(caps.supportsCreateContract, true);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "default");
    assert.match(health.message ?? "", /ready|pronto/i);
  });

  it("Default adapter usa ping opcional sem alterar contrato", async () => {
    const port = new DefaultContractAdapter({
      store: new DefaultContractStore(),
      ping: async () => ({ ok: true, message: "contract probe custom" }),
    });
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.message, "contract probe custom");
    assert.equal(typeof health.latencyMs, "number");
  });

  it("provider default resolve DefaultContractAdapter; futuros falham explicitamente", () => {
    const defaultPort = createContractPort();
    assert.equal(defaultPort.providerId, "default");

    assert.throws(() => createContractPort({ provider: "database" }), /ainda não implementado/i);
    assert.throws(() => createContractPort({ provider: "remote" }), /ainda não implementado/i);
    assert.throws(() => createContractPort({ provider: "registry" }), /ainda não implementado/i);
  });

  it("Factory materializa adapters corretos", () => {
    const factory = createContractFactory();
    assert.equal(factory.create().providerId, "default");
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
  });

  it("PoC Application depende só do Port (inversão de dependência)", async () => {
    const port = createContractPort({ provider: "mock" });
    const summary = await getContractHealthSummary(port);

    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.provider, "mock");
    assert.equal(summary.capabilities.provider, "mock");
    assert.equal(summary.health.ok, true);
  });

  it("createContract/getContract/listContracts funcionam no Mock", async () => {
    const port = new MockContractAdapter({
      createId: () => "contract-fixed-1",
    });

    const created = await port.createContract({ contract: sampleContract() });
    assert.equal(created.ok, true);
    assert.equal(created.contractId, "contract-fixed-1");
    assert.equal(created.contract?.name, "generic-organizational-contract");
    assert.equal(created.contract?.status, "draft");
    assert.equal(created.contract?.version, "1.0.0");
    assert.equal(created.contract?.rulePackReferences?.length, 2);
    assert.equal(created.contract?.attachmentReferences?.length, 1);

    const got = await port.getContract({ contractId: "contract-fixed-1" });
    assert.equal(got.ok, true);
    assert.equal(got.contract?.contractId, "contract-fixed-1");
    assert.equal(got.contract?.workflowReferences?.length, 1);

    const listed = await port.listContracts({ tag: "foundation" });
    assert.equal(listed.ok, true);
    assert.equal(listed.contracts.length, 1);

    const byPack = await port.listContracts({ rulePackId: "pack-opaque-1" });
    assert.equal(byPack.contracts.length, 1);

    const byWorkflow = await port.listContracts({ workflowId: "wf-opaque-1" });
    assert.equal(byWorkflow.contracts.length, 1);

    const missing = await port.getContract({ contractId: "missing" });
    assert.equal(missing.ok, false);
    assert.equal(missing.code, "not_found");
  });

  it("Default adapter create/get/list sem validação contratual", async () => {
    const port = new DefaultContractAdapter({
      store: new DefaultContractStore(),
      createId: () => "contract-default-1",
    });

    const created = await port.createContract({
      contract: sampleContract({ name: "org-alpha" }),
    });
    assert.equal(created.ok, true);
    assert.equal(created.code, "created");

    const listed = await port.listContracts({ namePrefix: "org-" });
    assert.equal(listed.ok, true);
    assert.equal(listed.contracts.length, 1);
  });

  it("modelo canônico contém apenas campos permitidos e auxiliares tipados", () => {
    const contract: Contract = {
      contractId: createContractId(),
      name: "canonical",
      description: "x",
      version: "1",
      status: "draft",
      effectiveDate: "2026-01-01",
      expirationDate: "2027-01-01",
      metadataReference: { id: "m1" },
      rulePackReferences: [{ packId: "p1" }],
      workflowReferences: [{ workflowId: "w1" }],
      configurationReference: { id: "c1" },
      attachmentReferences: [{ id: "a1", documentIdentityReference: { documentId: "d1" } }],
      tags: ["t"],
      customAttributes: { k: 1 },
      capabilities: ["cap"],
    };

    const keys = Object.keys(contract).sort();
    assert.deepEqual(keys, [
      "attachmentReferences",
      "capabilities",
      "configurationReference",
      "contractId",
      "customAttributes",
      "description",
      "effectiveDate",
      "expirationDate",
      "metadataReference",
      "name",
      "rulePackReferences",
      "status",
      "tags",
      "version",
      "workflowReferences",
    ]);

    const version = defineContractVersion({
      version: "1.0.0",
      previousVersion: "0.9.0",
      status: "published",
      rollbackTarget: "0.9.0",
    });
    assert.equal(version.version, "1.0.0");
    assert.equal(version.rollbackTarget, "0.9.0");

    const clause = defineClause({ id: "cl-1", title: "A" });
    const section = defineSection({ id: "sec-1", clauseIds: ["cl-1"] });
    const ref = defineReference({ id: "r-1", kind: "external" });
    assert.equal(clause.id, "cl-1");
    assert.equal(section.clauseIds?.[0], "cl-1");
    assert.equal(ref.kind, "external");
  });

  it("versionamento estrutural: Draft/Published/Deprecated/Archived/Rollback (sem operação)", () => {
    assert.deepEqual(
      [...CONTRACT_STATUSES],
      ["draft", "published", "deprecated", "archived", "rollback"],
    );

    let contract: Contract = {
      contractId: "c-ver",
      name: "ver",
      version: "1.0.0",
      status: "draft",
    };
    assert.equal(isDraft(contract), true);
    assert.equal(hasKnownStatus(contract), true);

    contract = withVersionInfo(contract, { status: "published", version: "1.0.0" });
    assert.equal(isPublished(contract), true);

    const info = getVersionInfo(contract);
    assert.equal(info.version, "1.0.0");
    assert.equal(info.status, "published");

    const rollback = prepareRollbackTarget("1.1.0", "1.0.0");
    assert.equal(rollback.status, "rollback");
    assert.equal(rollback.rollbackTarget, "1.0.0");
  });

  it("referências opacas e anexos sem resolução", async () => {
    const port = new MockContractAdapter({ createId: () => "c-refs" });
    const created = await port.createContract({ contract: sampleContract() });
    const contract = created.contract!;

    assert.equal(listRulePackIds(contract).length, 2);
    assert.equal(listWorkflowIds(contract).length, 1);
    assert.equal(getAttachmentCount(contract), 1);
    assert.equal(referencesRulePack(contract, "pack-opaque-1"), true);
    assert.equal(referencesWorkflow(contract, "wf-opaque-1"), true);
    assert.equal(
      contract.attachmentReferences?.[0]?.documentIdentityReference?.documentId,
      "doc-opaque-1",
    );
    assert.equal(contract.configurationReference?.id, "cfg-1");
    assert.equal(contract.metadataReference?.id, "meta-1");
  });

  it("nenhum conhecimento clínico / TISS / regra no módulo (smoke estrutural)", () => {
    const forbidden = [
      "tiss",
      "unimed",
      "hapvida",
      "bradesco",
      "paciente",
      "glosa",
      "guia",
      "cid",
      "procedimento",
    ];
    const sample = JSON.stringify(sampleContract()).toLowerCase();
    for (const token of forbidden) {
      assert.equal(sample.includes(token), false, `não deve conter ${token}`);
    }
  });
});
