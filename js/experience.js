(async function () {
  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  const timeline = document.getElementById('exp-timeline');

  let experience;
  try {
    const res = await fetch('/api/experience');
    if (!res.ok) throw new Error('API error');
    experience = await res.json();
  } catch (err) {
    console.error('Failed to load experience:', err);
    timeline.innerHTML = '<p style="color:var(--text2);padding:20px 0">Could not load experience.</p>';
    return;
  }

  timeline.innerHTML = experience.map(e => `
    <div class="t-item${e.current ? ' current' : ''}">
      <div class="t-dot"></div>
      <div class="t-body">
        <div class="t-co">
          ${esc(e.company)}
          ${e.current ? '<span class="t-badge">Now</span>' : ''}
        </div>
        <div class="t-role">${esc(e.role)}</div>
        <div class="t-date">${esc(e.date)}</div>
      </div>
    </div>
  `).join('');

  // GSAP scroll reveal
  timeline.querySelectorAll('.t-item').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
        scrollTrigger: {
          trigger: el, start: 'top 88%', toggleActions: 'play none none none',
          onEnter: () => el.classList.add('in-view')
        }
      }
    );
  });

  ScrollTrigger.refresh();
})();
