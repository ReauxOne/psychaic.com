// Psychaic scroll intro. As the visitor scrolls through #intro:
// a lone chrome planet spins on white -> the oxblood ring sweeps in and wraps it ->
// the sky fades up -> the ground rises -> the wordmark comes forward and settles
// into the header -> the menu pops in on the right.
// The HTML and CSS already show the finished scene, so this only runs when <html> has
// the intro-on class (set when the visitor hasn't asked for reduced motion).
(() => {
  const root = document.documentElement;
  if (!root.classList.contains('intro-on')) return;

  const $ = (id) => document.getElementById(id);
  const intro = $('intro'), header = $('top'), logo = header.querySelector('.logo');
  const navLinks = [...header.querySelectorAll('nav a')];
  const sky = $('sky'), ground = $('ground'), shadow = $('shadow'), hint = $('hint');
  const ringBack = $('ring-back'), ringFront = $('ring-front'), satellite = $('satellite');
  const backG = $('ring-back-g'), frontG = $('ring-front-g'), seams = $('seams');
  const tints = { sky: $('tint-sky'), horizon: $('tint-horizon'), ground: $('tint-ground') };

  const RX = 250;        // ring radius across, in planet units (the ball is 100)
  const SEAMS = 6;       // engraved meridians that show the ball turning
  const NS = 'http://www.w3.org/2000/svg';
  const seamPaths = Array.from({ length: SEAMS + 1 }, () => seams.appendChild(document.createElementNS(NS, 'path')));

  const clamp = (x) => Math.min(1, Math.max(0, x));
  const ease = (x) => x * x * (3 - 2 * x);
  const span = (p, a, b) => ease(clamp((p - a) / (b - a)));
  const mix = (a, b, t) => a + (b - a) * t;

  // The wordmark's flight: from big and centred in the sky to its place in the header.
  let flight = { dx: 0, dy: 0, scale: 3 };
  function measure() {
    logo.style.transform = 'none';
    const r = logo.getBoundingClientRect();
    flight = {
      dx: innerWidth / 2 - (r.left + r.width / 2),
      dy: innerHeight * 0.2 - (r.top + r.height / 2),
      scale: Math.min(3.2, (innerWidth * 0.72) / r.width),
    };
  }

  function ringPaths(ry) {
    // Back half arcs over the top (drawn behind the ball), front half under (drawn over it).
    ringBack.setAttribute('d', `M ${-RX} 0 A ${RX} ${ry} 0 0 1 ${RX} 0`);
    ringFront.setAttribute('d', `M ${RX} 0 A ${RX} ${ry} 0 0 1 ${-RX} 0`);
    const t = 0.16;
    satellite.setAttribute('cx', (RX * Math.cos(t)).toFixed(1));
    satellite.setAttribute('cy', (ry * Math.sin(t)).toFixed(1));
  }

  function drawSeams(spin) {
    // Meridians of a sphere turning on its axis; only the halves facing us are drawn.
    for (let i = 0; i < SEAMS; i++) {
      const lon = spin + (i * Math.PI) / SEAMS;
      const s = Math.sin(lon), c = Math.cos(lon);
      const path = seamPaths[i];
      if (c <= 0) { path.setAttribute('d', ''); continue; }
      const rx = Math.abs(100 * s);
      path.setAttribute('d', `M 0 -100 A ${rx.toFixed(2)} 100 0 0 ${s > 0 ? 1 : 0} 0 100`);
      path.style.opacity = (0.12 + 0.28 * c).toFixed(2);
    }
    seamPaths[SEAMS].setAttribute('d', 'M -100 0 A 100 17 0 0 0 100 0'); // equator, front half
  }

  let progress = 0, pastScene = false, idle = 0, last = performance.now();

  function render() {
    const p = progress;
    // ring sweeps in, tilting from steep to settled, and opens from a sliver to a full wrap
    const ringT = span(p, 0.06, 0.36);
    ringPaths(mix(6, 44, ringT));
    const tilt = mix(-42, -14, ringT);
    backG.setAttribute('transform', `rotate(${tilt})`);
    frontG.setAttribute('transform', `rotate(${tilt})`);
    ringBack.style.strokeDasharray = '1';
    ringFront.style.strokeDasharray = '1';
    const backDrawn = span(p, 0.06, 0.24), frontDrawn = span(p, 0.2, 0.36);
    ringBack.style.strokeDashoffset = 1 - backDrawn;
    ringFront.style.strokeDashoffset = 1 - frontDrawn;
    // an undrawn path still shows its round end caps as dots, so hide it until it starts
    ringBack.style.visibility = backDrawn > 0.002 ? 'visible' : 'hidden';
    ringFront.style.visibility = frontDrawn > 0.002 ? 'visible' : 'hidden';
    satellite.style.opacity = span(p, 0.34, 0.42);

    // the world arrives: sky, then ground; the chrome picks up their reflections
    const skyT = span(p, 0.3, 0.52), groundT = span(p, 0.4, 0.62);
    sky.style.opacity = skyT;
    ground.style.transform = `translateY(${(1 - groundT) * 100}%)`;
    shadow.style.opacity = 0.7 * groundT;
    tints.sky.setAttribute('opacity', (0.22 * skyT).toFixed(3));
    tints.horizon.setAttribute('opacity', (0.45 * groundT).toFixed(3));
    tints.ground.setAttribute('opacity', groundT.toFixed(3));

    // the planet spins with the scroll, plus a slow drift of its own
    drawSeams(p * Math.PI * 5 + idle);
    hint.style.opacity = 1 - span(p, 0, 0.05);

    // the wordmark comes forward, then flies up into the header
    const appear = span(p, 0.6, 0.72), land = span(p, 0.76, 0.88);
    const grow = mix(0.55, 1, appear);
    const scale = mix(flight.scale * grow, 1, land);
    logo.style.opacity = appear;
    logo.style.filter = appear < 1 ? `blur(${((1 - appear) * 10).toFixed(1)}px)` : 'none';
    logo.style.transform = `translate(${flight.dx * (1 - land)}px, ${flight.dy * (1 - land)}px) scale(${scale})`;
    navLinks.forEach((a, i) => {
      const t = span(p, 0.82 + i * 0.03, 0.88 + i * 0.03);
      a.style.opacity = t;
      a.style.transform = `translateY(${(1 - t) * 14}px)`;
    });
    header.classList.toggle('solid', pastScene);
  }

  function onScroll() {
    const r = intro.getBoundingClientRect();
    const run = intro.offsetHeight - innerHeight;
    progress = clamp(-r.top / run);
    pastScene = r.bottom <= header.offsetHeight; // the header turns solid once the sky has scrolled under it
  }

  function frame(now) {
    idle += (now - last) * 0.00025; // a slow, constant turn
    last = now;
    render();
    requestAnimationFrame(frame);
  }

  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { measure(); onScroll(); });
  document.fonts?.ready.then(measure);
  measure();
  onScroll();
  requestAnimationFrame(frame);
})();
