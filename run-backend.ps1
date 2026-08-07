# Run Multi-Tenant SaaS Backend with Java 17
$env:JAVA_HOME = "C:\Users\system18\.jdks\jdk17"
$env:PATH = "C:\Users\system18\.jdks\jdk17\bin;C:\Users\system18\.m2\maven\bin;$env:PATH"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Starting Multi-Tenant SaaS Backend     " -ForegroundColor Cyan
Write-Host " Java Version: Java 17 (Amazon Corretto)" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

# Test if PostgreSQL is running on port 5432
$pgConn = Test-NetConnection -ComputerName localhost -Port 5432 -WarningAction SilentlyContinue

if ($pgConn.TcpTestSucceeded) {
    Write-Host "Detected PostgreSQL running on port 5432! Using PostgreSQL RLS profile." -ForegroundColor Green
    & "C:\Users\system18\.m2\maven\bin\mvn.cmd" spring-boot:run
} else {
    Write-Host "PostgreSQL not detected on port 5432. Starting with In-Memory 'local' H2 profile..." -ForegroundColor Yellow
    & "C:\Users\system18\.m2\maven\bin\mvn.cmd" spring-boot:run "-Dspring-boot.run.profiles=local"
}
