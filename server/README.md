<div align="center">
  <br />
    <a href="https://github.com/FardinJim27" target="_blank">
      <img src="public/readme/banner.png" alt="Project Banner">
    </a>
  <br />

  <div>

# AI Resume Analyzer Backend

A production-ready Express.js + TypeScript backend for the AI Resume Analyzer application.

## Features

- 🔐 **JWT Authentication** - Secure user authentication with bcrypt password hashing
- 📁 **File Storage** - Local file system storage with user isolation
- 🤖 **AI Integration** - Anthropic Claude API for resume analysis
- 💾 **PostgreSQL Database** - Structured data storage with Drizzle ORM
- 🛡️ **Type Safety** - Full TypeScript implementation
- 🚀 **RESTful API** - Clean, documented API endpoints

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Drizzle
- **AI**: Anthropic Claude
- **Authentication**: JWT + bcrypt

## Quick Start

### Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- Anthropic API key

### Installation

\`\`\`bash

# Install dependencies

npm install

# Create environment file

cp .env.example .env

# Edit .env with your configuration

# - DATABASE_URL: PostgreSQL connection string

# - JWT_SECRET: Strong random secret

# - ANTHROPIC_API_KEY: Your Claude API key

\`\`\`

### Database Setup

\`\`\`bash

# Create database

createdb ai_resume_analyzer

# OR using psql

psql -U postgres -c "CREATE DATABASE ai_resume_analyzer;"

# Generate migrations

npm run db:generate

# Run migrations

npm run db:migrate

# (Optional) Open database studio

npm run db:studio
\`\`\`

### Running the Server

\`\`\`bash

# Development mode with hot reload

npm run dev

# Production build

npm run build
npm start
\`\`\`

Server will run on \`http://localhost:3001\`

## Project Structure

\`\`\`
server/
├── src/
│ ├── db/
│ │ ├── index.ts # Database connection
│ │ └── schema.ts # Database schema
│ ├── lib/
│ │ ├── auth.ts # Authentication utilities
│ │ └── ai.ts # AI service integration
│ ├── middleware/
│ │ └── auth.ts # JWT middleware
│ ├── routes/
│ │ ├── auth.ts # Auth endpoints
│ │ └── resumes.ts # Resume endpoints
│ └── index.ts # App entry point
├── drizzle/ # Database migrations
├── uploads/ # File storage (gitignored)
├── .env # Environment variables
├── drizzle.config.ts # Drizzle configuration
├── package.json
└── tsconfig.json
\`\`\`

## API Documentation

### Authentication

#### Register User

\`\`\`http
POST /api/auth/register
Content-Type: application/json

{
"username": "johndoe",
"email": "john@example.com",
"password": "securepass123"
}

Response: 201 Created
{
"user": {
"id": "uuid",
"username": "johndoe",
"email": "john@example.com"
},
"token": "jwt-token"
}
\`\`\`

#### Login

\`\`\`http
POST /api/auth/login
Content-Type: application/json

{
"email": "john@example.com",
"password": "securepass123"
}

Response: 200 OK
{
"user": { ... },
"token": "jwt-token"
}
\`\`\`

#### Get Current User

\`\`\`http
GET /api/auth/me
Authorization: Bearer {token}

Response: 200 OK
{
"id": "uuid",
"username": "johndoe",
"email": "john@example.com"
}
\`\`\`

### Resumes

#### Upload Resume

\`\`\`http
POST /api/resumes/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

FormData:

- resume: File (PDF)
- image: File (PNG/JPG, optional)
- companyName: string
- jobTitle: string
- jobDescription: string

Response: 201 Created
{
"id": "resume-uuid",
"message": "Resume uploaded, analysis in progress"
}
\`\`\`

#### Get All Resumes

\`\`\`http
GET /api/resumes
Authorization: Bearer {token}

Response: 200 OK
[
{
"id": "uuid",
"companyName": "Google",
"jobTitle": "Frontend Developer",
"feedback": { ... },
...
}
]
\`\`\`

#### Get Resume by ID

\`\`\`http
GET /api/resumes/:id
Authorization: Bearer {token}

Response: 200 OK
{
"id": "uuid",
"companyName": "Google",
"feedback": { ... },
...
}
\`\`\`

#### Get File

\`\`\`http
GET /api/resumes/file/:filename
Authorization: Bearer {token}

Response: 200 OK
(File stream)
\`\`\`

#### Delete Resume

\`\`\`http
DELETE /api/resumes/:id
Authorization: Bearer {token}

Response: 200 OK
{
"message": "Resume deleted successfully"
}
\`\`\`

## Environment Variables

\`\`\`env

# Server

PORT=3001
NODE_ENV=development

# Database

DATABASE_URL=postgresql://user:password@localhost:5432/ai_resume_analyzer

# JWT

JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

# AI Service

ANTHROPIC_API_KEY=your-anthropic-api-key

# File Storage

UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
\`\`\`

## Database Schema

### Users

- id (UUID, PK)
- username (Text, Unique)
- email (Text, Unique)
- password_hash (Text)
- created_at (Timestamp)
- updated_at (Timestamp)

### Resumes

- id (UUID, PK)
- user_id (UUID, FK → users)
- company_name (Text)
- job_title (Text)
- job_description (Text)
- resume_path (Text)
- image_path (Text)
- feedback (JSONB)
- created_at (Timestamp)
- updated_at (Timestamp)

## Security Features

- ✅ Password hashing with bcrypt (10 rounds)
- ✅ JWT token-based authentication
- ✅ User-isolated file access
- ✅ Input validation with Zod
- ✅ SQL injection protection (Drizzle ORM)
- ✅ CORS configuration
- ✅ File size limits

## AI Analysis

The system uses Anthropic's Claude 3.7 Sonnet for resume analysis:

- Analyzes PDF resumes directly
- Evaluates ATS compatibility
- Assesses tone, style, content, structure, skills
- Provides actionable improvement tips
- Returns structured JSON feedback

## Deployment

### Production Checklist

- [ ] Set strong JWT_SECRET
- [ ] Configure production DATABASE_URL
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS
- [ ] Configure CORS for production domain
- [ ] Set up file storage (S3/Cloud)
- [ ] Configure logging
- [ ] Set up monitoring
- [ ] Configure rate limiting
- [ ] Set up backup strategy

### Deployment Options

1. **VPS/Cloud (DigitalOcean, AWS EC2)**
   - Install Node.js and PostgreSQL
   - Clone repo and configure .env
   - Use PM2 for process management
   - Set up Nginx reverse proxy

2. **Platform as a Service (Heroku, Railway)**
   - Add PostgreSQL addon
   - Configure environment variables
   - Deploy via Git push

3. **Containerized (Docker)**
   - Build Docker image
   - Deploy to any container platform

## Development

### Code Style

- TypeScript strict mode enabled
- ESM modules
- Async/await for async operations
- Error handling in all routes

### Testing

\`\`\`bash

# Run tests (when implemented)

npm test
\`\`\`

### Database Management

\`\`\`bash

# Generate new migration

npm run db:generate

# Run migrations

npm run db:migrate

# Open database studio

npm run db:studio
\`\`\`

## Troubleshooting

### Database Connection Errors

- Verify PostgreSQL is running
- Check DATABASE_URL format
- Ensure database exists

### File Upload Errors

- Check UPLOAD_DIR exists and is writable
- Verify MAX_FILE_SIZE setting
- Check disk space

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
API: http://localhost:3000
Health Check: http://localhost:3000/health

### 👨‍💼 Admin Commands

cd C:\Users\FJ\ai-resume-analyzer\server
npm run list-users # List all users
npm run make-admin EMAIL # Make user admin
npm run db:studio # Database GUI

### AI Analysis Errors

- Verify ANTHROPIC_API_KEY is valid
- Check API rate limits
- Monitor API usage/billing

## License

MIT

## Support

For issues, feature requests, or questions, please open an issue on GitHub.
