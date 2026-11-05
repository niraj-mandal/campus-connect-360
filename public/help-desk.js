const { $, esc, icon, post, field, bindForm, rules, fmtWhen, toast, showMsg } = CC;

const CATS = ['Hostel', 'IT & Wi-Fi', 'Library', 'Fees', 'Academics', 'Other'];
const STEPS = [['open', 'Received'], ['in_progress', 'In progress'], ['resolved', 'Resolved']];
const preset = new URLSearchParams(location.search).get('category');

// ---------- Raise a ticket ----------
const ticketForm = $('#ticket-form');
ticketForm.innerHTML = `
  <h2>Raise a ticket</h2>
  <p>Describe the problem clearly. You’ll get a ticket ID to track it.</p>
  <div class="form-grid">
    ${field({ name: 'name', label: 'Full Name', placeholder: 'Your name', attrs: 'autocomplete="name"' })}
    ${field({ name: 'reg', label: 'Registration Number', placeholder: 'e.g. 22BCS1045', attrs: 'autocomplete="off"' })}
    ${field({ name: 'email', label: 'Email Address', type: 'email', placeholder: 'student@university.edu', attrs: 'autocomplete="email"' })}
    ${field({ name: 'category', label: 'Category', options: CATS, placeholder: 'Choose a category', value: CATS.includes(preset) ? preset : '' })}
    ${field({ name: 'subject', label: 'Subject', placeholder: 'e.g. No hot water in H3, room 214', full: true, attrs: 'maxlength="100"' })}
    ${field({ name: 'description', label: 'Details', rows: 5, full: true, placeholder: 'What happened, since when, and anything you already tried', attrs: 'maxlength="1000"' })}
  </div>
  <button class="btn btn-dark btn-block" type="submit">Submit ticket ${icon('i-arrow')}</button>`;

bindForm(ticketForm, {
  rules: {
    name: rules.name, reg: rules.reg, email: rules.email, category: rules.required('Choose a category.'),
    subject: rules.length(5, 100, 'Subject'), description: rules.length(20, 1000, 'Description'),
  },
  submit: (data) => post('/api/tickets', data),
  onSuccess: (r, form, data) => {
    showMsg(form, `Ticket ${r.ref} created. We’ve noted ${data.email} for updates. Keep the ID to track it.`);
    form.reset();
    trackForm.elements.ref.value = r.ref;
    trackForm.elements.email.value = data.email;
    toast(`Ticket ${r.ref} created`);
    trackForm.requestSubmit();
  },
});

// ---------- Track a ticket ----------
const trackForm = $('#track-form');
const out = $('#track-out');
trackForm.innerHTML = `
  <h2>Track a ticket</h2>
  <p>Enter your ticket ID and the email you used.</p>
  <div class="form-grid">
    ${field({ name: 'ref', label: 'Ticket ID', placeholder: 'TK-1A2B3C4D', attrs: 'autocomplete="off"' })}
    ${field({ name: 'email', label: 'Email Address', type: 'email', placeholder: 'student@university.edu', attrs: 'autocomplete="email"' })}
  </div>
  <button class="btn btn-outline btn-block" type="submit">Check status</button>`;

bindForm(trackForm, {
  rules: { ref: rules.ref('TK'), email: rules.email },
  submit: (data) => { out.innerHTML = ''; return post('/api/tickets/track', data); },
  onSuccess: (t) => {
    const idx = STEPS.findIndex(([s]) => s === t.status);
    out.innerHTML = `
      <div class="result-card" style="background:var(--surface)">
        <div class="btn-row"><span class="badge">${esc(t.category)}</span><span class="badge ${t.status === 'resolved' ? 'badge-ok' : t.status === 'in_progress' ? 'badge-warn' : 'badge-info'}">${esc(STEPS[idx][1])}</span><span class="muted" style="font-size:12px">${esc(t.ref)}</span></div>
        <h3>${esc(t.subject)}</h3>
        <ol class="status-track">${STEPS.map(([, label], i) => `<li class="${i <= idx ? 'done' : ''}">${label}</li>`).join('')}</ol>
        <p class="muted" style="margin:0;font-size:13.5px;white-space:pre-line">${esc(t.description)}</p>
        ${t.note ? `<div class="reply"><small><b>Reply from the Help Desk</b> · ${fmtWhen(t.updated_at)}</small>${esc(t.note)}</div>` : '<p class="muted" style="margin:0;font-size:13px">No reply from the team yet.</p>'}
        <p class="muted" style="margin:0;font-size:12px">Opened ${fmtWhen(t.created_at)} · Last update ${fmtWhen(t.updated_at)}</p>
      </div>`;
    out.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },
});

if (preset && CATS.includes(preset)) ticketForm.elements.subject.focus();
