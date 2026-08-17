$body = @{
    tenantId = "test-tenant-99"
    username = "testadmin99"
    email    = "test99@example.com"
    password = "password123"
    role     = "ADMIN"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "X-Tenant-ID"  = "test-tenant-99"
}

try {
    $response = Invoke-RestMethod -Uri "https://multitenant-backend-4lh0.onrender.com/api/v1/auth/register" -Method POST -Body $body -Headers $headers
    Write-Host "SUCCESS:"
    $response | ConvertTo-Json -Depth 5
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "HTTP STATUS: $statusCode"
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $responseBody = $reader.ReadToEnd()
    $reader.Close()
    Write-Host "RESPONSE BODY: $responseBody"
}
