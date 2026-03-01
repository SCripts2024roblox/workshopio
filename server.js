const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve install images (icons/banners)
app.use('/install', express.static(path.join(__dirname, 'install')));

// ─── DATA ───
const DATA_DIR    = path.join(__dirname, 'data');
const COUNTS_FILE = path.join(DATA_DIR, 'download_counts.json');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function readCounts() {
  if (!fs.existsSync(COUNTS_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(COUNTS_FILE, 'utf8')); }
  catch { return {}; }
}
function writeCounts(d) {
  fs.writeFileSync(COUNTS_FILE, JSON.stringify(d, null, 2));
}

// ─── CATALOG API ───
// Reads install/ folder and builds full catalog dynamically
// Structure:  install/<game>/icon.png
//             install/<game>/<addon>/icon.png
//             install/<game>/<addon>/banner.png
//             install/<game>/<addon>/<anyfile>   ← downloadable file

app.get('/api/catalog', (req, res) => {
  const installDir = path.join(__dirname, 'install');
  const counts     = readCounts();
  const games      = [];

  if (!fs.existsSync(installDir)) return res.json([]);

  for (const gameName of fs.readdirSync(installDir)) {
    const gamePath = path.join(installDir, gameName);
    if (!fs.statSync(gamePath).isDirectory()) continue;

    const addons = [];
    for (const addonName of fs.readdirSync(gamePath)) {
      const addonPath = path.join(gamePath, addonName);
      if (!fs.statSync(addonPath).isDirectory()) continue;

      // Find the downloadable file (anything that's not icon.png / banner.png)
      const files = fs.readdirSync(addonPath);
      const dlFile = files.find(f => f !== 'icon.png' && f !== 'banner.png');

      const addonId = `${gameName}-${addonName}`.toLowerCase();
      addons.push({
        id:       addonId,
        name:     addonName,
        game:     gameName,
        icon:     files.includes('icon.png')   ? `/install/${gameName}/${addonName}/icon.png`   : null,
        banner:   files.includes('banner.png') ? `/install/${gameName}/${addonName}/banner.png` : null,
        file:     dlFile || null,
        downloads: counts[addonId] || 0,
      });
    }

    games.push({
      id:     gameName.toLowerCase(),
      name:   gameName,
      icon:   fs.existsSync(path.join(gamePath, 'icon.png')) ? `/install/${gameName}/icon.png` : null,
      addons,
    });
  }

  res.json(games);
});

// ─── DOWNLOAD ───
app.post('/api/downloads/:gameId/:addonName', (req, res) => {
  const { gameId, addonName } = req.params;
  const addonPath = path.join(__dirname, 'install', gameId, addonName);

  if (!fs.existsSync(addonPath)) return res.status(404).json({ error: 'Not found' });

  const files  = fs.readdirSync(addonPath);
  const dlFile = files.find(f => f !== 'icon.png' && f !== 'banner.png');
  if (!dlFile) return res.status(404).json({ error: 'No file' });

  const addonId = `${gameId}-${addonName}`.toLowerCase();
  const counts  = readCounts();
  counts[addonId] = (counts[addonId] || 0) + 1;
  writeCounts(counts);

  res.download(path.join(addonPath, dlFile), dlFile);
});

// ─── CATCH-ALL ───
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`Workshop.IO on http://localhost:${PORT}`));
