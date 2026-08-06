# DECISIONS

## Registro de decisões técnicas

### 2026-08-06 — Criação da documentação do agente

- **Decisão:** criar em `docs/agent/` os arquivos `AGENT_RULES.md`, `PROJECT_CONTEXT.md`, `ARCHITECTURE.md`, `DECISIONS.md` e `SPRINT_CONTEXT.md`.
- **Motivo:** padronizar regras e contexto para qualquer agente de IA, reduzindo a necessidade de prompts longos e repetitivos.
- **Escopo:** documentação apenas, sem alteração funcional.

### 2026-08-06 — Adoção de documentação permanente

- **Decisão:** manter os arquivos de contexto versionados no repositório.
- **Motivo:** garantir que qualquer sessão futura tenha acesso ao estado do projeto, branch ativa, arquitetura e convenções.
- **Status:** ativo.

### 2026-08-06 — Uso de contexto persistente para reduzir prompts

- **Decisão:** agentes devem consultar `docs/agent/` antes de executar tarefas.
- **Motivo:** diminuir consumo de contexto e evitar reexploração de informações já conhecidas.
- **Status:** ativo.

## Decisões de projeto identificadas no repositório

**PENDENTE DE MAPEAMENTO** — adicionar aqui decisões arquiteturais comprovadas encontradas em ADRs, READMEs, comentários ou configurações.

### Sugestão de formato para novas entradas

```markdown
### YYYY-MM-DD — Título da decisão

- **Decisão:** ...
- **Motivo:** ...
- **Impacto:** ...
- **Status:** ativo / revertido / obsoleto
```
