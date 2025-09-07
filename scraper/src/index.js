const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors({ origin: ['http://localhost:3000', 'http://127.0.0.1:3000'] }));
app.use(express.json());

const API_KEY = process.env.SCRAPERAPI_KEY;
const PORT = process.env.PORT || 4000;
const COUNTRY = process.env.COUNTRY || 'IN';
const TLD = process.env.TLD || 'in';

app.get('/health', (req, res) => {
  res.json({ ok: true, api_key_present: !!API_KEY });
});

app.get('/search', async (req, res) => {
  try {
    const q = (req.query.q || req.query.query || '').toString().trim();
    if (!q) return res.status(400).json({ error: 'query param q is required' });
    if (!API_KEY) return res.status(500).json({ error: 'SCRAPERAPI_KEY not configured on server' });

    const apiUrl = `https://api.scraperapi.com/structured/amazon/search?api_key=${encodeURIComponent(API_KEY)}&query=${encodeURIComponent(q)}&country=${encodeURIComponent(COUNTRY)}&tld=${encodeURIComponent(TLD)}`;

    const resp = await fetch(apiUrl, { method: 'GET' });
    if (!resp.ok) {
      const body = await resp.text();
      return res.status(502).json({ error: 'ScraperAPI error', status: resp.status, body });
    }

    const data = await resp.json();

    const source = Array.isArray(data.results) && data.results.length ? data.results : (Array.isArray(data.ads) ? data.ads : []);
    const items = (source || []).slice(0, 10).map((item) => ({
      asin: item.asin || null,
      title: item.name || item.title || null,
      image: item.image || null,
      price: (item.price !== undefined && item.price !== null) ? item.price : (item.price_string || null),
      stars: item.stars ?? null,
      url: item.url || null,
    }));

    res.json({ items, rawCount: (source || []).length });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`Scraper service listening on http://localhost:${PORT}`);
});
