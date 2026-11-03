import { createVacuumScene } from './vacuum.js';
import { setLang, initialLang } from './i18n.js';

const { gsap, ScrollTrigger, Lenis } = window;
gsap.registerPlugin(ScrollTrigger);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isSmall = window.matchMedia('(max-width: 820px)').matches;
document.documentElement.classList.toggle('is-reduced', reduced);

setLang(initialLang());
document.querySelectorAll('[data-lang]').forEach((btn) => {
  btn.addEventListener('click', () => {
    setLang(btn.dataset.lang);
    ScrollTrigger.refresh();
  });
});

let vacuum = null;
try {
  vacuum = createVacuumScene(document.querySelector('.stage'), { isSmall });
  vacuum.setLabels([...document.querySelectorAll('.label')]);
} catch (err) {
  // Without WebGL the page still reads correctly, just without the model
  document.querySelector('.stage').remove();
  console.warn('WebGL is unavailable', err);
}
const state = vacuum ? vacuum.state : {};

// Model poses. The small layout keeps the model centred and above the text.
const pose = isSmall
  ? {
      hero: { x: 0, y: 0.95, rotX: 0.05, rotY: 0.95, rotZ: -0.38, camZ: 17 },
      power: { x: 0, y: 0.75, rotX: 0.25, rotY: 2.3, rotZ: 0, camZ: 12.5 },
      cyclone: { x: 0, y: 0.45, rotX: 0.1, rotY: 3.7, rotZ: 0, camZ: 7 },
      floor: { x: 0, y: 3.2, rotX: 0.32, rotY: 5.9, rotZ: 0, camZ: 8 },
      apart: { x: -0.35, y: 1.3, rotX: 0.06, rotY: 7.2, rotZ: 0, camZ: 21 },
      final: { x: 0, y: -0.15, rotX: 0.05, rotY: 8.6, rotZ: 0.3, camZ: 14 },
    }
  : {
      hero: { x: 0, y: -0.05, rotX: 0.05, rotY: 0.95, rotZ: -0.5, camZ: 11 },
      power: { x: 1, y: -1.2, rotX: 0.25, rotY: 2.3, rotZ: 0.08, camZ: 9 },
      cyclone: { x: 0.8, y: -0.5, rotX: 0.1, rotY: 3.7, rotZ: -0.06, camZ: 6.2 },
      floor: { x: 0.9, y: 2.45, rotX: 0.32, rotY: 5.9, rotZ: 0, camZ: 7 },
      apart: { x: 1.15, y: -0.1, rotX: 0.06, rotY: 7.2, rotZ: 0, camZ: 13.5 },
      final: { x: 0, y: -0.2, rotX: 0.05, rotY: 8.6, rotZ: 0.4, camZ: 10.5 },
    };

// The canvas only draws while something uncovered needs it
let coverFrom = null;
let coverTo = null;
if (vacuum) {
  gsap.ticker.add((time) => {
    const y = window.scrollY;
    const covered = coverFrom && y >= coverFrom.start && y < coverTo.start;
    if (!covered) vacuum.frame(reduced ? 0 : time);
  });
}

Object.assign(state, pose.hero);

if (reduced) {
  state.suck = 1;
  gsap.set('.panel', { clearProps: 'all' });
} else {
  const lenis = new Lenis();
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      lenis.scrollTo(a.getAttribute('href') === '#top' ? 0 : a.getAttribute('href'));
    });
  });

  intro();
  heroToStory();
  story();
  finale();
}

// The one load moment: letters rise, the model swings in
function intro() {
  gsap.from('.hero__word span', { yPercent: 110, opacity: 0, duration: 1.1, stagger: 0.06, ease: 'expo.out' });
  gsap.from('.hero__ui > *', { opacity: 0, y: 20, duration: 0.9, delay: 0.6, ease: 'power2.out' });
  if (vacuum) {
    gsap.from(state, { rotY: pose.hero.rotY - 2.4, y: pose.hero.y - 1.2, duration: 1.8, ease: 'expo.out', overwrite: false });
  }
}

// Scrolling off the hero is what sucks up the dust
function heroToStory() {
  gsap.to(state, {
    suck: 1,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
  gsap.to('.hero__word', {
    yPercent: -22,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
  gsap.fromTo(state, { ...pose.hero, spin: 0.4 }, {
    ...pose.power,
    spin: 3,
    ease: 'power1.inOut',
    immediateRender: false,
    scrollTrigger: { trigger: '.story', start: 'top bottom', end: 'top top', scrub: true },
  });
}

function story() {
  const panels = gsap.utils.toArray('.panel');
  const tl = gsap.timeline({
    defaults: { ease: 'power2.inOut' },
    scrollTrigger: { trigger: '.story__pin', start: 'top top', end: '+=450%', pin: true, scrub: 0.6 },
  });

  const show = (panel, at) => tl.fromTo(panel, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.5 }, at);
  const hide = (panel, at) => tl.to(panel, { autoAlpha: 0, y: -24, duration: 0.5 }, at);

  gsap.set(panels[0], { autoAlpha: 1 });
  tl.to({}, { duration: 1 }, 0);
  hide(panels[0], 1);
  tl.fromTo(state, { ...pose.power, spin: 3 }, { ...pose.cyclone, spin: 5, duration: 1, immediateRender: false }, 1);
  show(panels[1], 1.5);
  hide(panels[1], 2.8);
  tl.fromTo(state, { ...pose.cyclone, spin: 5, floorGlow: 0 }, { ...pose.floor, spin: 1, floorGlow: 1, duration: 1, immediateRender: false }, 2.8);
  show(panels[2], 3.3);
  hide(panels[2], 4.6);
  tl.fromTo(state, { ...pose.floor, floorGlow: 1 }, { ...pose.apart, floorGlow: 0, duration: 1, immediateRender: false }, 4.6);
  tl.fromTo(state, { explode: 0 }, { explode: 1, duration: 1, immediateRender: false }, 4.8);
  show(panels[3], 5.3);
  tl.to({}, { duration: 1.2 }, 5.8);

  // Uses section: vertical scroll drives a sideways track on larger screens
  if (!isSmall) {
    const track = document.querySelector('.uses__track');
    gsap.to(track, {
      x: () => window.innerWidth - track.scrollWidth,
      ease: 'none',
      scrollTrigger: {
        trigger: '.uses',
        start: 'top top',
        end: () => `+=${track.scrollWidth - window.innerWidth}`,
        pin: true,
        scrub: 0.6,
        invalidateOnRefresh: true,
      },
    });
  }

  gsap.utils.toArray('[data-count]').forEach((el) => {
    const target = Number(el.dataset.count);
    const counter = { n: 0 };
    gsap.to(counter, {
      n: target,
      duration: 1.4,
      ease: 'power2.out',
      onUpdate: () => { el.textContent = Math.round(counter.n); },
      scrollTrigger: { trigger: '.specs__list', start: 'top 80%', once: true },
    });
  });
}

function finale() {
  gsap.fromTo(state, { ...pose.apart, explode: 1, spin: 1 }, {
    ...pose.final,
    explode: 0,
    spin: 0.4,
    ease: 'power1.out',
    immediateRender: false,
    scrollTrigger: { trigger: '.final', start: 'top bottom', end: 'top top', scrub: true },
  });

  const nav = document.querySelector('.nav');
  // The nav steps aside while reading down the page and returns on the way up
  ScrollTrigger.create({
    start: () => window.innerHeight,
    end: 'max',
    onUpdate: (self) => nav.classList.toggle('is-hidden', self.direction === 1),
    onLeaveBack: () => nav.classList.remove('is-hidden'),
  });
  ['.uses', '.price', '.faq'].forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top 40px',
      end: 'bottom 40px',
      toggleClass: { targets: nav, className: 'is-on-light' },
    });
  });

  // Stop drawing while opaque sections fully cover the canvas
  coverFrom = ScrollTrigger.create({ trigger: '.uses', start: 'top top' });
  coverTo = ScrollTrigger.create({ trigger: '.final', start: 'top bottom' });
}
