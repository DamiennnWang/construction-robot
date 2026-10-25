Set-Location -LiteralPath $PSScriptRoot
Write-Host 'Open http://127.0.0.1:8765'
python -m http.server 8765 --bind 127.0.0.1 --directory web
