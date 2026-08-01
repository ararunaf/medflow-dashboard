# EPC-02 — Migration Plan (Strangler Fig)

**Sprint:** EPC-02 — Storage Ports Foundation  
**Data:** 31/07/2026  
**Princípio:** migrar pouco, provar sempre, nunca big-bang

---

## 1. Estado atual (após EPC-02)

| Item | Estado |
|------|--------|
| `StoragePort` | Existe |
| `SupabaseStorageAdapter` | Existe (default) |
| `MockStorageAdapter` | Existe (test/mock/simulação) |
| Provider `createStoragePort` | Existe |
| Módulos de negócio no Port | **0** (intencional) |
| PoC Application | 1 (demo health summary — só testes) |
| Uploads / downloads / buckets legados | **Inalterados e em uso** |
| Document Identity (EPC-08) | Tipos preparados; **não** implementado |

---

## 2. Estratégia

```
Fase A (EPC-02)     Fundar Port + Adapter + convenções + prep Document Identity  ← FEITO
Fase B              Migrar 1 fluxo de storage baixo risco por vez
Fase C              Bind runtime Supabase ao client legado (mesmo comportamento)
Fase D              Opcional: adapters azure-blob / s3 / gcs / nas / local / sharepoint
Fase E              EPC-08 Document Identity (campos já aceitos na options bag)
Fase F              Remover imports diretos de Storage SDK no Application
```

Cada fase exige: build + TypeScript + ESLint + testes + smoke = PASS, e zero mudança perceptível ao usuário (exceto quando a sprint for explicitamente funcional).

---

## 3. Ordem sugerida de migração (futuro)

Prioridade por **baixo risco / baixo acoplamento**:

1. **Helpers isolados de leitura/assinatura** (signed URL de um único path, sem side effects)
2. **Download de artefatos não-PHI / não-críticos** (se existirem)
3. **Upload de um único fluxo** com testes de paridade byte-a-byte / metadata
4. **Captura Inteligente / OCR input storage** — somente após paridade e feature flag se necessário
5. **Bindings multi-provedor por tenant** — após adapters + config platform

**Nunca** iniciar por: troca de bucket em produção, migração massiva de paths, ou cutover multi-cloud sem certificação.

---

## 4. Receita por módulo (checklist)

Para cada módulo candidato:

1. [ ] Identificar operações de storage usadas (put/get/delete/signedUrl)
2. [ ] Mapear keys lógicas (sem expor bucket no Domain)
3. [ ] Implementar/bind adapter Supabase que **reutiliza o mesmo comportamento atual** (copy behavior, don’t optimize)
4. [ ] Passar `document?: StorageDocumentContext` quando disponível (EPC-08)
5. [ ] Injetar `StoragePort` no composition root / server fn do módulo
6. [ ] Testes de paridade (mesmo input → mesmo output / mesma URL assinada semanticamente)
7. [ ] Remover import direto de Storage SDK **somente daquele módulo**
8. [ ] Atualizar docs enterprise + certificação da sprint

---

## 5. Como adicionar outro provedor (futuro)

1. Implementar `XxxStorageAdapter implements StoragePort`
2. Registrar em `createStoragePort`
3. Binding por ambiente/tenant **somente** após EPC de config/bindings
4. Certificar paridade com suite de regressão (upload/download/signedUrl)
5. Supabase permanece default até cutover explícito aprovado

Mock/Test já disponíveis para desenvolvimento e certificação sem vendor.

---

## 6. Anti-padrões (bloquear em review)

- Migrar “todo Upload/OCR/Captura” numa PR
- Renomear buckets/paths “já que estamos mexendo”
- Expor `SupabaseClient.storage` no Port “só por um tempo”
- Domain importar `@supabase/storage-js` / clients de storage
- Introduzir segundo provedor em produção sem adapter + certificação
- Tornar campos de Document Identity obrigatórios sem sprint EPC-08

---

## 7. Critério de conclusão da trilha Storage

A trilha Storage (além de EPC-02) só se considera madura quando:

- Application/Domain não importam SDK de object storage
- Todo I/O de documentos passa por `StoragePort`
- Adapter default Supabase preserva buckets/permisões atuais
- Existe pelo menos um adapter de teste usado na CI
- Document Identity (EPC-08) integrado sem quebra de assinatura
- Documentação de cutover multi-provedor publicada

EPC-02 **não** exige esses critérios finais — apenas a fundação.
