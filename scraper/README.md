# Scraper service (Amazon search via ScraperAPI)

This is a tiny separate Node service that proxies Amazon search requests through ScraperAPI's structured endpoint and returns a normalized list of items.

Quick start:

```bash
cd scraper
cp .env.example .env
# edit .env and set SCRAPERAPI_KEY
npm install
npm run dev
```

Default server: http://localhost:4000

Endpoints:
- GET /health - basic health check
- GET /search?q=your+query - returns JSON { items: [ ... ] }
