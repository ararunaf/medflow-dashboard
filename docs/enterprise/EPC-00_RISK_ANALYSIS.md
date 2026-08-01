# EPC-00 — Risk Analysis & Regression Controls

**Sprint:** EPC-00 — Baseline Arquitetural Enterprise  
**Data:** 31/07/2026  
**Baseline:** `cb364c7` · `medicflow-mvp-operational-v1.0.0`  
**Escopo:** Riscos de evolução Enterprise — **sem alterações de código nesta sprint**.

---

## 1. Declaração de impacto EPC-00

| Dimensão | Impacto nesta sprint |
|----------|----------------------|
| Comportamento funcional | **Nenhum** |
| UI / telas | **Nenhuma alteração** |
| Banco / migrations | **Nenhuma alteração** |
| APIs / Server Fns | **Nenhuma alteração** |
| Fluxos operacionais | **Nenhuma alteração** |
| Artefatos gerados | **Somente documentação** em `docs/enterprise/` |

EPC-00 **não introduz regressão de runtime** porque não há diff de aplicação.

Os riscos abaixo aplicam-se às **sprints futuras** que implementarão a arquitetura-alvo.

---

## 2. Princípios de preservação (obrigatórios em toda alteração futura)

Toda mudança arquitetural deverá preservar:

| Princípio | Significado prático |
|-----------|---------------------|
| **Compatibilidade** | Contratos `*Fn`, schemas e UX atual permanecem válidos |
| **Multi-tenant** | Isolamento por tenant/org; fail-closed sem contexto |
| **Desacoplamento** | Domain livre de vendors; I/O só via ports |
| **Configuração** | Providers/regras/workflows por config, não só por deploy |
| **Escalabilidade** | Capacidades horizontalizáveis; storage/DB substituíveis |

Violação de qualquer princípio = **bloqueio de merge** na trilha Enterprise.

---

## 3. Riscos de regressão por área

### 3.1 Tenancy / Multi-tenant

| ID | Risco | Prob. | Impacto | Mitigação futura |
|----|-------|-------|---------|------------------|
| R-T1 | Introduzir hierarquia org quebrando `tenant_id` flat | Média | Crítico | Compat layer: `tenant_id` continua; org como metadado |
| R-T2 | Service role bypassar RLS sem filtro explícito | Média | Crítico | Lint/gate: admin queries exigem `tenantId` |
| R-T3 | Branding/settings cross-tenant | Baixa | Alto | Manter policies + testes `multi-tenant-auth-validate` |

### 3.2 Persistência

| ID | Risco | Prob. | Impacto | Mitigação futura |
|----|-------|-------|---------|------------------|
| R-P1 | Extrair repositories alterando queries/ordens | Alta | Alto | Adapter default = mesmas queries; testes de paridade |
| R-P2 | Drift de tipos `database.types.ts` | Média | Médio | Regenerar types no pipeline de migration |
| R-P3 | Dual-write durante strangler | Média | Alto | Feature flag + comparação shadow reads |

### 3.3 Storage

| ID | Risco | Prob. | Impacto | Mitigação futura |
|----|-------|-------|---------|------------------|
| R-S1 | Mudança de path quebra sessões capture existentes | Média | Crítico | Path strategy versionada; default paths atuais |
| R-S2 | Bucket clinical-documents ainda não aplicado remoto | Alta (ops) | Crítico | OPS-01 antes de DIP avançado em staging |
| R-S3 | Troca prematura para S3 sem adapter maduro | Baixa | Alto | Supabase permanece default até certificação |

### 3.4 OCR / DIP

| ID | Risco | Prob. | Impacto | Mitigação futura |
|----|-------|-------|---------|------------------|
| R-O1 | Ativar fallback stub em produção | Média | Alto | Registry só registra providers `health()==available` |
| R-O2 | Trocar primary OCR muda qualidade parser | Média | Alto | Golden files capture; shadow compare |
| R-O3 | Credenciais Azure ausentes → falha total | Alta (ops) | Alto | Fail graceful + alerta OPS; não silenciar |

### 3.5 IA / Copilot / RAG

| ID | Risco | Prob. | Impacto | Mitigação futura |
|----|-------|-------|---------|------------------|
| R-A1 | Troca de modelo altera respostas/tools | Alta | Médio | Pin de modelo por env + eval suite |
| R-A2 | Tools executarem mutações indevidas | Média | Crítico | Sandbox + policy + RBAC (já há embrião) |
| R-A3 | RAG misturar corpus entre tenants | Média | Crítico | Filtro `tenant_id` em vector search obrigatório |

### 3.6 Regras / contratos

| ID | Risco | Prob. | Impacto | Mitigação futura |
|----|-------|-------|---------|------------------|
| R-R1 | Externalizar rules muda severidade/resultados | Alta | Alto | Versionar packs; default = seed atual embutido |
| R-R2 | Seeds Unimed vazarem como default global | Média | Médio | Packs só ativos quando tenant configurar |
| R-R3 | Rule engine não-determinístico | Baixa | Alto | Avaliação pura, sem I/O oculto |

### 3.7 TISS / Financeiro

| ID | Risco | Prob. | Impacto | Mitigação futura |
|----|-------|-------|---------|------------------|
| R-F1 | Refactor de services alterar cálculos payout/closing | Média | Crítico | Snapshots financeiros + testes de competência |
| R-F2 | XML export “melhorado” quebrar consumidores internos | Média | Médio | Versionar envelope `medflowTissExport` |
| R-F3 | Conciliação CSV divergir após abstração | Baixa | Médio | Fixtures CSV imutáveis |

### 3.8 OPS / Deploy

| ID | Risco | Prob. | Impacto | Mitigação futura |
|----|-------|-------|---------|------------------|
| R-D1 | Staging P0 mascara falsos “GO” de arquitetura | Alta | Alto | Separar certificação código vs. ambiente |
| R-D2 | Secrets ausentes → features “mortas” silenciosas | Alta | Médio | Health degradado explícito por capability |
| R-D3 | Dual deploy CF/Vercel divergir | Baixa | Médio | Um path canônico + smoke ambos |

### 3.9 UI / APIs

| ID | Risco | Prob. | Impacto | Mitigação futura |
|----|-------|-------|---------|------------------|
| R-U1 | “Limpeza de camadas” mover I/O e quebrar rotas | Média | Alto | Proibir mudança de UI em sprints EPC puras |
| R-U2 | Renomear `*Fn` quebrar hooks | Média | Alto | Facades estáveis; deprecate cycle |
| R-U3 | Remover acesso browser Supabase sem migrar auth | Média | Crítico | Auth migration dedicada |

---

## 4. Riscos estruturais já presentes (baseline)

Estes **já existem** no código atual; EPC-00 apenas os registra:

1. Acoplamento forte a Supabase (~97 arquivos com `.from`)
2. OCR fallbacks não implementados (risco se orquestrador tentar fallback)
3. Regras/contratos hardcoded (Unimed seeds)
4. Copilot/RAG dependentes de secrets frequentemente ausentes
5. Staging com bloqueios P0 (migration #30, bucket clinical, Worker secrets, SMTP)
6. Hub financeiro com KPIs mock (risco de interpretação de produto)
7. Ausência de Repository Pattern (custo alto de troca de DB)

---

## 5. Controles de regressão recomendados (próximas sprints)

### 5.1 Gates obrigatórios

| Gate | Comando / evidência |
|------|---------------------|
| Lint/build | `npm run lint`, `npm run build` |
| Capture suite | `npm run capture:test:all` |
| RAG infra | `npm run rag:test` |
| Multi-tenant | `npm run multi-tenant-auth-validate` |
| Smoke | `npm run smoke-check` / staging-validate |
| Auth/security | `auth-validate`, `security-*-validate` |

### 5.2 Regras de mudança arquitetural

1. **Nenhuma sprint EPC pode alterar comportamento observável** sem teste de paridade.
2. **Adapters default primeiro** — novos providers só atrás de flag.
3. **Proibido** alterar UI, contratos `*Fn` públicos e schema na mesma PR que introduz ports (exceto se PR for explicitamente de produto).
4. **Shadow mode** para OCR/AI/rules: rodar novo caminho em paralelo, comparar, só então cutover.
5. **Documentar** todo port novo em `docs/enterprise/` com matriz de compatibilidade.

### 5.3 Checklist pré-merge (template)

```
[ ] Comportamento usuário inalterado? (sim/não — se não, justificar sprint de produto)
[ ] Multi-tenant fail-closed preservado?
[ ] Adapter default = vendor atual?
[ ] Feature flag / config para qualquer novo provider?
[ ] Suites de regressão verdes?
[ ] Sem secrets hardcoded?
[ ] Docs enterprise atualizados?
```

---

## 6. Matriz risco × trilha futura

| Trilha | Maior risco de regressão | Contenção |
|--------|--------------------------|-----------|
| EPC | Quebra massiva de services ao extrair ports | Strangler + facades |
| EF | Hierarquia org vs RLS atual | Compat `tenant_id` |
| DIP | Qualidade OCR/parser | Golden files |
| KP | Vazamento vetorial cross-tenant | Filtros obrigatórios |
| CI | Calibração altera glosas | Packs versionados |
| AAP | Severidade de regras | Default = regras atuais |
| TISS | Export/integração | Versionamento XML |
| OPS | Falso positivo de saúde | Health por capability |
| COPILOT | Mutação indevida via tools | Sandbox + RBAC |
| ML | Drift de modelo | Eval gates |

---

## 7. Riscos de processo / documentação

| Risco | Mitigação |
|-------|-----------|
| Drift entre docs legadas e Enterprise | Marcar EPC docs como canônicas para arquitetura |
| Implementar features “já que estamos” em sprint EPC | Escopo fechado: arquitetura only |
| Dois roadmaps (produto vs enterprise) sem ponte | Seção de ponte em `EPC-00_ROADMAP.md` §5 |

---

## 8. Validações obrigatórias (snapshot EPC-00)

| # | Item | Valor |
|---|------|-------|
| 1 | Módulos | **35** inventário · **1** `src/modules` · **29** `lib` domains |
| 2 | Serviços | **86** |
| 3 | Repositories | **0** (+ **3** stores) |
| 4 | Providers | **8** arquivos |
| 5 | Dependências externas | Supabase, OpenAI, Azure DI, Cloudflare, SMTP |
| 6 | Dependências críticas | Supabase monolítico, RLS tenancy, OpenAI, Azure, buckets, ServerFns |
| 7 | Hardcoded | Buckets, seeds Unimed, OCR primary, URLs OpenAI, domínios CF, KPIs mock |
| 8 | Acoplamentos | Services↔DB, Storage, OCR/AI, rules-in-code, UI↔storage |
| 9 | Reutilizáveis 100% | OcrProvider contract, feature flags, health, OPS tooling, modelo de testes capture |
| 10 | Precisam evoluir | Persistence, tenancy hierarchy, storage port, AI port, rule packs, workflows |

Detalhamento: `EPC-00_ARCHITECTURE_AUDIT.md` e `EPC-00_REUSE_MATRIX.md`.

---

## 9. Conclusão

EPC-00 estabelece a **baseline de risco**: o sistema atual é funcionalmente maduro no MVP operacional, porém estruturalmente acoplado. A evolução Enterprise é viável **somente** via strangler com adapters default e gates de paridade.

**Nenhum risco de regressão foi materializado nesta sprint** — apenas documentado para governar as próximas.
