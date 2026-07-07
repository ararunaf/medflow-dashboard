# MedicFlow Release v1.0.0 — Staging

**Sprint:** MEDICFLOW-RELEASE-STAGING-01  
**Tag:** `medicflow-staging-v1.0.0`  
**Data:** 07/07/2026  
**Ambiente:** `https://staging.medicflow.app.br`  
**Supabase Project Ref:** `vbfulflzekrnejwetcyr`  
**Repositório:** `ararunaf/medflow-dashboard`

---

## Escopo da release

Plataforma **Intelligent Capture**, **Processing Center** e **Analytics** certificados para staging oficial.

| Módulo | Rotas | Status certificação |
|--------|-------|---------------------|
| Intelligent Capture | `/captura`, `/captura/revisao/:sessionId` | ✅ Testes unitários |
| Processing Center | `/processamento` | ✅ 19/19 testes |
| Analytics | `/analytics` | ✅ 7/7 testes |
| OCR / Parser / Auditoria | API `/capture/*` | ✅ Suíte capture:test:all |
| Contract Intelligence | Pipeline capture | ✅ Certificado |
| Risk Engine (Glosa) | Pipeline capture | ✅ Certificado |
| Correction Assistant | Pipeline capture | ✅ Certificado |
| Learning Loop | Pipeline capture | ✅ Certificado |
| Review Workspace | `/captura/revisao/:sessionId` | ✅ Certificado |

---

## Artefatos versionados

- `src/lib/capture/**` — engine server-side (OCR, parser, auditoria, risco, correção, learning, analytics)
- `src/modules/capture/**` — UI React (Captura, Revisão, Processamento, Analytics)
- `src/routes/captura.tsx`, `processamento.tsx`, `analytics.tsx`
- `scripts/capture/tests/**` — 11 suítes, 199 testes
- `supabase/migrations/20260703120000_intelligent_capture_foundation.sql` — migration #30
- `package.json` — scripts `capture:*` e `capture:test:all`

---

## Pré-requisitos de infraestrutura

| Item | Status |
|------|--------|
| Worker Cloudflare `medflow-ia` | Ativo |
| Domínio `staging.medicflow.app.br` | Ativo |
| Supabase Auth | ✅ Reachable |
| Storage bucket `clinical-documents` | ⚠ Verificar pós-migration #30 |
| Migration #30 remota | ⚠ Pendente `SUPABASE_DB_PASSWORD` |

---

## Comandos de certificação executados

```bash
npm install
npm run build
npm run capture:test:all          # 198 pass, 0 fail, 1 skip
npm run capture:processing:test   # 19 pass
npm run capture:analytics:test    # 7 pass
npm run env-check:staging         # OK
npm run migration-validate        # 30 migrations local, remote reachable
```

---

## Veredito

**RELEASE STAGING v1.0.0 = GO** (código e testes)  
**Migration #30 remota = ação DevOps pendente** (não bloqueia deploy do Worker)
