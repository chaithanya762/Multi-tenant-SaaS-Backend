# Script to push to GitHub using a Personal Access Token (PAT)
$env:PATH = "C:\Program Files\Microsoft Visual Studio\2022\Community\Common7\IDE\CommonExtensions\Microsoft\TeamFoundation\Team Explorer\Git\cmd;$env:PATH"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " GitHub Personal Access Token Push Helper                 " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$token = Read-Host -Prompt "Please paste your GitHub Personal Access Token (PAT)"

if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Host "Token cannot be empty! Exiting..." -ForegroundColor Red
    exit 1
}

$remoteUrl = "https://chaithanya762:$token@github.com/chaithanya762/Multi-tenant-SaaS-Backend.git"

Write-Host "Pushing code to GitHub..." -ForegroundColor Yellow
git push $remoteUrl main --force

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS! Code pushed to https://github.com/chaithanya762/Multi-tenant-SaaS-Backend" -ForegroundColor Green
} else {
    Write-Host "Push failed. Please verify your token has 'repo' permissions." -ForegroundColor Red
}
