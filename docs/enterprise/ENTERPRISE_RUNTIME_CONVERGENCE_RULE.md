# ENTERPRISE_RUNTIME_CONVERGENCE_RULE

**Status:** Vigente a partir da Sprint ARC-24 (2026-08-10)  
**Escopo:** Convergência do pipeline operacional Capture com a Enterprise Runtime Foundation  
**Documento irmão:** [`ARC24_ENTERPRISE_RUNTIME_CONVERGENCE_DISCOVERY.md`](./ARC24_ENTERPRISE_RUNTIME_CONVERGENCE_DISCOVERY.md)  
**Plano de execução:** [`ENTERPRISE_RUNTIME_MIGRATION_PLAN.md`](./ENTERPRISE_RUNTIME_MIGRATION_PLAN.md)

---

## Regra permanente

1. **Um único pipeline oficial pós-convergência**  
   Após o cutover das sprints EPC-24A–EPC-24E, o único pipeline documental oficial do MedicFlow-AI é o **Enterprise Canonical Runtime Pipeline**, acessado exclusivamente via `getEnterpriseRuntime()`.

2. **Proibido dual-path permanente**  
   Não é permitido manter, após cutover certificado, dois caminhos funcionais paralelos para a mesma responsabilidade documental (ex.: parser produto + Extraction Runtime ambos “oficiais”). Dual-path temporário só sob AER explícito e data de encerramento.

3. **Composition root único**  
   Produto e adapters de aplicação **nunca** instanciam Adapters Enterprise concretos fora de `getEnterpriseRuntime()` / factories oficiais do Runtime.

4. **Orquestração canônica**  
   A orquestração E2E documental deve migrar de cadeias imperativas em `capture-server` para o **Canonical Execution Orchestrator** coordenando Ports. O Orquestrador não embute regra de negócio; Ports/Adapters executam.

5. **Preservar Foundations; migrar comportamento**  
   Runtimes estruturais (Bloco C, F3-CAP, INF, DIP) são **preservados** e ativados. Engines de produto equivalentes são **migradas** para esses Ports — não reescritas do zero e não duplicadas.

6. **Sem reconstrução do sistema**  
   Convergência é *strangler fig*. Proibido big-bang rewrite de Capture, Auth, RLS, UI ou modelo de sessão em uma única sprint.

7. **Ports reais primeiro**  
   Priorizar ativação de Ports já existentes com adapters reais (OCR, Storage, AI, TISS Catalog/RulePack) antes de criar novos módulos. Novos módulos só se ARC/EPC descobrir gap de Port inexistente.

8. **Remoção só após paridade**  
   Componentes marcados REMOVER só saem após: testes de paridade + build/tsc/lint/smoke + certificação da sprint. Remoção prematura é bloqueio de review.

9. **XML e TISS de faturamento**  
   Export XML / lote / protocolo / operadora devem convergir para a stack Enterprise (XML* + Bloco C). `xml-export-service` proprietário não é o destino arquitetural.

10. **Exceções controladas**  
    Qualquer desvio desta regra exige entrada no `ARCHITECTURAL_EXCEPTION_REGISTER.md` com status Aceita/Resolvida e plano de fechamento.

---

## Classificação obrigatória de componentes

Toda mudança de convergência deve classificar o artefato:

| Classe | Significado | Destino |
|--------|-------------|---------|
| **PRESERVAR** | Canônico Enterprise ou produto não-substituível (UI/RLS) | Manter |
| **MIGRAR** | Comportamento operacional que deve viver em Foundation/Port | Mover lógica; depois remover origem |
| **REMOVER** | Dual-path, morto, ou duplicata pós-paridade | Apagar só após gate |
| **ESTRUTURAL** | Foundation wired sem negócio | Ativar; não deletar por “não usado ainda” |
| **RUNTIME-USED** | Já no caminho produto | Expandir; não bypassar |

---

## Anti-padrões (bloquear em review)

- Criar nova engine produto “enquanto a Enterprise não fica pronta”
- Chamar Adapter concreto do módulo Capture sem passar pelo Runtime
- Reabrir dual-path OCR ou TISS knowledge já resolvidos (OCR-01, TISS-CONV-01)
- “Limpar” módulos estruturais Bloco C/INF porque ainda são mock
- Migrar todos os estágios Capture numa única PR
- Alterar regras de negócio “já que estamos migrando”
- Declarar convergência completa sem fechar AER-GA03-A1

---

## Vigência

Esta regra é **permanente** para o MedicFlow-AI a partir de ARC-24. Sprints EPC-24A–EPC-24E e posteriores devem aplicá-la sem exceção silenciosa.
