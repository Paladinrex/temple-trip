# Temple Trip

An editable, mobile-friendly invitation to the Provo City Center Temple on Saturday, October 24, 2026, at 8:00 PM Mountain Time.

Live invitation: https://paladinrex.github.io/temple-trip/

## Edit the invitation

- `config.js`: event details, official reservation link, SMS contact and public confirmation endpoint.
- `index.html`: invitation copy and page structure.
- `styles.css`: colors, typography, borders, responsive layouts, and envelope animation.
- `app.js`: envelope interactions, in-page confirmation and SMS drafts.
- `assets/`: the two displayed photos and editable SVG decorations.

No installation or build step is required. Open `index.html` locally or serve this directory with a static server.

## Publish

In Settings → Pages, choose **Deploy from a branch**, then **main** and **/ (root)**. Save. Once enabled, subsequent changes to `main` will update the invitation.

## Reservations and messages

Appointments are booked on the official Church reservation website. Availability is not tracked by this invitation. Help and ride buttons open message drafts for Ricardo; each guest reviews and sends the message in their own messaging app. Nothing sends automatically.

“I’ve already reserved” opens a dialog inside the invitation. Guests choose Baptisms, Initiatories, Endowment or Sealing, enter their booked appointment time, and review their message. Only pressing “Save my confirmation” sends these details to Ricardo’s private trip list through the server-side bridge. It does not open Notion Forms or send a text message. Success appears only after the server confirms creation of a Notion page. Ambiguous failures are not retried automatically; check with Ricardo before resubmitting.

The public HTTPS endpoint in `config.js` is not a secret. The Notion token and private destination remain exclusively in Vercel’s protected production settings. Never add credentials, environment files or private response exports to this repository. Keep the underlying Notion database private.

Ride requests and ride offers continue to use SMS. Neither opening a draft nor opening a dialog means that a ride has been arranged or a confirmation has been saved.

## Verification

The server was deployed and its preflight, invalid-input and origin checks were verified without creating records. Eight local backend tests passed using a simulated Notion provider. At the organizer’s request, no real or fictitious Notion confirmation was submitted, so the complete successful write flow remains unverified until the first legitimate confirmation.

The small public endpoint has strict input limits, automatic platform DDoS mitigation and basic per-instance request limits. These are not a guarantee against spam or duplicate submissions. Review stronger distributed controls before expanding the site beyond this event.
