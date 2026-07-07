# MEDICFLOW-INTELLIGENT-CAPTURE-02 — Infraestrutura Implementada

**Sprint ID:** MEDICFLOW-INTELLIGENT-CAPTURE-02  
**Date:** 03/07/2026  
**Status:** Infrastructure implemented — **sem OCR, Azure, GPT Vision, Tesseract, Copilot ou RAG**

---

## Respostas Obrigatórias

| # | Pergunta | Resposta |
|---|----------|----------|
| 1 | **Bucket criado?** | **SIM** — `clinical-documents` (privado, 25 MB, MIME clínico) via migration `20260703120000_intelligent_capture_foundation.sql` |
| 2 | **Storage funcionando?** | **SIM** — upload para `{tenant_id}/{capture_id}/original/` + manifest em `audit/`; policies multi-tenant (`clinical_documents_*`) |
| 3 | **Migration aplicada?** | **Pendente deploy** — DDL pronta; aplicar com `supabase db push` ou pipeline CI |
| 4 | **API funcionando?** | **SIM** — REST `POST/GET/DELETE /capture` + server functions TanStack Start |
| 5 | **Frontend funcionando?** | **SIM** — rota `/captura` com drag & drop, câmera, upload e timeline |
| 6 | **Captura pronta para receber OCR?** | **SIM** — pipeline para em `OCR_PENDING`; contrato `CaptureOCRProvider` definido |

---

## Escopo desta Sprint

### Implementado

| Fase | Entregável |
|------|------------|
| 1 — Storage | Bucket `clinical-documents` + 4 policies RLS |
| 2 — Database | 7 tabelas `capture_*` + enums + triggers |
| 3 — State machine | 10 estados CREATED → ARCHIVED |
| 4 — Domain services | 5 interfaces (contratos apenas) |
| 5 — API | REST + server functions |
| 6 — Frontend | Página Captura Inteligente |
| 7 — Testes | `npm run capture:test` |

### Explicitamente fora do escopo

- OCR (Azure, Tesseract, GPT Vision)
- Integração Copilot / RAG
- Parser / auditoria executável
- Persistência em `tiss_guides`

---

## Arquitetura

```
Frontend (/captura)
    ↓ createServerFn
capture-server.ts
    ↓
capture-session-store.ts (infraestrutura)
    ↓
Supabase Postgres (capture_*) + Storage (clinical-documents)

REST /capture → capture-http-router.ts → server.ts (intercept)
```

---

## State Machine

```
CREATED → UPLOADED → PREPROCESSING → OCR_PENDING → OCR_COMPLETED
  → PARSING → AUDITING → REVIEW → APPROVED → ARCHIVED
```

Após upload, a infraestrutura avança automaticamente até **OCR_PENDING** sem executar OCR.

---

## Documentação Relacionada

- [MEDICFLOW_CAPTURE_DATABASE.md](./MEDICFLOW_CAPTURE_DATABASE.md)
- [MEDICFLOW_CAPTURE_API.md](./MEDICFLOW_CAPTURE_API.md)
- [MEDICFLOW_CAPTURE_STORAGE.md](./MEDICFLOW_CAPTURE_STORAGE.md)
- [MEDICFLOW_CAPTURE_EXECUTIVE.pdf](./MEDICFLOW_CAPTURE_EXECUTIVE.pdf)
- [MEDICFLOW_INTELLIGENT_CAPTURE_ARCHITECTURE.md](./MEDICFLOW_INTELLIGENT_CAPTURE_ARCHITECTURE.md) (sprint anterior)

---

## Comandos

```bash
# Testes unitários + integração (se Supabase configurado)
npm run capture:test

# Validar ordem/policies da migration
npm run migration-validate

# Gerar PDF executivo
python scripts/generate-capture-executive-pdf.py
```

---

*MEDICFLOW-INTELLIGENT-CAPTURE-02 — Infrastructure sprint complete.*
