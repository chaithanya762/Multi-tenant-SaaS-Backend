# Push project to GitHub with Git PATH set
$env:PATH = "C:\Program Files\Microsoft Visual Studio\2022\Community\Common7\IDE\CommonExtensions\Microsoft\TeamFoundation\Team Explorer\Git\cmd;$env:PATH"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Pushing Code to GitHub                 " -ForegroundColor Cyan
Write-Host " Repo: https://github.com/chaithanya762/Multi-tenant-SaaS-Backend.git" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

git push -u origin main
