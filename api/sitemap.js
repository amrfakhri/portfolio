/**
 * GET /sitemap.xml
 *
 * Generates a dynamic XML sitemap that includes:
 *   - Static pages  (/, /projects.html)
 *   - Every published project from /api/projects
 *
 * Routed via vercel.json:  /sitemap.xml → /api/sitemap
 * Cached at the CDN edge for 1 hour (s-maxage=3600).
 */

const DOMAIN = 'https://amrfakhri.com';

const STATIC_PAGES = [
  { loc: '/',              changefreq: 'monthly', priority: '1.0' },
  { loc: '/projects.html', changefreq: 'weekly',  priority: '0.8' },
];

export default async function handler(req, res) {
  try {
    // Derive the base URL from the request so this works on
    // local dev, Vercel preview deployments, and production alike.
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host  = req.headers['x-forwarded-host']  || req.headers.host || 'amrfakhri.com';
    const base  = `${proto}://${host}`;

    // Reuse the existing projects endpoint — single source of truth.
    let projects = [];
    try {
      const r = await fetch(`${base}/api/projects`);
      if (r.ok) projects = await r.json();
    } catch {
      // Sitemap degrades gracefully: serve static pages only if API fails.
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const entries = [
      // ── Static pages ────────────────────────────────────────
      ...STATIC_PAGES.map(p =>
        urlEntry(`${DOMAIN}${p.loc}`, today, p.changefreq, p.priority)
      ),

      // ── Dynamic project pages ────────────────────────────────
      ...projects.map(p => {
        const frame = p.category === 'app' || p.platform === 'mobile' ? 'mobile' : 'web';
        const loc   = `${DOMAIN}/project.html?id=${encodeURIComponent(p.id)}&frame=${frame}`;
        return urlEntry(loc, today, 'monthly', '0.7');
      }),
    ];

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...entries,
      '</urlset>',
    ].join('\n');

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    // Edge cache for 1 h; serve stale while revalidating so bots never wait.
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).send(xml);
  } catch (err) {
    console.error('[sitemap] generation failed:', err);
    res.status(500).send('Failed to generate sitemap.');
  }
}

// ─── Helpers ────────────────────────────────────────────
function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry(loc, lastmod, changefreq, priority) {
  return [
    '  <url>',
    `    <loc>${escapeXml(loc)}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].join('\n');
}
