# Aplica no Supabase as migrations pendentes (supabase db push via npx).
# Lê a senha do banco do .env.local — nada precisa ser digitado.
# Uso (na pasta MedFlow-IA):
#   powershell -ExecutionPolicy Bypass -File scripts\demo\aplicar-migrations.ps1

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..\..")

$linha = Get-Content .env.local | Where-Object { $_ -match '^SUPABASE_DB_PASSWORD=' } | Select-Object -First 1
if (-not $linha) { Write-Host "SUPABASE_DB_PASSWORD nao encontrado no .env.local" -ForegroundColor Red; exit 1 }
$senha = ($linha -replace '^SUPABASE_DB_PASSWORD=', '').Trim()
$url = "postgresql://postgres:$([uri]::EscapeDataString($senha))@db.vbfulflzekrnejwetcyr.supabase.co:5432/postgres"

Write-Host "Aplicando migrations pendentes no Supabase..." -ForegroundColor Cyan
npx -y supabase@latest db push --db-url $url --yes
if ($LASTEXITCODE -eq 0) {
  Write-Host "OK - migrations aplicadas. Pode avisar o Claude." -ForegroundColor Green
} else {
  Write-Host "Falhou (codigo $LASTEXITCODE). Copie a saida acima e envie ao Claude." -ForegroundColor Red
}
