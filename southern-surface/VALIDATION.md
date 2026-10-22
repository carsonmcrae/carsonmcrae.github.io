# Showcase validation

Reviewed October 22, 2026. Results below concern the independent public showcase, not the operational application or a business-record audit.

## Executed checks

- `node --test southern-surface/demo/model.test.mjs`: **6 passed, 0 failed**. Covers ordered discovery, persistence before checkpoint acknowledgement, duplicate opportunity handling and repeated runs, human approval/rejection, approval-only scoring, filters/sort, status validation, notes/manual outreach, and fresh-state reset.
- `node --check southern-surface/demo/app.js`: passed.
- `node scripts/check-ssc.mjs`: passed. Checks local HTML links/anchors, duplicate IDs, sitemap inclusion, fictional-data notice, isolation CSP, absence of network/storage APIs in demo scripts, and selected credential/operational-detail patterns in the new surface. Pattern matching supplements manual review; it is not a complete secret detector.
- `git diff --check`: passed for portfolio and profile changes.
- Browser checks: desktop and 390 × 844 prototype views; 320px homepage/case navigation; 390px case study. Keyboard discovery, focus after re-render and filtered approval, tab arrows, dialog Escape/focus return, filters/empty states, lead stages, escaped notes, manual activity/follow-up, five-step fictional outcome, and reset during an unfinished run passed. Document overflow was corrected; the small-screen lead table scrolls within its container.
- Light/dark rendering, loaded artwork, case-study anchors, Products menu Escape/focus, and homepage-to-case navigation were checked. No warning/error entries were observed in the local browser checks.
- Axe-core **4.13.0**, locally instrumented test server: **13 scans, zero automated violations** using WCAG 2 A/AA, 2.1 A/AA, and available 2.2 AA rules. Desktop: four prototype views in both themes, plus case study in both themes. Mobile: candidate review (light), leads (dark), and case study (light). Prototype scans include incomplete color-contrast checks requiring manual judgment; automated scans do not establish WCAG conformance. Test instrumentation and the third-party engine are not shipped.
- Public business website: homepage and quote journey inspected on desktop and at 390px, with local captures. No form was submitted. This is a read-only observation of the public experience, not an audit of its production backend.

## Isolation review

The prototype was written independently. Its organizations, opportunities, IDs, notes, counters, scores, and outcome story are fictional. State exists only in the current tab's memory; reset/reload discards it. The prototype theme is also visit-only. The surrounding portfolio retains its existing theme preference behavior.

The demo has no production URLs, customer records, credentials, environment configuration, authentication, backend modules, external imports, network APIs, analytics, or persistent data store. Its Content Security Policy blocks connections and form submission, restricts scripts/styles/assets to the same origin, and blocks frames/objects. The only navigation outside the demo is back to the static case study/portfolio. Static requests load its own HTML/CSS/module files; “no live data requests” does not mean zero HTTP requests for assets.

New text, SVG illustration, public-site screenshots, and staged changes were reviewed before the review-branch push. No operational source or configuration was copied. The operational repository was inspected read-only; no production script, database, scheduler, outreach action, or deployment was executed or changed.

## Evidence and release limits

The owner reported **150 new leads generated and 5 jobs secured last month** on October 22, 2026. These are attributed business figures, separate from all demo counts. Underlying records, exact reporting dates, common cohort, and attribution were not independently audited. No revenue, ROI, conversion rate, or savings are inferred.

The current implementation, architecture records, tests, and history support the descriptions of workflow and decisions. They do not prove that every local operational change has been deployed or establish live scheduler reliability. Operational tests were inspected, not executed for this showcase.

The owner approved publication on October 22, 2026. The portfolio and profile pull requests are merged, and the public standalone showcase repository is published at https://github.com/carsonmcrae/southern-surface-case-study. The case study and prototype were verified at their live portfolio URLs after release. No Pages configuration or operational application settings were changed. Local link checks and live browser checks cover different parts of release validation.
