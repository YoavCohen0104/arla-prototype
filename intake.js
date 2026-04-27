/* Arla Aesthetics — patient intake logic */

const SESSION_KEY = 'arla_intake';

const PHONE_RE = /^\+?[\d\s\-() ]{7,15}$/;

/* ── Validation ── */

function validateForm() {
  const errors = {};
  const data = readFormValues();

  if (!data.name.trim()) {
    errors.name = 'Full name is required.';
  }

  if (!data.phone.trim()) {
    errors.phone = 'Phone number is required.';
  } else if (!PHONE_RE.test(data.phone.trim())) {
    errors.phone = 'Enter a valid phone number (7–15 digits).';
  }

  if (!data.dob) {
    errors.dob = 'Date of birth is required.';
  } else {
    // DOB must be a past date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dobDate = new Date(data.dob);
    if (dobDate >= today) {
      errors.dob = 'Date of birth must be in the past.';
    }
  }

  if (!data.gender) {
    errors.gender = 'Please select a gender.';
  }

  if (!data.complaint.trim()) {
    errors.complaint = 'Chief complaint is required.';
  }

  return { errors, data };
}

function readFormValues() {
  return {
    name:      (document.getElementById('name')?.value      ?? ''),
    phone:     (document.getElementById('phone')?.value     ?? ''),
    dob:       (document.getElementById('dob')?.value       ?? ''),
    gender:    (document.getElementById('gender')?.value    ?? ''),
    complaint: (document.getElementById('complaint')?.value ?? ''),
  };
}

/* ── Error display ── */

function showErrors(errors) {
  const fields = ['name', 'phone', 'dob', 'gender', 'complaint'];
  fields.forEach(field => {
    const input   = document.getElementById(field);
    const errEl   = document.getElementById(field + '-error');
    if (!input || !errEl) return;

    if (errors[field]) {
      input.classList.add('invalid');
      errEl.textContent = errors[field];
      errEl.classList.add('visible');
    } else {
      input.classList.remove('invalid');
      errEl.textContent = '';
      errEl.classList.remove('visible');
    }
  });
}

function clearErrors() {
  showErrors({});
}

/* ── Session storage ── */

function saveToSession(data) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

function loadFromSession() {
  const raw = sessionStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

/* ── Form page init ── */

function initForm() {
  const form = document.getElementById('intake-form');
  if (!form) return;

  // Pre-fill if returning from Edit
  const saved = loadFromSession();
  if (saved) {
    document.getElementById('name').value      = saved.name      ?? '';
    document.getElementById('phone').value     = saved.phone     ?? '';
    document.getElementById('dob').value       = saved.dob       ?? '';
    document.getElementById('gender').value    = saved.gender    ?? '';
    document.getElementById('complaint').value = saved.complaint ?? '';
  }

  // Clear per-field error on input
  ['name', 'phone', 'dob', 'gender', 'complaint'].forEach(field => {
    const el = document.getElementById(field);
    if (el) el.addEventListener('input', () => {
      el.classList.remove('invalid');
      const errEl = document.getElementById(field + '-error');
      if (errEl) { errEl.textContent = ''; errEl.classList.remove('visible'); }
    });
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const { errors, data } = validateForm();

    if (Object.keys(errors).length > 0) {
      showErrors(errors);
      // Scroll to first error
      const firstInvalid = form.querySelector('.invalid');
      if (firstInvalid) firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    clearErrors();
    saveToSession(data);
    window.location.href = 'intake-confirm.html';
  });
}

/* ── Confirmation page init ── */

function initConfirm() {
  const container = document.getElementById('confirm-container');
  if (!container) return;

  const data = loadFromSession();
  if (!data) {
    // No session data — send back to form
    window.location.href = 'intake-form.html';
    return;
  }

  renderConfirmation(data);

  document.getElementById('btn-edit')?.addEventListener('click', () => {
    window.location.href = 'intake-form.html';
  });

  document.getElementById('btn-confirm')?.addEventListener('click', () => {
    console.log('Case started:', data);
    clearSession();
    // Placeholder: in production this would navigate to the case view
  });
}

function renderConfirmation(data) {
  // Format DOB for display: yyyy-mm-dd → readable local date
  let dobDisplay = data.dob;
  if (data.dob) {
    const [y, m, d] = data.dob.split('-');
    const dt = new Date(Number(y), Number(m) - 1, Number(d));
    dobDisplay = dt.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  }

  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  set('cv-name',      data.name);
  set('cv-phone',     data.phone);
  set('cv-dob',       dobDisplay);
  set('cv-gender',    data.gender);
  set('cv-complaint', data.complaint);
}

/* ── Bootstrap ── */

document.addEventListener('DOMContentLoaded', () => {
  initForm();
  initConfirm();
});
