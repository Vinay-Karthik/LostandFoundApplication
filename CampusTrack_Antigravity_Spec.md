# CampusTrack — Campus Lost and Found Portal
### Build Spec for Google Antigravity

**Stack:** Java 21 + Spring Boot 3 (Web, Security, Data JPA, WebSocket) · MySQL 8 · React 18 (Vite) · Cloudinary (image storage) · Railway/Render (hosting)

---

## 0. Global Project Setup (do this first, once)

Give Antigravity this as your first task, in **step-by-step approval** mode:

```
Scaffold a two-repo (or monorepo with /backend and /frontend) project called "CampusTrack".

Backend: Spring Boot 3, Java 21, Maven. Dependencies: spring-boot-starter-web,
spring-boot-starter-security, spring-boot-starter-data-jpa, spring-boot-starter-websocket,
mysql-connector-j, io.jsonwebtoken:jjwt (0.12.x), validation, lombok.

Frontend: React 18 + Vite, react-router-dom, axios, a basic component structure
(pages/, components/, api/).

Create application.yml with placeholders for: MySQL connection (url, username,
password via env vars), JWT secret + expiry, Cloudinary credentials.

Set up the MySQL schema below as JPA entities with Flyway or Hibernate
ddl-auto: update for now.
```

**Database schema (from project spec — use exactly these tables/columns):**

```sql
users
  id            INT PK AUTO_INCREMENT
  name          VARCHAR
  email         VARCHAR UNIQUE      -- must match campus domain, e.g. @university.edu
  password      VARCHAR             -- BCrypt hashed
  role          VARCHAR             -- 'STUDENT' | 'ADMIN'
  verified      BOOLEAN DEFAULT FALSE
  created_at    DATETIME

lost_found_items
  id              INT PK AUTO_INCREMENT
  user_id         INT FK -> users.id
  type            VARCHAR           -- 'LOST' | 'FOUND'
  title           VARCHAR
  description     TEXT
  date_reported   DATE
  location        VARCHAR
  image_url       VARCHAR
  category        VARCHAR
  tags            TEXT              -- comma-separated or normalized join table later
  status          VARCHAR           -- 'OPEN' | 'MATCHED' | 'RESOLVED'
  created_at      DATETIME

matches
  id            INT PK AUTO_INCREMENT
  lost_item_id  INT FK -> lost_found_items.id
  found_item_id INT FK -> lost_found_items.id
  match_score   FLOAT
  status        VARCHAR   -- 'SUGGESTED' | 'CONFIRMED' | 'REJECTED'
  created_at    DATETIME

messages
  id            INT PK AUTO_INCREMENT
  sender_id     INT FK -> users.id
  receiver_id   INT FK -> users.id
  content       TEXT
  timestamp     DATETIME
  is_read       BOOLEAN DEFAULT FALSE

flags
  id            INT PK AUTO_INCREMENT
  item_id       INT FK -> lost_found_items.id
  reported_by   INT FK -> users.id
  reason        TEXT
  reviewed      BOOLEAN DEFAULT FALSE
  created_at    DATETIME
```

---

## Milestone 1 (Week 1) — Authentication & Campus Verification

**Autonomy mode:** step-by-step approval (auth is the highest-risk module)

**Prompt for Antigravity:**
```
Implement authentication for CampusTrack:

1. POST /api/auth/register — accepts name, email, password. Reject if email
   domain doesn't match an allowed campus domain list (config value, e.g.
   @university.edu). Hash password with BCrypt. Set role=STUDENT, verified=false
   by default. First registered admin (or a seeded account) gets role=ADMIN.

2. POST /api/auth/login — validate credentials, issue a JWT containing user id,
   role, and verified status. Access token expiry ~1hr, refresh token optional.

3. Spring Security config: stateless JWT filter, role-based route protection
   (ROLE_STUDENT, ROLE_ADMIN). Unverified accounts can log in but should be
   blocked from posting items until verified — return 403 with a clear message.

4. GET /api/admin/unverified-users — admin-only endpoint listing accounts
   flagged for review, with an approve/reject action.

5. React: Login and Register pages, an auth context/hook storing the JWT
   (in memory, not localStorage, since this is meant to be secure), and
   protected route wrapper.

Write unit tests for: rejecting non-campus emails, password hashing, and
JWT validation.
```

**Acceptance check (Week 1 target):** register with a non-campus email fails; register with a valid campus email succeeds but is unverified; login returns a working JWT; protected routes reject missing/invalid tokens.

---

## Milestone 2 (Weeks 2–3) — Post Lost/Found Items + Tags/Categories

**Autonomy mode:** agent-led with checkpoint review

**Prompt for Antigravity:**
```
Implement item posting for CampusTrack:

1. POST /api/items — authenticated + verified users only. Body: type
   (LOST/FOUND), title, description, date_reported, location, category, tags,
   optional image file. Upload image to Cloudinary, store returned URL in
   image_url.

2. GET /api/items — public/browsable listing with query params: category,
   tags, type, location, search (basic text match on title/description).
   Paginate results.

3. GET /api/items/{id} — item detail view.

4. PATCH /api/items/{id} — owner or admin only, update status/fields.

5. Category list (seed data): electronics, documents, clothing, accessories,
   keys, bags, other. Tags: free-form, but normalize to lowercase.

6. React: a submission form (with image upload preview), a listing/browse
   page with category filter chips and a search bar, and an item detail page.
```

**Acceptance check (Week 3 target):** items post with images, appear in listing, filter by category/tag works, search returns relevant results.

---

## Milestone 3 (Weeks 4–5) — Matching Algorithm + Location-Based Suggestions

**Autonomy mode:** agent-led, review the matching logic output specifically before merging

**Prompt for Antigravity:**
```
Implement the matching engine for CampusTrack:

1. A matching service that, whenever a new item is posted, compares it
   against opposite-type items (LOST vs FOUND) and computes a match_score:
   - Keyword/text similarity on title + description (e.g. Jaccard or cosine
     similarity on tokenized text, or use Apache Commons Text's
     JaroWinklerSimilarity / LevenshteinDistance for fuzzy/misspelled matches)
   - Category match (exact match = bonus weight)
   - Tag overlap (weighted)
   - Location proximity — start simple: exact/partial string match on
     location or campus zone; note in code comments where geocoding could
     later improve this
   - Combine into a single 0–1 match_score

2. Store results above a threshold (e.g. 0.4) in the `matches` table with
   status=SUGGESTED.

3. GET /api/items/{id}/matches — return suggested matches sorted by score,
   for the item owner to review.

4. POST /api/matches/{id}/confirm or /reject — owner action, updates status
   and (if confirmed) marks both items status=MATCHED.

5. Allow filtering the main item browse page by campus zone/building
   (add a `zone` field or reuse `location` with a controlled list of
   building names).

6. React: show suggested matches on the item detail page with a confidence
   indicator, and confirm/reject buttons.

Write tests for the similarity scoring function with a few misspelled-word
cases (e.g. "wallet" vs "walet").
```

**Acceptance check (Week 5 target):** posting a found item that resembles an existing lost item generates a visible suggested match; fuzzy/misspelled titles still match; confirming a match updates both items.

---

## Milestone 4 (Week 6) — Chat + Privacy Controls

**Autonomy mode:** step-by-step approval (privacy-sensitive)

**Prompt for Antigravity:**
```
Implement in-app chat for CampusTrack:

1. WebSocket endpoint (STOMP over SockJS) at /ws, authenticated via JWT
   handshake. Channel per conversation between two matched users
   (e.g. /topic/chat/{conversationId}).

2. POST /api/messages — fallback REST endpoint to send a message
   (sender_id, receiver_id, content), persisted to `messages` table,
   broadcast over WebSocket to the receiver if connected.

3. GET /api/messages/{userId} — conversation history between the current
   user and userId, marking messages as read.

4. Privacy: never expose raw email/phone in any item, match, or user API
   response unless the user has explicitly opted to share contact info in
   a message. Add a POST /api/users/report and /api/users/block endpoint —
   blocked users' messages are rejected server-side, not just hidden in UI.

5. React: a chat interface component (conversation list + message thread),
   triggered from a confirmed match, with a block/report button.
```

**Acceptance check (Week 6 target):** two users on a confirmed match can exchange real-time messages; neither user's email/phone appears anywhere in API responses; blocking a user prevents further messages from them.

---

## Milestone 5 (Week 7) — Admin Panel + Moderation

**Autonomy mode:** agent-led

**Prompt for Antigravity:**
```
Implement admin moderation for CampusTrack:

1. GET /api/admin/items — all items, admin-only, with filters for
   status/category/flagged.

2. PATCH /api/admin/items/{id} — admin edit or soft-delete (status=REMOVED),
   with a reason logged.

3. POST /api/flags — any authenticated user can flag an item (reason text),
   creating a row in `flags` with reviewed=false.

4. GET /api/admin/flags — admin queue of unreviewed flags, with the related
   item and reporter shown.

5. POST /api/admin/flags/{id}/resolve — mark reviewed=true, optionally
   remove the associated item.

6. React: an admin dashboard section with a table of all items (sortable/
   filterable), and a separate flagged-content queue with approve/remove
   actions.
```

**Acceptance check (Week 7 target):** flagging an item creates a review-queue entry; admin can remove or dismiss flags; removed items disappear from public browse.

---

## Milestone 6 (Week 8) — Reporting Dashboard + Engagement Metrics

**Autonomy mode:** agent-led

**Prompt for Antigravity:**
```
Implement analytics/reporting for CampusTrack:

1. GET /api/admin/stats/summary — counts: total items reported, items
   matched, items resolved/recovered, breakdown by category and by
   date range (accept ?from=&to= query params).

2. GET /api/admin/stats/engagement — active users (logged in within last
   N days), message volume (count over time, e.g. daily buckets), post
   frequency over time.

3. Consider a lightweight `analytics_logs` table if you want to avoid
   recomputing aggregates on every request, or just query directly with
   grouped SQL for this scale.

4. React: admin dashboard charts (use a simple chart library — Recharts
   or Chart.js) — bar chart for items by category, line chart for
   posts/matches over time, simple stat cards for totals.
```

**Acceptance check (Week 8 / final target):** dashboard shows accurate totals matching the DB, charts render correctly filtered by date/category, admin functions from Milestone 5 still work end-to-end.

---

## Suggested Antigravity Workflow

1. Run **Global Setup** once, review the scaffold before continuing.
2. Feed each milestone prompt **one at a time**, in order — don't queue all six at once, since later milestones depend on earlier schema/API decisions being stable.
3. After each milestone, run the **Acceptance check** yourself (or ask Antigravity to write a quick smoke test) before moving on.
4. Keep Milestones 1 and 4 in step-by-step approval mode; the rest can run more autonomously.
5. Deploy to Railway/Render only after Milestone 2 is working end-to-end (auth + posting), so you have something demoable early — don't wait until Week 8.

---

## Making Antigravity Itself Work Well for This Project

Antigravity has a couple of features worth deliberately using here, since this project spans 6 sequential milestones that all depend on shared conventions (entity names, DTO shape, response formats):

**1. Save conventions to its knowledge base after Milestone 0 and after Milestone 1.**
Once the scaffold is approved, explicitly tell it:
```
Save the following to your knowledge base for this project: the entity/package
structure, naming conventions (DTO vs Entity vs Request/Response classes),
the JWT claim structure, and the standard API error response shape.
Reuse these conventions in every subsequent milestone.
```
Do this again after Milestone 1 (auth), since the JWT/role conventions established there get reused in every later milestone (matching ownership checks, chat auth, admin route protection). Skipping this step is the most common reason agent output drifts inconsistent across a multi-week build — each milestone re-inventing its own patterns instead of matching what came before.

**2. Use inline artifact comments for the two review-gated milestones (Auth, Chat).**
Rather than re-prompting from scratch if something's off, leave a comment directly on the generated artifact (e.g. "this endpoint should verify the requester owns this item before allowing edit") — this is the intended feedback loop and keeps the agent's context anchored to the actual code it wrote, rather than you re-describing it in prose.

**3. Mixed autonomy per milestone, not globally.**
Set autonomy per-task rather than once for the whole project:
- Milestones 1 & 4 → step-by-step approval
- Milestones 0, 2, 3, 5, 6 → agent-led with a checkpoint review at the end

**4. If using Antigravity 2.0's scheduled tasks**, set up a recurring task to re-run your acceptance-check smoke tests after each milestone lands, rather than remembering to do it manually — useful once you're several milestones in and don't want a later change silently breaking Week 1's auth flow.
