const { $, esc, icon, api, post, openModal, field, bindForm, rules, chips, reveal, toast } = CC;

let CLUBS = [];
let filter = '', query = '';
const KEY = 'cc-club-requests';
const requested = new Set((() => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } })());
const remember = (id) => { requested.add(id); try { localStorage.setItem(KEY, JSON.stringify([...requested])); } catch { /* ignore */ } };

function render() {
  const grid = $('#club-grid');
  const q = query.toLowerCase();
  const list = CLUBS.filter((c) => (!filter || c.category === filter) && (!q || (c.name + ' ' + c.description + ' ' + c.category).toLowerCase().includes(q)));
  grid.innerHTML = list.length ? list.map((c) => `
    <article class="card reveal" id="club-${esc(c.id)}">
      <span class="badge">${esc(c.category)}</span>
      <h3>${esc(c.name)}</h3>
      <p>${esc(c.description)}</p>
      <div class="meta"><span>${icon('i-clock')}${esc(c.meets)}</span><span>${icon('i-users')}${c.members} members</span></div>
      <div class="card-foot">
        ${requested.has(c.id)
          ? `<span class="badge badge-ok">${icon('i-check')}Request sent</span>`
          : `<button class="btn btn-dark btn-sm" type="button" data-join="${esc(c.id)}">Request to join</button>`}
      </div>
    </article>`).join('')
    : `<div class="empty-state"><strong>No clubs match</strong>Try another category or search term.</div>`;
  reveal(grid);
}

function openJoin(id) {
  const c = CLUBS.find((x) => x.id === id);
  if (!c) return;
  openModal(`
    <p class="eyebrow">${esc(c.category)} club</p>
    <h2>Join ${esc(c.name)}</h2>
    <p class="lead">${esc(c.description)} Meets ${esc(c.meets)}.</p>
    <form id="join-form" novalidate>
      <div class="form-grid">
        ${field({ name: 'name', label: 'Full Name', placeholder: 'Your name', attrs: 'autocomplete="name" autofocus' })}
        ${field({ name: 'reg', label: 'Registration Number', placeholder: 'e.g. 22BCS1045', attrs: 'autocomplete="off"' })}
        ${field({ name: 'email', label: 'Email Address', type: 'email', placeholder: 'student@university.edu', full: true, attrs: 'autocomplete="email"' })}
        ${field({ name: 'note', label: 'Why do you want to join?', rows: 3, optional: true, full: true, placeholder: 'Skills, interests, anything the coordinators should know', attrs: 'maxlength="300"' })}
      </div>
      <button class="btn btn-dark btn-block" type="submit">Send join request ${icon('i-arrow')}</button>
    </form>`, (body) => {
    bindForm(body.querySelector('#join-form'), {
      rules: { name: rules.name, reg: rules.reg, email: rules.email, note: (v) => v.length > 300 ? 'Keep it under 300 characters.' : '' },
      submit: (data) => post(`/api/clubs/${encodeURIComponent(c.id)}/join`, data),
      onSuccess: (r, form, data) => {
        remember(c.id);
        form.innerHTML = `<div class="form-msg">Request sent! The ${esc(c.name)} coordinators will email ${esc(data.email)} after reviewing it.</div>
          <div class="btn-row" style="margin-top:14px"><button class="btn btn-outline btn-sm" type="button" data-close>Done</button></div>`;
        toast(`Join request sent to ${c.name}`);
        render();
      },
    });
  });
}

$('#club-grid').addEventListener('click', (e) => { const b = e.target.closest('[data-join]'); if (b) openJoin(b.dataset.join); });
$('#club-search').addEventListener('input', (e) => { query = e.target.value.trim(); render(); });

(async function init() {
  $('#club-grid').innerHTML = '<div class="skeleton"></div>'.repeat(6);
  const r = await api('/api/clubs').catch(() => null);
  if (!r?.ok) { $('#club-grid').innerHTML = '<div class="empty-state"><strong>Clubs could not be loaded</strong>Refresh the page to try again.</div>'; return; }
  CLUBS = r.body;
  const cats = [...new Set(CLUBS.map((c) => c.category))];
  chips($('#club-filters'), [['', 'All'], ...cats.map((c) => [c, c])], (v) => { filter = v; render(); });
  render();
  const target = location.hash && document.getElementById(location.hash.slice(1));
  if (target) target.scrollIntoView({ block: 'center' });
})();
