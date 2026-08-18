$r = Invoke-WebRequest -Uri "https://multitenant-backend-4lh0.onrender.com/" -UseBasicParsing
Write-Host "Length:" $r.Content.Length
if ($r.Content -match "<title>(.*?)</title>") {
    Write-Host "Page Title:" $matches[1]
}
if ($r.Content -match "index-(.*?).js") {
    Write-Host "JS Asset:" $matches[0]
}
