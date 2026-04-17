(async function () {
  const gridEl   = document.getElementById('ap-grid');
  const countEl  = document.getElementById('ap-count');

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Skeleton loading state ───────────────────────────────
  gridEl.innerHTML = Array(12)
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
    gridEl.innerHTML = '<p style="color:var(--text2);grid-column:1/-1;text-align:center;padding:40px 0">Could not load projects.</p>';
    return;
  }

  // Sort by order ascending
  projects.sort((a, b) => a.order - b.order);

  // ── Update count ─────────────────────────────────────────
  if (countEl) countEl.textContent = `${projects.length} projects`;

  // ── Render all cards ─────────────────────────────────────
  function cloudinaryWebP(url, width) {
    if (!url || !url.includes('res.cloudinary.com')) return url;
    return url.replace('/upload/', `/upload/f_webp,q_auto,w_${width}/`);
  }

  function coverStyle(p) {
    const src = cloudinaryWebP(p.coverImage, 800);
    return src
      ? `style="background-image:url('${esc(src)}');background-size:cover;background-position:center;"`
      : '';
  }
  function coverLabel(p) {
    return p.coverImage ? '' : `<div class="p-card-img-lbl">${esc(p.label)}</div>`;
  }
  function tagLine(p) {
    return p.tags?.slice(0, 2).join(' · ') || '';
  }
  function projectUrl(p) {
    const frame = p.category === 'app' || p.platform === 'mobile' ? 'mobile' : 'web';
    return `/project.html?id=${esc(p.id)}&frame=${frame}`;
  }

  gridEl.innerHTML = projects.map((p, i) => `
    <a class="p-card" data-cat="${esc(p.category)}" style="--d:${(i % 6) * 0.06}s" href="${projectUrl(p)}">
      <div class="p-card-img" ${coverStyle(p)}>
        ${coverLabel(p)}
      </div>
      <div class="p-card-body">
        <div class="p-card-tag">${esc(tagLine(p))}</div>
        <div class="p-card-name">${esc(p.name)}</div>
        <div class="p-card-year">${esc(p.year)}</div>
      </div>
    </a>
  `).join('');

  // ── GSAP: reveal animations ──────────────────────────────
  gridEl.querySelectorAll('.p-card').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, y: 36 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none none' },
        delay: parseFloat(getComputedStyle(el).getPropertyValue('--d')) || 0
      }
    );
  });

  // ── Filter tabs ──────────────────────────────────────────
  document.querySelectorAll('.f-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.f-btn').forEach(b => b.classList.remove('on'));
      btn.classList.add('on');
      const f = btn.dataset.f;
      gridEl.querySelectorAll('[data-cat]').forEach(card => {
        const match = f === 'all' || card.dataset.cat === f;
        if (match) {
          card.style.display = '';
          gsap.fromTo(card,
            { opacity: 0, scale: .97 },
            { opacity: 1, scale: 1, duration: .35, ease: 'power2.out', overwrite: 'auto' }
          );
        } else {
          gsap.to(card, {
            opacity: 0, scale: .97, duration: .25, ease: 'power2.in', overwrite: 'auto',
            onComplete: () => { card.style.display = 'none'; }
          });
        }
      });
    });
  });

  ScrollTrigger.refresh();
})();
