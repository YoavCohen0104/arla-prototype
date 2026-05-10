# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Arla Aesthetics — project context

## What this is
A B2B clinical decision-support platform for aesthetic injectors.
Injectors capture patient facial scans and receive expert treatment plans.

## Stack
- Plain HTML, CSS, JavaScript only
- No frameworks (no React, no Vue)
- No external libraries unless I ask

## Rules
- Always ask before creating new files
- Keep code simple and readable
- Add comments explaining clinical logic
- Forms must have basic validation

## Users
- Injector: creates cases, performs treatments
- Expert: reviews cases, creates treatment plans
- Patient: does not use the system directly

## Running the app
No build step. Open any `.html` file directly in a browser, or run a local static server:
```
npx serve .
```

## Architecture

### Three user flows

**New-patient intake flow:**
`clinic-login.html` → `intake-form.html` → `intake-confirm.html` → `facial-capture.html` → `scan-review.html` (submit mode) → `case-submitted.html`

**Returning-patient flow** (bypasses intake):
`index.html` (patient search) → `patient-folder.html` → `facial-capture.html` (with `arla_selected_patient` set) → `scan-review.html` (submit mode) → `case-submitted.html`

**Expert flow:**
`expert-dashboard.html` → `expert-annotation.html` → `treatment-plan.html` → `feedback.html`

All pages share a two-link `.proto-nav` bar (`index.html` ↔ `expert-dashboard.html`) for prototyping navigation.

### Shared JS (`intake.js`)
Loaded by both `intake-form.html` and `intake-confirm.html`. Detects the active page by checking for `#intake-form` vs `#confirm-container` and calls the appropriate init function. All other pages keep JS inline. Follow this split: shared file only for logic that spans multiple pages.

### sessionStorage keys (the cross-page data bus)

| Key | Written by | Read by | Removed by |
|-----|-----------|---------|-----------|
| `arla_intake` | `intake.js` (form submit) | `intake.js` (confirm page), `facial-capture.html` | `facial-capture.html` (`finishCapture`) |
| `arla_selected_patient` | `patient-folder.html` | `facial-capture.html` | `facial-capture.html` (`finishCapture`) |
| `arla_capture` | `facial-capture.html` (`finishCapture`), retake path | `scan-review.html`, `case-submitted.html`, `visit-details.html`, `treatment-plan.html` | never (survives session) |
| `arla_scan_mode` | `facial-capture.html` (`finishCapture` sets `'submit'`) | `scan-review.html` | never |
| `arla_retake_index` | `scan-review.html` (Retake button) | `facial-capture.html` | `facial-capture.html` (on capture or discard) |
| `arla_annotation_draft` | `expert-annotation.html` (Save Draft / auto-save) | `expert-annotation.html` (on load) | never |
| `arla_annotation` | `expert-annotation.html` (Submit Plan) | `treatment-plan.html` | never |

**Key data shapes:**
- `arla_intake` / `arla_selected_patient`: `{ name, phone, dob, gender, complaint, createdAt }`
- `arla_capture`: `{ snapshots: string[], videoUrl: string, patientName, complaint, phone, dob, gender, submittedAt }`
- `arla_annotation`: `{ dots: [{x, y, depth, units, label}], notes: string }`

### `scan-review.html` dual-mode design
Controlled by `arla_scan_mode` (`'submit'` vs `'review'`). In `submit` mode: shows Retake buttons per expression and a Submit Case button; back-link is hidden. In `review` mode: read-only, back-link to `patient-folder.html` shown. All content is injected by JS — the HTML shell is empty except for a brand header.

### `facial-capture.html` retake mode
When `arla_retake_index` is present in sessionStorage, the page starts at that expression index, pre-seeds `snapshots` from existing `arla_capture`, and on capture writes only that slot back. Recording is skipped. Cancel discards the retake (keeps existing capture) and returns to `scan-review.html`.

### Expert annotation save/restore pattern
`expert-annotation.html` auto-saves dot placement and notes to `arla_annotation_draft` on every change and restores on page load. On "Submit Plan", the draft is promoted to `arla_annotation` (the canonical read key for `treatment-plan.html`).

### Injection marker pattern (`treatment-plan.html`)
Numbered dots overlaid on the clinical photo and the ordered list below are linked by `data-point` attributes. Hovering either highlights both via the `.highlight` CSS class. Driven by inline JS.

### Validation pattern
All forms use `novalidate`. Custom JS applies `.invalid` to the input and `.visible` to its sibling `.error-msg` span. Errors clear on the next `input` event.

### CSS design tokens
All colors, radius, and shadow are CSS custom properties in `:root` in `style.css`. Never hardcode these values in new pages.

### Page-scoped styles
Pages with significant UI complexity declare a `<style>` block in `<head>`. Do not add page-specific styles to `style.css` — only shared, reusable styles belong there.

### Feedback webhook
Completed feedback forms POST JSON to:
```
https://yoavcohen.app.n8n.cloud/webhook/arla-feedback
```
Payload: `rating` (int 0–5), `modified` (`"yes"` / `"no"`), `comment` (string), `timestamp` (ISO 8601). The form shows success regardless of webhook response so a network failure never blocks the injector.

## PDD Requirements (Key MVP Screens & Flows)

### Required screens
- `index.html` — injector home, active/pending case counts, next-action card, patient search
- `clinic-login.html` — email + password, role-based access (Injector, Assistant, Expert)
- `intake-form.html` — full name, phone, birth date, gender, chief complaint; all required with validation; duplicate phone detection
- `facial-capture.html` — 7 guided expressions, live camera, manual capture per expression, pause/resume/cancel, retake support
- `intake-confirm.html` — read-only summary, edit button, confirm and start case
- `scan-review.html` — post-capture review with per-expression retake (submit mode) or read-only scan viewer (review mode)
- `patient-folder.html` — returning patient demographics, case history, new case CTA
- `visit-details.html` — status-driven case detail (Pending / In Review / Planned / Closed), scan preview
- `case-submitted.html` — pending state, expert assigned, ~5 min response indicator
- `expert-annotation.html` — click-to-place numbered dots, depth (Superficial/Deep), dosage per dot, notes, draft save, submit plan
- `treatment-plan.html` — read-only plan for injector: annotated face image, depth color coding, dosage, expert notes
- `feedback.html` — rating 1–5, optional comment, modified yes/no; mandatory before case closes
- `expert-dashboard.html` — case queue, SLA indicators, expert profile, cases by status

### Case status lifecycle
Pending → In Review → Planned → Closed

### User roles
- Injector: creates cases, performs treatments, gives feedback
- Assistant: supports intake and facial capture only
- Expert: reviews cases, creates treatment plans remotely

### Privacy requirements
- Screen lock or PIN after patient data entry
- No cross-patient navigation on clinic device

### Out of scope for prototype
- Automatic expression detection
- Automatic quality validation (lighting, blur)
- Real backend or database
- Real authentication system
- Patient history / analytics
- EMR integration
