/* Posts the new hire form to the Apps Script web app, which writes a row into
   the Employees tab of the roster. The hire date is never asked for. It is
   whatever the server says the submission date was, which is the point the
   success screen is built to make visible. */
(function () {
  'use strict';

  var form = document.getElementById('hire-form');
  var status = document.getElementById('form-status');
  var confirmed = document.getElementById('confirmed');
  var submit = form.querySelector('button[type="submit"]');
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'];

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
     preflight an Apps Script web app cannot answer. */
  function sendToAppsScript(payload) {
    var url = endpoint();
    if (!url) return Promise.reject(new Error('no endpoint configured'));

    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    }).then(function (res) { return res.json(); });
  }

  /** Formats yyyy-mm-dd from its parts, so no timezone can shift the day. */
  function longDate(value) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
    if (!m) return value || '';
    return MONTHS[Number(m[2]) - 1] + ' ' + Number(m[3]) + ', ' + m[1];
  }

  function monthDay(value) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
    if (!m) return value || '';
    return MONTHS[Number(m[2]) - 1] + ' ' + Number(m[3]);
  }

  function set(id, text) { document.getElementById(id).textContent = text; }

  document.getElementById('add-another').addEventListener('click', function () {
    form.reset();
    form.hidden = false;
    confirmed.hidden = true;
    submit.disabled = false;
    submit.textContent = 'Submit and join the team directory';
    status.textContent = '';
    status.className = 'status';
    form.elements.name.focus();
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    var payload = {
      type: 'onboarding',
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
      birthdate: form.elements.birthdate.value,
      snack: form.elements.snack.value.trim(),
      restaurant: form.elements.restaurant.value.trim(),
      funFact: form.elements.funFact.value.trim()
    };

    if (!payload.name || !payload.email || !payload.birthdate) {
      status.textContent = 'Name, email, and your birthday are all needed.';
      status.className = 'status is-error';
      return;
    }

    submit.disabled = true;
    submit.textContent = 'Adding you to the directory';
    status.textContent = '';
    status.className = 'status';

    sendToNetlify(payload).catch(function () { /* backstop only, never fatal */ });

    sendToAppsScript(payload)
      .then(function (result) {
        if (!result || result.ok === false) {
          throw new Error((result && result.error) || 'rejected');
        }

        // The hire date comes back from the server, not the browser, because
        // the whole point is that the system decided it.
        var hire = result.hireDate || '';
        set('r-name', payload.name);
        set('r-email', payload.email);
        set('r-birthday', monthDay(payload.birthdate));
        set('r-hire', longDate(hire));
        set('r-snack', payload.snack);
        set('r-restaurant', payload.restaurant);
        set('r-fact', payload.funFact);

        document.getElementById('next-up-copy').textContent =
          'Nobody typed any of this into a spreadsheet. Your start date was recorded as '
          + longDate(hire) + ' because that is when you pressed the button, and your '
          + 'birthday reminder is now set for ' + monthDay(payload.birthdate)
          + '. Next year, on both of those dates, the team hears about it without '
          + 'anyone remembering to check.';

        form.hidden = true;
        confirmed.hidden = false;
        confirmed.focus();
      })
      .catch(function () {
        submit.disabled = false;
        submit.textContent = 'Submit and join the team directory';
        status.textContent =
          'That did not reach the directory. Your answers were saved, and People '
          + 'Operations can add you by hand.';
        status.className = 'status is-error';
      });
  });
})();
