# Rollback checklist — MedFlow-IA V1

Use quando deploy ou migration causar regressão crítica.

## Decisão

- [ ] Incidente confirmado (erro 5xx, auth quebrado, perda de dados)
- [ ] Severidade e owner definidos
- [ ] Comunicação aos usuários piloto (se aplicável)

## Aplicação (Workers)

1. **Reverter Worker** para deployment anterior no Cloudflare Dashboard (Deployments → Rollback).
2. **Não** alterar DNS durante rollback de app.
3. Confirmar variáveis de ambiente iguais à versão estável.

## Banco (Supabase)

- [ ] **Não** executar DROP/TRUNCATE automático
- [ ] Se migration problemática: avaliar migration reversa **manual** com DBA
- [ ] Restore PITR apenas com aprovação explícita (dados posteriores serão perdidos)

## Validação pós-rollback

- [ ] `/login` e `/` funcionam
- [ ] Smoke tests em `/lancamento`
- [ ] Export de backup se necessário (`docs/backup-readiness.md`)

## Pós-incidente

- [ ] Root cause documentado
- [ ] Fix forward planejado (nova release, não amend silencioso em prod)
- [ ] Atualizar `docs/deploy-checklist.md` se novo risco identificado
