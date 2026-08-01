# EPC-03 — Configuration Architecture (ADR)

**Sprint:** EPC-03 — Configuration Engine Foundation  
**Data:** 31/07/2026  
**Status:** Aceito

---

## ADR-EPC-03-001 — Introduzir ConfigurationPort sem migrar módulos

### Contexto

A plataforma possui configurações espalhadas (env, settings, flags, tenant context). Uma migração big-bang para um Configuration Engine unificado é de alto risco e fora do escopo desta sprint.

### Decisão

Criar `ConfigurationPort` + `DefaultConfigurationAdapter` + `MockConfigurationAdapter` + provider + store in-process, **sem** migrar módulos de negócio. Apenas PoC Application (demo) + testes provam o fluxo.

### Consequências

- Risco de regressão próximo de zero
- Arquitetura pronta para strangler fig
- Dívida consciente: configurações legadas permanecem até sprints futuras

---

## ADR-EPC-03-002 — Engine genérico sem conhecimento de domínio

### Contexto

Enterprise exige multi-tenant, multi-operadora e contratos versionados no futuro. Se o Configuration Engine conhecer cooperativas/OCR/IA agora, o Core ficará acoplado.

### Decisão

O Port/Adapters/Store usam apenas chaves, escopos estruturais e valores tipados genéricos. Proibido importar ou modelar cooperativas, operadoras, contratos, workflows, OCR ou IA.

### Consequências

- Core estável diante de evolução de domínio
- Domínio específico fica em camadas superiores (EF / DIP / CI)
- Testes e mock permanecem simples

---

## ADR-EPC-03-003 — Default store in-process (sem banco novo)

### Contexto

Criar tabela/migration de configuração nesta sprint violaría “NÃO alterar banco / NÃO criar migrations / NÃO alterar persistência”.

### Decisão

`DefaultConfigurationStore` é um Map in-process. O adapter default o utiliza. Runtime pode injetar `readLegacy` para bind futuro a mecanismos existentes sem alterar Settings/Env nesta sprint.

### Consequências

- Zero impacto em schema/RLS/migrations
- Store default adequado para fundação + testes
- Persistência remota/database/redis fica como provider reservado

---

## ADR-EPC-03-004 — Hierarquia estrutural + resolução mínima

### Contexto

A plataforma precisará de overrides por tenant/módulo/usuário. Implementar merge complexo agora anteciparia regras de negócio.

### Decisão

1. Declarar hierarquia oficial: Application → Platform → Environment → Tenant → Module → Feature → User  
2. Preparar ordem de resolução: User → Module → Tenant → Platform → Default  
3. Implementar apenas walk de primeiro hit (`resolveHierarchy`)

### Consequências

- Assinaturas e ordem estáveis para evolução
- Sem políticas de merge prematuras
- Environment/Feature existem na hierarquia oficial; resolução mínima segue o exemplo EPC-03

---

## ADR-EPC-03-005 — Tipagem de valor extensível via discriminated union

### Contexto

Configurações futuras incluirão boolean, number, string, enum, JSON e collections. Tipos soltos (`unknown` apenas) forçariam refactors.

### Decisão

`ConfigurationValue` como união discriminada por `kind`. Adapters armazenam o valor tipado sem validação de domínio.

### Consequências

- Evolução sem mudança arquitetural do Port
- Validadores de domínio podem ser adicionados acima do Port depois

---

## ADR-EPC-03-006 — Feature Flags como infraestrutura, não cutover

### Contexto

Existem (ou existirão) feature flags de produto. Substituí-las nesta sprint viola “NÃO alterar Feature Flags atuais”.

### Decisão

Helpers `getFeatureFlagState` / `setFeatureFlagState` sobre o Port, com prefixo `feature-flag.`, **sem** ligação a UI/produto.

### Consequências

- Infra pronta
- Zero impacto em flags legadas
- Cutover explícito em sprint futura

---

## ADR-EPC-03-007 — Factory com erro explícito para providers futuros

### Contexto

Fallback silencioso para `default` quando `database`/`redis` forem pedidos mascararia misconfiguração.

### Decisão

`createConfigurationPort` retorna `DefaultConfigurationAdapter` por default; `mock`/`test` para testes; demais ids lançam erro explícito.

### Consequências

- Multi-provider preparado
- Falha cedo e clara
- Mesmo padrão de EPC-01/EPC-02

---

## Diagrama de camadas

```
┌─────────────────────────────────────────────┐
│ Application (demo PoC / futuros use-cases)  │
└─────────────────────┬───────────────────────┘
                      │ depende de
                      ▼
┌─────────────────────────────────────────────┐
│ ConfigurationPort                           │
│  get/set/exists/remove/list/health/caps     │
└─────────────────────┬───────────────────────┘
                      │ implementado por
          ┌───────────┴───────────┐
          ▼                       ▼
 DefaultConfigurationAdapter   MockConfigurationAdapter
          │
          ▼
 ConfigurationStore (interface)
          │
          ▼
 DefaultConfigurationStore (in-process)
```

Inversão de dependência: Domain/Application → Port; Adapter → Store/Infrastructure.
