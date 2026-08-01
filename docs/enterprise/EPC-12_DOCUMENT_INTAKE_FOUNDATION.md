# EPC-12 — Document Intake Foundation

**Sprint:** EPC-12 — Document Intake Foundation  
**Data:** 31/07/2026  
**Natureza:** Fundação arquitetural genérica — **sem alteração de comportamento do produto**  
**Padrão:** ECS-01 (Ports & Adapters)

---

## 1. Objetivo

Construir o **Enterprise Document Intake Foundation**: a infraestrutura canônica de entrada documental e a camada Ports & Adapters correspondente.

Nenhum comportamento do MedicFlow muda nesta sprint.

Esta sprint **não** implementa OCR, IA, captura, upload funcional, monitoramento de pasta, integração com scanner ou e-mail.  
O objetivo é apenas registrar a entrada de documentos e prepará-los estruturalmente para o pipeline Enterprise.

---

## 2. Princípio arquitetural (obrigatório)

```
Document Intake recebe documentos
  ↓
Registra origem / estado / referências opacas
  ↓
Encaminha estruturalmente ao pipeline Enterprise (futuro)
```

**Nunca:**

```
Intake → OCR → Parser → TISS → Regras clínicas
```

| O Intake NÃO | O Intake SIM |
|--------------|--------------|
| Interpreta documentos | Recebe / registra entradas |
| Extrai texto | Declara `SourceType` |
| Executa OCR | Mantém ciclo de vida estrutural |
| Valida contratos | Referencia Document Identity (opaco) |
| Conhece TISS | Referencia Storage / Metadata / Workflow / Configuration (opaco) |
| Implementa upload / watcher / scanner / e-mail | Expõe `health` / `capabilities` |

---

## 3. Escopo

### Inclui

- `DocumentIntakePort` (`createIntake`, `getIntake`, `listIntakes`, `health`, `capabilities`)
- `DefaultDocumentIntakeAdapter` (in-memory)
- `MockDocumentIntakeAdapter` (testes / homologação / offline)
- `DocumentIntakeStore` + `DefaultDocumentIntakeStore`
- `DocumentIntakeFactory` + `createDocumentIntakePort` (Provider)
- Modelo canônico `DocumentIntake`
- Enum `SourceType` (somente enumeração)
- Prep de ciclo de vida: RECEIVED → … → ARCHIVED
- Documentação de integração futura
- Testes isolados (`enterprise:document-intake:test`)

### Não inclui

- OCR / parser / IA
- Upload funcional / drag-and-drop / watcher
- Integração com scanner / TWAIN / WIA / e-mail
- Banco / migrations
- UI / APIs / Server Functions
- Ligação a fluxos de produto existentes
- Conhecimento clínico / TISS / operadoras / cooperativas

---

## 4. Arquitetura (ECS-01)

```
Application
    ↓
DocumentIntakePort
    ↓
DocumentIntakeAdapter (Default | Mock)
    ↓
DocumentIntakeStore
    ↓
DocumentIntakeFactory
    ↓
DocumentIntakeProvider (createDocumentIntakePort)
```

Detalhes: [`EPC-12_ARCHITECTURE.md`](./EPC-12_ARCHITECTURE.md)  
Modelo: [`EPC-12_DOCUMENT_INTAKE_MODEL.md`](./EPC-12_DOCUMENT_INTAKE_MODEL.md)  
Certificação: [`EPC-12_CERTIFICATION.md`](./EPC-12_CERTIFICATION.md)

---

## 5. Universalidade

O Document Intake representa **qualquer origem documental**, não apenas saúde.

Deverá servir futuramente para:

- upload de arquivos
- pastas monitoradas
- APIs / webservices
- e-mail
- scanners (TWAIN / WIA)
- sistema de arquivos
- payloads XML / JSON

O modelo **nunca** depende de TISS, OCR ou IA. Esses componentes serão ligados apenas por camadas futuras via referências opacas.

---

## 6. Inventário de código

| Área | Path |
|------|------|
| Ports | `src/lib/enterprise/document-intake/ports/` |
| Adapters | `src/lib/enterprise/document-intake/adapters/` |
| Store | `src/lib/enterprise/document-intake/store/` |
| Factory | `src/lib/enterprise/document-intake/factory/` |
| Provider | `src/lib/enterprise/document-intake/providers/` |
| Demo Application | `src/lib/enterprise/document-intake/demo/` |
| Testes | `scripts/enterprise/tests/document-intake-engine.test.ts` |
| Script npm | `enterprise:document-intake:test` |

---

## 7. Declaração

Document Intake é **apenas** a entrada documental.  
Ele nunca poderá conhecer OCR, TISS, contratos específicos, regras clínicas, IA, operadoras ou cooperativas.  
Seu papel é receber documentos, registrar origem, estado e referências estruturais, preparando-os para as próximas camadas da plataforma.
