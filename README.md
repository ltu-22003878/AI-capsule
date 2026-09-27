# AI Capsule

A full-stack CRUD application for saving and managing AI prompts, with GitHub OAuth login and JWT-protected API routes, deployed to a real public cloud platform.

## 1. Deployed URL & Platform

**Live URL:** https://ai-capsule-lldk.onrender.com
**Platform:** Render (free tier, Node web service)

## 2. Installation & Run Instructions

### Prerequisites
Node.js (v18+)
A GitHub OAuth App (see Section 4)

### Local setup

```bash
# Clone the repo
git clone https://github.com/ltu-22003878/AI-capsule.git
cd AI-capsule

# Install backend dependencies
npm install

# Create a .env file in the root with:
# GITHUB_CLIENT_ID=your_client_id
# GITHUB_CLIENT_SECRET=your_client_secret
# JWT_SECRET=your_random_secret
# BASE_URL=http://localhost:3000

# Build the React frontend and start the server
npm run build
npm start
```

The app will be available at `http://localhost:3000`.

### Frontend-only development (with hot reload)

```bash
cd client
npm install
npm run dev
```

This runs the Vite dev server, which proxies `/api` requests to the Express backend running on port 3000 (see `client/vite.config.js`).

## 3. API Routes & Frontend–Backend Communication

| Route | Access | Purpose |
|---|---|---|
| `/` | Public | Landing page |
| `/login` | Public | Starts OAuth login |
| `/dashboard` | Protected | Shows the authenticated user's capsules |
| `GET /api/health` | Public | Returns `{ "status": "ok" }` |
| `GET /api/capsules` | Protected | Read the user's own records |
| `POST /api/capsules` | Protected | Create a new record |
| `PUT /api/capsules/:id` | Protected | Update an existing record (owner only) |
| `DELETE /api/capsules/:id` | Protected | Delete a record (owner only) |

The React frontend and Express backend are served from the **same origin** — Express serves the built React app as static files, with a catch-all route falling back to `index.html` so client-side routing (React Router) works on refresh. Because both run on the same domain in production, the frontend talks to the backend using plain same-origin `fetch()` calls (e.g. `fetch('/api/capsules')`), and the browser automatically attaches the JWT cookie to every request — no CORS configuration or manual token handling is needed.

## 4. OAuth & JWT

**OAuth provider:** GitHub OAuth.

**Flow:**
  1. The user clicks "Continue with GitHub" on `/login`, linking to `GET /api/auth/github`.
  2. Express redirects the user to GitHub's authorization page.
  3. GitHub redirects back to `GET /api/auth/github/callback` with an authorization code.
  4. Express exchanges that code for a GitHub access token, then calls GitHub's `/user` API to get the user's GitHub ID and username.
  5. Express signs its **own** application JWT (using the `jsonwebtoken` package) containing the GitHub user ID (`sub`) and username — **not** the GitHub access token itself.
  6. That JWT is stored in a cookie named `token`, set with `httpOnly: true`, `secure: true`, and `sameSite: 'lax'`.

**Verification:** Every `/api/capsules` route runs through a `requireAuth` middleware that calls `jwt.verify()` on the `token` cookie. If the cookie is missing, malformed, or fails signature verification, the middleware returns `401 Unauthorized` immediately, before any database query runs.

**Logout:** `POST /api/auth/logout` clears the `token` cookie.

## 5. Environment Variables

| Variable | Purpose |
|---|---|
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret |
| `JWT_SECRET` | Secret used to sign/verify the application JWT |
| `BASE_URL` | The app's own public base URL (used to build the OAuth callback URL) |
| `PORT` | Set automatically by Render; falls back to 3000 locally |

No secret values are stored in this repository or committed to git. All of the above are set as environment variables on Render, and locally in a gitignored `.env` file.

## 6. Database

**Engine:** SQLite (via `better-sqlite3`).
**Initialisation:** The `capsules` table is created automatically on server startup via `CREATE TABLE IF NOT EXISTS` in `db.js` — no manual migration step is required.
**Ownership:** Each capsule row stores a `user_id`, set to the GitHub user ID taken from the **verified JWT** (`req.user.sub`), never from client-submitted data. Every `SELECT`, `UPDATE`, and `DELETE` query includes `WHERE user_id = ?`, so a user can only ever read or modify their own records.
**Persistence:** Storage is **ephemeral** on Render's free tier — the SQLite file lives on a temporary filesystem, so data may be lost after a restart or redeploy.

## 7. Required cURL Tests (against the deployed URL)

**Test 1 — no authentication:**
```bash
curl -i https://ai-capsule-lldk.onrender.com/api/capsules
```
Result:

HTTP/1.1 401 Unauthorized
{"error":"Unauthorized"}


**Test 2 — fake/invalid JWT:**
```bash
curl -i -H "Cookie: token=fake-token-123" https://ai-capsule-lldk.onrender.com/api/capsules
```
Result:

HTTP/1.1 401 Unauthorized
{"error":"Unauthorized"}


Both tests confirm the backend rejects requests with no token and requests with an invalid token, without leaking any capsule data.

## 8. Limitation

SQLite storage on Render's free tier is **ephemeral** — the database file is not persisted across restarts or redeploys, so saved capsules may be lost if the service restarts or redeploys. A production deployment would use Render's managed PostgreSQL (or another persistent database) instead.

## 9. AI-Assisted Development

**AI tool(s) used:** Claude (Anthropic).

**Problem found and corrected in code:** During initial setup, the contents of `App.jsx` (which defines the app's routing) and `Landing.jsx` (the homepage component) were accidentally swapped between `client/src/` and `client/src/pages/`, and `App.jsx` ended up containing only the Landing page's content with no `<Routes>`/`<Route>` definitions at all. This meant every URL on the deployed site rendered the same Landing page, and clicking "Continue with GitHub" appeared to do nothing. I found the bug by fetching the deployed JavaScript bundle directly with `curl` and inspecting its contents, which showed the rendered component had no routing logic in it at all. I fixed it by restoring the correct routing code to `App.jsx` and the correct Landing content to `Landing.jsx`, then rebuilt and redeployed.

**How OAuth login, JWT verification and protected API behaviour were verified:** Verified with the two required cURL tests above (401 for no token, and 401 for a fake token), and by manually testing the full GitHub OAuth login flow in the browser, confirming a successful login sets the `token` cookie and grants access to `/dashboard` and the capsule API, while an unauthenticated visit to `/dashboard` or the API is rejected.

**How CRUD behaviour and user data ownership were verified:** Manually tested Create, Read, Update, and Delete through the deployed dashboard UI, confirming each operation updates the database and the UI correctly. Ownership was verified by logging in with a second GitHub account and confirming it could not see or modify the first account's capsules, since all queries filter by `user_id` taken from the verified JWT.

**One implementation/deployment decision I can explain:** The React frontend and Express backend are deployed together as a single Render web service, with Express serving the built React static files directly. This avoids any cross-origin or cross-site cookie configuration that would otherwise be needed if the frontend and backend were hosted separately, since the `HttpOnly` JWT cookie only needs to work within a single origin.

**AI Used:** AI tools were used to assist with scaffolding the Express backend and React frontend, implementing OAuth/JWT integration, providing basic styling and CSS assistance, and troubleshooting and debugging the deployment on Render. Claude (Anthropic) was also used to help write and structure this README so that the documentation is clear and easy to read.



## Tech Stack

- **Frontend:** React (Vite), React Router
- **Backend:** Node.js, Express
- **Auth:** GitHub OAuth + `jsonwebtoken`
- **Database:** SQLite (`better-sqlite3`)
- **Deployment:** Render