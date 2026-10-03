# Changelog

Version notes for the NJENGA Productions project brief site. Newest first.

Versioning: **minor** (0.x.0) for new features or pages, **patch** (0.x.y) for fixes, tweaks, and config changes.

---

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
