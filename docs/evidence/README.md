# Evidências — Auditoria Forense MedicFlow-AI

**Data de coleta:** 08/06/2026  
**Repositório auditado:** `medflow-dashboard` (`MedFlow-IA/MedFlow-IA/`)

## Arquivos de evidência

| Arquivo | Descrição |
|---------|-----------|
| `directory-tree-src.txt` | Árvore completa do diretório `src/` |
| `components-list.txt` | Lista de 61 componentes em `src/components/` |
| `migrations-list.txt` | 29 migrations SQL com metadados |
| `tables-from-migrations.txt` | Declarações `CREATE TABLE` extraídas |
| `clinical-term-search.txt` | Resultado da busca forense por termos clínicos |
| `01-login.png` … `12-ajuda.png` | Screenshots das rotas implementadas |

## Comandos de coleta

```powershell
tree /F /A src > directory-tree-src.txt
Get-ChildItem src\components -Recurse -File > components-list.txt
Get-ChildItem supabase\migrations -File > migrations-list.txt
Select-String -Path "supabase\migrations\*.sql" -Pattern "CREATE TABLE" > tables-from-migrations.txt
```

## Probe Supabase (staging)

Projeto: `utodixhxrvegzafcldpu`

Tabelas clínicas: HTTP 404  
Tabelas operacionais (`tiss_guides`, `shifts`, `profiles`, `tenants`): HTTP 200
