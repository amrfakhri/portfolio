(async function () {
  // ── Escape HTML to prevent XSS ───────────────────────────
  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  const loadingEl = document.getElementById('pd-loading');
  const errorEl   = document.getElementById('pd-error');
  const contentEl = document.getElementById('pd-content');

  function showError() {
    loadingEl.hidden = true;
    errorEl.hidden   = false;
  }

  // ── Read URL params & apply skeleton shape immediately ───
  const params = new URLSearchParams(window.location.search);
  const id     = params.get('id');
  const frame  = params.get('frame') ?? 'web';

  const skelDevice = document.getElementById('pd-skel-device');
  const skelChrome = document.getElementById('pd-skel-chrome');
  if (frame === 'mobile') {
    skelDevice.classList.add('mobile-skel');
    skelChrome.hidden = true;
  } else {
    skelDevice.classList.add('desktop-skel');
    skelChrome.hidden = false;
  }

  if (!id) { showError(); return; }

  // ── Fetch projects ───────────────────────────────────────
  let project;
  try {
    const res = await fetch('/api/projects');
    if (!res.ok) throw new Error('API error');
    const projects = await res.json();
    project = projects.find(p => p.id === id);
  } catch (err) {
    console.error('Failed to load project:', err);
    showError();
    return;
  }

  if (!project) { showError(); return; }

  // ── Update page title & meta tags ───────────────────────
  const pageUrl = `https://amrfakhri.com/project.html?id=${id}&frame=${frame}`;
  const pageTitle = `${project.name} — Amr Fakhri`;
  const pageDesc = project.description || `${project.name} — a project by Amr Fakhri, Senior UX/UI Designer.`;
  const pageImage = project.image || 'https://placehold.co/1200x630/0a0a0a/C8F135?text=Amr+Fakhri+%E2%80%94+UX%2FUI+Designer';

  document.title = pageTitle;
  document.querySelector('meta[name="description"]').setAttribute('content', pageDesc);
  document.getElementById('canonical').setAttribute('href', pageUrl);

  document.getElementById('og-url').setAttribute('content', pageUrl);
  document.getElementById('og-title').setAttribute('content', pageTitle);
  document.getElementById('og-desc').setAttribute('content', pageDesc);
  document.getElementById('og-image').setAttribute('content', pageImage);

  document.getElementById('tw-title').setAttribute('content', pageTitle);
  document.getElementById('tw-desc').setAttribute('content', pageDesc);
  document.getElementById('tw-image').setAttribute('content', pageImage);

  // ── Render hero ──────────────────────────────────────────
  document.getElementById('pd-tag').textContent   = project.tag;
  document.getElementById('pd-year').textContent  = project.year;
  document.getElementById('pd-title').textContent = project.name;
  document.getElementById('pd-desc').textContent  = project.description;

  const linkEl = document.getElementById('pd-link');
  if (project.link && project.link !== '#') {
    linkEl.href = project.link;
  } else {
    linkEl.hidden = true;
  }

  // ── Render info ──────────────────────────────────────────
  document.getElementById('pd-cat').textContent  = project.category;
  document.getElementById('pd-yr').textContent   = project.year;
  document.getElementById('pd-type').textContent = project.tag;

  // ── Build device frame ───────────────────────────────────
  const images   = project.images?.length ? project.images : (project.image ? [project.image] : []);
  const isApp    = project.category === 'app' || project.platform === 'mobile';
  const deviceEl = document.getElementById('pd-device');

  if (isApp) {
    deviceEl.classList.add('mobile');
    deviceEl.innerHTML = `
      <div class="pd-device-notch"></div>
      <div class="pd-device-screen" id="pd-device-screen">
        <div class="pd-slides-track" id="pd-slides-track"></div>
      </div>`;
  } else {
    deviceEl.classList.add('desktop');
    deviceEl.innerHTML = `
      <div class="pd-device-chrome">
        <div class="pd-chrome-dot"></div>
        <div class="pd-chrome-dot"></div>
        <div class="pd-chrome-dot"></div>
        <div class="pd-chrome-bar"></div>
      </div>
      <div class="pd-device-screen" id="pd-device-screen">
        <div class="pd-slides-track" id="pd-slides-track"></div>
      </div>`;

  }

  // ── Render slides ────────────────────────────────────────
  const sliderSection = document.getElementById('pd-slider-section');

  if (images.length === 0) {
    sliderSection.hidden = true;
  } else {
    const track    = document.getElementById('pd-slides-track');
    const dotsEl   = document.getElementById('pd-dots');
    const prevBtn  = document.getElementById('pd-prev');
    const nextBtn  = document.getElementById('pd-next');
    const screenEl = document.getElementById('pd-device-screen');

    track.innerHTML = images.map(src =>
      `<div class="pd-slide" style="background-image:url('${esc(src)}')"></div>`
    ).join('');

    // Hide controls if only one image
    if (images.length === 1) {
      document.getElementById('pd-controls').hidden = true;
    } else {
      // Render dots
      images.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.className = 'pd-dot' + (i === 0 ? ' active' : '');
        dot.addEventListener('click', () => goTo(i));
        dotsEl.appendChild(dot);
      });
    }

    let current = 0;

    function updateUI() {
      dotsEl.querySelectorAll('.pd-dot').forEach((d, i) =>
        d.classList.toggle('active', i === current)
      );
      prevBtn.disabled = current === 0;
      nextBtn.disabled = current === images.length - 1;
    }

    function goTo(idx) {
      current = Math.max(0, Math.min(idx, images.length - 1));
      gsap.to(track, { x: -(current * 100) + '%', duration: 0.55, ease: 'power3.out' });
      updateUI();
    }

    prevBtn.addEventListener('click', () => goTo(current - 1));
    nextBtn.addEventListener('click', () => goTo(current + 1));

    // ── Drag / swipe ───────────────────────────────────────
    let startX = 0, isDragging = false;

    screenEl.addEventListener('pointerdown', e => {
      startX = e.clientX;
      isDragging = true;
      screenEl.setPointerCapture(e.pointerId);
    });

    screenEl.addEventListener('pointermove', e => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      gsap.set(track, { x: -(current * 100) + (dx / screenEl.offsetWidth * 100) + '%' });
    });

    screenEl.addEventListener('pointerup', e => {
      if (!isDragging) return;
      isDragging = false;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 50) {
        dx < 0 ? goTo(current + 1) : goTo(current - 1);
      } else {
        goTo(current); // snap back
      }
    });

    screenEl.addEventListener('pointercancel', () => {
      if (isDragging) { isDragging = false; goTo(current); }
    });

    updateUI();
  }

  // ── Show content ─────────────────────────────────────────
  loadingEl.hidden = true;
  contentEl.hidden = false;

  // ── Entrance animations ──────────────────────────────────
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.from('.pd-back',     { y: 16, opacity: 0, duration: 0.5 })
    .from('.pd-meta',     { y: 20, opacity: 0, duration: 0.6 }, '-=0.3')
    .from('.pd-title',    { y: 30, opacity: 0, duration: 0.75 }, '-=0.4')
    .from('.pd-desc',     { y: 24, opacity: 0, duration: 0.65 }, '-=0.4')
    .from('#pd-link',     { y: 16, opacity: 0, duration: 0.55 }, '-=0.35')
    .from('#pd-device',   { y: 40, opacity: 0, scale: 0.96, duration: 0.9, ease: 'expo.out' }, '-=0.3');

  // Info section reveal on scroll
  gsap.from('.pd-info-grid > *', {
    y: 24, opacity: 0, duration: 0.6, ease: 'power3.out', stagger: 0.1,
    scrollTrigger: { trigger: '.pd-info-section', start: 'top 85%' }
  });

  ScrollTrigger.refresh();
})();
