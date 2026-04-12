import { getNotionDbs } from './_notion-dbs.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const dbs = await getNotionDbs(process.env.NOTION_TOKEN);
    let pages = [], cursor;
    do {
      const response = await fetch(
        `https://api.notion.com/v1/databases/${dbs.reviews}/query`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filter: { property: 'Featured', checkbox: { equals: true } },
            start_cursor: cursor,
            page_size: 100,
          }),
        }
      );
      if (!response.ok) throw new Error(`Notion reviews: ${response.status} - ${await response.text()}`);
      const data = await response.json();
      pages.push(...data.results);
      cursor = data.has_more ? data.next_cursor : null;
    } while (cursor);

    const reviews = pages.map(page => {
      const props = page.properties;

      // Avatar: Notion file property returns files array; support both internal and external
      const avatarFiles = props.Avatar?.files ?? [];
      const avatar = avatarFiles[0]?.file?.url ?? avatarFiles[0]?.external?.url ?? null;

      return {
        id:         page.id,
        name:       props.Name?.title?.[0]?.plain_text ?? '',
        text:       props['Review Text']?.rich_text?.[0]?.plain_text ?? '',
        meta:       props['Role / Company']?.rich_text?.[0]?.plain_text ?? '',
        rating:     props.Rating?.number ?? 5,
        avatar,
        featured:   props.Featured?.checkbox ?? false,
      };
    });

    res.status(200).json(reviews);
  } catch (err) {
    console.error('Reviews API error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
