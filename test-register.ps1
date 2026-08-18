$rand = Get-Random -Minimum 1000 -Maximum 9999
$tenantId = "tenant-$rand"
$username = "admin-$rand"

$body = @{
    tenantId = $tenantId
    username = $username
    email    = "admin@$tenantId.com"
    password = "password123"
    role     = "ADMIN"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "X-Tenant-ID"  = $tenantId
}

Write-Host "Registering $username for $tenantId..."
$res = Invoke-RestMethod -Uri "https://multitenant-backend-4lh0.onrender.com/api/v1/auth/register" -Method POST -Body $body -Headers $headers
$res | ConvertTo-Json
