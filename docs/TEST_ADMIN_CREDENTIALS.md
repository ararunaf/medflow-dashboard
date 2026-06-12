# TEST-ADMIN — Credenciais do Administrador de Teste (Staging)

**Ambiente:** Staging (`https://staging.medicflow.app.br`)  
**Projeto Supabase:** `utodixhxrvegzafcldpu`  
**Criado em:** 2026-06-11  
**Status:** Ativo

---

## Identificação

| Campo | Valor |
|-------|-------|
| **Nome** | MedicFlow Test Admin |
| **E-mail** | admin.teste@medicflow.app.br |
| **User ID** | `c9164647-eca4-4482-bfdd-2ec91275db64` |
| **Tenant** | MedicFlow-AI V1 Demo (`medflow-v1-demo`) |
| **Tenant ID** | `9cc7f6f1-4c34-4316-9e06-778f0cbc249e` |
| **Perfil RBAC** | `tenant_admin` |
| **Senha inicial** | Definida com sucesso (não documentada neste arquivo) |

---

## Uso

1. Acesse `https://staging.medicflow.app.br/login`
2. Selecione a instituição **MedicFlow-AI V1 Demo** (`medflow-v1-demo`)
3. Informe o e-mail `admin.teste@medicflow.app.br` e a senha inicial fornecida pela equipe TI
4. Recomenda-se trocar a senha após o primeiro acesso via **Perfil** ou fluxo **Esqueci minha senha**

> **Nota:** O sistema não possui flag nativa de “obrigar troca de senha no primeiro acesso”. A troca é recomendada como prática operacional.

---

## Escopo de permissões (`tenant_admin`)

Papel com o maior nível administrativo disponível **dentro do tenant** (equivalente funcional a `super_admin` na matriz RBAC).

| Capability | Descrição resumida |
|------------|-------------------|
| `schedules:read` | Leitura de escalas |
| `schedules:create` | Criação de escalas |
| `schedules:update` | Edição de escalas |
| `schedules:archive` | Arquivamento de escalas |
| `shifts:read` | Leitura de plantões |
| `shifts:create` | Criação de plantões |
| `shifts:update` | Edição de plantões |
| `shifts:cancel` | Cancelamento de plantões |
| `assignments:read` | Leitura de alocações |
| `assignments:assign:any` | Alocar qualquer profissional |
| `assignments:assign:self` | Auto-alocação |
| `assignments:confirm:any` | Confirmar alocações (gestão) |
| `assignments:confirm:self` | Confirmar próprias alocações |
| `assignments:reject:any` | Rejeitar alocações (gestão) |
| `assignments:reject:self` | Rejeitar próprias alocações |
| `swaps:read` | Leitura de trocas |
| `swaps:request:self` | Solicitar troca |
| `swaps:cancel:self` | Cancelar troca própria |
| `swaps:approve` | Aprovar trocas |
| `swaps:deny` | Negar trocas |
| `availability:read` | Leitura de disponibilidade |
| `availability:update:any` | Editar disponibilidade (gestão) |
| `availability:update:self` | Editar própria disponibilidade |
| `tiss:read` | Leitura TISS |
| `tiss:write` | Escrita TISS |
| `tuss:catalog:write` | Catálogo TUSS |
| `payouts:read` | Leitura de repasses |
| `payouts:write` | Escrita de repasses |
| `financial_closing:read` | Leitura fechamento financeiro |
| `financial_closing:write` | Escrita fechamento financeiro |
| `financial_closing:reopen` | Reabertura de competência (admin) |
| `tenant_settings:read` | Leitura parametrização institucional |
| `tenant_settings:write` | Escrita parametrização institucional |
| `demo_seed:apply` | Aplicar seed demo TISS |

**Rotas de menu habilitadas:** Home, Piloto, Go-live, Ajuda, Executivo, Central de IA, Escalas, Plantões, Financeiro, Dashboard fin., Fechamento, TISS, Instituição, Painel ops, Perfil.

---

## Validação (2026-06-11)

| Teste | Resultado |
|-------|-----------|
| Login | ✅ |
| Logout | ✅ |
| Recuperação de senha (API) | ✅ |
| Vínculo tenant `medflow-v1-demo` | ✅ |
| RBAC financeiro / IA / admin | ✅ |
| Rotas staging HTTP | ✅ (redirect 307 para auth) |
| RLS dados operacionais | ✅ |

---

## Segurança

- Usuário criado **somente** no projeto Supabase staging (`utodixhxrvegzafcldpu`)
- **Não** provisionado em produção (`.env.production` com placeholders)
- Credenciais **não** hardcoded no código-fonte do repositório
- Senha inicial entregue apenas via canal seguro da equipe TI

---

## Referências

- Matriz RBAC: `src/lib/auth/rbac.ts`
- Tenant demo homologação: `scripts/multi-tenant-auth-validate.mjs` (`DEMO_TENANT_SLUG = medflow-v1-demo`)
- Runbook usuários: `docs/RUNBOOK_IMPLANTACAO_PILOTO.md`
