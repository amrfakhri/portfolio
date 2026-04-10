export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');


  try {
    const response = await fetch(
      `https://api.notion.com/v1/databases/${process.env.NOTION_DATABASE_ID}/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sorts: [{ property: 'Order', direction: 'ascending' }],
          filter: { property: 'Published', checkbox: { equals: true } }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Notion error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    const projects = data.results.map(page => ({
      id:          page.id,
      name:        page.properties.Name?.title?.[0]?.plain_text        ?? '',
      category:   (page.properties.Category?.select?.name             ?? 'product').toLowerCase(),
      tag:         page.properties.Tag?.rich_text?.[0]?.plain_text     ?? '',
      description: page.properties.Description?.rich_text?.[0]?.plain_text ?? '',
      year:        page.properties.Year?.rich_text?.[0]?.plain_text    ?? '',
      label:       page.properties.Label?.rich_text?.[0]?.plain_text   ?? '',
      image:       page.properties.Image?.url                          ?? null,
      images:      (page.properties.Images?.rich_text?.[0]?.plain_text ?? '')
                     .split('\n').map(s => s.trim()).filter(Boolean),
      link:        page.properties.Link?.url                           ?? '#',
      platform:    page.properties.Platform?.select?.name              ?? null,
      featured:    page.properties.Featured?.checkbox                  ?? false,
      order:       page.properties.Order?.number                       ?? 0,
    }));

    res.status(200).json(projects);
  } catch (err) {
    console.error('Projects API error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
