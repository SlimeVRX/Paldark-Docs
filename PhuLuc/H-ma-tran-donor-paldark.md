# Phụ lục H — Ma trận donor PaldarkLab, V2, V3 và PaldarkKit

Mục tiêu không phải chọn một codebase thắng cuộc. Mục tiêu là biết **lấy loại bằng chứng/implementation nào từ đâu**, rồi đặt nó sau contract đã duyệt.

Nguồn audit chính: [PALDARK PaldarkLab vs PaldarkV2 Source Code Audit](https://github.com/SlimeVRX/Soliz-Devin-PaldarkKit/blob/main/PaldarkLab/Docs/PALDARK_PaldarkLab_vs_PaldarkV2_Source_Code_Audit_VI.md), [V3 Technical Architecture](https://github.com/SlimeVRX/Soliz-Devin-PaldarkKit/blob/main/PaldarkV3/Docs/PALDARK_V3_Technical_Architecture_VI.md) và [V3 Implementation Status](https://github.com/SlimeVRX/Soliz-Devin-PaldarkKit/blob/main/PaldarkV3/Docs/PALDARK_V3_IMPLEMENTATION_STATUS_VI.md). Kết quả compile/test trong các tài liệu đó là evidence lịch sử của snapshot được audit, không tự động là HEAD hiện tại. Các liên kết source có thể yêu cầu quyền truy cập repository kỹ thuật.

## H.1 — Hồ sơ từng codebase

| Codebase | Điểm mạnh có evidence | Nợ/rủi ro | Vai trò hội tụ |
|---|---|---|---|
| PaldarkLab V1 | Breadth rất lớn: AI BT/tasks/services, build, capture/projectile, GAS/combat, craft/interaction/inventory, boss, progression, save, Pal/companion/work/world/UI. Audit ghi 407 runtime files, 64.614 dòng, Editor PASS và 94/94 tests ở snapshot. | Monolithic runtime, Experience bị Alpha path bypass, dual Health authority, nhiều AI coordinator cạnh tranh, multiplayer gap. | Donor **playable behavior/breadth**, từng class/flow, không nhập topology nguyên khối. |
| PaldarkV2 | Pipeline failure/transaction rõ, typed result/rejection, re-entry/idempotency tốt hơn; audit ghi 110 runtime files, 18.596 dòng, Editor PASS và 74/74 tests. | Scope nhỏ, một module lớn, ít networking/world/content. | Donor **invariant, failure path, transaction implementation**. |
| PaldarkV3 | Module boundary, command envelope, single writer, stable identity, transaction/persistence/telemetry contract; status ghi 13/13 tests và compile/package evidence ở snapshot. | Ít gameplay breadth, preview traversal, chưa multiplayer/playable Palworld loop. | Donor **contract spine/ADR baseline**. |
| PaldarkKit | Native GameFeature shell, current project/config/integration, 21 plugin ở HEAD, HUD/AI/capture/world work đang hoạt động ở mức source. | Over-split plugin, Core bloat/UMG, raw event bus, nhiều QA-only normal-path gap và vertical blockers. | **Project shell/strangler host**; sửa theo slice, không restart. |

## H.2 — Ma trận donor theo hệ thống 21–35

`Primary donor` không có nghĩa copy file. Agent phải đọc owner/invariant trước, kiểm license/phạm vi và port phía sau API mới.

| Ch. | Primary donor | Secondary/reference | Dùng phần nào | Không mang theo |
|---:|---|---|---|---|
| 21 Movement | Kit + Lab | KYWorld/course 02/13 | normal input, movement/presentation path; camera-relative pattern | base-character bloat, hard asset path |
| 22 Interaction | Lab | Kit, course 09/17, KYWorld assets | focus/interactable/pickup flow | target fixture/QA shortcut, binary graph assumption |
| 23 Inventory | Lab + V2 | course 09/17, Kit | fragments/containers/UI breadth + transaction/failure invariant | character façade, non-atomic direct mutation |
| 24 Crafting | V2 + Lab | course 17, KYWorld assets | reserve/plan/commit/refund + station/UI flow | sequential remove/add half-commit |
| 25 Combat | Lab + V2 | course 05/10/11/13, Kit | GAS/weapon/AI breadth + typed failure/ASC ownership | raw Health authority cạnh tranh |
| 26 Capture | Lab + V2 | Kit, KYWorld behavior/assets | projectile/presentation/flow + settlement/idempotency | client-provided verdict, destroy-before-commit |
| 27 Companion | Lab | V3 identity, Kit PalBehavior, course 11/15 | Pal AI/party/skill behavior + stable record/lease | nhiều AI coordinator cùng điều khiển pawn |
| 28 Build | Lab | Kit validation, course 17, KYWorld assets | preview/snap/structure lifecycle/UI breadth | owner/permission/state nằm rải ở actor |
| 29 Work | Lab | V3 activity invariant, Kit, course AI | scheduler/station/worker behavior breadth | tick/world scan, AI node sở hữu canonical job |
| 30 Progression | Lab | V2 result pattern, course 11/13 | graph/event/UI/save breadth | direct unlock từ feature không qua owner |
| 31 World | Lab | Kit, course spawner, KYWorld taxonomy | time/spawn/resource/world flow | all-relevant actor, unbounded scan |
| 32 Dungeon | Lab | course 11/15, V3 transaction | encounter/boss/reward flow + exactly-once reward | QA-only run state hoặc level hard-code |
| 33 Persistence | V3 | Lab/V2, course 11 | snapshot participant, generation/migration/recovery; broad field inventory | monolithic save, partial domain commit, fake relation success |
| 34 Multiplayer | V3 contract + courses 07/10/13 | Kit per-feature replication | state-by-state authority, identity/reconnect design | “Multiplayer” module quyết định gameplay verdict |
| 35 Breeding/Economy | Lab breadth + V2 transaction | KYWorld data taxonomy, Kit | farm/egg/vendor UI flow + atomic entity/item mutation | guessed dataset/formula, deferred stub được gọi là done |

## H.3 — Quy trình port một donor

1. Viết behavior contract và nguồn player value.
2. Ghi canonical state owner + invariant Paldark.
3. Đọc tối thiểu hai donor nếu có: một cho breadth, một cho failure correctness.
4. Liệt kê assumption của donor bị Paldark từ chối.
5. Chốt public typed API; Soliz duyệt.
6. Port **private behavior**, đổi identity/authority/data boundary theo contract mới.
7. Compile trong PaldarkKit.
8. Integrate normal path, không gọi donor QA fixture để tự set state.
9. Soliz chạy human test card.
10. Ghi bài học: donor đúng ở đâu, sai ở đâu, Paldark đổi vì sao.

## H.4 — Quy tắc chống “Frankenstein architecture”

- Không copy public interface của nhiều donor vào Core.
- Không giữ hai Health/Inventory/AI owner để “tạm tương thích”. Adapter chỉ có deadline và consumer rõ.
- Không port manager/god character trước khi tách responsibility.
- Không import một module chỉ vì có nhiều file; port behavior nhỏ nhất khép vertical outcome.
- Không dùng test count/LOC làm KPI gameplay.
- Không sửa donor source; PaldarkKit chứa implementation hội tụ và tài liệu ghi provenance.

Kết luận: **Kit là nơi ghép, V3 là luật, V2 là kỷ luật failure, Lab là gameplay donor, KYWorld là chuẩn hành vi/scope.** Đây là cách vừa đi nhanh vừa không đánh mất first-principles reasoning.
