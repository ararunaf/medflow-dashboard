# MedFlow-IA — Setup local

Guia para rodar o projeto em **desenvolvimento** na sua máquina (Windows, macOS ou Linux).

## Pré-requisitos

| Ferramenta | Versão mínima |
| ---------- | ------------- |
| Node.js    | 20 LTS        |
| npm        | 10+           |

Opcional para banco/auth:

- Conta [Supabase](https://supabase.com/dashboard) (cloud) **ou** [Supabase CLI](https://supabase.com/docs/guides/cli) para stack local.

## 1. Instalar dependências

Na pasta do app (`MedFlow-IA/`):

```bash
npm install
```

## 2. Configurar variáveis de ambiente

| Arquivo            | Uso                         | Git        |
| ------------------ | --------------------------- | ---------- |
| `.env.local`       | Desenvolvimento (`npm run dev`) | Ignorado |
| `.env.staging`     | Staging (`npm run build:staging`) | Ignorado |
| `.env.production`  | Produção (`npm run build`)  | Ignorado   |
| `.env.example` etc.| Templates sem secrets       | Versionado |

Copie o template do ambiente:

```bash
cp .env.example .env.local
# staging / produção (quando for fazer deploy):
cp .env.staging.example .env.staging
cp .env.production.example .env.production
```

Edite `.env.local` com URL e anon key do Supabase (nunca commite valores reais).

| Variável                 | Obrigatória (dev) | Descrição                                           |
| ------------------------ | ----------------- | --------------------------------------------------- |
| `VITE_SUPABASE_URL`      | Sim               | URL do projeto Supabase                             |
| `VITE_SUPABASE_ANON_KEY` | Sim               | Chave anon (pública, protegida por RLS)             |
| `VITE_MEDFLOW_APP_URL`   | Não (sim em staging) | Dev: `http://localhost:8080`; staging: `https://staging.medicflow.app.br` |
| `VITE_MEDFLOW_DEBUG`     | Não               | `1` = logs extras (não usar em staging/prod)        |
| `MEDFLOW_OPENAI_API_KEY` | Não               | Copiloto GPT — só servidor, **sem** prefixo `VITE_` |

**Ordem de carregamento (Vite):**

- Dev: `.env` → `.env.local`
- Staging: `.env` → `.env.local` → `.env.staging`
- Produção: `.env` → `.env.local` → `.env.production`

Scripts: `npm run env-check`, `env-check:staging`, `env-check:prod`, `staging-validate` (build + client/SSR/rotas/assets).

## 3. Supabase

### Cloud (recomendado para começar)

1. Crie um projeto no dashboard.
2. **Settings → API** → copie URL e `anon` key para `.env.local`.
3. Aplique migrations do repositório:

```bash
npx supabase link --project-ref SEU_REF
npx supabase db push
```

Migrations em `supabase/migrations/`.

### Local (opcional)

```bash
npx supabase start
```

Use a URL e anon key exibidas no terminal (geralmente `http://127.0.0.1:54321`).

## 4. Iniciar o app

```bash
npm run dev
```

- App: [http://localhost:8080](http://localhost:8080)
- Login: [http://localhost:8080/login](http://localhost:8080/login)
- Site público: [http://localhost:8080/site](http://localhost:8080/site)

No primeiro request SSR, o servidor registra **readiness** no console (`[MedFlow] readiness`).

Sem Supabase configurado, o app sobe mas exibe aviso e o login não carrega instituições.

## 5. Validar ambiente

```bash
# Só variáveis
npm run env-check

# Env + build + smoke estrutural
npm run local-validate

# Build + checagens de produção (requer .env.production ou vars de prod)
npm run production-validate
```

Com o dev server rodando:

```bash
npm run smoke-check -- --url=http://localhost:8080
```

## 6. Build e preview

```bash
npm run build
npm run preview
```

## 7. Testar login e fluxos

1. Abra `/login` — lista de tenants exige Supabase válido.
2. Após login → dashboard `/`.
3. Rotas principais: `/financeiro`, `/tiss`, `/piloto`, `/instituicao`, `/ajuda`.
4. Smoke autenticado no app: `/lancamento` (painel de release/smoke interno).

## 8. Solução de problemas

| Sintoma                                  | Causa provável          | Ação                                                       |
| ---------------------------------------- | ----------------------- | ---------------------------------------------------------- |
| Banner “Configuração de deploy pendente” | Sem `VITE_SUPABASE_*`   | Preencha `.env.local` e reinicie `npm run dev`             |
| `env-check` falha                        | Arquivo env ausente     | `cp .env.example .env.local`                               |
| Login sem instituições                   | RLS / tabelas / seed    | Rode migrations; confira usuário no Supabase Auth          |
| Porta 8080 em uso                        | Outro processo          | Altere `server.port` em `vite.config.ts` ou libere a porta |
| Build OK, login falha                    | Projeto Supabase errado | Confira URL/anon key no dashboard                          |

## 9. Comandos úteis

| Comando                       | Uso                              |
| ----------------------------- | -------------------------------- |
| `npm run dev`                 | Servidor de desenvolvimento      |
| `npm run build`               | Build cliente + SSR (Cloudflare) |
| `npm run env-check`           | Validar env de dev               |
| `npm run local-validate`      | Validação completa local         |
| `npm run production-validate` | Gate pré-deploy                  |
| `npm run smoke-check`         | Estrutura + health HTTP opcional |
| `npm run lint`                | ESLint + Prettier                |

## Documentação relacionada

- `docs/supabase-production.md` — Supabase em produção
- `docs/cloudflare-pages.md` — Deploy Cloudflare
- `docs/smoke-test-checklist.md` — Checklist de smoke
