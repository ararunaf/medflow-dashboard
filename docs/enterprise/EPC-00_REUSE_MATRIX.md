# EPC-00 — Reuse Matrix

**Sprint:** EPC-00 — Baseline Arquitetural Enterprise  
**Data:** 31/07/2026  
**Baseline:** `cb364c7` · `medicflow-mvp-operational-v1.0.0`  
**Modo:** Somente classificação — sem refatoração.

---

## Legenda

| Classe | Significado |
|--------|-------------|
| **REUTILIZAÇÃO 100%** | Pode entrar no Enterprise Core/Platform sem mudança estrutural; apenas packaging/docs |
| **REUTILIZAÇÃO PARCIAL** | Conceito e código úteis; exigem adaptação de fronteiras, contratos ou configuração |
| **PRECISA EVOLUIR** | Mantém valor de domínio, mas arquitetura atual impede multi-* enterprise |
| **NÃO RECOMENDADO** | Não carregar para o Core; substituir, isolar ou deprecar no horizonte Enterprise |

---

## 1. Matriz por camada

| Camada / Artefato | Classe | Justificativa |
|-------------------|--------|---------------|
| `OcrProvider` interface | **REUTILIZAÇÃO 100%** | Contrato plugável já alinhado a multi-OCR |
| Azure DI provider | **REUTILIZAÇÃO PARCIAL** | Implementação válida; registrar via factory/config por tenant |
| GPT-4o / Tesseract stubs | **PRECISA EVOLUIR** | Placeholders; completar em DIP/OCR sprints |
| Capture stores (3) | **REUTILIZAÇÃO PARCIAL** | Bom padrão; generalizar para Repository/Port |
| Capture audit rule types | **REUTILIZAÇÃO PARCIAL** | Tipos bons; engine deve virar configurável (EF/Rule) |
| Contract rule types | **REUTILIZAÇÃO PARCIAL** | Idem; seeds hardcoded → config/DB |
| `ServiceCtx` + auth guards | **REUTILIZAÇÃO PARCIAL** | Base sólida; expandir hierarquia tenant/cooperativa |
| RBAC (`lib/auth/rbac`) | **REUTILIZAÇÃO PARCIAL** | Roles OK; capabilities por produto/tenant |
| RLS + `tenant_id` | **REUTILIZAÇÃO PARCIAL** | Essencial; insuficiente sozinho para org hierarchy |
| Server functions `*Fn` | **REUTILIZAÇÃO PARCIAL** | Manter como Application API; atrás de use-cases estáveis |
| Domain services (TISS, payout, closing…) | **REUTILIZAÇÃO PARCIAL** | Lógica de negócio valiosa; desacoplar de Supabase |
| Operations agents / scoring | **REUTILIZAÇÃO PARCIAL** | Base OPS/COPILOT; abstrair AI e policies |
| RAG embedding OpenAI provider | **PRECISA EVOLUIR** | Funciona; vira um Ai/EmbeddingProvider entre N |
| Copilot GPT OpenAI client | **PRECISA EVOLUIR** | Acoplado a OpenAI HTTP; extrair AiProvider |
| Supabase clients (browser/server/admin) | **PRECISA EVOLUIR** | Viram **um** adapter de Infrastructure, não o Core |
| Acesso `.from(table)` em services | **NÃO RECOMENDADO** | Anti-padrão Enterprise no Core; migrar para ports |
| UI upload direto Storage | **NÃO RECOMENDADO** | Infra vazando na UI |
| Hub financeiro mock KPIs | **NÃO RECOMENDADO** | Placeholder; não promover a Core |
| Hardcoded contract seeds Unimed | **PRECISA EVOLUIR** | Útil como fixture; não como registry definitivo |
| Feature flags pilot | **REUTILIZAÇÃO 100%** | Padrão de configuração progressiva |
| Health checks `/health*` | **REUTILIZAÇÃO 100%** | Observabilidade mínima reutilizável |
| Security (CSP, audit logs, brute-force) | **REUTILIZAÇÃO PARCIAL** | Controles bons; generalizar para multi-tenant enterprise |
| UI kit operacional / shell | **REUTILIZAÇÃO PARCIAL** | Design system app; não é Platform Core |
| Migrations 1–30 schema | **REUTILIZAÇÃO PARCIAL** | Schema MVP; evoluir sem breaking via EPC migrations futuras |
| Cloudflare/Vercel deploy configs | **REUTILIZAÇÃO PARCIAL** | Runtime adapters; Core deve ser host-agnostic |

---

## 2. Matriz por módulo de produto

| Módulo | Classe | Notas Enterprise |
|--------|--------|------------------|
| Auth / Login / RBAC | **REUTILIZAÇÃO PARCIAL** | Base EPC; SSO/org hierarchy depois |
| Escalas / Plantões | **REUTILIZAÇÃO PARCIAL** | Domínio operacional; ports de persistência |
| TISS foundation | **PRECISA EVOLUIR** | Multi-operadora/contrato exige config externa + integrações |
| Captura Inteligente | **REUTILIZAÇÃO PARCIAL** | Melhor modularização atual; referência para outros módulos |
| Review / Processing / Analytics capture | **REUTILIZAÇÃO PARCIAL** | Pipelines fixos → workflows configuráveis (futuro) |
| Fechamento / Conciliação / Repasse | **REUTILIZAÇÃO PARCIAL** | Domínio financeiro ops; isolar de ERP futuro |
| Financeiro hub (mock) | **NÃO RECOMENDADO** | Substituir quando KPI real existir |
| Operations Manager / Central | **PRECISA EVOLUIR** | Vira OPS + COPILOT; desacoplar AI |
| RAG / Knowledge | **PRECISA EVOLUIR** | Infra pgvector OK; provider/indexação multi-backend |
| Instituição / Branding | **REUTILIZAÇÃO PARCIAL** | Tenant settings → Org/Tenant config service |
| Piloto / Go-live / Readiness | **REUTILIZAÇÃO 100%** | Ferramentas OPS de implantação |
| Landing comercial / Help | **REUTILIZAÇÃO PARCIAL** | Fora do Core; manter como apps satélite |
| Integrações console | — (não existe) | Criar sob DIP |
| ML supervisionado | — (não existe) | Criar sob ML |
| Agenda clínica / EHR | — (não existe) | Fora do escopo plataforma operacional |

---

## 3. Matriz por capacidade multi-*

| Capacidade alvo | Situação atual | Classe do que existe | Gap |
|-----------------|----------------|----------------------|-----|
| Multi-cooperativa | Tenant flat | **PRECISA EVOLUIR** | Modelo org hierarchy |
| Multi-operadora | Tabelas + services | **REUTILIZAÇÃO PARCIAL** | Config/runtime por contrato |
| Multi-contrato | insurance_contracts + seeds | **PRECISA EVOLUIR** | Registry dinâmico |
| Multi-workflow | Pipeline linear capture | **PRECISA EVOLUIR** | Workflow engine |
| Multi-storage | Só Supabase Storage | **PRECISA EVOLUIR** | StoragePort + drivers |
| Multi-banco | Só Postgres Supabase | **PRECISA EVOLUIR** | PersistencePort + adapters |
| Multi-OCR | Interface + 1 live + 2 stubs | **REUTILIZAÇÃO PARCIAL** | Completar registry/fallback |
| Multi-IA | Só OpenAI | **PRECISA EVOLUIR** | AiProvider registry |

---

## 4. Componentes totalmente reutilizáveis (lista curta)

Itens classificados **REUTILIZAÇÃO 100%**:

1. Contrato `OcrProvider` (`src/lib/capture/ocr/types/provider.ts`)
2. Feature flag service (pilot-execution)
3. Health checks HTTP (`/health`, `/health/db`, `/health/auth`)
4. Tooling de piloto / readiness / smoke / deployment checklist (como OPS tooling)
5. Padrão de testes capture (`scripts/capture/tests/*`) como modelo de suite de domínio

---

## 5. Componentes que precisarão evoluir (lista prioritária)

| Prioridade | Componente | Evolução necessária (futuras sprints) |
|------------|------------|----------------------------------------|
| P0 | Persistence access (`.from`) | Introduzir ports/repositories sem mudar comportamento |
| P0 | Tenant model | Hierarquia cooperativa / instituição / contratos |
| P0 | Storage | StoragePort (Supabase → S3/Azure Blob adapters) |
| P1 | OCR registry | Fallback real + config por tenant |
| P1 | AI clients | AiProvider (OpenAI, futuros) |
| P1 | Rule/contract registries | Externalizar seeds; Rule Engine (EF) |
| P2 | Workflows capture/TISS | Workflow definitions versionadas |
| P2 | Operations Copilot | Separar políticas, tools e modelo |
| P2 | RAG | Multi-embedding / multi-vector-store |
| P3 | Deploy adapters | Core host-agnostic |

---

## 6. O que não deve ir para o Enterprise Platform Core

| Item | Motivo |
|------|--------|
| Chamadas Supabase espalhadas em services | Vazamento de infra |
| Upload Storage na UI | Viola camadas |
| Seeds Unimed como “fonte da verdade” | Acoplamento a um cliente |
| KPIs mock do hub financeiro | Ruído / dívida de produto |
| Stubs OCR apresentados como produção | Risco operacional |
| Docs legadas pré-capture sem marcação | Drift documental (governança, não código) |

---

## 7. Estratégia de reutilização recomendada (documental)

```
Manter comportamento atual (compat layer)
        ↓
Introduzir ports atrás dos services existentes (EPC)
        ↓
Migrar adapters um a um (Supabase default)
        ↓
Ativar multi-config por tenant (EF / DIP)
        ↓
Novos motores (OCR/IA/Storage) sem reescrever domínio
```

**Princípio:** reutilizar **domínio e contratos**; isolar **infraestrutura**; não reescrever o MVP operacional.

---

## 8. Contagens de classificação (resumo)

| Classe | Itens principais (aprox.) |
|--------|--------------------------:|
| REUTILIZAÇÃO 100% | 5 grupos |
| REUTILIZAÇÃO PARCIAL | 18 grupos |
| PRECISA EVOLUIR | 12 grupos |
| NÃO RECOMENDADO | 4 grupos |

Ver detalhamento nas seções 1–2. Contagens de inventário bruto (módulos/services/providers) em `EPC-00_ARCHITECTURE_AUDIT.md` §19.
