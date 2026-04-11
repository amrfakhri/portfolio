(async function () {
  const featuredEl = document.getElementById('proj-featured');
  const gridEl     = document.getElementById('proj-grid');

  // ── Escape HTML to prevent XSS ──────────────────────────
  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Skeleton loading state ───────────────────────────────
  featuredEl.innerHTML =
    '<div class="proj-skeleton" style="min-height:500px;margin-bottom:24px;border-radius:24px"></div>' +
    '<div class="proj-skeleton" style="min-height:500px;border-radius:24px"></div>';

  gridEl.innerHTML = Array(6)
    .fill('<div class="proj-skeleton" style="height:280px;border-radius:20px"></div>')
    .join('');

  // ── Fetch ────────────────────────────────────────────────
  let projects;
  try {
    const res = await fetch('/api/projects');
    if (!res.ok) throw new Error('API error');
    projects = await res.json();
  } catch (err) {
    console.error('Failed to load projects:', err);
    featuredEl.innerHTML = '';
    gridEl.innerHTML     = '<p style="color:var(--text2);grid-column:1/-1;text-align:center;padding:40px 0">Could not load projects.</p>';
    return;
  }

  const featured = projects.filter(p => p.featured);
  const grid     = projects.filter(p => !p.featured).slice(0, 6);
  const total    = projects.length;

  // ── Update "View all" button label ──────────────────────
  const seeAllBtn = document.getElementById('see-all-btn');
  if (seeAllBtn) {
    const textNode = seeAllBtn.firstChild;
    textNode.textContent = `View all ${total} projects `;
  }

  // ── Image helper ─────────────────────────────────────────
  // If the project has a cover image, show it.
  // If not, show the label placeholder (existing design).
  function featImg(p) {
    if (p.image) {
      return `style="background-image:url('${esc(p.image)}');background-size:cover;background-position:center;"`;
    }
    return '';
  }
  function featLabel(p) {
    if (p.image) return '';
    return `<div class="proj-img-lbl" data-parallax="inner">${esc(p.label)}</div>`;
  }
  function cardImg(p) {
    if (p.image) {
      return `style="background-image:url('${esc(p.image)}');background-size:cover;background-position:center;"`;
    }
    return '';
  }
  function cardLabel(p) {
    if (p.image) return '';
    return `<div class="p-card-img-lbl">${esc(p.label)}</div>`;
  }

  // ── Render featured ──────────────────────────────────────
  featuredEl.innerHTML = featured.map((p, i) => `
    <div class="proj-feat${i % 2 === 1 ? ' rev' : ''}" data-cat="${esc(p.category)}">
      <div class="proj-img parallax-wrap" ${featImg(p)}>
        ${featLabel(p)}
      </div>
      <div class="proj-info">
        <div class="p-tag">${esc(p.tag)}</div>
        <div class="p-name">${esc(p.name)}</div>
        <div class="p-desc">${esc(p.description)}</div>
        <a href="${esc(p.link)}" class="p-link"${p.link !== '#' ? ' target="_blank" rel="noopener"' : ''}>
          View Project
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </a>
      </div>
    </div>
  `).join('');

  // ── Render grid ──────────────────────────────────────────
  gridEl.innerHTML = grid.map((p, i) => `
    <a class="p-card" data-cat="${esc(p.category)}" style="--d:${i * 0.06}s" href="/project.html?id=${esc(p.id)}&frame=${p.category === 'app' || p.platform === 'mobile' ? 'mobile' : 'web'}">
      <div class="p-card-img" ${cardImg(p)}>
        ${cardLabel(p)}
      </div>
      <div class="p-card-body">
        <div class="p-card-tag">${esc(p.tag)}</div>
        <div class="p-card-name">${esc(p.name)}</div>
        <div class="p-card-year">${esc(p.year)}</div>
      </div>
    </a>
  `).join('');

  // ── GSAP: reveal animations ──────────────────────────────
  featuredEl.querySelectorAll('.proj-feat').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, scale: 0.94 },
      { opacity: 1, scale: 1, duration: 0.9, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' }
      }
    );
  });

  gridEl.querySelectorAll('.p-card').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, y: 36 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
        delay: parseFloat(getComputedStyle(el).getPropertyValue('--d')) || 0
      }
    );
  });

  // ── GSAP: parallax on featured images without cover ──────
  featuredEl.querySelectorAll('[data-parallax="inner"]').forEach(el => {
    gsap.to(el, {
      y: -60, ease: 'none',
      scrollTrigger: {
        trigger: el.closest('.parallax-wrap'),
        start: 'top bottom', end: 'bottom top', scrub: true
      }
    });
  });

  // ── Click navigation on featured cards ──────────────────
  featuredEl.querySelectorAll('.proj-feat').forEach((el, i) => {
    el.addEventListener('click', e => {
      if (e.target.closest('.p-link')) return;
      const frame = featured[i].category === 'app' || featured[i].platform === 'mobile' ? 'mobile' : 'web';
      window.location.href = `/project.html?id=${featured[i].id}&frame=${frame}`;
    });
  });

  ScrollTrigger.refresh();
})();
