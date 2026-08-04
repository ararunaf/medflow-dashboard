# Regra Permanente do BLOCO C — Determinismo (RULE_02)

**Status:** Vigente a partir da Sprint C-02 (2026-08-04)  
**Escopo:** Todos os Runtimes do BLOCO C — Integração Corporativa  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE.md)  
**Documento de arquitetura:** [`C02_XML_VALIDATION_RUNTIME_ARCHITECTURE.md`](./C02_XML_VALIDATION_RUNTIME_ARCHITECTURE.md)

---

## Regra

Os Runtimes do BLOCO C são **determinísticos** e **estruturais**.

### Determinismo obrigatório

1. **Mesmo input → mesmo result**  
   Dado o mesmo pedido canônico, o Runtime deve produzir o mesmo resultado estrutural (salvo IDs/timestamps de envelope operacional).

2. **Sem estado oculto**  
   Não há aprendizado, cache semântico, memória adaptativa ou estado que altere decisões entre chamadas além do store estrutural in-process explícito.

3. **Sem decisões inteligentes**  
   Nenhum Runtime do BLOCO C toma decisões de negócio, correção automática, scoring inteligente, classificação por IA ou inferência.

4. **Decisões inteligentes ficam no BLOCO B**  
   Decisões / orquestração inteligente permanecem em:
   - AI Orchestration Runtime
   - Audit Runtime
   - Quality Runtime  
   e demais Ports do BLOCO B.

5. **BLOCO B decide; BLOCO C integra**  
   O BLOCO C integra contratos canônicos e prepara infraestrutura de integração corporativa. O BLOCO B concentra inteligência e julgamento.

---

## Consequências arquiteturais

| Princípio | Aplicação |
|-----------|-----------|
| Determinismo | Adapters estruturais respondem de forma previsível |
| Sem estado oculto | Store in-process é explícito; sem side-effects ocultos |
| Sem IA no BLOCO C | Sem modelos, embeddings, prompts ou correção automática |
| Separação de blocos | BLOCO B decide; BLOCO C integra |
| Contratos canônicos | Ports expõem apenas estruturas canônicas |

---

## Limites explícitos (C-02)

O Enterprise XML Validation Runtime **não**:

- valida XML real;
- carrega ou interpreta XSD;
- faz parsing de XML;
- repara / corrige XML automaticamente;
- chama SOAP / operadoras;
- executa IA.

---

## Vigência

Esta regra é **permanente** para todo o BLOCO C. Sprints futuras (C-02A em diante) devem respeitá-la sem exceção silenciosa.
