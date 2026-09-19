# Job Prep AI

A full-stack GenAI web application that helps job seekers go from **resume → tailored to a specific job → interview-ready**, using Google Gemini for the AI analysis and a MERN-style stack for everything else.

Inspired by a full-stack Gen AI tutorial project, rebuilt from scratch with a cleaner architecture, structured (schema-enforced) AI output instead of fragile prompt-parsing, proper security practices, and a portfolio-ready codebase.

---

## Features

- **Authentication** — Register/Login with JWT, bcrypt password hashing, protected routes
- **Resume Skill-Gap Analysis** — Upload a PDF resume + paste a job description → Gemini returns a match score (0–100), matched skills, missing skills, and a summary
- **AI Interview Question Generator** — 8 tailored questions (technical + behavioral) with answer tips, generated per report
- **ATS-Optimized Resume Generator** — Gemini rewrites your resume content into a clean, ATS-friendly format, downloadable as a PDF (via Puppeteer)
- **Dashboard** — History of all past reports, average match score, delete old reports
- **Rate limiting** on AI routes (cost & abuse control)
- **Structured AI output** — Gemini calls use JSON schemas (`responseSchema`), so responses are always valid, typed JSON — never regex-parsed text

---

## Tech Stack

**Frontend:** React, Vite, React Router v6, Tailwind CSS, Axios
**Backend:** Node.js, Express, MongoDB, Mongoose
**Auth:** JWT, bcryptjs
**AI:** Google Gemini via `@google/genai`
**PDF:** Puppeteer (HTML → PDF) + pdf-parse (resume text extraction)

---

## Architecture

```
Request → Route → Middleware (auth / rate limit) → Controller → Service (Gemini/PDF) → Model (MongoDB) → Response
```

Backend layers are strictly separated — no business logic lives in `server.js` or route files.

```
job-prep-ai/
├── backend/
│   ├── server.js
│   ├── .env.example
│   └── src/
│       ├── config/db.js
│       ├── models/           User.js, Report.js
│       ├── routes/           auth, ai, report
│       ├── controllers/      auth, ai, report
│       ├── services/         gemini.service.js, pdf.service.js, resumeParser.service.js
│       ├── middleware/       auth, error, rateLimiter
│       └── utils/            ApiError.js, asyncHandler.js
└── frontend/
    ├── .env.example
    └── src/
        ├── api/               axios instance + endpoint functions
        ├── context/           AuthContext
        ├── routes/            ProtectedRoute
        ├── components/        Navbar, Loader
        ├── pages/             Login, Register, Dashboard, Analyze, ReportDetail, InterviewPrep
        └── App.jsx
```

---

## Database Design (MongoDB / Mongoose)

**User**
| Field | Type |
|---|---|
| name | String |
| email | String (unique) |
| password | String (bcrypt hash) |
| timestamps | createdAt, updatedAt |

**Report**
| Field | Type |
|---|---|
| user | ObjectId → User |
| resumeText | String (extracted from PDF) |
| jobDescription | String |
| matchScore | Number (0–100) |
| matchedSkills | [String] |
| missingSkills | [String] |
| summary | String |
| interviewQuestions | [{ question, type, idealAnswerTips }] |
| atsResumeHtml | String |
| timestamps | createdAt, updatedAt |

---

## AI Integration Flow

1. User uploads a PDF resume + pastes a job description
2. Backend extracts resume text with `pdf-parse`
3. `gemini.service.js` sends the resume + JD to Gemini with a **JSON schema** (`responseSchema`), guaranteeing structured output — no manual JSON parsing of free text
4. Result is saved to MongoDB and returned to the frontend
5. The same pattern is reused for interview question generation and ATS resume generation
6. The ATS resume's HTML is rendered to a PDF with Puppeteer only when the user clicks "Download"

The Gemini API key is **only ever used on the backend** — it is never sent to or accessible from the frontend.

---

## Authentication Flow

1. Register → password hashed with bcrypt → JWT issued
2. Login → password compared with bcrypt → JWT issued
3. Frontend stores the JWT and attaches it as `Authorization: Bearer <token>` on every request (Axios interceptor)
4. Backend `protect` middleware verifies the JWT and attaches `req.user` before any protected controller runs

---

## API Documentation

### Auth

**POST /api/auth/register**
- Auth: No
- Body: `{ name, email, password }`
- Response: `201 { success, data: { id, name, email, token } }`
- Errors: `400` missing fields / weak password, `409` email already exists

**POST /api/auth/login**
- Auth: No
- Body: `{ email, password }`
- Response: `200 { success, data: { id, name, email, token } }`
- Errors: `400` missing fields, `401` invalid credentials

**GET /api/auth/me**
- Auth: Yes
- Response: `200 { success, data: user }`
- Errors: `401` invalid/missing token

### AI

**POST /api/ai/analyze**
- Auth: Yes (rate-limited)
- Body: `multipart/form-data` → `resume` (PDF file), `jobDescription` (text)
- Response: `201 { success, data: report }`
- Errors: `400` missing/invalid file or JD, `429` rate limit exceeded

**POST /api/ai/:id/interview-questions**
- Auth: Yes (rate-limited)
- Response: `200 { success, data: report }` (with `interviewQuestions` populated)
- Errors: `404` report not found

**POST /api/ai/:id/ats-resume**
- Auth: Yes (rate-limited)
- Response: `200 { success, data: report }` (with `atsResumeHtml` populated)
- Errors: `404` report not found

**GET /api/ai/:id/ats-resume/download**
- Auth: Yes (rate-limited)
- Response: `200` — PDF file stream
- Errors: `400` resume not generated yet, `404` report not found

### Reports

**GET /api/reports** — Auth: Yes — list of the user's reports (lightweight fields only)
**GET /api/reports/:id** — Auth: Yes — full report detail
**DELETE /api/reports/:id** — Auth: Yes — deletes a report

---

## Environment Variables

**backend/.env**
```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=change_this_to_a_long_random_string
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

**frontend/.env**
```
VITE_API_URL=http://localhost:5000/api
```

Never commit real `.env` files — only `.env.example` is checked in.

---

## Installation & Running Locally (Windows / PowerShell)

### 1. Backend
```powershell
cd backend
npm install
copy .env.example .env
# edit .env with your real MongoDB URI, JWT secret, and Gemini API key
npm run dev
```
Backend runs at `http://localhost:5000`.

### 2. Frontend
```powershell
cd frontend
npm install
copy .env.example .env
npm run dev
```
Frontend runs at `http://localhost:5173`.

### 3. Test the flow
1. Open `http://localhost:5173`, register an account
2. Go to "New Analysis", upload a resume PDF and paste a job description
3. View the generated skill-gap report
4. Generate interview questions
5. Generate and download the ATS resume PDF

---

## Deployment

- **Frontend** → Vercel (set `VITE_API_URL` to your deployed backend URL)
- **Backend** → Render/Railway (set all backend env vars; set `CLIENT_URL` to your deployed frontend URL for CORS)
- **Database** → MongoDB Atlas (whitelist your backend host's IP, or `0.0.0.0/0` for simplicity during development)

**Deployment order:** MongoDB Atlas → Backend (Render/Railway) → Frontend (Vercel), since the frontend needs the backend's live URL.

**Puppeteer on Render/Railway:** these platforms support Puppeteer, but you may need to add the buildpack/Chromium dependency per their docs, or switch to a lighter PDF library (e.g. `@react-pdf/renderer`) if you hit deployment issues — this is a common real-world gotcha worth mentioning in interviews.

**Common deployment problems:**
- CORS errors → double check `CLIENT_URL` on the backend matches your deployed frontend's exact origin
- 401 errors after deploy → JWT_SECRET differs between environments, or frontend is pointing at the wrong `VITE_API_URL`
- Gemini errors → make sure `GEMINI_API_KEY` is set on the *backend* host, not the frontend

---

## Known Maintenance Items (be upfront about these — it's good practice)
- `react-router-dom` has a moderate advisory fixed in v7; upgrading requires migrating to v7's data-router APIs (documented breaking change, not applied here to keep the code approachable)
- Puppeteer's transitive dependencies (`@puppeteer/browsers`) carry a few advisories; run `npm audit` periodically and update when a non-breaking fix is available

---

## Future Improvements
- Multiple resume versions per user + side-by-side report comparison
- Email verification and password reset flow
- Streaming AI responses instead of waiting for the full result
- Dark mode
- Export interview questions as a PDF study sheet
