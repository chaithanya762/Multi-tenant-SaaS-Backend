# First login as alpha-admin to get JWT token
$loginBody = @{
    tenantId = "tenant-alpha"
    username = "alpha-admin"
    password = "password123"
} | ConvertTo-Json

$loginHeaders = @{
    "Content-Type" = "application/json"
    "X-Tenant-ID"  = "tenant-alpha"
}

$loginRes = Invoke-RestMethod -Uri "https://multitenant-backend-4lh0.onrender.com/api/v1/auth/login" -Method POST -Body $loginBody -Headers $loginHeaders
$token = $loginRes.accessToken

Write-Host "Creating product..."

$prodBody = @{
    name          = "Enterprise Cloud Router"
    description   = "High performance multi-tenant gateway"
    price         = 499.00
    stockQuantity = 50
} | ConvertTo-Json

$prodHeaders = @{
    "Content-Type"  = "application/json"
    "Authorization" = "Bearer $token"
    "X-Tenant-ID"   = "tenant-alpha"
}

$prodRes = Invoke-RestMethod -Uri "https://multitenant-backend-4lh0.onrender.com/api/v1/products" -Method POST -Body $prodBody -Headers $prodHeaders
$prodRes | ConvertTo-Json
