# DIP-03 — OCR Runtime Foundation

**Sprint:** DIP-03 — OCR Runtime Foundation  
**Plataforma:** MedicFlow Enterprise — Document Intelligence Platform  
**Padrão:** ECS-01 (Port / Adapter / Store / Factory / Provider)  
**Composition root:** Enterprise Runtime (ARCH-01)

---

## 1. Objetivo

Criar a infraestrutura oficial do OCR Runtime da plataforma Enterprise.

Toda futura implementação de OCR deverá obrigatoriamente utilizar esta infraestrutura.
Nenhum Provider poderá ser acessado diretamente pelo produto.

---

## 2. Escopo (estrutural apenas)

### Inclui

- Módulo `src/lib/enterprise/ocr-runtime/`
- `OCRRuntimePort`, adapters default/mock, store in-memory, factory, provider
- Modelos canônicos OCR
- Capabilities tecnológicas registradas como FALSE / informativas
- Referências estruturais a providers futuros (Azure, Google Vision, AWS Textract, Tesseract, Mock)
- Integração com Enterprise Runtime, Capture Engine Runtime e Canonical Execution Orchestrator
- Migração estrutural do fluxo oficial de captura para passar pelo OCR Runtime
- Suite `enterprise:ocr-runtime:test`
- Documentação DIP-03

### Explicitamente fora de escopo

- OCR real / extração de texto / interpretação documental
- Conexão com Azure Document Intelligence
- Conexão com Google Vision / Document AI
- Conexão com AWS Textract
- Conexão com Tesseract
- Qualquer serviço externo / HTTP / credenciais
- Mudança de comportamento de produto, UI, API ou migrations

---

## 3. Fluxo oficial

```
Produto
  ↓
Enterprise Runtime
  ↓
Capture Engine Runtime
  ↓
OCRRuntimePort
  ↓
Canonical Execution Orchestrator
  ↓
OCR Provider Adapter (estrutural — EPC-15)
  ↓
Provider futuro (referência apenas)
```

---

## 4. Componentes

| Artefato | Responsabilidade |
|----------|------------------|
| `OCRRuntimePort` | Contrato único de coordenação OCR |
| `DefaultOCRRuntimeAdapter` | Bridge Orchestrator + OCR Provider Adapter |
| `MockOCRRuntimeAdapter` | Homologação / isolamento de contrato |
| `InMemoryOCRRuntimeStore` | Estado in-process de sessões |
| `OCRRuntimeFactory` | Materializa o adapter pedido |
| `createOCRRuntimePort` (OCRRuntimeProvider) | Entry point de composição |
| Modelos canônicos | Sessão / request / result / identity / metadata / capabilities / configuration / reference |

---

## 5. Integração de produto

O bridge oficial de captura (`registerCaptureDocumentIntakeBridge`) permanece best-effort e inalterado na superfície.

Internamente:

1. Produto chama `getEnterpriseRuntime().registerCaptureDocumentIntake(...)`
2. Enterprise Runtime delega a `CaptureEngineRuntimePort.registerCapture`
3. Capture Engine coordena Intake (DIP-01/02) e chama `OCRRuntimePort.coordinateOcr`
4. OCR Runtime inicia execução no Orchestrator e consulta health/capabilities do OCR Provider Adapter
5. **Não** chama `process()`, não extrai texto, não conecta vendor

---

## 6. Comando de teste

```bash
npm run enterprise:ocr-runtime:test
```

---

## 7. Relação com EPC-15

EPC-15 (`ocr-provider`) permanece a fundação do Processing Provider OCR (mock).
DIP-03 é o Runtime de coordenação da Document Intelligence Platform.
O Runtime referencia o Adapter EPC-15 estruturalmente; nunca o produto acessa o Provider diretamente.
