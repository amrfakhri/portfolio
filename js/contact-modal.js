/* ══════════════════════════════════════════════════════
   CONTACT MODAL
   Dependencies: GSAP (already loaded), EmailJS SDK
══════════════════════════════════════════════════════ */

(function() {
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'css/contact-modal.css';
  document.head.appendChild(link);
})();

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
const cmOverlay      = document.getElementById('contact-modal');
const cmPanel        = cmOverlay?.querySelector('.cm-panel');
const cmClose        = cmOverlay?.querySelector('.cm-close');
const cmForm         = document.getElementById('cm-form');
const cmSubmit       = cmForm?.querySelector('.cm-submit');
const cmChips        = cmOverlay?.querySelectorAll('.cm-chip');
const cmTypeInput    = document.getElementById('cm-type');
const cmTabsEl       = cmPanel?.querySelector('.cm-tabs');
const cmTabBtns      = cmOverlay?.querySelectorAll('[role="tab"]');
const cmTabIndicator = cmPanel?.querySelector('.cm-tab-indicator');
let   cmActiveTab    = 'project';

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

  // Reset to Project tab (instant — modal isn't visible yet)
  resetToProjectTab();

  // Panel slide up
  gsap.to(cmPanel, {
    y: 0, opacity: 1, scale: 1,
    duration: 0.5, ease: 'expo.out', delay: 0.06,
    onComplete() { cmClose?.focus(); },
  });

  // Stagger tab switcher + form rows/fields progressively
  const formEls = [
    ...(cmTabsEl ? [cmTabsEl] : []),
    ...(cmForm ? [...cmForm.querySelectorAll(':scope > .cm-row, :scope > .cm-field, :scope > .cm-actions')] : []),
  ];

  if (formEls.length) {
    gsap.fromTo(
      formEls,
      { opacity: 0, y: 9 },
      {
        opacity: 1, y: 0, duration: 0.35, stagger: 0.048, ease: 'power2.out', delay: 0.22,
        onComplete() {
          // Position indicator after all elements reach their final layout position
          positionIndicator(cmPanel?.querySelector('.cm-tab.is-active'));
        },
      }
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

// ─── Tab: indicator ───────────────────────────────────
function positionIndicator(btn) {
  if (!cmTabIndicator || !btn || !cmTabsEl) return;
  const tabsRect = cmTabsEl.getBoundingClientRect();
  const btnRect  = btn.getBoundingClientRect();
  gsap.set(cmTabIndicator, { left: btnRect.left - tabsRect.left, width: btnRect.width });
}

function animateIndicator(btn) {
  if (!cmTabIndicator || !btn || !cmTabsEl) return;
  const tabsRect = cmTabsEl.getBoundingClientRect();
  const btnRect  = btn.getBoundingClientRect();
  gsap.to(cmTabIndicator, {
    left: btnRect.left - tabsRect.left,
    width: btnRect.width,
    duration: 0.35,
    ease: 'power2.inOut',
  });
}

// ─── Tab: reset to Project (no animation) ─────────────
function resetToProjectTab() {
  if (cmActiveTab === 'project') return;
  const meetingPanel = cmOverlay?.querySelector('#cm-panel-meeting');
  const projectPanel = cmOverlay?.querySelector('#cm-panel-project');
  const meetingBtn   = cmOverlay?.querySelector('#cm-tab-meeting');
  const projectBtn   = cmOverlay?.querySelector('#cm-tab-project');
  if (meetingPanel) meetingPanel.hidden = true;
  if (projectPanel) projectPanel.hidden = false;
  meetingBtn?.setAttribute('aria-selected', 'false');
  meetingBtn?.setAttribute('tabindex', '-1');
  meetingBtn?.classList.remove('is-active');
  projectBtn?.setAttribute('aria-selected', 'true');
  projectBtn?.removeAttribute('tabindex');
  projectBtn?.classList.add('is-active');
  cmActiveTab = 'project';
}

// ─── Tab: switch with GSAP animation ──────────────────
function switchTab(tabId) {
  if (cmActiveTab === tabId) return;
  const prevPanel = cmOverlay?.querySelector(`#cm-panel-${cmActiveTab}`);
  const nextPanel = cmOverlay?.querySelector(`#cm-panel-${tabId}`);
  const prevBtn   = cmOverlay?.querySelector(`#cm-tab-${cmActiveTab}`);
  const nextBtn   = cmOverlay?.querySelector(`#cm-tab-${tabId}`);
  if (!prevPanel || !nextPanel || !prevBtn || !nextBtn) return;

  prevBtn.setAttribute('aria-selected', 'false');
  prevBtn.setAttribute('tabindex', '-1');
  prevBtn.classList.remove('is-active');
  nextBtn.setAttribute('aria-selected', 'true');
  nextBtn.removeAttribute('tabindex');
  nextBtn.classList.add('is-active');

  animateIndicator(nextBtn);

  const dir = tabId === 'meeting' ? 1 : -1;

  gsap.to(prevPanel, {
    opacity: 0, y: -6 * dir,
    duration: 0.18, ease: 'power2.in',
    onComplete() {
      prevPanel.hidden = true;
      gsap.set(prevPanel, { opacity: 1, y: 0 });   // reset for next switch
      nextPanel.hidden = false;
      gsap.fromTo(nextPanel,
        { opacity: 0, y: 8 * dir },
        { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out' }
      );
    },
  });

  cmActiveTab = tabId;
}

// ─── Tab: click events ────────────────────────────────
cmTabBtns?.forEach(btn => {
  btn.addEventListener('click', () => {
    const tabId = btn.id.replace('cm-tab-', '');
    switchTab(tabId);
    btn.focus();
  });
});

// ─── Tab: arrow-key navigation (ARIA authoring pattern)
cmTabsEl?.addEventListener('keydown', e => {
  const tabs = [...(cmTabBtns ?? [])];
  const idx  = tabs.indexOf(document.activeElement);
  if (idx === -1) return;

  let next = -1;
  if (e.key === 'ArrowRight') { e.preventDefault(); next = (idx + 1) % tabs.length; }
  if (e.key === 'ArrowLeft')  { e.preventDefault(); next = (idx - 1 + tabs.length) % tabs.length; }
  if (e.key === 'Home')       { e.preventDefault(); next = 0; }
  if (e.key === 'End')        { e.preventDefault(); next = tabs.length - 1; }

  if (next !== -1) {
    tabs[next].focus();
    switchTab(tabs[next].id.replace('cm-tab-', ''));
  }
});

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

// ─── Chip selection (multi-select) ───────────────────
cmChips?.forEach(chip => {
  chip.addEventListener('click', () => {
    chip.classList.toggle('selected');
    // Sync hidden input with all currently selected values
    const selected = [...cmChips]
      .filter(c => c.classList.contains('selected'))
      .map(c => c.dataset.value);
    if (cmTypeInput) cmTypeInput.value = selected.join(', ');
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
    if (cmTypeInput) cmTypeInput.value = '';
  } catch (err) {
    console.error('[ContactModal] EmailJS send failed:', err);
    setModalState('error');
  }
});

// Retry button resets to form state
cmForm?.querySelector('.cm-retry')?.addEventListener('click', () => setModalState('form'));
