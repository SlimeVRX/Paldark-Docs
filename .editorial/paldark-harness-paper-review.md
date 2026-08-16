# Independent review — Paldark Harness Paper

Date: 2026-08-16

Baseline: `8b0c7af26bd920fe7e575dc2b130f12a21957034`

Final verdict: **ACCEPT**

## Review boundary

A fresh Sol reviewer, separate from the Luna implementer, reviewed the task packet, the complete diff against `origin/main`, the canonical paper, archive navigation, site metadata, public citations and the evidence boundaries required by the packet. The reviewer did not edit the implementation.

## Initial finding and correction

The first review rejected publication because the coverage map mislabeled Books Q2–Q4. The paper was corrected to match the preserved archive:

- Q2 — Vấn đề của nghìn người cùng code;
- Q3 — Bộ khung;
- Q4 — Dựng lại Palworld, including all 15 systems.

The same correction pass made the base of local evidence paths explicit: paths are relative to `Paldark-Docs`, and parent-workspace references therefore begin with `../`. The cited local paths were checked for existence.

The reviewer re-read the bounded corrections and changed the verdict to **ACCEPT**. Acceptance criteria 4, 6 and 12, which were affected by the finding, all passed after correction.

## Evidence-boundary result

No remaining blocking overclaim was found. The paper states, rather than hides, that:

- the 21 GameFeatures are currently Active/static packaging, not proven dynamic composition;
- Work → PalBehavior is dependency debt;
- the registry is still a stub and the event bus is synchronous;
- persistence and multiplayer are QA-only;
- no benchmark exists in the current snapshot;
- Task 55 remains UNKNOWN;
- the paper does not expose private DeepSeek reasoning, prove Unreal correctness, establish 1:1 parity or grant legal clearance.

## Validation at accepted revision

- `pnpm docs:check`: PASS — 69 Markdown pages, no broken internal link.
- `pnpm docs:build`: PASS — VitePress, Mermaid, sitemap and root page rendered successfully; one non-blocking chunk-size warning remains.
- `git diff --check`: PASS — no whitespace error; Git reports only expected LF/CRLF conversion warnings on Windows.
- Public source URLs checked: 10/10 returned HTTP 200.
- Root HTML checked: title, canonical URL, Open Graph image and dimensions are coherent.
- Publication write set checked against the task packet; archived chapter routes remain present.

## Final acceptance table

| Area | Result |
|---|---|
| Canonical one-file argument | PASS |
| Rationale, assumptions, invalidation and fallback | PASS |
| Cordis/Harness/Unreal/Paldark evidence separation | PASS |
| Six books and 15 systems coverage | PASS |
| Quantitative and time caveats | PASS |
| Public citations and local provenance paths | PASS |
| Mermaid, Markdown and VitePress build | PASS |
| Archive preservation and navigation | PASS |
| Metadata and social card | PASS |
| Independent evidence/overclaim review | PASS |
