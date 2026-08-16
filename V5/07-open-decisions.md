---
title: V5.7 — Quyết định cần người duyệt
description: Những điểm agent không được tự suy đoán trước khi khóa Core, gameplay roadmap và gold reference.
---

# V5.7 — Quyết định cần người duyệt

Đây là hàng đợi quyết định canonical. Câu hỏi được gom theo gate để người sở hữu dự án không phải tìm chúng trong nhiều trang prose.

## Ưu tiên A — chặn việc tạo project và gold

### `Q-V5-001` — Gold branch

**Dữ liệu:** main hiện ở `a6eab166`; gameplay tree kết thúc `dc776d8f`, ba commit sau chỉ README. `origin/TestTest@0fbf2517` chưa merge và thay ba asset liên quan riding, startup player và WorldMap.

**Cần owner chọn:**

- main hiện tại; hoặc
- main cộng ba asset từ `TestTest`, sau khi human xác nhận behavior tốt hơn.

**Khuyến nghị:** không đưa `TestTest` vào gold chỉ vì nó mới hơn. Chạy focused A/B ba asset trên disposable UE 5.6.1 copy rồi quyết định từng delta.

### `Q-V5-002` — Full-seed strategy

**Proposal:** repository game PaldarkV5 mới là full-history fork/clone của KYWorld, one-way upgrade 5.6.1, gold/candidate cùng engine. `Soliz-Blueprint-C` là tool repo riêng.

**Cần owner:** approve/reject.

### `Q-V5-003` — Project identity

**Proposal:** repository được tên PaldarkV5, nhưng giữ `.uproject`, `Palworld_Base` module và `/Game/...` paths trong parity phase; rebrand là migration riêng cuối chương trình.

**Cần owner:** có bắt buộc thấy project/module mang tên PaldarkV5 ngay khi W0 không?

**Khuyến nghị:** defer rename để bảo vệ serialized reference.

### `Q-V5-004` — Game repository

**Cần owner cung cấp:** tên GitHub repository/visibility/storage policy cho game V5. Không dùng nhầm `Soliz-Blueprint-C`, vì đó là converter tooling.

### `Q-V5-013` — Exact UE/toolchain/package baseline

P1 cần owner approve, không chỉ “máy đang có”:

- exact UE 5.6.1 Launcher changelist (local candidate hiện là `44394996`);
- Win64 Editor/Development/Shipping target bắt buộc;
- compiler/Windows SDK;
- plugin source/binary bắt buộc và exact UE 5.6.1 artifact/version.

P4 phải dùng lại đúng lock P1; không được chọn toolchain khác trong pilot.

## Ưu tiên B — chặn Core freeze P2

### `Q-V5-005` — Authority và multiplayer target

Chọn release target đầu tiên:

- solo-only;
- solo/listen co-op, authority-ready;
- dedicated-server-ready.

**Khuyến nghị:** nếu chưa có yêu cầu multiplayer cụ thể, thiết kế command/owner/ID theo authority-ready nhưng chỉ gate solo reference ở parity program. Không ép mọi wave dựng full replication/dedicated infrastructure chưa có trong KYWorld.

Chọn listen/dedicated tự động inject `NET-*`/reconnect/network-matrix units ở roadmap. P3 bị block cho tới khi các unit và certificate gate đó có owner/evidence schema.

### `Q-V5-006` — Persistence scope

Chọn:

- chỉ giữ state qua level/session;
- local save/load ra disk;
- production persistence có migration/recovery.

Core vẫn giữ stable ID/schema seam. Implementation depth phụ thuộc quyết định này.

Chọn local/durable disk save tự động inject `*-SAVE-*`, gồm journal/roll-forward riêng cho ResourceSettlement, Capture và ProductionCoordinator, cùng recovery/migration units. P3 bị block cho tới khi roadmap và certificate chứa đầy đủ overlay; session-only phải ghi decision ID thay vì để gate trống.

### `Q-V5-007` — Paldark compatibility

**Proposal:** V5 là target codebase duy nhất, tương thích với contract/invariant đã học từ V1–V4; PaldarkKit V4 là donor, không phải host cần merge lại.

Nếu owner yêu cầu chạy trực tiếp các PaldarkKit V4 plugin không sửa, module topology và debt V4 sẽ trở thành constraint khác hẳn. Cần nói rõ trước Core freeze.

### `Q-V5-007A` — Package và Game Feature topology

**Proposal:** bảy always-on project module (gồm PersistenceContracts tách storage implementation) + chín cohesive domain Runtime plugin + một `PaldarkIntegration` regular plugin; chỉ frontend/world profile wrapper dùng Game Feature vì có session lifecycle thật. Hai integration leaf nối World–Items và Creature–Combat; leaf đầu chỉ sở hữu ResourceSettlement transaction state, không sở hữu node/item.

**Cần owner:** approve package matrix và exact allowed-edge DAG ở Core TDD, hoặc nêu package nào cần deploy/activate độc lập thật sự.

### `Q-V5-007B` — GAS host và transaction atomicity

**Proposal:** Player ASC ở PlayerState và rebind Pawn; Pal ASC ở active Pal actor, persistent record không giữ UObject. Multi-owner command dùng semantic coordinator + revisioned reservation + commit decision + idempotent roll-forward; receipt không rollback committed gameplay.

**Cần owner:** approve policy này. Nếu persistence/network scope được chọn, journal/recovery và authority matrix trở thành unit bắt buộc trước P3.

## Ưu tiên C — chặn gameplay plan freeze P3

### `Q-V5-008` — Map classification

Trong 51 map, cần xác định:

- shipping/runtime roots;
- test fixtures;
- vendor/demo giữ để tham khảo;
- dead/unreachable có thể loại.

Agent có thể chuẩn bị census, nhưng owner/human cần xác nhận map nào là experience thật.

### `Q-V5-009` — Canonical playthrough

Cần một đường chơi gold có thứ tự, save/setup và video:

```text
Start → Customization → World
→ movement/interaction/resource
→ inventory/equip/combat
→ capture/party/PalBox/riding
→ craft/build/work/day-night/death/return
```

Video README là seed, không đủ cho failure/cancel/edge case. Human cần duyệt hoặc quay bổ sung theo test card agent cung cấp.

### `Q-V5-010` — Known bug policy

Khi KYWorld 5.6.1 gold có bug hoặc behavior xấu, owner chọn `PRESERVE_REFERENCE`, `KNOWN_REFERENCE_BUG` hoặc `INCONCLUSIVE` theo behavior row. Không có policy này, “100% giống” có thể vô tình thưởng việc tái tạo bug.

### `Q-V5-014` — Hardware và performance tolerance

Chốt hardware profile, resolution/fps cap và tolerance cho frame time, memory, load/travel cùng presentation timing. P3 cần các giá trị này để viết behavior/performance gate; P4 dùng chúng cho pilot.

## Ưu tiên D — chặn method qualification P4

### `Q-V5-011` — Converter pin

Pin exact `Soliz-Blueprint-C` commit/release, plugin version, supported UE build và **hai** named profile digests (`production_extraction`, `isolated_translator_qualification`). Tool output phải có provenance, `profile_id`, settings digest và per-surface zero-silent-omission manifest/certificate—not chỉ unsupported-node report.

Main remote đang quan sát ở `6b380a7d407a9a5ffde3050f6dda0e9bfa01abfc`; không mặc định đây là commit production-ready trước qualification.

### `Q-V5-012` — Human gate capacity

Owner cho biết:

- số card 3–5 phút có thể chạy mỗi ngày/tuần;
- có thể quay video/capture log không;
- input device, resolution, fps/hardware baseline;
- có thể giữ packaged gold build để A/B không.

Planner dùng capacity này để chia packet. Human gate ít không được xử lý bằng cách bỏ gate; phải làm packet lớn hơn có chủ ý và tăng automation ở phần state.

## Thứ tự trả lời đề nghị

Để tiến nhanh mà không khóa sai architecture, owner chỉ cần trả lời bốn nhóm theo thứ tự:

1. `Q-V5-001..004` + `Q-V5-013` để khóa project/gold/toolchain.
2. `Q-V5-005..007B` để khóa Core.
3. `Q-V5-008..010` + `Q-V5-014` để khóa gameplay atlas/performance oracle.
4. `Q-V5-011..012` để qualification converter và human gate.

Không câu hỏi nào cho phép agent bắt đầu code trước P4. Chúng chỉ làm design package chuyển từ `PROPOSED` sang `ACCEPTED`.
