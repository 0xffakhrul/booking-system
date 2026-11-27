---
version: 1
slug: "src-features-auth-registerpage-tsx"
primary_target: "src/features/auth/RegisterPage.tsx"
related_targets: ["src/features/auth/LoginPage.tsx"]
---

# Login and register (`/login`, `/register`)

Mode: Operate (with a first-impression job: reviewers land here right after the booking page). Owner signs up a shop or logs in. No API changes.

Approved structure: decision sketch `web/.impeccable/mocks/decision/auth-split.html` (dealt structure, user locked it) with the steer "the preview can be more fancy". Inspiration the user asked for: Cal.com's split auth pages. System: `web/DESIGN.md`.

## Direction contract

THESIS: Show the product while asking for the account: the form on one side, the two halves of Tempah meeting on the other (a customer's booking page and the owner's schedule). Refuses the lone centred card and refuses testimonials or invented proof.

OWN-WORLD: DESIGN.md plus one auth-only token (Phone lift): white form half, a pale blue (#eef4ff, hairline #c9daff) preview half, the one blue for the primary action, Onest, 6px controls, 8px panels, menu-lift for the schedule card and a deeper blue-tinted phone lift for the phone card (recorded in DESIGN.md, auth preview only). Preview content is the real component language (status card, timeline blocks, service tile) at small scale, labelled "Sample".

STORY: The owner reads one line of what they get, fills four fields (or two to log in), and sees their own shop name and booking link appear on the phone preview as they type; a sample online booking fills its slot on the schedule once.

FIRST VIEWPORT: Desktop ≥1024: two equal halves. Left: Tempah mark top-left, a 380px form column vertically centred (24px heading on the DESIGN.md ramp, one help line, fields, blue full-width button, switch link). Right: a one-line 17px headline in ink, a schedule card (Menu lift) with the red now line, and a phone booking card in front of its lower-right corner on a deeper blue-tinted lift, covering only empty rows; one muted caption line. Phone: the form alone, top-aligned; the preview is dropped.

FORM: Structure "Split with preview" (surface round, dealt; my list position 4), raised by the user's steer. Signature move: the register preview's phone card mirrors the typed shop name, monogram and link live; on load the phone's Book button is pressed once and the matching empty dashed slot on the schedule fills (clip-path, ease-out, once; reduced motion: shown filled). seed:121c1093eb41e5d9

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
