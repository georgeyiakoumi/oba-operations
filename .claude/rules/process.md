# Process Rules — OBA Operations

## Branching & Commits
- Never commit to `main` directly
- Branch from a Linear ticket: `geo-123-short-description`
- Commit messages: imperative mood, reference Linear ticket
- Create a GitHub release after every merged PR

## Linear Workflow
- Project: "OBA Operations — Apps Script Upgrade"
- Team: georgeyiakoumi
- Milestones M1–M8 map to upgrade phases
- Issues have binary acceptance criteria (done / not done)
- Move tickets through: Backlog → In Progress → Done

## Notion
- Log architectural decisions to the decisions log
- Read lessons before starting new milestone work
- Master plan: https://app.notion.com/p/3affeeb2a07881b2ad31e6db22f7ba3d
- Decisions: https://app.notion.com/p/3affeeb2a07881c286a2cc8515d84dfa
- Lessons: https://app.notion.com/p/3affeeb2a07881129d87ee2d005fb29c

## Apps Script Constraints
- Vanilla JS/HTML/CSS only — no npm, no build, no JSX, no modules
- All HTML is string concatenation from render functions
- `google.script.run` callback-based async (not Promises)
- Everything is global scope
- Code.js server-side stays mostly as-is

## Deployment
- Use `clasp push` to deploy
- Test with real data before pushing
- Ask George before pushing — he wants to test first

## Design Principles
- Dyslexia-friendly: min 14px body, generous line height, left-aligned
- UK date format (DD/MM/YYYY)
- shadcn-style component patterns even in vanilla CSS
- Reference build: `/Volumes/T7 Editing/Projects/health-bank/`
