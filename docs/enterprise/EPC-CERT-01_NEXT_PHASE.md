# EPC-CERT-01 — Next Phase Risk Report (EPC-07)

**Sprint:** EPC-CERT-01 — Enterprise Platform Core Certification  
**Data:** 31/07/2026  
**Próxima fase alvo:** **EPC-07 — AI Provider Ports**  
**Natureza:** Relatório de riscos — **sem implementação**

---

## 1. Premissa

O Enterprise Platform Core (EPC-01…EPC-06B) foi auditado e certificado com veredito **GO** (ver [`EPC-CERT-01_CORE_CERTIFICATION.md`](./EPC-CERT-01_CORE_CERTIFICATION.md)).

EPC-07 deve nascer **conforme ECS-01**, família tipicamente **vendor-backed** (Mock + Vendor Adapter), sem embutir conhecimento clínico no Port.

---

## 2. O que EPC-07 pode / não pode fazer

### Pode

- Introduzir `AiPort` (ou `AiProviderPort`) com `health()` / `capabilities()`
- Factories `createAiPort({ provider? })` com ids `mock` / `test` / vendor / reservados
- Capabilities genéricas (chat, embeddings, tools, streaming — estrutural)
- Contextos opacos (tenantId, requestId) sem entidades clínicas
- Consumir Configuration (feature flags) **via Application**, não invertendo hierarquia
- Preparar integração futura com Rule/Expression **sem** acoplar agora

### Não pode (nesta entrada)

- Hardcodar prompts clínicos / TISS / glosa no Core
- Importar módulos de captura/OCR no Port
- Criar migrations de produto “por causa da IA”
- Alterar UI/API de produto para “ligar” o Port sem sprint de integração
- Fazer Workflow/Rule “conhecer” OpenAI no contrato
- Corrigir desvios ECS-01 desta certificação como side-effect (sprints dedicadas)

---

## 3. Riscos da próxima fase

| ID | Risco | Severidade | Mitigação recomendada |
|----|-------|------------|------------------------|
| RISK-01 | Vazamento de vendor (SDK OpenAI) na superfície do Port | ALTO | Tipos genéricos no Port; SDK só no Vendor Adapter |
| RISK-02 | Prompts/domínio clínico dentro do Adapter “default” | ALTO | Adapter default = transport genérico; packs de prompt em módulo de produto |
| RISK-03 | Acoplar AI Port a Rule/Workflow cedo demais | MÉDIO | EPC-07 só Port+Adapters+health; orquestração em sprint posterior |
| RISK-04 | Secrets/API keys em código ou Port | CRÍTICO | Somente env/config via Configuration/infra; nunca no contrato |
| RISK-05 | Quebrar isolamento dos Engines existentes | MÉDIO | AI não importa Persistence/Storage/Rule diretamente no Port |
| RISK-06 | Ignorar ECS-01 (inventar `factory/`, omitir mock/health) | MÉDIO | Checklist ECS-01 §5 obrigatório na sprint |
| RISK-07 | Assumir que MetadataReference unificado já existe | BAIXO | Usar refs opacas locais ou strings até sprint de unificação |
| RISK-08 | Pressão para “corrigir” DEV-01…DEV-07 dentro de EPC-07 | BAIXO | Manter escopo; débitos em sprints dedicadas |

---

## 4. Pré-requisitos satisfeitos pelo Core

| Pré-requisito para AI Ports | Status |
|-----------------------------|--------|
| Ports & Adapters pattern estabilizado | ✅ |
| Factory/provider pattern | ✅ |
| Health/Capabilities padrão | ✅ |
| Configuration Engine (flags futuras) | ✅ |
| Metadata genérico (schemas futuros de tools) | ✅ (prep) |
| Rule + Expression genéricos | ✅ (prep; sem binding obrigatório) |
| Isolamento sem ciclos | ✅ |
| ECS-01 congelada | ✅ |
| Bloqueio arquitetural crítico no Core | ❌ nenhum |

---

## 5. Débitos que NÃO precisam ser resolvidos antes de EPC-07

1. Realocar `rule/factory/`
2. Unificar `MetadataReference`
3. Renomear Persistence `mechanismId` → `providerId`
4. Renomear testes/docs Gen A de EPC-01/02
5. Completar docs Gen B faltantes de EPC-06B

Esses itens são **recomendações** (MÉDIO/BAIXO), não gates de entrada da IA.

---

## 6. Sequência sugerida (não executada nesta sprint)

```
EPC-CERT-01 (esta) — GO
        ↓
EPC-07 AI Provider Ports (fundação; sem UI)
        ↓
(sprints posteriores) binding Application / Copilot / tools
        ↓
(opcional) unificação de refs Metadata/Workflow/Rule
```

---

## 7. Veredito para o roadmap

**O roadmap pode prosseguir para EPC-07.**

Não há bloqueio arquitetural no Enterprise Platform Core que impeça a introdução de AI Provider Ports, desde que EPC-07 obedeça ECS-01 e preserve o isolamento genérico certificado nesta auditoria.
