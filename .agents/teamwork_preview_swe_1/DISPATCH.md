## 2026-09-05T04:01:46Z

You are teamwork_preview_swe.
Your working directory is: d:\alifleet\.agents\teamwork_preview_swe_1
The project root is: d:\alifleet
The authoritative user request is recorded in: d:\alifleet\.agents\ORIGINAL_REQUEST.md

Your task:
Execute the implementation and verification loop for the requirements in ORIGINAL_REQUEST.md:
1. R1: Verify Core E-commerce Pages (/cart, /my-account, /shop or equivalent) in the Next.js project. If missing, create the necessary route files with functional components.
2. R2: Implement Policy Pages (Privacy Policy, Terms & Conditions, Refund & Returns) supporting Arabic, English, and Hebrew via the existing i18n setup.
3. R3: Connect the policy pages dynamically to the live WordPress GraphQL endpoint https://a-f.site/graphql according to the active language. Do NOT use fallback or local URLs from .env.

Constraints & Rules:
- When running terminal commands on Windows, always prefix with cmd /c to avoid hanging.
- Maintain BRIEFING.md and progress.md in your working directory d:\alifleet\.agents\teamwork_preview_swe_1.
- Verify all routes and GraphQL queries thoroughly with tests / checks.
- When done, report completion and handoff.md with verification details back to the caller.
