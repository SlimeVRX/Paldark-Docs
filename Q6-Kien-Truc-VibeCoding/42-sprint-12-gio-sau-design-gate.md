# Chương 42 — Sprint 12 giờ sau design gate

> **Bắt đầu:** 2026-08-04 22:00 +07
> **Deadline cố định:** 2026-08-05 10:00 +07
> **Trạng thái:** `COMPILED_AWAITING_HUMAN_GATE`
> **Gate kỹ thuật của agent:** C++/UHT/link compile; không cook/package/multiplayer runtime trừ khi Soliz đổi scope.
> **Code checkpoint:** `61c3aaac` — full `PaldarkKitEditor Win64 Development` succeeded; human gate ở [Chương 43](43-human-gate-adr-001-capture-to-work.md).

Sprint không reset đồng hồ khi PR merge hoặc khi chờ feedback. Nếu thời gian duyệt kéo dài, scope bị cắt từ dưới lên; deadline không dời.

## 42.1 — North-star outcome

```text
Wild Pal xuất hiện
→ player làm yếu Pal
→ ném Sphere
→ server quyết định capture
→ Sphere settle đúng
→ đúng Pal rời world
→ đúng creature vào roster
→ summon
→ giao station
→ Pal đến nơi
→ output xuất hiện
```

Đây là một spine, không phải lời hứa hoàn thành toàn bộ Palworld trong 12 giờ. Giá trị của sprint là **khép càng nhiều mắt xích liên tiếp càng tốt**, không tạo thêm 15 scaffold rời.

## 42.2 — Thứ tự ưu tiên nếu ADR-001 được duyệt

### P0 — Repair contract đang chặn integration

**Outcome:** normal input chọn đúng target/kind; producer/consumer Work dùng một typed/versioned arrival schema; host/client input ownership có một rule.

Vì sao trước: HEAD đã có code hai phía nhưng chúng nói hai ngôn ngữ. Sửa schema mở lại Interaction, Work và log trace; thêm feature mới trước đó chỉ chồng lên blocker.

Không làm: big-bang event-bus rewrite. Chỉ đặt typed façade cho fields vertical spine cần.

### P1 — Capture settlement authoritative

**Outcome:** client chỉ gửi intent/aim; server lấy seed, damage/health snapshot và target; Sphere consume có refund/compensation; success remove/disable đúng actor và thêm đúng stable creature ID exactly-once.

Vì sao: đây là khoảnh khắc đặc trưng nhất của Palworld và là nơi hiện có lỗ authority/transaction rõ nhất.

Nguồn: course 05/11 cho GAS/projectile/health primitive; V2/V3 cho plan/commit/idempotency; KYWorld cho flow/presentation reference, không cho transaction proof.

### P2 — Roster/summon/world identity

**Outcome:** captured creature record sống độc lập actor; summon/recall dùng cùng stable ID; world lease không nhân đôi; roster có persistence participant theo player scope.

Vì sao: capture không có giá trị nếu kết quả chỉ là log hoặc actor rỗng.

### P3 — Work arrival và một output nhìn thấy

**Outcome:** assign một summoned Pal tới một station, reservation hợp lệ, PalBehavior báo arrival bằng typed event, Work bắt đầu timer và commit một output đúng một lần.

Vì sao: nó trả lời “bắt Pal để làm gì?” và buộc AI + Inventory + Work tích hợp thật.

### P4 — HUD/story feedback

**Outcome:** pending/rejection/success của capture, roster và work xuất hiện qua C++ view model + presentation hiện có; cùng `CorrelationId` với domain log.

Vì sao: logic đúng nhưng người chơi không thấy thì chưa phải gameplay. Nếu Blueprint wiring cần Editor, agent viết hướng dẫn và Soliz thực hiện.

## 42.3 — Timebox dự kiến

Các mốc chỉ có hiệu lực sau khi Soliz duyệt bốn quyết định ở Chương 39. Thời gian còn lại thật được ghi ở commit/PR, không lấy nguyên các con số mẫu.

| Cửa sổ từ deadline | Việc | Bằng chứng kết thúc |
|---|---|---|
| T-12h → T-11h | Audit + ADR + source map + design review | tài liệu 36–42; Soliz approve/reject rõ từng quyết định |
| T-11h → T-9h30 | P0 contract repair | compile; normal path static audit; test card interaction/work |
| T-9h30 → T-6h30 | P1 capture settlement | compile; typed result; idempotency/refund invariant; test card |
| T-6h30 → T-4h30 | P2 roster/summon | compile; stable ID/lease/persistence contract; test card |
| T-4h30 → T-2h30 | P3 work output | compile; typed arrival; transaction log; test card |
| T-2h30 → T-1h | P4 feedback/integration | compile; C++ view model; Blueprint steps nếu cần |
| T-1h → T-0 | Soliz chạy test card; agent sửa compile-scoped bug | human evidence ledger + decision cho sprint sau |

Nếu thời gian còn dưới 6h khi design gate mở, ưu tiên P0→P1. Nếu dưới 3h, chỉ làm P0 hoặc một invariant P1 trọn vẹn; không mở P2/P3 dang dở.

## 42.4 — Những việc bị loại khỏi sprint

- mở feature/plugin mới;
- full Combat migration sang GAS nếu nó làm capture settlement không kịp khép; thay vào đó contract phải không chặn migration tiếp theo;
- Build, Dungeon, Breeding/Economy content expansion;
- cloud/AWS/GameLift, matchmaking, dedicated acceptance;
- cook/package mỗi PR;
- multiplayer runtime testing;
- sửa validator PaldarkV3 đỏ từ base nếu không chặn compile;
- data entry hàng loạt, format/restructure docs không liên quan;
- mass-move 21 plugin theo architecture proposed;
- viết test harness QA tự set state thay normal path.

“Bị loại khỏi sprint” không có nghĩa bị loại khỏi sản phẩm. Chúng bị hoãn vì không tăng độ dài vertical spine trong deadline hiện tại.

## 42.5 — PR dự kiến và countdown

Tên chỉ là contract đầu ra; số giờ phải được tính lại lúc tạo PR.

```text
PR-A: Typed interaction and arrival contract + <remaining>
PR-B: Authoritative capture settlement + <remaining>
PR-C: Stable roster and summon lease + <remaining>
PR-D: Pal work arrival to visible output + <remaining>
PR-E: Player feedback and human-test handoff + <remaining>
```

Footer:

```text
Countdown: T-<hh>h<mm>m | deadline 2026-08-05 10:00 +07
```

Không tạo cả năm PR nếu PR trước chưa đạt compile và không còn là dependency sạch cho PR sau.

## 42.6 — Soliz là cánh tay nối dài ở đâu

### Ngay tại design gate

Trả lời `APPROVE` hoặc sửa bốn quyết định:

1. system không đồng nghĩa GameFeature;
2. V3 invariant là baseline, không scaffold topology;
3. raw bus được thay dần bằng typed contract theo slice;
4. vertical spine capture→roster→work là hướng đầu tiên.

### Khi có test card

- checkout/build commit được chỉ định;
- thực hiện đúng input, không thêm bước tự cứu;
- trả `PASS/FAIL`, video và mọi dòng có `CorrelationId`;
- mô tả game feel riêng sau câu trả lời kỹ thuật.

### Khi Blueprint chặn agent

Agent phải đưa:

- asset/class cần tạo hoặc mở;
- parent C++ class;
- từng property/event binding;
- tên/path asset;
- expected screen result và log;
- cách undo nếu sai.

Soliz thao tác Editor rồi trả ảnh/video. Agent không được thay việc đó bằng suy đoán rằng Blueprint đã đúng.

## 42.7 — Điều kiện dừng

Sprint dừng mở scope khi:

- deadline tới;
- compile bị chặn bởi môi trường ngoài scope và ba đường khắc phục an toàn đã thử;
- design cần một quyết định mới từ Soliz;
- source Palworld/KYWorld cần Blueprint graph hoặc data chưa có;
- PR hiện tại chưa khép invariant nhưng task tiếp theo chỉ tạo thêm state rời.

Kết thúc sprint phải có: đoạn spine dài nhất đạt `COMPILED`, đoạn nào đạt `USER_VERIFIED`, bug nào còn có correlation/evidence, và quyết định tiếp theo. Không dùng số PR làm KPI.
