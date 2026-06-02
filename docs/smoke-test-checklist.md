# Smoke test checklist — MedFlow-IA V1

## CI (estrutura)

```bash
npm run smoke-check
npm run smoke-check:prod
```

Valida env, presença do serviço e cenários esperados. Opcional: `--url=https://seu-dominio` para HTTP em `/site` e `/login`.

## App (autenticado) — fonte da verdade

Rota: **`/lancamento`** → painel **Smoke tests** → _Executar agora_.

| ID             | Cenário         | Critério                                  |
| -------------- | --------------- | ----------------------------------------- |
| login          | Sessão + tenant | Usuário autenticado, Supabase configurado |
| dashboard      | Perfil / home   | `profiles` legível                        |
| tiss           | TISS            | `tiss_batches` legível (se `tiss:read`)   |
| financial      | Fechamento      | `financial_closings` (se permissão)       |
| reconciliation | Conciliação     | `operational_reconciliations`             |
| onboarding     | Instituição     | `tenant_settings` acessível               |

Requer `tenant_settings:read`. Rate limit: 8 execuções/minuto.

## Manual complementar

- [ ] Login em `/login` com tenant correto
- [ ] Navegar `/tiss` — lista carrega
- [ ] Navegar `/financeiro/conciliacao-operacional` (se RBAC)
- [ ] `/piloto` — wizard sem erro 500

## Quando executar

- Após cada deploy em produção
- Após migration Supabase relevante
- Antes de go-live comercial (`docs/go-live-checklist.md`)
