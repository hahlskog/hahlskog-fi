# hahlskog.fi

Bilingual static campaign website for Hanna-Lea Ahlskog.

## Structure
- `index.html`: Finnish homepage
- `sv/index.html`: Swedish homepage
- `assets/styles.css`: shared public styles
- `assets/site.js`: navigation and public event loading
- `admin/`: event administration interface
- `cloudflare/worker.js`: Cloudflare Worker event API
- `data/events.json`: repository placeholder; live events are stored in Cloudflare KV

## Deployment
The root website files are intended for GitHub Pages. The Worker is deployed separately in Cloudflare with the `EVENTS_KV` binding and `ADMIN_TOKEN` secret.
