# Regra Permanente do BLOCO J — Enterprise Master Orchestration

**Status:** Descoberta arquitetural concluída (ARCH-J00)  
**Escopo:** Todas as Sprints do BLOCO J — Enterprise Master Orchestration  
**Documento irmão:** [`ARCH_J00_ENTERPRISE_MASTER_ARCHITECTURE_DISCOVERY.md`](./ARCH_J00_ENTERPRISE_MASTER_ARCHITECTURE_DISCOVERY.md)  
**Data:** 2026-08-08  
**Branch:** `feat/inf-10-enterprise-scalability-runtime`

---

## 1. Regra

O Bloco J é a **camada de orquestração master** da plataforma Enterprise. Ele:

- Consome **exclusivamente** as fachadas canônicas dos Blocos E, F, G, H e I;
- Não conhece implementações internas, stores, adapters, registries ou regras específicas dos blocos inferiores;
- Não altera, congela ou duplica lógica dos Blocos A a I;
- Coordena comandos, sagas, políticas e governance de alto nível;
- Expõe a fachada `GenericEnterpriseOrchestrationEngine`.

---

## 2. Consequências arquiteturais

| Princípio | Aplicação |
|-----------|-----------|
| Fachadas inferiores | Bloco J só pode importar `GenericBusinessEngine`, `GenericIntegrationEngine`, `GenericTissEngine`, `GenericTissIntegrationEngine` e `GenericWorkflowEngine` |
| Consumo via Ports | Comunicação obrigatória através de Ports/Contracts; nenhum acesso direto a adapters/stores |
| Sem duplicação | Bloco J não recria lógica de negócio, captura, IA, validação XML, TISS, integração ou workflow |
| Uma capability por Sprint | Cada sprint J-01 a J-10 ativa exatamente uma capability |
| Audit trail | Toda orquestração deve ser rastreável, determinística e auditável |

---

## 3. Componentes congelados protegidos

- `GenericBusinessEngine` (Bloco E)
- `GenericIntegrationEngine` (Bloco F)
- `GenericTissEngine` (Bloco G)
- `GenericTissIntegrationEngine` (Bloco H)
- `GenericWorkflowEngine` (Bloco I)

---

## 4. Restrições arquiteturais

1. Não importar arquivos de `src/lib/enterprise` fora das fachadas homologadas.
2. Não criar dependências cíclicas com Blocos A a I.
3. Não implementar IA real, conexão com operadoras, processamento TISS, validação XML ou captura de documentos.
4. Manter padrão ECS-01 para toda estrutura do Bloco J.
5. Todo engine do Bloco J deve possuir Port, Provider, Factory, Registry, Adapter e Store.

---

## 5. Roadmap preliminar

| Sprint | Nome | Status |
| ------ | ---- | ------ |
| ARCH-J00 | Enterprise Master Architecture Discovery | ✅ Certificada |
| J-01 | Enterprise Command Engine | ✅ Certificada / Congelada |
| J-02 | Enterprise Orchestration Engine | ✅ Certificada / Congelada |
| J-03 | Enterprise Saga Engine | ⛔ Não autorizada |
| J-04 | Enterprise Policy Engine | ⛔ Não autorizada |
| J-05 | Enterprise Governance Engine | ⛔ Não autorizada |
| J-06 | Enterprise Console Engine | ⛔ Não autorizada |
| J-07 | Enterprise Master Routing Engine | ⛔ Não autorizada |
| J-08 | Enterprise Master Monitoring Engine | ⛔ Não autorizada |
| J-09 | Enterprise Master Recovery Engine | ⛔ Não autorizada |
| J-10 | Generic Enterprise Orchestration Engine (fachada) | ⛔ Não autorizada |

---

## 6. Capabilities preliminares

```text
enterpriseCommandImplemented: true
enterpriseOrchestrationImplemented: true
enterpriseSagaImplemented: false
enterprisePolicyImplemented: false
enterpriseGovernanceImplemented: false
enterpriseConsoleImplemented: false
enterpriseMasterRoutingImplemented: false
enterpriseMasterMonitoringImplemented: false
enterpriseMasterRecoveryImplemented: false
enterpriseMasterOrchestrationImplemented: false
```

---

## 7. Componentes certificados

- `src/lib/enterprise/master-orchestration/ports/capabilities.ts`
- `src/lib/enterprise/master-orchestration/command/enterprise-command-engine.ts`
- `src/lib/enterprise/master-orchestration/command/index.ts`
- `src/lib/enterprise/master-orchestration/orchestration/enterprise-orchestration-engine.ts`
- `src/lib/enterprise/master-orchestration/orchestration/index.ts`
- `scripts/enterprise/tests/enterprise-command-engine.test.ts`
- `scripts/enterprise/tests/enterprise-orchestration-engine.test.ts`

## 8. Recomendação

A arquitetura do Bloco J está apta a ser iniciada. A Sprint J-01 pode ser autorizada quando houver requisito funcional aprovado, desde que respeite as regras permanentes deste documento.
