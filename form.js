(() => {
  const WORKER_URL = window.ADVENAR_WORKER_URL || ''; // set in index.html head in Task 6
  const form = document.getElementById('audit-form');
  const status = document.getElementById('form-status');
  const left = document.getElementById('audits-left');
  const btn = form && form.querySelector('button[type=submit]');
  const FALLBACK = 'Something broke on my end. Email me at advenarhq@gmail.com and I\'ll start your audit today.';
  function setLeft(n) {
    if (!left || !Number.isFinite(n)) return;
    if (n <= 0) { left.textContent = 'This month\'s 10 free audits are taken.'; if (btn) btn.textContent = 'Get on next month\'s list'; }
    else left.textContent = `${n} of 10 free audits left this month.`;
  }
  if (WORKER_URL) fetch(WORKER_URL + '/count').then(r => r.json()).then(j => { if (j && Number.isFinite(j.left)) setLeft(j.left); }).catch(() => {});
  if (!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!WORKER_URL) { status.textContent = FALLBACK; return; }
    const data = Object.fromEntries(new FormData(form));
    btn.disabled = true; status.textContent = 'Sending...';
    try {
      const r = await fetch(WORKER_URL + '/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const j = await r.json();
      if (j.ok) {
        form.reset();
        status.textContent = j.mode === 'audit'
          ? 'Got it. Your audit has started. I\'ll text you to confirm, and your report lands within 3 business days.'
          : 'You\'re on next month\'s list. I\'ll text you the day a spot opens.';
        setLeft(j.left);
      } else if (r.status === 429) {
        status.textContent = 'You\'ve sent a few requests today. Email me at advenarhq@gmail.com and I\'ll start your audit.';
      } else if (r.status === 400) {
        status.textContent = { name: 'Add your name.', business: 'Add your business name.', phone: 'Check that phone number.', website: 'That website looks too long.', trade: 'Pick your trade.' }[j.error] || FALLBACK;
      } else status.textContent = FALLBACK;
    } catch { status.textContent = FALLBACK; }
    finally { btn.disabled = false; }
  });
})();
