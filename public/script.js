// ---------- Data ----------
const IMG = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=75`;

const SERVICES = [
  { id: 'library', name: 'Library & Learning', icon: 'i-book', desc: 'Books, e-journals, study rooms and 24/7 reading halls.', img: IMG('photo-1521587760476-6c12a4b040da'), color: '#5b4632' },
  { id: 'living', name: 'Campus Living', icon: 'i-bed', desc: 'Hostels, dining, laundry and residence support.', img: IMG('photo-1562774053-701939374585'), color: '#6a7a5a' },
  { id: 'tech', name: 'Technology & Labs', icon: 'i-laptop', desc: 'Computer labs, campus Wi-Fi and IT help desk.', img: IMG('photo-1498050108023-c5249f4df085'), color: '#2f3d4f' },
  { id: 'assist', name: 'Student Assistance', icon: 'i-users', desc: 'Counselling, mentoring and career guidance.', img: IMG('photo-1522202176988-66273c2fd55f'), color: '#55606a' },
];

let EVENTS = []; // loaded from /api/events

const $ = (s, el = document) => el.querySelector(s);
const pad = (n) => String(n).padStart(2, '0');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
function dateParts(iso) { const [, m, d] = iso.split('-'); return { day: d, month: MONTHS[Number(m) - 1] }; }

async function api(path, options = {}) {
  const res = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...options });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

// ---------- Services (static content) ----------
$('#services-grid').innerHTML = SERVICES.map((s) => `
  <a class="service-card reveal" href="#register" id="svc-${s.id}" style="--fallback:${s.color}">
    <div class="bg" style="background-image:url('${s.img}')"></div>
    <div>
      <svg><use href="#${s.icon}"/></svg>
      <h3>${s.name}</h3>
      <p>${s.desc}</p>
    </div>
  </a>`).join('');

// ---------- Events (from the API) ----------
const eventSelect = $('#f-event');

function renderEvents() {
  $('#event-list').innerHTML = EVENTS.map((e) => {
    const { day, month } = dateParts(e.starts_on);
    return `
    <li class="event-item reveal in" id="evt-${esc(e.id)}">
      <div class="event-date"><strong>${day}</strong><span>${month}</span></div>
      <div class="event-info"><h3>${esc(e.title)}</h3><p>${esc(e.description)}</p></div>
      <button class="icon-btn event-go" data-event="${esc(e.id)}" aria-label="Register for ${esc(e.title)}"><svg><use href="#i-arrow"/></svg></button>
    </li>`;
  }).join('');

  const current = eventSelect.value;
  eventSelect.innerHTML = '<option value="">Choose an event</option>' + EVENTS.map((e) => {
    const { day, month } = dateParts(e.starts_on);
    const full = e.seats_left === 0;
    return `<option value="${esc(e.id)}"${full ? ' disabled' : ''}>${esc(e.title)} · ${day} ${month}${full ? ' (full)' : ''}</option>`;
  }).join('');
  eventSelect.value = current;
}

async function loadEvents() {
  try {
    const { ok, body } = await api('/api/events');
    if (!ok) throw new Error();
    EVENTS = body;
    renderEvents();
  } catch {
    $('#event-list').innerHTML = '<li class="event-item"><div class="event-info"><p>Events could not be loaded. Please refresh the page.</p></div></li>';
  }
}

// ---------- Stats ----------
function animateCount(el, target) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const from = Number(el.textContent) || 0;
  if (reduce || from === target) { el.textContent = pad(target); return; }
  const start = performance.now(), dur = 900;
  const tick = (t) => {
    const p = Math.min(1, (t - start) / dur);
    el.textContent = pad(Math.round(from + (target - from) * (1 - Math.pow(1 - p, 3))));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
async function loadStats() {
  const { ok, body } = await api('/api/stats').catch(() => ({ ok: false }));
  if (!ok) return;
  document.querySelectorAll('[data-count]').forEach((el) => {
    const v = body[el.dataset.count];
    if (typeof v === 'number') animateCount(el, v);
  });
}

// ---------- Event arrows pre-select the form ----------
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-event]');
  if (!btn) return;
  eventSelect.value = btn.dataset.event;
  clearError(eventSelect);
  $('#register').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => $('#f-name').focus({ preventScroll: true }), 500);
});

// ---------- Form validation ----------
const form = $('#reg-form');
const success = $('#reg-success');
const submitBtn = form.querySelector('button[type="submit"]');

const rules = {
  name: (v) => !v ? 'Please enter your full name.'
    : !/^[\p{L} .'-]{3,60}$/u.test(v) ? 'Use letters only (3–60 characters).' : '',
  reg: (v) => !v ? 'Please enter your registration number.'
    : !/^[A-Za-z0-9-]{5,15}$/.test(v) ? '5–15 letters, numbers or dashes.' : '',
  email: (v) => !v ? 'Please enter your email address.'
    : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? 'Enter a valid email address.' : '',
  event: (v) => !v ? 'Please choose an event.' : '',
};

function fieldOf(input) { return input.closest('.field'); }
function setError(input, msg) {
  const f = fieldOf(input);
  f.classList.toggle('invalid', !!msg);
  f.querySelector('.error').textContent = msg;
  input.setAttribute('aria-invalid', msg ? 'true' : 'false');
}
function clearError(input) { setError(input, ''); }
function validate(input) {
  const msg = rules[input.name](input.value.trim());
  setError(input, msg);
  return !msg;
}

form.querySelectorAll('input, select').forEach((input) => {
  input.addEventListener('blur', () => input.value && validate(input));
  input.addEventListener('input', () => fieldOf(input).classList.contains('invalid') && validate(input));
});

function showMessage(text, isError) {
  success.textContent = text;
  success.classList.toggle('is-error', !!isError);
  success.hidden = false;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  success.hidden = true;
  const inputs = [...form.querySelectorAll('input, select')];
  const ok = inputs.map(validate).every(Boolean);
  if (!ok) { form.querySelector('.invalid input, .invalid select').focus(); return; }

  const data = Object.fromEntries(new FormData(form));
  submitBtn.disabled = true;
  submitBtn.classList.add('is-loading');

  try {
    const res = await api('/api/registrations', { method: 'POST', body: JSON.stringify(data) });
    if (res.ok) {
      const { day, month } = dateParts(res.body.event.starts_on);
      showMessage(`You're registered for ${res.body.event.title} on ${day} ${month}, ${res.body.name.split(' ')[0]}. Confirmation ID: ${res.body.ref}`);
      form.reset();
      loadStats();
      loadEvents();
    } else if (res.body.errors) {
      for (const [name, msg] of Object.entries(res.body.errors)) {
        const input = form.elements[name];
        if (input) setError(input, msg);
      }
      form.querySelector('.invalid input, .invalid select')?.focus();
      if (res.body.errors.event) loadEvents();
    } else {
      showMessage(res.body.error || 'Registration failed. Please try again.', true);
    }
  } catch {
    showMessage('Could not reach the server. Check your connection and try again.', true);
  } finally {
    submitBtn.disabled = false;
    submitBtn.classList.remove('is-loading');
  }
});

// ---------- Theme ----------
const themeBtn = $('#theme-toggle');
function syncThemeIcon() {
  const dark = document.documentElement.dataset.theme === 'dark';
  themeBtn.querySelector('use').setAttribute('href', dark ? '#i-sun' : '#i-moon');
  themeBtn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
}
themeBtn.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('cc-theme', next); } catch { /* ignore */ }
  syncThemeIcon();
});
syncThemeIcon();

// ---------- Mobile menu ----------
const nav = $('#main-nav');
const menuBtn = $('#menu-toggle');
menuBtn.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', open);
  menuBtn.querySelector('use').setAttribute('href', open ? '#i-close' : '#i-menu');
});
nav.addEventListener('click', (e) => {
  if (e.target.tagName === 'A') { nav.classList.remove('open'); menuBtn.querySelector('use').setAttribute('href', '#i-menu'); menuBtn.setAttribute('aria-expanded', 'false'); }
});

// ---------- Active nav on scroll ----------
const sections = ['home', 'services', 'events', 'register'].map((id) => document.getElementById(id));
const navLinks = [...nav.querySelectorAll('a')];
const spy = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (en.isIntersecting) navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
sections.forEach((s) => spy.observe(s));

// ---------- Reveal on scroll ----------
const revealer = new IntersectionObserver((entries) => {
  entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); revealer.unobserve(en.target); } });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((el, i) => { el.style.transitionDelay = (i % 4) * 70 + 'ms'; revealer.observe(el); });

// ---------- Search ----------
const overlay = $('#search-overlay');
const searchInput = $('#search-input');
const results = $('#search-results');
function searchIndex() {
  return [
    ...SERVICES.map((s) => ({ label: s.name, kind: 'Service', text: s.desc, href: '#svc-' + s.id })),
    ...EVENTS.map((e) => { const { day, month } = dateParts(e.starts_on); return { label: e.title, kind: `Event · ${day} ${month}`, text: e.description, href: '#evt-' + e.id }; }),
  ];
}
function renderResults(q) {
  const query = q.trim().toLowerCase();
  const hits = searchIndex().filter((i) => !query || (i.label + ' ' + i.text).toLowerCase().includes(query));
  results.innerHTML = hits.length
    ? hits.map((h) => `<li><a href="${esc(h.href)}"><span>${esc(h.label)}</span><small>${esc(h.kind)}</small></a></li>`).join('')
    : `<li class="search-empty">No results for “${esc(q)}”.</li>`;
}
function openSearch() { overlay.hidden = false; searchInput.value = ''; renderResults(''); searchInput.focus(); }
function closeSearch() { overlay.hidden = true; $('#search-open').focus(); }

$('#search-open').addEventListener('click', openSearch);
$('#search-close').addEventListener('click', closeSearch);
searchInput.addEventListener('input', () => renderResults(searchInput.value));
overlay.addEventListener('click', (e) => { if (e.target === overlay) closeSearch(); });
results.addEventListener('click', (e) => { if (e.target.closest('a')) overlay.hidden = true; });
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { const first = results.querySelector('a'); if (first) first.click(); }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !overlay.hidden) closeSearch();
  if (e.key === '/' && overlay.hidden && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); openSearch(); }
});

// ---------- Boot ----------
loadEvents();
loadStats();
