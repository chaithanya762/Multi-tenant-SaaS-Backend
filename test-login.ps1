$body = @{
    tenantId = "tenant-3096"
    username = "admin-3096"
    password = "password123"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "X-Tenant-ID"  = "tenant-3096"
}

Write-Host "Logging in..."
$res = Invoke-RestMethod -Uri "https://multitenant-backend-4lh0.onrender.com/api/v1/auth/login" -Method POST -Body $body -Headers $headers
$res | ConvertTo-Json
