const themeBtn = document.getElementById('themeBtn');
if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    document.documentElement.dataset.theme =
      document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  });
}

ScrollTrigger.create({
  start:'top -60',
  onEnter: () => document.getElementById('nav').classList.add('scrolled'),
  onLeaveBack: () => document.getElementById('nav').classList.remove('scrolled'),
});

document.querySelectorAll('.f-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.f-btn').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    const f = btn.dataset.f;
    document.querySelectorAll('[data-cat]').forEach(card => {
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