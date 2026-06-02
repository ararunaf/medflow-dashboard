# Go-live checklist — MedFlow-IA V1

Após o primeiro deploy em produção e antes de abrir para usuários reais.

## Produto e tenant

- [ ] Nome institucional em `/instituicao`
- [ ] Fuso operacional configurado
- [ ] Canal de contato (e-mail / telefone)
- [ ] Branding (logo) se aplicável
- [ ] Wizard `/piloto` ≥ 80%

## Validação técnica

- [ ] Score de produção ≥ 80% em `/lancamento`
- [ ] Itens críticos de `production-validation` OK
- [ ] Smoke tests: login, dashboard, **TISS**, conciliação, onboarding
- [ ] Health operacional (banco + latência) verde

## Segurança

- [ ] RLS validado (ver `docs/supabase-production.md`)
- [ ] Sem `VITE_MEDFLOW_DEBUG=1`
- [ ] Redirects Supabase alinhados ao domínio
- [ ] Revisão de papéis RBAC (admin vs operador)

## Comercial / operação

- [ ] Landing `/site` com contato correto
- [ ] Equipe de suporte informada
- [ ] Janela de hypercare definida (primeiras 48–72h)

## Comunicação

- [ ] Usuários piloto com credenciais
- [ ] Documentação interna de escalação de incidentes

## Não fazer automaticamente

- Alterar DNS sem change control
- Aplicar migrations destrutivas em horário de pico
- Deploy em cadeia sem smoke tests
