# Supabase — produção MedFlow-IA V1

> Aplicar migrations e alterar o projeto de produção é **sempre manual**. O CI não executa `db push` nem SQL destrutivo.

## Pré-requisitos

- Projeto Supabase dedicado à produção (separado de dev/staging).
- Backup do projeto antes de qualquer migration nova.
- CLI opcional: `supabase link --project-ref <REF>`.

## Migration checklist

1. Revisar arquivos em `supabase/migrations/` em ordem cronológica.
2. Em staging: aplicar e validar RLS com usuário `anon` + JWT de teste.
3. Em produção: aplicar via SQL Editor ou `supabase db push` **com janela acordada**.
4. Confirmar que não há migration pendente:
   - Comparar lista local com histórico do projeto.
5. Registrar versão aplicada no checklist de deploy (`docs/deploy-checklist.md`).

Migrations principais V1:

| Arquivo                                                    | Domínio            |
| ---------------------------------------------------------- | ------------------ |
| `20250512000000_init_enterprise.sql`                       | Core, tenants, RLS |
| `20250513201000_tiss_operational_foundation.sql`           | TISS               |
| `20250514100000_operational_reconciliation_foundation.sql` | Conciliação        |
| `20250514120000_tenant_settings_branding_readiness.sql`    | Branding           |
| `20250515140000_pilot_execution_v1.sql`                    | Piloto / adoção    |

## RLS validation checklist

- [ ] Toda tabela `CREATE TABLE` tem `ENABLE ROW LEVEL SECURITY` na mesma migration.
- [ ] Policies usam `tenant_id` / `auth.uid()` — sem `USING (true)` para `anon`.
- [ ] Testar leitura com usuário de outro tenant (deve falhar).
- [ ] Testar papel sem permissão financeira em `financial_closings` / `operational_reconciliations`.
- [ ] Executar `npm run release-check` — alertas estáticos nas migrations.

## Storage bucket checklist

- [ ] Bucket de branding (se usado) com política restrita por tenant.
- [ ] MIME permitidos: imagens apenas (`upload-validation` no app).
- [ ] Tamanho máximo alinhado ao limite no código.
- [ ] Sem bucket público com dados clínicos ou PII.

## Auth callback checklist

- [ ] **Site URL** = `VITE_MEDFLOW_APP_URL`
- [ ] **Redirect URLs** incluem domínio de produção e localhost para dev
- [ ] Email templates revisados (opcional)
- [ ] Desabilitar providers não usados
- [ ] Confirmar que **service role** não está em variáveis `VITE_*`

## Pós-migration

1. Criar tenant + admin (`tenants`, `profiles`) — manual ou script interno aprovado.
2. Smoke tests em `/lancamento`.
3. Validar TISS e conciliação com usuário piloto.

## Recuperação

- Restore point-in-time no Supabase (plano Pro+).
- Exports JSON via `/lancamento` (backup readiness) para DR leve.
