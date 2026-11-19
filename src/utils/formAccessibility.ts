/**
 * Modern Web Guidance utilities:
 * 1. Light-dismiss fallback for <dialog closedby="any"> when closedBy is unsupported (e.g. Safari).
 * 2. Sync aria-invalid and aria-describedby with native :user-invalid for screen readers.
 */

export function attachDialogLightDismissFallback(dialog: HTMLDialogElement | null): () => void {
  if (!dialog || 'closedBy' in HTMLDialogElement.prototype) {
    return () => {};
  }

  const isOutside = (e: PointerEvent) => {
    const rect = dialog.getBoundingClientRect();
    return (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    );
  };

  let pressedOutside = false;
  const onPointerDown = (e: PointerEvent) => {
    pressedOutside = isOutside(e);
  };
  const onPointerUp = (e: PointerEvent) => {
    if (pressedOutside && isOutside(e)) {
      dialog.close();
    }
    pressedOutside = false;
  };

  dialog.addEventListener('pointerdown', onPointerDown);
  dialog.addEventListener('pointerup', onPointerUp);

  return () => {
    dialog.removeEventListener('pointerdown', onPointerDown);
    dialog.removeEventListener('pointerup', onPointerUp);
  };
}

let announcerEl: HTMLDivElement | null = null;
let announceTimer: ReturnType<typeof setTimeout> | undefined;

function getAnnouncer(): HTMLDivElement {
  if (!announcerEl) {
    announcerEl = document.createElement('div');
    announcerEl.setAttribute('aria-live', 'polite');
    announcerEl.className = 'visually-hidden';
    document.body.appendChild(announcerEl);
  }
  return announcerEl;
}

function linkError(el: HTMLElement, shown: boolean) {
  const errorId = el.dataset.error;
  if (!errorId) return;
  const ids = (el.getAttribute('aria-describedby') || '')
    .split(/\s+/)
    .filter((id) => id && id !== errorId);
  if (shown) ids.push(errorId);
  if (ids.length) {
    el.setAttribute('aria-describedby', ids.join(' '));
  } else {
    el.removeAttribute('aria-describedby');
  }
}

export function attachFormValidationSync(form: HTMLFormElement | null): () => void {
  if (!form) return () => {};

  const flagged = new WeakSet<Element>();
  const announced = new WeakSet<Element>();
  const supportsUserInvalid =
    typeof CSS !== 'undefined' && CSS.supports?.('selector(:user-invalid)');

  const syncControl = (target: EventTarget | null, announce = false) => {
    if (
      !(
        target instanceof HTMLInputElement ||
        target instanceof HTMLSelectElement ||
        target instanceof HTMLTextAreaElement
      )
    ) {
      return;
    }

    const isInvalid = supportsUserInvalid
      ? target.matches(':user-invalid')
      : !target.validity.valid && flagged.has(target);

    if (isInvalid) {
      target.setAttribute('aria-invalid', 'true');
      if (!supportsUserInvalid) target.classList.add('user-invalid-fallback');
      linkError(target, true);
      flagged.add(target);

      if (announce && !announced.has(target) && target.dataset.error) {
        const errorNode = document.getElementById(target.dataset.error);
        if (errorNode) {
          const announcer = getAnnouncer();
          clearTimeout(announceTimer);
          announcer.textContent = '';
          announceTimer = setTimeout(() => {
            announcer.textContent = errorNode.textContent?.trim() || '';
          }, 350);
          announced.add(target);
        }
      }
    } else {
      target.setAttribute('aria-invalid', 'false');
      if (!supportsUserInvalid) target.classList.remove('user-invalid-fallback');
      linkError(target, false);
      flagged.delete(target);
      announced.delete(target);
    }
  };

  // Start every field at aria-invalid="false"
  form.querySelectorAll('input, select, textarea').forEach((el) => {
    el.setAttribute('aria-invalid', 'false');
  });

  const onBlur = (e: FocusEvent) => {
    if (!supportsUserInvalid && e.target instanceof Element) {
      flagged.add(e.target);
    }
    syncControl(e.target, true);
  };
  const onInput = (e: Event) => syncControl(e.target, false);
  const onChange = (e: Event) => {
    if (!supportsUserInvalid && e.target instanceof Element) {
      flagged.add(e.target);
    }
    syncControl(e.target, true);
  };
  const onInvalid = (e: Event) => {
    if (e.target instanceof Element) {
      flagged.add(e.target);
      announced.add(e.target);
    }
    syncControl(e.target, false);
  };

  form.addEventListener('blur', onBlur, true);
  form.addEventListener('input', onInput);
  form.addEventListener('change', onChange, true);
  form.addEventListener('invalid', onInvalid, true);

  return () => {
    form.removeEventListener('blur', onBlur, true);
    form.removeEventListener('input', onInput);
    form.removeEventListener('change', onChange, true);
    form.removeEventListener('invalid', onInvalid, true);
  };
}
