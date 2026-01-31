# 🚀 Quick Start Guide

**New to this migration? Start here!**

## ⚡ 5-Minute Quick Start

### Step 1: Prerequisites

```powershell
# Check Node.js version (need 18+)
node --version

# Check PostgreSQL (need 14+)
psql --version

# Get Anthropic API key
# Visit: https://console.anthropic.com/
```

### Step 2: Configure Environment

```powershell
# Backend environment
Copy-Item server/.env.example server/.env
# Edit server/.env - set these 3 variables:
# 1. DATABASE_URL=postgresql://user:password@localhost:5432/ai_resume_analyzer
# 2. JWT_SECRET=your-random-secret-here
# 3. ANTHROPIC_API_KEY=sk-ant-your-key

# Frontend environment
Copy-Item .env.example .env
# Edit .env - set:
# VITE_API_URL=http://localhost:3001
```

### Step 3: Setup Database

```powershell
# Automated setup (recommended)
.\setup-db.ps1

# OR Manual setup
createdb ai_resume_analyzer
cd server
npm install
npm run db:generate
npm run db:migrate
cd ..
```

### Step 4: Migrate Code

```powershell
# Automated migration (recommended)
.\migrate.ps1

# OR See MIGRATION.md for manual steps
```

### Step 5: Start Servers

```powershell
# Automated start (recommended)
.\start.ps1

# OR Manual start
# Terminal 1:
cd server
npm run dev

# Terminal 2:
npm run dev
```

### Step 6: Test

```
✅ Backend: http://localhost:3001/health
✅ Frontend: http://localhost:5173
✅ Register a new account
✅ Upload a resume
✅ Verify analysis works
```

---

## 📖 Documentation Map

**Start Here:**

1. `SETUP-COMPLETE.md` - Overview & congratulations
2. `CHECKLIST.md` - Track your progress

**Detailed Guides:** 3. `MIGRATION.md` - Step-by-step migration 4. `server/README.md` - Backend API docs 5. `ARCHITECTURE.md` - System design

**Reference:** 6. `FILES.md` - What was created 7. `README-NEW.md` - Full project README

---

## 🔧 Automation Scripts

| Script         | Purpose                        | When to Use               |
| -------------- | ------------------------------ | ------------------------- |
| `setup-db.ps1` | Setup PostgreSQL database      | First time setup          |
| `migrate.ps1`  | Replace Puter with new backend | Migration time            |
| `start.ps1`    | Start both servers             | Every development session |

---

## 🆘 Common Issues

### ❌ "Database connection failed"

```powershell
# Check PostgreSQL is running
Get-Service postgresql*

# Verify DATABASE_URL in server/.env
```

### ❌ "npm install fails"

```powershell
# Clear cache and retry
npm cache clean --force
npm install
```

### ❌ "Port already in use"

```powershell
# Frontend (5173) or backend (3001) port taken
# Find and kill the process:
Get-NetTCPConnection -LocalPort 3001 | Select-Object OwningProcess
Stop-Process -Id <process-id>
```

### ❌ "AI analysis doesn't work"

- Check ANTHROPIC_API_KEY is set in `server/.env`
- Verify key is valid at console.anthropic.com
- Check server terminal for error messages

---

## 📋 Key Files to Configure

| File          | What to Set       | Example                                  |
| ------------- | ----------------- | ---------------------------------------- |
| `server/.env` | DATABASE_URL      | postgresql://user:pass@localhost:5432/db |
| `server/.env` | JWT_SECRET        | Use random 32+ character string          |
| `server/.env` | ANTHROPIC_API_KEY | sk-ant-api... from console.anthropic.com |
| `.env`        | VITE_API_URL      | http://localhost:3001                    |

---

## 🎯 What You're Building

**Before (Puter.js):**

```
Frontend → Puter SDK → Puter Cloud
                       ├─ Auth
                       ├─ Storage
                       ├─ Database
                       └─ AI Proxy
```

**After (Custom Backend):**

```
Frontend → Your API → Express Server
                      ├─ JWT Auth
                      ├─ File System
                      ├─ PostgreSQL
                      └─ Direct Claude API
```

---

## ✅ Success Checklist

Quick validation that everything works:

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can register new account
- [ ] Can login with credentials
- [ ] Can upload PDF resume
- [ ] Can see resume in list
- [ ] Can view resume details
- [ ] AI analysis completes
- [ ] Can download resume
- [ ] Can delete resume

---

## 🎓 Learning Path

**Beginner:**

1. Read `SETUP-COMPLETE.md`
2. Follow `CHECKLIST.md`
3. Use automation scripts

**Intermediate:**

1. Read `MIGRATION.md` in detail
2. Understand `ARCHITECTURE.md`
3. Review backend code in `server/src`

**Advanced:**

1. Read `server/README.md` API docs
2. Customize endpoints
3. Deploy to production

---

## 🌟 Pro Tips

💡 Use `npm run db:studio` to visually browse your database  
💡 Check browser Network tab to debug API calls  
💡 Monitor server terminal for backend logs  
💡 Use Postman to test API endpoints  
💡 Keep `CHECKLIST.md` updated as you progress

---

## 📞 Need Help?

1. **Check Documentation:**
   - Most answers in `MIGRATION.md`
   - API details in `server/README.md`

2. **Debug:**
   - Check server terminal for errors
   - Check browser console for errors
   - Verify environment variables

3. **Start Fresh:**
   ```powershell
   # Drop database and start over
   psql -U postgres -c "DROP DATABASE ai_resume_analyzer;"
   .\setup-db.ps1
   ```

---

## 🎊 You're Ready!

Follow the 5-Minute Quick Start above and you'll have a working custom backend in no time!

**Questions?** Check the detailed docs listed above.

**Good luck! 🚀**
