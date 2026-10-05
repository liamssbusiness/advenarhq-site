/* Advenar homepage: the paper planner and its scroll story.
   Builds the planner into #planner (hero) and .planner--full (#apply),
   then fills the hero one as the story scrolls. Only transform, opacity
   and SVG stroke-dashoffset are animated. */
(function () {
  'use strict';

  var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  // The week that fills up. batch = which "How it works" step books it.
  var SLOTS = [
    { day: 0, time: '9:00',  label: 'AC tune-up',        batch: 1 },
    { day: 0, time: '1:30',  label: 'Roof estimate',     batch: 2 },
    { day: 1, time: '10:00', label: 'Furnace check',     batch: 2 },
    { day: 1, time: '2:00',  label: 'New install quote', batch: 1 },
    { day: 2, time: '8:30',  label: 'AC repair',         batch: 2 },
    { day: 2, time: '11:00', label: 'Estimate',          batch: 1 },
    { day: 2, time: '3:00',  label: 'Duct quote',        batch: 3 },
    { day: 3, time: '9:00',  label: 'AC repair',         batch: 1 },
    { day: 3, time: '1:00',  label: 'Walkthrough',       batch: 3 },
    { day: 4, time: '10:30', label: 'Install quote',     batch: 2 },
    { day: 4, time: '2:30',  label: 'Estimate',          batch: 3 }
  ];

  // The lead that got away: lands in Tuesday's 2:00 slot, then leaves.
  var LOST = { day: 1, time: '2:00', label: 'Lead: AC died', note: 'Went to the<br>next guy' };

  // Tiny hand-placed tilts so the cards don't look machine-stamped.
  var TILT = [-0.8, 0.6, -0.4, 0.9, -0.6, 0.3, -0.9, 0.5, -0.3, 0.7, -0.5];

  var CHECK_PATH = 'M3.2 12.6c1.9 1.3 3.7 3.4 5.4 6.6.3.5.9.5 1.1 0C12.8 11.5 17.6 5.9 24.6 1.8';

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function checkSvg(cls) {
    return '<svg class="' + cls + '" viewBox="0 0 28 22" aria-hidden="true" focusable="false">' +
      '<path pathLength="1" d="' + CHECK_PATH + '"/></svg>';
  }

  function mondayOf(date) {
    var d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d;
  }

  /* ---------- Build ---------- */

  function buildPlanner(root) {
    var monday = mondayOf(new Date());
    root.classList.add('planner');
    root.innerHTML = '';

    var stage = el('div', 'pl-stage');
    var glow = el('div', 'paper-glow');
    var paper = el('div', 'paper');

    var head = el('div', 'pl-head');
    head.appendChild(el('div', 'pl-title',
      '<span class="pl-kicker">Week of</span><span class="pl-date">' +
      monday.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) + '</span>'));
    head.appendChild(el('div', 'pl-key', checkSvg('check check--key') + '<span>showed up</span>'));
    paper.appendChild(head);

    var week = el('div', 'pl-week');
    var dayCols = DAYS.map(function (name, i) {
      var date = new Date(monday);
      date.setDate(monday.getDate() + i);
      var col = el('div', 'pl-day');
      col.appendChild(el('div', 'pl-dn', '<span>' + name + '</span><b>' + date.getDate() + '</b>'));
      week.appendChild(col);
      return col;
    });
    paper.appendChild(week);

    var refs = { root: root, stage: stage, glow: glow, paper: paper, slots: [], lost: null };

    SLOTS.forEach(function (s, i) {
      var slot = el('div', 'slot');
      slot.appendChild(el('div', 'ghost', '<b>' + s.time + '</b><span class="l">open</span>'));
      var isLost = s.day === LOST.day && s.time === LOST.time;
      // The lost lead covers the "open" slot with its own paper patch, so it never
      // animates the ghost (batch 1 owns that).
      if (isLost) slot.appendChild(el('div', 'mask'));

      var chip = el('div', 'chip');
      var appt = el('div', 'appt', '<b>' + s.time + '</b><span class="l">' + s.label + '</span>');
      appt.style.setProperty('--r', TILT[i % TILT.length] + 'deg');
      chip.appendChild(appt);
      chip.insertAdjacentHTML('beforeend', checkSvg('check'));
      chip.lastChild.style.setProperty('--cr', (TILT[(i + 4) % TILT.length] * 6 - 4) + 'deg');
      slot.appendChild(chip);

      if (isLost) {
        var lost = el('div', 'lost');
        lost.innerHTML =
          '<span class="ring"></span>' +
          '<div class="appt appt--lost"><span class="flash"></span>' +
          '<b>' + LOST.time + '</b><span class="l">' + LOST.label + '</span></div>';
        var note = el('span', 'note', LOST.note);
        slot.appendChild(lost);
        slot.appendChild(note);
        refs.lost = {
          el: lost, slot: slot, mask: slot.querySelector('.mask'), note: note,
          card: lost.querySelector('.appt'), ring: lost.querySelector('.ring'), flash: lost.querySelector('.flash')
        };
      }

      dayCols[s.day].appendChild(slot);
      refs.slots.push({ chip: chip, ghost: slot.firstChild, path: chip.querySelector('.check path'), batch: s.batch });
    });

    stage.appendChild(glow);
    stage.appendChild(paper);
    root.appendChild(stage);
    return refs;
  }

  /* ---------- Finished state (reduced motion, no GSAP, #apply) ---------- */

  function fillAll(target) {
    var roots = target ? [target] : document.querySelectorAll('.planner');
    Array.prototype.forEach.call(roots, function (root) {
      root.classList.add('is-full');
      root.querySelectorAll('.pl-stage, .paper-glow, .ghost, .mask, .chip, .lost, .note, .check path').forEach(function (n) {
        n.removeAttribute('style');
      });
      root.querySelectorAll('.chip').forEach(function (c) { c.classList.add('filled'); });
    });
  }

  /* ---------- Motion ---------- */

  // Timeline pacing (seconds): chip stagger, landing, check ink, check stagger.
  var DESKTOP = { gap: 0.3, drop: 0.8, ink: 0.5, inkGap: 0.32 };
  var PHONE = { gap: 0.1, drop: 0.6, ink: 0.35, inkGap: 0.12 };

  // Drop a batch of chips, then ink their checks one by one.
  // Returns the time each chip lands, for the .filled marker.
  function addBatch(tl, items, at, pace) {
    var d = pace.drop;
    var marks = [];
    items.forEach(function (s, i) {
      var t = at + i * pace.gap;
      // The "open" slot clears before the card appears, so the two never show at once.
      tl.fromTo(s.ghost, { opacity: 1 }, { opacity: 0, duration: d * 0.2, ease: 'none' }, t)
        .fromTo(s.chip, { y: -18, rotation: -3 }, { y: 0, rotation: 0, duration: d, ease: 'power3.out' }, t)
        .fromTo(s.chip, { opacity: 0 }, { opacity: 1, duration: d * 0.25, ease: 'none' }, t + d * 0.2);
      marks.push({ el: s.chip, at: t + d * 0.6 });
    });
    var inkAt = at + (items.length - 1) * pace.gap + d * 0.85;
    items.forEach(function (s, i) {
      tl.fromTo(s.path, { strokeDashoffset: 1 },
        { strokeDashoffset: 0, duration: pace.ink, ease: 'power1.inOut' }, inkAt + i * pace.inkGap);
    });
    return marks;
  }

  // Keep .filled in sync with the playhead, both directions.
  function trackFilled(tl, marks) {
    tl.eventCallback('onUpdate', function () {
      var t = tl.time();
      marks.forEach(function (m) { m.el.classList.toggle('filled', t >= m.at - 1e-6); });
    });
  }

  function byBatch(p, n) {
    return p.slots.filter(function (s) { return s.batch === n; });
  }

  // Desktop: sticky planner, scrubbed across #problem and the three #how steps.
  function desktopStory(p) {
    var gsap = window.gsap;
    var L = p.lost;

    gsap.fromTo(p.stage, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 1.4, ease: 'power2.out', delay: 0.15 });

    // The lead that got away.
    var lt = gsap.timeline({
      scrollTrigger: { trigger: '#problem', start: 'top 55%', end: 'bottom 58%', scrub: 0.8, invalidateOnRefresh: true }
    });
    // Lands in Tue 2:00 and rings (red-amber pulse)...
    lt.fromTo(L.el, { opacity: 0, x: 0, y: -22, rotation: -4 }, { opacity: 1, y: 0, rotation: 0, duration: 1, ease: 'power3.out' })
      .fromTo(L.mask, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'none' }, '<0.3')
      .fromTo(L.ring, { opacity: 0, scale: 1 }, { opacity: 0.9, scale: 1.16, duration: 0.45, ease: 'sine.inOut', repeat: 3, yoyo: true }, '>')
      .fromTo(L.flash, { opacity: 0 }, { opacity: 0.85, duration: 0.45, ease: 'sine.inOut', repeat: 3, yoyo: true }, '<')
      // ...nobody picks up: it goes cold...
      .fromTo(L.card, { opacity: 1 }, { opacity: 0.3, duration: 0.8, ease: 'power1.out' }, '>')
      .fromTo(L.note, { opacity: 0, y: 5 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '<0.3')
      // ...and drifts off the page to the next guy. The slot is open again.
      .to(L.el, {
        x: function () {
          return p.paper.getBoundingClientRect().right - L.slot.getBoundingClientRect().left + 24;
        },
        duration: 2.2, ease: 'power1.in'
      }, '>+0.6')
      .to(L.card, { opacity: 0, duration: 0.9, ease: 'none' }, '<1.3')
      .to(L.mask, { opacity: 0, duration: 0.6, ease: 'none' }, '<0.2')
      .to(L.note, { opacity: 0, duration: 0.7, ease: 'none' }, '>+0.5');

    // Three steps, three batches (4, 4, 3). The last also lifts the glow.
    var steps = document.querySelectorAll('#how .steps > li');
    [1, 2, 3].forEach(function (n, k) {
      var last = n === 3;
      var tl = gsap.timeline({
        scrollTrigger: last
          ? { trigger: steps[k], start: 'top 80%', endTrigger: '#how', end: 'bottom bottom', scrub: 0.8 }
          : { trigger: steps[k], start: 'top 80%', end: 'top 62%', scrub: 0.8 }
      });
      trackFilled(tl, addBatch(tl, byBatch(p, n), 0, DESKTOP));
      if (last) tl.fromTo(p.glow, { opacity: 0 }, { opacity: 1, duration: 1, ease: 'power1.inOut' }, '>-0.2');
    });

    return function () { p.slots.forEach(function (s) { s.chip.classList.remove('filled'); }); };
  }

  // Phones: no sticky, no lost lead. The week fills once, on its own, when it scrolls into view.
  function phoneStory(p) {
    var tl = window.gsap.timeline({
      paused: true,
      scrollTrigger: { trigger: p.root, start: 'bottom 92%', once: true }
    });
    var marks = [];
    [1, 2, 3].forEach(function (n) {
      // Each batch starts while the previous batch's last checks are still inking.
      marks = marks.concat(addBatch(tl, byBatch(p, n), n === 1 ? 0.45 : tl.duration() - 0.3, PHONE));
    });
    tl.fromTo(p.glow, { opacity: 0 }, { opacity: 1, duration: 1, ease: 'power1.inOut' }, '>-0.3');
    trackFilled(tl, marks);

    return function () { p.slots.forEach(function (s) { s.chip.classList.remove('filled'); }); };
  }

  /* ---------- Init ---------- */

  function init() {
    var heroRoot = document.getElementById('planner');
    var fullRoot = document.querySelector('.planner--full');
    var hero = heroRoot && buildPlanner(heroRoot);
    if (fullRoot) { buildPlanner(fullRoot); fillAll(fullRoot); }

    window.AdvenarPlanner = { fillAll: fillAll };
    if (!hero) return;

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!window.gsap || !window.ScrollTrigger || reduce) { fillAll(); return; }

    window.gsap.registerPlugin(window.ScrollTrigger);
    mm = window.gsap.matchMedia();
    mm.add('(min-width: 900px)', function () { return desktopStory(hero); });
    mm.add('(max-width: 899.98px)', function () { return phoneStory(hero); });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { window.ScrollTrigger.refresh(); });
    }
  }

  // If anything throws, the hero must still read: show the finished week, or
  // collapse the planner if it never got built.
  var mm = null;
  try {
    init();
  } catch (err) {
    if (window.console) console.error('planner init failed', err);
    try { if (mm) mm.revert(); } catch (e) { /* ignore */ }
    var hr = document.getElementById('planner');
    if (hr && hr.querySelector('.paper')) fillAll();
    else if (hr) { hr.innerHTML = ''; hr.hidden = true; hr.classList.add('is-failed'); }
  }
})();
