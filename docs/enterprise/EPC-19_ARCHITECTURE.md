# EPC-19 — Canonical Healthcare Model Architecture

**Sprint:** EPC-19 — Canonical Healthcare Model Foundation  
**Data:** 31/07/2026  
**Documento pai:** [`EPC-19_CANONICAL_HEALTHCARE_MODEL.md`](./EPC-19_CANONICAL_HEALTHCARE_MODEL.md)

---

## 1. Camadas (ECS-01)

```
┌──────────────────────────────────────────────────────┐
│ Application (PoC: getHealthcareModelHealthSummary)   │
└──────────────────────────┬───────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│ HealthcareModelPort                                  │
│  createEntity | getEntity | listEntities             │
│  health | capabilities                               │
└──────────────────────────┬───────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│ Adapters                                             │
│  DefaultHealthcareModelAdapter                       │
│  MockHealthcareModelAdapter                          │
└──────────────────────────┬───────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│ HealthcareModelStore (in-process)                    │
│  entities + structural relationships                 │
└──────────────────────────┬───────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│ HealthcareModelFactory → createHealthcareModelPort   │
└──────────────────────────────────────────────────────┘
```

Application e Domain dependem **somente** do Port.  
Adapters / Store / Factory nunca vazam para Domain de produto.

---

## 2. Fronteiras

| Pode | Não pode |
|------|----------|
| Representar entidades canônicas universais | Conhecer TISS / TUSS / CID / ANS |
| Persistir em store in-process | Criar banco / migrations |
| Health / capabilities | Alterar UI / APIs |
| Relacionamentos estruturais | Executar motor de grafo |
| Preparar hooks futuros | Integrar OCR / IA / Workflow / Rules |
| Documentar integração futura | Implementar operadoras / cooperativas |

---

## 3. Fluxo canônico obrigatório

```
Documento
  ↓
ProcessingOutput          (EPC-13 / EPC-14 — futuro bind)
  ↓
Canonical Healthcare Model   ← EPC-19 (esta sprint)
  ↓
TISS Intelligence            (futuro — converte/enriquece SOBRE o modelo)
  ↓
Rule Engine                  (EPC-06 — futuro consumo)
  ↓
AI Auditor                   (EPC-18 — futuro consumo)
```

O núcleo Enterprise **nunca** lê XML TISS, PDF, OCR bruto ou schema de operadora diretamente para decidir regras ou auditar.

---

## 4. Integração futura (FASE 9 — documentação apenas)

### 4.1 OCR

- OCR produz texto / tokens opacos (EPC-15).
- Um mapeador futuro projeta esses artefatos em `HealthcareDocument`, `HealthcareAttachment`, `HealthcareEvidence`.
- OCR **não** conhece o modelo canônico internamente; o bind fica em camada de projeção.

### 4.2 Document Processing

- `ProcessingOutput` (EPC-13) permanece vendor-agnóstico.
- Futuro: projeção `ProcessingOutput → HealthcareEntity[]` (+ relationships).
- Document Processor **não** embute campos de guia de mercado.

### 4.3 Contract Foundation

- Contratos (EPC-11) referenciam entidades via refs opacas / `customAttributes`.
- Regras contratuais futuras avaliam fatos já materializados no modelo canônico.

### 4.4 Rule Engine

- Rule Engine (EPC-06) avaliará fatos tipados como `HealthcareEntity` / attributes.
- Nunca avaliará XML TISS bruto nem payloads de operadora.

### 4.5 AI Auditor

- AI Auditor (EPC-18) receberá outcomes determinísticos + refs a entidades canônicas.
- Explicações citarão `HealthcareEvidence` / `HealthcareAudit` estruturais — sem decidir.

### 4.6 TISS Intelligence

- Camada futura **acima** do modelo canônico.
- Responsável por mapear TISS ↔ Canonical Model.
- O Canonical Model permanece ignorante de TISS.

### 4.7 Workflow

- Workflow (EPC-05) orquestra estados usando ids / kinds canônicos.
- Transições não dependem de schema de mercado.

---

## 5. Desacoplamento

### Dependências permitidas

| De | Para | Forma |
|----|------|-------|
| Application | `healthcare-model` | Port / factory |
| Futuros mappers | `healthcare-model` | Tipos canônicos |

### Dependências proibidas (nesta fundação)

- `healthcare-model` → `ocr-provider`, `document-processor`, `rule`, `ai-auditor`, `workflow`, `contract`, `tiss`
- Qualquer import de SDK de operadora / ANS
- Qualquer acoplamento a UI / Server Functions / rotas / migrations

---

## 6. Extensibilidade

Novos adapters (database / remote) poderão ser adicionados via Factory sem alterar o Port.  
Novos kinds canônicos exigem sprint dedicada e atualização do catálogo — não inventar enums de mercado dentro deste módulo.
