const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '..', 'data');

function getFile(addonId) {
  return path.join(DATA_DIR, `reviews_${addonId}.json`);
}

function readReviews(addonId) {
  const f = getFile(addonId);
  if (!fs.existsSync(f)) return [];
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); }
  catch { return []; }
}

function writeReviews(addonId, data) {
  fs.writeFileSync(getFile(addonId), JSON.stringify(data, null, 2));
}

// GET /api/reviews/:addonId
router.get('/:addonId', (req, res) => {
  const reviews = readReviews(req.params.addonId);
  res.json(reviews);
});

// POST /api/reviews/:addonId
router.post('/:addonId', (req, res) => {
  const { name, text, stars } = req.body;

  if (!name || !text || !stars) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  if (typeof stars !== 'number' || stars < 1 || stars > 5) {
    return res.status(400).json({ error: 'Invalid stars' });
  }
  if (name.length > 32 || text.length > 500) {
    return res.status(400).json({ error: 'Too long' });
  }

  const review = {
    id: uuidv4(),
    name: name.trim(),
    text: text.trim(),
    stars,
    date: new Date().toISOString().slice(0, 10),
    createdAt: Date.now()
  };

  const reviews = readReviews(req.params.addonId);
  reviews.unshift(review); // newest first
  writeReviews(req.params.addonId, reviews);

  res.status(201).json(review);
});

// DELETE /api/reviews/:addonId/:reviewId  (simple admin via secret header)
router.delete('/:addonId/:reviewId', (req, res) => {
  const secret = req.headers['x-admin-secret'];
  if (secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  let reviews = readReviews(req.params.addonId);
  reviews = reviews.filter(r => r.id !== req.params.reviewId);
  writeReviews(req.params.addonId, reviews);
  res.json({ ok: true });
});

module.exports = router;
