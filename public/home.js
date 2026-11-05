// Home page: services, events, notices preview, registration, manage booking, FAQ, contact.
const { $, $$, esc, pad, icon, api, post, toast, openModal, closeModal, field, setError, bindForm, rules, dateParts, fmtDay, fmtTime, downloadIcs, reveal } = CC;

const IMG = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=75`;

const GMAP = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q + ', Lovely Professional University, Phagwara')}`;

const SERVICES = [
  {
    id: 'library', name: 'Library & Learning', icon: 'i-book', color: '#5b4632', img: IMG('photo-1521587760476-6c12a4b040da'),
    desc: 'Central library, reading halls and e-resources.',
    about: 'LPU’s central library and reading halls serve every school on campus, with print collections and online journals for coursework and research.',
    location: 'Central Library, LPU campus', contact: 'Library help desk · LPU helpline +91 1824 517000',
    offers: ['Borrow and return books with your student ID', 'Reading halls for self-study', 'Online journals and e-books for research', 'Report a lost book through the Help Desk'],
    map: GMAP('Central Library'), mapLabel: 'Find on Google Maps', ticket: 'Library', tags: 'books journals study reading',
  },
  {
    id: 'living', name: 'Campus Living', icon: 'i-bed', color: '#6a7a5a', img: IMG('photo-1562774053-701939374585'),
    desc: 'Hostels, food courts, Uni Mall and residence support.',
    about: 'Separate boys’ and girls’ hostels on campus, with laundry, common rooms, gyms and canteens. Uni Mall and the food courts are a short walk away.',
    location: 'Hostels and Uni Mall, LPU campus', contact: 'Hostel warden office · LPU helpline +91 1824 517000',
    offers: ['Room allocation and hostel queries', 'Mess, canteens and Uni Mall food courts', 'Laundry and common rooms', 'Maintenance requests through the Help Desk'],
    map: GMAP('LPU hostel'), mapLabel: 'Find hostels on Google Maps', ticket: 'Hostel', tags: 'hostel mess dining laundry room uni mall',
  },
  {
    id: 'tech', name: 'Technology & Labs', icon: 'i-laptop', color: '#2f3d4f', img: IMG('photo-1498050108023-c5249f4df085'),
    desc: 'Computer labs, campus Wi-Fi and IT support.',
    about: 'Computer labs across the academic blocks, including the Lovely Institute of Technology, plus campus Wi-Fi and IT support for student accounts.',
    location: 'Lovely Institute of Technology and academic blocks', contact: 'IT support desk · LPU helpline +91 1824 517000',
    offers: ['Campus Wi-Fi and student account help', 'Lab access for coursework and projects', 'Software for engineering and design courses', 'Raise IT issues through the Help Desk'],
    map: '/campus#lit', mapLabel: 'View on campus map', ticket: 'IT & Wi-Fi', tags: 'wifi it computer software lab',
  },
  {
    id: 'assist', name: 'Student Assistance', icon: 'i-users', color: '#55606a', img: IMG('photo-1522202176988-66273c2fd55f'),
    desc: 'Student well-being, counselling and placements.',
    about: 'LPU’s Student Well-Being office handles counselling and student concerns, and the Division of Career Services runs placements and career preparation.',
    location: 'LPU campus', contact: 'Well-being +91 1824 520150 · dsr@lpu.co.in · Placements +91 1824 444500 · placement@lpu.co.in',
    offers: ['Confidential counselling and well-being support', 'Placement drives and career preparation', 'Scholarship and fee guidance', 'Uni Hospital for medical help, round the clock'],
    map: GMAP('Uni Hospital'), mapLabel: 'Find Uni Hospital', ticket: 'Academics', tags: 'counselling career placement wellbeing hospital',
  },
];
window.CC_SERVICES = SERVICES;

const FAQS = [
  ['How do I register for an event?', 'Pick an event in the <a href="#register">registration form</a>, fill in your name, registration number and email, and submit. You get a confirmation ID straight away.'],
  ['Can I cancel a registration?', 'Yes. Use <a href="#manage" data-open-manage>Manage my registration</a> with your confirmation ID and email, then choose Cancel. Your seat goes back to other students.'],
  ['I lost my ID card or a bag. What do I do?', 'Check <a href="/lost-found">Lost &amp; Found</a> to see if someone handed it in. If not, post a “lost” report so finders can reach you without seeing your email.'],
  ['How do I report a hostel, Wi-Fi or fee problem?', 'Raise a ticket at the <a href="/help-desk">Help Desk</a>. You get a ticket ID to track progress and read replies from the team.'],
  ['How do I join a club?', 'Browse <a href="/clubs">Clubs &amp; Communities</a> and press “Request to join”. The club’s coordinators review requests every week.'],
  ['Where can I find exam dates and holidays?', 'The <a href="/notices">Notice Board</a> has every official announcement. Pinned notices are the most important.'],
  ['Where is everything on the LPU campus?', 'Open the <a href="/campus">LPU Campus Map</a>. It has an interactive map, a Google Maps view with block numbers, key facilities and how to reach Phagwara.'],
  ['Is this the official LPU website?', 'No. Campus Connect 360 is an independent student project. For admissions, fees and official notices use <a href="https://www.lpu.in" target="_blank" rel="noopener">lpu.in</a>.'],
];

let EVENTS = [];
const eventSelect = $('#f-event');

// ---------- Services ----------
$('#services-grid').innerHTML = SERVICES.map((s) => `
  <button type="button" class="service-card reveal" id="svc-${s.id}" data-service="${s.id}" style="--fallback:${s.color}" aria-label="${esc(s.name)}: details">
    <div class="bg" style="background-image:url('${s.img}')"></div>
    <div>
      ${icon(s.icon)}
      <h3>${esc(s.name)}</h3>
      <p>${esc(s.desc)}</p>
    </div>
  </button>`).join('');

function openService(id) {
  const s = SERVICES.find((x) => x.id === id);
  if (!s) return;
  openModal(`
    <div class="modal-hero" style="background-image:url('${s.img}');background-color:${s.color}"></div>
    <p class="eyebrow">Campus Service</p>
    <h2>${esc(s.name)}</h2>
    <p class="lead">${esc(s.about)}</p>
    <dl class="detail-list">
      <dt>${icon('i-pin')} Where</dt><dd>${esc(s.location)}</dd>
      <dt>${icon('i-mail')} Contact</dt><dd>${esc(s.contact)}</dd>
    </dl>
    <ul class="bullets">${s.offers.map((o) => `<li>${esc(o)}</li>`).join('')}</ul>
    <div class="btn-row">
      <a class="btn btn-dark btn-sm" href="${s.map}"${s.map.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${icon('i-map')} ${esc(s.mapLabel)}</a>
      <a class="btn btn-outline btn-sm" href="/help-desk?category=${encodeURIComponent(s.ticket)}">${icon('i-ticket')} Raise a ticket</a>
    </div>`);
}
$('#services-grid').addEventListener('click', (e) => { const b = e.target.closest('[data-service]'); if (b) openService(b.dataset.service); });

// ---------- Events ----------
function seatsText(e) {
  if (e.seats_left === 0) return '<span class="seats-full">Full</span>';
  if (e.seats_left <= Math.max(10, e.capacity * 0.1)) return `<span class="seats-low">${e.seats_left} seats left</span>`;
  return `${e.seats_left} seats left`;
}

function renderEvents() {
  const list = $('#event-list');
  if (!EVENTS.length) {
    list.innerHTML = '<li class="event-item"><div class="event-info"><h3>No upcoming events</h3><p>New events are announced on the <a class="text-link" href="/notices">Notice Board</a>.</p></div></li>';
  } else {
    list.innerHTML = EVENTS.map((e) => {
      const { day, month } = dateParts(e.starts_on);
      return `
      <li class="event-item" id="evt-${esc(e.id)}">
        <div class="event-date"><strong>${day}</strong><span>${month}</span></div>
        <div class="event-info">
          <h3><button type="button" class="event-title-btn" data-details="${esc(e.id)}">${esc(e.title)}</button></h3>
          <p>${esc(e.description)}</p>
          <div class="event-meta"><span>${icon('i-clock')}${fmtTime(e.start_time)}</span><span>${icon('i-pin')}${esc(e.venue)}</span><span>${seatsText(e)}</span></div>
        </div>
        <button class="icon-btn event-go" data-event="${esc(e.id)}" aria-label="Register for ${esc(e.title)}"${e.seats_left === 0 ? ' disabled title="This event is full"' : ''}>${icon('i-arrow')}</button>
      </li>`;
    }).join('');
  }

  const current = eventSelect.value;
  eventSelect.innerHTML = '<option value="">Choose an event</option>' + EVENTS.map((e) => {
    const { day, month } = dateParts(e.starts_on);
    const full = e.seats_left === 0;
    return `<option value="${esc(e.id)}"${full ? ' disabled' : ''}>${esc(e.title)} · ${day} ${month}${full ? ' (full)' : ''}</option>`;
  }).join('');
  if ([...eventSelect.options].some((o) => o.value === current && !o.disabled)) eventSelect.value = current;
}

async function loadEvents() {
  try {
    const r = await api('/api/events');
    if (!r.ok) throw new Error();
    const first = !EVENTS.length && !loadEvents.done;
    EVENTS = r.body;
    loadEvents.done = true;
    renderEvents();
    if (first && location.hash.startsWith('#evt-')) handleHash();
  } catch {
    $('#event-list').innerHTML = '<li class="event-item"><div class="event-info"><p>Events could not be loaded. <button class="link-btn" type="button" id="events-retry">Try again</button></p></div></li>';
    $('#events-retry')?.addEventListener('click', loadEvents);
  }
}

function pickEvent(id) {
  eventSelect.value = id;
  setError(eventSelect, '');
  closeModal();
  $('#register').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => $('#f-name').focus({ preventScroll: true }), 450);
}

async function share(e) {
  const url = `${location.origin}/#evt-${e.id}`;
  try {
    if (navigator.share) { await navigator.share({ title: e.title, text: e.description, url }); return; }
    await navigator.clipboard.writeText(url);
    toast('Event link copied');
  } catch (err) {
    if (err?.name !== 'AbortError') toast('Could not share. Copy the address bar link instead.', 'err');
  }
}

function openEvent(id) {
  const e = EVENTS.find((x) => x.id === id);
  if (!e) return;
  const pct = Math.min(100, Math.round((e.registered / e.capacity) * 100));
  openModal(`
    <p class="eyebrow">Upcoming Event</p>
    <h2>${esc(e.title)}</h2>
    <p class="lead">${esc(e.description)}</p>
    <dl class="detail-list">
      <dt>${icon('i-calendar')} Date</dt><dd>${fmtDay(e.starts_on)}</dd>
      <dt>${icon('i-clock')} Time</dt><dd>${fmtTime(e.start_time)}</dd>
      <dt>${icon('i-pin')} Venue</dt><dd>${esc(e.venue)}</dd>
      <dt>${icon('i-users')} Seats</dt><dd>${seatsText(e)} <span class="muted">· ${e.registered} of ${e.capacity} taken (${pct}%)</span></dd>
    </dl>
    <div class="btn-row">
      <button class="btn btn-dark btn-sm" type="button" data-pick="${esc(e.id)}"${e.seats_left === 0 ? ' disabled' : ''}>${e.seats_left === 0 ? 'Event full' : 'Register now'} ${icon('i-arrow')}</button>
      <button class="btn btn-outline btn-sm" type="button" data-ics>${icon('i-calendar')} Add to calendar</button>
      <button class="btn btn-outline btn-sm" type="button" data-share>Share</button>
    </div>`, (body) => {
    body.querySelector('[data-pick]')?.addEventListener('click', () => pickEvent(e.id));
    body.querySelector('[data-ics]').addEventListener('click', () => downloadIcs(e));
    body.querySelector('[data-share]').addEventListener('click', () => share(e));
  });
}

document.addEventListener('click', (ev) => {
  const go = ev.target.closest('[data-event]');
  if (go) { pickEvent(go.dataset.event); return; }
  const det = ev.target.closest('[data-details]');
  if (det) openEvent(det.dataset.details);
});

// ---------- Stats ----------
function animateCount(el, target) {
  const suffix = el.dataset.suffix || '';
  const from = parseInt(el.textContent, 10) || 0;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || from === target) { el.textContent = pad(target) + suffix; return; }
  const start = performance.now(), dur = 900;
  const tick = (t) => {
    const p = Math.min(1, (t - start) / dur);
    el.textContent = pad(Math.round(from + (target - from) * (1 - Math.pow(1 - p, 3)))) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
async function loadStats() {
  const r = await api('/api/stats').catch(() => null);
  if (!r?.ok) return;
  $$('[data-count]').forEach((el) => { const v = r.body[el.dataset.count]; if (typeof v === 'number') animateCount(el, v); });
}

// ---------- Notices preview ----------
async function loadNotices() {
  const box = $('#notice-strip');
  box.innerHTML = '<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>';
  const r = await api('/api/notices').catch(() => null);
  if (!r?.ok) { box.innerHTML = '<p class="muted">Notices could not be loaded.</p>'; return; }
  const items = r.body.slice(0, 3);
  box.innerHTML = items.length ? items.map((n) => `
    <a class="notice${n.pinned ? ' pinned' : ''}" href="/notices#notice-${n.id}">
      <div class="notice-top">${n.pinned ? `<span class="badge badge-info">${icon('i-star')}Pinned</span>` : ''}<span class="badge">${esc(n.category)}</span><time datetime="${esc(n.created_at)}">${CC.timeAgo(n.created_at)}</time></div>
      <h3>${esc(n.title)}</h3>
      <p>${esc(n.body)}</p>
    </a>`).join('') : '<div class="empty-state"><strong>No notices yet</strong>New announcements will appear here.</div>';
}

// ---------- Registration ----------
const regForm = $('#reg-form');
const regSuccess = $('#reg-success');
bindForm(regForm, {
  rules: { name: rules.name, reg: rules.reg, email: rules.email, event: rules.required('Please choose an event.') },
  submit: (data) => { regSuccess.hidden = true; return post('/api/registrations', data); },
  onSuccess: (body, form) => {
    const { day, month } = dateParts(body.event.starts_on);
    regSuccess.innerHTML = `<strong>You’re registered, ${esc(body.name.split(' ')[0])}!</strong><br>
      ${esc(body.event.title)} · ${day} ${month} · ${fmtTime(body.event.start_time)} · ${esc(body.event.venue)}<br>
      Confirmation ID: <b>${esc(body.ref)}</b> <span class="muted">(save it to manage your registration)</span>
      <div class="btn-row" style="margin-top:10px"><button class="btn btn-sm btn-outline" type="button" id="reg-ics">${icon('i-calendar')} Add to calendar</button></div>`;
    regSuccess.classList.remove('is-error');
    regSuccess.hidden = false;
    $('#reg-ics').addEventListener('click', () => downloadIcs(body.event));
    form.reset();
    loadStats();
    loadEvents();
  },
  onError: (res) => { if (res.body.errors?.event) loadEvents(); },
});
// Server-level errors (not field errors) should show in the same box as successes.
regForm.addEventListener('submit', () => { regForm.querySelector('.form-msg')?.remove(); }, true);

// ---------- Manage my registration ----------
function openManage() {
  openModal(`
    <p class="eyebrow">Manage Registration</p>
    <h2>Find your registration</h2>
    <p class="lead">Enter the confirmation ID you got when you registered, and the same email.</p>
    <form id="manage-form" novalidate>
      <div class="form-grid">
        ${field({ name: 'ref', label: 'Confirmation ID', placeholder: 'CC-1A2B3C4D', attrs: 'autocomplete="off" autocapitalize="characters" autofocus' })}
        ${field({ name: 'email', label: 'Email Address', type: 'email', placeholder: 'student@university.edu', attrs: 'autocomplete="email"' })}
      </div>
      <button class="btn btn-dark btn-block" type="submit">Find registration</button>
    </form>
    <div id="manage-result"></div>`, (body) => {
    const form = body.querySelector('#manage-form');
    const out = body.querySelector('#manage-result');
    bindForm(form, {
      rules: { ref: rules.ref('CC'), email: rules.email },
      submit: (data) => { out.innerHTML = ''; return post('/api/registrations/lookup', data); },
      onSuccess: (r, f, data) => {
        const e = r.event;
        out.innerHTML = `
          <div class="result-card">
            <span class="badge badge-ok">${icon('i-check')}Confirmed</span>
            <h3>${esc(e.title)}</h3>
            <dl class="detail-list" style="margin:4px 0">
              <dt>${icon('i-calendar')} When</dt><dd>${fmtDay(e.starts_on)} · ${fmtTime(e.start_time)}</dd>
              <dt>${icon('i-pin')} Venue</dt><dd>${esc(e.venue)}</dd>
              <dt>${icon('i-users')} Name</dt><dd>${esc(r.name)} · ${esc(r.reg_no)}</dd>
            </dl>
            <div class="btn-row" id="manage-actions">
              <button class="btn btn-sm btn-outline" type="button" data-ics>${icon('i-calendar')} Add to calendar</button>
              <button class="btn btn-sm btn-outline" type="button" data-cancel style="color:var(--error)">Cancel registration</button>
            </div>
          </div>`;
        out.querySelector('[data-ics]').addEventListener('click', () => downloadIcs(e));
        out.querySelector('[data-cancel]').addEventListener('click', () => {
          const actions = out.querySelector('#manage-actions');
          actions.innerHTML = `<span style="font-size:14px">Cancel your seat for ${esc(e.title)}?</span>
            <button class="btn btn-sm btn-dark" type="button" data-yes>Yes, cancel it</button>
            <button class="btn btn-sm btn-outline" type="button" data-no>Keep it</button>`;
          actions.querySelector('[data-no]').addEventListener('click', () => form.requestSubmit());
          actions.querySelector('[data-yes]').addEventListener('click', async (ev) => {
            ev.target.disabled = true;
            const res = await post('/api/registrations/cancel', data).catch(() => null);
            if (res?.ok) {
              out.innerHTML = `<div class="form-msg">Your registration ${esc(data.ref.toUpperCase())} for ${esc(e.title)} has been cancelled.</div>`;
              toast('Registration cancelled');
              loadStats(); loadEvents();
            } else { ev.target.disabled = false; toast(res?.body?.error || 'Could not cancel. Try again.', 'err'); }
          });
        });
      },
    });
  });
}
$('#manage-open').addEventListener('click', openManage);

// ---------- FAQ ----------
$('#faq-list').innerHTML = FAQS.map(([q, a], i) => `
  <details${i === 0 ? ' open' : ''}><summary>${esc(q)} ${icon('i-chevron')}</summary><p>${a}</p></details>`).join('');
$('#faq-list').addEventListener('click', (e) => { if (e.target.closest('[data-open-manage]')) { e.preventDefault(); openManage(); } });

// ---------- Contact ----------
const contact = $('#contact-form');
contact.innerHTML = `
  <h3>Send a message</h3>
  <p>We read every message. For problems that need fixing, the Help Desk is faster.</p>
  <div class="form-grid">
    ${field({ name: 'name', label: 'Full Name', placeholder: 'Your name', attrs: 'autocomplete="name"' })}
    ${field({ name: 'email', label: 'Email Address', type: 'email', placeholder: 'student@university.edu', attrs: 'autocomplete="email"' })}
    ${field({ name: 'topic', label: 'Topic', options: ['General', 'Services', 'Events', 'Technical'], placeholder: 'Choose a topic', full: true })}
    ${field({ name: 'body', label: 'Message', rows: 5, placeholder: 'How can we help?', full: true, attrs: 'maxlength="1000"' })}
  </div>
  <button class="btn btn-dark btn-block" type="submit">Send message ${icon('i-arrow')}</button>`;
bindForm(contact, {
  rules: { name: rules.name, email: rules.email, topic: rules.required('Please choose a topic.'), body: rules.length(10, 1000, 'Your message') },
  submit: (data) => post('/api/messages', data),
  onSuccess: (b, form, data) => { CC.showMsg(form, `Thanks, ${data.name.split(' ')[0]}! Your message has been sent. We’ll reply to ${data.email}.`); form.reset(); },
});

// ---------- Deep links (#svc-…, #evt-…) ----------
function handleHash() {
  const h = decodeURIComponent(location.hash.slice(1));
  if (h.startsWith('svc-')) openService(h.slice(4));
  else if (h.startsWith('evt-') && EVENTS.length) { document.getElementById(h)?.scrollIntoView({ block: 'center' }); openEvent(h.slice(4)); }
  else if (h === 'manage') openManage();
}
window.addEventListener('hashchange', handleHash);

// ---------- Active nav on scroll (home only) ----------
const navMap = { home: 'home', services: 'services', events: 'events' };
const spy = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (!en.isIntersecting) return;
    const id = navMap[en.target.id];
    $$('#main-nav a').forEach((a) => { const on = a.dataset.nav === id; a.classList.toggle('active', on); on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'); });
  });
}, { rootMargin: '-45% 0px -50% 0px' });
['home', 'services', 'events'].forEach((id) => spy.observe(document.getElementById(id)));

// ---------- Boot ----------
reveal();
loadEvents();
loadStats();
loadNotices();
if (location.hash.startsWith('#svc-') || location.hash === '#manage') handleHash();
