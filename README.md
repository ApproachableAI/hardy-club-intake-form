# New hire welcome form

Hosted onboarding intake form used as the closing live demo in the Hardy Club office hour on August 4, 2026. It is filled out on camera as if a new employee were completing it before their first day, and the submission appears as a new row in the `Employees` tab of the demo roster a second or two later.

**Live:** https://renewalintake.netlify.app

Static HTML, no build step. Netlify publishes the repo root.

## Why it looks different from the recap page

This page uses the **forest green and cream document palette in Lato** from the brand style master, not the cream and rust marketing system on the recap page. That is deliberate. The audience should read it as an internal HR document that a company hands a new hire, not as another marketing page, so the demo lands as something they could recognise inside their own business.

## Fields

| Field | Notes |
|---|---|
| Full name | Required |
| Work email | Required |
| Your birthday | Required. Real date input. The hint says only month and day matter. |
| Favorite candy or snack | Required |
| Favorite restaurant | Required |
| One fun fact about you | Required |

**No hire date is asked for.** That is the point of the demo. The server records the submission date as the hire date, and the success screen labels it `Hire date (automatic)` so the audience sees the system supplying a field nobody typed.

## What it writes

A row appended to the `Employees` tab:

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| Name | Email | Birthdate | Hire Date | Favorite Snack | Favorite Restaurant | Fun Fact |

Columns C and D are written as real date cells, so the reminder scripts built earlier in the session pick the new person up immediately. Columns E to G are created automatically the first time they are needed, and `verifyDemoSheet` in the recap repo adds them during setup.

The birthday is parsed from its parts rather than passed to `new Date()`, because parsing `1991-06-02` as a string yields UTC midnight and lands on the previous day for anyone west of Greenwich, which would silently shift birthdays by one.

## Backend

Posts to the Apps Script `doPost` web app deployed from the demo sheet. That code lives in the recap repo at `apps-script/Code.gs` and is deployed once for both sites. Submissions carry `type: "onboarding"`, which is what routes them to the roster instead of the `Leads` tab.

Requests are sent as `text/plain` so the browser treats them as simple requests and skips the CORS preflight an Apps Script web app cannot answer.

Every submission also goes to Netlify Forms (`new-hire-welcome`) as a backstop, but the on-screen success state reports on the Apps Script result, because the demo promise is that the row lands in the roster.

## Setup

Paste the Apps Script `/exec` URL into [`config.js`](config.js), commit, push. Netlify redeploys in about 30 seconds. For a dry run without committing, append `?endpoint=<url>` to the page URL.

## Running the demo

Fill it in as a fictional new hire. Then switch to the `Employees` tab and show the row that just appeared, with the hire date matching today and the reminder scripts now covering a person who did not exist a minute ago.

To reset between takes, delete the added rows. The `RESET COPY` tab restores the original ten.

## Related

- Recap page and the Apps Script source: [`hardy-club-office-hour`](https://github.com/ApproachableAI/hardy-club-office-hour)
- Engagement notes: knowledge hub, `clients/hardy-club/README.md`
