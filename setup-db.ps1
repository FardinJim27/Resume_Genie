# Database Setup Script for AI Resume Analyzer

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Database Setup - AI Resume Analyzer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path "server/.env")) {
    Write-Host "[ERROR] server/.env file not found!" -ForegroundColor Red
    Write-Host "Please create it from server/.env.example first" -ForegroundColor Yellow
    exit 1
}

# Extract DATABASE_URL from .env
$envContent = Get-Content "server/.env"
$dbUrl = ($envContent | Select-String -Pattern "^DATABASE_URL=(.+)$").Matches.Groups[1].Value

if (-not $dbUrl) {
    Write-Host "[ERROR] DATABASE_URL not found in server/.env" -ForegroundColor Red
    exit 1
}

Write-Host "Found DATABASE_URL: $dbUrl" -ForegroundColor Gray
Write-Host ""

# Parse database name from URL
if ($dbUrl -match "\/([^\/\?]+)(\?|$)") {
    $dbName = $matches[1]
    Write-Host "Database name: $dbName" -ForegroundColor Cyan
} else {
    Write-Host "[ERROR] Could not parse database name from URL" -ForegroundColor Red
    exit 1
}

# Check if psql is available
$psqlAvailable = Get-Command psql -ErrorAction SilentlyContinue

if (-not $psqlAvailable) {
    Write-Host "[ERROR] psql command not found" -ForegroundColor Red
    Write-Host "Please install PostgreSQL and add it to PATH" -ForegroundColor Yellow
    Write-Host "Download from: https://www.postgresql.org/download/" -ForegroundColor Gray
    exit 1
}

Write-Host "[OK] PostgreSQL client found" -ForegroundColor Green
Write-Host ""

# Check if database exists
Write-Host "Checking if database exists..." -ForegroundColor Yellow
$dbExists = psql -U postgres -lqt 2>$null | Select-String -Pattern "\b$dbName\b" -Quiet

if ($dbExists) {
    Write-Host "[OK] Database '$dbName' already exists" -ForegroundColor Green
    $recreate = Read-Host "Do you want to recreate it? (y/N)"
    
    if ($recreate -eq 'y' -or $recreate -eq 'Y') {
        Write-Host "Dropping existing database..." -ForegroundColor Yellow
        psql -U postgres -c "DROP DATABASE IF EXISTS $dbName;" 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] Database dropped" -ForegroundColor Green
        } else {
            Write-Host "[ERROR] Failed to drop database" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "Skipping database creation" -ForegroundColor Gray
        $skipCreate = $true
    }
}

# Create database
if (-not $skipCreate) {
    Write-Host "`nCreating database '$dbName'..." -ForegroundColor Yellow
    psql -U postgres -c "CREATE DATABASE $dbName;" 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Database created successfully" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Failed to create database" -ForegroundColor Red
        Write-Host "You may need to run this with administrator privileges" -ForegroundColor Yellow
        exit 1
    }
}

# Navigate to server directory
Write-Host "`nNavigating to server directory..." -ForegroundColor Yellow
Set-Location server

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Generate migrations
Write-Host "`nGenerating database migrations..." -ForegroundColor Yellow
npm run db:generate 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Migrations generated" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to generate migrations" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# Run migrations
Write-Host "`nRunning database migrations..." -ForegroundColor Yellow
npm run db:migrate 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Migrations applied successfully" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to apply migrations" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# Return to root directory
Set-Location ..

# Verify tables
Write-Host "`nVerifying database tables..." -ForegroundColor Yellow
$tables = psql -U postgres -d $dbName -c "\dt" 2>&1

if ($tables -match "users" -and $tables -match "resumes") {
    Write-Host "[OK] Tables created successfully" -ForegroundColor Green
    Write-Host "  - users table" -ForegroundColor Gray
    Write-Host "  - resumes table" -ForegroundColor Gray
} else {
    Write-Host "[WARNING] Could not verify tables" -ForegroundColor Yellow
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Database Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Database: $dbName" -ForegroundColor White
Write-Host "Status: Ready" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Start the backend server:" -ForegroundColor White
Write-Host "   cd server" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "2. In another terminal, start the frontend:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "Or use the quick start script:" -ForegroundColor White
Write-Host "   .\start.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "Optional: View database in Drizzle Studio:" -ForegroundColor Cyan
Write-Host "   cd server" -ForegroundColor Gray
Write-Host "   npm run db:studio" -ForegroundColor Gray
Write-Host ""
