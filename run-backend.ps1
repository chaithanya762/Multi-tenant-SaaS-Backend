# Run Multi-Tenant SaaS Backend with Java 17
$mvnPath = "C:\Users\admin\.m2\wrapper\dists\apache-maven-3.9.16\0daed3be3ebd1c706f0e69e8b07c6b73f5cc4ea3dfce72a8d0ec2e849ca2ddb0\bin\mvn.cmd"
if (-not (Test-Path $mvnPath)) {
    $mvnPath = "mvn"
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Starting Multi-Tenant SaaS Backend     " -ForegroundColor Cyan
Write-Host " Java Version: Java 17                   " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

# Test if PostgreSQL is running on port 5432
$pgConn = Test-NetConnection -ComputerName localhost -Port 5432 -WarningAction SilentlyContinue

if ($pgConn.TcpTestSucceeded) {
    Write-Host "Detected PostgreSQL running on port 5432! Using PostgreSQL RLS profile." -ForegroundColor Green
    & $mvnPath spring-boot:run
} else {
    Write-Host "PostgreSQL not detected on port 5432. Starting with In-Memory 'local' H2 profile..." -ForegroundColor Yellow
    & $mvnPath spring-boot:run "-Dspring-boot.run.profiles=local"
}

