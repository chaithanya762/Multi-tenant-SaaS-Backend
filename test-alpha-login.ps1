$body = @{
    tenantId = "tenant-alpha"
    username = "alpha-admin"
    password = "password123"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "X-Tenant-ID"  = "tenant-alpha"
}

try {
    $res = Invoke-RestMethod -Uri "https://multitenant-backend-4lh0.onrender.com/api/v1/auth/login" -Method POST -Body $body -Headers $headers
    $res | ConvertTo-Json
} catch {
    Write-Host "STATUS:" $_.Exception.Response.StatusCode.value__
    $sr = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    Write-Host "BODY:" $sr.ReadToEnd()
    $sr.Close()
}
