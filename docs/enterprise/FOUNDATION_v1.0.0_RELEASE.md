# MEDICFLOW — Enterprise Foundation v1.0.0

**Sprint:** FOUNDATION-RELEASE-02  
**Tipo:** Publicação oficial da baseline certificada  
**Data:** 01/08/2026  
**Veredito parcial:** GitHub + Tag publicados · Deploy Staging pendente de autenticação Cloudflare

---

## Identidade da baseline

| Campo | Valor |
|-------|-------|
| Nome da tag | `medicflow-enterprise-foundation-v1.0.0` |
| Commit oficial (short) | `e6e0eda` |
| Commit oficial (full) | `e6e0eda61e47102a8b8853a62640e0788946ec27` |
| Mensagem do commit | `chore(foundation): remove remaining Category B UI change` |
| Branch | `main` |
| Repositório | `https://github.com/ararunaf/medflow-dashboard.git` |
| Tag object (annotated) | `49903fdd612506dcc434da24041905312a91d070` |
| Commit apontado pela tag | `e6e0eda61e47102a8b8853a62640e0788946ec27` |

Não houve commit de governança adicional antes do push. O hash publicado é exatamente `e6e0eda`.

---

## Escopo congelado

- Roadmap Enterprise encerrado até **EPC-23** (inclusive)
- Certificações Enterprise presentes em `docs/enterprise/*CERT*`
- ECS-01 certificado na baseline
- Categoria B eliminada no commit `e6e0eda`
- Liberação formal para início da **EPC-24** condicionada à conclusão do Deploy Staging (ver abaixo)

Após esta publicação, nenhuma alteração deverá ser realizada na Foundation, exceto correções críticas aprovadas formalmente.

---

## Gates reexecutados (FASE 2 — 01/08/2026)

| Gate | Resultado | Detalhe |
|------|-----------|---------|
| Build | **PASS** | `npm run build` exit 0 |
| TypeScript | **PASS** | `npx tsc --noEmit` — 0 erros |
| ESLint | **PASS** | `npm run lint` — 0 errors / 7 warnings |
| Smoke | **PASS** | `npm run smoke-check` exit 0 |
| Enterprise | **PASS** | 381 pass / 0 fail / 54 suites |
| Capture | **PASS** | 198 pass / 0 fail / 1 skip |
| Regressão | **Nenhuma** | — |

---

## Publicação Git (FASES 3–4)

| Etapa | Status | Evidência |
|-------|--------|-----------|
| Working Tree limpa (pré-publish) | **SIM** | porcelain vazio |
| Push `main` | **SIM** | `cb364c7..e6e0eda` |
| Hash local = remoto | **SIM** | ambos `e6e0eda61e47102a8b8853a62640e0788946ec27` |
| Tag criada | **SIM** | `medicflow-enterprise-foundation-v1.0.0` |
| Tag publicada | **SIM** | `git push origin medicflow-enterprise-foundation-v1.0.0` |
| Tag → commit | **SIM** | `e6e0eda61e47102a8b8853a62640e0788946ec27` |
| Branch → commit | **SIM** | `e6e0eda61e47102a8b8853a62640e0788946ec27` |
| GitHub `main` → commit | **SIM** | `e6e0eda61e47102a8b8853a62640e0788946ec27` |

---

## Deploy Staging (FASE 5)

| Campo | Valor |
|-------|-------|
| Status | **BLOQUEADO** |
| Comando | `npm run deploy:staging` |
| Commit alvo | `e6e0eda61e47102a8b8853a62640e0788946ec27` |
| Etapas 1–3 | **PASS** (env-check:staging · build:staging · validate-staging-build) |
| Etapa 4 | **FAIL** — `wrangler deploy` sem autenticação |
| Erro | `CLOUDFLARE_API_TOKEN` ausente / `wrangler login` OAuth timeout |
| Deployment ID | *não publicado* |
| URL | `https://staging.medicflow.app.br` (alvo; não republicada nesta sprint) |
| Hash publicado no Worker | *não confirmado nesta sprint* |

### Desbloqueio obrigatório

1. Autenticar Cloudflare neste ambiente (`wrangler login` **ou** definir `CLOUDFLARE_API_TOKEN`)
2. Em `MedFlow-IA/` no commit `e6e0eda` (ou checkout da tag):
   ```bash
   git checkout medicflow-enterprise-foundation-v1.0.0
   npm run deploy:staging
   ```
3. Registrar neste documento: Deployment ID, URL confirmada, hash publicado

---

## Alinhamento GitHub / Tag / Deploy

| Superfície | Hash | Alinhado a `e6e0eda`? |
|------------|------|------------------------|
| GitHub `main` | `e6e0eda61e47102a8b8853a62640e0788946ec27` | **SIM** |
| Tag `medicflow-enterprise-foundation-v1.0.0` | `e6e0eda61e47102a8b8853a62640e0788946ec27` | **SIM** |
| Deploy Staging | *pendente* | **NÃO (ainda)** |

---

## Certificações e roadmap

- Baseline Enterprise Foundation **v1.0.0** torna-se a referência oficial do projeto via tag
- Roadmap estrutural **EPC-00 → EPC-23** encerrado nesta baseline
- **EPC-24** liberada formalmente para início **após** conclusão do Deploy Staging desta release
- Foundation oficialmente congelada no commit da tag (exceto hotfixes críticos aprovados)

---

## Critério de aprovação da sprint

| Critério | Status |
|----------|--------|
| Working Tree limpa | ✓ |
| Nenhum arquivo pendente (pré-publish) | ✓ |
| Push realizado | ✓ |
| Tag criada | ✓ |
| Tag publicada | ✓ |
| Deploy realizado | ✗ pendente auth Cloudflare |
| GitHub / Tag / Deploy no mesmo commit | ✗ (Deploy pendente) |
| Build / TS / ESLint / Smoke / Enterprise / Capture PASS | ✓ |
| Documentação da release | ✓ (este arquivo) |
| Enterprise Foundation congelada (tag) | ✓ |

**Resultado FOUNDATION-RELEASE-02:** publicação Git oficial concluída; **APROVAÇÃO TOTAL condicionada** à conclusão do Deploy Staging no commit `e6e0eda`.
