# Migration Checklist

Use this checklist to ensure a smooth migration from Puter.js to the custom backend.

## Pre-Migration

- [ ] Read `SETUP-COMPLETE.md` overview
- [ ] Read `MIGRATION.md` detailed guide
- [ ] Review `ARCHITECTURE.md` to understand system design
- [ ] Ensure PostgreSQL is installed
- [ ] Ensure Node.js 18+ is installed
- [ ] Get Anthropic API key from console.anthropic.com

## Backend Setup

- [ ] Navigate to `/server` directory
- [ ] Run `npm install`
- [ ] Create `.env` file from `.env.example`
- [ ] Set `DATABASE_URL` in `.env`
- [ ] Set `JWT_SECRET` in `.env` (use a strong random string)
- [ ] Set `ANTHROPIC_API_KEY` in `.env`
- [ ] Create PostgreSQL database: `createdb ai_resume_analyzer`
- [ ] Generate migrations: `npm run db:generate`
- [ ] Run migrations: `npm run db:migrate`
- [ ] Test backend starts: `npm run dev`
- [ ] Verify health endpoint: http://localhost:3001/health

## Frontend Setup

- [ ] Create `.env` file from `.env.example` in root
- [ ] Set `VITE_API_URL=http://localhost:3001` in `.env`
- [ ] Run migration script: `.\migrate.ps1` OR manually replace files
- [ ] Verify no compilation errors: `npm run typecheck`

## File Migration (Manual Method)

If not using `migrate.ps1`, manually replace these files:

- [ ] Replace `app/root.tsx` with `app/root-new.tsx`
- [ ] Replace `app/routes/auth.tsx` with `app/routes/auth-new.tsx`
- [ ] Replace `app/routes/home.tsx` with `app/routes/home-new.tsx`
- [ ] Replace `app/routes/upload.tsx` with `app/routes/upload-new.tsx`
- [ ] Replace `app/routes/resume.tsx` with `app/routes/resume-new.tsx`
- [ ] Replace `app/components/Navbar.tsx` with `app/components/navbar-new.tsx`
- [ ] Replace `app/components/ResumeCard.tsx` with `app/components/resume-card-new.tsx`
- [ ] Delete `app/lib/puter.ts`
- [ ] Delete `types/puter.d.ts`
- [ ] Delete `app/routes/wipe.tsx`

## Testing

- [ ] Start backend: `cd server && npm run dev`
- [ ] Start frontend: `npm run dev`
- [ ] Test user registration at `/auth`
- [ ] Test user login
- [ ] Test resume upload at `/upload`
- [ ] Verify AI analysis completes (check resume detail page)
- [ ] Test resume preview images load
- [ ] Test resume PDF download
- [ ] Test resume list on home page
- [ ] Test logout functionality
- [ ] Test resume deletion

## Verification

- [ ] Backend running on port 3001
- [ ] Frontend running on port 5173
- [ ] Database has `users` table
- [ ] Database has `resumes` table
- [ ] `/server/uploads` directory exists
- [ ] No console errors in browser
- [ ] No errors in backend terminal
- [ ] JWT tokens stored in localStorage
- [ ] Files uploaded to `/server/uploads`

## Production Preparation

- [ ] Review `server/README.md` deployment section
- [ ] Set strong `JWT_SECRET` for production
- [ ] Configure production `DATABASE_URL`
- [ ] Set `NODE_ENV=production`
- [ ] Configure CORS for production domain
- [ ] Set up HTTPS/SSL
- [ ] Configure file storage (S3/Cloud alternative)
- [ ] Set up monitoring/logging
- [ ] Configure rate limiting
- [ ] Set up database backups

## Cleanup (After Successful Migration)

- [ ] Delete `-new` suffixed files (if any remain)
- [ ] Delete backup directory created by `migrate.ps1`
- [ ] Remove Puter-related imports (should be done by migration)
- [ ] Update main `README.md` with `README-NEW.md` content
- [ ] Commit changes to version control
- [ ] Tag release (e.g., `v2.0.0-custom-backend`)

## Troubleshooting Completed

If you encountered issues, mark which ones were resolved:

- [ ] Database connection issues → Fixed
- [ ] JWT authentication errors → Fixed
- [ ] File upload failures → Fixed
- [ ] AI analysis not working → Fixed
- [ ] CORS errors → Fixed
- [ ] Frontend can't connect to backend → Fixed

## Notes

Use this space to track any customizations or issues:

```
Date: ___________
Notes:
_____________________________________________
_____________________________________________
_____________________________________________
_____________________________________________
```

## Support Resources Used

- [ ] Reviewed `MIGRATION.md`
- [ ] Reviewed `server/README.md`
- [ ] Reviewed `ARCHITECTURE.md`
- [ ] Checked PostgreSQL logs
- [ ] Checked backend server logs
- [ ] Checked browser console
- [ ] Checked Network tab in DevTools

---

**Migration Status:**

- [ ] Not Started
- [ ] In Progress
- [ ] Completed Successfully
- [ ] Completed with Issues (document above)

**Completion Date:** ****\_\_\_****

**Migrated By:** ****\_\_\_****
