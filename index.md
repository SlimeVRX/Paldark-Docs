# Paldark: từ scaffolding tính năng đến gameplay có thể kiểm chứng

## Một mô hình composability, clean-room reconstruction và harness khởi động lại an toàn

> **Loại tài liệu:** bài nghiên cứu/thiết kế nội bộ có thể kiểm toán
> **Snapshot lập luận:** 2026-08-16
> **Trạng thái:** đề xuất kiến trúc, chưa phải tuyên bố implementation-complete
> **Phạm vi:** Paldark, PaldarkKit, corpus KYWorld và kế hoạch tái dựng được ủy quyền

## Tóm tắt

Một game có thể có rất nhiều module, class, asset và commit mà vẫn làm người chơi thất vọng ở một hành động đơn giản: đi đến một vật thể, nhấn F, nhặt tài nguyên, mở HUD, rồi thấy số lượng không đổi; bấm V lần thứ hai và một con vật bị kéo về vị trí cũ; hoặc thoát game rồi quay lại để nhận ra quan hệ giữa người chơi, vật phẩm và công việc đã biến mất. Khoảng cách giữa “có nhiều thứ trong repository” và “một đường chơi bình thường có kết quả đúng” là đối tượng của bài này.

Bài viết đề xuất Paldark như một mô hình lập luận và một tập nguyên tắc triển khai, không phải một framework Unreal đã hoàn tất. Trung tâm của mô hình là tách ba việc thường bị trộn: lắp đặt một capability có thể tháo dỡ, commit một thay đổi gameplay có chủ sở hữu và thu thập bằng chứng đủ mạnh để nói rằng thay đổi ấy đã quan sát được. Một Paldark component khai báo nó cần gì, cung cấp gì, sống trong scope nào, ai có quyền ghi, effect cài đặt nào có inverse, transaction nào chỉ có thể bù trừ, và bằng chứng nào cần để được nâng cấp trạng thái.

Lập luận này học từ hai nguồn công khai nhưng không đồng nhất chúng với Unreal. Bài *A Programming Paradigm for Spatiotemporal Composability* của Cordis được dùng như nền tảng khái niệm về effects, coeffects, temporal composability và spatial composability; bản được khóa ở draft ngày 2026-08-13. DeepSeek Harness được đọc qua repository và tài liệu kiến trúc công khai ở trạng thái developer preview, đặc biệt heuristic “Everything is a Plugin” và seam Service Definition → Provider → Consumer. Chúng tôi không có và không suy đoán chain of thought riêng tư của bất kỳ hệ thống nào. Unreal modules, plugins, Game Feature Plugins, Game Feature Actions, Modular Gameplay, GAS, Gameplay Tags/Messages, Lyra Experiences và UEFN devices chỉ là các correspondence có giới hạn.

Empirical diagnosis dựa trên snapshot Paldark/KYWorld, các tài liệu Paldark, source và Git history có thể truy vết. KYWorld có giá trị như behavioral/reference corpus ở những lát cắt có evidence; nó không phải architecture authority, giấy phép hay donor để chuyển Blueprint-to-C++. Maturity hiện tại được biểu diễn bằng ladder DESIGNED → SOURCE_PRESENT → COMPILED → INTEGRATED → PLAYER_OBSERVABLE → USER_VERIFIED → PARITY_EVIDENCED. Riêng snapshot Paldark được nêu rõ: 21 GameFeatures hiện là Active/static packaging, chưa có dynamic activation được chứng minh; Work → PalBehavior là dependency debt; registry còn là stub; event bus là synchronous; persistence và multiplayer mới ở QA-only; chưa có benchmark; Task 55 phải giữ UNKNOWN do thiếu trace build/observer/version đầy đủ.

Đóng góp của bài gồm: (1) một chẩn đoán 15 hệ thống player-facing ở các chương 21–35; (2) notation Paldark nguyên bản, các invariant và mệnh đề có điều kiện với assumptions, proof sketch và tín hiệu invalidation; (3) kiến trúc clean-room lab qua các stage CR-0 đến CR-8; (4) protocol Human/Sol/Luna/fresh reviewer dựa trên persisted artifacts và reconciliation sau restart; (5) kế hoạch đánh giá theo vertical slice, failure injection, ablation và human visual gate. Kết luận không phải “đã tái dựng xong”, mà là một decision gate: chỉ mở CR-0 sau khi con người phê duyệt architecture, provenance, observer, phạm vi và quyền dừng.

**Từ khóa:** gameplay architecture, temporal composability, coeffects, clean-room reconstruction, Unreal Engine, Game Feature, evidence ladder, transaction, human gate, restart-safe harness.

## Trạng thái và quy ước đọc

Đây là một bài nghiên cứu/thiết kế. Những câu mô tả repository, commit, source hoặc tài liệu được đánh dấu theo lớp evidence; những phần mang tính Paldark model, lab và protocol được đánh dấu là đề xuất. Không có bảng nào dưới đây biến tên asset thành bằng chứng runtime. Không có con số wall-clock nào được diễn giải thành person-hours. Không có technical review nào thay thế cho người dùng chạy normal input.

Bài viết giữ các chương cũ làm archive/reference corpus. Việc đưa lập luận vào một index duy nhất không xóa các route cũ và không biến chúng thành chứng cứ mới. Khi một người đọc muốn kiểm tra một claim, thứ tự nên là: claim trong bài → nhãn evidence → path/section/commit → giới hạn quan sát → gate cần có để nâng claim.

---

## 1. Một hành động nhỏ và khoảng cách lớn phía sau nó

Bạn đứng trước một mỏ quặng. Trong thiết kế, đường đi có vẻ ngắn: input F đi vào hệ thống interaction, target được tìm, item được thêm vào inventory, HUD nhận thông báo. Nhưng người chơi không nhìn thấy “đường đi” đó. Họ chỉ nhìn thấy một trong ba kết quả: quặng biến mất và số lượng tăng đúng; không có gì xảy ra; hoặc quặng biến mất nhưng số lượng, UI và trạng thái save không đồng bộ. Cùng một tên “pickup” có thể bao gồm query, quyền ghi, quantity ledger, animation, event và persistence; nếu không tách chúng, một patch nhỏ sẽ làm lộ nợ kiến trúc ở nơi hoàn toàn khác.

Đối với đội phát triển, dấu hiệu ban đầu thường là sự phong phú. Có GameFeature, plugin, DataAsset, GameplayTag, ability, widget, Blueprint và commit mang tên combat, capture hay multiplayer. Phong phú không xấu; nó chỉ trả lời câu hỏi “đã tạo ra artifact nào?”. Nó chưa trả lời “normal path có ổn định không, ai sở hữu trạng thái, retry có nhân đôi không, restart có giữ identity không, và người dùng đã thấy gì?”. Paldark bắt đầu từ việc không cho phép hai câu hỏi đó bị coi là một.

### 1.1. Bài toán

Bài toán có bốn lớp liên kết nhưng không thể gộp thành một phần trăm:

1. **Lớp player-facing.** Người chơi muốn di chuyển, tương tác, nhặt, chế tạo, chiến đấu, bắt creature, đặt building, giao việc và quay lại phiên chơi mà không mất quan hệ.
2. **Lớp runtime.** Hành động đi qua input, intent, owner, authority, state transition, commit/reject, event/snapshot và presentation.
3. **Lớp composition.** Capability được bật, nối, thay provider, đổi scope hoặc tháo ra mà không để lại listener, grant, timer, stale pointer hay state nửa cài đặt.
4. **Lớp evidence.** Mỗi kết luận phải nói rõ nó đến từ source, compile, integration, observation, user gate hay parity comparison nào.

Nếu chỉ giải quyết lớp runtime, đội có thể làm một vertical slice chạy được nhưng không biết cách bật/tắt hoặc thay provider. Nếu chỉ giải quyết composition, đội có thể xây một loader đẹp nhưng chưa có quantity transaction. Nếu chỉ giải quyết evidence, đội có bảng trạng thái mà không có behavior. Paldark là đề xuất đặt các lớp cạnh nhau, với owner và gate rõ, thay vì xem một lớp là đại diện cho tất cả.

### 1.2. Câu hỏi nghiên cứu

**RQ1 — Mô hình.** Một component gameplay nên khai báo requires, provides, lifecycle, identity, owner và evidence obligation như thế nào để lắp ghép theo thời gian mà không nhầm installation effect với committed gameplay?

**RQ2 — Chẩn đoán.** Snapshot PaldarkKit và KYWorld chứng minh được điều gì ở các mức source, compile, integration, normal play và parity? Những khoảng trống nào phải ghi UNKNOWN thay vì lấp bằng tên asset, README hoặc commit message?

**RQ3 — Correspondence.** Cordis, DeepSeek Harness, Unreal, Lyra, UEFN và GAS có thể giải thích lẫn nhau ở mức nào? Guarantee nào vẫn phải tự thiết kế vì không mechanism nào trong số đó cung cấp sẵn?

**RQ4 — Clean room.** Có thể tái dựng một hành vi tham chiếu bằng behavioral specification và code/asset độc lập, trong một lab tách khỏi PaldarkKit, mà không biến clean-room thành sao chép biểu đạt hay chuyển đổi tự động không?

**RQ5 — Liên tục qua restart.** Human, Sol orchestrator, Luna implementer và fresh Sol reviewer cần persisted artifacts, packet và reconciliation nào để công việc không phụ thuộc vào chat memory?

**RQ6 — Đánh giá.** Vertical slices, gates, metrics, ablation và failure injection nào phân biệt được breadth, integration health, player-observable behavior và reference parity?

### 1.3. Đóng góp và ranh giới

Bài này đóng góp một cách phân rã có thể falsify. “Có thể falsify” nghĩa là mỗi lựa chọn đi kèm assumptions và dấu hiệu cho thấy lựa chọn không còn phù hợp; đây không phải lời hứa rằng một mô hình trên giấy tự biến thành guarantee của Unreal. Các đóng góp cụ thể là:

- **Evidence discipline:** ladder bất biến và grammar cho claim, để COMPILED không tự động trượt thành PLAYER_OBSERVABLE.
- **Paldark component model:** notation mới cho installation effect, inverse, domain transaction, observation obligation và lifecycle; các mệnh đề chỉ là proof sketch có điều kiện.
- **Empirical baseline:** bảng 15 hệ thống từ chương 21 đến 35, retrospective PaldarkKit, các bài học Wave 2/Task 52/Task 55 và các boundary hiện hành của GameFeature/Work/registry/event bus.
- **Clean-room topology:** observation/specification room, implementation room, stable record + actor lease, typed contract graph và adapter-last.
- **Restart-safe protocol:** packet append-only, separation of powers, bounded retry, escalation, fresh review và human visual gate.
- **Evaluation design:** first playable slice boot → movement → interaction/resource → inventory HUD, rồi mới combat/crafting/build/creature/Work/persistence/network theo contract riêng.

Ranh giới cũng quan trọng không kém đóng góp. Bài không tuyên bố full Palworld parity, 1:1 clone, legal clearance, formal verification của Unreal, access vào private reasoning của DeepSeek, hay rằng mọi thứ nên là plugin. KYWorld không cấp quyền code, asset, Blueprint hoặc distribution. Paldark model không phải theorem về engine; implementation chỉ được mở sau architecture/provenance approval riêng.

---

## 2. Phương pháp và kỷ luật bằng chứng

### 2.1. Nguồn và lớp tri thức

Nghiên cứu dùng source hierarchy, trong đó primary local evidence được ưu tiên hơn commentary. Mọi local path trong bài được tính từ thư mục `Paldark-Docs`: corpus nằm ở workspace cha nên bắt đầu bằng `../`. Các local source chính gồm bài Cordis trong `../Documents/KYWorld/paper.pdf`, kế hoạch clean-room tại `../Documents/KYWorld/ke-hoach-tai-dung-kyworld-clean-room-cpp.md`, ghi chú NDC trong `../Documents/KYWorld/claudecode_note.txt`, tài liệu Paldark trong `../Documents/PALDARK`, source/test evidence trong `../PaldarkKit` và corpus `../02.Palworld/Documents` cùng `../02.Palworld/Source`. Các path này là provenance references trong workspace nghiên cứu; chúng không phải public links, và người đọc không nên hiểu một citation là quyền sử dụng hoặc permission sửa.

Public primary sources được link trực tiếp: [Cordis paper repository](https://github.com/cordiverse/paper), [Cordis source](https://github.com/cordiverse/cordis), [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness), [Harness architecture](https://raw.githubusercontent.com/deepseek-ai/deepseek-harness/master/docs/architecture.md), [Lyra sample game](https://dev.epicgames.com/documentation/en-us/unreal-engine/lyra-sample-game-in-unreal-engine), [Game Features and Experiences](https://dev.epicgames.com/documentation/en-us/unreal-engine/game-features-and-experiences-in-unreal-engine), [Modular Gameplay](https://dev.epicgames.com/documentation/en-us/unreal-engine/modular-gameplay-in-unreal-engine), [Gameplay Ability System](https://dev.epicgames.com/documentation/en-us/unreal-engine/gameplay-ability-system-for-unreal-engine), và [UEFN devices](https://dev.epicgames.com/documentation/en-us/fortnite/getting-started-with-devices-in-fortnite). Official pages mô tả mechanism; chúng không chứng minh KYWorld đã có behavior tương ứng.

Mỗi claim quan trọng dùng một hay nhiều nhãn:

| Nhãn | Ý nghĩa | Cạm bẫy cần tránh |
|---|---|---|
| [OBS-SOURCE] | đọc trực tiếp .h/.cpp, Git tree hoặc history | source presence không chứng minh runtime |
| [MEASURED] | đếm/tính theo phương pháp ghi rõ | snapshot không phải completion |
| [OBS-DOC] | đọc tài liệu đã commit hoặc ghi chú source | tài liệu có thể tổng hợp từ intent |
| [SELF-REPORTED] | README/GDD/roadmap của corpus | không phải independent runtime proof |
| [USER-REPORTED] | observer/human gate đã ủy quyền | phải có build, checkpoint, timestamp và giới hạn |
| [PRIMARY-PAPER] | định nghĩa/lập luận từ Cordis draft | không chuyển nguyên thành Unreal guarantee |
| [PRIMARY-EXTERNAL] | docs chính thức Epic/UEFN | mechanism không phải behavior của dự án |
| [SECONDARY] | synthesis/commentary | không dùng làm fact về adoption/biography |
| [INFERRED] | suy luận có tiền đề và mức tin cậy | phải nêu signal có thể bác bỏ |
| [PROPOSED] | thiết kế Paldark/lab/protocol | chưa phải hiện trạng |
| [UNKNOWN] | chưa đủ evidence | không đồng nghĩa “không tồn tại” |

Một citation tốt trả lời được bốn câu: artifact ở đâu, snapshot nào, điều gì quan sát được, và điều gì chưa được chứng minh. Ví dụ, source của PlayerCharacter có thể chứng minh một input-to-movement seam; nó không chứng minh jump, save, network authority hoặc UI state nếu các phần ấy nằm trong binary Blueprint hay chưa có focused gate.

### 2.2. Evidence ladder bất biến

Tất cả status gameplay trong bài dùng một ladder từ yếu đến mạnh:

~~~text
DESIGNED
  → SOURCE_PRESENT
  → COMPILED
  → INTEGRATED
  → PLAYER_OBSERVABLE
  → USER_VERIFIED
  → PARITY_EVIDENCED
~~~

| Mức | Được phép nói | Chưa được phép nói |
|---|---|---|
| DESIGNED | mục tiêu, giả thuyết hoặc contract đã viết | đã có code/asset/behavior |
| SOURCE_PRESENT | artifact/source/document trace tồn tại | compile, link hoặc runtime |
| COMPILED | UHT/compile/link theo command và target đã ghi | normal input, pose, transaction, persistence |
| INTEGRATED | các seam nối trong environment chỉ định | human đã thấy behavior |
| PLAYER_OBSERVABLE | normal path tạo outcome có thể thấy | user đã xác nhận hoặc parity |
| USER_VERIFIED | người được ủy quyền chạy focused gate và xác nhận checkpoint | parity rộng hơn contract/version đã ghi |
| PARITY_EVIDENCED | contract khớp reference version, có known deltas và provenance | clone hoàn chỉnh hoặc hệ thống không có reference evidence |

Ladder là monotonic cho một contract/version cụ thể, không phải một nhãn vĩnh viễn cho feature name. Khi contract đổi, evidence cũ không tự động áp dụng. Khi build hash, map, config hoặc observer metadata thiếu, một report cũ có thể phải quay về UNKNOWN dù packet header từng ghi COMPILED hay SOL_REVIEW_ACCEPT.

### 2.3. Đo lường, thời gian và phần trăm

Git elapsed time là wall-clock envelope giữa hai mốc commit. Nó có thể bao gồm merge, idle, overlap, human setup và nhiều agent; nó không phải person-hours. Audit Paldark ghi nhận envelope ce1119df → a8d63560 khoảng 12 ngày 22 giờ 34 phút 24 giây; Wave 2 khoảng 34 giờ 05 phút 42 giây cho envelope của năm focused slices; Task 52 closure khoảng 4 ngày 03 giờ 55 phút. Những số này hữu ích để hiểu chronology và opportunity cost, nhưng không được cộng thành labor hay dùng để xếp hạng cá nhân.

Tương tự, số file, số dòng, số plugin, countdown, command duration, thời gian test và documentation volume là các loại measurement khác nhau. Wave 2 được ghi nhận khoảng 98 file và +12.948/-774 để tạo năm Human Gate liên tiếp; PR #135–#157 chạm khoảng 275 file và 17 plugin. Đây là tín hiệu về breadth và integration rework, không phải điểm chất lượng.

Phần trăm chỉ là heuristic snapshot khi phương pháp, mẫu số và timestamp được ghi. Ví dụ, 10.040 .uasset trên 10.173 tracked paths tại một census KYWorld cho phép nói “xấp xỉ 98,7% tracked paths là .uasset trong snapshot đó”; không cho phép nói “98,7% behavior đã hoàn thành” hoặc dự đoán xác suất gameplay. Maturity bands S0–S4 cũng là band evidence, không phải completion percentage.

### 2.4. Protocol đọc và kiểm toán

Mỗi hành vi nên được ghi theo trace:

~~~text
Input
  → Intent
  → Owner
  → State transition
  → Commit / Reject
  → Event / Snapshot
  → Presentation
~~~

Trace phải có cả failure path: target ngoài range, authority sai, provider mất, retry trùng, actor lease stale, reservation hết hạn, save lỗi hoặc observer không tái hiện được. Với mỗi lựa chọn kiến trúc, packet ghi rationale, assumptions, invalidation signal và fallback. Nếu chưa biết, ghi UNKNOWN và tạo observation task; không dùng absence của native C++ để kết luận binary Blueprint không có hành vi.

---

## 3. Chẩn đoán thực nghiệm: breadth chưa phải đường chơi

### 3.1. Corpus KYWorld và snapshot cần tách

KYWorld là một Unreal vertical slice có mức polish trình bày cao với movement/input, inventory/UI, equipment, bow combat, Pal, capture, PalBox, building/crafting, riding/flying, AI, world/life và nhiều binary Blueprint. Native snapshot được kế hoạch clean-room ghi nhận có một module, 34 file .cpp, 36 file .h và khoảng 2.919 dòng vật lý; tracked tree khoảng 10.173 path, trong đó 10.040 .uasset và 51 .umap theo census đã nêu. Đây là [MEASURED] của snapshot, không phải tỷ lệ behavior hay mức hoàn thiện.

Cần phân biệt commit 3d5a7dc, là mốc của source-architecture notes và Unreal 5.4, với HEAD a6eab166, là mốc tree được dùng cho census. README-only tail không được trộn vào chronology implementation. Các file dirty .vsconfig, .uproject và .idea được ghi nhận nhưng không được “làm sạch” trong nghiên cứu. Sự phân biệt này nhỏ về hình thức nhưng quyết định câu nào có thể truy vết: source trace ở một commit không tự nhận thêm behavior từ một README commit về sau.

Native layer có những seam có giá trị: PlayerCharacter thiết lập camera, Enhanced Input và camera-relative movement; BaseAbilitySystemComponent map input tag với ability spec và có grant/remove handle; BaseCharacter tạo ASC/AttributeSet khi possessed; equipment docs mô tả weapon data và ability handles; AI controller có perception/crowd seams. Ngược lại, InventoryComponentBase trong mẫu đọc là shell rỗng; inventory stack/quantity, capture, PalBox, UI graph và nhiều behavior nằm trong asset/document trace. Kết luận chính xác là SOURCE_PRESENT hoặc OBS-DOC cho những vùng ấy, không phải PLAYER_OBSERVABLE.

Tài liệu KYWorld mô tả capture theo đường F → target có PalDataComponent → chuyển profile vào Pal inventory → destroy actor; workbench theo F → InteractWith → kiểm tra completion → menu → validate recipe → RemoveFromInventory → AddToInventory; PalBox có party/storage/detail panel. Các mô tả này hữu ích để viết behavioral questions. Commit “building/crafting”, asset BP_PalSphere hoặc tên DataTable không chứng minh atomicity, reservation, rollback, identity preservation hay persistence.

### 3.2. Mười lăm hệ thống player-facing

Bảng dưới là maturity snapshot của các chương 21–35. Band S0–S4 trong kế hoạch clean-room được giữ lại như ngôn ngữ tóm tắt: S0 chưa có contract/runtime evidence; S1 có artifact/document/source scaffold; S2 có integrated/content trace hoặc nhiều commit phù hợp; S3 là player-observable trong reference version; S4 là version-locked parity evidence. Trong nghiên cứu này, không tự cấp S3/S4 cho KYWorld khi thiếu focused runtime record.

| Ch. | Hệ thống | Band snapshot | Evidence hiện có | Khoảng trống cần chứng minh |
|---:|---|---|---|---|
| 21 | Movement/Input | S2 | Enhanced Input, camera-relative movement, movement component, input tags | jump/sprint/crouch/swim/glide/mount, cancel và normal-input trace |
| 22 | Interaction/Gathering | S1–S2 | IInteractInterface, F flow, item/resource docs, Blueprint assets | range/LOS, contention, lifecycle tài nguyên, reject/idempotency |
| 23 | Inventory | S1 | GDD architecture, Blueprint slots/manager, native shell | stack/split/swap/drop/weight, reservation, save/load, authority |
| 24 | Crafting | S1–S2 | workbench docs, recipe/DataTable assets, commit history | atomicity, cancel/refund, breadth recipe, persistence |
| 25 | Combat | S2 cho GAS/equipment seam | GAS input, weapon data, bow/gun/melee history | focused damage authority, death/recovery, effect/status, normal fire |
| 26 | Capture | S1–S2 | Pal Sphere/capture docs/assets và commits | escape/failure, interruption, stable identity, persistence |
| 27 | Companion | S1–S2 | Pal base, PalBox/UI docs, riding/flying history | summon/recall, party/storage cardinality, defeat/recovery |
| 28 | Building | S1–S2 | tags/assets/commit history, workbench content | preview/commit/reject/demolish, collision và quantity |
| 29 | Work/Automation | S1 | WorkMenu/AI/cooking/spawn traces, chưa có native Work owner bền | suitability, queue, reservation, output, offline/authority |
| 30 | Progression/Technology | S1 | stat/level/DataTable assets, level-up commits | XP/unlock graph, stat ownership, migration/persistence |
| 31 | World/Life | S1 | map, day/night, spawn box, stamina commits | clock, weather, population, respawn, deterministic seed |
| 32 | Dungeon/Boss | S0–S1 | names/roadmap hoặc content trace ở mức giới hạn | room/boss/reward loop, resume và normal claim |
| 33 | Persistence | S0 | chưa có save/load proof trực tiếp trong corpus; binary có thể che behavior | save/quit/load, schema, migration, relation integrity |
| 34 | Multiplayer | S0–S1 | module dependencies và config trace; chưa có build/multiplayer proof | authority, replication, travel, reconnect, host/join, identity |
| 35 | Breeding/Economy | S0–S1 | roadmap/data references | formula, sacrifice/shop/stock, save và normal UI |

Điều nên rút ra từ bảng không phải “chỉ có vài hệ thống”. Ngược lại, bảng cho thấy các hệ thống có thể có nhiều dấu vết nhưng khác nhau về câu hỏi còn bỏ ngỏ. Movement có native seam mạnh hơn Work; capture có behavior description nhưng thiếu transaction identity; persistence và multiplayer không thể suy ra từ dependency declaration. Vì vậy first slice nên chọn movement/input → interaction/resource → inventory HUD, còn Work, persistence và multiplayer cần observation packet mới.

### 3.3. PaldarkKit hiện hành: các boundary phải nói rõ

PaldarkKit có một bài học quan trọng về tên gọi. Snapshot hiện hành ghi nhận **21 GameFeatures đều ở trạng thái Active/static packaging**; chưa có dynamic activation/deactivation được chứng minh bằng runtime evidence. Điều này không nói Game Feature system “không hoạt động”; nó nói claim hiện tại mới ở packaging/static registration. Một test bật asset lúc startup không tương đương test enable/disable giữa session, provider generation change, teardown và rebind.

**Work → PalBehavior dependency debt** là một debt kiến trúc cụ thể. Work cần PalBehavior để di chuyển, đến đích và phát arrival correlation, nhưng seam ownership và lifecycle chưa được đóng đủ. Khi Work tự điều khiển transform hoặc Presentation giữ assignment, lỗi snap/teleport và stale arrival trở thành khó phân biệt. Quyết định của mô hình là Work sở hữu assignment/progress/output; PalBehavior sở hữu movement/arrival; một arrival chỉ được settle nếu correlation và target lease còn hợp lệ.

**Registry còn là stub.** Tên registry hoặc interface không đủ chứng minh provider discovery, semantic version, generation, cardinality và deterministic resolution. Nếu registry chưa thực sự resolve/validate typed graph, composition host phải coi capability graph là DESIGNED/COMPILED tùy test, không tuyên bố reactive replacement. Fallback là explicit adapter registry trong composition host cho tới khi implementation có evidence.

**Event bus là synchronous.** Synchronous message bus hữu ích cho local deterministic ordering nhưng không tự trở thành durable event log, async queue, transaction journal hay replay mechanism. Một listener chạy trong cùng stack có thể thấy state giữa chừng nếu owner phát event trước commit. Vì vậy Paldark quy định command là request, event là fact sau commit, và durable log chỉ là đề xuất cho domain cần restart/replay.

**Persistence và multiplayer mới QA-only.** Có test/QA fixture hoặc dependency không đủ để nói người chơi Save/Quit/Load hay Host/Join/Reconnect trong normal path. Những capability này phải có contract, build/config, schema/authority metadata và human observation riêng. Nếu snapshot chỉ chứng minh QA-only, nhãn phải giữ QA-only/UNKNOWN, không nâng thành parity.

**Chưa có benchmark.** Không có baseline throughput, latency, memory, activation cost, replication cost hay player task time đã được khóa trong snapshot. Bài này không đặt ra con số hiệu năng giả. Evaluation plan định nghĩa cách thu benchmark sau khi contract ổn định.

**Task 55 là UNKNOWN.** Packet cũ ghi COMPILED — SOL_REVIEW_ACCEPT — AWAITING_HUMAN_GATE nhưng execution report thiếu editor build/version ID, map/config, observer timestamp và media SHA-256. Technical trace có baseline 69f9949…, implementation 4024569…, packet/evidence a8d6356…, UBT UE 5.6 succeeded; những hash đó là source/packet trace, không phải gameplay build identity. Report có các observation Work drift/snap và carry upside-down đã sửa, first-V aim rejection/Chicken hold đạt, nhưng second-V ở station không hợp lệ vẫn fail khi CancelManualHold khôi phục transform cũ như teleport; Work/self-haul/combat gate còn lại chưa hoàn tất. Do thiếu metadata version-lock, status phải giữ [UNKNOWN], paused; không được nâng PLAYER_OBSERVABLE, USER_VERIFIED hay parity.

### 3.4. Retrospective: breadth trước normal path

Audit Paldark cho thấy các pattern tích cực và tiêu cực cùng tồn tại. Stable IDs, explicit ownership, authority checks, reservation/escrow, evidence level, compile và independent review là các thói quen tốt. Chi phí cao thường đến từ horizontal breadth trước normal path, task có nhiều outcome, Editor discovery muộn, status fragmentation, nhầm Unreal Owner với domain principal, Unity symbol collision, human gate quá dài và manual assignment có ROI gameplay thấp hơn setup burden khi mở quá rộng.

Wave 2 và Task 52 cho thấy wall-clock envelope có thể chứa nhiều merge/overlap/idle. Vì vậy mục tiêu không phải giảm mọi số giờ bằng khẩu hiệu, mà là làm packet một seam, human gate sớm, compile/static hẹp và chỉ cook/package/multiplayer/CI khi acceptance criteria yêu cầu. Đây là một quyết định kinh tế có thể kiểm tra bằng ablation: so sánh breadth-first với vertical-slice-first trên cùng một loại contract, không so sánh người với nhau bằng timestamps.

Task 55 là boundary lesson rõ hơn một bug cụ thể. Một hàm có tên CancelManualHold có thể thật sự hủy một installation-like hold nhưng không được giả định nó rollback transform canonical, output đã commit hoặc damage. Khi second-V thất bại ở station không hợp lệ, câu hỏi đúng là owner nào quyết định cancellation và transform nào là state canonical; câu hỏi sai là “có thể gọi thêm clear/remove để quay lại như cũ không?”. Mô hình transaction được đưa ra để ngăn việc dùng unregister như rollback.

---

## 4. Tiền đề lý thuyết: hiệu ứng, yêu cầu và khả năng quan sát

### 4.1. Vì sao cần lý thuyết vừa đủ

Khi một component được bật, nó thường làm nhiều việc nhỏ: đăng ký listener, thêm input mapping, tạo timer, grant ability, mở UI slot, đăng ký provider. Khi component bị tắt, chúng ta muốn những việc đó biến mất theo reverse order. Đây là vùng mà ngôn ngữ effect/inverse hữu ích.

Nhưng damage đã gây ra, vật phẩm đã chuyển, capture đã commit, building đã đặt, output đã spawn, save đã ghi hay event đã gửi ra mạng không cùng loại với listener registration. Chúng có một owner, authority và commit point; gọi remove listener không làm quantity quay lại. Vì vậy lý thuyết chỉ được dùng để đặt câu hỏi và ranh giới, không phải để dán nhãn “rollback” lên mọi thao tác.

### 4.2. Các khái niệm bằng ngôn ngữ gameplay

**Context** là môi trường typed mà component đọc và biến đổi: world, player, provider table, inventory ledger, clock, authority và presentation view. **Effect** là thay đổi do component gây ra trên context. Một effect cài đặt có handle và inverse rõ có thể là reversible installation effect.

**Coeffect** là điều kiện component đặt lên context. Ví dụ, Combat cần một Health authority version phù hợp, một Targeting provider ở world scope và một Gameplay Ability policy có generation cụ thể. Nếu coeffect không thỏa, component không nên nửa active rồi tự đoán provider.

**Temporal composability** là khả năng component có thể xuất hiện và biến mất trong chuỗi thời gian mà side effect của nó được thu hồi đúng phạm vi, không phá component còn sống. **Spatial composability** là khả năng nhiều component cùng tồn tại trong graph provider/consumer với dependency được khai báo và kiểm tra.

**Identity** là định danh ổn định của principal, creature hoặc relation; nó không đồng nghĩa với địa chỉ Actor hiện tại. **Ownership** trả lời ai là canonical writer. **Authority** trả lời execution nào được phép commit. **Scope** trả lời state sống theo world, session, player, pawn hay UI. **Transaction** là một thao tác có validation, reservation/escrow nếu cần, commit point, idempotency/correlation và failure semantics.

**Observational equivalence** không đòi hai implementation có cùng class, graph hay bytecode. Hai implementation được coi là tương đương quan sát trong contract nếu với tập input, pre-state, timing tolerance và authority đã khóa, người quan sát thấy cùng outcome, rejection reason, identity relation và các known delta đã khai báo. Đây là equivalence giới hạn; không có reference cho persistence hay multiplayer thì không có parity claim cho chúng.

### 4.3. Cordis và giới hạn khi chuyển sang Unreal

Bài *A Programming Paradigm for Spatiotemporal Composability* của Yifan Shi, Wei Zhang và Tianyi Cui (draft 2026-08-13) formalize effects, coeffects, revertible effects, reactive coeffects và calculus/metatheory; core/loader và Koishi case study nằm ở các phần sau. Paldark dùng các ý tưởng ấy như vocabulary để hỏi về lifecycle, provider identity và teardown. Paldark không sao chép notation, proof, algorithm hay diagram của bài; cũng không gọi các mệnh đề sau là theorem về Unreal.

Cordis paper v4 và discussion về deployed Koishi lineage v3 phải được giữ tách. Commentary phụ như paper-review.txt có thể giúp nhận diện những cách diễn giải hấp dẫn, nhưng không được dùng để tuyên bố biography, adoption, industry effectiveness hay implementation detail ngoài primary source. Tương tự, “Everything is a Plugin” của Harness được đọc như design heuristic công khai, không phải bằng chứng private reasoning hoặc công thức duy nhất.

### 4.4. Installation effect và committed transaction

Paldark chia mutation thành hai loại:

1. **Installation effect:** listener/message registration, input mapping/context, timer/cancellation handle, component/UI extension request, service/provider registration, ability grant handle và một ongoing effect có semantics removable rõ. Nó phải có scope, owner của handle và inverse.
2. **Committed gameplay transaction:** damage/heal đã settle, capture/defeat/summon, party/PalBox move, inventory transfer, quantity decrement, reservation/output, building placement, Work output, progression unlock, save, network/file/external effect. Nó cần domain owner, authority, correlation/idempotency, reservation/escrow và compensation có nghĩa; không được giả vờ inverse.

Phân chia này làm rõ tại sao Game Feature Action có thể dễ tháo registration nhưng không tự rollback damage, và tại sao ClearAbility không phải transaction journal. Một command có thể được reject trước commit mà không mutate canonical state; sau commit, failure recovery là domain policy, không phải generic teardown.

---

## 5. Mô hình lập trình Paldark

### 5.1. Component nguyên bản

Ta ký hiệu một Paldark component bằng bộ:

~~~text
P = ⟨id, ver, scope, req, prov, install, tx, obs, owner, life⟩
~~~

Trong đó:

- id là tên capability ổn định, ver là semantic version của contract;
- scope là world, session, player, pawn hoặc presentation;
- req là tập requires: capability, version/range, role, cardinality, provider generation và teardown policy;
- prov là tập provides: capability, identity scope, owner và lifecycle;
- install là chuỗi installation effects có handle và inverse;
- tx là tập domain commands/transactions mà component có quyền điều phối, mỗi transaction có commit policy;
- obs là observation obligations: input, output, failure, timing tolerance, build/config và gate;
- owner là canonical writer và authority policy;
- life là lifecycle từ declared, resolving, active, quiescing, inactive đến failed/recovery.

Một manifest tối thiểu có thể viết như sau; đây là contract proposal, không phải schema hiện có của PaldarkKit:

~~~yaml
feature: CreatureCapture
version: 0.1.0
requires:
  - capability: Interaction.Targeting
    version: '>=0.1 <1.0'
    lifecycle: World
    networkRole: Authority
    cardinality: one
    providerGeneration: required
provides:
  - capability: Creature.CaptureTransaction
    version: 0.1.0
    identityScope: StableCreatureId
    lifecycle: World
    cardinality: many
installation:
  teardown: reverse-handles
transactions:
  - CaptureRequest
observation:
  gate: PG-1/PG-4/PG-6
~~~

Manifest phải nói rõ resolution policy, timeout/quiescence, owner và provenance. Missing provider, cycle, generation mismatch hoặc ambiguous cardinality phải reject trước khi half-activate. Nếu provider thay generation, consumer phải re-resolve, rebind hoặc deactivate; stale pointer không phải provider continuity.

### 5.2. Lifecycle và state ownership

Lifecycle đề xuất:

~~~text
DECLARED → RESOLVING → ACTIVE → QUIESCING → INACTIVE
                    ↘ FAILED → RECOVERY / ESCALATION
~~~

DECLARED chỉ nói contract tồn tại. RESOLVING kiểm tra graph. ACTIVE cho phép installation effects và domain commands theo authority. QUIESCING ngừng nhận command mới, đợi callback hợp lệ, đóng lease và flush event/snapshot theo policy. INACTIVE không giữ registration ngoài scope. FAILED phải lưu reason, correlation và artifact; không tự retry vô hạn.

| State/capability | Canonical owner | Presentation được phép |
|---|---|---|
| principal/player relation | PlayerState hoặc principal record | đọc snapshot |
| pawn/input embodiment | Pawn/Controller boundary | phát intent |
| creature identity | Creature record | hiển thị identity |
| inventory quantity/reservation | Inventory domain | hiển thị view model |
| health/damage settlement | Health/Combat authority | hiển thị feedback |
| capture/party/PalBox | Capture/Companion domain | phát request, đọc result |
| assignment/progress/output | Work domain | hiển thị trạng thái |
| movement/arrival | PalBehavior/Movement | phát input, không settle output |
| HUD/animation/audio | Presentation | không ghi canonical gameplay |
| save record | Persistence | yêu cầu save, không tự serialize owner |

Unreal Owner của Actor không tự giải quyết các hàng này. Một Pawn replacement không được làm mất principal identity; một Actor despawn không được làm mất stable creature record nếu contract cho phép respawn; một HUD restart không được tăng quantity. Đây là invariants cần test.

### 5.3. Invariants

**I1 — Một canonical writer.** Với mỗi key gameplay, tại một scope và generation, chỉ một domain owner có quyền commit. Các view, message listener và adapter không được mutate canonical state.

**I2 — Dependency được khai báo.** Consumer chỉ active nếu tất cả required providers thỏa version/range, scope, role, cardinality và generation. Dependency ẩn qua global singleton là debt cần ghi.

**I3 — Installation reversible trong phạm vi hẹp.** Mọi installation effect được ledger giữ handle, owner, creation order và inverse; teardown reverse order khi quiescence cho phép.

**I4 — Gameplay commit transactional.** Command có validation, authority, reservation/escrow nếu quantity, commit point, correlation/idempotency và reject reason. Không gọi unregister là rollback cho committed mutation.

**I5 — Identity không phụ thuộc lease.** Stable record sống qua actor spawn/despawn theo contract; actor là embodiment/lease có thể thu hồi.

**I6 — Evidence monotonic theo contract.** Không promote status nếu thiếu gate tương ứng. Evidence mới có thể hạ một claim cũ về UNKNOWN khi phát hiện metadata không đủ hoặc observation mâu thuẫn; việc hạ phải append finding, không xóa lịch sử.

**I7 — Không promote không gate.** Compile, reviewer accept hoặc asset census không tự cấp PLAYER_OBSERVABLE, USER_VERIFIED hay PARITY_EVIDENCED.

**I8 — Event sau commit.** Event gameplay là fact sau domain commit; synchronous bus không được xem là durable log hoặc transaction boundary.

**I9 — Bounded recovery.** Retry có giới hạn và correlation; sau ngưỡng phải tạo escalation packet hoặc reconciliation block, không loop.

### 5.4. Mệnh đề có điều kiện và proof sketch

Các mệnh đề dưới đây là công cụ thiết kế. Chúng không là formal theorem về Unreal, không chứng minh UHT, networking hoặc arbitrary Blueprint behavior.

**P1 — Local recovery.** Nếu component chỉ mutate context qua installation effects có inverse total/correct, ledger giữ đủ creation order và không có external actor ghi cùng key, tháo component trong trạng thái quiescent sẽ khôi phục observational context trước activation.

*Assumptions:* mutation đi qua context/ledger; inverse đúng và vẫn có state cần thiết; callback async đã dừng; không có external side effect. *Proof sketch:* ledger duyệt reverse order; mỗi inverse trả key về pre-state; vì không có writer ngoài ledger, composition của inverse khôi phục context trong contract. *Invalidation:* API bypass ledger, callback chạy sau teardown, inverse cần object đã bị destroy, hoặc cùng key bị domain commit trong lúc quiesce. *Fallback:* chuyển key sang domain transaction, thêm quiescence barrier hoặc giảm scope.

**P2 — Dependency coherence.** Nếu requires/provides typed, resolution deterministic và generation được theo dõi, consumer chỉ active khi provider set hợp lệ; provider đổi generation khiến consumer rebind hoặc deactivate thay vì đọc stale view.

*Assumptions:* semantic version có nghĩa; cardinality hữu hạn; provider identity ổn định trong generation; host phát change trước khi view cũ bị thu hồi. *Proof sketch:* resolver kiểm tra từng edge; activation chỉ commit khi tất cả edge pass; generation mismatch làm guard fail ở lần đọc/rebind. *Invalidation:* hai provider cùng match nhưng resolution không deterministic, pointer đổi không phát notification, hoặc consumer cache state ngoài contract. *Fallback:* explicit adapter registry, generation token trong mọi query, hoặc fail closed.

**P3 — Activation containment.** Nếu dependency graph acyclic, activation quiescent và installation effects được commit atomically ở host, một component lỗi giữa chừng không để consumer thấy committed view nửa cài đặt.

*Assumptions:* host có prepare/commit boundary; required provision không optional ngoài manifest; callbacks không re-enter activation; rollback installation còn khả dụng. *Proof sketch:* resolver dựng plan trước; host lắp effects vào staging, chỉ publish provider view sau commit; lỗi chạy inverse staging. *Invalidation:* cycle, callback reentrancy, provider tự mutate khi đang staging, hoặc external side effect không reversible. *Fallback:* chia stage, publish read-only pending state hoặc đánh dấu activation failed và yêu cầu human review.

**P4 — Restart reconciliation.** Nếu canonical artifacts là append-only, packet có expected HEAD/hash, và reconciliation đọc canonical index → repository state → latest transition theo thứ tự cố định, restart sẽ không dựa vào chat memory để chọn next action.

*Assumptions:* artifacts được persist atomically đủ để đọc; hash/HEAD có thể kiểm tra; không có hai root authority cùng ghi packet; thứ tự reconciliation là deterministic. *Proof sketch:* restart dựng state từ artifact mới nhất thỏa hash/ownership; mismatch dừng ở RECONCILIATION_BLOCKED thay vì đoán. *Invalidation:* artifact mất, hash không khóa input, dirty baseline không ghi, hoặc người restart tự ý bỏ qua block. *Fallback:* human/root decision packet, restore artifact từ bản backup, hoặc reset stage bằng decision mới; không xóa lịch sử.

**P5 — Integration containment.** Nếu adapter chỉ map neutral contract, canonical owner giữ nguyên, và feature activation/teardown được gate riêng, lỗi adapter không làm di chuyển ownership sang presentation hoặc tạo canonical duplicate.

*Assumptions:* neutral IDs không trùng Paldark private IDs ngoài registry, adapter không tự commit domain state, integration test có protected-path audit. *Proof sketch:* command đi qua domain owner; adapter chỉ translate input/result; duplicate key detector bắt instance thứ hai. *Invalidation:* adapter cần private state, UI ghi quantity, hoặc mapping không giữ identity generation. *Fallback:* dừng CR-8, thu nhỏ seam, thêm query interface hoặc giữ lab độc lập.

**P6 — Evidence monotonicity.** Nếu mỗi promotion yêu cầu gate có artifact/version/checkpoint và status append-only, COMPILED không thể hợp lệ tự nâng thành PLAYER_OBSERVABLE chỉ bằng việc thêm commit.

*Assumptions:* gate policy immutable trong scope, reviewer không bỏ qua required evidence, status gắn contract/version. *Proof sketch:* promotion function kiểm tra prerequisite; source/compile artifact thiếu runtime checkpoint nên reject. *Invalidation:* status parser coi filename/header là observation, hoặc gate bị sửa ngược mà không có decision record. *Fallback:* immutable schema, independent reviewer và audit cảnh báo.

**P7 — Narrow confluence.** Hai installation components độc lập hoặc cùng-key effects commute trong điều kiện không có failed fibers và deterministic observation sẽ đạt outcome quan sát tương đương dù thứ tự interleave thay đổi.

*Assumptions:* không tranh chấp quantity/health/slot; side effect ngoài context không xảy ra; observer xem cùng boundary. *Proof sketch:* commute cho phép đổi thứ tự; post-state và event set tương đương trong contract. *Invalidation:* cùng quantity, network/file/UI side effect, random seed khác hoặc event synchronous nhìn state giữa chừng. *Fallback:* serialize qua owner, thêm transaction boundary và ghi order vào contract.

### 5.5. Vì sao registry, event bus và GameFeature cần boundary

Một registry stub có thể tồn tại dưới dạng class, interface hoặc map nhưng chưa hứa provider discovery. Paldark chỉ gọi registry active khi nó resolve semantic version, scope, cardinality, generation, owner và teardown policy; trước đó, registry là SOURCE_PRESENT/COMPILED tùy test. Event bus synchronous có thể phát event local sau commit, nhưng không tự chứa durable sequence, replay, exactly-once hay cross-process authority. Nếu cần persistence/restart, domain phải ghi durable record hoặc journal có schema và migration.

Tương tự, 21 GameFeatures Active/static packaging là packaging fact. Dynamic activation cần một human-observable test: bật feature trong session, kiểm tra required provider, chạy normal input, deactivate, kiểm tra listener/timer/UI/grant được tháo, rồi re-activate và không duplicate. Nếu chưa có test đó, proposal về temporal composability vẫn là DESIGNED dù packaging đã compile.

---

## 6. Correspondence với Unreal, Lyra, UEFN và DeepSeek Harness

### 6.1. Bảng correspondence và guarantee còn thiếu

| Mechanism công khai | Correspondence hữu ích | Guarantee Paldark vẫn phải bổ sung |
|---|---|---|
| Unreal module | compile-time boundary và dependency thấp tầng | không tự unload component, inverse ledger hay runtime provider generation |
| Ordinary plugin | đóng gói code/content | provenance, semantic provider identity và teardown không tự đủ |
| Game Feature Plugin | activation boundary cho feature domain | không rollback arbitrary gameplay mutation |
| Game Feature Action | lắp input/component/UI/service, giữ handle | action không tự undo damage, capture, quantity đã commit |
| Modular Gameplay | request/extension handle | không đảm bảo mọi async callback ngoài handle đã dừng |
| GAS | ability/effect/tag, grant/clear, prediction | không universal rollback damage/item/capture; owner/lifetime vẫn cần |
| Gameplay Tags/Messages | vocabulary và notification seam | message không phải authority, command validation hay durable transaction |
| Subsystem | lifetime theo engine/world/game instance/player | không phải typed requires/provides graph hoàn chỉnh |
| ActorComponent | composition cục bộ của Actor | không thay domain owner hoặc giải quyết cross-actor transaction |
| Lyra Experience | bootstrap ruleset/pawn/data/features cho session | selection không chứng minh dynamic removal exactness hay parity |
| UEFN device | placeable actor với editable config/events | không phải generic C++ transaction model hoặc license |

Correspondence trả lời “cơ chế nào gần nhất?” rồi ngay lập tức phải trả lời “bảo đảm nào chưa có?”. Nếu chỉ ghi tên mechanism, người đọc dễ suy ra Unreal đã hiện thực Cordis. Paldark từ chối suy luận đó.

### 6.2. “Everything is a Plugin” như heuristic

Heuristic của DeepSeek Harness có ích khi buộc một capability có boundary, contract, lifecycle và cách thay thế rõ. Nó nguy hiểm nếu biến thành mệnh lệnh biến mỗi class, Actor, asset hoặc helper thành plugin. Một plugin quá nhỏ tăng dependency graph, load order và version burden; một plugin quá lớn lại thành god feature không thể test/teardown. Granularity nên theo cohesive domain và một seam có thể quan sát: Interaction, Inventory/Crafting, Combat, Creature, Build, Work.

Stable kernel nên giữ identity, principal, correlation/idempotency, authority vocabulary, lifecycle scope, contract schema, evidence schema, loader/registry rules, clock/random policy và narrow installation ledger. Game Feature Plugin giữ capability có thể bật/tắt độc lập sau khi kernel ổn định. Actor/Component/device giữ embodiment hoặc local state; Data contract giữ schema/definition; Experience chọn một session ruleset/featureset. Không có phần nào tự động sở hữu mọi transaction.

### 6.3. Service Definition → Provider → Consumer

Harness architecture công khai gợi một seam có giá trị: Service Definition mô tả capability; Provider đăng ký implementation với identity/lifecycle; Consumer yêu cầu capability và nhận một view đã resolve. Paldark bổ sung version/range, scope, network role, cardinality, generation, timeout, quiescence và teardown. Consumer không nắm pointer “vĩnh viễn”; nó giữ provider generation và phải rebind/deactivate khi generation đổi.

Một service registry thật phải trả lời: provider nào match, tại scope nào, ai là owner, khi nào provider ready, consumer nào phụ thuộc, callback nào cần dừng và event nào sau replacement. Registry stub chỉ là nơi đặt câu hỏi. Nếu resolution deterministic chưa có test, activation phải fail closed hoặc dùng explicit mapping trong composition host.

### 6.4. Durable event/log, synchronous bus và commit

Một synchronous event bus có thể truyền fact trong cùng process sau commit. Nó không tự là durable log vì process crash có thể mất sequence; cũng không tự là transaction vì listener có thể mutate ngoài owner. Với Work output, capture hoặc inventory transfer, domain owner phải commit record trước khi phát event. Durable log/logical journal là đề xuất cho những hành vi cần restart/replay: record schema, sequence, correlation, idempotency, migration và recovery policy phải được định nghĩa trước.

Paldark không yêu cầu mọi event phải durable. Một animation cue hoặc transient UI toast có thể là best-effort presentation event. Sự phân biệt nằm ở consequence: mất cue khác mất identity/quantity. Evaluation phải inject listener crash, duplicate delivery, provider replacement và process restart vào những domain được tuyên bố durable.

### 6.5. Lyra, GAS và UEFN: học theo seam, không theo tên

Lyra cho thấy Experiences và modular composition có thể chọn ruleset/session, nhưng Paldark không dùng tên Lyra để kết luận một Experience đã có rollback hay persistence. GAS hữu ích cho ability/effect/tag và authority trong combat, nhưng inventory/capture/PalBox/Work không nên bị nhét vào một ASC chỉ vì ASC có handle. UEFN devices minh họa cách designer-facing actor có port/event/config rõ; điều đó không thay thế C++ domain owner, identity relation hoặc transaction semantics.

Các docs official Epic là [PRIMARY-EXTERNAL] để kiểm chứng API/engine semantics trước CR-0; local LyraFramework_Overview.pdf là [SECONDARY] synthesis và có lỗi encoding. Những correspondence này là lựa chọn thiết kế có điều kiện, không phải tuyên bố engine behavior đã được audit.

---

## 7. Kiến trúc tái dựng clean-room

### 7.1. Tại sao lab phải đứng riêng

KYWorld có thể là reference corpus mà không là donor implementation. PaldarkKit có thể là target integration mà không là nơi bắt đầu parity. Nếu implementer vừa nhìn Blueprint/source donor vừa sửa target private seams, provenance và ownership sẽ trộn; một thất bại không biết đến từ behavior spec, engine, adapter hay source copying. Vì vậy proposal đặt một PaldarkReconstructionLab conceptual, compile-time isolated trong giai đoạn parity.

Lab có thể discard khi giả thuyết sai. Adapter PaldarkKit chỉ xuất hiện ở CR-8, sau khi contract, provenance, transaction, runtime và human gates đạt. Đây là chi phí thêm nhưng làm cho fallback có thật: nếu capture contract chưa ổn, bỏ lab slice không làm hỏng PaldarkKit; nếu provenance không rõ, dùng placeholder tự author thay vì copy asset.

### 7.2. Two-room provenance policy

~~~text
Observation / Specification Room
  reference version, authorized observer, normal inputs,
  output, timings, state transitions, failure, unknowns,
  media hash và provenance

Implementation Room
  frozen behavioral contract, neutral IDs,
  original/licensed code/assets, tests, logs,
  không browse donor Blueprint/source sau khi freeze
~~~

Observer được ủy quyền mở reference, ghi input/output/state/failure, lưu build/version, map, config, timestamp, media hash và provenance. Specification author loại tên riêng và donor implementation khỏi contract khi không cần; contract nói pre-state, post-state, reject reason, timing tolerance, authority, identity và unknown. Implementer chỉ nhận spec đã freeze, dùng code/asset độc lập có manifest. Nếu ambiguity buộc phải xem donor, task dừng, lập provenance decision: ai xem, thấy gì, vì sao, ảnh hưởng clean-room ra sao, có reset context không.

Clean-room không có nghĩa là giả vờ không biết behavior. Nó nghĩa là tách hành vi cần tái tạo khỏi biểu đạt/code/asset cụ thể của donor. Behavior observation được phép nói “nhấn F gần Ore, quantity tăng một, UI hiển thị slot”; không cần nói graph Blueprint có node nào. Nếu observation không đủ để phân biệt các giả thuyết, ghi UNKNOWN và thiết kế thêm test.

### 7.3. Topology

~~~text
PaldarkReconstructionLab
│
├─ Foundation
│   stable IDs, principal, correlation/idempotency, Result/Failure,
│   authority, lifecycle scope, clock/random, narrow ledger
├─ Data
│   definitions, schema, validators, PrimaryAsset/DataRegistry adapters
├─ CompositionHost
│   Experience/ruleset, Game Feature activation, requires/provides,
│   provider identity/generation, quiescence/teardown checks
├─ Domain owners
│   Interaction, Inventory, Crafting, Build, Health, Combat,
│   Creature, Capture, Companion/PalBox, Work
├─ Presentation
│   view models, HUD, animation/audio feedback; không canonical write
└─ PaldarkAdapter
    CR-8 only, maps neutral proven contracts to target seams
~~~

Sơ đồ dưới đây nhấn mạnh rằng input không đi thẳng vào presentation hay Actor tùy ý. Nó đi qua intent, owner và commit boundary trước khi tạo event hoặc snapshot:

~~~mermaid
flowchart LR
  Input["Input"] --> Intent["Intent"]
  Intent --> Authority["Authority check"]
  Authority --> Owner["Domain owner"]
  Owner --> Decision{"Commit or reject"}
  Decision --> Event["Event or snapshot"]
  Decision --> Reject["Reject reason"]
  Event --> View["Presentation view"]
~~~

Điểm cần đọc là nhánh Reject cũng là outcome có hợp đồng; nó không phải một exception bị bỏ qua. Presentation chỉ đọc Event hoặc snapshot, nên restart HUD không thể tự ghi quantity.

Foundation và Data là conventional modules vì chúng tạo trust boundary ổn định. Cohesive Game Feature Plugins giữ domain có thể activate/deactivate. Experience chọn một feature set có version. DataAsset/PrimaryAsset chứa definitions; không tự settle transaction. Presentation subscribe snapshot/event; không giữ quantity, identity hay assignment canonical.

### 7.4. Stable record và actor lease

Actor thường bị dùng như identity vì nó dễ thấy, nhưng actor có thể despawn, respawn, replicate khác generation hoặc bị thay khi Pawn possession đổi. Paldark tách stable record khỏi actor lease. Stable creature record giữ StableCreatureId, ownership relation, progression và storage/party relation. Actor lease giữ embodiment, transform, generation, spawn correlation và teardown handle. Summon tạo lease mới cho cùng record; recall thu lease mà không nhân đôi record.

Pattern này giải quyết capture/PalBox và Work theo cách khác nhau. Capture commit đổi relation của stable record; destroy actor chỉ là lease consequence. Work assignment giữ worker ID, station ID, task correlation và output escrow; PalBehavior đưa lease đến station và phát arrival. Stale arrival không được settle output vì generation/correlation không match. Nếu một domain thực sự yêu cầu actor là persistence, contract phải ghi limitation thay vì lặng lẽ coi Actor pointer là durable.

### 7.5. Typed contract graph

Flat list core interfaces không đủ để biết provider nào được dùng. Mỗi requires/provides có name, semantic version/range, required/optional, scope, network role, cardinality, provider identity/generation, resolution policy, timeout/quiescence, teardown, owner và provenance. Activation reject missing provider/cycle trước khi consumer thấy view nửa cài đặt. Generation change tạo re-resolve hoặc deactivate.

Contract graph không cần biến mọi class thành node. Node là capability có consequence, owner và lifecycle; helper class bên trong domain không cần public plugin boundary. Một registry explicit ở composition host là fallback hợp lệ nếu engine reflection không mang semantic version/generation.

### 7.6. Command, event và transaction grammar

~~~text
Normal input
  → local intent (untrusted)
  → authority validation
  → identity/role/range/LOS/capability/lease check
  → reservation/escrow nếu có quantity
  → domain commit với CorrelationId/IdempotencyKey
  → durable record hoặc post-commit event/snapshot
  → presentation view model
~~~

Command là request; event là fact sau commit. Mỗi retry cùng idempotency key trả semantic result ổn định hoặc explicit conflict. Reject phải có reason code và state không đổi ngoài cleanup hợp lệ. Async movement dùng lease/correlation; arrival stale bị reject. UI và animation có thể restart/rebind mà không duplicate actor/quantity.

### 7.7. Các stage CR-0 đến CR-8

Không stage nào tự mở stage sau. Mỗi stage có packet, owner, prerequisites, automated checks, human gate, exit evidence và stop condition.

**CR-0 — Corpus, provenance và specification.** Khóa reference version, authorization, dirty status, corpus index, provenance manifest, media hash, evidence ledger và contracts cho first slice. Observer chạy boot/movement/interaction/resource/inventory bằng normal input. Dừng nếu license/authorization mơ hồ, version mismatch hoặc behavior chỉ suy từ binary.

**CR-1 — Host và lifecycle skeleton.** Tạo lab owned độc lập, Foundation/Data/Composition modules, typed resolver, activation scope và một reversible proof như input mapping + listener + teardown. Test cycle/missing provider, repeated activation/deactivation, callback leak. Human bật/tắt feature trong session; exit chỉ COMPILED + INTEGRATED cho installation effect.

**CR-2 — First playable slice.** Boot → pawn → camera/input → interactable → một resource → inventory HUD, gồm rejection và retry. Human dùng keys bình thường trong fresh session, nhặt một resource, xem HUD, thử target invalid/out-of-range và lặp retry. Exit PLAYER_OBSERVABLE rồi USER_VERIFIED cho contract freeze.

**CR-3 — Combat/crafting.** Resource → craft bow/ammo → equip → aim/fire → damage feedback, có invalid material rejection, reservation/escrow, ammo conservation, damage authority và ability handle teardown. Không dùng clear ability làm damage rollback. Nếu client quyết định quantity/damage, dừng.

**CR-4 — Building/crafting.** Validate recipe/resource → preview → valid placement → commit/reject/demolish/compensate cho một workstation. Preview không phải canonical actor; cancel không tiêu resource. Human gate kiểm tra valid/invalid/cancel.

**CR-5 — Creature.** Một wild creature → combat → capture → PalBox → summon/recall, cùng stable identity, một slot, một party row. Test escape/failure/interruption, cardinality, lease replacement, authority và retry. Không nâng parity từ tên BP_PalSphere.

**CR-6 — Work.** Chỉ mở khi có behavior spec/direct observation mới. Một worker → một station → một output; Work sở hữu assignment/progress/output, PalBehavior sở hữu movement/arrival, Inventory sở hữu output. Test suitability, invalid target, stale arrival, output escrow, cancel/reassign và không teleport. Nếu KYWorld không có robust Work proof, đây là Paldark requirement mở rộng, không phải parity.

**CR-7 — Hardening.** Persistence, migration, authority/replication, reconnect và bounded performance theo packet riêng. Save fixture không phải normal persistence; offline simulation không phải multiplayer. Human gate chỉ chạy behavior được yêu cầu.

**CR-8 — Paldark adapter.** Chỉ sau lab slice PARITY_EVIDENCED hoặc requirement non-parity đã được chấp thuận, provenance/legal review và Paldark architecture approval. Adapter map neutral contracts, giữ canonical owner, có protected-path audit, integration test, teardown test và human normal-input gate. Dừng nếu cần copy donor, sửa Core private ngoài scope hoặc tạo duplicate state.

### 7.8. Gate map

| Gate | Câu hỏi | Artifact |
|---|---|---|
| PG-0 | observer, authorization, provenance đã rõ? | signed decision, hashes, unknowns |
| PG-1 | reference behavior và failure đã ghi? | traceability row, media/log |
| PG-2 | owner, authority, identity, lifecycle đã đóng? | graph, invariant review |
| PG-3 | target/build compile đúng? | command log, target, diff |
| PG-4 | transaction success/reject/retry/idempotency? | invariant tests, authority log |
| PG-5 | seam cross-domain chạy trong lab? | integrated test |
| PG-6 | human đã chạy normal input focused? | report có checkpoint/build |
| PG-7 | reference contract version-locked? | comparison, known deltas |
| PG-8 | clean-room/adapter/human approval? | independent findings + decision |

Stage chỉ báo cáo strongest completed gate cho contract cụ thể. PG-3 không cấp PG-6. PG-6 không cấp PG-7 nếu chưa có reference comparison. PG-8 không tự mở implementation stage khác.

---

## 8. Harness restart-safe: Human, Sol, Luna và fresh reviewer

### 8.1. Separation of powers

**Human** quyết định architecture, authorization, observer access, distribution/merge và behavior gate. Human là người duy nhất xác nhận USER_VERIFIED hoặc chấp thuận merge/adapter. **Sol orchestrator** giữ task index, scope, ownership, packet, architecture và giao tiếp với Human; Sol không để worker tự mở scope. **Luna implementer** chỉ sửa allowed write-set, chạy validation, ghi devlog/checkpoint; không commit, push, merge, approve hoặc sửa canonical packet/agent config ngoài quyền. **Fresh Sol reviewer** đọc packet, diff, evidence và validation trong context mới; chỉ report findings, không tự sửa implementation.

Ghi chú NDC local hỗ trợ các nguyên tắc spec trước code, separation of powers, objective definition of done, context curation và fresh worker/reviewer. Bài áp dụng nguyên tắc đó như workflow proposal; nó không chứng minh một model cụ thể, kể cả GPT-5.6, intrinsically best cho một role. Routing model cần đánh giá thực nghiệm; vai trò tốt đến từ context, packet, quyền hạn và gate rõ.

### 8.2. State machine và artifact authority

~~~text
DRAFT
  → AWAITING_ARCHITECTURE_APPROVAL
  → APPROVED
  → IMPLEMENTING
  → AWAITING_REVIEW
  → REVIEWING
  → TECH_ACCEPTED
  → AWAITING_HUMAN
  → USER_VERIFIED
  → ACCEPTED
  → ARCHIVED

CHANGES_REQUESTED → fresh Luna → fresh Sol
RUNTIME_FAILED → revised packet
RECONCILIATION_BLOCKED → human/root decision
~~~

Restart không khôi phục từ lời kể trong chat. Nó dựng lại state từ artifact rồi dừng khi mismatch:

~~~mermaid
flowchart TD
  Restart["Restart task"] --> Index["Canonical index"]
  Index --> Repo["HEAD and dirty status"]
  Repo --> Packet["Packet hash and expected HEAD"]
  Packet --> Artifact["Latest transition and review"]
  Artifact --> Match{"Consistent?"}
  Match -->|Yes| Next["Bounded next action"]
  Match -->|No| Block["Reconciliation blocked"]
  Block --> Human["Human or root decision"]
~~~

Persisted artifacts là source of truth, không phải chat memory. Một packet tối thiểu có goal/non-goals, behavior contract, allowed/forbidden paths, owner/invariants, expected branch/HEAD, packet hash, acceptance criteria, exact commands, evidence level, risks, attempt number, next actor/action và finding IDs. Transition, implementation, review và human attempts append-only. Status header cũ không được ghi đè observation mới.

### 8.3. Task packet, escalation packet và bounded retry

Task packet đóng một seam. Nó không nói “làm inventory” mà nói “implement one-resource pickup với target range/LOS, quantity conservation, reject và HUD snapshot”; có owner Inventory, Interaction, Presentation và forbidden path. Packet đặt attempt number, expected input state, done definition, stop signals và validation commands.

Escalation packet được tạo khi có architecture ambiguity, provenance exception, protected path, repeated runtime failure, mismatch giữa packet và repo, hoặc cần human decision. Nó chứa symptom, last known good artifact, reproduction steps, hypotheses được đánh dấu, evidence links, attempted fixes, risk, options, recommendation và câu hỏi cần quyết định. Escalation không là lời mời worker tự mở scope.

Retry có bound, ví dụ hai correction loops cho một finding trước khi quay về architecture/scope; con số chỉ là policy proposal cần human chấp thuận. Mỗi retry phải đổi packet hoặc hypothesis, không chạy lại lệnh y hệt để tạo ảo giác tiến bộ. Sau bound, state là CHANGES_REQUESTED hoặc RECONCILIATION_BLOCKED, không tiếp tục patch vô hạn.

### 8.4. Devlog và checkpoint

Devlog ghi command, exit code, target, environment, changed files, test result, observation, unknown, decision needed và next action. Checkpoint không cần dài; nó cần đủ để fresh reviewer dựng lại state mà không hỏi chat. Hash của packet và expected HEAD giúp phát hiện implementation đang chạy trên baseline khác.

Khi restart, reconciliation theo thứ tự:

1. canonical task index và policy;
2. branch/HEAD và nested checkout HEAD;
3. dirty status trước/sau;
4. packet hash và expected HEAD;
5. latest transition, implementation, review, human artifact;
6. exact next action.

Mismatch, missing artifact, forbidden path, acceptance conflict, unexplained baseline drift hoặc architecture choice mới đều dừng ở RECONCILIATION_BLOCKED. Human/root quyết định tạo packet mới, restore artifact hay thu nhỏ scope. Không reset hard, không xóa lịch sử để làm state “sạch”.

### 8.5. Review loop và human visual gate

Luna hoàn thành implementation trong write-set, chạy docs/static/build checks phù hợp, ghi checkpoint và chuyển AWAITING_REVIEW. Fresh Sol reviewer đọc packet trước diff, xác minh claim với evidence, tìm overclaim, source-class confusion, broken link, missing gate, ownership violation, stale status và scope drift. Reviewer report finding IDs, severity, file/section, reproduction và recommendation; không tự sửa.

Nếu technical findings pass, chuyển AWAITING_HUMAN. Human mở build/map/config đã khóa, dùng normal keys và checklist focused: setup, input, expected state change, rejection, retry, restart hoặc visual checkpoint. Human không cần xác minh toàn bộ engine; họ xác minh contract được yêu cầu. Report phải ghi build hash/version, map/config, timestamp, checkpoint, observed result, known delta, media hash nếu có và status. “Compile succeeded” hoặc “reviewer accepted” không thay gate này.

Visual gate đặc biệt quan trọng với Work, animation, carry và camera. Một compile report không nhìn thấy orientation/drift/snap; một screenshot tĩnh không chứng minh cancel/retry. Human gate phải ngắn, normal-input, một seam mỗi lần, và có stop authority khi behavior không khớp contract.

---

## 9. Kế hoạch implementation và evaluation

### 9.1. Vertical slice trước framework breadth

Đường đi đầu tiên có chủ ý nhỏ:

~~~text
boot
  → movement/camera/input
  → interaction/resource
  → inventory quantity
  → inventory HUD snapshot
~~~

Slice này đủ để kiểm tra input intent, owner, authority, quantity conservation, UI read-only, rejection và restart/rebind mà chưa cần art cuối, capture hay multiplayer. Nó cũng tạo một human gate mà người chơi có thể chạy trong vài phút. Nếu slice không chạy normal input, thêm framework không sửa được vấn đề; phải thu nhỏ hoặc dừng.

Sau đó mở CR-3 combat/crafting, CR-4 build, CR-5 creature, CR-6 Work và CR-7 persistence/network theo dependency. Mỗi slice có parity contract riêng. Bảng traceability tối thiểu:

| Behavior | Contract | Owner | Stage/gate |
|---|---|---|---|
| WASD/camera-relative movement | MoveIntent, pawn embodiment, stop/reject | Movement | CR-2 PG-1/4/6 |
| F resource pickup | target query, range/LOS, idempotent quantity result | Interaction + Inventory | CR-2 PG-1/4/6 |
| Inventory HUD | snapshot/view model; UI không mutate | Inventory + Presentation | CR-2 PG-2/6 |
| Craft bow/ammo | validate, reserve, commit once, reject/refund | Crafting + Inventory | CR-3 PG-4/6 |
| Aim/fire/damage | authority hit, ability handle, settlement | Combat + Health | CR-3 PG-3/4/6 |
| Build workstation | preview vs canonical actor, resource commit | Build + Crafting | CR-4 PG-4/6 |
| Creature combat/capture | stable ID, terminal outcome, capture transaction | Creature + Capture | CR-5 PG-1/4/7 |
| PalBox/summon/recall | identity preservation, cardinality, lease | Companion | CR-5 PG-4/6 |
| One worker/one station | suitability, arrival correlation, output escrow | Work + PalBehavior | CR-6 PG-1/4/6 |
| Save/load | versioned relation record, migration, atomic save | Persistence | CR-7 PG-4/6 |
| Host/join/reconnect | authority, replicated identity, retry | Network/domain | CR-7 PG-4/6 |

### 9.2. Measurable outcomes

Vì chưa có benchmark, evaluation bắt đầu bằng metric có định nghĩa:

**Behavior correctness:** tỷ lệ test case normal/reject/retry đạt contract; quantity conservation; identity conservation qua lease; cardinality; reject reason; duplicate/ghost actor count. Báo cáo denominator, seed, build và test protocol.

**Composition health:** missing-provider/cycle detection time; activation/deactivation repeat count không leak listener/timer/grant; provider generation rebind success; quiescence duration; số stale callback.

**Integration cost:** changed files/lines theo packet, protected-path violations, review findings, correction loops, wall-clock envelope và human-gate duration tách riêng. Không suy person-hours từ chúng.

**Player-observable reliability:** task completion trong fresh session, normal input success, reject clarity, restart/rebind correctness, visual defect count. Human observation cần checklist; screenshot không thay sequence.

**Performance sau khi contract ổn định:** activation latency, command latency, memory footprint, replication bytes, save/load duration và frame impact. Đây là benchmark mới phải thu; snapshot hiện tại không có số liệu và bài không bịa baseline.

### 9.3. Ablation và so sánh

Một evaluation nghiêm túc cần so sánh các điều kiện:

1. **Breadth-first và vertical-slice-first:** cùng capability budget, đo first player-observable gate, rework, finding count và protected-path violation.
2. **Ledger hẹp và generic rollback giả định:** inject teardown giữa listener/ability và domain commit; kiểm tra leak, duplicate và incorrect rollback.
3. **Stable record + actor lease và actor-as-identity:** despawn/respawn/Pawn replacement, đo identity loss và duplicate relation.
4. **Typed requires/provides và flat registry stub:** missing provider, generation replacement, two-provider ambiguity và cycle.
5. **Fresh review và same-context review:** cùng packet/diff, đo finding overlap, overclaim detection, correction loops; không kết luận model nào intrinsically superior.
6. **Sync event bus và durable journal cho domain durable:** crash/duplicate/replay/save retry, đo lost facts và double commit.

Ablation chỉ có ý nghĩa khi seed, build, target, scope và acceptance criteria khóa. Nếu không thể chạy controlled experiment, báo cáo design rationale và threat, không dùng anecdote để nói “nhanh hơn” hay “tốt hơn”.

### 9.4. Failure injection

Failure injection phải đi theo ownership:

- provider mất giữa activation và consumer read;
- provider generation đổi khi consumer đang active;
- listener callback đến sau teardown;
- input retry cùng idempotency key;
- reservation hết hạn trước commit;
- authority role sai hoặc range/LOS reject;
- actor lease despawn trước arrival;
- stale arrival sau reassign;
- capture bị ngắt giữa validation và commit;
- preview build bị cancel;
- save crash trước, đúng hoặc sau commit;
- synchronous listener ném exception sau domain commit;
- network duplicate/out-of-order trong stage có contract;
- human observer không tái hiện được.

Mỗi injected failure có expected invariant, recovery, evidence và stop condition. Không gọi mọi failure là rollback; có cái cần reject trước commit, có cái cần compensation, có cái cần durable recovery hoặc human escalation.

### 9.5. Stop criteria

Dừng hoặc quay về architecture nếu: provenance/authorization không rõ; contract mâu thuẫn; registry resolution không deterministic; owner không duy nhất; UI/adapter ghi canonical state; activation teardown leak; retry nhân đôi; stale arrival settle output; save mất relation; multiplayer claim không có authority evidence; human gate chỉ chạy debug command; hoặc cần donor source/asset để tiếp tục.

Stop không phải thất bại của người implementer. Nó là output của evidence discipline: một giả thuyết không đứng được dưới gate thì được ghi lại và thay bằng scope nhỏ hơn, adapter explicit, placeholder độc lập hoặc quyết định không triển khai.

---

## 10. Thảo luận và threats to validity

### 10.1. Blueprint và binary opacity

Phần lớn KYWorld snapshot là binary Unreal content. Static census, tên asset, docs và commit history không cho thấy toàn bộ graph, latent timing, collision, ownership, replication, state machine, persistence hoặc balance. Native C++ ít không chứng minh behavior ít; native C++ nhiều cũng không chứng minh normal path. Chỉ authorized observation hoặc artifact được dump theo provenance mới thu hẹp khoảng trống.

### 10.2. Không có controlled experiment

Retrospective Paldark là evidence về process patterns và integration rework, không phải controlled trial. Wall-clock overlap, human setup, branch merge và model context làm causal attribution khó. Các ablation trong bài là thiết kế tương lai; chưa có kết quả. Vì vậy mọi câu “vertical slice giảm chi phí” là hypothesis có rationale từ failure pattern, không phải effect size đã đo.

### 10.3. Cordis v3/v4 và analogy limits

Formal Cordis paper draft 2026-08-13 và Koishi/deployed discussion không được trộn version. Cordis calculus có assumptions riêng; Unreal runtime có GC, UObject lifecycle, latent action, replication, editor/package và external side effects mà paper không tự model. Game Feature, GAS, Lyra, UEFN và plugin mỗi cái giải quyết một phần; không cái nào cung cấp universal inverse/rollback, reactive provider replacement và evidence gate cho Paldark.

### 10.4. Observation và human limits

Human gate có thể bỏ sót timing hiếm, race, visual artifact ngoài checkpoint, multiplayer edge hoặc state sau nhiều giờ. Một observer report không phải independent verification tuyệt đối; nó cần build/version/checkpoint/media metadata. Normal input quan trọng nhưng không bao phủ mọi property. Evaluation nên lặp fresh sessions và failure injection, đồng thời giữ wording “contract này đã được quan sát” thay vì “hệ thống đúng hoàn toàn”.

### 10.5. Provenance, licensing và distribution

Snapshot KYWorld không được coi là có license chỉ vì repository có thể đọc. Không thấy LICENSE/NOTICE không chứng minh không có quyền; thấy asset public không chứng minh quyền phân phối. Extracted data, FModel reference, binary Blueprint, marketplace-style asset, tên/trade dress/audio/animation và config/token đều là risk. Clean-room lab dùng original hoặc clearly licensed code/assets, manifest origin/license/hash/allowed-use/reviewer/distribution-scope và legal review trước distribution. Bài không đưa ra legal conclusion.

### 10.6. Model routing và fresh context

NDC notes cung cấp principle về role separation, spec trước code, definition of done và fresh context. Nó không prove GPT-5.6, Luna hay Sol intrinsically best ở role nào. Chất lượng phụ thuộc packet, context curation, tool access, reviewer independence, acceptance criteria và human gate. So sánh model phải là controlled routing experiment, không là claim marketing.

### 10.7. Percentage và maturity uncertainty

Maturity S0–S4 và phần trăm census là snapshot. Một feature có thể S2 cho native seam và S1 cho normal path; một commit mới có thể làm artifact nhiều hơn nhưng không nâng gate. Task 55 cho thấy stale header có thể xung đột execution report thiếu metadata; status phải quay UNKNOWN. Evidence ladder cho phép nói “chưa đủ” mà không nói “không tồn tại”.

---

## 11. Related work và so sánh theo dimension

| Dimension | Cordis | DeepSeek Harness | Lyra | UEFN devices | GAS | Paldark proposal |
|---|---|---|---|---|---|---|
| Primary concern | spatiotemporal composability calculus | plugin/service architecture công khai | modular sample/session composition | designer-facing devices/events | abilities/effects/tags/combat | gameplay owner + composition + evidence |
| Dependency vocabulary | effects/coeffects/provider context | Service Definition/Provider/Consumer | Experience/features/modules | editable ports/events | tags/specs/handles | typed requires/provides + generation |
| Teardown | revertible effect trong assumptions | plugin/service lifecycle heuristic | feature/session lifecycle | device lifecycle | grant/clear một số handle | narrow ledger + quiescence |
| Committed transaction | calculus boundary/assumptions | durable workflow seam tùy architecture | không phải universal guarantee | tùy Verse/device contract | domain owner vẫn cần | explicit owner/authority/idempotency/escrow |
| Identity | context/provider/fiber | provider/service identity | engine/session/pawn patterns | actor/device identity | ASC/ability handles | stable record + actor lease |
| Evidence | formal model/proof của paper | repository/docs architecture | sample/documentation | official docs | engine API | immutable ladder + human gate |
| Clean-room | không phải mục tiêu chính | không phải mục tiêu chính | không phải mục tiêu chính | không phải donor policy | mechanism | two-room provenance + adapter-last |
| Human workflow | không quyết định role | public architecture, không private reasoning | developer sample | editor workflow | technical mechanism | Human/Sol/Luna/fresh reviewer |

Cordis cung cấp ngôn ngữ để đặt câu hỏi về temporal/spatial composition nhưng không là Unreal framework. Harness cung cấp ý tưởng plugin/service boundary nhưng không tự cấp provenance hay behavior gate. Lyra cho thấy composition session hữu ích; UEFN devices cho thấy actor-facing contract; GAS cho thấy ability/effect handles. Paldark kết hợp các seam thành proposal có transaction/evidence boundary, không tuyên bố thay thế chúng.

---

## 12. Kết luận: quyết định tiếp theo là phê duyệt, không phải chuyển đổi

Một repository rộng không tự trở thành gameplay vững. Một GameFeature Active/static packaging không tự trở thành dynamic composability. Một provider registry stub không tự trở thành dependency graph. Một synchronous event bus không tự trở thành durable transaction log. Một compile report không tự trở thành normal-play observation. Và một packet cũ không được phép ghi đè một execution report mới thiếu metadata.

Paldark đề xuất một cách làm khiêm tốn nhưng có thể kiểm tra: bắt đầu từ cảnh player-facing; truy ngược tới intent, owner, authority, state, commit/reject, event/snapshot và presentation; phân biệt installation effect có inverse với committed gameplay transaction; giữ stable record khỏi actor lease; khai báo requires/provides/generation; dùng two-room clean-room lab; chạy vertical slice trước breadth; để Human visual gate xác nhận normal input; và persist mọi quyết định để restart không cần chat memory.

Kết luận hiện tại là **chưa có reconstruction hoàn chỉnh** và **chưa có quyền bắt đầu code conversion**. Next decision gate cần một decision record của con người trả lời: authorized observer và implementer là ai; reference version/map/config nào; provenance/distribution intent nào; implementer được nhìn donor ở mức nào; first CR-2 slice cụ thể ra sao; human gate cadence và stop authority thế nào. Chỉ khi decision đó được approve mới tạo packet CR-0 riêng. Nếu CR-0 không thể đóng provenance hoặc behavior contract, lựa chọn đúng là dừng, không phải lấp khoảng trống bằng suy đoán.

---

# Phụ lục A — Architecture decision records

Mỗi ADR có rationale, assumptions, invalidation signal và fallback. ADR không tự cấp authority cho implementation; nó là input cho packet và review.

| ADR | Quyết định | Rationale | Invalidation signal | Fallback |
|---|---|---|---|---|
| ADR-CR-001 | isolated lab, adapter cuối | provenance/ownership rõ, lab discardable | behavior phụ thuộc private Paldark seam | thu nhỏ contract hoặc dừng |
| ADR-CR-002 | behavioral specification là interface giữa rooms | ngăn Blueprint-to-C++ copying | observer không mô tả outcome đủ | thêm observation, không đoán |
| ADR-CR-003 | stable record + actor lease | actor có thể despawn/recreate | lifecycle bắt actor là persistence | ghi limitation hoặc record owner |
| ADR-CR-004 | ledger chỉ reversible installation | inverse phải có nghĩa | committed mutation bị nhét vào ledger | domain transaction/compensation |
| ADR-CR-005 | typed requires/provides graph | fail sớm missing/cycle/generation | engine discovery không có semantic version | explicit adapter registry |
| ADR-CR-006 | vertical slices trước framework breadth | feedback player sớm, giảm integration rework | slice không chạy normal input | slice nhỏ hơn hoặc stop |
| ADR-CR-007 | Work không lấy KYWorld làm proof | corpus Work yếu/unproven | có direct authorized Work reference | requirement spec mới |
| ADR-CR-008 | original/licensed assets only | clean-room/distribution risk | license không rõ | placeholder tự author + legal review |
| ADR-CR-009 | evidence ladder immutable | chặn compile→parity overclaim | evidence mâu thuẫn status cũ | append finding, revision packet |
| ADR-CR-010 | event sau commit, bus không là journal | tránh listener thấy state nửa commit | domain cần replay/durable recovery | durable journal theo schema |
| ADR-CR-011 | Work/PalBehavior seam tách owner | ngăn transform/assignment lẫn nhau | arrival không thể correlate | thu nhỏ Work hoặc thêm contract |
| ADR-CR-012 | GameFeatures giữ static fact | không overclaim dynamic activation | có human runtime toggle trace | mở packet dynamic riêng |

Hệ quả của bảng là mọi ADR đều có đường lui. Nếu typed registry chưa có generation, không giả vờ registry đã xong; nếu actor lease làm contract phức tạp, ghi rõ limitation; nếu provenance không rõ, không copy để “tiết kiệm thời gian”.

# Phụ lục B — Coverage map của corpus Paldark

Bản đồ này bảo đảm bài không chỉ nói về một snapshot. Tên route/chapter cũ được giữ làm archive; coverage map chỉ chỉ ra nơi mỗi nguồn được dùng và giới hạn của nó.

| Corpus/book | Nội dung chính | Nơi được bao phủ trong bài | Cấp evidence/giới hạn |
|---|---|---|---|
| Q1 — Đọc một game | quan sát player-facing, hành vi → state → architecture | §1, §2.4, §9.1 | method/editorial framing, không runtime proof |
| Q2 — Vấn đề của nghìn người cùng code | xung đột khi cùng viết, Lyra/UEFN, modularity và luật kiến trúc | §1.1, §6, §8 | design lessons/external mechanisms; quy tắc cũ phải theo ADR hiện hành |
| Q3 — Bộ khung | quyền ghi, module, data contract, đăng ký, Blueprint, log/test/CI | §2, §5, §6, §9 | contract và source evidence tùy artifact; không tự chứng minh runtime |
| Q4 — Dựng lại Palworld | 15 hệ thống từ movement đến breeding/economy | §3.2, §7, §9.1 | maturity bands, không completion percentage hay parity rộng |
| Q5 — Lộ trình và giáo trình | time/ROI, PR history, breadth/rework và learning sequence | §2.3, §3.4, §9, §10.2 | wall-clock envelope, không person-hours |
| Q6 — VibeCoding đa tác nhân | contracts, ownership, human gates, Task 55 | §3.3, §5, §8, Appendix C | Task 55 UNKNOWN, stale header không đủ |
| Course material / practical companion | project intent, learning sequence, KYWorld guide | §1.1, §3.1, §7.7 | OBS-DOC/SELF-REPORTED, không implementation proof |
| Living catalogs | GameFeatures, plugin/module, registry, event bus | §3.3, §6, §7.5 | snapshot 2026-08-16; dynamic activation chưa chứng minh |
| PaldarkKit source/test artifacts | compile, seams, QA evidence, ownership attempts | §2.3, §3.4, §5.2, §9.2 | only paths/claims with trace; no parent edits |
| 02.Palworld source/docs | KYWorld native and Blueprint corpus | §3.1–§3.2, Bibliography | reference/provenance only; no donor conversion |
| KYWorld clean-room plan | CR-0…CR-8, two rooms, gates, roles | §2, §7, §8, Appendix A/C | PROPOSED, pending human approval |
| Cordis paper | effects/coeffects, temporal/spatial composition | §4, §6, Bibliography | primary paper, not Unreal theorem |
| DeepSeek Harness docs | plugin/service boundary, durable architecture idea | §6, §8 | public developer-preview docs; no private reasoning |
| Lyra/GAS/UEFN official docs | closest Unreal correspondences | §6, §11, Bibliography | external mechanism only; version check at CR-0 |
| Appendices | ADR, matrix, templates, glossary, bibliography | Appendix A–E | traceability and reusable protocol |

Sáu quyển hiện có vẫn giữ nguyên route công khai. Index canonical là lập luận hợp nhất; archive là source corpus để truy vết. Không chương nào bị xóa hoặc âm thầm viết lại bởi paper này.

# Phụ lục C — Templates

## C.1. Task packet tối thiểu

~~~yaml
packet_id: CR-2-resource-hud-001
status: DRAFT
goal: 'One-resource pickup and read-only HUD snapshot'
non_goals:
  - 'No final art'
  - 'No multiplayer'
  - 'No KYWorld asset copying'
allowed_write_set:
  - 'lab/Foundation/**'
  - 'lab/Interaction/**'
  - 'lab/Inventory/**'
  - 'lab/Presentation/**'
forbidden_paths:
  - '../PaldarkKit/**'
  - '../Documents/**'
  - '../02.Palworld/**'
owners:
  canonical_quantity: Inventory
  target_query: Interaction
  hud: Presentation
invariants:
  - 'one canonical writer'
  - 'quantity conservation'
  - 'retry idempotency'
behavior_contract:
  pre_state: 'player near one resource, valid authority'
  input: 'normal F key'
  success: 'resource quantity +1 and HUD snapshot updates'
  reject: 'out of range or invalid target, state unchanged'
  unknowns:
    - 'timing tolerance'
evidence:
  level: DESIGNED
  reference_version: 'pending CR-0'
  build_hash: 'pending'
acceptance:
  - 'fresh normal-input human gate'
commands:
  - 'record exact command and target'
attempt: 0
next_actor: root
next_action: 'architecture approval'
~~~

Packet không nên ghi “làm hệ thống inventory” vì scope đó không falsifiable. Nó đóng một contract nhỏ, non-goals và forbidden paths; mọi mở rộng phải packet mới hoặc decision record.

## C.2. Escalation packet

~~~yaml
escalation_id: ESC-0001
packet_id: CR-2-resource-hud-001
symptom: 'Retry produced duplicate quantity'
last_known_good: 'commit/hash and checkpoint'
reproduction:
  - 'fresh session'
  - 'pick resource'
  - 'repeat F during animation'
observed:
  - 'two inventory deltas for one resource'
hypotheses:
  - 'missing idempotency key'
  - 'event emitted before commit'
evidence_links: []
attempts: []
risks:
  - 'double spend'
options:
  - 'serialize command in Inventory owner'
  - 'add correlation/idempotency guard'
recommendation: 'stop and review owner/commit boundary'
decision_needed_from: human/root
~~~

Escalation ghi symptom và evidence, không biến hypothesis thành fact. Người nhận có thể chọn patch, thu nhỏ scope, tạo observation mới hoặc stop.

## C.3. Human visual gate

~~~text
Build/version/hash:
Map/config:
Observer:
Date/time:
Precondition:
1. Start a fresh session.
2. Use normal input, not debug command.
3. Execute the single contract action.
4. Execute one valid and one invalid/retry path.
5. If required, restart/rebind and repeat.
Expected checkpoints:
  - input accepted/rejected for stated reason
  - canonical state changed once
  - HUD/presentation reflects snapshot
  - no duplicate actor/quantity/assignment
Observed:
Known delta:
Media/log hash:
Status: PASS / FAIL / UNKNOWN
Stop reason:
Human signature/decision:
~~~

Gate chỉ xác nhận contract, version và checkpoint đã ghi. Nó không phải blanket approval cho mọi system.

## C.4. Review findings

~~~text
Finding ID:
Severity: blocking / major / minor
File/section:
Claim or invariant:
Evidence checked:
Why it fails or is uncertain:
Reproduction:
Requested correction:
Residual risk:
Reviewer context/reset:
~~~

Fresh reviewer không sửa implementation. Finding phải đủ để Luna mới hoặc root mở packet correction mà không cần hỏi lại conversation.

# Phụ lục D — Glossary

**Actor lease:** embodiment có generation và lifecycle; có thể spawn/despawn mà không nhất thiết là identity.

**Authority:** execution/domain role được phép commit state; không đồng nghĩa mọi Actor có Owner pointer.

**Canonical writer:** owner duy nhất ghi key gameplay trong scope/generation.

**Coeffect:** điều kiện capability đặt lên context, như provider/version/role/identity.

**Commit point:** điểm transaction biến request đã validate thành fact canonical.

**Composition host:** runtime/resolver quản lý requires/provides, activation, generation và quiescence.

**Correlation ID:** định danh một request, arrival hoặc transaction qua async boundary và retry.

**Durable record:** state được persist theo schema/version; khác transient event/UI cue.

**Effect:** mutation component tạo trên context.

**Evidence ladder:** DESIGNED → SOURCE_PRESENT → COMPILED → INTEGRATED → PLAYER_OBSERVABLE → USER_VERIFIED → PARITY_EVIDENCED.

**Fresh reviewer:** reviewer đọc packet/diff trong context mới, không dựa vào implementation memory và không tự sửa.

**Game Feature Plugin:** Unreal packaging/activation mechanism gần với capability domain; không tự rollback mọi gameplay mutation.

**Generation:** phiên bản instance/provider/lease để phát hiện stale view/pointer.

**Human visual gate:** focused normal-input observation có build/config/checkpoint và quyết định của người được ủy quyền.

**Idempotency key:** key làm retry của cùng command không tạo commit lặp.

**Installation effect:** setup có handle/inverse, như listener, timer, mapping, registration.

**Invariant:** điều kiện phải giữ qua transition và failure trong contract.

**Normal path:** input người chơi được mô tả trong contract, không phải debug command hay fixture tự gọi owner.

**Observational equivalence:** outcome nhìn thấy tương đương trong tập input/pre-state/tolerance đã khóa, không yêu cầu cùng implementation.

**Owner:** domain canonical writer của state/capability; khác với generic object ownership.

**Parity evidence:** comparison version-locked với reference, known deltas và provenance; không phải full clone.

**Provider/Consumer:** service implementation và component yêu cầu capability đó.

**Quiescence:** giai đoạn ngừng command mới, xử lý callback hợp lệ và thu hồi lease trước teardown.

**Reservation/Escrow:** giữ quantity/quyền tạm thời trước commit để reject/retry không double spend.

**Stable record:** identity/relation bền hơn actor lease.

**Synchronous event bus:** message dispatch trong cùng call stack/process; không tự là durable log hay transaction.

**Transaction:** request có validation, authority, commit/reject, idempotency/correlation và compensation/recovery semantics.

**Two-room policy:** tách observation/specification khỏi implementation để giữ clean-room provenance.

**UNKNOWN:** evidence chưa đủ để xác nhận hoặc phủ nhận; không phải “không tồn tại”.

# Phụ lục E — Bibliography và nguồn kiểm chứng

## E.1. Nguồn chính cục bộ

1. Yifan Shi, Wei Zhang, Tianyi Cui. *A Programming Paradigm for Spatiotemporal Composability*. Cordis preprint, draft 2026-08-13, `../Documents/KYWorld/paper.pdf`, pp. 1–80. Đọc text/extraction theo snapshot; không dùng hình ảnh để suy claim.
2. *Kế hoạch tái dựng gameplay KYWorld bằng C++ theo clean-room*, version 0.1, 2026-08-16, `../Documents/KYWorld/ke-hoach-tai-dung-kyworld-clean-room-cpp.md`. Trạng thái PROPOSED — AWAITING ARCHITECTURE APPROVAL.
3. `../Documents/KYWorld/claudecode_note.txt`. Ghi chú NDC về spec trước code, separation of powers, definition of done, limits và fresh context; đây là source workflow principle, không phải architecture proof.
4. Paldark evidence: `../Documents/PALDARK/Q6-Kien-Truc-VibeCoding/53-danh-gia-tien-do-va-ke-hoach-gameplay-first-12-gio.md`; `54-human-gate-manual-base-pal-assignment.md`; `55-bugfix-manual-base-pal-targeting-and-chicken-animation.md`; `../Documents/PALDARK/Q5-Lo-Trinh/36-danh-gia-tien-do.md`.
5. KYWorld source snapshot: `../02.Palworld/Source/Source/Palworld_Base/Palworld_Base.Build.cs`; `PlayerCharacter.cpp/h`; `BaseCharacter.cpp/h`; `BaseAbilitySystemComponent.cpp/h`; `InventoryComponentBase.h`; `BaseAttributeSet.h`.
6. KYWorld documents: `../02.Palworld/Documents/01-Project Overview/03-KYWorld Source Snapshot Overview.txt`; `04-Inventory System`; `05-Pal System`; `07-Interactive Objects`; `10-KYWorld Source Architecture`; `11-Palworld DataTable Architecture`; `Course_Overview.txt` và `../Documents/KYWorld/guide.txt`.
7. `../Documents/KYWorld/LyraFramework_Overview.pdf`, local Vietnamese synthesis, pp. 1–42; secondary, encoding errors recorded; official Epic docs are authority for later API checks.
8. `../Documents/KYWorld/paper-review.txt`; secondary editorial commentary, used only to identify claims that must not be treated as primary evidence.

## E.2. Nguồn public primary

9. Cordis paper repository: [github.com/cordiverse/paper](https://github.com/cordiverse/paper).
10. Cordis source: [github.com/cordiverse/cordis](https://github.com/cordiverse/cordis).
11. DeepSeek Harness repository, developer-preview context: [github.com/deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness).
12. DeepSeek Harness architecture: [raw architecture document](https://raw.githubusercontent.com/deepseek-ai/deepseek-harness/master/docs/architecture.md).
13. Epic Games, [Lyra Sample Game in Unreal Engine](https://dev.epicgames.com/documentation/en-us/unreal-engine/lyra-sample-game-in-unreal-engine).
14. Epic Games, [Game Features and Experiences in Unreal Engine](https://dev.epicgames.com/documentation/en-us/unreal-engine/game-features-and-experiences-in-unreal-engine).
15. Epic Games, [Modular Gameplay in Unreal Engine](https://dev.epicgames.com/documentation/en-us/unreal-engine/modular-gameplay-in-unreal-engine).
16. Epic Games, [Gameplay Ability System for Unreal Engine](https://dev.epicgames.com/documentation/en-us/unreal-engine/gameplay-ability-system-for-unreal-engine).
17. Epic Games, [Getting Started with Devices in Fortnite/UEFN](https://dev.epicgames.com/documentation/en-us/fortnite/getting-started-with-devices-in-fortnite).
18. Emmz Rendle, *How I Tamed Claude — NDC London 2026*, [NDC Conferences video](https://www.youtube.com/watch?v=pey9u_ANXZM). Dùng làm nguồn workflow công khai, không dùng để suy ra model nào intrinsically tốt hơn.
19. Epic Games, Verse and networking/persistence references to be pinned with version/date in CR-0; a generic docs page is not evidence of KYWorld behavior.

## E.3. Đọc bibliography

Nguồn 1 là nền tảng lý thuyết; nguồn 2 là seed architecture proposal; nguồn 3 là workflow note; nguồn 4–6 là local evidence và retrospective; nguồn 9–18 là external primary docs để kiểm chứng mechanism trước implementation. Không nguồn nào cấp license hoặc cho phép copy code/asset. Mọi claim parity phải có reference version, observation và known delta riêng; mọi claim distribution phải qua provenance/legal review.

---

## Lời kết ngắn

Nếu một người đọc chỉ nhớ một quy tắc, hãy nhớ quy tắc này: trước khi hỏi “feature đã có chưa?”, hãy hỏi “ai ghi state, input bình thường tạo outcome gì, failure giữ invariant nào, và bằng chứng nào cho phép nói câu đó?”. Từ câu hỏi nhỏ ấy, Paldark đi đến component model, clean-room lab và restart-safe harness. Quyết định tiếp theo vẫn thuộc về con người: phê duyệt CR-0 với phạm vi có thể kiểm chứng, hoặc dừng cho đến khi provenance và behavior đủ rõ.
