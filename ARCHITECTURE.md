# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│                    (React + TypeScript)                      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Routes     │  │  Components  │  │   API Store  │      │
│  │              │  │              │  │   (Zustand)  │      │
│  │ - Auth       │  │ - Navbar     │  │              │      │
│  │ - Home       │  │ - FileUpload │  │ - login()    │      │
│  │ - Upload     │  │ - ResumeCard │  │ - register() │      │
│  │ - Resume     │  │ - Summary    │  │ - upload()   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           │ HTTP/HTTPS
                           │ (JWT in Authorization header)
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                         BACKEND                              │
│                  (Express + TypeScript)                      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    API Routes                         │   │
│  │                                                       │   │
│  │  /api/auth/*        /api/resumes/*                   │   │
│  │  - POST /register   - POST /upload                   │   │
│  │  - POST /login      - GET  /                         │   │
│  │  - GET  /me         - GET  /:id                      │   │
│  │                     - DELETE /:id                    │   │
│  │                     - GET  /file/:filename           │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                  │
│  ┌────────────────┐  ┌───┴──────────┐  ┌────────────────┐  │
│  │   Middleware   │  │   Services   │  │   Utilities    │  │
│  │                │  │              │  │                │  │
│  │ - Auth JWT     │  │ - AI Service │  │ - bcrypt       │  │
│  │ - CORS         │  │ - File Store │  │ - JWT          │  │
│  │ - File Upload  │  │              │  │ - Validation   │  │
│  └────────────────┘  └──────────────┘  └────────────────┘  │
│                                                              │
└───────────┬───────────────────────┬──────────────────────────┘
            │                       │
            │                       │
            ↓                       ↓
┌───────────────────────┐  ┌────────────────────┐
│   PostgreSQL          │  │  Anthropic API     │
│   Database            │  │  (Claude)          │
│                       │  │                    │
│  ┌─────────────────┐  │  │  - Resume Analysis │
│  │  users          │  │  │  - AI Feedback     │
│  │  - id           │  │  │  - Scoring         │
│  │  - username     │  │  └────────────────────┘
│  │  - email        │  │
│  │  - password_hash│  │  ┌────────────────────┐
│  └─────────────────┘  │  │  File System       │
│                       │  │  (./uploads)       │
│  ┌─────────────────┐  │  │                    │
│  │  resumes        │  │  │  - PDF files       │
│  │  - id           │  │  │  - Image previews  │
│  │  - user_id (FK) │  │  │  - User isolated   │
│  │  - resume_path  │  │  └────────────────────┘
│  │  - image_path   │  │
│  │  - feedback     │  │
│  └─────────────────┘  │
└───────────────────────┘
```

## Request Flow

### 1. User Registration/Login

```
User → Frontend Form → POST /api/auth/register
                      ↓
              Backend validates input (Zod)
                      ↓
              Hash password (bcrypt)
                      ↓
              Save to PostgreSQL
                      ↓
              Generate JWT token
                      ↓
              Return token + user data
                      ↓
              Frontend stores token in localStorage
```

### 2. Resume Upload & Analysis

```
User → Upload Form → POST /api/resumes/upload (with JWT)
                    ↓
            Auth Middleware verifies JWT
                    ↓
            Save PDF to file system
                    ↓
            Convert PDF to image
                    ↓
            Save image to file system
                    ↓
            Create DB record
                    ↓
            Return resume ID
                    ↓
            Background: Send PDF to Anthropic
                    ↓
            Anthropic analyzes resume
                    ↓
            Parse AI response
                    ↓
            Update DB with feedback
                    ↓
            Frontend polls for completion
```

### 3. View Resume

```
User → Click Resume → GET /api/resumes/:id (with JWT)
                     ↓
             Auth Middleware verifies JWT
                     ↓
             Query DB for resume
                     ↓
             Check user ownership
                     ↓
             Return resume data
                     ↓
             Frontend requests files:
                     ↓
             GET /api/resumes/file/:filename
                     ↓
             Verify user owns file
                     ↓
             Stream file to browser
```

## Data Flow

### Authentication Flow

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│  Client  │────1───→│  Backend │────2───→│   DB     │
│          │         │          │         │          │
│ Login    │         │ Validate │         │ Get User │
│ Form     │         │ Password │         │          │
│          │←───4────│          │←───3────│          │
│          │         │          │         │          │
│ Store    │         │ Generate │         │          │
│ JWT      │         │ JWT      │         │          │
└──────────┘         └──────────┘         └──────────┘
```

### Resume Analysis Flow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Client  │    │  Backend │    │    DB    │    │Anthropic │
│          │    │          │    │          │    │   API    │
│ Upload   │─1→ │ Save     │─2→ │ Create   │    │          │
│ PDF      │    │ Files    │    │ Record   │    │          │
│          │    │          │    │          │    │          │
│          │←─3─│ Return   │    │          │    │          │
│          │    │ ID       │    │          │    │          │
│          │    │          │    │          │    │          │
│          │    │ Analyze  │─4─→│          │─5→ │ Analyze  │
│          │    │(Background)   │          │    │          │
│          │    │          │    │          │←─6─│ Feedback │
│          │    │          │─7→ │ Update   │    │          │
│          │    │          │    │ Feedback │    │          │
│          │    │          │    │          │    │          │
│ Poll for │─8→ │ Get      │─9→ │ Return   │    │          │
│ Results  │    │ Resume   │    │ Data     │    │          │
│          │←─10│          │←───│          │    │          │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

## Technology Stack Comparison

### Before (Puter.js)

```
Frontend ─────→ Puter.js SDK ─────→ Puter Cloud Services
                                     ├─ Auth
                                     ├─ Storage
                                     ├─ KV Database
                                     └─ AI Proxy
```

### After (Custom Backend)

```
Frontend ─────→ Custom API ─────→ Express Backend
                                   ├─ JWT Auth
                                   ├─ File System
                                   ├─ PostgreSQL
                                   └─ Direct Anthropic API
```

## Security Architecture

```
┌─────────────────────────────────────────┐
│            Security Layers              │
├─────────────────────────────────────────┤
│                                         │
│  1. Transport Layer (HTTPS in prod)    │
│     └─ Encrypted communication         │
│                                         │
│  2. Authentication Layer               │
│     ├─ JWT tokens with expiry          │
│     └─ Secure password hashing         │
│                                         │
│  3. Authorization Layer                │
│     ├─ User ownership validation       │
│     └─ Resource access control         │
│                                         │
│  4. Input Validation Layer             │
│     ├─ Zod schema validation           │
│     └─ File type/size limits           │
│                                         │
│  5. Database Layer                     │
│     ├─ ORM (SQL injection protection)  │
│     └─ Foreign key constraints         │
│                                         │
│  6. File System Layer                  │
│     └─ User-prefixed filenames         │
│                                         │
└─────────────────────────────────────────┘
```

## Deployment Architecture

### Development

```
localhost:5173 (Vite Dev Server)
      ↓
localhost:3001 (Express Server)
      ↓
localhost:5432 (PostgreSQL)
```

### Production

```
Frontend (Vercel/Netlify)
      ↓ HTTPS
Backend (Railway/Heroku/VPS)
      ↓
PostgreSQL (Managed DB)
```
