const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const router = express.Router();

const TERMS = [['hospital', 'Hospital'], ['clinic', 'Clinic'], ['pharmacy', 'Pharmacy']];
const cache = new Map();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371, rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1), dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

router.get('/nearby', requireAuth, async (req, res) => {
  const userLat = parseFloat(req.query.lat);
  const userLon = parseFloat(req.query.lon);
  if (!Number.isFinite(userLat) || !Number.isFinite(userLon) || Math.abs(userLat)>90 || Math.abs(userLon)>180) {
    return res.status(400).json({ error: 'Valid lat and lon query parameters are required' });
  }
  const radius = Math.max(100, Math.min(parseInt(req.query.radius || '5000', 10) || 5000, 10000));

  const key = `${userLat.toFixed(2)},${userLon.toFixed(2)},${radius}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 5 * 60 * 1000) return res.json(hit.data);

  const latD = radius / 111000;
  const lonD = radius / (111000 * Math.max(Math.cos((userLat * Math.PI) / 180), 0.1));
  const viewbox = `${userLon - lonD},${userLat + latD},${userLon + lonD},${userLat - latD}`;

  try {
    const seen = new Map();
    for (let i = 0; i < TERMS.length; i++) {
      const [q, label] = TERMS[i];
      if (i) await sleep(1100); // Nominatim policy: max 1 req/sec
      if (!process.env.NOMINATIM_BASE_URL) return res.status(503).json({error:'Nearby care provider is not configured. In an emergency call 112.'});
      const url = new URL('/search', process.env.NOMINATIM_BASE_URL);
      url.search = new URLSearchParams({
        q, format: 'jsonv2', limit: '15', addressdetails: '1',
        viewbox, bounded: '1', countrycodes: 'in',
      });
      const r = await fetch(url, {
        headers: { Accept: 'application/json', 'User-Agent': 'RuralDoc-AI/1.0 (student project)' },
        signal: AbortSignal.timeout(10000),
      });
      if (!r.ok) throw new Error(`Nominatim ${r.status}`);
      for (const p of await r.json()) {
        const lat = parseFloat(p.lat), lon = parseFloat(p.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
        const d = distanceKm(userLat, userLon, lat, lon);
        if (d * 1000 > radius) continue;
        const id = `${p.osm_type}-${p.osm_id}`;
        if (seen.has(id)) continue;
        seen.set(id, {
          id, name: (p.display_name || '').split(',')[0] || label, type: label,
          distance_km: Math.round(d * 10) / 10, phone: null,
          address: p.display_name || null, lat, lon,
        });
      }
    }
    const data = [...seen.values()].sort((a, b) => a.distance_km - b.distance_km).slice(0, 30);
    if(cache.size>=200)cache.delete(cache.keys().next().value);
    cache.set(key, { at: Date.now(), data });
    res.json(data);
  } catch (err) {
    console.error('HOSPITAL SEARCH ERROR:', err.code || "internal");
    res.status(503).json({ error: 'Could not fetch nearby care right now. Please check your connection and try again.' });
  }
});

module.exports = router;