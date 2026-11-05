const { $, $$, esc, icon, fmtTime } = CC;

// Weekly hours: index 0 = Sunday. null = closed; ['00:00','24:00'] = 24 hours.
const H = (sun, weekday, sat = weekday) => [sun, weekday, weekday, weekday, weekday, weekday, sat];
const PLACES = [
  { id: 'main-gate', name: 'Main Gate', x: 350, y: 486, w: 100, h: 40, desc: 'Visitor entry, security post and the shuttle stop.', hours: H(['00:00', '24:00'], ['00:00', '24:00']) },
  { id: 'admin', name: 'Admin Block', x: 320, y: 396, w: 160, h: 56, desc: 'Admissions, accounts, exam cell and the registrar’s office.', hours: H(null, ['09:00', '17:00'], null) },
  { id: 'library', name: 'Central Library', x: 90, y: 236, w: 170, h: 84, desc: 'Reading halls, group study rooms, e-journals and printing.', hours: H(['10:00', '18:00'], ['08:00', '22:00']) },
  { id: 'central-lawn', name: 'Central Lawn', lawn: true, cx: 400, cy: 278, rx: 108, ry: 66, desc: 'Open green space and the venue for fests like Cultural Connect Fest.', hours: H(['06:00', '22:00'], ['06:00', '22:00']) },
  { id: 'auditorium', name: 'Main Auditorium', x: 540, y: 236, w: 170, h: 84, desc: '900-seat hall for summits, convocations and performances.', hours: H(null, ['09:00', '21:00']) },
  { id: 'block-a', name: 'Block A', x: 90, y: 110, w: 130, h: 70, desc: 'Lecture halls for first-year and science courses.', hours: H(null, ['08:00', '18:00'], ['08:00', '13:00']) },
  { id: 'block-b', name: 'Block B', x: 250, y: 52, w: 130, h: 70, desc: 'Department offices, seminar halls and faculty rooms.', hours: H(null, ['08:00', '18:00'], ['08:00', '13:00']) },
  { id: 'block-c', name: 'Block C · Innovation Lab', x: 410, y: 52, w: 170, h: 70, desc: 'Computer labs, the maker space and the IT help desk.', hours: H(null, ['08:00', '21:00'], ['09:00', '17:00']) },
  { id: 'student-centre', name: 'Student Centre', x: 600, y: 110, w: 130, h: 70, desc: 'Student services, counselling, club rooms and the gaming lounge.', hours: H(['10:00', '18:00'], ['09:00', '20:00']) },
  { id: 'canteen', name: 'Canteen', x: 560, y: 396, w: 130, h: 56, desc: 'Meals, snacks and the late-night tea counter.', hours: H(['08:00', '22:00'], ['07:30', '22:00']) },
  { id: 'hostels', name: 'Hostels H1–H6', x: 24, y: 396, w: 190, h: 80, desc: 'Residence halls, warden office and the central mess.', hours: H(['00:00', '24:00'], ['00:00', '24:00']) },
  { id: 'medical', name: 'Medical Centre', x: 236, y: 486, w: 100, h: 40, desc: 'First aid, a doctor on call and an ambulance, 24 hours.', hours: H(['00:00', '24:00'], ['00:00', '24:00']) },
  { id: 'sports', name: 'Sports Complex', x: 600, y: 470, w: 176, h: 70, desc: 'Track, courts, gym and swimming pool.', hours: H(['06:00', '20:00'], ['06:00', '21:00']) },
];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const toMin = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const label = (s) => (s === '24:00' ? 'midnight' : fmtTime(s));
const fmtRange = (r) => !r ? 'Closed' : r[0] === '00:00' && r[1] === '24:00' ? 'Open 24 hours' : `${label(r[0])} – ${label(r[1])}`;

function status(p, now = new Date()) {
  const day = now.getDay(), mins = now.getHours() * 60 + now.getMinutes();
  const r = p.hours[day];
  if (r && r[0] === '00:00' && r[1] === '24:00') return { open: true, text: 'Open 24 hours' };
  if (r && mins >= toMin(r[0]) && mins < toMin(r[1])) return { open: true, text: `Open · closes ${label(r[1])}` };
  if (r && mins < toMin(r[0])) return { open: false, text: `Closed · opens ${label(r[0])}` };
  for (let i = 1; i <= 7; i++) {
    const d = (day + i) % 7, next = p.hours[d];
    if (next) return { open: false, text: `Closed · opens ${i === 1 ? 'tomorrow' : DAYS[d]} ${label(next[0])}` };
  }
  return { open: false, text: 'Closed' };
}
const badge = (p) => { const s = status(p); return `<span class="badge ${s.open ? 'badge-ok' : 'badge-err'}">${esc(s.text)}</span>`; };

// ---------- Map ----------
function drawMap() {
  const svg = $('#campus-map');
  const parts = [
    '<rect class="ground" x="0" y="0" width="800" height="560" rx="14"/>',
    '<path class="path" d="M400 520 V352 M400 210 V130 M130 210 H700 M130 352 H700 M155 180 V352 M640 180 V352 M315 122 V210 M495 122 V210 M120 352 V396 M625 352 V396 M690 352 V470 M286 352 V486"/>',
  ];
  for (const p of PLACES) {
    if (p.lawn) {
      parts.push(`<g class="bld" data-place="${p.id}" tabindex="0" role="button" aria-label="${esc(p.name)}">
        <ellipse class="lawn" cx="${p.cx}" cy="${p.cy}" rx="${p.rx}" ry="${p.ry}"/>
        <text x="${p.cx}" y="${p.cy + 4}" text-anchor="middle" class="lawn-label" style="fill:var(--ok)">${esc(p.name)}</text></g>`);
      continue;
    }
    const lines = p.name.split(' · ');
    parts.push(`<g class="bld" data-place="${p.id}" tabindex="0" role="button" aria-label="${esc(p.name)}">
      <rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="10"/>
      ${lines.map((l, i) => `<text x="${p.x + p.w / 2}" y="${p.y + p.h / 2 + 4 + (i - (lines.length - 1) / 2) * 14}" text-anchor="middle">${esc(l)}</text>`).join('')}</g>`);
  }
  svg.innerHTML = parts.join('');
  svg.addEventListener('click', (e) => { const g = e.target.closest('[data-place]'); if (g) select(g.dataset.place, true); });
  svg.addEventListener('keydown', (e) => {
    const g = e.target.closest('[data-place]');
    if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); select(g.dataset.place, true); }
  });
}

function select(id, updateHash) {
  const p = PLACES.find((x) => x.id === id) || PLACES.find((x) => x.id === 'library');
  $$('#campus-map .bld').forEach((g) => g.classList.toggle('active', g.dataset.place === p.id));
  const today = new Date().getDay();
  $('#place-panel').innerHTML = `
    <p class="eyebrow">Selected place</p>
    <h3>${esc(p.name)}</h3>
    <p class="muted" style="font-size:14px;margin:8px 0 12px">${esc(p.desc)}</p>
    ${badge(p)}
    <p style="font-size:13.5px;margin:12px 0 0"><b>Today:</b> ${fmtRange(p.hours[today])}</p>
    <div class="place-list" role="list">${PLACES.map((x) => `
      <button type="button" role="listitem" data-pick="${x.id}" class="${x.id === p.id ? 'active' : ''}"><span>${esc(x.name)}</span><span class="${status(x).open ? '' : 'muted'}" style="font-size:12px">${status(x).open ? 'Open' : 'Closed'}</span></button>`).join('')}
    </div>`;
  if (updateHash) history.replaceState(null, '', '#' + p.id);
}
$('#place-panel').addEventListener('click', (e) => { const b = e.target.closest('[data-pick]'); if (b) { select(b.dataset.pick, true); $(`#campus-map [data-place="${b.dataset.pick}"]`)?.focus({ preventScroll: true }); } });

// ---------- Hours table ----------
function drawHours() {
  const today = new Date().getDay();
  const rows = PLACES.filter((p) => !['main-gate', 'block-a', 'block-b'].includes(p.id));
  $('#hours-table').innerHTML = `
    <thead><tr><th>Place</th><th>Now</th><th>Today</th><th>Mon–Fri</th><th>Sat</th><th>Sun</th></tr></thead>
    <tbody>${rows.map((p) => `
      <tr><td><button class="link-btn" type="button" data-pick="${p.id}" style="text-decoration:none">${esc(p.name)}</button></td><td>${badge(p)}</td>
      <td>${fmtRange(p.hours[today])}</td><td>${fmtRange(p.hours[1])}</td><td>${fmtRange(p.hours[6])}</td><td>${fmtRange(p.hours[0])}</td></tr>`).join('')}
    </tbody>`;
  $('#now-label').textContent = 'Updated ' + new Date().toLocaleString(undefined, { weekday: 'long', hour: 'numeric', minute: '2-digit' });
}
$('#hours-table').addEventListener('click', (e) => {
  const b = e.target.closest('[data-pick]');
  if (b) { select(b.dataset.pick, true); $('#campus-map').scrollIntoView({ behavior: 'smooth', block: 'center' }); }
});

drawMap();
drawHours();
select(location.hash.slice(1) || 'library', false);
window.addEventListener('hashchange', () => select(location.hash.slice(1), false));
setInterval(() => { drawHours(); select(location.hash.slice(1) || 'library', false); }, 60_000);
