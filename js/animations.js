gsap.registerPlugin(ScrollTrigger);

/* HERO ENTRANCE */
const heroTl = gsap.timeline({ defaults:{ ease:'power3.out' } });
heroTl.to('.hero-badge', { opacity:1, duration:.6 }, 0.2);
heroTl.to('.word-inner', { y: 0, duration: .9, stagger: .12, ease:'expo.out' }, 0.3);
heroTl.to('.hero-sub',  { opacity:1, y:0, duration:.7 }, 0.75);
heroTl.to('.hero-ctas', { opacity:1, y:0, duration:.7 }, 0.9);
heroTl.to('.hero-scroll-hint', { opacity:1, duration:.6 }, 1.1);
heroTl.to('.hero-stats-row',   { opacity:1, duration:.6 }, 1.15);

gsap.to('#hero .hero-title', {
  y: -80, ease:'none',
  scrollTrigger: { trigger:'#hero', start:'top top', end:'bottom top', scrub:true }
});
gsap.to('#hero .hero-sub, #hero .hero-ctas', {
  y: -40, opacity:0, ease:'none',
  scrollTrigger: { trigger:'#hero', start:'40% top', end:'bottom top', scrub:true }
});

/* PHILOSOPHY */
const philItems = document.querySelectorAll('.phil-item');
const philDots  = document.querySelectorAll('.phil-dot');
const N = philItems.length;
document.getElementById('philosophy-wrap').style.height = (N + 1) * 100 + 'vh';

function showPhil(i) {
  philItems.forEach((p,j) => {
    const active = j === i;
    gsap.to(p, { opacity: active?1:0, duration:.55, ease:'power2.out' });
    if (active) {
      gsap.fromTo(p.querySelector('.phil-text'),
        { y:50, opacity:0 }, { y:0, opacity:1, duration:.65, ease:'expo.out' });
      gsap.fromTo(p.querySelector('.phil-sub'),
        { y:24, opacity:0 }, { y:0, opacity:1, duration:.55, delay:.1, ease:'expo.out' });
    }
    p.classList.toggle('active', active);
  });
  philDots.forEach((d,j) => d.classList.toggle('active', j===i));
}
showPhil(0);

ScrollTrigger.create({
  trigger: '#philosophy-wrap',
  start: 'top top',
  end: 'bottom bottom',
  onUpdate: self => {
    const idx = Math.min(Math.floor(self.progress * N), N-1);
    if (!philItems[idx].classList.contains('active')) showPhil(idx);
  }
});

/* REVEALS */
function reveal(selector, fromVars, toVars) {
  document.querySelectorAll(selector).forEach(el => {
    gsap.fromTo(el, fromVars, {
      ...toVars,
      scrollTrigger: { trigger: el, start:'top 88%', toggleActions:'play none none none' },
      delay: parseFloat(getComputedStyle(el).getPropertyValue('--d') || 0) || 0
    });
  });
}
reveal('.g-fade',  { opacity:0 },           { opacity:1, duration:.7, ease:'power2.out' });
reveal('.g-up',    { opacity:0, y:36 },     { opacity:1, y:0, duration:.8, ease:'expo.out' });
reveal('.g-left',  { opacity:0, x:-40 },    { opacity:1, x:0, duration:.8, ease:'expo.out' });
reveal('.g-right', { opacity:0, x:40 },     { opacity:1, x:0, duration:.8, ease:'expo.out' });
reveal('.g-scale', { opacity:0, scale:.94 },{ opacity:1, scale:1, duration:.9, ease:'expo.out' });

document.querySelectorAll('[data-parallax="inner"]').forEach(el => {
  gsap.to(el, {
    y: -60, ease:'none',
    scrollTrigger: { trigger: el.closest('.parallax-wrap'), start:'top bottom', end:'bottom top', scrub:true }
  });
});

document.querySelectorAll('.t-item').forEach((item, i) => {
  gsap.fromTo(item, { opacity:0, x:30 }, {
    opacity:.5, x:0, duration:.6, ease:'expo.out',
    scrollTrigger: { trigger:item, start:'top 85%', toggleActions:'play none none none' },
    delay: i * .07
  });
  ScrollTrigger.create({
    trigger: item,
    start:'top 65%', end:'bottom 35%',
    onEnter:    () => { item.classList.add('in-view');    gsap.to(item, { opacity:1, duration:.3 }); },
    onLeave:    () => { item.classList.remove('in-view'); gsap.to(item, { opacity:.5, duration:.3 }); },
    onEnterBack:() => { item.classList.add('in-view');    gsap.to(item, { opacity:1, duration:.3 }); },
    onLeaveBack:() => { item.classList.remove('in-view'); gsap.to(item, { opacity:.5, duration:.3 }); },
  });
});

document.querySelectorAll('[data-count]').forEach(el => {
  const target = parseInt(el.dataset.count);
  ScrollTrigger.create({
    trigger: el, start:'top 85%', once:true,
    onEnter: () => {
      gsap.to({ v:0 }, {
        v: target, duration:1.4, ease:'power2.out',
        onUpdate: function() { el.textContent = Math.round(this.targets()[0].v) + '+'; }
      });
    }
  });
});