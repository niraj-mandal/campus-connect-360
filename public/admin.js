const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const KEY_STORE = 'cc-admin-key';

let key = null;
try { key = sessionStorage.getItem(KEY_STORE); } catch { /* ignore */ }
let events = [];

async function adminFetch(path, options = {}) {
  const res = await fetch(path, { ...options, headers: { Authorization: 'Bearer ' + key, ...(options.headers || {}) } });
  if (res.status === 401) { signOut('That key was not accepted.'); throw new Error('unauthorized'); }
  return res;
}

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

const fmtDate = (iso) => new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

async function load() {
  const filter = $('#filter').value;
  const [evRes, regRes] = await Promise.all([
    fetch('/api/events'),
    adminFetch('/api/admin/registrations' + (filter ? '?event=' + encodeURIComponent(filter) : '')),
  ]);
  events = await evRes.json();
  const rows = await regRes.json();

  $('#key-view').hidden = true;
  $('#data-view').hidden = false;
  $('#sign-out').hidden = false;

  const sel = $('#filter');
  if (sel.options.length === 1) sel.insertAdjacentHTML('beforeend', events.map((e) => `<option value="${esc(e.id)}">${esc(e.title)}</option>`).join(''));

  $('#summary').innerHTML = events.map((e) =>
    `<span class="chip">${esc(e.title)}: <b>${e.registered}</b> / ${e.capacity}</span>`).join('');

  $('#rows').innerHTML = rows.length ? rows.map((r) => `
    <tr>
      <td class="mono">${esc(r.ref)}</td>
      <td>${esc(r.name)}</td>
      <td class="mono">${esc(r.reg_no)}</td>
      <td>${esc(r.email)}</td>
      <td>${esc(r.event_title)}</td>
      <td>${esc(fmtDate(r.created_at))}</td>
      <td><button class="del" data-id="${r.id}" data-name="${esc(r.name)}">Remove</button></td>
    </tr>`).join('')
    : `<tr><td colspan="7" class="empty">No registrations${filter ? ' for this event' : ''} yet.</td></tr>`;

  $('#updated').textContent = `${rows.length} registration${rows.length === 1 ? '' : 's'} · updated ${new Date().toLocaleTimeString()}`;
}

$('#key-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  key = $('#key-input').value.trim();
  if (!key) return;
  try { sessionStorage.setItem(KEY_STORE, key); } catch { /* ignore */ }
  $('#key-input').value = '';
  load().catch(() => {});
});

$('#sign-out').addEventListener('click', () => signOut());
$('#refresh').addEventListener('click', () => load().catch(() => {}));
$('#filter').addEventListener('change', () => load().catch(() => {}));

$('#rows').addEventListener('click', async (e) => {
  const btn = e.target.closest('.del');
  if (!btn) return;
  if (!confirm(`Remove ${btn.dataset.name}'s registration? This cannot be undone.`)) return;
  const res = await adminFetch('/api/admin/registrations/' + btn.dataset.id, { method: 'DELETE' }).catch(() => null);
  if (res && (res.ok || res.status === 404)) load().catch(() => {});
});

$('#export').addEventListener('click', async () => {
  const filter = $('#filter').value;
  const res = await adminFetch('/api/admin/registrations.csv' + (filter ? '?event=' + encodeURIComponent(filter) : '')).catch(() => null);
  if (!res || !res.ok) return;
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `registrations${filter ? '-' + filter : ''}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

if (key) load().catch(() => {}); else showKeyView();
