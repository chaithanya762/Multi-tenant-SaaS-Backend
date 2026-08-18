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

Write-Host "Got JWT Token. Creating order..."

$orderBody = @{
    customerEmail = "customer@acme.com"
    totalAmount   = 299.99
    status        = "COMPLETED"
} | ConvertTo-Json

$orderHeaders = @{
    "Content-Type"  = "application/json"
    "Authorization" = "Bearer $token"
    "X-Tenant-ID"   = "tenant-alpha"
}

$orderRes = Invoke-RestMethod -Uri "https://multitenant-backend-4lh0.onrender.com/api/v1/orders" -Method POST -Body $orderBody -Headers $orderHeaders
$orderRes | ConvertTo-Json
