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

### Two distinct flows

**Intake flow** (injector creates a case):
- `clinic-login.html` — injector login with email/password and WebAuthn biometric stub
- `intake-form.html` — patient intake form, step 1 of 2
- `intake-confirm.html` — review and confirm patient details, step 2 of 2

**Treatment plan loop** (prototype, no real backend):
- `index.html` — prototype entry point listing all three steps
- `case-submitted.html` — pending state after injector submits a case (step 1 of 3)
- `treatment-plan.html` — expert assessment with annotated injection points (step 2 of 3)
- `feedback.html` — injector rates the plan and logs modifications (step 3 of 3)

All treatment-loop pages share a `.proto-nav` bar for free navigation between screens during prototyping.

### Shared JS (`intake.js`)
`intake.js` is loaded by both intake pages. It detects which page it's on by checking for specific root elements (`#intake-form` vs `#confirm-container`) and calls the appropriate init function. The login page and all treatment-loop pages keep their JS inline — follow that split: inline for simple single-page scripts, shared file for multi-page logic.

### Data flow between intake pages
Form data passes from `intake-form.html` to `intake-confirm.html` via `sessionStorage` under the key `arla_intake` (JSON). If the confirm page loads without session data, it redirects back to the form. On final confirm, the session entry is cleared.

### Injection marker pattern (`treatment-plan.html`)
Numbered dots overlaid on the clinical photo and the ordered list below are linked by `data-point` attributes. Hovering either a marker or its corresponding list item highlights both via the `.highlight` CSS class. This sync is driven by inline JS at the bottom of `treatment-plan.html`.

### Validation pattern
All forms use `novalidate` to suppress native browser validation. Custom JS validation applies the `.invalid` CSS class to the input and `.visible` to its sibling `.error-msg` span. Errors clear on the next `input` event for immediate feedback.

### CSS design tokens
All colors, radius, and shadow are CSS custom properties defined in `:root` in `style.css`. New pages must reference these variables rather than hardcoding values.

### Page-scoped styles
Pages with significant UI complexity (`clinic-login.html`, `expert-dashboard.html`, `treatment-plan.html`) declare a `<style>` block in `<head>` for their page-specific CSS. Do not add page-specific styles to `style.css` — only shared, reusable styles belong there.

### Feedback webhook
Completed feedback forms POST JSON to:
```
https://yoavcohen.app.n8n.cloud/webhook/arla-feedback
```
Payload fields: `rating` (int 0–5), `modified` (`"yes"` / `"no"`), `comment` (string), `timestamp` (ISO 8601). The form shows a success message regardless of webhook response so that a network failure never blocks the injector.

## PDD Requirements (Key MVP Screens & Flows)

### Required screens
- index.html — injector home page showing clinic state:
  active cases count, pending cases, next action card.
  Navigation to all flows. Role-aware (injector vs expert 
  see different views).
- clinic-login.html — secure login, email + password, 
  role-based access (Injector, Assistant, Expert)
- intake-form.html — full name, phone number, birth date, 
  gender, chief complaint (free text). All required with 
  validation. Privacy lock after submission.
- facial-capture.html — 7 guided expressions in sequence:
  neutral/serious, raised eyebrows, frown, smile, sad,
  left side view (90°), right side view (90°).
  Live camera feed with real video recording.
  Manual capture per expression. Under ~1 minute total.
  Still image extraction after capture.
  Pause/Resume/Cancel controls.
  Pre-submission review with per-expression retake.
- intake-confirm.html — read-only summary, edit button,
  confirm and start case button
- case-submitted.html — pending state, expert assigned,
  ~5 min response time indicator. Injector can view 
  but not edit after submission.
- expert-annotation.html — expert can click on face image
  to place numbered dots, set depth per dot 
  (Superficial/Deep, two-color system), add dosage units
  per dot, add free-text notes. Submit Plan button.
- treatment-plan.html — read-only expert plan for injector.
  Face image with numbered dots, depth color coding,
  dosage per point, expert notes. Cannot be modified.
- feedback.html — rating 1-5, optional short comment,
  indication whether plan was modified (yes/no).
  Mandatory before case closes.
- expert-dashboard.html — case queue, SLA indicators,
  expert profile, cases by status

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
- Automatic expression detection to trigger capture
- Automatic quality validation (lighting, blur)
- Automatic re-capture enforcement
- Real backend or database
- Real authentication system
- Patient history / analytics
- EMR integration
