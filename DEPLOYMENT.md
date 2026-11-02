# SyncSpace — Production Deployment Guide

This guide covers deployment options and pre-flight checklists for deploying **SyncSpace** into production.

---

## Architecture Overview

- **Frontend**: Next.js 14 (App Router) with standalone production build, Tailwind CSS, TipTap rich-text editor, Socket.IO client.
- **Backend**: Node.js & Express API with Helmet, Rate Limiting, Mongo Sanitize, Compression, Socket.IO (Yjs CRDT collaboration).
- **Database**: MongoDB (Atlas cluster or self-hosted replica set).
- **AI Service**: Google Gemini API for document summarization.

---

## 1. Pre-Flight Checklist

Before launching, ensure the following settings are properly configured:

| Item | Requirement | Production Value |
|---|---|---|
| **`NODE_ENV`** | Node environment mode | `production` |
| **`JWT_SECRET`** | High-entropy signing key | Random 64+ char hexadecimal string (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) |
| **`MONGODB_URI`** | Production database connection | TLS-enabled URI (e.g. `mongodb+srv://...`) |
| **`CLIENT_URL`** | CORS & Socket.IO allowed origins | Full HTTPS URL of frontend (e.g. `https://syncspace.yourdomain.com`). Supports comma-separated list. |
| **`COOKIE_SECURE`** | HTTPS cookie transmission | `true` |
| **`COOKIE_SAME_SITE`** | Cross-domain cookie policy | `none` (if frontend and backend use different domains) or `lax` (if using custom apex/subdomain or same domain) |
| **`AI_API_KEY`** | Google Gemini API Key | Required for AI Document Summaries |
| **`NEXT_PUBLIC_API_BASE_URL`** | Frontend API URL | Public HTTPS backend URL (e.g. `https://api.syncspace.yourdomain.com`) |
| **`NEXT_PUBLIC_SOCKET_URL`** | Frontend Socket.IO URL | Public HTTPS backend URL (WebSocket/polling) |

---

## 2. Deployment Option 1: Managed Cloud (Vercel + Render + MongoDB Atlas)

*Recommended for fast setup, automated SSL, zero server maintenance.*

### Step A: Database (MongoDB Atlas)
1. Create a free/dedicated cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a database user with read/write access.
3. In **Network Access**, add `0.0.0.0/0` (or your cloud platform IP range).
4. Copy the connection string: `mongodb+srv://<user>:<password>@cluster.mongodb.net/syncspace?retryWrites=true&w=majority`.

### Step B: Backend (Render)
1. In Render, select **New** → **Blueprint** and connect this repository, or choose **Web Service**:
   - **Root Directory**: `SyncSpace/backend`
   - **Build Command**: `npm ci --omit=dev`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/health`
2. Add environment variables:
   ```env
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=<generated-64-character-secret>
   JWT_EXPIRES_IN=7d
   CLIENT_URL=https://syncspace.vercel.app
   COOKIE_SECURE=true
   COOKIE_SAME_SITE=none
   AI_PROVIDER=gemini
   AI_API_KEY=<your-gemini-key>
   ```
3. Deploy and verify backend health at `https://your-backend.onrender.com/health`.

### Step C: Frontend (Vercel)
1. Import the repository in [Vercel](https://vercel.com).
2. Set **Root Directory** to `SyncSpace/frontend`.
3. Add Environment Variables:
   ```env
   NEXT_PUBLIC_API_BASE_URL=https://your-backend.onrender.com
   NEXT_PUBLIC_SOCKET_URL=https://your-backend.onrender.com
   ```
4. Click **Deploy**. Vercel will run `npm run build` using Next.js standalone optimization.
5. In Render backend settings, verify `CLIENT_URL` matches your live Vercel domain.

---

## 3. Deployment Option 2: Docker Compose (VPS / Dedicated Server)

*Recommended for single-server self-hosting (DigitalOcean Droplet, AWS EC2, Hetzner, Linode).*

The repository includes a ready-to-use [`docker-compose.yml`](file:///docker-compose.yml) orchestrating MongoDB, Backend, and Frontend.

### Steps:
1. Clone the repository on your server:
   ```bash
   git clone <repo-url> syncspace
   cd syncspace
   ```
2. Configure `.env` files in `SyncSpace/backend` and `SyncSpace/frontend` using their `.env.example` templates.
3. Start the entire application stack:
   ```bash
   docker compose up -d --build
   ```
4. Check running containers:
   ```bash
   docker compose ps
   ```
5. View logs:
   ```bash
   docker compose logs -f
   ```

Containers exposed:
- **Frontend**: Port `5173` (or reverse-proxied to 80/443)
- **Backend API**: Port `3000`
- **MongoDB**: Port `27017` (isolated to Docker network unless ports explicitly mapped)

---

## 4. Deployment Option 3: Manual Linux VPS (PM2 + Nginx Reverse Proxy)

### Backend setup:
```bash
cd SyncSpace/backend
npm ci --omit=dev
npm install -g pm2
pm2 start src/server.js --name "syncspace-backend"
pm2 startup
pm2 save
```

### Frontend setup:
```bash
cd SyncSpace/frontend
npm ci
npm run build
pm2 start npm --name "syncspace-frontend" -- start
pm2 save
```

### Nginx Configuration with WebSocket and SSL:
```nginx
# Frontend
server {
    server_name syncspace.yourdomain.com;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    listen 443 ssl http2;
    # ssl_certificate /etc/letsencrypt/live/...;
    # ssl_certificate_key /etc/letsencrypt/live/...;
}

# Backend API & Socket.IO
server {
    server_name api.syncspace.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket timeouts
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    listen 443 ssl http2;
    # ssl_certificate /etc/letsencrypt/live/...;
    # ssl_certificate_key /etc/letsencrypt/live/...;
}
```

---

## 5. Post-Deployment Verification Checklist

1. [ ] **Health Endpoint**: `curl https://api.yourdomain.com/health` returns `{"status":"ok", ...}`.
2. [ ] **Authentication Flow**:
   - Register a new account. Verify personal workspace is automatically generated.
   - Logout and log back in.
   - Verify JWT authorization cookie and localStorage token.
3. [ ] **Document CRUD & Autosave**:
   - Create a new document in personal space.
   - Type formatted text, task list, highlight text.
   - Reload page and verify content persists reliably from MongoDB.
4. [ ] **Real-time Collaboration**:
   - Open the document in two separate browser windows (or incognito).
   - Verify active collaborator indicator appears in header.
   - Type in window A; observe live real-time sync in window B without lag.
5. [ ] **Workspace Sharing**:
   - Invite another user via email to workspace.
   - Verify role permissions (owner, editor, viewer).
6. [ ] **AI Summarization**:
   - Click "Summarize with AI" in a document with content.
   - Confirm Gemini returns structured TL;DR / Key Points.

