# ARCH-J00 — Enterprise Master Architecture Discovery (Bloco J)

**Sprint:** ARCH-J00 — Enterprise Master Architecture Discovery  
**Data:** 2026-08-08  
**Branch:** `feat/inf-10-enterprise-scalability-runtime`  
**Repositório:** `https://github.com/ararunaf/medflow-dashboard.git`

---

## 1. Sumário executivo

A presente sprint realiza a descoberta arquitetural do **Bloco J — Enterprise Master Orchestration**, consolidando o inventário completo dos Blocos A a I, mapeando dependências e definindo as regras permanentes para o próximo estágio da plataforma Enterprise.

**Parecer:** a arquitetura está organizada em camadas unidirecionais, com consumo exclusivo via Ports e reutilização controlada. O Bloco J pode ser iniciado consumindo as fachadas canônicas dos Blocos H e I, sem alterar blocos congelados.

---

## 2. Blocos auditados

| Bloco | Nome                                  | Status              |
| ----- | ------------------------------------- | ------------------- |
| A     | Captura Inteligente                   | Congelado           |
| B     | Inteligência Documental               | Congelado           |
| C     | Integração Corporativa                | Congelado           |
| D     | Funcionalização Progressiva dos Runtimes | Congelado        |
| E     | Enterprise Business Engine            | Homologado          |
| F     | Enterprise Integration Engine         | Homologado          |
| G     | TISS Enterprise                       | Homologado          |
| H     | TISS Enterprise Integration           | Certificado/Congelado |
| I     | Enterprise Workflow                   | Certificado/Congelado |

---

## 3. Inventário consolidado

| Tipo | Quantidade | Observação |
| ---- | ---------- | ---------- |
| Engines | 50 | Arquivos `*-engine.ts` em `src/lib/enterprise` |
| Fachadas | 5 | `GenericBusinessEngine`, `GenericIntegrationEngine`, `GenericTissEngine`, `GenericTissIntegrationEngine`, `GenericWorkflowEngine` |
| Ports (definições) | 93 | Arquivos `*-port.ts` (excluindo `create-*-port.ts`) |
| Port providers/factories | 88 | Arquivos `create-*-port.ts` |
| Providers de runtime | 6 | Arquivos `*provider.ts` (saúde/fila/orquestração) |
| Adapters | 192 | Arquivos `*-adapter.ts` (Default, Enterprise, Mock) |
| Registries | 48 | Arquivos `*-registry.ts` |
| Capabilities declaradas | 296 | Nomes únicos `*Implemented` em `ports/capabilities.ts` |
| Capabilities `true` | 51 | Capabilities ativas na baseline atual |

---

## 4. Mapa de dependências

```
A (Captura Inteligente)
↓
B (Inteligência Documental)
↓
C (Integração Corporativa / Runtimes)
↓
D (Funcionalização XML)
↓
E (Business Engine)
↓
F (Integration Engine)
↓
G (TISS Enterprise)
↓
H (TISS Integration)
↓
I (Enterprise Workflow)
↓
J (Master Orchestration — a ser definido)
```

### 4.1 Dependências principais por fachada

| Fachada | Bloco | Consome |
| ------- | ----- | ------- |
| `GenericWorkflowEngine` | I | `EnterpriseWorkflowEngine` a `EnterpriseWorkflowRecoveryEngine` (I-01 a I-07) |
| `GenericTissIntegrationEngine` | H | `TISSCommunicationEngine` a `TISSAuditEngine` (H-01 a H-09) |
| `GenericTissEngine` | G | `TISSKnowledgeEngine` a `TISSCorrectionEngine` (G-01 a G-09) |
| `GenericIntegrationEngine` | F | `IntegrationRegistryEngine` a `IntegrationReportEngine` (F-01 a F-09) |
| `GenericBusinessEngine` | E | `BusinessRuleCatalog` a `BusinessReportEngine` (E-01 a E-09) |

### 4.2 Regras de dependência

- Consumo obrigatório via Ports/Contracts.
- Nenhum bloco pode importar diretamente stores, adapters ou registries de bloco inferior.
- Fachadas de bloco inferior são a única interface recomendada para bloco superior.

---

## 5. Componentes congelados

- Blocos A, B, C (foundation estrutural).
- Bloco D (engines de validação XML e fachada `XMLGenericValidator`).
- Bloco H (engines de integração TISS e fachada `GenericTissIntegrationEngine`).
- Bloco I (engines de workflow e fachada `GenericWorkflowEngine`).

---

## 6. Componentes reutilizáveis

- `GenericTissIntegrationEngine` (Bloco H) — camada imediatamente inferior ao Bloco I/J.
- `GenericWorkflowEngine` (Bloco I) — orquestra I-01 a I-07.
- Ports de XML Validation, XML Serializer, XSD, TISS, Workflow.
- Adapters Default/Mock/Enterprise em todos os blocos.
- Registries de AI Provider, TISS Catalog, TISS Provider, TISS Engine.

---

## 7. Componentes canônicos

- Padrão ECS-01: `Port → Provider → Factory → Registry → Adapter → Store`.
- Contratos canônicos sem conhecimento de operadora/SOAP/XML específico nos Blocos A-F.
- Capabilities declarativas por Sprint (`*Implemented`).
- Fachadas `Generic*Engine` compondo sub-engines especializadas.

---

## 8. Proposta de arquitetura do Bloco J

### 8.1 Nome

**Bloco J — Enterprise Master Orchestration Engine** (também referido como *Enterprise Command & Orchestration Layer*).

### 8.2 Objetivo

Orquestrar, coordenar e monitorar as fachadas canônicas dos Blocos E, F, G, H e I, oferecendo uma camada unificada de comando para processos enterprise de alto nível (ex: recepção, validação, execução, envio TISS, acompanhamento, recuperação, relatórios).

### 8.3 Responsabilidades preliminares

| Componente | Responsabilidade |
| ---------- | ---------------- |
| `EnterpriseCommandEngine` (J-01) | Receber e rotear comandos enterprise canônicos |
| `EnterpriseOrchestrationEngine` (J-02) | Orquestrar execuções entre fachadas E, F, G, H, I |
| `EnterpriseSagaEngine` (J-03) | Gerenciar sagas e compensações |
| `EnterprisePolicyEngine` (J-04) | Aplicar políticas transversais de negócio |
| `EnterpriseGovernanceEngine` (J-05) | Auditar e controlar acessos e decisões |
| `EnterpriseConsoleEngine` (J-06) | Expor interface canônica de operação |
| `GenericEnterpriseOrchestrationEngine` (J-10) | Fachada unificada do Bloco J |

### 8.4 Camada imediatamente inferior

O Bloco J consome exclusivamente as **fachadas canônicas** dos Blocos E, F, G, H e I:

- `GenericBusinessEngine` (E)
- `GenericIntegrationEngine` (F)
- `GenericTissEngine` (G)
- `GenericTissIntegrationEngine` (H)
- `GenericWorkflowEngine` (I)

### 8.5 Restrições arquiteturais

- Não alterar Blocos A a I.
- Não importar adapters, stores ou registries diretamente.
- Consumir via Ports e fachadas.
- Reutilizar engines existentes.
- Uma capability por Sprint.

---

## 9. Recomendação formal para J-01

A arquitetura homologada dos Blocos A a I, juntamente com as fachadas canônicas certificadas, sustenta o início da Sprint **J-01 — EnterpriseCommandEngine**.

A J-01 deve:

1. Criar o Port `EnterpriseCommandPort`.
2. Criar o adapter Default/Mock e Provider.
3. Implementar estruturalmente o `EnterpriseCommandEngine` (sem regras de negócio real).
4. Ativar `enterpriseCommandImplemented = true`.
5. Não alterar Blocos A-I.

---

## 10. Validação executada

- `npm run build` — PASS
- `npx tsc --noEmit` — PASS
- `npm run lint` — PASS
- `npm run smoke-check` — PASS
- Suítes Enterprise — 2414 testes, 2412 pass, 2 falhas pré-existentes
