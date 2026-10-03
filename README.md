<div align="center">
  <br />
    <a href="https://github.com/FardinJim27" target="_blank">
      <img src="public/readme/banner.png" alt="Project Banner">
    </a>
  <br />

  <div>

  <br>

   <div>
    <img alt="Static Badge" src="https://img.shields.io/badge/React-4c84f3?style=for-the-badge&logo=react&logoColor=white">
        <img src="https://img.shields.io/badge/-Tailwind-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
        <img src="https://img.shields.io/badge/-TypeScript-black?style=for-the-badge&logoColor=white&logo=typescript&color=3178C6" alt="TypeScript" />
   </div>

  <h3 align="center">🚨 Resume Genie</h3>
</div>

A modern, full-stack AI-powered resume analyzer that provides detailed feedback, ATS scores, and actionable improvement tips for job seekers.

## ✨ Features

- 🔐 **Secure Authentication** - JWT-based user authentication with bcrypt password hashing
- 📄 **PDF Resume Upload** - Upload and analyze PDF resumes with automatic image conversion
- 🤖 **AI-Powered Analysis** - Leverages Anthropic's Claude for intelligent resume evaluation
- 📊 **Comprehensive Scoring** - Get scores for ATS compatibility, tone, content, structure, and skills
- 💡 **Actionable Tips** - Receive specific, actionable improvement suggestions
- 📱 **Responsive Design** - Beautiful, mobile-friendly interface
- 🗂️ **Resume History** - Track all your analyzed resumes in one place

## 🏗️ Architecture

### Tech Stack

**Frontend:**

- React 19 with TypeScript
- React Router v7
- Tailwind CSS
- Zustand (state management)
- Vite (build tool)

**Backend:**

- Node.js + Express
- TypeScript
- PostgreSQL (database)
- Drizzle ORM
- JWT authentication
- Anthropic Claude API

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ ([Download](https://nodejs.org/))
- PostgreSQL 14+ ([Download](https://www.postgresql.org/download/))
- Anthropic API Key ([Get one](https://console.anthropic.com/))

### Option 1: Automated Migration (If upgrading from Puter)

\`\`\`powershell

# Run migration script

.\migrate.ps1

# Follow the prompts and complete setup steps

\`\`\`

### Option 2: Manual Setup

#### 1. Clone and Install

\`\`\`bash

# Install frontend dependencies

npm install

# Install backend dependencies

cd server
npm install
cd ..
\`\`\`

#### 2. Configure Environment

**Frontend (.env):**
\`\`\`bash
cp .env.example .env

# Edit .env and set:

VITE_API_URL=http://localhost:5173
\`\`\`

**Backend (server/.env):**
\`\`\`bash
cp server/.env.example server/.env

# Edit server/.env and set:

# - DATABASE_URL

# - JWT_SECRET

# - ANTHROPIC_API_KEY

\`\`\`

#### 3. Setup Database

\`\`\`bash

# Create database

createdb ai_resume_analyzer

# Generate and run migrations

cd server
npm run db:generate
npm run db:migrate
cd ..
\`\`\`

#### 4. Start Development Servers

\`\`\`bash

# Terminal 1 - Backend

cd server
npm run dev

# Terminal 2 - Frontend

npm run dev
\`\`\`

Or use the start script:
\`\`\`powershell
.\start.ps1
\`\`\`

#### 5. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5173
- **API Health**: http://localhost:5173/health

### 🔑 Default Credentials

If you are using the default seeded database (e.g. `server/data-store.json`), you can log in with:

**Admin Account:**
- Email: `fardinjim77@gmail.com` (or `fardinahmed.jim.7@gmail.com`)
- Password: `Password123!`

**Demo User Account:**
- Email: `demo@resumegenie.com`
- Password: `Password123!`

## 📖 Documentation

- [Migration Guide](MIGRATION.md) - Upgrading from Puter.js
- [Backend Documentation](server/README.md) - API docs and backend setup

## 🔑 API Overview

### Authentication

- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Sign in
- `GET /api/auth/me` - Get current user

### Resumes

- `POST /api/resumes/upload` - Upload and analyze
- `GET /api/resumes` - List all resumes
- `GET /api/resumes/:id` - Get specific resume
- `DELETE /api/resumes/:id` - Delete resume

See [Backend README](server/README.md) for complete API documentation.

## 🗄️ Database Schema

### Users

\`\`\`sql
users (
id UUID PRIMARY KEY,
username TEXT UNIQUE,
email TEXT UNIQUE,
password_hash TEXT,
created_at TIMESTAMP,
updated_at TIMESTAMP
)
\`\`\`

### Resumes

\`\`\`sql
resumes (
id UUID PRIMARY KEY,
user_id UUID REFERENCES users(id),
company_name TEXT,
job_title TEXT,
job_description TEXT,
resume_path TEXT,
image_path TEXT,
feedback JSONB,
created_at TIMESTAMP,
updated_at TIMESTAMP
)
\`\`\`

## 🎯 How It Works

1. **Upload**: User uploads PDF resume and provides job details
2. **Convert**: System converts PDF to image for preview
3. **Analyze**: Claude AI analyzes resume against job requirements
4. **Score**: AI provides comprehensive scores across 5 categories:
   - ATS Compatibility
   - Tone & Style
   - Content Quality
   - Structure & Organization
   - Skills Match
5. **Feedback**: User receives detailed tips for improvement

## 📁 Project Structure

\`\`\`
ai-resume-analyzer/
├── app/ # Frontend source
│ ├── components/ # React components
│ ├── lib/ # Utilities (API client, helpers)
│ ├── routes/ # Route components
│ └── root.tsx # App root
├── server/ # Backend source
│ ├── src/
│ │ ├── db/ # Database schema & connection
│ │ ├── lib/ # Utilities (auth, AI)
│ │ ├── middleware/ # Express middleware
│ │ ├── routes/ # API routes
│ │ └── index.ts # Server entry point
│ └── README.md # Backend docs
├── public/ # Static assets
├── types/ # TypeScript types
├── constants/ # App constants
├── MIGRATION.md # Migration guide
├── migrate.ps1 # Migration script
├── start.ps1 # Quick start script
└── package.json # Frontend dependencies
\`\`\`

## 🔒 Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ User-isolated file access
- ✅ Input validation (Zod)
- ✅ SQL injection protection (ORM)
- ✅ CORS configuration
- ✅ File size limits

## 🌐 Deployment

### Backend Deployment

**Option 1: Railway/Heroku**

1. Add PostgreSQL addon
2. Set environment variables
3. Deploy via Git

**Option 2: VPS (DigitalOcean, AWS)**

1. Install Node.js & PostgreSQL
2. Configure environment
3. Use PM2 for process management
4. Setup Nginx reverse proxy

See [Backend README](server/README.md) for detailed deployment instructions.

### Frontend Deployment

**Vercel/Netlify:**

1. Build: \`npm run build\`
2. Deploy \`build/client\` folder
3. Set VITE_API_URL environment variable

## 🧪 Testing

\`\`\`bash

# Run tests (when implemented)

npm test

# Backend tests

cd server
npm test
\`\`\`

## 🛠️ Development

### Code Style

- TypeScript strict mode
- ESLint configuration enforced
- Prettier for formatting
- Component-based architecture

### Adding Features

1. **New API Endpoint**: Add route in \`server/src/routes/\`
2. **New Component**: Add to \`app/components/\`
3. **Database Changes**: Update \`server/src/db/schema.ts\`, run migrations
4. **New Route**: Add to \`app/routes/\`

## 📊 AI Analysis Categories

The system evaluates resumes across 5 key dimensions:

1. **ATS Compatibility** (0-100)
   - Keyword optimization
   - Format compatibility
   - Section organization

2. **Tone & Style** (0-100)
   - Professional language
   - Consistency
   - Voice appropriateness

3. **Content Quality** (0-100)
   - Relevance to job
   - Achievement quantification
   - Impact demonstration

4. **Structure** (0-100)
   - Visual hierarchy
   - Readability
   - Organization

5. **Skills Match** (0-100)
   - Alignment with requirements
   - Technical skills coverage
   - Soft skills demonstration

## 🐛 Troubleshooting

### Database Connection Error

- Ensure PostgreSQL is running
- Verify DATABASE_URL in server/.env
- Check database exists: \`psql -l\`

### File Upload Fails

- Check server/uploads directory exists
- Verify MAX_FILE_SIZE setting
- Check disk space

### AI Analysis Doesn't Work

- Verify ANTHROPIC_API_KEY is valid
- Check API rate limits
- Review server logs

### Frontend Can't Connect to Backend

- Ensure backend is running on port 5173
- Check VITE_API_URL in .env
- Verify CORS settings

## 📝 Environment Variables

### Frontend

\`\`\`env
VITE_API_URL=http://localhost:5173
\`\`\`

### Backend

\`\`\`env
PORT=5173
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/ai_resume_analyzer
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d
ANTHROPIC_API_KEY=your-api-key
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
\`\`\`

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: \`git checkout -b feature/amazing-feature\`
3. Commit changes: \`git commit -m 'Add amazing feature'\`
4. Push to branch: \`git push origin feature/amazing-feature\`
5. Open Pull Request

## 📄 License

MIT License - feel free to use this project for learning or commercial purposes.

## 🙏 Acknowledgments

- Anthropic Claude for AI analysis
- React Router team
- Drizzle ORM team
- All open-source contributors

### 🚀 How to Run the Project

Easiest Way:
cd C:\Users\FJ\ai-resume-analyzer
.\start.ps1

Manual Way:
Terminal 1 - Backend:
cd C:\Users\FJ\ai-resume-analyzer\server
npm run dev

Terminal 2 - Frontend:
cd C:\Users\FJ\ai-resume-analyzer
npm run dev

### 🌐 Access Points

App: http://localhost:5173
API: http://localhost:5173
Health Check: http://localhost:5173/health

### 👨‍💼 Admin Commands

cd C:\Users\FJ\ai-resume-analyzer\server
npm run list-users # List all users
npm run make-admin EMAIL # Make user admin
npm run db:studio # Database GUI

## 📞 Support

- 📧 Email: support@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/FardinJim27/ai-resume-analyzer/issues)
- 📖 Docs: See MIGRATION.md and server/README.md

## 🗺️ Roadmap

- [ ] Multi-language support
- [ ] Export reports to PDF
- [ ] Resume templates
- [ ] Batch analysis
- [ ] Cover letter analysis
- [ ] LinkedIn profile integration
- [ ] Interview preparation tips

---

**Built with ❤️ using React, TypeScript, and Anthropic Claude**
