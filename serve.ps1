# Serves the dashboard at http://localhost:8080 (stable localStorage origin).
$port = 8080
$root = $PSScriptRoot

Write-Host "VLM Evaluator — http://localhost:$port" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop." -ForegroundColor DarkGray

if (Get-Command python -ErrorAction SilentlyContinue) {
  Set-Location $root
  python -m http.server $port
  exit $LASTEXITCODE
}

if (Get-Command py -ErrorAction SilentlyContinue) {
  Set-Location $root
  py -m http.server $port
  exit $LASTEXITCODE
}

Write-Host "Python not found. Install Python or open index.html after running: npx serve -l $port" -ForegroundColor Yellow
npx --yes serve -l $port $root
