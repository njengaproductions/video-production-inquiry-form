# Changelog

Version notes for the NJENGA Productions project brief site. Newest first.

Versioning: **minor** (0.x.0) for new features or pages, **patch** (0.x.y) for fixes, tweaks, and config changes.

---

## 0.25.6 — 2026-10-17

### Mobile
- Brief inputs and textareas use 16px text so iOS Safari no longer zooms on focus.
- Brief form: 2-column grid stacks on phones, step labels raised to 11px, Back/Next/Submit buttons taller (py-3).
- Splash nav pills (Voices, Admin) meet the 44px minimum tap target.

### Admin
- Fixed invisible Trash filter pill (now uses light surface tokens); all filter pills are taller.
- Brief detail: larger stage toggle tap area, taller date inputs (16px text) and Set buttons, bigger "Visible to client" checkbox, and a taller Save note button.
- Admin header and nav wrap on narrow screens; nav links and Sign out have tap padding.

## 0.25.5 — 2026-10-17

### Admin
- "Share Tracker" button now always shows brand styling (brand border, tint, and text), not only on hover.
- Tracker stage date inputs force `colorScheme: "light"` inline so the native calendar icon renders black.

## 0.25.4 — 2026-10-17

### Admin
- The tracker stage date picker opens in dark colours again, matching the admin theme.

---

## 0.25.3 — 2026-10-17

### Admin
- Restyled the tracker stage list on the brief detail page: each stage is now its own rounded card (tinted when done), with round checkboxes, a "Note" / "Client note" badge when a stage has a note, and tighter date and note controls.

---

## 0.25.2 — 2026-10-17

### Admin
- Brief detail page falls back to the email in the submitted form when `client_email` is empty — fixes "No client email on file" showing for briefs that do have an email. Applies to the Reply button, contact link, and "Share this ID with the client".

---

## 0.25.1 — 2026-10-17

### Admin
- "Share this ID with the client" now shows "Sending…", then a green "Tracker ID sent to …" confirmation or a red error message (e.g. email failed, no tracker ID).

### Brief form
- "Send to My Email" on the thank-you screen now shows an error message with a "Try Again" option if the email fails.
- "Copy ID to Clipboard" briefly changes to "Copied!" after copying.

---

## 0.25.0 — 2026-10-17

### Brief form
- The thank-you screen now shows the client's 6-digit Project Tracker ID, with "Copy ID to Clipboard" and "Send to My Email" buttons.

### Email
- New tracker email that sends the client their Project ID and a link to njengapro.co/track.

### Admin
- The Project Tracker card on each brief has a "Share this ID with the client" button that emails the ID to the client.

---

## 0.24.1 — 2026-10-17

### Brief form
- The late-delivery fee hint now shows only on the delivery deadline field, not on the project/event date.

### Admin
- Each tracker stage on the brief page can now have a date and a note (up to 280 characters), with a "Visible to client" switch for the note.

---

## 0.24.0 — 2026-10-17

### Brief form
- `DateField` upgraded: past dates are disabled, today is ringed, arrow keys move between days (Enter/Space selects, Escape closes), and the trigger shows the date written out (e.g. "October 17, 2026") with a calendar icon.
- New `showFeeHint` option, now on both Project / Event Date and delivery deadline: under 7 days away shows a rush-fee notice, under 14 days shows a tight-timeline notice.

### Admin
- The Project Tracker card now lists each stage with a checkbox. Clicking it marks the stage done or not done and saves straight away (`toggleTrackerStage` in `app/admin/actions.ts`, admin-only).

## 0.23.0 — 2026-10-17

### Brief form
- New calendar date picker (`DateField`) replaces the typed "MM / DD / YYYY" inputs for Project / Event Date and delivery deadline. Dates are still stored as `MM/DD/YYYY`.

### Project Tracker
- New admin-only `POST /api/admin/backfill-trackers` gives existing briefs without a Project ID an ID and their tier's default stages. Returns `{ backfilled: n }`.

## 0.22.0 — 2026-10-17

### Project Tracker
- New public `/track` page: clients enter their 6-digit Project ID and see progress, stages (done, in progress, pending) and dates. No login.
- New `GET /api/tracker/[code]` endpoint. Returns only name, tier and stages (no contact details), and counts views.
- New briefs automatically get a unique 6-digit tracker ID and default stages based on their tier (Edit Only, Shoot Only, Wedding, Full Production).
- Database: added `tracker_id`, `tracker_stages`, `tracker_access_count`, `tracker_last_viewed` to `briefs`.

### Admin
- Brief detail page: new "Project Tracker" card with the ID, stage pips, view count and last viewed date.
- Header: added a "Tracker" link.

### Brief
- Splash: added a "Track your project →" link under the main button.

### Email
- Brief and Voices emails now send from `NJENGA Productions Co. <hello@njengapro.co>`.

## 0.21.3 — 2026-10-10

### Voices
- Chip burst on phones (stage width under 520px): narrower horizontal and taller vertical spread so word chips no longer clip, and the avatar ring is pulled in to 58% so it clears the word chips. Thread lines and the quote card follow the new avatar positions.
- Avatar buttons now have a 44px tap target. On phones the visible circle shrinks to 36px through a nested `avatar-btn-inner` element, so the hit area stays at 44px.

## 0.21.2 — 2026-10-10

### Voices
- Chip burst quote card now opens just above the tapped avatar and follows it while you scroll, clamped so it never spills off the stage. It no longer sits fixed at stage center, where it covered the avatar on mobile.
- The hover/focus name strip only shows once the burst is past 0.22, so it no longer competes with the fading "What our clients say" intro.

## 0.21.1 — 2026-10-10

### Voices
- Chip burst avatars: removed the always-on name/company labels. Hovering (or keyboard-focusing) an avatar now shows the name and company in a single centered strip at the bottom of the stage, fading in and out.
- Avatars scale up slightly on hover; tapping still opens the quote card.

---

## 0.21.0 — 2026-10-10

### Voices
- Chip burst v2: one chip per unique word, sized (and glowing) by how many voices chose it; single-owner chips take that voice's color, shared chips go warm neutral.
- Each voice gets its own color; threads run from each avatar to each of its words in that color.
- Word ring is randomly rotated on load (spread-fix order keeps popular words ~60° apart); avatars get slight jitter plus angular collision separation.
- Avatars are tappable buttons with name/company labels and open a quote card (quote + up to 6 words); tap outside or × to close.
- Added a "What our clients say." intro that fades into the "In their words." headline, plus a color/size legend.

## 0.20.4 — 2026-10-09

### Voices
- Chip-burst avatars are capped at 0.8× their nearest chip's reach so they stay inside their chip cluster.
- Faint thread lines now connect each avatar to its chips, measured from the sticky frame via ResizeObserver.

## 0.20.3 — 2026-10-09

### Voices
- Chip-burst avatars now sit farther out (0.85× their chips' average reach, up from 0.6×).
- Burst logos respect each voice's admin logo display settings (fit, scale, offset) again.
- Pinned quote attribution shows the voice's logo (32px circle, using its display settings) beside the name.

## 0.20.2 — 2026-10-09

### Voices — chip burst
- Replaced `ChipBurst` with the angle-based avatar layout: avatars sit at 0.6× their chips' average reach, collisions push avatar angles apart (instead of radii), and avatars share the chips' exact transform system.
- Chips use a uniform solid border; the `<ul>` is now `overflow-visible`.
- Burst logos render as 36px `object-cover` circles with a soft orange ring.

## 0.20.1 — 2026-10-09

### Voices
- Chip-burst avatars now travel outward with the burst (distance = reach × burst, same `calc(... * min(42vw, 420px))` coordinate system as the chips) and fade in with it instead of popping in late.
- Avatar placement uses a 62% ring with 6-pass collision separation (58px minimum, reach clamped 0.22–0.70); avatars sit above chips (z-index 15) and ignore pointer events.
- Logo avatars get a dark fill, `white/20` border and a soft primary halo; initials avatars use the primary tint. Admin logo display settings still apply.

## 0.20.0 — 2026-10-09

### Voices
- Chip-burst avatars now sit at the angular mean of each voice's chosen chips, scaled by their average reach, so they spread around the ring instead of clustering in one corner.
- Overlapping avatars get pushed apart (4 passes, 56px minimum distance).
- The chip-burst sticky stage now uses `overflow-visible` so avatars near the edge no longer get clipped.
- Logos in the burst and on testimonial cards now use each voice's saved fit, scale, and offset.

### Admin
- New "Logo display" panel on review cards for voices with a logo: fit (contain / cover / fill), scale (50–200%), X/Y offset nudges, a live circular preview, Reset, and Save.
- Replacing a logo clears its saved adjustments.

### Database
- Added `logo_fit`, `logo_scale`, and `logo_position` columns to `voices` (created automatically by `ensureSchema`).

## 0.19.0 — 2026-10-09

### Voices
- "In their words" chip burst now shows each approved voice's logo (or initials) positioned at the centroid of the words they picked, fading in at the peak of the burst.
- Chips chosen by more than one voice get a dashed border to mark shared words.
- Testimonial card logos switched to `object-contain` (still no border, white background, or padding).

## 0.18.5 — 2026-10-09

### Voices
- Testimonial card logos now fill their circle (`object-cover`) with no white background, padding, or border, so they sit cleanly on the dark card.

## 0.18.4 — 2026-10-09

### Voices
- Avatar initials now skip connector words ("and", "or", "&", "the", "a") and use first + last name word, so "Chris and Jenna Kelley" shows `CK` instead of `CA`. Single-word names use their first two letters.

## 0.18.3 — 2026-10-09

### Voices
- Form photo strip now picks 6 random photos from the marquee set on each load (`shuffle(MARQUEE_IMAGES).slice(0, 6)`) instead of always the first 6.

## 0.18.2 — 2026-10-09

### Voices
- Testimonial card typography switched to Fraunces (300, optical sizing, line-height 1.72, -0.01em) for quotes and DM Sans for attribution name (300, 0.18em, uppercase, 10.5px), role/company (200, 0.05em, 9.5px), and tag chips (200, 0.16em, uppercase). Replaces DM Serif Display / Source Sans 3; fonts loaded via `next/font/google`.

## 0.18.1 — 2026-10-09

### Voices
- Testimonial cards now use DM Serif Display for quotes (line-height 1.8) and Source Sans 3 for attribution name (uppercase, 11px), role/company (300, 10px), and tag chips (300, 0.14em tracking). Fonts loaded via `next/font/google`.

## 0.18.0 — 2026-10-09

### Voices
- Testimonial carousel now shows 5 randomly selected voices per visit (Fisher-Yates shuffle after mount to avoid hydration mismatches). Hero count and pinned quote are unchanged.
- Added a fixed "↑ Top" button (bottom-right) that appears after scrolling past 65% of the page height and smooth-scrolls back to the top.

## 0.17.3 — 2026-10-09

### Voices
- "In your own words" textarea now caps at 500 characters (`maxLength={500}`) and shows a live "characters remaining" counter below it, turning brand orange at 20 or fewer remaining.

## 0.17.2 — 2026-10-09

### Admin
- Voice review card now always shows the logo upload zone (`showUploadZone = true`), including for approved voices that already have a logo.

## 0.17.1 — 2026-10-09

### Voices motion
- Hero headline and hero stat row now animate on mount (`animate`, 20px rise, 0.55s, existing delays kept) instead of `whileInView`, removing the hydration flash on first load. Below-the-fold reveals are unchanged.

## 0.17.0 — 2026-10-09

### Voices motion
- Added Framer Motion scroll reveals (fade + 24px rise, once, -60px viewport margin) to the hero headline, hero stat row, "In their words." heading, testimonial cards (quote / attribution / chips staggered by card index), counter number and text, and the form heading and body.
- Form word chips now stagger in (0.04s apart). The form's old CSS reveal was replaced by these.
- Motion respects the reduced-motion system setting.

## 0.16.1 — 2026-10-09

### Voices hero
- Stronger center vignette over the photo collage so the headline reads clearly.
- Added a soft dark text shadow to the hero headline.
- "the people" line now uses brand orange `#B15927` instead of a faint ghost white.

## 0.16.0 — 2026-10-08

### Voices page
- Hero background is now an editorial photo collage: 6 framed, full-opacity photos (5px radius, rust border, drop shadow) placed in shuffled viewport zones with random jitter and a ±2.5° tilt.
- Each photo drifts independently on scroll while keeping its tilt; heading, bottom strip and VOICES watermark parallax rates retuned (3.2 / 2.4 / 1.8vh).
- Staggered fade-in (200ms + 150ms per photo), new dark vignette and lighter warm grade; grain now sits above the light-leak pulse.


### Voices page
- Hero parallax photos now read clearly: screen blend with muted color (saturate 0.62, brightness 0.78), opacity 0.18–0.38, and depth blur from 0.3px (front) to 1.5px (back).
- Photo sizes, positions, and drift distances are now in viewport units (22–42vw × 22–38vh), so the layout scales on phone, tablet, and desktop.
- Added a warm amber wash over the photos, refreshed the vignette and light leak, and changed the entrance stagger to 200ms + 130ms per photo with a 20px slide.
- Headline, watermark, and bottom row parallax now move in vh units.

---

## 0.15.0 — 2026-10-08

### Voices page
- Hero ghost photos replaced with a randomized parallax layer: 8 marquee photos scattered across shuffled zones on every load, each with its own size, opacity, depth blur, and scroll drift direction/speed, entering with a staggered fade.
- Headline, VOICES watermark, and bottom strip now drift at different rates as the hero scrolls away.
- New warm light-leak flare that peaks mid-scroll, and an upgraded radial + linear vignette. Film grain kept.

---

## 0.14.0 — 2026-10-08

### Voices page
- Hero now shows three ghosted background photos (reused from the splash marquee) that slowly breathe in opacity, staggered 2s apart, plus a subtle animated film-grain overlay. Both pause for reduced-motion users.

### Shared
- Marquee photo list moved to `lib/marquee-images.ts` so the splash and Voices hero use the same source.

---

## 0.13.7 — 2026-10-07

### Voices page
- Hero headline is now fully visible on page load; removed the scroll-tied word fade that hid it at scroll position 0.
- "Scroll to explore" label now gently pulses alongside the animated cue line (disabled under reduced motion).

## 0.13.6 — 2026-10-07

**Voices page (`/voices`)**
- Fixed a hairline seam at section boundaries caused by `100vh` subpixel rounding. Overlapping sections (Featured voice, chip burst, All voices, and the counter when it overlaps) now use `-mt-[calc(100vh+4px)]` with a matching `+4px` added to their height, so each section tucks 4px further under the one before it.
- The Featured voice sticky container now has `overflow-hidden`.
- No form, database, Resend, or auth changes.

---

## 0.13.5 — 2026-10-06

**Voices page (`/voices`)**
- New `app/voices/layout.tsx` wraps the route in a `.voices-root` container with `#0a0806` hardcoded. The `html:has(.voices-root)` / `body` canvas override and `overscroll-behavior: none` now apply before the page component mounts, and on every voices state.
- `<main>` now sets its background (`#0a0806`) and `overscrollBehavior: none` inline.
- The thank-you card no longer uses `bg-foreground` (#1a1a1a); it's hardcoded `#0a0806`, so every voices surface is the same tone.
- No form, database, Resend, or auth changes.

---

## 0.13.4 — 2026-10-06

### Voices page
- Section layering reversed so each new scene is revealed from underneath the previous one: every section is `position: relative` with an opaque `#0a0806` background and a descending z-index (hero 60 → pinned quote 50 → chip burst 40 → all voices 30 → counter 20 → form 10).
- Pinned quote now tucks under the hero (`-mt-[100vh]`) and stays pinned while the hero slides up off it. The counter is now a pinned scene too, so it's revealed in place as the voices carousel slides away.
- Scroll-driven scenes now start their animation only after the section above has fully slid off (lead offset instead of trailing overlap), and the counter animates on scroll position instead of IntersectionObserver so it doesn't play while it's still covered.
- No borders, lines, or shadows between sections. Hero headline keeps the scroll-tied word fade from 0.13.3.

## 0.13.3 — 2026-10-06

### Voices page
- Hero headline now fades in word by word as you begin scrolling (over the first ~35% of a screen), not on page load. Shown immediately for users with reduced motion.
- Hero is no longer sticky: it sits at `position: relative; z-index: 2` with an opaque `#0a0806` background, so nothing beneath it shows through. All later sections are `z-index: 1` and keep their existing overlap order through DOM order.
- Removed the top border on the "Add your voice" section so scenes blend into each other with no hard line.

## 0.13.2 — 2026-10-06

### Voices page
- Seamless scrolling: every section, sticky pin container, the `<main>` wrapper, the success screen, `html`, `body`, `#__next`, and the Lenis root now use the same `#0a0806` background (previously five slightly different warm shades).
- Removed the dark top shadow on overlapping scenes, which looked like a different-colored band as each section rolled up.
- Added `overscroll-behavior: none` on `html`/`body` so rubber-band scrolling can't reveal a different canvas.
- `<main>` now uses `min-h-full` instead of `min-h-screen`.

## 0.13.1 — 2026-10-06

**Voices page — chips, contrast, background (`/voices`)**
- Expanded the word chip list to 18 (added Prepared, Communicative, High quality, Would refer, Already referred, Understood the vision). Same list feeds the chip burst.
- New `.voices-chip` style for the form: unselected chips use a `rgba(240,236,230,0.18)` border with `0.62` text; selected chips get a 1.5px primary border, `rgba(181,82,10,0.14)` fill, full `#B5520A` text, a 3px outer ring, and scale to 1.04 (150ms ease-out).
- Contrast pass: primary text is now `#f0ece6`, and all secondary/label text is at least `rgba(240,236,230,0.62)`. Placeholders sit at `0.28`. Chip text on voice cards and in the burst is now full primary.
- `html`, `body`, and the page container are now solid `#0a0806` on `/voices`, so no grey shows during scroll.
- No changes to form logic, validation, email, database, or auth.

## 0.13.0 — 2026-10-06

**Voices page — connected scene transitions (`/voices`)**
- Replaced the standalone double marquee with a scroll-driven **chip burst** between the pinned quote and the horizontal voices: the 12 word chips burst out radially from an "In their words." center line (each at its own angle, distance, and stagger), then contract back as the horizontal section slides in. Fully tied to scroll position.
- **Scene overlap:** every section is now an opaque, z-stacked layer. The hero stays pinned while the quote slides over it, and each pinned scene holds its last frame while the next one slides over it with a soft upward shadow. No more empty black gaps between sections.
- The background warms gradually down the page, from #0a0806 (hero) to #0f0c08 (the "Add your voice" form).
- The scroll-progress hook now ignores the overlap distance, so word lighting and the horizontal card track still finish before the next scene arrives.
- Removed the now-unused marquee row styles.

---

## 0.12.0 — 2026-10-06

**Voices page — scroll-driven redesign (`/voices`)**
- Full-height hero on #0a0806: NJENGA wordmark + "+ Add your voice" pill (Lenis smooth-scrolls to the form), three-line 52px Georgia headline with "the people" at 18% opacity, a ghost "VOICES" wordmark behind it, eyebrow + live voice count (52px) at the bottom, and a "Scroll to explore" cue.
- Pinned quote scene (140vh, sticky): the featured voice lights up word by word as you scroll; the last three words light in primary, and the name/role fade in after 85%.
- Double chip marquee: two rows scrolling in opposite directions (row two slower), outline chips with hairlines.
- Horizontal voices scene (200vh, sticky): cards slide left as you scroll down, with an "ALL VOICES" eyebrow, a live "2 / 5" counter, and a progress bar. Every other card uses the mauve accent.
- Giant counter scene: 120px count scales and brightens into view, then the label (0.5s) and an italic phrase (0.8s) fade in.
- Form heading is now 36px. Form logic, validation, and Resend/database wiring are unchanged.
- Approved voices are shuffled on every page load (server-side), and the first one is featured.

**Global**
- Added Lenis (`lenis`) momentum smooth scrolling on the Voices page; it's turned off under reduced motion.

---

## 0.11.0 ��� 2026-10-06

**Voices page redesign (`/voices`)**
- Two-column hero: eyebrow + 52px Georgia headline (#f0ece6) on the left; live approved-voice count (64px, faded primary), "Voices & counting" label, and a "+ Add your voice" outline pill on the right that smooth-scrolls to the form.
- Full-width chip marquee of all 12 words (30s loop, outline chips, primary hairlines above and below).
- Testimonials now render in an asymmetric bento grid (one large card + two stacked), repeating per group of three; the second small card uses the mauve accent. Fewer than 3 voices shows a single centred card. The carousel is removed.
- Cards, the new "Every project. Every moment. Captured with intention." statement, and the form section fade/slide in on scroll via Intersection Observer (content already on screen at load doesn't animate).
- Form moved into a full-width dark section ("Add your voice." at 34px #f0ece6). Form logic, validation, and the Resend/database wiring are unchanged.

**Global**
- Smooth scrolling for in-page links (`scroll-behavior: smooth`, off under reduced motion).

---

## 0.10.0 — 2026-10-05

**Global luxury system (all pages)**
- New shared styles in `globals.css`: eyebrow labels (9px, 5px tracking, primary, 600), serif headlines (Georgia 400, 28px mobile / 40px desktop, line-height 1.15), form labels (10px uppercase, 1.5px tracking, muted, 500), outline chips, a warm-tint card wash (rgba(181,82,10,0.03)), and a fading gradient section divider.
- Major sections use at least 80px of vertical padding on desktop.
- Header wordmark is the same everywhere: "NJENGA" in serif bold, with "PRODUCTIONS CO." in light serif, 6px tracking, mauve. The admin header and login page now match. The logo image is unchanged.

**Brief form (/)**
- More padding on each step. Field labels and chips use the shared label and chip styles. Gradient dividers separate the major sections.

**Voices (/voices)**
- Quote text is 22px Georgia regular with line-height 1.75. The card has a 2px primary left border, and dot navigation stays below the carousel.
- Word chips and form labels use the shared styles. A gradient divider separates the testimonials from the form.

**Admin (/admin)**
- Cards get the warm tint, page padding is larger, and headings and section labels use the shared headline and eyebrow styles.

No form logic, database, auth, or Resend changes.

## 0.9.1 — 2026-10-05

**Voices page (luxury refinement)**
- Word chips are now outline-only (1px primary border at 40%, primary text at 70%, 11px).
- Quote card has a 3px primary left border, a faint warm glow, and more padding.
- Quote text is Georgia, upright, 16px, line-height 1.8, white at 90%, with no decorative quote marks. A short 32px primary rule sits above it.
- Client logos and initials avatars are 40×40 circles with a 1px primary border at 30%.
- Replaced the scrolling marquee with a single-card carousel: thin arrows and dot indicators centered below the card.
- Eyebrow label tracking increased to 4px; "PRODUCTIONS CO." is light weight with 6px tracking.
- More vertical space between the headline and the card.

---

## 0.9.0 — 2026-10-05

**Navigation & performance**
- Every route fades in on mount (opacity 0 → 1, 200ms ease-out) via `app/template.tsx`; disabled for reduced-motion users.
- New 2px `--primary` progress bar at the top of the page during route changes, including browser back/forward (`components/route-progress.tsx`, no new dependency).
- Internal nav links (Voices/Admin pills, logo, back links, admin header and tabs) now use `<Link prefetch>` so destinations load in the background. The admin brief list rows are left on the default to avoid prefetching every brief.

**Splash**
- All marquee photos (including R–X) are preloaded in the document head and load eagerly; the first 6 in each row get high fetch priority.
- Marquee tracks are promoted to their own GPU layer (`translateZ(0)`, `backface-visibility: hidden`) alongside the existing `will-change: transform`.

## 0.8.1 — 2026-10-03

**Admin — Voice review**
- Moved the logo delete (trash) button off the avatar into the card's top-right corner.
- Reject button now has a visible danger-colored border so it no longer looks disabled.
- Internal note field is a compact 2-row textarea.
- Replaced the text pencil glyph with a proper inline edit icon next to the quote.
- Logo upload zone now appears on every pending card (between word chips and the note); shows "replace" when a logo exists.
- Cards are capped at 560px wide.
- Company/role line only renders when a value was submitted — no "No company provided" fallback.

**Accessibility**
- WCAG AA contrast pass on `/admin/voices`: muted and secondary text on cards now use `--text-secondary` (#555, 7.5:1) instead of near-white; button and avatar text on orange is white (5:1); word chips use `--brand-strong` on `--brand-light` (~6:1); tabs and eyebrow on the dark backdrop use light tokens.
- Added token aliases derived from existing colors: `--brand-strong`, `--text-secondary`, `--border-danger`.

## 0.8.0 — 2026-10-03

**Deployments**
- Added `vercel.json`: Git deployments now run only for `main`. Other branches no longer create preview deployments.
- Turned off Vercel bot comments on GitHub commits and PRs (`github.silent`).

**Admin — Voice review**
- Improved the admin voice review workflow (`/admin/voices`): review cards and approve/reject actions were updated.

## 0.7.0 — 2026-10-02

**Voices**
- Improved voice review and submission flow.
- Slowed the splash screen marquee: Row 1 went from 40s to 65s, Row 2 from 35s to 55s.

## 0.6.0 — 2026-10-02

**Voices (new)**
- New `/voices` page for testimonials, plus a submission form and email notification (`submitVoice`).
- Added a Voices placeholder marquee and splash navigation.
- New header nav on `/` and `/voices`: a prominent Voices pill, a divider, and a subtle Admin pill. Removed the "Team login" label.
- Admin voice review and logo upload workflow.

## 0.5.0 — 2026-09-28

**Admin**
- Briefs can now be deleted with safeguards: they move to Trash first.
- Added the calligraphy backdrop to all admin pages.

**Landing**
- Landing photos are now shown in random order. The marquee starts after the first 8 photos load.

## 0.4.0 — 2026-09-27

**Landing & form**
- Made the landing grid bigger, put the tagline in the spotlight, and added branding to the form screen.

**Admin back office**
- Brief detail view, status tracking, internal notes, and brief import.

## 0.1.0

- Initial release: the video production inquiry (project brief) form.
