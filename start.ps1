# Quick Start Script for AI Resume Analyzer

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AI Resume Analyzer - Quick Start" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if migration has been run
if (Test-Path "app/root-new.tsx") {
    Write-Host "[WARNING] Migration not completed yet!" -ForegroundColor Yellow
    Write-Host "Please run: .\migrate.ps1 first" -ForegroundColor Red
    Write-Host ""
    exit 1
}

# Check environment files
$envOk = $true

if (-not (Test-Path ".env")) {
    Write-Host "[ERROR] Frontend .env file missing" -ForegroundColor Red
    $envOk = $false
}

if (-not (Test-Path "server/.env")) {
    Write-Host "[ERROR] Backend .env file missing" -ForegroundColor Red
    $envOk = $false
}

if (-not $envOk) {
    Write-Host ""
    Write-Host "Please create .env files from .env.example" -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] Environment files found" -ForegroundColor Green

# Start backend
Write-Host "`nStarting backend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm run dev"

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Start frontend
Write-Host "Starting frontend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "[OK] Servers Starting!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend:  http://localhost:3001" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend:  http://localhost:3001" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Check the new terminal windows for server logs" -ForegroundColor Gray
Write-Host ""
