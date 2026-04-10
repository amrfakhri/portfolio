const cur = document.getElementById('cur');
const curR = document.getElementById('cur-r');
let mx=0,my=0,rx=0,ry=0;

if (window.matchMedia('(hover: hover)').matches) {
  document.addEventListener('mousemove', e => {
    mx=e.clientX; my=e.clientY;
    gsap.to(cur, { left:mx, top:my, duration:0.08, ease:'none' });
    const glow = document.getElementById('hero-glow');
    if(glow) gsap.to(glow, { left:mx, top:my, duration:.9, ease:'power2.out' });
  });

  (function raf() {
    rx += (mx-rx)*.1; ry += (my-ry)*.1;
    curR.style.left = rx+'px'; curR.style.top = ry+'px';
    requestAnimationFrame(raf);
  })();

  document.querySelectorAll('a,button').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-big'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-big'));
  });
} else {
  if (cur) cur.style.display = 'none';
  if (curR) curR.style.display = 'none';
}