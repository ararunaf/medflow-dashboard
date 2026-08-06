# AGENT_RULES

## Objetivo

Este documento contém as regras gerais que qualquer agente de IA deve seguir ao trabalhar neste repositório. Ele serve para reduzir ambiguidade, preservar a estabilidade do sistema e garantir que mudanças sejam feitas de forma controlada.

## Princípios de engenharia

- Sempre tratar alterações como mutações em um sistema em produção.
- Preferir mudanças pequenas e isoladas em vez de refatorações grandes.
- Manter o código simples, legível e compatível com o restante da base.
- Não adicionar dependências desnecessárias.
- Seguir as convenções e padrões já existentes no projeto.

## Escopo fechado

- Atuar apenas no escopo da sprint ou da tarefa solicitada.
- Não alterar arquivos ou funcionalidades fora do escopo explicitamente aprovado.
- Se uma alteração exigir mexer em outro componente, isso deve ser comunicado e aprovado antes.

## Funcionalidades homologadas

- Nunca alterar funcionalidades homologadas sem autorização explícita.
- Funcionalidades congeladas devem ser consideradas somente leitura.
- Se uma mudança for inevitável, criar plano de reversão e testes de regressão antes de executar.

## Mudanças fora da sprint

- Nunca executar mudanças que não fazem parte da sprint ativa.
- Não antecipar implementações de sprints futuras.
- Não remover ou alterar funcionalidades planejadas para outras sprints.

## Compatibilidade

- Sempre preservar compatibilidade retroativa, quando aplicável.
- Se a compatibilidade precisar ser quebrada, documentar e aprovar a decisão.
- Evitar mudanças em contratos, interfaces e APIs sem aviso prévio.

## Build

- Build é obrigatório após qualquer alteração que possa afetar o bundle.
- O comando de build está definido em `package.json`.
- Erros de build devem ser resolvidos antes de declarar a conclusão da tarefa.

## Typecheck

- Typecheck é obrigatório após alterações em TypeScript.
- Deve ser executado antes de testes e build, quando relevante.
- Erros de tipagem não devem ser suprimidos sem justificativa documentada.

## Testes

- Testes são obrigatórios após alterações em regras de negócio, comportamento ou contratos.
- Utilizar os scripts de teste definidos no projeto.
- Não modificar testes existentes sem autorização.
- Se um teste falhar, investigar e corrigir a causa raiz.

## Declaração de GO

- Nunca declarar GO sem evidências objetivas.
- Antes de declarar GO, todos os itens do relatório obrigatório devem estar preenchidos.
- Evidências incluem: build, typecheck, testes, status da working tree e hash do commit.

## Relatório obrigatório

Toda entrega deve conter um relatório com os seguintes itens:

- Arquivos alterados
- Build: SIM / NÃO
- Typecheck: SIM / NÃO
- Testes: SIM / NÃO
- Commit: SIM / NÃO
- Push: SIM / NÃO
- Deploy: SIM / NÃO
- Branch
- Hash
- Working tree: limpa / com alterações

## Alterações pequenas

- Priorizar commits pequenos e diretos.
- Cada alteração deve ter um propósito claro.
- Evitar alterar múltiplos domínios em um único commit.

## Regressões

- Prevenir regressões é mais importante que adicionar funcionalidades rapidamente.
- Sempre executar o conjunto mínimo de validações do projeto.
- Se houver indício de regressão, parar e investigar antes de continuar.

## Consumo de contexto

- Minimizar o consumo de contexto durante a execução.
- Usar os documentos de contexto do projeto como fonte primária.
- Evitar reprocessar arquivos desnecessários a cada interação.
- Não carregar todo o repositório na memória quando apenas uma parte for suficiente.
