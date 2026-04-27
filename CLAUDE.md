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
