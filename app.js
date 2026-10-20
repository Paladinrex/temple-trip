(() => {
  'use strict';
  const event = window.TEMPLE_TRIP;
  if (!event) {
    document.documentElement.classList.remove('js');
    return;
  }

  // All reusable event values and image paths come from config.js.
  document.querySelectorAll('[data-text]').forEach(node => {
    const value = event[node.dataset.text];
    if (typeof value === 'string') node.textContent = value;
  });
  document.querySelectorAll('[data-photo]').forEach(node => {
    if (event.photos[node.dataset.photo]) node.src = event.photos[node.dataset.photo];
  });
  document.querySelectorAll('[data-reservation]').forEach(node => node.href = event.reservationUrl);
  // The public page talks only to a narrow server-side write endpoint, never to Notion directly.
  let confirmationEndpoint = '';
  if (event.confirmationEndpoint) {
    try {
      const endpoint = new URL(event.confirmationEndpoint);
      if (endpoint.protocol === 'https:') confirmationEndpoint = endpoint.href;
    } catch { /* Keep saving disabled until a valid secure endpoint is configured. */ }
  }
  const date = document.querySelector('[data-event-date]');
  date.textContent = event.shortDate;
  date.dateTime = event.startISO;
  document.title = `${event.title} · ${event.shortDate}`;

  const cover = document.getElementById('cover');
  const site = document.getElementById('site-content');
  const openButton = document.getElementById('open-envelope');
  const skipButton = document.getElementById('skip-cover');
  let opening = false;
  let coverTimer;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function revealInvitation(animate = true) {
    if (opening || cover.hidden) return;
    opening = true;
    cover.classList.add('is-opening');
    const delay = animate && !reduceMotion.matches ? 1250 : 0;
    coverTimer = window.setTimeout(() => {
      cover.classList.add('is-leaving');
      site.inert = false;
      document.body.classList.remove('cover-visible');
      document.getElementById('hero-title').focus({preventScroll:true});
      window.setTimeout(() => { cover.hidden = true; }, reduceMotion.matches ? 0 : 650);
    }, delay);
  }
  function showEnvelope() {
    window.clearTimeout(coverTimer);
    window.scrollTo({top:0,behavior:'instant'});
    opening = false;
    cover.hidden = false;
    cover.classList.remove('is-opening','is-leaving');
    site.inert = true;
    document.body.classList.add('cover-visible');
    openButton.focus({preventScroll:true});
  }
  openButton.addEventListener('click', () => revealInvitation());
  skipButton.addEventListener('click', () => revealInvitation(false));
  document.getElementById('replay-envelope').addEventListener('click', showEnvelope);
  cover.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); revealInvitation(false); }
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === skipButton) { e.preventDefault(); openButton.focus(); }
      else if (!e.shiftKey && document.activeElement === openButton) { e.preventDefault(); skipButton.focus(); }
    }
  });

  const dialog = document.getElementById('message-dialog');
  const form = document.getElementById('message-form');
  const preview = document.getElementById('message-preview-text');
  const nameInput = document.getElementById('sender-name');
  const apartment = document.getElementById('apartment');
  const people = document.getElementById('people');
  const seats = document.getElementById('seats');
  const extra = document.getElementById('extra');
  const fallback = document.getElementById('sms-fallback');
  const ordinance = document.getElementById('ordinance');
  const appointmentTime = document.getElementById('appointment-time');
  const submit = form.querySelector('[type="submit"]');
  const submitLabel = document.getElementById('message-submit-label');
  const submissionNote = document.getElementById('submission-note');
  const confirmationStatus = document.getElementById('confirmation-status');
  let saving = false;
  let saved = false;
  let currentAction = 'help';
  let sourceAction;
  const actions = {
    help: {title:'A little help, please.',description:'Need help reserving, finding family names, or printing them? Tell us what you need.'},
    confirm: {title:'You’ve saved your place.',description:'Let Ricardo know you have already booked your appointment on the official temple reservation site.'},
    request: {title:'Let’s get you there.',description:'Share your name, Cinnamon Tree apartment, and how many people need a ride. Ricardo will help coordinate.'},
    offer: {title:'Room for one more?',description:'Tell Ricardo how many passenger seats you can offer. Thank you for helping someone get there.'}
  };

  function readableTime(value) {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return '[appointment time]';
    const [hour, minute] = value.split(':').map(Number);
    return `${hour % 12 || 12}:${String(minute).padStart(2,'0')} ${hour >= 12 ? 'PM' : 'AM'}`;
  }

  function messageText(placeholders = false) {
    const name = nameInput.value.trim() || (placeholders ? '[your name]' : '____');
    const trip = `the ${event.title} at ${event.temple} on ${event.shortDate} at ${event.timeLabel}`;
    const introduction = `Hi ${event.contactName}, my name is ${name}.`;
    let text;
    if (currentAction === 'request') {
      text = `${introduction} I live in Cinnamon Tree apartment ${apartment.value.trim() || '[apartment number]'}. I need a ride for ${people.value || '[number of people]'} ${Number(people.value) === 1 ? 'person' : 'people'} for ${trip}.`;
    } else if (currentAction === 'offer') {
      text = `${introduction} I can offer a ride for ${trip}. I have ${seats.value || '[number of seats]'} available passenger ${Number(seats.value) === 1 ? 'seat' : 'seats'}.`;
    } else if (currentAction === 'confirm') {
      text = `${introduction} I have already reserved my ${ordinance.value || '[ordinance]'} appointment at ${event.temple} on ${event.shortDate} at ${readableTime(appointmentTime.value)} (${event.timeZone}).`;
    } else {
      text = `${introduction} I would like help with an appointment or family names for ${trip}.`;
    }
    return `${text}${extra.value.trim() ? `\n\n${extra.value.trim()}` : ''}`;
  }
  function smsUrl(text) {
    // iOS Messages uses &body; Android and other clients use ?body.
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    return `sms:${event.contactPhone}${ios ? '&' : '?'}body=${encodeURIComponent(text)}`;
  }
  function updatePreview() { preview.textContent = messageText(true); }
  document.querySelectorAll('[data-action]').forEach(link => {
    link.addEventListener('click', e => {
      if (typeof dialog.showModal !== 'function') {
        if (link.dataset.action === 'confirm') {
          document.querySelector('[data-confirmation-note]').textContent = 'Please use a current browser to open the confirmation window. Nothing has been saved.';
        }
        return;
      }
      e.preventDefault();
      sourceAction = link;
      currentAction = link.dataset.action;
      const action = actions[currentAction];
      form.reset();
      saved = false;
      nameInput.disabled = extra.disabled = false;
      document.getElementById('message-title').textContent = action.title;
      document.getElementById('dialog-description').textContent = action.description;
      const requesting = currentAction === 'request';
      const offering = currentAction === 'offer';
      const confirming = currentAction === 'confirm';
      document.getElementById('ride-fields').hidden = !requesting;
      document.getElementById('offer-fields').hidden = !offering;
      apartment.required = requesting;
      people.required = requesting;
      apartment.disabled = people.disabled = !requesting;
      seats.required = offering;
      seats.disabled = !offering;
      document.getElementById('confirmation-fields').hidden = !confirming;
      ordinance.required = appointmentTime.required = confirming;
      ordinance.disabled = appointmentTime.disabled = !confirming;
      document.getElementById('extra-label-text').textContent = 'Anything else? (optional)';
      extra.placeholder = 'Add a question or a little more detail';
      submit.disabled = confirming && !confirmationEndpoint;
      submitLabel.textContent = confirming ? (confirmationEndpoint ? 'Save my confirmation' : 'Saving not connected yet') : 'Continue to Messages';
      submissionNote.textContent = confirming
        ? (confirmationEndpoint ? 'This saves your message to Ricardo’s private trip list—not to Messages. It does not book or verify a temple appointment.' : 'Direct saving is not connected yet. Nothing will be sent or saved. Help and rides still use Messages.')
        : 'Your messaging app will open with this draft. You choose when to send it. Nothing is submitted or stored on this website.';
      confirmationStatus.hidden = true;
      confirmationStatus.textContent = '';
      fallback.hidden = true;
      document.getElementById('copy-status').textContent = '';
      updatePreview();
      dialog.showModal();
      nameInput.focus();
    });
  });
  form.addEventListener('input', updatePreview);
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (saving || saved) return;
    nameInput.setCustomValidity(nameInput.value.trim() ? '' : 'Please enter your name.');
    apartment.setCustomValidity(currentAction === 'request' && !apartment.value.trim() ? 'Please enter your apartment number.' : '');
    if (!form.reportValidity()) return;
    updatePreview();
    if (currentAction === 'confirm') {
      if (!confirmationEndpoint) return;
      saving = true;
      submit.disabled = true;
      nameInput.disabled = ordinance.disabled = appointmentTime.disabled = extra.disabled = true;
      submitLabel.textContent = 'Saving…';
      form.setAttribute('aria-busy','true');
      confirmationStatus.hidden = false;
      confirmationStatus.textContent = 'Saving your confirmation securely…';
      const payload = {name:nameInput.value.trim(), ordinance:ordinance.value, appointmentTime:appointmentTime.value, notes:extra.value.trim()};
      try {
        const response = await fetch(confirmationEndpoint, {
          method:'POST', mode:'cors', credentials:'omit', cache:'no-store',
          headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload),
          signal:AbortSignal.timeout(25000)
        });
        const result = await response.json();
        if (response.ok && result.status === 'saved' && typeof result.receiptId === 'string' && result.receiptId) {
          saved = true;
          submitLabel.textContent = 'Confirmation saved';
          confirmationStatus.textContent = 'Thank you. Your confirmation is saved in Ricardo’s private trip list. No text message was sent.';
        } else if (result.status === 'not_saved') {
          // An explicit server rejection means the confirmation was not accepted.
          submitLabel.textContent = 'Save my confirmation';
          submit.disabled = false;
          nameInput.disabled = ordinance.disabled = appointmentTime.disabled = extra.disabled = false;
          confirmationStatus.textContent = result.code === 'rate_limited' ? 'Too many requests right now. Your confirmation was not saved. Please wait a minute before trying again.' : result.code === 'unavailable' ? 'Saving is temporarily unavailable. Nothing was saved. Please try again later.' : 'Your confirmation was not saved. Please check your details and try again.';
        } else {
          throw new Error('Unverified save');
        }
      } catch {
        submitLabel.textContent = 'Save status unknown';
        confirmationStatus.textContent = 'We couldn’t verify whether your confirmation was saved. Please check with Ricardo before submitting again. No text message was sent.';
      } finally {
        saving = false;
        form.removeAttribute('aria-busy');
      }
      return;
    }
    fallback.hidden = false;
    // Only this explicit click/submit can open Messages; the website never sends an SMS.
    window.location.href = smsUrl(messageText());
  });
  nameInput.addEventListener('input', () => nameInput.setCustomValidity(''));
  apartment.addEventListener('input', () => apartment.setCustomValidity(''));
  function closeDialog() { if (!saving) dialog.close(); }
  dialog.addEventListener('cancel', e => { if (saving) e.preventDefault(); });
  document.getElementById('close-dialog').addEventListener('click',closeDialog);
  dialog.addEventListener('click',e => {
    const rect = dialog.getBoundingClientRect();
    if (e.target === dialog && (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom)) closeDialog();
  });
  dialog.addEventListener('close', () => sourceAction?.focus());
  document.getElementById('copy-message').addEventListener('click', async () => {
    const status = document.getElementById('copy-status');
    try {
      await navigator.clipboard.writeText(messageText());
      status.textContent = 'Copied. Paste it into a text to Ricardo.';
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(preview);
      selection.removeAllRanges();
      selection.addRange(range);
      status.textContent = 'Your message is selected. Use Copy, then paste it into your messaging app.';
    }
  });
  if (window.location.hash && window.location.hash !== '#main') {
    cover.hidden = true;
  } else {
    showEnvelope();
  }
})();
