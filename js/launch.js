// Shop launch: between the intro and the shop, a chrome capsule breaks up through the red
// ground and climbs out of frame, leaving a contrail that fades to white as the shop arrives.
// Cracks spread -> the ground shudders -> a hole opens -> the nose punches through, shards fly ->
// the camera follows it up (the ground drops away to sky) -> it leaves the top -> white.
// Only runs with the intro (see intro.js); otherwise the launch block is hidden by CSS.
(() => {
  if (!document.documentElement.classList.contains('intro-on')) return;

  const $ = (id) => document.getElementById(id);
  const launch = $('launch'), stage = $('launch-stage'), ground = $('launch-ground');
  const fx = $('launch-fx'), cracksG = $('cracks'), hole = $('hole'), holeG = $('hole-g');
  const shardsSvg = $('shards'), contrail = $('contrail'), wrap = $('capsule-wrap');
  const flame = $('flame-g'), whiteout = $('whiteout'), dust = $('dust');
  const NS = 'http://www.w3.org/2000/svg';

  const clamp = (x) => Math.min(1, Math.max(0, x));
  const lin = (p, a, b) => clamp((p - a) / (b - a));
  const span = (p, a, b) => { const x = lin(p, a, b); return x * x * (3 - 2 * x); };
  const mix = (a, b, t) => a + (b - a) * t;

  // The same cracks and shards every visit: a small seeded random generator.
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  let W = 0, H = 0, cap = 0;
  let cracks = [], shards = [];

  function build() {
    W = stage.clientWidth; H = stage.clientHeight; cap = wrap.offsetHeight || wrap.offsetWidth * 3;
    for (const svg of [fx, shardsSvg]) svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    seed = 7;
    cracksG.replaceChildren();
    cracks = Array.from({ length: 9 }, (_, i) => {
      const angle = (i / 9) * Math.PI * 2 + rand() * 0.5;
      const length = W * (0.12 + rand() * 0.22);
      let x = 0, y = 0;
      const pts = ['0,0'];
      for (let k = 1; k <= 6; k++) {
        const a = angle + (rand() - 0.5) * 0.7, step = length / 6;
        x += Math.cos(a) * step; y += Math.sin(a) * step * 0.38; // flattened: the ground lies in perspective
        pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      }
      const line = document.createElementNS(NS, 'polyline');
      line.setAttribute('points', pts.join(' '));
      line.setAttribute('pathLength', '1');
      line.style.strokeDasharray = '1';
      cracksG.appendChild(line);
      return { line, delay: rand() * 0.4 };
    });
    shardsSvg.replaceChildren();
    shards = Array.from({ length: 16 }, () => {
      const r = 10 + rand() * 26, n = 3 + Math.floor(rand() * 2);
      const pts = Array.from({ length: n }, (_, k) => {
        const a = (k / n) * Math.PI * 2 + rand() * 0.8, rr = r * (0.5 + rand() * 0.6);
        return `${(Math.cos(a) * rr).toFixed(1)},${(Math.sin(a) * rr).toFixed(1)}`;
      }).join(' ');
      const poly = document.createElementNS(NS, 'polygon');
      poly.setAttribute('points', pts);
      shardsSvg.appendChild(poly);
      const dir = -Math.PI * (0.06 + rand() * 0.88); // mostly upward and outward
      return { poly, dir, dist: H * (0.25 + rand() * 0.45), spin: (rand() - 0.5) * 900, start: rand() * 0.06 };
    });
  }

  function holePoints(r) {
    seed = 99;
    return Array.from({ length: 14 }, (_, k) => {
      const a = (k / 14) * Math.PI * 2, rr = r * (0.75 + rand() * 0.4);
      return `${(Math.cos(a) * rr).toFixed(1)},${(Math.sin(a) * rr * 0.36).toFixed(1)}`;
    }).join(' ');
  }

  let progress = 0;

  function render(now) {
    const p = progress;
    const drop = Math.pow(span(p, 0.3, 0.72), 1.3) * H * 1.05;  // the ground falls away as we follow the capsule up
    const crackY = H * 0.58 + drop;
    const shake = (span(p, 0.04, 0.15) - span(p, 0.18, 0.24)) * 4;
    const jx = Math.sin(now / 37) * shake, jy = Math.cos(now / 29) * shake * 0.6;
    ground.style.transform = `translate(${jx}px, ${drop + jy}px)`;

    // cracks spread from the centre, then a hole tears open
    cracksG.setAttribute('transform', `translate(${W / 2 + jx} ${crackY + jy})`);
    cracks.forEach(({ line, delay }) => { line.style.strokeDashoffset = 1 - span(p, 0.02 + delay * 0.1, 0.14 + delay * 0.08); });
    const bodyW = cap / 3 * 0.6;
    const r = span(p, 0.14, 0.22) * bodyW * 1.05;
    hole.setAttribute('points', holePoints(r));
    holeG.setAttribute('transform', `translate(${W / 2} ${crackY})`);
    fx.style.opacity = 1 - span(p, 0.6, 0.72);

    // the capsule: accelerating from inside the ground to beyond the top of the screen
    const climb = Math.pow(lin(p, 0.15, 0.8), 1.7);
    const noseY = mix(crackY + 12, -cap * 0.75, climb);
    const top = noseY - cap * 0.014;
    const sway = Math.sin(now / 900) * 1.2 * climb;
    wrap.style.transform = `translate(-50%, ${top}px) rotate(${sway}deg)`;
    const hidden = Math.max(0, top + cap - crackY);          // the part still below the ground
    wrap.style.clipPath = `inset(0 -50% ${hidden}px -50%)`;
    const engineY = top + cap * 0.62;
    const out = engineY < crackY;
    flame.style.opacity = out ? 1 : 0;
    flame.setAttribute('transform', `translate(0 100) scale(${(1 + Math.sin(now / 45) * 0.06 + Math.random() * 0.05).toFixed(3)} ${(0.9 + Math.random() * 0.25).toFixed(3)}) translate(0 -100)`);

    // the contrail hangs from the engine down to the hole, then thins away
    const trailTop = Math.max(-40, engineY + cap * 0.08);
    contrail.style.top = `${trailTop}px`;
    contrail.style.height = `${Math.max(0, crackY - trailTop)}px`;
    contrail.style.opacity = span(p, 0.28, 0.4) * (1 - span(p, 0.84, 0.97));

    // shards burst out of the hole when the nose punches through
    shards.forEach((s) => {
      const t = lin(p, 0.19 + s.start, 0.5 + s.start);
      const x = W / 2 + Math.cos(s.dir) * s.dist * t;
      const y = crackY + Math.sin(s.dir) * s.dist * t + t * t * H * 0.35;
      s.poly.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(s.spin * t).toFixed(1)})`);
      s.poly.style.opacity = t > 0 && t < 1 ? 1 - t : 0;
    });

    // a puff of dust where it breaks through
    const puff = span(p, 0.17, 0.23);
    dust.style.opacity = (puff * (1 - span(p, 0.3, 0.5))).toFixed(3);
    dust.style.transform = `translate(-50%, ${crackY - cap * 0.16}px) scale(${(0.4 + puff * 0.6 + span(p, 0.23, 0.5) * 0.5).toFixed(3)})`;

    whiteout.style.opacity = span(p, 0.86, 1);
  }

  function onScroll() {
    const rect = launch.getBoundingClientRect();
    progress = clamp(-rect.top / (launch.offsetHeight - innerHeight));
  }

  function frame(now) {
    const rect = launch.getBoundingClientRect();
    if (rect.bottom > 0 && rect.top < innerHeight) render(now); // only work while it's on screen
    requestAnimationFrame(frame);
  }

  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { build(); onScroll(); });
  build();
  onScroll();
  requestAnimationFrame(frame);
})();
