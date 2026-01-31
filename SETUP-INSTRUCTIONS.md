# Setup Instructions for AI Resume Analyzer

## Current Status: Ready for Configuration

All unnecessary files have been removed and the new backend is in place!

## Required: Configure Environment Variables

### Backend Configuration (server/.env)

Open `server/.env` and set these **3 required variables**:

```env
# 1. PostgreSQL Database URL
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/ai_resume_analyzer

# 2. JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-random-string-here-min-32-characters

# 3. Anthropic API Key (get from https://console.anthropic.com/)
ANTHROPIC_API_KEY=sk-ant-your-api-key-here
```

**How to generate JWT_SECRET:**

```powershell
# Run this to generate a random secret:
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

### Frontend Configuration (.env)

The frontend `.env` is already configured with:

```env
VITE_API_URL=http://localhost:3001
```

No changes needed unless you change the backend port.

---

## Setup Steps

### Step 1: Configure Environment (Do This Now!)

1. **Edit `server/.env`:**
   - Set DATABASE_URL with your PostgreSQL credentials
   - Generate and set JWT_SECRET
   - Add your ANTHROPIC_API_KEY

2. **PostgreSQL Setup:**
   - If you don't have PostgreSQL installed, download from: https://www.postgresql.org/download/
   - Remember your postgres password during installation

### Step 2: Setup Database

Once environment is configured, run:

```powershell
.\setup-db.ps1
```

This will:

- Create the database
- Run migrations
- Create users and resumes tables

### Step 3: Start the Application

```powershell
.\start.ps1
```

This starts both backend and frontend servers.

**Or start manually:**

```powershell
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
npm run dev
```

### Step 4: Test the Application

1. Open http://localhost:5173
2. Click "Register" to create an account
3. Login with your credentials
4. Upload a test resume
5. Verify AI analysis works

---

## Quick Checklist

- [ ] Install PostgreSQL (if not installed)
- [ ] Edit `server/.env` with DATABASE_URL
- [ ] Edit `server/.env` with JWT_SECRET (generate random string)
- [ ] Edit `server/.env` with ANTHROPIC_API_KEY
- [ ] Run `.\setup-db.ps1`
- [ ] Run `.\start.ps1`
- [ ] Test registration and login
- [ ] Test resume upload

---

## Troubleshooting

### Database Connection Error

```powershell
# Check if PostgreSQL is running
Get-Service postgresql*

# If not running, start it:
Start-Service postgresql-x64-14  # or your version
```

### Can't Generate Migrations

- Make sure DATABASE_URL is correct in server/.env
- Make sure PostgreSQL is running
- Database should NOT exist yet (setup-db.ps1 creates it)

### AI Analysis Not Working

- Verify ANTHROPIC_API_KEY is set in server/.env
- Check key is valid at https://console.anthropic.com/
- Make sure you have API credits available

---

## What Was Cleaned Up

Removed files:

- ❌ `app/lib/puter.ts` (old Puter integration)
- ❌ `types/puter.d.ts` (Puter type definitions)
- ❌ `app/routes/wipe.tsx` (Puter-specific route)
- ❌ All `-new.tsx` files (replaced originals)
- ✅ Updated `README.md` with new documentation

---

## Need Help?

- 📖 Full documentation: [README.md](README.md)
- 🚀 Quick start: [QUICK-START.md](QUICK-START.md)
- 📊 Architecture: [ARCHITECTURE.md](ARCHITECTURE.md)
- ✅ Checklist: [CHECKLIST.md](CHECKLIST.md)

---

## Next Steps After Setup

Once everything is running:

1. ✅ Test all features
2. 📝 Read the [README.md](README.md) for deployment options
3. 🎨 Customize the backend as needed
4. 🚀 Deploy to production when ready

**Good luck! 🎉**
