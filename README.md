# NexTime - Smart Scheduling System

## Project Overview
NexTime is an AI-powered scheduling application designed to optimize group coordination and personal productivity. This project is a collaborative effort by the L02-BugFree team.

---

## Tech Stack
- **Backend:** NestJS, MongoDB (Mongoose), Google Gemini AI.
- **Frontend:** React Native (Expo), Tailwind CSS.
- **Infrastructure:** Render (API Deployment), MongoDB Atlas (Database).

---

## Git Workflow (STRICT COMPLIANCE REQUIRED)

### 1. Branching Strategy
- **main**: Production-ready code only. Managed by Leader.
- **develop**: Integration branch for all features.
- **[shortened-name]/[feature-description]**: Individual tasks.
    - **Format:** `[initials][name]/[feature-description]`
    - **Example (Nguyễn Hảo Khang):** `nhkhang/ai-checklist-integration`
    - **Note:** Use hyphens (-) to separate words in the feature description.

### 2. Development Process
1. `git checkout develop && git pull origin develop`
2. `git checkout -b shortened-name/feature-description`
3. Develop & Test locally.
4. `git add . && git commit -m "feat: short description of work"`
5. `git push origin shortened-name/feature-description`
6. Create a **Pull Request (PR)** to `develop` for Leader review.

### 3. Commit Convention
- `feat:` A new feature.
- `fix:` A bug fix.
- `docs:` Documentation changes.
- `style:` Formatting, missing semi-colons, etc.

---

## Guidelines for Team Members

### For Frontend Developers
- **API Reference:** All endpoints are documented at [https://nextime-mobile-app.onrender.com/api-docs](https://nextime-mobile-app.onrender.com/api-docs).
- **Data Integration:** Fetch data from the rendered URL for testing or point to `http://localhost:3000` during local development.
- **Timezone:** Backend stores dates in **UTC**. Frontend must convert to **GMT+7** before rendering.

### For Backend Developers
- **Setup:** Clone the repository and run `npm install` in the `/backend` directory.
- **Resources:** Contact Leader for the `.env` file containing MongoDB URI and Gemini API Key.
- **Local Testing:** Ensure all new APIs are tested via Swagger (Localhost) before pushing.
- **Directory Structure:**
    - `/src/modules`: Contains separate modules (Auth, Schedule, Checklist, etc.).
    - `/src/entities`: Contains Mongoose schemas and DTOs.
- **Requirement:** Every new feature must include proper DTO validation and Swagger decorators.

---

## Getting Started
1. Clone the repository.
2. Install dependencies: `npm install` in both `/backend` and `/frontend`.
3. **Environment:** Copy `.env.example` to `.env` and fill in required keys.
4. **Run Backend:** `npm run start:dev` (Runs on port 3000).
5. **Run Frontend:** `npx expo start`.

---

## Current Milestones (Phase 1 Completed)
- [x] **Auth Module:** Register, Login, JWT, OTP Mock, and Hard Delete Cascade.
- [ ] **Schedule Engine:** Oneshot/Weekly events and Monthly Calendar Flattening.
- [ ] **Social Graph:** Strict Visibility, Mutual Friends check, Friend Requests, and Blocking.
- [ ] **Room & Chat:** Self-chat, Direct 1-1, and Group Rooms.
- [ ] **Heatmap & Polls:** Group availability heatmap and auto-scheduling polls.
- [ ] **AI Checklist Integration:** Mock endpoint created (Pending Gemini SDK connection).
- [ ] **Frontend Development:** Ongoing.

