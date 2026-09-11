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

## 2026-09-11T03:52:42Z

Setup and implement a robust automated Unit & Integration Testing suite for the Alifleet Next.js 16 + Supabase platform using Vitest, covering core business logic, category hierarchy, content synchronization, and admin API routes.

Working directory: d:\Workspace\Alifleet-next
Integrity mode: development

## Requirements

### R1. Testing Infrastructure Setup
Install and configure Vitest alongside React 19 testing utilities and Next.js path alias support (@/*). Add test run scripts (npm test, npm run test:run) to package.json without conflicting with existing Next.js build or dependencies.

### R2. Core Business Logic & Data Transformation Tests
Implement comprehensive unit tests for core utilities and logic:
- Multi-language parser and fallback mechanisms (lib/admin/admin-i18n.ts, i18n() in lib/content/repository.ts).
- Category tree builder, hierarchical nesting, and parent-child association logic.
- Inventory calculations, low-stock thresholds, and price minor-to-major currency transformations.

### R3. Admin & API Integration Tests
Implement integration tests for critical backend endpoints and data persistence flows:
- Admin content API (/api/admin/content) handling different save scopes (products, categories, settings).
- Role-based authorization guardrails and session validation checks.
- Mocking Supabase database responses to ensure reliable, offline, and safe execution without affecting live cloud data.

## Acceptance Criteria

### Test Execution & Pass Rate
- [ ] npm run test:run runs all test suites and exits with code 0 (100% passing tests).
- [ ] At least 3 dedicated test files covering: (1) Category & Product domain logic, (2) Multi-language & formatters, (3) Admin API routes.
- [ ] Vitest configuration handles @/* alias imports seamlessly.
- [ ] Tests run safely in isolation with mocked Supabase clients, preventing any writes to live production database.
- [ ] Production build (npm run build) continues to pass cleanly with 0 TypeScript/compilation errors.
