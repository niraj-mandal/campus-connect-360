// LPU campus page: Leaflet map on OpenStreetMap tiles, Google Maps / satellite views,
// facilities, facts and travel info. Coordinates come from OpenStreetMap (checked Nov 2026).
const { $, $$, esc, icon } = CC;

const LPU = [31.25327, 75.70324]; // centre of OSM relation 21599790
const gmaps = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q + ', Lovely Professional University, Phagwara')}`;
const gdir = (lat, lon) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;

// Only places whose position is mapped on OpenStreetMap get a pin.
const PLACES = [
  { id: 'lpu', group: 'On campus', name: 'Lovely Professional University', lat: 31.25327, lon: 75.70324, desc: 'Centre of the LPU campus.' },
  { id: 'lim', group: 'On campus', name: 'Lovely Institute of Management', lat: 31.25864, lon: 75.70882, desc: 'Management institute building.' },
  { id: 'lit', group: 'On campus', name: 'Lovely Institute of Technology', lat: 31.25792, lon: 75.70694, desc: 'Engineering and technology institute building.' },
  { id: 'lip', group: 'On campus', name: 'Lovely Institute of Pharmacy', lat: 31.25758, lon: 75.70728, desc: 'Pharmacy institute building.' },
  { id: 'design', group: 'On campus', name: 'School of Design', lat: 31.25662, lon: 75.70702, desc: 'Design school building.' },
  { id: 'ground', group: 'On campus', name: 'LPU Ground', lat: 31.25578, lon: 75.71037, desc: 'Main sports ground.' },
  { id: 'law-gate', group: 'Just outside', name: 'Law Gate market', lat: 31.25241, lon: 75.69571, desc: 'Food, PGs, shops and services next to the west side of campus.' },
  { id: 'hdfc', group: 'Just outside', name: 'HDFC Bank, Law Gate', lat: 31.25418, lon: 75.69908, desc: 'Bank branch near Law Gate.' },
  { id: 'pnb', group: 'Just outside', name: 'Punjab National Bank, Law Gate', lat: 31.25446, lon: 75.69919, desc: 'Bank branch near Law Gate.' },
  { id: 'phagwara-jn', group: 'Getting here', name: 'Phagwara Junction (railway)', lat: 31.21758, lon: 75.76544, desc: 'Nearest railway station, about 9 km.' },
  { id: 'jalandhar-cantt', group: 'Getting here', name: 'Jalandhar Cantt Junction (railway)', lat: 31.30733, lon: 75.63120, desc: 'About 14 km.' },
  { id: 'jalandhar-city', group: 'Getting here', name: 'Jalandhar City Junction (railway)', lat: 31.33122, lon: 75.59072, desc: 'About 16 km.' },
  { id: 'phagwara-bus', group: 'Getting here', name: 'Phagwara Bus Stand', lat: 31.21486, lon: 75.77080, desc: 'Buses towards Jalandhar, Ludhiana and Delhi.' },
  { id: 'adampur', group: 'Getting here', name: 'Adampur Airport (Jalandhar)', lat: 31.43800, lon: 75.75854, desc: 'Closest airport; limited flights.' },
];

// Facilities widely reported for the campus. No pin: their exact spots are not on OpenStreetMap yet.
const FACILITIES = [
  { name: 'Baldev Raj Mittal UniPolis', tag: 'Auditorium', text: 'Open-air venue for convocations and big fests, reported to hold about 10,000 people.', q: 'Baldev Raj Mittal Unipolis' },
  { name: 'Shanti Devi Mittal Auditorium', tag: 'Auditorium', text: 'Large indoor auditorium, reported at about 2,000–2,500 seats.', q: 'Shanti Devi Mittal Auditorium' },
  { name: 'Baldev Raj Mittal Auditorium', tag: 'Auditorium', text: 'Smaller auditorium for seminars and talks, about 350 seats.', q: 'Baldev Raj Mittal Auditorium' },
  { name: 'Uni Hospital', tag: 'Health', text: 'On-campus hospital with round-the-clock medical help, reported as a 30-bed facility.', q: 'Uni Hospital' },
  { name: 'Hostels', tag: 'Living', text: 'Separate boys’ and girls’ hostels with laundry, common rooms, gym and canteen.', q: 'LPU hostel' },
  { name: 'Uni Mall', tag: 'Shopping & food', text: 'On-campus mall with food courts, shops and banking.', q: 'Uni Mall' },
  { name: 'Central Library', tag: 'Learning', text: 'Main library and reading halls for students.', q: 'Central Library' },
  { name: 'Sports facilities', tag: 'Sports', text: 'Grounds and courts for athletics and team sports, including the LPU Ground.', q: 'LPU sports complex', pin: 'ground' },
];

const FACTS = [
  ['Established', '2005 (LPU Act, 2005); classes from 2006'],
  ['Type', 'Private state university, UGC-recognised'],
  ['Chancellor', 'Ashok Kumar Mittal'],
  ['Location', 'Chaheru, Phagwara, Punjab'],
  ['Students', 'About 34,900 (2024)'],
  ['Accreditation', 'NAAC A++ (3.68/4, 2023)'],
  ['NIRF 2025', '49 overall · 31 among universities'],
  ['QS World 2026', '901–950 band'],
];

const REACH = [
  ['Train', 'Phagwara Junction ~9 km · Jalandhar Cantt ~14 km · Jalandhar City ~16 km', 'phagwara-jn'],
  ['Bus', 'Phagwara and Jalandhar bus stands, then a local bus, auto or taxi', 'phagwara-bus'],
  ['Air', 'Adampur (Jalandhar, limited flights) · Amritsar ~110 km · Chandigarh ~150 km', 'adampur'],
  ['Road', 'On the Jalandhar–Delhi G.T. Road (NH 44)', 'lpu'],
];

const CONTACTS = [
  ['Helpline', '<a href="tel:+911824517000">+91 1824 517000</a> · <a href="tel:+911824404404">+91 1824 404404</a>'],
  ['Email', '<a href="mailto:info@lpu.co.in">info@lpu.co.in</a>'],
  ['Admissions', '<a href="mailto:admissions@lpu.co.in">admissions@lpu.co.in</a> · WhatsApp +91 98525 69000'],
  ['Placements', '<a href="tel:+911824444500">+91 1824 444500</a> · <a href="mailto:placement@lpu.co.in">placement@lpu.co.in</a>'],
  ['Student well-being', '<a href="tel:+911824520150">+91 1824 520150</a> · <a href="mailto:dsr@lpu.co.in">dsr@lpu.co.in</a>'],
];

// ---------- Map ----------
let map = null;
const markers = {};

function initMap() {
  if (typeof L === 'undefined') {
    $('#lpu-map').innerHTML = `<div class="empty-state" style="margin:16px"><strong>The interactive map could not load</strong>Try the Google Maps view, or <a class="text-link" href="https://www.openstreetmap.org/relation/21599790" target="_blank" rel="noopener">open it on OpenStreetMap</a>.</div>`;
    return;
  }
  map = L.map('lpu-map', { scrollWheelZoom: false, zoomControl: true }).setView(LPU, 16);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);
  map.on('focus', () => map.scrollWheelZoom.enable());
  map.on('blur', () => map.scrollWheelZoom.disable());

  fetch('/data/lpu-boundary.json').then((r) => r.json()).then((geo) => {
    const layer = L.geoJSON(geo, { style: { color: '#3d5afe', weight: 2.5, fillColor: '#3d5afe', fillOpacity: 0.06, dashArray: '6 4' } }).addTo(map);
    layer.bindTooltip('LPU campus boundary', { sticky: true });
    if (!location.hash) map.fitBounds(layer.getBounds(), { padding: [16, 16] });
  }).catch(() => {});

  const colors = { 'On campus': '#111', 'Just outside': '#b26a00', 'Getting here': '#3d5afe' };
  for (const p of PLACES) {
    const m = L.circleMarker([p.lat, p.lon], { radius: p.id === 'lpu' ? 9 : 7, color: '#fff', weight: 2, fillColor: colors[p.group], fillOpacity: 1 })
      .addTo(map)
      .bindPopup(`<strong>${esc(p.name)}</strong><br><span>${esc(p.desc)}</span><br>
        <a href="${gdir(p.lat, p.lon)}" target="_blank" rel="noopener">Directions</a> · <a href="https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lon}#map=18/${p.lat}/${p.lon}" target="_blank" rel="noopener">OpenStreetMap</a>`);
    m.on('click', () => markActive(p.id));
    markers[p.id] = m;
  }
}

function focusPlace(id) {
  const p = PLACES.find((x) => x.id === id);
  if (!p) return;
  if (currentView !== 'osm') setView('osm');
  markActive(id);
  if (!map) return;
  const zoom = p.group === 'Getting here' ? 13 : 17;
  map.flyTo([p.lat, p.lon], zoom, { duration: 0.8 });
  setTimeout(() => markers[id].openPopup(), 850);
  history.replaceState(null, '', '#' + id);
}

function markActive(id) {
  $$('#place-groups button').forEach((b) => b.classList.toggle('active', b.dataset.place === id));
}

function renderPlaces(q = '') {
  const s = q.toLowerCase();
  const groups = [...new Set(PLACES.map((p) => p.group))];
  $('#place-groups').innerHTML = groups.map((g) => {
    const items = PLACES.filter((p) => p.group === g && (!s || (p.name + ' ' + p.desc).toLowerCase().includes(s)));
    if (!items.length) return '';
    return `<p class="place-group">${esc(g)}</p><div class="place-list">${items.map((p) => `
      <button type="button" data-place="${p.id}"><span>${esc(p.name)}</span></button>`).join('')}</div>`;
  }).join('') || '<p class="muted" style="font-size:13.5px;margin-top:12px">No places match.</p>';
}
$('#place-groups').addEventListener('click', (e) => { const b = e.target.closest('[data-place]'); if (b) { focusPlace(b.dataset.place); if (innerWidth < 1024) $('#lpu-map').scrollIntoView({ behavior: 'smooth', block: 'center' }); } });
$('#place-search').addEventListener('input', (e) => renderPlaces(e.target.value.trim()));

// ---------- Views ----------
let currentView = 'osm';
const GOOGLE = {
  google: 'https://www.google.com/maps?q=Lovely+Professional+University,+Phagwara&z=16&output=embed',
  satellite: 'https://www.google.com/maps?q=Lovely+Professional+University,+Phagwara&z=16&t=k&output=embed',
};
function setView(view) {
  currentView = view;
  $$('#map-views .chip-btn').forEach((b) => { const on = b.dataset.view === view; b.classList.toggle('active', on); b.setAttribute('aria-selected', on); });
  const frame = $('#google-map');
  $('#lpu-map').hidden = view !== 'osm';
  frame.hidden = view === 'osm';
  if (view !== 'osm' && frame.getAttribute('src') !== GOOGLE[view]) frame.src = GOOGLE[view];
  if (view === 'osm' && map) setTimeout(() => map.invalidateSize(), 50);
}
$('#map-views').addEventListener('click', (e) => { const b = e.target.closest('[data-view]'); if (b) setView(b.dataset.view); });

// ---------- Sections ----------
$('#facilities').innerHTML = FACILITIES.map((f) => `
  <article class="card">
    <span class="badge">${esc(f.tag)}</span>
    <h3>${esc(f.name)}</h3>
    <p>${esc(f.text)}</p>
    <div class="card-foot">
      <a class="btn btn-outline btn-sm" href="${gmaps(f.q)}" target="_blank" rel="noopener">${icon('i-pin')} Find on map</a>
      ${f.pin ? `<button class="link-btn" type="button" data-show="${f.pin}" style="font-size:13px">Show here</button>` : ''}
    </div>
  </article>`).join('');
$('#facilities').addEventListener('click', (e) => { const b = e.target.closest('[data-show]'); if (b) { focusPlace(b.dataset.show); $('#lpu-map').scrollIntoView({ behavior: 'smooth', block: 'center' }); } });

$('#facts').innerHTML = FACTS.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('');
$('#contacts').innerHTML = CONTACTS.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join('');
$('#reach').innerHTML = REACH.map(([k, v, pin]) => `
  <div class="reach-row"><strong>${esc(k)}</strong><span>${esc(v)}</span><button class="link-btn" type="button" data-show="${pin}">Map</button></div>`).join('');
$('#reach').addEventListener('click', (e) => { const b = e.target.closest('[data-show]'); if (b) { focusPlace(b.dataset.show); $('#lpu-map').scrollIntoView({ behavior: 'smooth', block: 'center' }); } });

// ---------- Boot ----------
renderPlaces();
initMap();
const start = location.hash.slice(1);
if (start && PLACES.some((p) => p.id === start)) setTimeout(() => focusPlace(start), 300);
