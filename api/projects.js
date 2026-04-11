/**
 * @typedef {{ url: string, order: number, device: string|null }} ProjectImage
 *
 * @typedef {{
 *   id:          string
 *   name:        string
 *   slug:        string
 *   description: string
 *   coverImage:  string|null
 *   images:      ProjectImage[]
 *   category:    string
 *   platform:    string|null
 *   tags:        string[]
 *   status:      'published'|'draft'|'archived'
 *   featured:    boolean
 *   order:       number
 *   year:        string
 *   role:        string
 *   tools:       string[]
 *   link:        string
 *   label:       string
 * }} Project
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const headers = {
      Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    };

    // ── 1. Fetch all published projects ───────────────────────────────────
    let projectPages = [], cursor;
    do {
      const response = await fetch(
        `https://api.notion.com/v1/databases/${process.env.NOTION_DATABASE_ID}/query`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            sorts: [{ property: 'Order', direction: 'ascending' }],
            // Filter on Status select (new field). Falls back gracefully if
            // a page has no Status set — those won't appear (safe default).
            filter: { property: 'Status', select: { equals: 'Published' } },
            start_cursor: cursor,
            page_size: 100,
          }),
        }
      );
      if (!response.ok) throw new Error(`Notion projects: ${response.status} - ${await response.text()}`);
      const data = await response.json();
      projectPages.push(...data.results);
      cursor = data.has_more ? data.next_cursor : null;
    } while (cursor);

    // ── 2. Fetch all images (one bulk call, not N per project) ────────────
    let imagePages = [];
    cursor = undefined;
    do {
      const response = await fetch(
        `https://api.notion.com/v1/databases/${process.env.NOTION_IMAGES_DB_ID}/query`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            sorts: [{ property: 'Order', direction: 'ascending' }],
            start_cursor: cursor,
            page_size: 100,
          }),
        }
      );
      if (!response.ok) throw new Error(`Notion images: ${response.status} - ${await response.text()}`);
      const data = await response.json();
      imagePages.push(...data.results);
      cursor = data.has_more ? data.next_cursor : null;
    } while (cursor);

    // ── 3. Group images by project ID ──────────────────────────────────────
    const imagesByProject = {};
    for (const img of imagePages) {
      const url    = img.properties['Image URL']?.url ?? null;
      const order  = img.properties.Order?.number ?? 0;
      const device = img.properties.Device?.select?.name ?? null;
      if (!url) continue;
      for (const rel of (img.properties.Project?.relation ?? [])) {
        if (!imagesByProject[rel.id]) imagesByProject[rel.id] = [];
        imagesByProject[rel.id].push({ url, order, device });
      }
    }
    for (const id of Object.keys(imagesByProject)) {
      imagesByProject[id].sort((a, b) => a.order - b.order);
    }

    // ── 4. Map Notion pages → clean Project objects ───────────────────────
    /** @type {Project[]} */
    const projects = projectPages.map(page => {
      const props = page.properties;

      // Tags: multi_select array → string[]
      const tags = (props.Tags?.multi_select ?? []).map(t => t.name);

      // Tools: multi_select array → string[]
      const tools = (props.Tools?.multi_select ?? []).map(t => t.name);

      // Status: normalise to lowercase
      const statusRaw = props.Status?.select?.name ?? 'draft';
      const status    = statusRaw.toLowerCase();

      // Slug: fall back to kebab-cased name if field is empty
      const name = props.Name?.title?.[0]?.plain_text ?? '';
      const slug = props.Slug?.rich_text?.[0]?.plain_text
        || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

      return {
        id:          page.id,
        name,
        slug,
        description: props.Description?.rich_text?.[0]?.plain_text ?? '',
        coverImage:  props.Image?.url ?? null,
        images:      imagesByProject[page.id] ?? [],
        category:   (props.Category?.select?.name ?? 'product').toLowerCase(),
        platform:    props.Platform?.select?.name ?? null,
        tags,
        status,
        featured:    props.Featured?.checkbox ?? false,
        order:       Number(props.Order?.number || 0),
        year:        props.Year?.rich_text?.[0]?.plain_text ?? '',
        role:        props.Role?.rich_text?.[0]?.plain_text ?? '',
        tools,
        link:        props.Link?.url ?? '#',
        label:       name, // used as card placeholder text when no coverImage
      };
    });

    res.status(200).json(projects);
  } catch (err) {
    console.error('Projects API error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
