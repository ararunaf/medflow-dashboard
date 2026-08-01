# ECS-01 — Test Standard

**Sprint:** ECS-01 — Enterprise Component Specification  
**Data:** 31/07/2026  
**Natureza:** Padrão oficial de testes Enterprise — **sem alteração de testes existentes**  
**Documento pai:** [`ECS-01_ENTERPRISE_COMPONENT_SPECIFICATION.md`](./ECS-01_ENTERPRISE_COMPONENT_SPECIFICATION.md)

---

## 1. Objetivo

Padronizar as categorias, localização, nomenclatura e convenções de teste de todo componente Enterprise.

Todo novo componente **deverá** possuir, no mínimo:

1. Unit / Contract Tests  
2. Mock Tests  
3. Health Tests  
4. Capabilities Tests  
5. Factory Tests  
6. Smoke Tests  

---

## 2. Localização e tooling

| Item | Padrão |
|------|--------|
| Arquivo | `scripts/enterprise/tests/{component}-engine.test.ts` |
| Runner | Node test runner via `npx tsx --test` |
| npm script | `"enterprise:{component}:test": "npx tsx --test scripts/enterprise/tests/{component}-engine.test.ts"` |
| `describe` raiz | `"EPC-XX {Xxx}Port contract"` |
| Asserções | `node:assert/strict` (ou o padrão já usado nas suites Enterprise) |

Um componente = **uma suite principal** na fundação. Suítes adicionais só com justificativa no ENGINE.md.

---

## 3. Categorias obrigatórias

### 3.1 Unit / Contract Tests

**Objetivo:** Validar o contrato do Port e tipos/helpers estruturais.

Deve cobrir:

- Forma do Port (métodos esperados presentes)
- Tipos/constantes nativas do mecanismo (quando existirem)
- Helpers puros em `ports/*.ts` (conditions, hierarchy, versioning, etc.)
- Ausência de vazamento de conceitos clínicos / vendor no contrato

### 3.2 Mock Tests

**Objetivo:** Garantir que `Mock{Xxx}Adapter` é utilizável isoladamente.

Deve cobrir:

- Resolução via `provider: "mock"` e `"test"`
- `health()` saudável no mock (salvo cenário explícito de unhealthy)
- Operações principais do Port no mock (quando o Port tiver ops além de health)
- Isolamento in-memory (sem I/O real)

### 3.3 Health Tests

**Objetivo:** Validar `health()` em adapters relevantes.

Deve cobrir:

- Mock healthy
- Default e/ou Vendor healthy (com runtime injetado quando necessário)
- Cenário unhealthy / não configurado (quando aplicável ao vendor)
- Ping opcional (`runtime.ping`) quando o adapter suportar

### 3.4 Capabilities Tests

**Objetivo:** Validar `capabilities()` e flags estruturais.

Deve cobrir:

- Retorno de `{Xxx}Capabilities` coerente com o adapter
- Flags booleanas esperadas para Default/Mock/Vendor
- Estabilidade: capabilities não vazam detalhes de vendor SDK

### 3.5 Factory Tests

**Objetivo:** Validar `create{Xxx}Port`.

Deve cobrir:

- Default da factory (sem options / options vazias)
- Resolução explícita de provider implementado
- `mock` / `test` → Mock
- Provider futuro/reservado → **erro explícito** (não fallback)
- Injecção de runtime/store quando fizer parte do contrato de opções

### 3.6 Smoke Tests

**Objetivo:** Validar superfície e isolamento em nível de “fumaça”.

Deve cobrir:

- Demo PoC `get{Xxx}HealthSummary(port)` com DI do Port
- `architectureLayer: "application"` (ou equivalente documentado)
- Port surface sem import/leak de vendor (Supabase client, etc.)
- Port surface sem leak clínico (paciente, guia, TISS, …)
- Quando aplicável: refs opacas para outros Engines (ex.: Metadata ref no Workflow)

---

## 4. Categorias condicionais (quando existirem no Engine)

| Categoria | Quando | Exemplos |
|-----------|--------|----------|
| Store injection | Há `Default{Xxx}Store` | Adapter usa store injetado |
| Ops / CRUD | Port tem operações além de health | put/get, get/set, registerSchema, start/advance |
| Hierarchy / resolution | Configuration-like | ordem de resolução |
| Versioning / inheritance / constraints | Metadata-like | helpers + registro |
| Runtime lifecycle | Workflow-like | start/advance/rollback/cancel |
| Document / cross-engine prep | Prep estrutural | Document Identity, Rule Engine prep |
| Legacy bridge | Adapter lê legado opcionalmente | `readLegacy` — sem migrar produto |

Essas categorias **somam** às obrigatórias; não as substituem.

---

## 5. Convenções de casos de teste

### 5.1 Nomes de `it` / `test`

Usar frases curtas em inglês ou português **consistentes com a suite do Engine** (as suites atuais misturam PT; novos Engines devem preferir **português claro**, alinhado às certificações):

Padrões sugeridos:

- `mock provider retorna health ok`
- `factory default resolve provider documentado`
- `factory lança erro para provider reservado não implementado`
- `capabilities expõe flags esperadas`
- `demo health summary usa apenas o Port`
- `port surface não vaza vendor`

### 5.2 Organização interna da suite

Ordem recomendada dos blocos:

1. Contract / surface  
2. Mock / test provider  
3. Default ou Vendor adapter  
4. Health / ping  
5. Capabilities  
6. Factory  
7. Ops específicas do domínio do mecanismo  
8. Demo PoC / smoke de isolamento  
9. Preps estruturais (cross-engine)

### 5.3 Isolamento

- Testes Enterprise **não** dependem de rede real.
- Vendor adapters usam **runtime injetado** (fake ping / fake client).
- Não acoplar a UI, rotas, Server Functions ou banco real.
- Não exigir variáveis de ambiente de produção.

### 5.4 Determinismo

- Sem sleeps flaky desnecessários.
- Sem ordem implícita entre arquivos de teste.
- Stores in-memory recriados por caso ou suite conforme necessário.

---

## 6. Gates de regressão

Toda sprint de novo Engine **deve** executar:

1. Suite do próprio Engine → PASS  
2. Suites dos Engines Enterprise já certificados relevantes → PASS (regressão)  
3. Gates adicionais do repositório apenas se estiverem no escopo da sprint (documentar no CERTIFICATION)

Separar no relatório:

- **Resultado da Sprint** (gates do escopo)
- **Estado Global pré-existente** (falhas fora do escopo, se houver)

---

## 7. Mapeamento das suites existentes (inventário)

| Engine | Arquivo atual | Categorias cobertas (síntese) | Conforme nome canônico? |
|--------|---------------|-------------------------------|-------------------------|
| Persistence | `persistence-ports.test.ts` | contract, mock, health, factory, demo, smoke | Nome legado (`*-ports`) |
| Storage | `storage-ports.test.ts` | contract, mock, health, caps, factory, ops, demo, smoke | Nome legado |
| Configuration | `configuration-engine.test.ts` | contract, mock, health, caps, factory, ops, hierarchy, flags, demo, smoke | ✅ |
| Metadata | `metadata-engine.test.ts` | contract, mock, health, caps, factory, ops, versioning/inheritance/constraints, smoke | ✅ |
| Workflow | `workflow-engine.test.ts` | contract, mock, health, caps, factory, lifecycle, conditions, smoke | ✅ |

**ECS-01 não renomeia nem altera essas suites.** Novos Engines nascem no padrão canônico.

---

## 8. Checklist mínimo de aprovação de testes (por Engine novo)

- [ ] Arquivo `{component}-engine.test.ts` criado  
- [ ] Script npm `enterprise:{component}:test` criado  
- [ ] Unit/Contract ✅  
- [ ] Mock ✅  
- [ ] Health ✅  
- [ ] Capabilities ✅  
- [ ] Factory (default + erro explícito) ✅  
- [ ] Smoke (demo + no leak) ✅  
- [ ] Suites anteriores relevantes PASS  
- [ ] Nenhum teste depende de I/O real  

---

## 9. Declaração

Este Test Standard é **vinculante** para todos os novos componentes Enterprise a partir da aprovação de ECS-01.  
Suites legadas permanecem válidas até eventual sprint de adequação exclusivamente documental/cosmetica.
