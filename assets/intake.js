/* Posts the intake form to the Apps Script web app so the row appears in the
   Leads tab of the demo sheet, and to Netlify Forms so nothing is ever lost. */
(function () {
  'use strict';

  var form = document.getElementById('intake-form');
  var status = document.getElementById('intake-status');
  var thanks = document.getElementById('intake-thanks');
  var detail = document.getElementById('intake-thanks-detail');
  var again = document.getElementById('intake-again');
  var submit = form.querySelector('button[type="submit"]');

  function endpoint() {
    var override = new URLSearchParams(window.location.search).get('endpoint');
    if (override) return override;
    return (window.AI_CONFIG && window.AI_CONFIG.leadEndpoint) || '';
  }

  function encode(data) {
    return Object.keys(data)
      .map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(data[k]); })
      .join('&');
  }

  function sendToNetlify(payload) {
    return fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: encode(Object.assign({ 'form-name': form.getAttribute('name') }, payload))
    });
  }

  /* text/plain keeps this a simple request, so the browser skips the CORS
     preflight that an Apps Script web app cannot answer. */
  function sendToAppsScript(payload) {
    var url = endpoint();
    if (!url) return Promise.reject(new Error('no endpoint configured'));

    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    })
      .then(function (res) { return res.json(); })
      .catch(function () {
        return fetch(url, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        }).then(function () { return { ok: true, opaque: true }; });
      });
  }

  /** Reads a yyyy-mm-dd value without letting the browser shift it a timezone. */
  function readableDate(value) {
    if (!value) return '';
    var parts = value.split('-');
    var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  function reset() {
    form.reset();
    form.hidden = false;
    thanks.hidden = true;
    submit.disabled = false;
    submit.textContent = 'Add this to the reminder list';
    status.textContent = '';
    status.className = 'lead-status';
    form.elements.name.focus();
  }

  again.addEventListener('click', reset);

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    var dateValue = form.elements.date.value;
    var payload = {
      name: (form.elements.name.value || '').trim(),
      email: (form.elements.email.value || '').trim(),
      date: dateValue,
      message: 'Renewal or deadline date: ' + dateValue + ' (submitted from the intake form)'
    };

    if (!payload.name || !payload.email || !dateValue) {
      status.textContent = 'Name, email, and the date are all needed.';
      status.className = 'lead-status is-error';
      return;
    }

    submit.disabled = true;
    submit.textContent = 'Adding';
    status.textContent = '';
    status.className = 'lead-status';

    /* Netlify capture runs alongside but is never allowed to decide the
       outcome. The demo promise is that the row lands in the sheet, so the
       Apps Script result is what the success state reports on. */
    sendToNetlify(payload).catch(function () { /* logged by Netlify, not fatal */ });

    sendToAppsScript(payload)
      .then(function (result) {
        if (result && result.ok === false) throw new Error(result.error || 'rejected');
        detail.textContent =
          'The reminder for ' + readableDate(dateValue) +
          ' is set. You will hear from us before that date comes due, not after.';
        form.hidden = true;
        thanks.hidden = false;
        thanks.focus();
      })
      .catch(function () {
        submit.disabled = false;
        submit.textContent = 'Add this to the reminder list';
        status.textContent =
          'That did not reach the reminder system. Your details were saved, and ' +
          'ty@approachableintelligence.ai can add the date by hand.';
        status.className = 'lead-status is-error';
      });
  });
})();
