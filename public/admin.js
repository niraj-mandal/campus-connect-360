// Organizer dashboard: one tab per service. Every call sends the organizer key.
const { $, $$, esc, icon, toast, openModal, closeModal, field, bindForm, rules, fmtDay, fmtTime, fmtWhen, setError } = CC;
const KEY_STORE = 'cc-admin-key';

let key = null;
try { key = sessionStorage.getItem(KEY_STORE); } catch { /* ignore */ }
let current = 'registrations';
let counts = {};

const TABS = [
  ['registrations', 'Registrations', 'registrations'],
  ['events', 'Events', null],
  ['notices', 'Notices', null],
  ['clubs', 'Club requests', 'requests'],
  ['lost', 'Lost & Found', 'lost'],
  ['tickets', 'Help Desk', 'tickets'],
  ['messages', 'Messages', 'messages'],
];

async function call(path, options = {}) {
  const res = await fetch(path, { ...options, headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', ...(options.headers || {}) } });
  if (res.status === 401) { signOut('That key was not accepted.'); throw new Error('unauthorized'); }
  if (res.status === 503) { const b = await res.json().catch(() => ({})); signOut(b.error || 'Organizer access is not set up.'); throw new Error('unavailable'); }
  const body = res.status === 204 ? {} : await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body, res };
}
const send = (path, method, data) => call(path, { method, body: data ? JSON.stringify(data) : undefined });

function showKeyView(msg = '') {
  $('#data-view').hidden = true;
  $('#sign-out').hidden = true;
  $('#key-view').hidden = false;
  $('#key-error').textContent = msg;
  $('#key-input').focus();
}
function signOut(msg) {
  key = null;
  try { sessionStorage.removeItem(KEY_STORE); } catch { /* ignore */ }
  showKeyView(msg);
}

function renderTabs() {
  $('#tabs').innerHTML = TABS.map(([id, label, countKey]) => {
    const n = countKey ? counts[countKey] : null;
    const hot = n && countKey !== 'registrations';
    return `<button class="tab" role="tab" id="tab-${id}" data-tab="${id}" aria-selected="${id === current}" aria-controls="panel">${label}${n != null ? ` <span class="count${hot ? ' hot' : ''}">${n}</span>` : ''}</button>`;
  }).join('');
}

async function loadOverview() {
  const r = await call('/api/admin/overview');
  counts = r.body.counts || {};
  $('#storage-note').innerHTML = r.body.temporary
    ? '<div class="storage-warn">Storage is temporary on this server. Data can disappear. Set DATABASE_URL to a Postgres database to keep it.</div>' : '';
  renderTabs();
}

async function show(tab) {
  current = tab;
  try { sessionStorage.setItem('cc-admin-tab', tab); } catch { /* ignore */ }
  renderTabs();
  $('#panel').setAttribute('aria-labelledby', 'tab-' + tab);
  $('#panel').innerHTML = '<div class="skeleton" style="min-height:240px"></div>';
  try {
    await PANELS[tab]($('#panel'));
    $('#updated').textContent = 'Updated ' + new Date().toLocaleTimeString();
  } catch (err) {
    if (!['unauthorized', 'unavailable'].includes(err.message)) $('#panel').innerHTML = '<div class="empty">Could not load this section. Try Refresh.</div>';
  }
}

async function refresh() {
  await loadOverview();
  await show(current);
}

const table = (head, rows, empty) => `<div class="table-wrap"><table class="data"><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
  <tbody>${rows.length ? rows.join('') : `<tr><td colspan="${head.length}" class="empty">${empty}</td></tr>`}</tbody></table></div>`;

async function act(promise, okMsg) {
  try {
    const r = await promise;
    if (r.ok) { if (okMsg) toast(okMsg); await refresh(); return true; }
    toast(r.body.error || 'That did not work.', 'err');
  } catch (err) { if (!['unauthorized', 'unavailable'].includes(err.message)) toast('Could not reach the server.', 'err'); }
  return false;
}

// ---------- Panels ----------
const PANELS = {
  async registrations(el) {
    const evs = (await call('/api/admin/events')).body;
    const filter = el.dataset.filter || '';
    const rows = (await call('/api/admin/registrations' + (filter ? '?event=' + encodeURIComponent(filter) : ''))).body;
    el.innerHTML = `
      <div class="panel-tools">
        <div class="summary">${evs.map((e) => `<span class="pill">${esc(e.title)}: <b>${e.registered}</b> / ${e.capacity}</span>`).join('')}</div>
        <div class="btn-row">
          <div class="select-wrap"><select id="reg-filter" aria-label="Filter by event"><option value="">All events</option>${evs.map((e) => `<option value="${esc(e.id)}"${e.id === filter ? ' selected' : ''}>${esc(e.title)}</option>`).join('')}</select>${icon('i-chevron')}</div>
          <button class="btn btn-sm btn-dark" id="export">Export CSV</button>
        </div>
      </div>
      ${table(['Confirmation', 'Name', 'Reg. No.', 'Email', 'Event', 'Registered', ''], rows.map((r) => `
        <tr><td class="mono">${esc(r.ref)}</td><td>${esc(r.name)}</td><td class="mono">${esc(r.reg_no)}</td><td>${esc(r.email)}</td>
        <td>${esc(r.event_title)}</td><td class="nowrap">${fmtWhen(r.created_at)}</td>
        <td><button class="act danger" data-del-reg="${r.id}" data-name="${esc(r.name)}">Remove</button></td></tr>`), `No registrations${filter ? ' for this event' : ''} yet.`)}`;
    $('#reg-filter', el).addEventListener('change', (e) => { el.dataset.filter = e.target.value; show('registrations'); });
    $('#export', el).addEventListener('click', async () => {
      const r = await call('/api/admin/registrations.csv' + (filter ? '?event=' + encodeURIComponent(filter) : ''));
      if (!r.ok) return toast('Export failed.', 'err');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(await r.res.blob());
      a.download = `registrations${filter ? '-' + filter : ''}.csv`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-del-reg]');
      if (b && confirm(`Remove ${b.dataset.name}'s registration? This cannot be undone.`)) act(send('/api/admin/registrations/' + b.dataset.delReg, 'DELETE'), 'Registration removed');
    });
  },

  async events(el) {
    const evs = (await call('/api/admin/events')).body;
    const today = new Date().toISOString().slice(0, 10);
    el.innerHTML = `
      <details class="form-card add-card"><summary>${icon('i-plus')} Add an event</summary>
        <form id="ev-form" novalidate>
          <div class="form-grid">
            ${field({ name: 'title', label: 'Title', full: true, attrs: 'maxlength="80"' })}
            ${field({ name: 'description', label: 'Short description', rows: 2, full: true, attrs: 'maxlength="200"' })}
            ${field({ name: 'starts_on', label: 'Date', type: 'date', attrs: `min="${today}"` })}
            ${field({ name: 'start_time', label: 'Start time', type: 'time', value: '10:00' })}
            ${field({ name: 'venue', label: 'Venue', attrs: 'maxlength="80"' })}
            ${field({ name: 'capacity', label: 'Seats', type: 'number', value: '200', attrs: 'min="1" max="10000"' })}
            ${field({ name: 'image', label: 'Photo link', type: 'url', optional: true, full: true, placeholder: 'https://…', hint: 'Shown in the home page hero slideshow. Use a wide photo of the event or venue.' })}
          </div>
          <button class="btn btn-dark btn-sm" type="submit">Create event</button>
        </form>
      </details>
      ${table(['Event', 'Date', 'Time', 'Venue', 'Seats', ''], evs.map((e) => `
        <tr><td><b>${esc(e.title)}</b>${e.starts_on < today ? ' <span class="badge">Past</span>' : ''}<br><span class="muted">${esc(e.description)}</span></td>
        <td class="nowrap">${fmtDay(e.starts_on)}</td><td class="nowrap">${fmtTime(e.start_time)}</td><td>${esc(e.venue)}</td>
        <td class="nowrap">${e.registered} / ${e.capacity}</td>
        <td><button class="act danger" data-del-ev="${esc(e.id)}" data-title="${esc(e.title)}" data-n="${e.registered}">Delete</button></td></tr>`), 'No events yet.')}`;
    bindForm($('#ev-form', el), {
      rules: {
        title: rules.length(3, 80, 'Title'), description: rules.length(10, 200, 'Description'), starts_on: rules.required('Pick a date.'),
        start_time: rules.required('Pick a time.'), venue: rules.length(2, 80, 'Venue'),
        capacity: (v) => /^\d+$/.test(v) && +v >= 1 && +v <= 10000 ? '' : 'Seats must be 1–10000.',
        image: (v) => !v || /^https:\/\/\S+$/.test(v) ? '' : 'Use an https:// link.',
      },
      submit: (data) => send('/api/admin/events', 'POST', { ...data, capacity: Number(data.capacity) }),
      onSuccess: (ev) => { toast(`“${ev.title}” is live on the home page`); refresh(); },
    });
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-del-ev]');
      if (!b) return;
      const n = Number(b.dataset.n);
      if (confirm(`Delete “${b.dataset.title}”?${n ? ` Its ${n} registration${n > 1 ? 's' : ''} will be deleted too.` : ''} This cannot be undone.`)) act(send('/api/admin/events/' + b.dataset.delEv, 'DELETE'), 'Event deleted');
    });
  },

  async notices(el) {
    const list = (await (await fetch('/api/notices')).json());
    el.innerHTML = `
      <details class="form-card add-card" open><summary>${icon('i-plus')} Post a notice</summary>
        <form id="nt-form" novalidate>
          <div class="form-grid">
            ${field({ name: 'title', label: 'Title', attrs: 'maxlength="100"' })}
            ${field({ name: 'category', label: 'Category', options: ['Exams', 'Deadlines', 'Holidays', 'Library', 'General'], placeholder: 'Choose a category' })}
            ${field({ name: 'body', label: 'Notice', rows: 3, full: true, attrs: 'maxlength="1000"' })}
          </div>
          <div class="btn-row"><label class="check"><input type="checkbox" name="pinned" value="1"> Pin to the top</label><button class="btn btn-dark btn-sm" type="submit">Publish notice</button></div>
        </form>
      </details>
      ${table(['Notice', 'Category', 'Posted', ''], list.map((n) => `
        <tr><td class="wrap"><b>${esc(n.title)}</b>${n.pinned ? ` <span class="badge badge-info">${icon('i-star')}Pinned</span>` : ''}<br><span class="muted">${esc(n.body)}</span></td>
        <td>${esc(n.category)}</td><td class="nowrap">${fmtWhen(n.created_at)}</td>
        <td><div class="row-actions"><button class="act" data-pin="${n.id}" data-to="${n.pinned ? 0 : 1}">${n.pinned ? 'Unpin' : 'Pin'}</button><button class="act danger" data-del-nt="${n.id}">Delete</button></div></td></tr>`), 'No notices yet.')}`;
    bindForm($('#nt-form', el), {
      rules: { title: rules.length(5, 100, 'Title'), category: rules.required('Choose a category.'), body: rules.length(10, 1000, 'Notice text') },
      submit: (data) => send('/api/admin/notices', 'POST', { ...data, pinned: !!data.pinned }),
      onSuccess: () => { toast('Notice published'); refresh(); },
    });
    el.addEventListener('click', (e) => {
      const p = e.target.closest('[data-pin]');
      if (p) act(send('/api/admin/notices/' + p.dataset.pin, 'PATCH', { pinned: p.dataset.to === '1' }), p.dataset.to === '1' ? 'Pinned' : 'Unpinned');
      const d = e.target.closest('[data-del-nt]');
      if (d && confirm('Delete this notice?')) act(send('/api/admin/notices/' + d.dataset.delNt, 'DELETE'), 'Notice deleted');
    });
  },

  async clubs(el) {
    const rows = (await call('/api/admin/club-requests')).body;
    const st = { pending: 'badge-warn', approved: 'badge-ok', declined: 'badge-err' };
    el.innerHTML = table(['Club', 'Student', 'Email', 'Note', 'Status', 'Sent', ''], rows.map((r) => `
      <tr><td><b>${esc(r.club_name)}</b></td><td>${esc(r.name)}<br><span class="muted mono">${esc(r.reg_no)}</span></td>
      <td><a href="mailto:${esc(r.email)}">${esc(r.email)}</a></td><td class="wrap">${esc(r.note) || '<span class="muted">—</span>'}</td>
      <td><span class="badge ${st[r.status]}">${esc(r.status)}</span></td><td class="nowrap">${fmtWhen(r.created_at)}</td>
      <td><div class="row-actions">
        ${r.status !== 'approved' ? `<button class="act" data-req="${r.id}" data-status="approved">Approve</button>` : ''}
        ${r.status !== 'declined' ? `<button class="act" data-req="${r.id}" data-status="declined">Decline</button>` : ''}
        <button class="act danger" data-del-req="${r.id}">Delete</button></div></td></tr>`), 'No join requests yet.');
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-req]');
      if (b) act(send('/api/admin/club-requests/' + b.dataset.req, 'PATCH', { status: b.dataset.status }), `Request ${b.dataset.status}`);
      const d = e.target.closest('[data-del-req]');
      if (d && confirm('Delete this join request?')) act(send('/api/admin/club-requests/' + d.dataset.delReq, 'DELETE'), 'Request deleted');
    });
  },

  async lost(el) {
    const rows = (await call('/api/admin/lost-found')).body;
    el.innerHTML = table(['Post', 'Item', 'Where / when', 'Posted by', 'Replies', 'Status', ''], rows.map((r) => `
      <tr><td class="mono">${esc(r.ref)}</td><td class="wrap"><span class="badge ${r.kind === 'lost' ? 'badge-err' : 'badge-ok'}">${esc(r.kind)}</span> <b>${esc(r.title)}</b><br><span class="muted">${esc(r.description)}</span></td>
      <td>${esc(r.location)}<br><span class="muted">${fmtDay(r.happened_on)}</span></td>
      <td>${esc(r.name)}<br><a href="mailto:${esc(r.email)}">${esc(r.email)}</a></td><td>${r.replies}</td>
      <td><span class="badge ${r.status === 'open' ? 'badge-info' : ''}">${esc(r.status)}</span></td>
      <td><div class="row-actions"><button class="act" data-lf="${r.id}" data-status="${r.status === 'open' ? 'resolved' : 'open'}">${r.status === 'open' ? 'Resolve' : 'Reopen'}</button>
      <button class="act danger" data-del-lf="${r.id}">Delete</button></div></td></tr>`), 'No lost & found posts yet.');
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-lf]');
      if (b) act(send('/api/admin/lost-found/' + b.dataset.lf, 'PATCH', { status: b.dataset.status }), b.dataset.status === 'resolved' ? 'Marked as resolved' : 'Reopened');
      const d = e.target.closest('[data-del-lf]');
      if (d && confirm('Delete this post and its replies?')) act(send('/api/admin/lost-found/' + d.dataset.delLf, 'DELETE'), 'Post deleted');
    });
  },

  async tickets(el) {
    const rows = (await call('/api/admin/tickets')).body;
    const st = { open: ['badge-info', 'Open'], in_progress: ['badge-warn', 'In progress'], resolved: ['badge-ok', 'Resolved'] };
    el.innerHTML = table(['Ticket', 'Subject', 'Student', 'Category', 'Status', 'Updated', ''], rows.map((t) => `
      <tr><td class="mono">${esc(t.ref)}</td><td class="wrap"><b>${esc(t.subject)}</b><br><span class="muted">${esc(t.description.slice(0, 140))}${t.description.length > 140 ? '…' : ''}</span></td>
      <td>${esc(t.name)}<br><a href="mailto:${esc(t.email)}">${esc(t.email)}</a></td><td>${esc(t.category)}</td>
      <td><span class="badge ${st[t.status][0]}">${st[t.status][1]}</span></td><td class="nowrap">${fmtWhen(t.updated_at)}</td>
      <td><button class="act" data-ticket="${t.id}">Update</button></td></tr>`), 'No tickets yet.');
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-ticket]');
      if (!b) return;
      const t = rows.find((x) => String(x.id) === b.dataset.ticket);
      openModal(`
        <p class="eyebrow">${esc(t.ref)} · ${esc(t.category)}</p>
        <h2>${esc(t.subject)}</h2>
        <p class="lead" style="white-space:pre-line">${esc(t.description)}</p>
        <p class="muted" style="font-size:13px">From ${esc(t.name)} (${esc(t.reg_no)}) · <a href="mailto:${esc(t.email)}">${esc(t.email)}</a> · opened ${fmtWhen(t.created_at)}</p>
        <form id="tk-form" novalidate>
          <div class="form-grid">
            ${field({ name: 'status', label: 'Status', options: [['open', 'Open'], ['in_progress', 'In progress'], ['resolved', 'Resolved']], value: t.status, full: true })}
            ${field({ name: 'note', label: 'Reply to the student', rows: 4, full: true, optional: true, value: t.note, hint: 'The student sees this when they track the ticket.', attrs: 'maxlength="600"' })}
          </div>
          <button class="btn btn-dark btn-block" type="submit">Save update</button>
        </form>`, (body) => {
        bindForm(body.querySelector('#tk-form'), {
          rules: { status: rules.required('Choose a status.') },
          submit: (data) => send('/api/admin/tickets/' + t.id, 'PATCH', data),
          onSuccess: () => { closeModal(); toast('Ticket updated'); refresh(); },
        });
      });
    });
  },

  async messages(el) {
    const rows = (await call('/api/admin/messages')).body;
    el.innerHTML = table(['From', 'Topic', 'Message', 'Received', ''], rows.map((m) => `
      <tr style="${m.handled ? 'opacity:.6' : ''}"><td>${esc(m.name)}<br><a href="mailto:${esc(m.email)}?subject=${encodeURIComponent('Re: your message to Campus Connect 360')}">${esc(m.email)}</a></td>
      <td>${esc(m.topic)}</td><td class="wrap">${esc(m.body)}</td><td class="nowrap">${fmtWhen(m.created_at)}</td>
      <td><div class="row-actions"><button class="act" data-msg="${m.id}" data-to="${m.handled ? 0 : 1}">${m.handled ? 'Mark unread' : 'Mark done'}</button>
      <button class="act danger" data-del-msg="${m.id}">Delete</button></div></td></tr>`), 'No messages yet.');
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-msg]');
      if (b) act(send('/api/admin/messages/' + b.dataset.msg, 'PATCH', { handled: b.dataset.to === '1' }), b.dataset.to === '1' ? 'Marked as done' : 'Marked unread');
      const d = e.target.closest('[data-del-msg]');
      if (d && confirm('Delete this message?')) act(send('/api/admin/messages/' + d.dataset.delMsg, 'DELETE'), 'Message deleted');
    });
  },
};

// Panels attach click handlers to #panel; replace the node on each render so old handlers don't pile up.
const _show = show;
show = async function (tab) {
  const old = $('#panel');
  old.replaceWith(old.cloneNode(false)); // keeps attributes such as the registrations filter
  return _show(tab);
};

// ---------- Boot ----------
$('#tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) show(b.dataset.tab); });
$('#tabs').addEventListener('keydown', (e) => {
  if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
  const ids = TABS.map((t) => t[0]);
  const next = ids[(ids.indexOf(current) + (e.key === 'ArrowRight' ? 1 : ids.length - 1)) % ids.length];
  show(next).then(() => $('#tab-' + next)?.focus());
});
$('#refresh').addEventListener('click', () => refresh().catch(() => {}));
$('#sign-out').addEventListener('click', () => signOut());
$('#key-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  key = $('#key-input').value.trim();
  if (!key) return;
  try { sessionStorage.setItem(KEY_STORE, key); } catch { /* ignore */ }
  $('#key-input').value = '';
  start();
});

async function start() {
  try {
    await loadOverview();
    $('#key-view').hidden = true;
    $('#data-view').hidden = false;
    $('#sign-out').hidden = false;
    try { current = sessionStorage.getItem('cc-admin-tab') || current; } catch { /* ignore */ }
    if (!PANELS[current]) current = 'registrations';
    await show(current);
  } catch { /* signOut already showed the key view */ }
}

if (key) start(); else showKeyView();
