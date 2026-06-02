# Backup readiness — MedFlow-IA V1

## Supabase (plataforma)

- Habilitar backups automáticos no plano do projeto.
- Documentar RPO/RTO com o cliente.
- Restore point-in-time: apenas com aprovação formal.

## Export no app (`/lancamento`)

Requer `tenant_settings:write`. Tipos:

| Tipo        | Conteúdo                                          |
| ----------- | ------------------------------------------------- |
| tenant      | `tenants` + `tenant_settings`                     |
| financial   | Fechamentos + conciliações (últimas competências) |
| audit       | `operational_reconciliation_audit`                |
| operational | Bundle operacional (erros, logs, métricas)        |

Arquivo JSON baixado no browser — armazenar em local seguro (criptografia em repouso).

## Tenant backup guide

1. Antes de go-live: export `tenant` + `financial`.
2. Frequência sugerida piloto: semanal.
3. Produção: conforme política do hospital (diário/semanal).

## Audit backup guide

- Export `audit` antes de fechamento de competência crítica.
- Retenção alinhada a compliance interno (não substitui log imutável externo).

## Production recovery notes

1. **App indisponível:** rollback Worker (`docs/rollback-checklist.md`).
2. **Dados corrompidos:** PITR Supabase ou reimport JSON (processo manual).
3. **Tenant errado:** revisar RLS e `tenant_id` em profiles — não “mover” dados via anon key.

## O que não fazer

- Commitar exports JSON no Git
- Compartilhar exports por canal não criptografado
- Usar service role no frontend
