const { $, esc, icon, api, chips, timeAgo } = CC;

let NOTICES = [];
let filter = '', query = '';

function render() {
  const q = query.toLowerCase();
  const list = NOTICES.filter((n) => (!filter || n.category === filter) && (!q || (n.title + ' ' + n.body).toLowerCase().includes(q)));
  $('#notice-list').innerHTML = list.length ? list.map((n) => `
    <article class="notice${n.pinned ? ' pinned' : ''}" id="notice-${n.id}">
      <div class="notice-top">
        ${n.pinned ? `<span class="badge badge-info">${icon('i-star')}Pinned</span>` : ''}
        <span class="badge">${esc(n.category)}</span>
        <time datetime="${esc(n.created_at)}" title="${esc(new Date(n.created_at).toLocaleString())}">${timeAgo(n.created_at)}</time>
      </div>
      <h3>${esc(n.title)}</h3>
      <p>${esc(n.body)}</p>
    </article>`).join('')
    : `<div class="empty-state"><strong>No notices here</strong>${query || filter ? 'Try another category or search term.' : 'New announcements will appear here.'}</div>`;
}

$('#notice-search').addEventListener('input', (e) => { query = e.target.value.trim(); render(); });

(async function init() {
  $('#notice-list').innerHTML = '<div class="skeleton" style="min-height:110px"></div>'.repeat(4);
  const r = await api('/api/notices').catch(() => null);
  if (!r?.ok) { $('#notice-list').innerHTML = '<div class="empty-state"><strong>Notices could not be loaded</strong>Refresh the page to try again.</div>'; return; }
  NOTICES = r.body;
  const cats = ['Exams', 'Deadlines', 'Holidays', 'Library', 'General'].filter((c) => NOTICES.some((n) => n.category === c));
  chips($('#notice-filters'), [['', 'All'], ...cats.map((c) => [c, c])], (v) => { filter = v; render(); });
  render();
  const target = location.hash && document.getElementById(location.hash.slice(1));
  if (target) target.scrollIntoView({ block: 'center' });
})();
