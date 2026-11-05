const { $, esc, icon, api, post, openModal, field, bindForm, rules, chips, reveal, timeAgo, fmtDay, fmtWhen, toast } = CC;

let ITEMS = [];
let filter = '', query = '';
const today = () => new Date().toISOString().slice(0, 10);

function render() {
  const q = query.toLowerCase();
  const list = ITEMS.filter((i) => (!filter || i.kind === filter) && (!q || (i.title + ' ' + i.description + ' ' + i.location).toLowerCase().includes(q)));
  $('#lf-grid').innerHTML = list.length ? list.map((i) => `
    <article class="card reveal" id="item-${esc(i.ref)}">
      <span class="badge ${i.kind === 'lost' ? 'badge-err' : 'badge-ok'}">${i.kind === 'lost' ? 'Lost' : 'Found'}</span>
      <h3>${esc(i.title)}</h3>
      <p>${esc(i.description)}</p>
      <div class="meta"><span>${icon('i-pin')}${esc(i.location)}</span><span>${icon('i-calendar')}${fmtDay(i.happened_on)}</span></div>
      <div class="card-foot">
        <span class="muted" style="font-size:12px">Posted ${timeAgo(i.created_at)}</span>
        <button class="btn btn-sm ${i.kind === 'lost' ? 'btn-dark' : 'btn-outline'}" type="button" data-reply="${esc(i.ref)}">${i.kind === 'lost' ? 'I found this' : 'This is mine'}</button>
      </div>
    </article>`).join('')
    : `<div class="empty-state"><strong>${ITEMS.length ? 'Nothing matches' : 'No open posts right now'}</strong>${ITEMS.length ? 'Try another filter or search term.' : 'Lost something? Post a report so finders can reach you.'}</div>`;
  reveal($('#lf-grid'));
}

async function load() {
  const r = await api('/api/lost-found').catch(() => null);
  if (!r?.ok) { $('#lf-grid').innerHTML = '<div class="empty-state"><strong>Posts could not be loaded</strong>Refresh the page to try again.</div>'; return; }
  ITEMS = r.body;
  render();
}

// ---------- Report ----------
function openReport(kind) {
  openModal(`
    <p class="eyebrow">Lost &amp; Found</p>
    <h2>Report an item</h2>
    <p class="lead">Your email stays private. People reply through this site, and you read replies with the post ID you get next.</p>
    <form id="report-form" novalidate>
      <div class="segmented" role="radiogroup" aria-label="Lost or found">
        <label><input type="radio" name="kind" value="lost"${kind === 'lost' ? ' checked' : ''}><span>I lost something</span></label>
        <label><input type="radio" name="kind" value="found"${kind === 'found' ? ' checked' : ''}><span>I found something</span></label>
      </div>
      <div class="form-grid">
        ${field({ name: 'title', label: 'Item', placeholder: 'e.g. Black HP laptop charger', full: true, attrs: 'maxlength="80" autofocus' })}
        ${field({ name: 'description', label: 'Description', rows: 3, full: true, placeholder: 'Colour, brand, stickers, anything that helps identify it', attrs: 'maxlength="500"' })}
        ${field({ name: 'location', label: 'Where', placeholder: 'e.g. Library 2nd floor', attrs: 'maxlength="80"' })}
        ${field({ name: 'happened_on', label: 'When', type: 'date', value: today(), attrs: `max="${today()}"` })}
        ${field({ name: 'name', label: 'Your Name', placeholder: 'Full name', attrs: 'autocomplete="name"' })}
        ${field({ name: 'email', label: 'Your Email', type: 'email', placeholder: 'student@university.edu', attrs: 'autocomplete="email"' })}
      </div>
      <button class="btn btn-dark btn-block" type="submit">Post it ${icon('i-arrow')}</button>
    </form>`, (body) => {
    bindForm(body.querySelector('#report-form'), {
      rules: {
        title: rules.length(3, 80, 'Item name'), description: rules.length(10, 500, 'Description'),
        location: rules.length(2, 80, 'Location'), happened_on: rules.pastDate, name: rules.name, email: rules.email,
      },
      submit: (data) => post('/api/lost-found', data),
      onSuccess: (r, form) => {
        form.innerHTML = `<div class="form-msg">Your post is live. Your post ID is <b>${esc(r.ref)}</b>.</div>
          <p class="muted" style="font-size:13.5px;margin:12px 0">Save this ID. Use it with your email under “Manage my post” to read replies or mark the item as returned.</p>
          <div class="btn-row"><button class="btn btn-dark btn-sm" type="button" id="copy-ref">Copy ID</button><button class="btn btn-outline btn-sm" type="button" data-close>Done</button></div>`;
        form.querySelector('#copy-ref').addEventListener('click', async () => {
          try { await navigator.clipboard.writeText(r.ref); toast('Post ID copied'); } catch { toast('Copy failed. Write the ID down: ' + r.ref, 'err'); }
        });
        load();
      },
    });
  });
}
document.addEventListener('click', (e) => { const b = e.target.closest('[data-report]'); if (b) openReport(b.dataset.report); });

// ---------- Reply ----------
function openReply(ref) {
  const i = ITEMS.find((x) => x.ref === ref);
  if (!i) return;
  const lost = i.kind === 'lost';
  openModal(`
    <p class="eyebrow">${lost ? 'Lost item' : 'Found item'}</p>
    <h2>${lost ? 'You found it?' : 'Is this yours?'}</h2>
    <p class="lead"><b>${esc(i.title)}</b> · ${esc(i.location)} · ${fmtDay(i.happened_on)}</p>
    <form id="reply-form" novalidate>
      <div class="form-grid">
        ${field({ name: 'name', label: 'Your Name', placeholder: 'Full name', attrs: 'autocomplete="name" autofocus' })}
        ${field({ name: 'email', label: 'Your Email', type: 'email', placeholder: 'student@university.edu', attrs: 'autocomplete="email"' })}
        ${field({ name: 'body', label: 'Message', rows: 4, full: true, placeholder: lost ? 'Where you found it and where you left it, or how to meet' : 'Describe something only the owner would know (a sticker, what’s inside…)', attrs: 'maxlength="500"' })}
      </div>
      <p class="muted" style="font-size:12.5px;margin:0 0 14px">The person who posted will see your name, email and message so they can contact you.</p>
      <button class="btn btn-dark btn-block" type="submit">Send to the poster ${icon('i-arrow')}</button>
    </form>`, (body) => {
    bindForm(body.querySelector('#reply-form'), {
      rules: { name: rules.name, email: rules.email, body: rules.length(10, 500, 'Your message') },
      submit: (data) => post(`/api/lost-found/${encodeURIComponent(ref)}/reply`, data),
      onSuccess: (r, form) => {
        form.innerHTML = `<div class="form-msg">Sent! The poster will see your message and can email you back.</div>
          <div class="btn-row" style="margin-top:14px"><button class="btn btn-outline btn-sm" type="button" data-close>Done</button></div>`;
      },
    });
  });
}
$('#lf-grid').addEventListener('click', (e) => { const b = e.target.closest('[data-reply]'); if (b) openReply(b.dataset.reply); });

// ---------- Manage my post ----------
function openManage() {
  openModal(`
    <p class="eyebrow">Lost &amp; Found</p>
    <h2>Manage my post</h2>
    <p class="lead">Enter your post ID and the email you used to read replies or close the post.</p>
    <form id="lf-manage" novalidate>
      <div class="form-grid">
        ${field({ name: 'ref', label: 'Post ID', placeholder: 'LF-1A2B3C4D', attrs: 'autocomplete="off" autofocus' })}
        ${field({ name: 'email', label: 'Email Address', type: 'email', placeholder: 'student@university.edu', attrs: 'autocomplete="email"' })}
      </div>
      <button class="btn btn-dark btn-block" type="submit">Open my post</button>
    </form>
    <div id="lf-manage-out"></div>`, (body) => {
    const out = body.querySelector('#lf-manage-out');
    bindForm(body.querySelector('#lf-manage'), {
      rules: { ref: rules.ref('LF'), email: rules.email },
      submit: (data) => { out.innerHTML = ''; return post('/api/lost-found/manage', data); },
      onSuccess: (item, form, data) => {
        out.innerHTML = `
          <div class="result-card">
            <div class="btn-row"><span class="badge ${item.kind === 'lost' ? 'badge-err' : 'badge-ok'}">${item.kind}</span><span class="badge ${item.status === 'open' ? 'badge-info' : ''}">${item.status === 'open' ? 'Open' : 'Resolved'}</span></div>
            <h3>${esc(item.title)}</h3>
            <p class="muted" style="margin:0;font-size:13.5px">${esc(item.location)} · ${fmtDay(item.happened_on)}</p>
            <strong style="font-size:14px;margin-top:6px">Replies (${item.replies.length})</strong>
            <div class="replies">${item.replies.length ? item.replies.map((r) => `
              <div class="reply"><small><b>${esc(r.name)}</b> · <a href="mailto:${esc(r.email)}">${esc(r.email)}</a> · ${fmtWhen(r.created_at)}</small>${esc(r.body)}</div>`).join('')
              : '<p class="muted" style="font-size:13.5px;margin:0">No replies yet. Check back later.</p>'}</div>
            ${item.status === 'open' ? `<div class="btn-row" style="margin-top:6px"><button class="btn btn-sm btn-dark" type="button" data-resolve>${icon('i-check')} Mark as returned</button></div>` : ''}
          </div>`;
        out.querySelector('[data-resolve]')?.addEventListener('click', async (ev) => {
          ev.target.disabled = true;
          const r = await post('/api/lost-found/resolve', data).catch(() => null);
          if (r?.ok) { toast('Marked as returned. Your post is now closed.'); form.requestSubmit(); load(); }
          else { ev.target.disabled = false; toast(r?.body?.error || 'Could not update. Try again.', 'err'); }
        });
      },
    });
  });
}
$('#manage-post').addEventListener('click', openManage);
$('#lf-search').addEventListener('input', (e) => { query = e.target.value.trim(); render(); });
chips($('#lf-filters'), [['', 'All posts'], ['lost', 'Lost'], ['found', 'Found']], (v) => { filter = v; render(); });

$('#lf-grid').innerHTML = '<div class="skeleton"></div>'.repeat(3);
load();
