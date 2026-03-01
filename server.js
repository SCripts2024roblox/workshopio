const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── DATABASE SETUP ───
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'workshop.db');

// Make sure data directory exists (needed on Render with persistent disk)
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Init tables
db.exec(`
  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    addon_id TEXT NOT NULL,
    username TEXT NOT NULL,
    stars INTEGER NOT NULL CHECK(stars >= 1 AND stars <= 5),
    text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS download_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    addon_id TEXT NOT NULL,
    downloaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ─── MIDDLEWARE ───
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── API ROUTES ───

// GET reviews for an addon
app.get('/api/reviews/:addonId', (req, res) => {
  try {
    const reviews = db.prepare(
      'SELECT * FROM reviews WHERE addon_id = ? ORDER BY created_at DESC'
    ).all(req.params.addonId);
    res.json({ success: true, reviews });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST a new review
app.post('/api/reviews/:addonId', (req, res) => {
  const { username, stars, text } = req.body;

  if (!username || !stars || !text) {
    return res.status(400).json({ success: false, error: 'Missing fields' });
  }
  if (username.length > 32) {
    return res.status(400).json({ success: false, error: 'Username too long' });
  }
  if (text.length > 500) {
    return res.status(400).json({ success: false, error: 'Review too long' });
  }
  if (stars < 1 || stars > 5) {
    return res.status(400).json({ success: false, error: 'Invalid stars' });
  }

  try {
    const result = db.prepare(
      'INSERT INTO reviews (addon_id, username, stars, text) VALUES (?, ?, ?, ?)'
    ).run(req.params.addonId, username.trim(), parseInt(stars), text.trim());

    const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(result.lastInsertRowid);
    res.json({ success: true, review });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE a review (simple — no auth for now, just by id)
app.delete('/api/reviews/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM reviews WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST log a download (stats)
app.post('/api/stats/download/:addonId', (req, res) => {
  try {
    db.prepare('INSERT INTO download_stats (addon_id) VALUES (?)').run(req.params.addonId);
    const count = db.prepare('SELECT COUNT(*) as cnt FROM download_stats WHERE addon_id = ?').get(req.params.addonId);
    res.json({ success: true, total: count.cnt });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET download stats
app.get('/api/stats/download/:addonId', (req, res) => {
  try {
    const count = db.prepare('SELECT COUNT(*) as cnt FROM download_stats WHERE addon_id = ?').get(req.params.addonId);
    res.json({ success: true, total: count.cnt });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve the downloadable mesh file
app.get('/install/roblox/TSHEAD/head.mesh', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'install', 'roblox', 'TSHEAD', 'head.mesh');
  res.download(filePath, 'head.mesh');
});

// Catch-all: serve index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── START ───
app.listen(PORT, () => {
  console.log(`Workshop.IO running on http://localhost:${PORT}`);
  console.log(`Database: ${DB_PATH}`);
});
