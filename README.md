# CampusTrack — Campus Lost and Found Portal

**CampusTrack** is an intelligent full-stack lost-and-found management platform designed for university campuses. Built with **Spring Boot 3 (Java 21)** and **React 18 + Vite**, it combines campus email domain verification, an AI-powered fuzzy matching engine, privacy-first real-time messaging, and comprehensive administration dashboards.

---

## 🛠 Tech Stack

- **Backend:** Java 21, Spring Boot 3.3.4 (Spring Web, Spring Security, Spring Data JPA, Spring WebSocket STOMP)
- **Database:** MySQL 8 / H2 Fallback, Hibernate
- **Authentication:** Stateless JWT (JJWT 0.12.5), BCrypt Hashing, Role-Based Access Control (`ROLE_STUDENT`, `ROLE_ADMIN`)
- **Matching Engine:** Apache Commons Text (Levenshtein Distance & Jaro-Winkler Similarity), Multi-Factor weighted scoring
- **Media Storage:** ImageKit REST API with local fallback
- **Frontend:** React 18, Vite, React Router DOM 6, Axios, Recharts, Lucide React, Canvas Confetti, SockJS & @stomp/stompjs
- **Design System:** Custom Dark/Light Glassmorphic UI with CSS Variables, micro-animations, and responsive layouts

---

## 🚀 Getting Started

### 1. Prerequisites
- **Java 21+** (JDK 21)
- **Maven 3.9+**
- **Node.js 18+** & **NPM**
- **MySQL 8.0** running on `localhost:3306` (or auto-configured via `application.yml`)

### 2. Configure Environment (.env)
The root `.env` holds credentials for ImageKit and Railway:
```env
IMAGEKIT_PRIVATE_KEY=private_C36vB/0tplL6GqemVH6yfMgR0qU=
IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/campustrack
RAILWAY_TOKEN=8c98c321-97fa-4ee5-871e-e61ee58f0dec
```

### 3. Running the Backend
```powershell
cd backend
mvn spring-boot:run
```
Backend runs at `http://localhost:8080`.

### 4. Running the Frontend
```powershell
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`.

---

## 👥 Default Seed Accounts

The system automatically initializes test accounts upon first startup:

| Role | Email | Password | Status |
|---|---|---|---|
| **Admin** | `admin@university.edu` | `Admin@123` | Verified (Access to `/admin`) |
| **Student** | `alex@university.edu` | `Student@123` | Verified |
| **Student** | `sarah@university.edu` | `Student@123` | Verified |
| **Student** | `david@university.edu` | `Student@123` | Pending Verification |

---

## 🌟 Key Features by Milestones

1. **Campus Authentication (Milestone 1)**
   - Registration restricted to authorized campus email domains (`@university.edu`, `@campus.edu`, `@student.edu`, etc.).
   - Role protection: unverified student accounts cannot create listings until approved by an administrator.

2. **Item Posting & Browsing (Milestone 2)**
   - Post Lost or Found items with images (uploaded to ImageKit or local storage fallback).
   - Filter by Type (LOST/FOUND), Category chips, Location / Campus Zone, and Search keywords with pagination.

3. **Intelligent Matching Engine (Milestone 3)**
   - Evaluates multi-factor similarity: title & description fuzzy text matching (tolerant to typos like "walet" vs "wallet"), category bonuses, tag overlap, and campus location proximity.
   - Generates confidence score bars (0–100%) and allows item owners to Confirm or Reject pairings.

4. **In-App Messaging & Privacy (Milestone 4)**
   - Real-time STOMP WebSockets over SockJS (`/ws`) with REST fallback.
   - Privacy-safe: poster emails and phone numbers are never exposed in API payloads.
   - User blocking & moderation reporting with server-side message rejection.

5. **Admin Moderation & Verification (Milestone 5)**
   - Review pending student account registrations.
   - Takedown queue for reported / flagged listings.
   - Listing management and soft-delete capabilities.

6. **Analytics & Metrics Dashboard (Milestone 6)**
   - Recovery rate KPIs and resolution rates.
   - Category distribution bar charts.
   - 14-day activity trend area charts powered by Recharts.

---

## 🧪 Running Automated Tests

```powershell
cd backend
mvn test
```
Tests cover campus email validation, BCrypt password security, JWT token validation, and misspelled fuzzy matching algorithms.


## NVIDIA Nemotron semantic matching

The backend can add semantic similarity to the existing title, description, category, tags, and location matching rules using `nvidia/nemotron-3-embed-1b`. Existing heuristic matching remains active when embeddings are unavailable.

### Configure

Set `NVIDIA_API_KEY` as an environment variable or deployment secret. Do not commit a real key.

Optional environment variables:

- `NVIDIA_API_URL` (default: `https://integrate.api.nvidia.com/v1/embeddings`)
- `NVIDIA_EMBEDDING_MODEL` (default: `nvidia/nemotron-3-embed-1b`)
- `NVIDIA_CONNECT_TIMEOUT_MS` (default: `5000`)
- `NVIDIA_READ_TIMEOUT_MS` (default: `30000`)

New items are embedded on creation, and searchable fields are re-embedded when updated. Vectors and model version are stored on `lost_found_items` and are excluded from normal API JSON responses.

### Backfill existing items

After setting `NVIDIA_API_KEY`, sign in as an admin and call:

```http
POST /api/admin/embeddings/backfill?page=0&size=20
Authorization: Bearer <admin-token>
```

The endpoint processes up to 25 records in each request, using one embedding API call for the pending records in that page. Follow the returned `nextPage` value until it is `null`. Re-running completed pages is safe; current vectors are skipped.

### Notes

- The API uses `input_type=query` for search/query vectors and `input_type=passage` for stored item vectors.
- Semantic similarity is an additional score in the existing MatchingService composite, not a generated answer. This project does not need a generative LLM for semantic matching.
- Match thresholds and weights should be calibrated against reviewed lost/found item pairs before deployment.
- If NVIDIA is unavailable, item posting continues with the existing heuristic matching rules. Items without a vector will not receive a semantic score until backfilled.
