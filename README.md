# Renewal intake form

Hosted intake form used as the closing live demo in the Hardy Club office hour on August 4, 2026. It is filled out on camera, and the submission appears as a new row in the `Leads` tab of the demo roster sheet a second or two later.

**Live:** https://renewalintake.netlify.app

Static HTML, no build step. Netlify publishes the repo root.

## Fields

| Field | Notes |
|---|---|
| Name | Required |
| Email | Required |
| Renewal or deadline date | Required. This is the field that matters on camera, since it feeds the same date comparison built earlier in the session. |

The date is written into the `Message` column as `Renewal or deadline date: YYYY-MM-DD (submitted from the intake form)`, which keeps the sheet on its four-column contract of `Timestamp | Name | Email | Message`.

## Backend

Posts to the Apps Script `doPost` web app deployed from the demo sheet. That code lives in the recap repo at `apps-script/Code.gs` and is deployed once for both sites.

Requests are sent as `text/plain` so the browser treats them as simple requests and skips the CORS preflight an Apps Script web app cannot answer. If the response cannot be read, the request is retried with `mode: 'no-cors'`, which still delivers the row.

Every submission also goes to Netlify Forms (`renewal-intake`) as a backstop, but the on-screen success state deliberately reports on the Apps Script result, because the demo promise is that the row lands in the sheet.

## Setup

Paste the Apps Script `/exec` URL into [`config.js`](config.js), commit, push. Netlify redeploys in about 30 seconds. For a dry run without committing, append `?endpoint=<url>` to the page URL.

## Related

- Recap page and the Apps Script source: `hardy-club-office-hour`
- Engagement notes: knowledge hub, `clients/hardy-club/README.md`
