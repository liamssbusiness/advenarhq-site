(() => {
  const WORKER_URL = (window.ADVENAR_WORKER_URL || '').replace(/\/+$/, ''); // set in index.html head in Task 6
  const form = document.getElementById('audit-form');
  const status = document.getElementById('form-status');
  const left = document.getElementById('audits-left');
  const btn = form && form.querySelector('button[type=submit]');
  const REACH = '<a href="tel:+13237990663">call or text 323-799-0663</a>, <a href="mailto:advenarhq@gmail.com">email advenarhq@gmail.com</a>, or <a href="https://cal.com/advenarhq/15min">book a 15-minute call</a>';
  const FALLBACK = 'Something broke on my end. Please ' + REACH + ' and I\'ll start your test today.';
  function say(html) { status.innerHTML = html; } // static strings only, never user input
  function setLeft(n) {
    if (!left || !Number.isFinite(n)) return;
    if (n <= 0) { left.textContent = 'This month\'s 10 free tests are taken.'; if (btn) btn.textContent = 'Get on next month\'s list'; const ps = document.getElementById('ps-link'); if (ps) ps.textContent = 'Get on next month\'s list'; }
    else left.textContent = `${n} of 10 free tests left this month.`;
  }
  if (WORKER_URL) fetch(WORKER_URL + '/count').then(r => r.json()).then(j => { if (j && Number.isFinite(j.left)) setLeft(j.left); }).catch(() => {});
  if (!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!WORKER_URL) { say(FALLBACK); return; }
    const data = Object.fromEntries(new FormData(form));
    btn.disabled = true; say('Sending...');
    try {
      const r = await fetch(WORKER_URL + '/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const j = await r.json().catch(() => ({}));
      if (j.ok) {
        form.reset();
        say(j.mode === 'audit'
          ? 'Got it. I\'ll text you to confirm. Your report lands within 3 business days. Want to talk sooner? <a href="https://cal.com/advenarhq/15min">Book a 15-minute call.</a>'
          : 'You\'re on next month\'s list. I\'ll text you the day a spot opens. Want to talk sooner? <a href="https://cal.com/advenarhq/15min">Book a 15-minute call.</a>');
        setLeft(j.left);
      } else if (r.status === 429) {
        say('You\'ve sent a few requests today. Please ' + REACH + ' and I\'ll start your test.');
      } else if (r.status === 400) {
        const msg = { name: 'Add your name.', business: 'Add your business name.', phone: 'Check that phone number.', website: 'That website looks too long.', trade: 'Pick your trade.' }[j.error];
        if (msg) status.textContent = msg; else say(FALLBACK);
      } else say(FALLBACK);
    } catch { say(FALLBACK); }
    finally { btn.disabled = false; }
  });
})();
