/**
 * Resolves all database IDs from the single parent Notion page.
 * Cached per function instance — no repeated API calls within the same request.
 */

let _cache = null;

export async function getNotionDbs(token) {
  if (_cache) return _cache;

  const pageId = process.env.NOTION_PAGE_ID;
  const res = await fetch(
    `https://api.notion.com/v1/blocks/${pageId}/children`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
      },
    }
  );

  if (!res.ok) throw new Error(`Failed to fetch Notion page blocks: ${res.status}`);
  const data = await res.json();

  const dbs = {};
  for (const block of data.results) {
    if (block.type !== 'child_database') continue;
    const title = block.child_database.title.toLowerCase().trim();
    const id    = block.id;
    if      (title === 'portfolio projects') dbs.projects   = id;
    else if (title === 'portfolio experience') dbs.experience = id;
    else if (title === 'project images')    dbs.images     = id;
    else if (title === 'client reviews')    dbs.reviews    = id;
  }

  const missing = ['projects', 'experience', 'images', 'reviews'].filter(k => !dbs[k]);
  if (missing.length) console.warn('Notion: could not resolve databases:', missing);

  _cache = dbs;
  return dbs;
}
