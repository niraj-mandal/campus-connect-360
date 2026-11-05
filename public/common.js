// Shared by every page: icons, header, footer, theme, menu, search, popups, toasts and form helpers.
(function () {
  const ICONS = `
  <symbol id="i-arrow" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-arrow-up" viewBox="0 0 24 24"><path d="M7 17 17 7M8 7h9v9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-check" viewBox="0 0 24 24"><path d="m5 12 5 5L20 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-book" viewBox="0 0 24 24"><path d="M12 6.5C10 5 7 4.5 3 5v13c4-.5 7 0 9 1.5m0-13c2-1.5 5-2 9-1.5v13c-4-.5-7 0-9 1.5m0-13v13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></symbol>
  <symbol id="i-bed" viewBox="0 0 24 24"><path d="M3 6v13M3 15h18v4M21 15v-3a3 3 0 0 0-3-3h-8v6M6.5 12.5a1.5 1.5 0 1 0 0-.01" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-laptop" viewBox="0 0 24 24"><path d="M4 5h16v10H4zM2 19h20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-users" viewBox="0 0 24 24"><path d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 9a6 6 0 0 1 12 0m1-9a3 3 0 1 0-1.5-5.6M17 14a5 5 0 0 1 4 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="m16 16 4.5 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></symbol>
  <symbol id="i-moon" viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/></symbol>
  <symbol id="i-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></symbol>
  <symbol id="i-chevron" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></symbol>
  <symbol id="i-close" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></symbol>
  <symbol id="i-pin" viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="9.5" r="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/></symbol>
  <symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></symbol>
  <symbol id="i-calendar" viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 10h17M8 3v4m8-4v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></symbol>
  <symbol id="i-bell" viewBox="0 0 24 24"><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Zm4 4a2 2 0 0 0 4 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></symbol>
  <symbol id="i-tag" viewBox="0 0 24 24"><path d="M3.5 12.5V4.5h8l9 9-8 8-9-9Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="8" cy="9" r="1.5" fill="currentColor"/></symbol>
  <symbol id="i-ticket" viewBox="0 0 24 24"><path d="M3.5 7.5a2 2 0 0 0 2-2h13a2 2 0 0 0 2 2v3a1.5 1.5 0 0 0 0 3v3a2 2 0 0 0-2 2h-13a2 2 0 0 0-2-2v-3a1.5 1.5 0 0 0 0-3v-3Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M14 6v12" stroke="currentColor" stroke-width="1.6" stroke-dasharray="2 2"/></symbol>
  <symbol id="i-map" viewBox="0 0 24 24"><path d="m3.5 6 5.5-2 6 2 5.5-2v14l-5.5 2-6-2-5.5 2V6Zm5.5-2v14m6-12v14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></symbol>
  <symbol id="i-help" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></symbol>
  <symbol id="i-mail" viewBox="0 0 24 24"><rect x="3" y="5.5" width="18" height="13" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m4 7 8 6 8-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></symbol>
  <symbol id="i-phone" viewBox="0 0 24 24"><path d="M5 4h3.5l1.5 4.5-2 1.5a11 11 0 0 0 6 6l1.5-2 4.5 1.5V19a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></symbol>
  <symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></symbol>
  <symbol id="i-star" viewBox="0 0 24 24"><path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5Z" fill="currentColor"/></symbol>
  <symbol id="logo" viewBox="0 0 40 24"><ellipse cx="13" cy="12" rx="9.5" ry="8" transform="rotate(-28 13 12)" fill="none" stroke="currentColor" stroke-width="2.8"/><ellipse cx="27" cy="12" rx="9.5" ry="8" transform="rotate(-28 27 12)" fill="none" stroke="currentColor" stroke-width="2.8"/></symbol>`;

  const NAV = [
    ['home', 'Home', '/'],
    ['services', 'Services', '/#services'],
    ['events', 'Events', '/#events'],
    ['clubs', 'Clubs', '/clubs'],
    ['notices', 'Notices', '/notices'],
    ['help-desk', 'Help Desk', '/help-desk'],
  ];

  const PAGES = [
    { label: 'Clubs & Communities', kind: 'Page', text: 'join student clubs societies', href: '/clubs' },
    { label: 'Notice Board', kind: 'Page', text: 'announcements exams holidays deadlines', href: '/notices' },
    { label: 'Lost & Found', kind: 'Page', text: 'lost found items report claim', href: '/lost-found' },
    { label: 'Help Desk', kind: 'Page', text: 'ticket support hostel it wifi fees complaint track', href: '/help-desk' },
    { label: 'LPU Campus Map', kind: 'Page', text: 'map buildings directions unipolis uni mall hospital hostel railway station airport phagwara law gate', href: '/campus' },
    { label: 'About LPU & contacts', kind: 'Page', text: 'lovely professional university naac nirf helpline phone email address', href: '/campus#about-title' },
    { label: 'Register for an Event', kind: 'Page', text: 'registration sign up', href: '/#register' },
    { label: 'Manage my registration', kind: 'Page', text: 'cancel booking confirmation calendar', href: '/#manage' },
    { label: 'FAQs', kind: 'Page', text: 'questions help', href: '/#faq' },
    { label: 'Contact Us', kind: 'Page', text: 'message email support', href: '/#contact' },
  ];

  // ---------- Helpers ----------
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');
  const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const dateParts = (iso) => { const [, m, d] = String(iso).split('-'); return { day: d, month: MONTHS[Number(m) - 1] }; };
  const fmtDay = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const fmtTime = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return new Date(2000, 0, 1, h, m).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }); };
  const fmtWhen = (iso) => new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  const timeAgo = (iso) => {
    const s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (s < 60) return 'just now';
    const units = [[86400 * 30, 'month'], [86400 * 7, 'week'], [86400, 'day'], [3600, 'hour'], [60, 'minute']];
    for (const [sec, name] of units) if (s >= sec) { const n = Math.floor(s / sec); return `${n} ${name}${n > 1 ? 's' : ''} ago`; }
    return 'just now';
  };
  const icon = (id, cls = '') => `<svg class="${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;

  async function api(path, options = {}) {
    const res = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
    const body = res.status === 204 ? {} : await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, body };
  }
  const post = (path, data) => api(path, { method: 'POST', body: JSON.stringify(data) });

  // ---------- Toast ----------
  function toast(text, type = 'ok') {
    let box = $('#cc-toasts');
    if (!box) { box = document.createElement('div'); box.id = 'cc-toasts'; box.className = 'toasts'; box.setAttribute('aria-live', 'polite'); document.body.append(box); }
    const t = document.createElement('div');
    t.className = 'toast toast-' + type;
    t.textContent = text;
    box.append(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 3800);
  }

  // ---------- Modal ----------
  let lastFocus = null;
  function modalEl() {
    let d = $('#cc-modal');
    if (!d) {
      d = document.createElement('dialog');
      d.id = 'cc-modal';
      d.className = 'modal';
      d.innerHTML = `<div class="modal-inner"><button class="icon-btn modal-close" type="button" aria-label="Close">${icon('i-close')}</button><div class="modal-body"></div></div>`;
      document.body.append(d);
      d.addEventListener('click', (e) => { if (e.target === d || e.target.closest('.modal-close') || e.target.closest('[data-close]')) closeModal(); });
      d.addEventListener('close', () => { document.documentElement.classList.remove('modal-open'); lastFocus?.focus?.(); });
    }
    return d;
  }
  function openModal(html, onMount) {
    const d = modalEl();
    lastFocus = document.activeElement;
    $('.modal-body', d).innerHTML = html;
    if (!d.open) d.showModal();
    document.documentElement.classList.add('modal-open');
    $('.modal-body', d).scrollTop = 0;
    onMount?.($('.modal-body', d));
    ($('.modal-body [autofocus]', d) || $('.modal-body input, .modal-body select, .modal-body textarea, .modal-body .btn', d))?.focus();
  }
  function closeModal() { const d = $('#cc-modal'); if (d?.open) d.close(); }

  // ---------- Forms ----------
  const NAME_RE = /^[\p{L} .'-]{3,60}$/u;
  const rules = {
    name: (v) => !v ? 'Please enter your full name.' : !NAME_RE.test(v) ? 'Use letters only (3–60 characters).' : '',
    reg: (v) => !v ? 'Please enter your registration number.' : !/^[A-Za-z0-9-]{5,15}$/.test(v) ? '5–15 letters, numbers or dashes.' : '',
    email: (v) => !v ? 'Please enter your email address.' : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? 'Enter a valid email address.' : '',
    required: (msg) => (v) => v ? '' : msg,
    length: (min, max, label) => (v) => !v ? `${label} is required.` : v.length < min ? `${label} needs at least ${min} characters.` : v.length > max ? `${label} must be under ${max} characters.` : '',
    ref: (prefix) => (v) => new RegExp(`^${prefix}-[0-9A-F]{8}$`, 'i').test(v) ? '' : `Enter an ID like ${prefix}-1A2B3C4D.`,
    pastDate: (v) => !v ? 'Pick a date.' : v > new Date().toISOString().slice(0, 10) ? 'The date cannot be in the future.' : '',
  };

  function field({ name, label, type = 'text', placeholder = '', options, rows, value = '', hint = '', full = false, optional = false, attrs = '' }) {
    const id = 'f-' + name + '-' + Math.random().toString(36).slice(2, 7);
    let control;
    if (options) {
      control = `<div class="select-wrap"><select id="${id}" name="${esc(name)}" ${attrs}>
        <option value="">${esc(placeholder || 'Choose…')}</option>
        ${options.map((o) => { const [v, l, dis] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}"${String(v) === String(value) ? ' selected' : ''}${dis ? ' disabled' : ''}>${esc(l)}</option>`; }).join('')}
      </select>${icon('i-chevron')}</div>`;
    } else if (rows) {
      control = `<textarea id="${id}" name="${esc(name)}" rows="${rows}" placeholder="${esc(placeholder)}" ${attrs}>${esc(value)}</textarea>`;
    } else {
      control = `<input id="${id}" name="${esc(name)}" type="${type}" placeholder="${esc(placeholder)}" value="${esc(value)}" ${attrs}>`;
    }
    return `<div class="field${full ? ' full' : ''}">
      <label for="${id}">${esc(label)} ${optional ? '<span class="opt">(optional)</span>' : '<span class="req">*</span>'}</label>
      ${control}
      ${hint ? `<small class="hint">${esc(hint)}</small>` : ''}
      <small class="error" aria-live="polite"></small>
    </div>`;
  }

  function setError(input, msg) {
    const f = input.closest('.field');
    if (!f) return;
    f.classList.toggle('invalid', !!msg);
    f.querySelector('.error').textContent = msg || '';
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }

  // Wires client validation, a busy state and server-side errors onto a form.
  // submit(data) must return the api() result; onSuccess(body, form) runs on 2xx.
  function bindForm(form, { rules: fieldRules = {}, submit, onSuccess, onError }) {
    const msgBox = form.querySelector('.form-msg');
    const validateOne = (input) => {
      const rule = fieldRules[input.name];
      if (!rule) return true;
      const msg = rule(input.value.trim(), form);
      setError(input, msg);
      return !msg;
    };
    form.querySelectorAll('input, select, textarea').forEach((input) => {
      input.addEventListener('blur', () => input.value && validateOne(input));
      input.addEventListener('input', () => input.closest('.field')?.classList.contains('invalid') && validateOne(input));
    });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (msgBox) msgBox.hidden = true;
      const inputs = [...form.querySelectorAll('input, select, textarea')].filter((i) => i.name);
      const ok = inputs.map(validateOne).every(Boolean);
      if (!ok) { form.querySelector('.invalid input, .invalid select, .invalid textarea')?.focus(); return; }
      const data = Object.fromEntries(new FormData(form));
      for (const k of Object.keys(data)) if (typeof data[k] === 'string') data[k] = data[k].trim();
      const btn = form.querySelector('[type="submit"]');
      btn?.classList.add('is-loading'); if (btn) btn.disabled = true;
      try {
        const res = await submit(data);
        if (res.ok) { onSuccess?.(res.body, form, data); return; }
        if (res.body?.errors) {
          for (const [name, msg] of Object.entries(res.body.errors)) { const input = form.elements[name]; if (input) setError(input, msg); }
          form.querySelector('.invalid input, .invalid select, .invalid textarea')?.focus();
          onError?.(res);
        } else showMsg(form, res.body?.error || 'Something went wrong. Please try again.', true);
      } catch {
        showMsg(form, 'Could not reach the server. Check your connection and try again.', true);
      } finally {
        btn?.classList.remove('is-loading'); if (btn) btn.disabled = false;
      }
    });
  }
  function showMsg(form, text, isError) {
    let box = form.querySelector('.form-msg');
    if (!box) { box = document.createElement('div'); box.className = 'form-msg'; box.setAttribute('role', 'status'); form.append(box); }
    box.textContent = text;
    box.classList.toggle('is-error', !!isError);
    box.hidden = false;
  }

  // ---------- Calendar (.ics) ----------
  function downloadIcs(ev) {
    const [y, m, d] = ev.starts_on.split('-');
    const [hh, mm] = (ev.start_time || '10:00').split(':');
    const start = `${y}${m}${d}T${hh}${mm}00`;
    const endDate = new Date(Number(y), Number(m) - 1, Number(d), Number(hh) + 2, Number(mm));
    const end = `${endDate.getFullYear()}${pad(endDate.getMonth() + 1)}${pad(endDate.getDate())}T${pad(endDate.getHours())}${pad(endDate.getMinutes())}00`;
    const clean = (s) => String(s).replace(/[\\,;]/g, (c) => '\\' + c).replace(/\n/g, '\\n');
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Campus Connect 360//EN', 'BEGIN:VEVENT',
      `UID:${ev.id}-${start}@campusconnect360`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
      `DTSTART:${start}`, `DTEND:${end}`, `SUMMARY:${clean(ev.title)}`, `LOCATION:${clean(ev.venue || 'Campus')}`,
      `DESCRIPTION:${clean(ev.description || '')}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    a.download = `${ev.id}.ics`;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // ---------- Layout ----------
  const page = document.body.dataset.page || 'home';

  function renderShell() {
    document.body.insertAdjacentHTML('afterbegin', `<svg width="0" height="0" style="position:absolute" aria-hidden="true">${ICONS}</svg>
      <a class="skip-link" href="#main">Skip to content</a>`);

    const header = $('#site-header');
    if (header && !header.dataset.static) {
      header.className = 'site-header';
      header.innerHTML = `
      <div class="container header-inner">
        <a class="brand" href="/" aria-label="Campus Connect 360 home">${icon('logo', 'brand-logo')}<span>Campus Connect 360</span></a>
        <nav class="main-nav" id="main-nav" aria-label="Primary">
          ${NAV.map(([id, label, href]) => `<a href="${href}" data-nav="${id}"${id === page ? ' class="active" aria-current="page"' : ''}>${label}</a>`).join('')}
        </nav>
        <div class="header-actions">
          <button class="icon-btn" id="search-open" aria-label="Search (press /)">${icon('i-search')}</button>
          <button class="icon-btn" id="theme-toggle" aria-label="Toggle dark mode">${icon('i-moon')}</button>
          <a class="btn btn-dark btn-sm header-cta" href="/campus">Explore Campus ${icon('i-arrow-up')}</a>
          <button class="icon-btn menu-btn" id="menu-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="main-nav">${icon('i-menu')}</button>
        </div>
      </div>`;
    }

    const footer = $('#site-footer');
    if (footer) {
      footer.className = 'site-footer';
      footer.innerHTML = `
      <div class="container footer-grid">
        <div class="footer-brand">
          <a class="brand" href="/">${icon('logo', 'brand-logo')}<span>Campus Connect 360</span></a>
          <p>A smarter way to experience campus life.</p>
        </div>
        <div>
          <h4>Platform</h4>
          <a href="/">Home</a><a href="/#services">Services</a><a href="/#events">Events</a><a href="/#register">Registration</a><a href="/campus">LPU Campus Map</a>
        </div>
        <div>
          <h4>Student Services</h4>
          <a href="/clubs">Clubs</a><a href="/notices">Notice Board</a><a href="/lost-found">Lost &amp; Found</a><a href="/help-desk">Help Desk</a>
        </div>
        <div>
          <h4>Support</h4>
          <a href="#" data-action="assistant">Campus Assistant</a><a href="/#contact">Contact Us</a><a href="/#faq">Help &amp; FAQs</a><a href="/admin">Organizers</a>
        </div>
        <div>
          <h4>Stay Connected</h4>
          <div class="socials">
            <a href="https://www.instagram.com/" target="_blank" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/></svg></a>
            <a href="https://www.youtube.com/" target="_blank" rel="noopener" aria-label="YouTube"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M22 8.2a3 3 0 0 0-2.1-2.1C18 5.6 12 5.6 12 5.6s-6 0-7.9.5A3 3 0 0 0 2 8.2 31 31 0 0 0 1.6 12 31 31 0 0 0 2 15.8a3 3 0 0 0 2.1 2.1c1.9.5 7.9.5 7.9.5s6 0 7.9-.5a3 3 0 0 0 2.1-2.1c.3-1.2.4-2.5.4-3.8s-.1-2.6-.4-3.8ZM10 15V9l5.2 3L10 15Z"/></svg></a>
            <a href="https://www.linkedin.com/" target="_blank" rel="noopener" aria-label="LinkedIn"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M4.5 3.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM3 9h3v12H3V9Zm6 0h2.9v1.7c.5-.9 1.7-2 3.6-2 3.8 0 4.5 2.5 4.5 5.7V21h-3v-5.8c0-1.4 0-3.2-2-3.2s-2.3 1.5-2.3 3.1V21H9V9Z"/></svg></a>
            <a href="https://x.com/" target="_blank" rel="noopener" aria-label="X"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.2-8.3L1.8 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z"/></svg></a>
          </div>
        </div>
      </div>
      <div class="container footer-bottom">
        <span>© ${new Date().getFullYear()} Campus Connect 360. All rights reserved.</span>
        <span>Student project for LPU <i>|</i> Not an official Lovely Professional University website · <a href="https://www.lpu.in" target="_blank" rel="noopener" style="text-decoration:underline">lpu.in</a></span>
      </div>`;
    }

    document.body.insertAdjacentHTML('beforeend', `
      <div class="search-overlay" id="search-overlay" hidden>
        <div class="search-panel" role="dialog" aria-modal="true" aria-label="Search campus">
          <div class="search-bar">
            ${icon('i-search')}
            <input id="search-input" type="search" placeholder="Search services, events, clubs, notices…" autocomplete="off">
            <button class="icon-btn" id="search-close" aria-label="Close search">${icon('i-close')}</button>
          </div>
          <ul class="search-results" id="search-results"></ul>
        </div>
      </div>`);
  }

  // ---------- Theme ----------
  function initTheme() {
    const btn = $('#theme-toggle');
    if (!btn) return;
    const sync = () => {
      const dark = document.documentElement.dataset.theme === 'dark';
      btn.querySelector('use').setAttribute('href', dark ? '#i-sun' : '#i-moon');
      btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    };
    btn.addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem('cc-theme', next); } catch { /* ignore */ }
      sync();
    });
    sync();
  }

  // ---------- Mobile menu ----------
  function initMenu() {
    const nav = $('#main-nav'), btn = $('#menu-toggle');
    if (!nav || !btn) return;
    const set = (open) => {
      nav.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open);
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      btn.querySelector('use').setAttribute('href', open ? '#i-close' : '#i-menu');
    };
    btn.addEventListener('click', () => set(!nav.classList.contains('open')));
    nav.addEventListener('click', (e) => { if (e.target.tagName === 'A') set(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('open')) { set(false); btn.focus(); } });
  }

  // ---------- Search ----------
  let searchData = null;
  async function loadSearchData() {
    if (searchData) return searchData;
    const [events, clubs, notices] = await Promise.all(['/api/events', '/api/clubs', '/api/notices'].map((p) => api(p).then((r) => (r.ok ? r.body : [])).catch(() => [])));
    searchData = [
      ...PAGES,
      ...(window.CC_SERVICES || []).map((s) => ({ label: s.name, kind: 'Service', text: s.desc + ' ' + (s.tags || ''), href: '/#svc-' + s.id })),
      ...events.map((e) => { const { day, month } = dateParts(e.starts_on); return { label: e.title, kind: `Event · ${day} ${month}`, text: e.description + ' ' + e.venue, href: '/#evt-' + e.id }; }),
      ...clubs.map((c) => ({ label: c.name, kind: `Club · ${c.category}`, text: c.description, href: '/clubs#club-' + c.id })),
      ...notices.map((n) => ({ label: n.title, kind: `Notice · ${n.category}`, text: n.body, href: '/notices#notice-' + n.id })),
    ];
    return searchData;
  }
  function initSearch() {
    const overlay = $('#search-overlay'), input = $('#search-input'), results = $('#search-results'), openBtn = $('#search-open');
    const render = async () => {
      const q = input.value.trim().toLowerCase();
      const data = await loadSearchData();
      const hits = data.filter((i) => !q || (i.label + ' ' + i.text + ' ' + i.kind).toLowerCase().includes(q)).slice(0, 12);
      results.innerHTML = hits.length
        ? hits.map((h) => `<li><a href="${esc(h.href)}"><span>${esc(h.label)}</span><small>${esc(h.kind)}</small></a></li>`).join('')
        : `<li class="search-empty">No results for “${esc(input.value)}”. Try “library”, “hackathon” or “fees”.</li>`;
    };
    const open = (prefill = '') => { overlay.hidden = false; input.value = prefill; render(); input.focus(); };
    const close = () => { overlay.hidden = true; openBtn?.focus(); };
    window.CC.openSearch = open;
    openBtn?.addEventListener('click', () => open());
    $('#search-close').addEventListener('click', close);
    input.addEventListener('input', render);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    results.addEventListener('click', (e) => { if (e.target.closest('a')) overlay.hidden = true; });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { const first = results.querySelector('a'); if (first) { overlay.hidden = true; location.href = first.getAttribute('href'); } }
      if (e.key === 'ArrowDown') { e.preventDefault(); results.querySelector('a')?.focus(); }
    });
    results.addEventListener('keydown', (e) => {
      const links = $$('a', results), i = links.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); links[Math.min(i + 1, links.length - 1)]?.focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); (i <= 0 ? input : links[i - 1]).focus(); }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !overlay.hidden) close();
      if (e.key === '/' && overlay.hidden && !$('#cc-modal')?.open && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); open(); }
    });
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="assistant"]')) { e.preventDefault(); open(); }
    });
  }

  // ---------- Reveal on scroll ----------
  const revealer = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); revealer.unobserve(en.target); } });
  }, { threshold: 0.08 }) : null;
  function reveal(root = document) {
    $$('.reveal:not(.in)', root).forEach((el, i) => { el.style.transitionDelay = (i % 4) * 60 + 'ms'; revealer ? revealer.observe(el) : el.classList.add('in'); });
  }

  // ---------- Filter chips ----------
  // Renders chip buttons into `el`; calls onChange(value) when one is picked.
  function chips(el, values, onChange, current = '') {
    el.innerHTML = values.map(([v, label]) => `<button type="button" class="chip-btn${v === current ? ' active' : ''}" data-value="${esc(v)}" aria-pressed="${v === current}">${esc(label)}</button>`).join('');
    el.addEventListener('click', (e) => {
      const b = e.target.closest('.chip-btn');
      if (!b) return;
      $$('.chip-btn', el).forEach((x) => { x.classList.toggle('active', x === b); x.setAttribute('aria-pressed', x === b); });
      onChange(b.dataset.value);
    });
  }

  window.CC = { $, $$, esc, pad, icon, api, post, toast, openModal, closeModal, field, setError, bindForm, showMsg, rules, dateParts, fmtDay, fmtTime, fmtWhen, timeAgo, downloadIcs, reveal, chips, page, MONTHS };

  renderShell();
  initTheme();
  initMenu();
  initSearch();
  document.addEventListener('DOMContentLoaded', () => reveal());
  if (document.readyState !== 'loading') reveal();
})();
