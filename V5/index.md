---
title: Paldark V5 — hiến chương và sổ quyết định
description: Mục tiêu, ranh giới và design gates phải được duyệt trước khi viết gameplay code.
---

# Paldark V5 — hiến chương và sổ quyết định

> **Trạng thái:** `PROPOSED — AWAITING DESIGN APPROVAL`
>
> **Không được mở gameplay implementation từ tài liệu này cho tới khi Gate P4 được duyệt.**

## 1. Tuyên bố vấn đề

KYWorld đã có một vòng gameplay dày đặc và nhiều polish player-facing, nhưng phần lớn quyền quyết định nằm trong Blueprint/content graph khó chia việc. Paldark V1–V4 đã tạo nhiều primitive kiến trúc tốt, nhưng chưa tái tạo được cùng độ hoàn thiện và đã tích lũy rework ở các seam liên hệ nhiều hệ thống.

V5 không cố “dịch file”. Nó giải một bài toán tái biểu diễn:

> Giữ nguyên hợp đồng quan sát của KYWorld trong khi thay toàn bộ gameplay authority và orchestration bằng C++ có owner, dependency và bằng chứng đủ rõ để nhiều agent làm việc độc lập rồi ghép lại.

## 2. Mục tiêu có thể kiểm chứng

V5 chỉ được gọi hoàn tất khi cùng lúc đạt bốn mục tiêu:

1. **Content closure:** mọi tracked path và runtime package được giữ, chuyển, hoặc loại bằng chứng cứ.
2. **Native ownership:** mọi graph C/D và mutation authoritative nằm trong native C++; retained Blueprint chỉ là data, presentation hoặc declarative authoring theo allowlist.
3. **KYWorld parity:** state, ordering/timing, presentation, reference graph và runtime health pass cùng một behavior atlas đã khóa.
4. **Paldark conformance:** mỗi state có một owner, feature phụ thuộc contract thay vì concrete peer, lifecycle effect có receipt và final provider graph không cycle.

“100% C++” không có nghĩa texture, mesh, montage, UMG Designer, DataAsset, map hay BT/EQS asset biến thành source code.

## 3. Non-goal

- Không viết lại feature không tồn tại trong KYWorld reference chỉ vì Paldark V4 từng có backlog tương ứng.
- Không di chuyển hoặc đổi tên hàng loạt `/Game/...` trong parity phase.
- Không dùng commit count, LOC hoặc số asset converted làm proxy cho gameplay hoàn tất.
- Không coi converter output là source of truth.
- Không public asset, graph export, video hoặc media proprietary; public docs chỉ giữ phương pháp, hash và kết luận kỹ thuật.
- Không trộn engine upgrade với gameplay refactor.

## 4. Sổ quyết định

| ID | Quyết định | Trạng thái | Hệ quả |
|---|---|---|---|
| `V5-ADR-001` | Một target duy nhất: Unreal Engine 5.8.1, CL `56057345` | **ACCEPTED BY OWNER** | Không có nhánh runtime 5.4/5.6, không backport, không parity nhiều engine; full toolset/plugin lock còn chờ P1 |
| `V5-ADR-002` | Seed PaldarkV5 từ toàn bộ KYWorld rồi nâng một chiều; không dùng project rỗng | **RECOMMENDED** | Giữ package identity/default/reference và tránh copy feature nhiều lần |
| `V5-ADR-003` | Archive/reference bất biến; tạo gold 5.8.1 engine-only và candidate từ cùng tag | **RECOMMENDED** | Có oracle A/B mà mọi implementation active đều ở 5.8.1; gold hiện chưa tag |
| `V5-ADR-004` | PaldarkKit V4 là donor; PaldarkV5 là target codebase duy nhất | **PROPOSED** | Không tạo một cuộc convergence thứ hai |
| `V5-ADR-005` | Capability + single state owner là semantic unit; plugin chỉ là package/lifecycle boundary | **PROPOSED** | Không lặp plugin-per-class hoặc duplicate authority |
| `V5-ADR-006` | Core chỉ giữ universal primitives; domain contract ở semantic owner, dependency explicit/acyclic | **PROPOSED** | Không tạo god CoreContracts mới |
| `V5-ADR-007` | Lifecycle receipt chỉ tháo installation effect; committed gameplay dùng transaction/compensation | **PROPOSED** | Không dùng deactivate để rollback damage/item/capture |
| `V5-ADR-008` | GAS là action/effect provider; domain transaction vẫn có owner riêng | **PROPOSED** | Không ép Inventory/Build/Persistence qua ability |
| `V5-ADR-009` | Data policy hybrid: text cho architecture/evidence, Unreal asset cho designer data/presentation | **PROPOSED** | Có deterministic text index, không có hai source of truth |
| `V5-ADR-010` | Mỗi feature có dossier + gold human rehearsal; main playable, task branch có thể tạm hỏng | **PROPOSED** | Target khóa trước implementation |
| `V5-ADR-011` | Blueprint→C++ output vào staging; tool phải pass TQ0 và packet mang provenance | **PROPOSED** | Converter tăng tốc nhưng không tự quyết ownership/parity |
| `V5-ADR-012` | Full certificate yêu cầu zero authoritative Blueprint exception | **PROPOSED** | Có exception thì nhãn là `HYBRID` |

`ACCEPTED BY OWNER` chỉ dùng khi người sở hữu dự án đã nói rõ quyết định. `RECOMMENDED` và `PROPOSED` vẫn chờ duyệt; agent không được biến chúng thành code convention bằng im lặng.

## 5. Năm design gate trước code

| Gate | Câu hỏi phải đóng | Exit evidence |
|---|---|---|
| **P0 — Product contract** | KYWorld nào là gold, feature nào thực sự thuộc reference, target/platform nào được hỗ trợ? | Scope manifest, non-goal và gold-decision ledger |
| **P1 — Project strategy** | Candidate sinh ra thế nào, upgrade một chiều ra sao, object path/project rename xử lý lúc nào? | Baseline ADR được owner duyệt |
| **P2 — Core freeze** | Module, capability, owner, lifecycle, transaction, GAS, persistence và presentation seam là gì? | Core TDD + static dependency rules được duyệt |
| **P3 — Gameplay plan freeze** | Toàn bộ feature được phân rã thành unit nào, dependency DAG nào, mỗi unit kết thúc bằng evidence gì? | Gameplay roadmap + coverage ledger schema được duyệt |
| **P4 — Method qualification** | Converter, switch, rollback, A/B và human gate có thực sự giữ được một representative feature không? | Một pilot packet được duyệt; chỉ sau đó mới cho phép implementation |

P0–P4 là công việc hiện tại. W0–W12 là công việc tương lai và chưa tự động mở.

## 6. Thứ bậc nguồn quyết định

1. Runtime observation và evidence được pin build/hash.
2. Source, Asset Registry, graph export, config và Git history được pin commit.
3. Feature Dossier và ADR đã được owner duyệt.
4. Tài liệu Epic/Cordis/Lyra/UEFN và source donor.
5. Paldark V1–V4 như dữ liệu retrospective.
6. Trí nhớ hội thoại hoặc phỏng đoán của agent.

Nguồn thấp hơn được phép đặt câu hỏi; không được âm thầm ghi đè nguồn cao hơn.

## 7. Trạng thái hiện tại

- `V5-ADR-001` đã chuyển và chốt target UE5.8.1; installed engine đang quan sát là CL `56057345`. Full compiler/plugin/config lock vẫn là proposal của P1.
- Tài liệu Core, gameplay roadmap, conversion workflow và Completion Contract đang ở trạng thái proposal.
- PaldarkV5 candidate đã tồn tại và mở/build bằng UE5.8.1; chưa có immutable owner-approved gold tag.
- MCP + BPScaffold + NodeToCode v3 giữ 11 graph/169 raw node/164 semantic node + 5 knots, 604/604 pins, 65/65 exec edges và 145/145 data edges; 7 analysis artifacts byte-identical qua hai fresh Editor processes.
- UE5.8.1 build, BPScaffold 43/43 và ConversionPilot 3/3 tests pass. Tool vẫn fail-closed đúng: 59 partial nodes, 74 warnings, non-topology closure false, `graph_coverage_complete=false`, `conversion_ready=false`. `TQ0 NOT PASSED`, `P4 NOT PASSED`, bulk conversion vẫn khóa.
- Converter chỉ ghi `Saved/BPScaffold` staging; chưa được phép overwrite production `Content/Source`.
- Native `ABPPlayerCharacterNativePilot` tồn tại ở dormant posture cho 11/11 surface, không reparent/không Content change/không authority switch; parity vẫn partial và chưa có unit nào được approved/cutover theo P4.

Quyết định cần human được tập trung tại [V5/07-open-decisions](/V5/07-open-decisions), không rải thành câu hỏi ẩn trong prose.

Decision, capability, ownership, unknown và toolchain pin còn có [catalog máy đọc được](/V5/Catalogs/) để automation và agent không phải suy trạng thái từ văn xuôi.

Baseline hiện hành: [Project baseline UE 5.8.1](/V5/01-project-baseline-ue581). Quy trình tool: [MCP + Blueprint conversion pipeline](/V5/08-mcp-conversion-pipeline). Lộ trình học/triển khai 18 module, 127 bài: [Evidence-Driven Blueprint-to-C++ Migration](/V5/Course/).
