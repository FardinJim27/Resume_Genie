# AI Resume Analyzer - Migration Guide

## Overview

This guide will help you migrate from Puter.js to the new custom backend.

## What Changed

### Removed

- ❌ Puter.js SDK and dependencies
- ❌ Client-side authentication via Puter
- ❌ Puter's cloud storage
- ❌ Puter's AI API

### Added

- ✅ Custom Express.js backend with TypeScript
- ✅ JWT-based authentication
- ✅ PostgreSQL database
- ✅ Direct Anthropic Claude API integration
- ✅ Local file storage
- ✅ RESTful API architecture

## Migration Steps

### Step 1: Replace Old Files

The new implementation files have been created with `-new` suffix. To activate them:

\`\`\`powershell

# Backend is ready to use in ./server directory

# Frontend - Replace old files with new versions

Move-Item -Force app/lib/api.ts app/lib/api-backup.ts -ErrorAction SilentlyContinue
Move-Item -Force app/root-new.tsx app/root.tsx
Move-Item -Force app/routes/auth-new.tsx app/routes/auth.tsx
Move-Item -Force app/routes/home-new.tsx app/routes/home.tsx
Move-Item -Force app/routes/upload-new.tsx app/routes/upload.tsx
Move-Item -Force app/routes/resume-new.tsx app/routes/resume.tsx
Move-Item -Force app/components/navbar-new.tsx app/components/Navbar.tsx
Move-Item -Force app/components/resume-card-new.tsx app/components/ResumeCard.tsx

# Remove old Puter files

Remove-Item app/lib/puter.ts -ErrorAction SilentlyContinue
Remove-Item types/puter.d.ts -ErrorAction SilentlyContinue
\`\`\`

### Step 2: Setup Backend

\`\`\`powershell

# Navigate to server directory

cd server

# Install dependencies

npm install

# Create .env file

Copy-Item .env.example .env

# Edit .env and configure:

# - DATABASE_URL (PostgreSQL connection string)

# - JWT_SECRET (strong random secret)

# - ANTHROPIC_API_KEY (your Claude API key)

\`\`\`

### Step 3: Setup Database

Make sure PostgreSQL is installed and running.

\`\`\`powershell

# Create database

psql -U postgres -c "CREATE DATABASE ai_resume_analyzer;"

# Generate and run migrations

npm run db:generate
npm run db:migrate
\`\`\`

### Step 4: Update Frontend Configuration

\`\`\`powershell

# Navigate back to root

cd ..

# Create frontend .env

Copy-Item .env.example .env

# Edit .env to set:

# VITE_API_URL=http://localhost:3001

\`\`\`

### Step 5: Run the Application

\`\`\`powershell

# Terminal 1 - Start backend

cd server
npm run dev

# Terminal 2 - Start frontend

cd ..
npm run dev
\`\`\`

## Database Schema

### Users Table

- \`id\` (UUID, Primary Key)
- \`username\` (Text, Unique)
- \`email\` (Text, Unique)
- \`password_hash\` (Text)
- \`created_at\` (Timestamp)
- \`updated_at\` (Timestamp)

### Resumes Table

- \`id\` (UUID, Primary Key)
- \`user_id\` (UUID, Foreign Key → users.id)
- \`company_name\` (Text)
- \`job_title\` (Text)
- \`job_description\` (Text)
- \`resume_path\` (Text)
- \`image_path\` (Text)
- \`feedback\` (JSONB)
- \`created_at\` (Timestamp)
- \`updated_at\` (Timestamp)

## API Endpoints

### Authentication

- \`POST /api/auth/register\` - Register new user
- \`POST /api/auth/login\` - Login user
- \`GET /api/auth/me\` - Get current user (requires auth)

### Resumes

- \`POST /api/resumes/upload\` - Upload and analyze resume
- \`GET /api/resumes\` - Get all user resumes
- \`GET /api/resumes/:id\` - Get specific resume
- \`GET /api/resumes/file/:filename\` - Get resume file
- \`DELETE /api/resumes/:id\` - Delete resume

## Environment Variables

### Backend (.env)

\`\`\`
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/ai_resume_analyzer
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
ANTHROPIC_API_KEY=your-api-key
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
\`\`\`

### Frontend (.env)

\`\`\`
VITE_API_URL=http://localhost:3001
\`\`\`

## Troubleshooting

### Database Connection Issues

- Ensure PostgreSQL is running
- Verify DATABASE_URL credentials
- Check database exists: \`psql -U postgres -l\`

### File Upload Issues

- Check UPLOAD_DIR permissions
- Verify MAX_FILE_SIZE is appropriate
- Ensure disk space available

### Authentication Issues

- Clear browser localStorage
- Verify JWT_SECRET is set
- Check token expiry settings

### AI Analysis Issues

- Verify ANTHROPIC_API_KEY is valid
- Check API rate limits
- Monitor server logs for errors

## Production Deployment

### Backend

1. Set \`NODE_ENV=production\`
2. Use strong JWT_SECRET
3. Configure proper DATABASE_URL
4. Set up file storage (S3/Cloud Storage)
5. Enable HTTPS
6. Configure CORS properly

### Frontend

1. Update VITE_API_URL to production API
2. Build: \`npm run build\`
3. Deploy build folder to hosting
4. Configure environment variables

## Data Migration (from Puter)

If you have existing data in Puter:

1. Export data from Puter KV store
2. Transform to new schema format
3. Import into PostgreSQL database
4. Download files from Puter storage
5. Upload to new file system

_Note: A migration script can be created for automated data transfer._

## Support

For issues or questions:

1. Check server logs: \`server/\` terminal output
2. Check frontend console: Browser DevTools
3. Review this migration guide
4. Check API health: \`http://localhost:3001/health\`

## Next Steps

After successful migration:

1. ✅ Test user registration and login
2. ✅ Upload a test resume
3. ✅ Verify AI analysis works
4. ✅ Check file serving
5. ✅ Test all CRUD operations
6. 🗑️ Delete backup files once stable
7. 📝 Update README.md with new setup instructions
