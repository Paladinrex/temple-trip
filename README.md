# Temple Trip

An editable, mobile-friendly invitation to the Provo City Center Temple on Saturday, October 24, 2026, at 8:00 PM Mountain Time.

Live invitation: https://paladinrex.github.io/temple-trip/

## Edit the invitation

- `config.js`: event details, reservation link, contact number, and optional public Notion Form URL.
- `index.html`: invitation copy and page structure.
- `styles.css`: colors, typography, borders, responsive layouts, and envelope animation.
- `app.js`: envelope interactions and SMS drafts.
- `assets/`: the two displayed photos and editable SVG decorations.

No installation or build step is required. Open `index.html` locally or serve this directory with a static server.

## Publish

In Settings → Pages, choose **Deploy from a branch**, then **main** and **/ (root)**. Save. Once enabled, subsequent changes to `main` will update the invitation.

## Reservations and messages

Appointments are booked on the official Church reservation website. Availability is not tracked by this invitation. Help and ride buttons open message drafts for Ricardo; each guest reviews and sends the message in their own messaging app. Nothing sends automatically.

The “I’ve already reserved” button opens a public Notion Form that saves responses in the organizer’s private list. Help and ride coordination remain SMS drafts. To change the form, update `confirmationFormUrl` in `config.js` with a public **form** URL. Keep the underlying guest database private. Do not place API tokens or private database links in these public files.

Ride requests and ride offers continue to use SMS. Neither opening a draft nor opening a form means that a ride has been arranged or a response has been submitted.
