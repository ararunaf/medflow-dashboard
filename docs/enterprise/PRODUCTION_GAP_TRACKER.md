# Production Gap Tracker

| Campo     | Valor                       |
| --------- | --------------------------- |
| Projeto   | MedicFlow-AI                |
| Baseline  | Enterprise Runtime v1.0     |
| Atualizado| Sprint A7-02                |
| Status    | Acompanhamento de pendências|

---

## 1. Providers ainda não implementados

| Capability      | Provider ID | Adapter proposto                  | Status      | Bloqueio |
| --------------- | ----------- | --------------------------------- | ----------- | -------- |
| XML Validation  | —           | `RealTissXMLValidationRuntimeAdapter` | Discovery   | XSDs oficiais da ANS ainda não integrados. |
| Protocol        | `real-tiss` | `RealTissProtocolRuntimeAdapter`      | Activation  | Aguarda certificação.       |
| Persistence     | —           | `RealTissPersistenceRuntimeAdapter`   | Discovery   | Aguarda Protocol. |
| Audit           | —           | `RealTissAuditRuntimeAdapter`         | Discovery   | Aguarda Persistence. |
| Completed       | —           | `RealTissCompletedRuntimeAdapter`     | Discovery   | Aguarda Audit. |

## 2. Funcionalidades estruturais remanescentes

- `XMLValidationRuntimePort`: validação real contra XSDs oficiais da ANS.
- `SOAPRuntimePort`: envio real para webservices das operadoras.
- `OperatorRuntimePort`: negociação de credenciais e endpoints por operadora.
- `AuthorizationRuntimePort`: controle de autorização e tokens de envio.
- `BatchRuntimePort`: ativado e certificado na Sprint A6-03; envio real para operadora depende de `SOAPRuntimePort`/`ProtocolRuntimePort`.
- `ProtocolRuntimePort`: ativado na Sprint A7-02 com `RealTissProtocolRuntimeAdapter`; resolução de protocolo concreto (SOAP/REST/gRPC/mensageria) ainda estrutural.
- `ReturnRuntimePort`: processamento de retornos (glosas, pagamentos).

## 3. Limitações atuais

- Todos os adapters reais até A6-02 geram artefatos estruturais sem I/O externo.
- Não há consumo funcional de HTTP/SOAP/SFTP/DB por nenhum adapter real.
- `RealTissXMLTISSRuntimeAdapter` gera XML TISS sintaticamente válido, mas sem validação XSD funcional.
- `RealTissBatchRuntimeAdapter` prepara o manifesto de lote, mas não envia para operadora.
- `RealTissProtocolRuntimeAdapter` prepara `ProtocolProfile` e `ProtocolResolver` para TISS, mas não seleciona nem envia via SOAP/REST/gRPC/mensageria.
- Os estados da `BatchStateMachine` são declarativos; transições ainda não implementadas.

## 4. Melhorias futuras

- Integrar `XMLValidationRuntimePort` com XSDs oficiais da ANS via `XSDRuntimePort`.
- Popular `OperatorRuntimePort` com profiles reais de operadoras (Amil, SulAmérica, Bradesco, etc.).
- Adicionar cache de tokens no `AuthorizationRuntimePort`.
- Implementar retry real com backoff exponencial no envio SOAP.
- Tornar o `BatchRuntimePort` capaz de agrupar múltiplas guias por operadora/carteira.
- Adicionar métricas de throughput e latência no envio real para operadoras.

## 5. Integrações planejadas

| Integração            | Port responsável           | Sprint alvo |
| --------------------- | -------------------------- | ----------- |
| XSD ANS               | `XSDRuntimePort`           | A7-A8       |
| Envio SOAP operadoras | `SOAPRuntimePort`          | A8-A9       |
| Protocolo de resposta | `ProtocolRuntimePort`      | A9          |
| Persistência de lote  | `PersistenceRuntimePort`   | A9-S1       |
| Auditoria             | `AuditRuntimePort`         | S1          |
| Finalização           | `CompletedRuntimePort`     | S1          |

## 6. Débitos técnicos aprovados

- `cert-output.txt` e `parser-cert-output.txt` permanecem no working tree como artefatos de teste; remoção agendada para sprint de cleanup.
- `docs/enterprise/ENTERPRISE_PRODUCTION_READINESS_AUDIT.md` não está rastreado; decisão de arquivamento/revisão pendente.
- Documentos de certificação (XML, Batch, etc.) ainda dependem de execução manual de testes; não há pipeline CI automatizado.

## 7. Riscos, mitigações e prioridades

| #  | Risco | Impacto | Mitigação | Prioridade | Responsável | Status |
| -- | ----- | ------- | --------- | ---------- | ----------- | ------ |
| 1  | `RealTissBatchRuntimeAdapter` ainda não executa envio real para operadoras | Alto | Manter state machine declarativa; integrar com `SOAPRuntimePort`/`ProtocolRuntimePort` nas próximas sprints | Alta | Enterprise Runtime Team | Em aberto |
| 2  | Falta validação XSD ANS antes do envio | Alto | Ativar `XMLValidationRuntimePort` e `XSDRuntimePort` em A7-A8 | Alta | XML/XSD Team | Em aberto |
| 3  | Credenciais e certificados digitais não estão disponíveis | Alto | Iniciar negociação com operadoras e provisionar ambiente de homologação | Média | DevSecOps | Em aberto |
| 4  | Documentos de certificação dependem de execução manual | Médio | Criar pipeline de testes automatizados para certificações | Média | QA/Platform | Em aberto |
| 5  | Artefatos temporários (`cert-output.txt`, `parser-cert-output.txt`) no working tree | Baixo | Sprint de cleanup após conclusão das certificações de A6 | Baixa | Devin/Automação | Em aberto |
| 6  | `RealTissProtocolRuntimeAdapter` não executa resolução/transporte concreto | Alto | Manter `ProtocolResolver`/`ProtocolProfile` como contratos; adicionar `SOAPRuntimePort`/`OperatorRuntimePort` antes de A8-A9 | Alta | Enterprise Runtime Team | Em aberto |

## 8. Dependências externas futuras

- XSDs oficiais da ANS (TISS 3.05.00 e superiores).
- Documentação de webservices das operadoras (contratos WSDL/SOAP).
- Credenciais e certificados digitais para envio TISS.
- Ambiente de homologação das operadoras para testes End-to-End.

## 8. Roadmap de certificações

```
OCR          ✓
Parser       ✓
Validation   ✓
Enrichment   ✓
XML          ✓
Batch        ✓ (A6-03)
Protocol     ✓ (A7-02)
Persistence  Discovery
Audit        Discovery
Completed    Discovery
```

Após A9-03, executar obrigatoriamente:

**ENTERPRISE END-TO-END PIPELINE CERTIFICATION**

Fluxo oficial:

```
OCR → Parser → Validation → Enrichment → XML → Batch → Protocol → Persistence → Audit → Completed
```

Esta certificação deverá ocorrer **ANTES** do início do **BLOCO S — Enterprise Security Certification**.
