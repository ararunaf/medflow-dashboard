# EPC-08 — Document Identity Architecture

**Sprint:** EPC-08 — Document Identity Foundation  
**Data:** 31/07/2026  
**Natureza:** Arquitetura de fundação — **sem implementação** de OCR, Storage real, Workflow, IA ou domínio  
**Documento pai:** [`EPC-08_DOCUMENT_IDENTITY.md`](./EPC-08_DOCUMENT_IDENTITY.md)  
**Padrão:** ECS-01

---

## 1. Fluxo oficial (ECS-01)

```
Application
    ↓
DocumentIdentityPort
    ↓
DocumentIdentityAdapter   (Default | Mock | futuros)
    ↓
DocumentIdentityStore     (in-process nesta sprint)
    ↓
DocumentIdentityFactory
    ↓
DocumentIdentityProvider  (createDocumentIdentityPort)
```

### Árvore do componente

```
src/lib/enterprise/document-identity/
├── index.ts
├── ports/
│   ├── document-identity-port.ts
│   ├── types.ts
│   ├── identity.ts
│   ├── pages.ts
│   └── index.ts
├── adapters/
│   ├── default-document-identity-adapter.ts
│   ├── mock-document-identity-adapter.ts
│   └── index.ts
├── store/
│   ├── document-identity-store.ts
│   ├── default-document-identity-store.ts
│   └── index.ts
├── factory/
│   ├── document-identity-factory.ts
│   └── index.ts
├── providers/
│   ├── create-document-identity-port.ts
│   └── index.ts
└── demo/
    ├── document-identity-health-query.ts
    └── index.ts
```

---

## 2. Decisões arquiteturais

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Família de adapter | Default + Store + Mock | Estado in-process; sem vendor nesta sprint |
| Persistência | Memória de processo | Sem banco / migrations |
| `documentType` | string livre | Evita enum clínico/TISS/contratual no Core |
| Referências | Opacas (`metadataReference`, `storageReference`) | Prep sem acoplamento a Engines |
| Identidade FASE 7 | Agregado `identity` | Prepara UUID/Hash/… sem poluir domínio |
| Factory + Provider | Ambos | Factory instancia; Provider é API Application |
| Providers futuros | Erro explícito | Sem fallback silencioso (ECS-01) |

---

## 3. Integração futura (FASE 8) — somente documentação

Nenhum dos módulos abaixo foi implementado ou acoplado nesta sprint.

### 3.1 OCR

- OCR futuro **consome** `DocumentId` / páginas / `imageReference`.
- Resultados OCR (texto, boxes, confiança) **não** entram no modelo Document Identity.
- OCR escreve artefatos em Metadata / Storage e referencia o documento canônico.

### 3.2 Storage

- `storageReference` aponta para objetos geridos pelo Storage Port (EPC-02).
- Document Identity **nunca** faz upload/download.
- Checksums no documento/página alinham-se a integridade do objeto armazenado.

### 3.3 Workflow

- Workflow (EPC-05) referencia `DocumentId` / `correlationId` como payload opaco.
- Estados de processo ficam no Workflow Engine, não no documento canônico.
- `status` do documento é estrutural; não substitui state machine de processo.

### 3.4 Rule Engine

- Rules (EPC-06A/06B) avaliam contexto que **pode** incluir `DocumentId` e atributos opacos.
- Nenhuma regra clínica/TISS vive dentro de Document Identity.

### 3.5 AI Providers

- AI Providers (EPC-07) recebem prompts/contextos que podem citar `DocumentId`.
- Document Identity não invoca IA e não armazena respostas de modelo.

### 3.6 Contract Intelligence

- Especialização de produto usará `documentType` / `customAttributes` / Metadata.
- Cláusulas, vigências e partes **não** fazem parte do Core Document Identity.

### 3.7 Capture

- Capture cria/atualiza identidades via Port após ingestão.
- Pipeline de captura permanece fora deste componente.

```
Capture / OCR / AI / Workflow / Rules / Contract Intelligence
        │ (referenciam DocumentId)
        ▼
DocumentIdentityPort  ←──── único ponto de identidade canônica
        │
        ▼
Adapters / Store (infra)
```

---

## 4. Especializações futuras (FASE 9) — apenas exemplos

Especializações vivem **fora** de `src/lib/enterprise/document-identity/`.  
Exemplos ilustrativos (não implementados):

| Especialização | Como usaria Document Identity |
|----------------|-------------------------------|
| **TISS** | `documentType: "tiss-guide"` + schema Metadata + regras/produto |
| **Prontuário** | `documentType: "medical-record"` + atributos em Metadata |
| **Contrato** | `documentType: "contract"` + Contract Intelligence |
| **Nota Fiscal** | `documentType: "invoice"` + customAttributes fiscais no produto |
| **Receita** | `documentType: "prescription"` + domínio clínico no produto |
| **Laudo** | `documentType: "report"` + domínio clínico no produto |
| **Exame** | `documentType: "exam"` + domínio clínico no produto |

O Core permanece agnóstico: qualquer string em `documentType` é válida.

---

## 5. Fronteiras de isolamento

| Camada | Pode importar Document Identity? |
|--------|----------------------------------|
| Application PoC (`demo/`) | ✅ via Port |
| Outros Engines Enterprise | ✅ via Port (futuro) |
| UI / rotas / Server Functions | ❌ nesta sprint |
| Capture / OCR / TISS / Financeiro | ❌ nesta sprint |
| Domain clínico MedicFlow | ❌ no Core — especializações futuras no produto |

---

## 6. Compatibilidade

- Nenhuma API HTTP alterada
- Nenhuma tela alterada
- Nenhuma migration criada
- Nenhum comportamento de usuário alterado
- Componente isolado sob `src/lib/enterprise/document-identity/`
