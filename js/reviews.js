(async function () {
  const section = document.getElementById('reviews');
  const grid    = section?.querySelector('.rv-grid');
  if (!section || !grid) return;

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function starsSVG(rating) {
    const n = Math.min(Math.max(Math.round(Number(rating) || 5), 1), 5);
    const svg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>';
    return svg.repeat(n);
  }

  let reviews;
  try {
    const res = await fetch('/api/reviews');
    if (!res.ok) throw new Error(`Reviews API ${res.status}`);
    reviews = await res.json();
  } catch (err) {
    console.error('Reviews: fetch failed', err);
    return;
  }

  if (!Array.isArray(reviews) || !reviews.length) {
    console.warn('Reviews: empty or unexpected response', reviews);
    return;
  }

  grid.innerHTML = reviews.map((r, i) => `
    <article class="rv-card" data-review style="--d:${(i * 0.08).toFixed(2)}s">
      <div class="rv-stars" role="img" aria-label="${esc(String(r.rating ?? 5))} out of 5 stars">
        ${starsSVG(r.rating)}
      </div>
      <blockquote class="rv-text" data-review-text>
        "${esc(r.text)}"
      </blockquote>
      <footer class="rv-footer">
        <span class="rv-name" data-review-name>${esc(r.name)}</span>
        <span class="rv-meta" data-review-meta>${esc(r.meta)}</span>
      </footer>
    </article>
  `).join('');

  section.style.display = 'block';

  if (typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.refresh();
  }
})();
