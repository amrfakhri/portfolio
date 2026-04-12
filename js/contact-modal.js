/* ══════════════════════════════════════════════════════
   CONTACT MODAL
   Dependencies: GSAP (already loaded), EmailJS SDK
══════════════════════════════════════════════════════ */

// ─── EmailJS config ──────────────────────────────────
// Setup (takes ~5 min):
// 1. Sign up at https://www.emailjs.com  (free: 200 emails/month)
// 2. Add an Email Service → connect your Gmail account
// 3. Create an Email Template with these variables:
//      {{name}}  {{email}}  {{project_type}}  {{budget}}  {{message}}
//    Set the template's "To Email" field to: amr.fakhri@gmail.com
// 4. Replace the three placeholder strings below with your actual IDs
//    (found in the EmailJS dashboard under Services / Templates / Account)

const EMAILJS_SERVICE_ID  = 'service_3xhgrug';   // e.g. 'service_abc123'
const EMAILJS_TEMPLATE_ID = 'template_pm44i1a';  // e.g. 'template_xyz789'
const EMAILJS_PUBLIC_KEY  = 'ccnNnzhIswR5R4Jz0';   // Account → API Keys

// ─── DOM refs ────────────────────────────────────────
const cmOverlay   = document.getElementById('contact-modal');
const cmPanel     = cmOverlay?.querySelector('.cm-panel');
const cmClose     = cmOverlay?.querySelector('.cm-close');
const cmForm      = document.getElementById('cm-form');
const cmSubmit    = cmForm?.querySelector('.cm-submit');
const cmChips     = cmOverlay?.querySelectorAll('.cm-chip');
const cmTypeInput = document.getElementById('cm-type');

if (!cmOverlay || !cmPanel) {
  console.warn('[ContactModal] Modal elements not found in DOM.');
}

// ─── Initial GSAP state ──────────────────────────────
if (cmPanel) gsap.set(cmPanel, { y: 44, opacity: 0, scale: 0.96 });
setModalState('form');

// ─── Focus memory ────────────────────────────────────
let prevFocus = null;

// ─── Open ─────────────────────────────────────────────
function openModal() {
  if (!cmOverlay || cmOverlay.classList.contains('is-open')) return;

  prevFocus = document.activeElement;
  setModalState('form');   // always start fresh

  cmOverlay.classList.add('is-open');
  cmOverlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  // Overlay fade in
  gsap.to(cmOverlay, { opacity: 1, duration: 0.28, ease: 'power2.out' });

  // Panel slide up
  gsap.to(cmPanel, {
    y: 0, opacity: 1, scale: 1,
    duration: 0.5, ease: 'expo.out', delay: 0.06,
    onComplete() { cmClose?.focus(); },
  });

  // Stagger form rows/fields so the form "builds" progressively
  const formEls = cmForm
    ? [...cmForm.querySelectorAll(':scope > .cm-row, :scope > .cm-field, :scope > .cm-actions')]
    : [];

  if (formEls.length) {
    gsap.fromTo(
      formEls,
      { opacity: 0, y: 9 },
      { opacity: 1, y: 0, duration: 0.35, stagger: 0.048, ease: 'power2.out', delay: 0.22 }
    );
  }
}

// ─── Close ────────────────────────────────────────────
function closeModal() {
  if (!cmOverlay || !cmOverlay.classList.contains('is-open')) return;

  gsap.to(cmPanel, {
    y: 28, opacity: 0, scale: 0.97,
    duration: 0.24, ease: 'power3.in',
  });

  gsap.to(cmOverlay, {
    opacity: 0, duration: 0.28, delay: 0.04, ease: 'power2.in',
    onComplete() {
      cmOverlay.classList.remove('is-open');
      cmOverlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      // Reset GSAP values for next open
      gsap.set(cmPanel, { y: 44, opacity: 0, scale: 0.96 });
      prevFocus?.focus();
    },
  });
}

// ─── Triggers ─────────────────────────────────────────
// .nav-cta  = "Hire me" nav button
// .btn-email = "Send an email" contact section button
// [data-open-modal] = any other trigger (e.g. "Start a project")
document.querySelectorAll('.nav-cta, .btn-email, [data-open-modal]').forEach(el => {
  el.addEventListener('click', e => { e.preventDefault(); openModal(); });
});

// ─── Close events ─────────────────────────────────────
cmClose?.addEventListener('click', closeModal);

cmOverlay?.addEventListener('click', e => {
  if (e.target === cmOverlay) closeModal();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && cmOverlay?.classList.contains('is-open')) closeModal();
});

// ─── Focus trap ───────────────────────────────────────
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

cmOverlay?.addEventListener('keydown', e => {
  if (e.key !== 'Tab' || !cmOverlay.classList.contains('is-open')) return;

  // Filter out elements inside hidden parents
  const focusables = [...cmOverlay.querySelectorAll(FOCUSABLE)].filter(
    el => el.offsetParent !== null
  );
  if (!focusables.length) return;

  const first = focusables[0];
  const last  = focusables[focusables.length - 1];

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault(); last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault(); first.focus();
  }
});

// ─── Chip selection ───────────────────────────────────
cmChips?.forEach(chip => {
  chip.addEventListener('click', () => {
    cmChips.forEach(c => c.classList.remove('selected'));
    chip.classList.add('selected');
    if (cmTypeInput) cmTypeInput.value = chip.dataset.value;
  });
});

// ─── Field validation ─────────────────────────────────
function validateField(field) {
  const valid  = field.checkValidity();
  const parent = field.closest('.cm-field');
  let errEl    = parent?.querySelector('.cm-field-error');

  field.classList.toggle('is-invalid', !valid);

  if (!valid) {
    if (!errEl) {
      errEl = document.createElement('span');
      errEl.className = 'cm-field-error';
      errEl.setAttribute('role', 'alert');
      parent?.appendChild(errEl);
    }
    errEl.textContent =
      field.validity.valueMissing  ? 'This field is required.' :
      field.validity.typeMismatch  ? 'Please enter a valid email address.' :
                                     'Please check this field.';
  } else {
    errEl?.remove();
  }

  return valid;
}

// Live validation — only fires after first blur
cmForm?.querySelectorAll('input[required], textarea[required]').forEach(field => {
  let touched = false;
  field.addEventListener('blur',  () => { touched = true; validateField(field); });
  field.addEventListener('input', () => { if (touched) validateField(field); });
});

// ─── State machine ────────────────────────────────────
// state: 'form' | 'loading' | 'success' | 'error'
function setModalState(state) {
  if (cmForm) cmForm.setAttribute('data-state', state);
  if (cmSubmit) cmSubmit.disabled = (state === 'loading');
}

// ─── Submit ───────────────────────────────────────────
cmForm?.addEventListener('submit', async e => {
  e.preventDefault();

  // Run validation on all required fields
  const required  = [...cmForm.querySelectorAll('input[required], textarea[required]')];
  const allValid  = required.map(validateField).every(Boolean);
  if (!allValid) {
    cmForm.querySelector('.is-invalid')?.focus();
    return;
  }

  setModalState('loading');

  const params = {
    name:         document.getElementById('cm-name')?.value.trim()    ?? '',
    email:        document.getElementById('cm-email')?.value.trim()   ?? '',
    project_type: cmTypeInput?.value                                   || 'Not specified',
    budget:       document.getElementById('cm-budget')?.value         || 'Not specified',
    message:      document.getElementById('cm-message')?.value.trim() ?? '',
  };

  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, params, EMAILJS_PUBLIC_KEY);
    setModalState('success');
    cmForm.reset();
    cmChips?.forEach(c => c.classList.remove('selected'));
  } catch (err) {
    console.error('[ContactModal] EmailJS send failed:', err);
    setModalState('error');
  }
});

// Retry button resets to form state
cmForm?.querySelector('.cm-retry')?.addEventListener('click', () => setModalState('form'));
