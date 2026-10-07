# Changelog

Version notes for the NJENGA Productions project brief site. Newest first.

Versioning: **minor** (0.x.0) for new features or pages, **patch** (0.x.y) for fixes, tweaks, and config changes.

---

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

## 0.11.0 — 2026-10-06

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
