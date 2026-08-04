# OBA Operations Suite — Handover

## What happened

George (UX/product designer) was asked by a friend-of-a-friend to help Olive Branch Aid (OBA), a food bank operating across Lambeth, Southwark, Wandsworth, and Croydon. OBA had a vibe-coded Google Apps Script app for managing referrals, registrations, and wellbeing cases. George rebuilt it from scratch in React/Next.js with proper UX design (repo: `georgeyiakoumi/health-bank`).

After completing all 8 milestones, the OBA team decided to stay on Google Apps Script. George is now upgrading their existing Apps Script codebase by porting the design decisions, CSS, business logic, and UX improvements from the React build.

## Two repos

| Repo | Purpose | Location |
|---|---|---|
| `georgeyiakoumi/health-bank` | React/Next.js reference build (design spec) | `/Volumes/T7 Editing/Projects/health-bank/` |
| `georgeyiakoumi/oba-operations` | Apps Script target (cloned via clasp) | `/Volumes/T7 Editing/Projects/oba-operations/` |

## Current state of oba-operations

Cloned from Apps Script project ID: `1TvqFfusK7g65f5NyQFJ_-M0Rmte55pdJ6UtrvThCiEDAKZySNOEotFox`

### Files (their existing code)
- `Code.js` — Server-side: sheet CRUD, 10 public API functions, 25-col referral schema
- `Index.html` — Shell, loads all child templates
- `_css.html` — 527 lines, custom CSS, Fraunces/IBM Plex Mono/Inter fonts
- `_config.html` — Status constants, dietary/allergen lists, flag definitions
- `_mock.html` — 35 mock referrals, STATE object, helper functions
- `_boot.html` — Render dispatcher, GAS vs fallback init
- `_icons.html` — Lucide icon mapping
- `_views-nav.html` — Sidebar + Today/Overview/All Referrals/New/Registrations/Beneficiaries
- `_views-detail.html` — 5-step detail page (Referral Info, Triage, Registration Interview, Finalising, Follow-up)
- `_views-wellbeing.html` — Password-gated wellbeing module
- `appsscript.json` — Project manifest

### Architecture
- Single Page App — vanilla JS, HTML string concatenation, no framework
- Global `STATE` object for view/routing state
- Global `DATA` object for all referral/note/action data
- `google.script.run` for async server calls (falls back to mock data)
- No build step, no npm, no modules — everything is global scope

## What we're porting from health-bank

### CSS & Design System
- Olive green theme (oklch tokens → convert to hex CSS vars)
- Borough colours: Lambeth lime-700, Southwark fuchsia-800, Wandsworth amber-600, Croydon sky-700
- Status tones: sp-new (emerald), sp-plan (amber), sp-prog (blue), sp-done (green), sp-red (red), sp-grey (muted)
- Dark mode support (their app has none)
- Dyslexia-friendly: min 14px body, leading-relaxed, sans-serif, left-aligned

### Navigation restructure
Their current sidebar:
```
Today → Overview → All Referrals → New → Registrations → Beneficiaries → Wellbeing
```

Our improved structure:
```
Dashboard (Overview + Actions tabs)
Referrals (count)
  ├── Awaiting Triage (count)
  ├── In Progress (count)
  ├── Waiting List (count)
Beneficiaries (count)
Closed (count)
Wellbeing (count)
  ├── All Cases
  └── To-do / Notes
```

### Dashboard improvements
- Merged Today + Overview into tabbed view (Overview | Actions)
- Overview tab: pipeline cards, borough donut chart (Recharts → needs vanilla alternative), Lambeth threshold bar with provisional calculator, cases due to close
- Actions tab: 7-day week picker (Mon–Sun), calendar navigation (prev/next week), day-specific appointments/actions/new referrals

### Referral table improvements
- InputGroup search (icon + input)
- ToggleGroup filters (All / Awaiting Triage / In Progress / Waiting List)
- Borough select filter
- Sortable columns
- Status pills with tone colours
- Flag badges (DV/DA as dots, Complex/DIS/INT as text badges)

### Detail page improvements
- Breadcrumbs for nested pages
- Tagline under name: "Southwark, 1 adult, 3 children, supporting Feb – May 2025 (4 months) · 2 months remaining"
- Parcel tracking in header (Parcel 1: Collected, Parcel 2: Booked, Parcel 3: Scheduled)
- Referral Info tab: 4-column card grid using DataList component (Contact, Household, Needs & Requirements)
- Registration as 5-step wizard with progress bar (not separate tabs)

### New data fields we added
- `address1`, `address2`, `postCode` — Contact address (split from single field)
- `ages` — Children ages parsed into "Boy (5), Girl (8)" format
- `dateResponded` — When OBA responded to the referral
- `ethnicity` — From Google Form
- `dietaryRequirements`, `allergies`, `sanitaryProducts`, `incontinencePads`, `hasPets`, `petDetails`, `otherImportant` — Needs fields
- `parcels[]` — Array of ParcelRecord {parcelNum, scheduledDate, status, smsSentDate, bookedDate, bookedTime, collectedDate}
- `distributionGroup` — Group 1 or 2 (based on registration date: 1st–14th = Group 1, 15th+ = Group 2)
- `distributionType` — Collection or Delivery

### Business logic to port
All in `health-bank/lib/`:
- `helpers.ts` — statusMeta, flagList, isComplex, isNewRef, isComplete, isActive, isClosed, benCat, isFinalMonth, hh, hhWords, fmtDate, parseChildAges, formatChildren, calcHouseholdSize, closingIn, isOverdue, parcel date calculations
- `constants.ts` — Status groupings (NEW_STATUSES, REG_APPOINTMENT_STATUSES, WAITING_LIST_STATUSES, ACTIVE_STATUSES, DELIVERY_WAIT_STATUSES, BENEFICIARY_STATUSES, CLOSED_STATUSES), borough config, dietary/allergen options, risk areas
- `mock-data.ts` — 36 referrals with all new fields, generateParcels() function

## Planned milestones for the upgrade

**M1 — CSS & Design System Overhaul**
Replace `_css.html` with our colour system, typography, spacing, component styles. Port olive green theme.

**M2 — Navigation & Layout Restructure**
Update sidebar to match our nav structure. Add breadcrumbs. Fix layout hierarchy.

**M3 — Dashboard Upgrade**
Port Overview + Actions tabs, day picker, pipeline cards, borough donut chart, Lambeth threshold tracker, closing summary.

**M4 — Referral Table & Filtering**
Port DataTable pattern (search, filters, sortable columns) to vanilla JS. Apply to all list views.

**M5 — Detail Page & Registration Wizard**
Port referral info DataList layout, triage flow, 5-step registration wizard with progress bar.

**M6 — New Features**
Add parcel tracking, address fields, children formatting, week navigation, business logic improvements.

**M7 — Wellbeing Module Polish**
Apply design system to wellbeing views. Port improved notes/tasks UI.

**M8 — Testing & Deployment**
Verify with `clasp push`, test with real data, fix GAS-specific issues.

## Linear project needed
- Project: "OBA Operations — Apps Script Upgrade"
- Team: georgeyiakoumi
- Create milestones M1–M8 as above
- Create issues within each milestone with binary acceptance criteria

## Notion
- Master plan page: https://app.notion.com/p/3affeeb2a07881b2ad31e6db22f7ba3d
- Decisions log: https://app.notion.com/p/3affeeb2a07881c286a2cc8515d84dfa
- Lessons: https://app.notion.com/p/3affeeb2a07881129d87ee2d005fb29c
- Needs updating to reflect the pivot to Apps Script

## Tools configured
- **clasp** — installed globally, authenticated with gykmi91@protonmail.com
- **Skills installed:** google-apps-script (jezweb), shadcn, frontend-design, find-skills
- **MCPs (cloud):** GitHub, Linear, Notion, Netlify, Figma, Google Drive, Supabase
- **MCPs (user):** context7

## Key constraints
- Apps Script = vanilla JS/HTML/CSS only. No npm, no build step, no JSX.
- All HTML is string concatenation returned from render functions
- google.script.run is the only async pattern (callback-based, not Promise)
- No modules — everything is global scope
- Their Code.js server-side logic stays mostly as-is (it works)
- Focus on the frontend: _css.html, _views-*.html, _config.html, _mock.html

## Process reminders
- Read `.claude/rules/process.md` before starting work
- Create a GitHub release after every merged PR
- Never commit to main — always branch from a Linear ticket
- Log decisions to Notion decisions log
- Read lessons from Notion before acting

## George's preferences
- Dyslexia-friendly design (min 14px, generous line height, left-aligned)
- UK date format (DD/MM/YYYY)
- Direct communication — flag concerns honestly, no flattery
- Wants to test before committing — ask before pushing
- prefers shadcn-style components even in vanilla (apply the patterns)
