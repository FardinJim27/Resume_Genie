# AI Resume Analyzer - Migration Script
# This script automates the migration from Puter.js to custom backend

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AI Resume Analyzer - Migration Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Backup old files
Write-Host "Step 1: Backing up old files..." -ForegroundColor Yellow
$backupDir = "backup_puter_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

Copy-Item "app/lib/puter.ts" "$backupDir/" -ErrorAction SilentlyContinue
Copy-Item "types/puter.d.ts" "$backupDir/" -ErrorAction SilentlyContinue
Copy-Item "app/root.tsx" "$backupDir/" -ErrorAction SilentlyContinue
Copy-Item "app/routes/auth.tsx" "$backupDir/" -ErrorAction SilentlyContinue
Copy-Item "app/routes/home.tsx" "$backupDir/" -ErrorAction SilentlyContinue
Copy-Item "app/routes/upload.tsx" "$backupDir/" -ErrorAction SilentlyContinue
Copy-Item "app/routes/resume.tsx" "$backupDir/" -ErrorAction SilentlyContinue
Copy-Item "app/components/Navbar.tsx" "$backupDir/" -ErrorAction SilentlyContinue
Copy-Item "app/components/ResumeCard.tsx" "$backupDir/" -ErrorAction SilentlyContinue

Write-Host "✓ Backup created in $backupDir" -ForegroundColor Green

# Step 2: Replace with new files
Write-Host "`nStep 2: Replacing with new implementation..." -ForegroundColor Yellow

Move-Item -Force "app/root-new.tsx" "app/root.tsx" -ErrorAction Stop
Move-Item -Force "app/routes/auth-new.tsx" "app/routes/auth.tsx" -ErrorAction Stop
Move-Item -Force "app/routes/home-new.tsx" "app/routes/home.tsx" -ErrorAction Stop
Move-Item -Force "app/routes/upload-new.tsx" "app/routes/upload.tsx" -ErrorAction Stop
Move-Item -Force "app/routes/resume-new.tsx" "app/routes/resume.tsx" -ErrorAction Stop
Move-Item -Force "app/components/navbar-new.tsx" "app/components/Navbar.tsx" -ErrorAction Stop
Move-Item -Force "app/components/resume-card-new.tsx" "app/components/ResumeCard.tsx" -ErrorAction Stop

Write-Host "✓ Files replaced successfully" -ForegroundColor Green

# Step 3: Remove old Puter files
Write-Host "`nStep 3: Removing Puter dependencies..." -ForegroundColor Yellow

Remove-Item "app/lib/puter.ts" -ErrorAction SilentlyContinue
Remove-Item "types/puter.d.ts" -ErrorAction SilentlyContinue
Remove-Item "app/routes/wipe.tsx" -ErrorAction SilentlyContinue

Write-Host "✓ Old files removed" -ForegroundColor Green

# Step 4: Setup environment files
Write-Host "`nStep 4: Setting up environment files..." -ForegroundColor Yellow

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✓ Frontend .env created (please configure VITE_API_URL)" -ForegroundColor Green
} else {
    Write-Host "! .env already exists, skipping" -ForegroundColor Gray
}

if (-not (Test-Path "server/.env")) {
    Copy-Item "server/.env.example" "server/.env"
    Write-Host "✓ Backend .env created (please configure all variables)" -ForegroundColor Green
} else {
    Write-Host "! server/.env already exists, skipping" -ForegroundColor Gray
}

# Step 5: Install backend dependencies
Write-Host "`nStep 5: Installing backend dependencies..." -ForegroundColor Yellow
Set-Location server
npm install
Set-Location ..
Write-Host "✓ Backend dependencies installed" -ForegroundColor Green

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Migration Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Edit server/.env with your configuration:" -ForegroundColor White
Write-Host "   - DATABASE_URL (PostgreSQL connection)" -ForegroundColor Gray
Write-Host "   - JWT_SECRET (strong random secret)" -ForegroundColor Gray
Write-Host "   - ANTHROPIC_API_KEY (your Claude API key)" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Edit .env with:" -ForegroundColor White
Write-Host "   - VITE_API_URL=http://localhost:3001" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Setup database:" -ForegroundColor White
Write-Host "   cd server" -ForegroundColor Gray
Write-Host "   npm run db:generate" -ForegroundColor Gray
Write-Host "   npm run db:migrate" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Start the servers:" -ForegroundColor White
Write-Host "   Terminal 1: cd server && npm run dev" -ForegroundColor Gray
Write-Host "   Terminal 2: npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "📖 For detailed instructions, see MIGRATION.md" -ForegroundColor Cyan
Write-Host ""
