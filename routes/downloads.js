const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const COUNTS_FILE = path.join(DATA_DIR, 'download_counts.json');

function readCounts() {
  if (!fs.existsSync(COUNTS_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(COUNTS_FILE, 'utf8')); }
  catch { return {}; }
}

function writeCounts(data) {
  fs.writeFileSync(COUNTS_FILE, JSON.stringify(data, null, 2));
}

// GET /api/downloads/:addonId  — get count
router.get('/:addonId', (req, res) => {
  const counts = readCounts();
  res.json({ addonId: req.params.addonId, count: counts[req.params.addonId] || 0 });
});

// POST /api/downloads/:addonId  — increment + serve file
router.post('/:addonId', (req, res) => {
  const counts = readCounts();
  counts[req.params.addonId] = (counts[req.params.addonId] || 0) + 1;
  writeCounts(counts);

  // Map addonId → actual file in /install
  const fileMap = {
    'roblox-tshead': path.join(__dirname, '..', 'install', 'roblox', 'TSHEAD', 'head.mesh')
  };

  const filePath = fileMap[req.params.addonId];
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  res.download(filePath, 'head.mesh');
});

module.exports = router;
