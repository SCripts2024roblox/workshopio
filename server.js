const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const COUNTS_FILE = path.join(DATA_DIR, 'download_counts.json');

function readCounts() {
  if (!fs.existsSync(COUNTS_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(COUNTS_FILE, 'utf8')); }
  catch { return {}; }
}
function writeCounts(d) {
  fs.writeFileSync(COUNTS_FILE, JSON.stringify(d, null, 2));
}

// GET download count
app.get('/api/downloads/:addonId', (req, res) => {
  const counts = readCounts();
  res.json({ addonId: req.params.addonId, count: counts[req.params.addonId] || 0 });
});

// POST — increment count + serve file
app.post('/api/downloads/:addonId', (req, res) => {
  const counts = readCounts();
  counts[req.params.addonId] = (counts[req.params.addonId] || 0) + 1;
  writeCounts(counts);

  const fileMap = {
    'roblox-tshead': path.join(__dirname, 'install', 'roblox', 'TSHEAD', 'head.mesh')
  };
  const filePath = fileMap[req.params.addonId];
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  res.download(filePath, 'head.mesh');
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`Workshop.IO on http://localhost:${PORT}`));
