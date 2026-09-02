# Catálogo real TUSS / CID-10 (TISS-02-DATA)

Substitui o seed mínimo de 12 códigos (`src/lib/enterprise/tiss-catalog/store/seed.ts`)
por dados carregados no Supabase (`tiss_tuss_procedures`, `tiss_cid10_codes` —
migration `supabase/migrations/20260822130000_tiss_procedure_catalog.sql`).

## O que os arquivos em `sample-data/` são — e o que NÃO são

`tuss-sample.csv` e `cid10-sample.csv` são **amostras de desenvolvimento**
(os mesmos ~12 códigos TUSS que já existiam no seed estrutural, mais ~10
códigos CID-10 amplamente conhecidos). Servem para testar o pipeline
localmente. **Não são a tabela oficial completa** e não devem ser tratados
como fonte de verdade em produção.

## Carga de produção

1. Baixe a Terminologia TUSS vigente publicada pela ANS e o arquivo de
   códigos CID-10 do DATASUS.
2. Converta cada um para o formato de colunas esperado pelo importador
   (ver cabeçalho dos CSVs de amostra).
3. Rode:
   ```
   npx tsx scripts/enterprise/tiss-catalog/import-tuss-cid-catalog.ts \
     --tuss caminho/tuss-oficial.csv --cid10 caminho/cid10-oficial.csv
   ```
4. O upsert é idempotente (chave = `tuss_code` / `cid_code`) — pode rodar de
   novo a cada atualização periódica da tabela ANS/DATASUS.

O parser aceita `,` ou `;` como delimitador (detecção automática pelo
cabeçalho — exports do DATASUS costumam usar `;`), campos entre aspas com
vírgula/aspas escapadas embutidas, e remove BOM UTF-8. O upsert roda em
lotes de 500 linhas — não falha com a tabela oficial completa (milhares de
códigos) como falharia com um único request.

## CBHPM

Fora de escopo por ora — é tabela proprietária da AMB, não pública. Assim que
a cooperativa definir a fonte licenciada (arquivo AMB ou exportação de outro
sistema), o mesmo padrão de tabela + importador pode ser replicado para
`tiss_cbhpm_procedures`.

## Como o dado chega até o motor de auditoria

`bindServerTissCatalogStore()` (`src/lib/server/tiss-catalog-backend.ts`) lê as
duas tabelas no boot do servidor e popula o `TISSCatalogStore` compartilhado
(`getSharedEnterpriseTISSCatalogStore()`). O `TISSCatalogPort`/adapter não
mudam — só passam a enxergar dados reais em vez do seed mínimo. As regras
`PRC-003` (TUSS fora do catálogo) e `DIA-003` (CID fora do catálogo, nova)
consultam esse mesmo catálogo via `tiss-knowledge-gateway.ts`.

`DIA-003` nasce com `blocking: false` — ver plano de rollout em modo sombra
antes de promover para bloqueante.
