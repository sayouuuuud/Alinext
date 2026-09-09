# Original User Request

## Initial Request — 2026-09-05T04:00:30Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Craft prompt → get user approval → delegate to teamwork_preview
> Requested team: Small, focused team

This is a single self-contained fix; keep it small and focused. Implement multi-lingual policy pages (Privacy Policy, Terms & Conditions, Refund & Returns) in a Next.js frontend, fetching content dynamically from a live WordPress GraphQL endpoint (`https://a-f.site/graphql`). Ensure core WooCommerce pages (Cart, My Account, Shop) exist and function correctly.

Working directory: `d:\alifleet`
Integrity mode: development

## Requirements

### R1. Verify Core E-commerce Pages
Inspect the Next.js project to ensure the routing for `Cart`, `My Account`, and `Shop` pages exist. If they are missing, create the necessary route files with placeholder functional components.

### R2. Implement Policy Pages
Create the frontend routes and components for the policy pages: Privacy Policy, Terms & Conditions, and Refund & Returns. The pages must support three languages: Arabic, English, and Hebrew via the existing i18n setup.

### R3. WordPress GraphQL Integration
Connect the newly created policy pages to the live WordPress GraphQL endpoint (`https://a-f.site/graphql`). Ensure the data is fetched dynamically based on the current active language. Do NOT use fallback or local URLs from the `.env` file for the endpoint connection.

## Acceptance Criteria

### E-Commerce Pages Verification
- [ ] An independent agent verifies that the `/cart`, `/my-account`, and `/shop` (or equivalent) routes resolve without returning a 404 error.

### Policy Pages & i18n
- [ ] An independent agent verifies that the policy pages render correctly without errors in the browser/Next.js environment.
- [ ] An independent agent verifies that the content language changes correctly when switching between Arabic, English, and Hebrew routes.

### Live GraphQL Data
- [ ] An independent agent verifies that the policy components successfully execute a GraphQL query against `https://a-f.site/graphql` and display the returned data.
