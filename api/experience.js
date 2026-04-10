export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const response = await fetch(
      `https://api.notion.com/v1/databases/${process.env.NOTION_EXPERIENCE_DB_ID}/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sorts: [{ property: 'Order', direction: 'ascending' }]
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Notion error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    const experience = data.results.map(page => ({
      id:      page.id,
      company: page.properties.Company?.title?.[0]?.plain_text  ?? '',
      role:    page.properties.Role?.rich_text?.[0]?.plain_text ?? '',
      date:    page.properties.Date?.rich_text?.[0]?.plain_text ?? '',
      current: page.properties.Current?.checkbox                ?? false,
      order:   page.properties.Order?.number                    ?? 0,
    }));

    res.status(200).json(experience);
  } catch (err) {
    console.error('Experience API error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
