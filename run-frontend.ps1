# Run Claymorphic React Frontend
Write-Host "========================================" -ForegroundColor Magenta
Write-Host " Starting Claymorphic React Frontend UI " -ForegroundColor Magenta
Write-Host " Running on: http://localhost:3000      " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Magenta

Set-Location -Path "$PSScriptRoot\frontend"
cmd /c "npm run dev"
