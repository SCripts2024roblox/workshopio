# Workshop.IO

Game addon platform. Node.js + Express + SQLite.

## Project Structure

```
workshopio/
├── server.js                        # Express server + API
├── package.json
├── data/                            # Auto-created, holds workshop.db (SQLite)
└── public/
    ├── index.html                   # Frontend
    └── install/
        └── roblox/
            └── TSHEAD/
                └── head.mesh        # Downloadable file
```

## Run Locally

```bash
npm install
npm start
# → http://localhost:3000
```

For dev with auto-reload:
```bash
npm run dev
```

## Deploy on Render

1. Push this folder to a GitHub repo
2. Go to https://render.com → **New Web Service**
3. Connect your GitHub repo
4. Settings:
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add a **Persistent Disk** (important for SQLite!):
   - Mount Path: `/data`
   - Set env var: `DB_PATH=/data/workshop.db`
6. Click **Deploy**

> ⚠️ Without a Persistent Disk, the SQLite DB resets on every deploy.
> Render free tier offers persistent disk for $1/month.

## API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/reviews/:addonId` | Get all reviews |
| POST | `/api/reviews/:addonId` | Post a review |
| DELETE | `/api/reviews/:id` | Delete a review |
| GET | `/api/stats/download/:addonId` | Get download count |
| POST | `/api/stats/download/:addonId` | Log a download |
| GET | `/install/roblox/TSHEAD/head.mesh` | Download the mesh file |
