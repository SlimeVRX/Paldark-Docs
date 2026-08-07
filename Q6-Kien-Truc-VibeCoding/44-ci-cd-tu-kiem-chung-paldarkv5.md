# Chương 44 — CI/CD tự kiểm chứng cho PaldarkV5

PR [#184](https://github.com/SlimeVRX/Soliz-Devin-Palworld/pull/184) là một bước ngoặt thật: lần đầu PaldarkKit có một tác nhân chạy trong game, đi qua một chuỗi gameplay dài, đọc state thật và tạo bằng chứng máy đọc được. Nhưng tên PR “AI tự chơi và tự chụp ảnh game — hết phụ thuộc vào người test” đi xa hơn bằng chứng hiện có. Ở merge commit `6b777c23`, đây là **một autoplay smoke harness chạy local**, chưa phải một CI/CD đáng tin cậy và chưa thể thay người kiểm thử.

Kết luận quan trọng nhất của chương này là:

> Chỉ có thể giao cho AI một mục tiêu ngắn như “dựng lại PaldarkV5 từ PaldarkV4” khi repository đã chứa một đặc tả thực thi đủ mạnh để tự phán quyết đúng/sai. Nếu chưa có oracle, replay, baseline và regression corpus thì câu đó không phải specification; nó chỉ là mong muốn.

Chương này kiểm toán PR #184, đối chiếu với quy trình công khai của Epic, Riot, Rare, DICE, Ubisoft, Rebellion và một studio indie, rồi đề xuất đường đi cụ thể từ PaldarkV4 tới một PaldarkV5 mà AI có thể tự triển khai, tự tái hiện lỗi và tự sửa phần lớn lỗi hồi quy.

> **Làm rõ thuật ngữ sau khi viết chương này:** nhu cầu hằng ngày của Paldark không phải là “làm CI/CD trước”, mà là tạo **testability, automated verification, executable test case và regression corpus**. CI chỉ là nơi tự động gọi các test đó khi source thay đổi; CD không giải quyết việc một gameplay outcome đúng hay sai. Quy trình test nhỏ, nhanh và vòng tự kiểm chứng của AI được tách riêng ở [Chương 45](45-test-case-nho-va-vong-tu-kiem-chung.md).

Các nhãn bằng chứng dùng trong chương:

- **OBSERVED**: đọc trực tiếp từ source, workflow, log hoặc lịch sử Git hiện có;
- **INFERRED**: kết luận kỹ thuật suy ra từ bằng chứng nhưng chưa được chạy đủ trên farm;
- **PROPOSED**: kiến trúc cần triển khai;
- **UNKNOWN**: chưa có artifact đáng tin cậy để kết luận.

## 44.1 — Phân biệt bốn thứ đang bị gọi chung là “CI/CD”

| Khái niệm | Câu hỏi nó trả lời | Trạng thái ở PR #184 |
|---|---|---|
| Test case | Một điều kiện cụ thể có đúng không? | Có một số assertion runtime trong autoplay. |
| Test harness | Ai dựng map, điều khiển game, chờ và thu kết quả? | Có `UPaldarkAutoplaySubsystem` và hai script shell. |
| CI | Mỗi thay đổi có tự build/test, chặn merge và lưu bằng chứng không? | Chưa. PR không nối autoplay vào GitHub Actions. |
| CD | Một artifact đã qua gate có được đánh version, ký/ghi provenance và promote mà không rebuild không? | Chưa có. |

Autoplay cũng không đồng nghĩa với AI. `UPaldarkAutoplaySubsystem` là state machine tất định được viết bằng C++; đó là lựa chọn tốt cho regression test vì dễ lặp lại hơn một LLM. AI nên tham gia ở vòng ngoài — đọc failure, tìm nguyên nhân, viết test và sửa code — còn phép phán quyết trong CI phải dựa trên oracle rõ ràng, không dựa vào cảm giác của mô hình.

## 44.2 — PR #184 thực sự đã làm gì?

Merge `6b777c23` gồm 8 commit, 23 file, khoảng `+1634/-26`. Các phần chính là:

| Phần | Bằng chứng | Giá trị mang lại |
|---|---|---|
| Autoplay state machine | [`PaldarkAutoplaySubsystem.cpp`](https://github.com/SlimeVRX/Soliz-Devin-PaldarkKit/blob/main/PaldarkKit/Source/PaldarkRuntime/Private/PaldarkAutoplaySubsystem.cpp) | Chạy chuỗi Pickup → Weaken → Capture → Roster → Summon → Assign → Arrive → Output. |
| Semantic action seam | `IPaldarkActionInput`, `IPaldarkLocomotionInput` | Harness tìm `UInputAction` qua interface thay vì include concrete feature. |
| Read-only oracle seam | `IPaldarkResourceIdentity`, `IPaldarkWorkRead` và snapshot | Đọc inventory, health, equipment, companion và work state từ owner. |
| Script headless | [`loop_check.sh`](https://github.com/SlimeVRX/Soliz-Devin-PaldarkKit/blob/main/PaldarkKit/Scripts/qa/loop_check.sh) | Có fast `-nullrhi` và visual mode, timeout, parse log từng bước. |
| Screenshot helper | [`capture_screenshot.sh`](https://github.com/SlimeVRX/Soliz-Devin-PaldarkKit/blob/main/PaldarkKit/Scripts/qa/capture_screenshot.sh) | Khởi động Editor offscreen và thu PNG. |
| Build recovery | [`Scripts/build/README.md`](https://github.com/SlimeVRX/Soliz-Devin-PaldarkKit/blob/main/PaldarkKit/Scripts/build/README.md) và `build_editor.sh` | Ghi lại cách phục hồi installed Linux build và gọi UBT trực tiếp. |
| Equip input thật hơn | `HUD.Input.json`, `HUDFeatureComponent` | Thêm action One/Two cho Gậy và Cầu thay vì chỉ gọi equip function. |
| Bootstrap runtime | `PaldarkRuntimeModule.cpp` | Tự tạo subsystem khi có `-PaldarkAutoplay`. |

Ba quyết định đáng giữ lại cho V5:

1. test điều khiển feature qua interface, không include implementation;
2. kết quả dựa trên state owner thật, không chỉ dựa vào dòng “ready”;
3. một vertical loop buộc nhiều system seam cùng hoạt động.

Đó là lý do PR này quan trọng hơn một script chụp ảnh thông thường. Nó đặt viên gạch đầu tiên cho một **executable gameplay contract**.

## 44.3 — Những lỗ hổng khiến #184 chưa thể làm trọng tài

### P0 — Không nằm trong CI và CI hiện tại không đại diện cho PaldarkKit runtime

PR không thay đổi [`.github/workflows/ci.yml`](https://github.com/SlimeVRX/Soliz-Devin-PaldarkKit/blob/main/.github/workflows/ci.yml). Workflow hiện tại chỉ chạy bảy job Python trên `ubuntu-latest`: validator PaldarkV3/PaldarkLab, progression, Markdown, hai guardrail PaldarkV2 và parity GameFeatureData. Không job nào compile Unreal, cook/package PaldarkKit, gọi `loop_check.sh`, upload ảnh/log hoặc tạo required gameplay check.

Audit local tại `6b777c23` cho kết quả:

- PaldarkLab, Progression, Markdown, PaldarkV2 headers và tags: PASS;
- PaldarkV3 structural validator: FAIL 7 lỗi drift đã biết;
- Game Feature composition: local Windows không kết luận được vì script gọi GNU `strings`; workflow Ubuntu có tool này;
- autoplay: không có artifact local trong `Saved/Autoplay`, không có `PALDARK_AUTOPLAY_*` trong log đang lưu.

Một CI có job đỏ thường trực không thể là trọng tài. Trước khi bật branch protection, cần sửa hoặc tách validator PaldarkV3 khỏi gate PaldarkKit; sau đó thêm gameplay check có tên ổn định và bắt buộc pass.

### P1 — Harness có thể PASS dù process crash hoặc bị timeout

[`loop_check.sh`](https://github.com/SlimeVRX/Soliz-Devin-PaldarkKit/blob/main/PaldarkKit/Scripts/qa/loop_check.sh) lưu `PROCESS_STATUS`, nhưng nhánh PASS ở dòng 160–163 chỉ kiểm summary và assertion; exit code của Unreal không tham gia điều kiện. Trong game, nhánh `Finished` chỉ log summary rồi trở về `Waiting`, không yêu cầu process thoát. Vì vậy một run thành công bình thường vẫn có thể chờ tới timeout ngoài 210 giây, bị kill với status khác 0, rồi script vẫn in `HARNESS PASS`.

`capture_screenshot.sh` có cùng lớp lỗi: nếu tìm được một PNG mới hợp lệ thì script thoát 0 dù Unreal trả process status khác 0. Nó còn chọn “một PNG mới bất kỳ” thay vì xác nhận đúng screenshot ID mà test yêu cầu.

Timeout trong C++ là 240 giây, dài hơn timeout ngoài 210 giây nên mặc định không bao giờ có cơ hội phát `HARNESS timeout`. Đây vừa làm mỗi run chậm vô ích, vừa che crash/hang xảy ra sau khi summary được ghi.

Yêu cầu sửa:

- game phải phát một terminal result đúng một lần rồi tự thoát;
- `process_status != 0`, crash, ensure/assert hoặc timeout đều là FAIL/ERROR;
- timeout trong game phải ngắn hơn watchdog ngoài;
- artifact vẫn phải upload bằng `if: always()` khi test fail.

### P1 — Đường input có fallback che đúng nhóm bug Movement đã từng gặp

Autoplay lấy `UInputAction` rồi gọi `InjectInputForAction`. Cách này kiểm được semantic action và binding phía sau action, nhưng bỏ qua đoạn phím vật lý → mapping context → action. Nếu không tìm được action, Movement còn gọi thẳng `AddMovementInput`. Camera được xoay bằng `Controller->SetControlRotation` thay vì action Look.

Do đó test có thể xanh trong khi các lỗi lịch sử sau quay lại:

- action Look không tồn tại hoặc mouse không map vào Look — #147;
- key/property trong input config sai làm Enhanced Input chết — #154;
- W không đi theo camera — #156, vì harness tự đặt control rotation và fallback dùng actor forward;
- mapping W/A/S/D bị mất nhưng action vẫn được inject trực tiếp.

Fallback có thể hữu ích để giữ bot di chuyển trong một exploration run, nhưng **bị cấm trong acceptance test của Enhanced Input**. Nếu action/mapping không sẵn sàng, test phải dừng tại đúng phase với `input_path_unavailable`, không tự cứu đường chơi.

Loop hiện còn trộn ba tầng driver: One/Two/E đi bằng raw key, Interact/Attack/Capture inject thẳng semantic action, còn camera set rotation trực tiếp. Một test như vậy chứng minh được vertical outcome nhưng không thể nói chung rằng “input đã đúng”. Mỗi tầng cần test riêng và end-to-end input gate phải tuyên bố chính xác nó bắt đầu ở physical key hay semantic action.

### P1 — Capture dùng xác suất thật nhưng chỉ thử một lần

Autoplay đánh Wild Pal một lần rồi ném một Cầu. Capture authority lấy seed bằng `FMath::RandRange`; threshold phụ thuộc HP. Theo contract hiện tại, Pal 100 HP bị Gậy gây 40 damage còn 60 HP, tương ứng xác suất khoảng 34%. Một smoke test bắt buộc qua Capture nhưng chỉ thử một lần vì vậy có thể thất bại ngẫu nhiên phần lớn số run.

CI không được “may thì xanh”. Cần hai test tách biệt:

- deterministic success với seed/fixture do test sở hữu và threshold đã biết;
- deterministic failure để kiểm sphere consume/refund, target reset và lần ném kế tiếp.

Seed phải có trong result artifact để mọi failure chạy lại được.

### P1 — Screenshot mới chỉ chứng minh “có file PNG”

`StartStep` gọi screenshot ngay khi **bắt đầu** state, trước assertion. Nhiều substate dùng cùng tên `WEAKEN`, `CAPTURE` hoặc `OUTPUT`, nên cùng file có thể bị ghi đè và thời điểm cuối không ổn định. Hai script chỉ kiểm 8 byte PNG magic; không so ảnh chuẩn, không kiểm nội dung, không gắn ảnh với terminal assertion.

Như vậy ảnh đen, camera xuyên mesh, mesh quá lớn hoặc ảnh chụp trước khi hành động vẫn được coi là hợp lệ. Visual gate phải:

- chụp sau khi state đã settle và assertion logic đã PASS;
- dùng tên duy nhất gồm test ID, phase, attempt và correlation;
- so với ground truth theo platform/RHI/resolution bằng Screenshot Comparison của Unreal;
- lưu `ground-truth`, `incoming` và `diff`;
- không cho AI tự cập nhật ground truth trong cùng PR sửa implementation.

### P1 — Một số oracle chưa chứng minh đúng nguyên nhân

Capture PASS nếu con trỏ Wild Pal không còn valid. Điều đó chưa phân biệt được captured, chết, despawn hoặc bị hệ thống khác destroy. Oracle mạnh phải nối cùng một correlation và stable entity ID qua:

```text
Throw accepted
→ sphere quantity changed theo policy
→ Capture.Success cho đúng target
→ world representation removed với reason=Captured
→ cùng entity xuất hiện trong roster
```

Tương tự, ảnh tồn tại không chứng minh HUD đúng; actor active không chứng minh đúng Pal vừa bắt; ore tăng không chứng minh đúng fuel transaction nếu không nối correlation/revision.

### P2 — Test quá dài để định vị lỗi và chưa cô lập môi trường

Một loop tám bước là end-to-end smoke tốt, nhưng không thay các test nhỏ. Nếu Pickup fail, mọi bước sau chỉ còn `NOT_OBSERVED`. Map dùng `/Engine/Maps/Entry` và phụ thuộc tutorial lane dựng động, thay vì một test map Paldark versioned. Fast mode `-nullrhi` không thể bắt mesh/camera/render; visual mode software Vulkan không đại diện cho Windows GPU package.

Cần giữ loop dài làm một blocker, đồng thời tách mỗi seam thành test độc lập có setup/teardown riêng. `NOT_OBSERVED` ở một required test phải được báo là FAIL hoặc BLOCKED-BY với parent failure; không được biến thành một trạng thái mơ hồ có thể bị bỏ qua.

## 44.4 — Mức trưởng thành hiện tại

| Mức | Năng lực | Paldark hiện tại |
|---:|---|---|
| 0 | Người test tự chơi và gửi feedback | Đã trải qua ở V1–V4. |
| 1 | Script setup/log riêng lẻ | Đã có nhiều command và QA fixture. |
| 2 | Bot chạy vertical loop và có state oracle | **PR #184 đạt mức này.** |
| 3 | Test ổn định, chạy trong CI, có artifact và chặn merge | Chưa đạt. |
| 4 | Editor + packaged + multiplayer + visual/perf matrix | Chưa đạt. |
| 5 | AI nhận failure, tái hiện, viết regression, sửa và tự chứng minh | Chưa đạt. |

Vì vậy đánh giá công bằng là: **#184 là bước ngoặt về khả năng kiểm thử, không phải điểm kết thúc sự phụ thuộc vào người test**.

## 44.5 — Các hãng game công khai đã làm gì?

Không có một “CI/CD ngành game” duy nhất. Mẫu chung là nhiều tầng test, build farm, game-side control/read APIs, bot cho flow dài, test packaged trên thiết bị thật, artifact lịch sử và con người làm exploratory/quality review.

| Nguồn công khai | Cách họ làm | Bài học cho Paldark |
|---|---|---|
| Epic Games | Automation Framework có unit/feature/content stress/screenshot; Gauntlet quản lý một session gồm client/server; BuildGraph mô tả build graph; Horde là build/test farm Epic dùng cho Unreal/Fortnite. | Dùng framework Unreal cho test/result, Gauntlet cho process topology, BuildGraph cho build artifact; GitHub chỉ orchestration ở vòng ngoài. |
| Riot — League of Legends | BVS lấy artifact, deploy, khởi động client/server, chạy test và report; test điều khiển/query game qua RPC. Riot công bố khoảng 100.000 case/ngày, dùng conditional wait, test mới vào staging một tuần rồi mới lên Blocker/Core. | Tách executor/driver/test; local và farm dùng cùng test; cấm sleep cứng; test flaky không được chặn build ngay. |
| Rare — Sea of Thieves | Gameplay automation được xây từ đầu, có framework để team viết nhiều loại test nhanh và ổn định. | Testability là yêu cầu kiến trúc của feature, không phải phần thêm sau khi bug xuất hiện. |
| DICE — Battlefield V | AutoPlayers chạy từ scripted case tới soak 64 player. | Bot không chỉ click flow; còn tạo tải, concurrency và soak. |
| Ubisoft — The Division | Client Bots mô phỏng input người chơi, tự chạy mission, thu performance và hỗ trợ tái hiện bug. | Driver phải đi qua player path và tạo report dùng được cho reproduction. |
| Rebellion | Kết hợp numeric planner với behavior tree để chơi game từ đầu tới cuối trên nhiều thể loại. | Planner phù hợp exploration/full-game coverage; assertion tất định vẫn phải đứng ngoài planner. |
| Pontoco — The Last Clockwinder | Ghi và phát lại player input để tái hiện gameplay ổn định, rồi dùng bản ghi cho automated regression. | Mỗi bug khó tái hiện nên trở thành replay fixture có version. |

Tài liệu công khai của Pocketpair mà audit tìm được mô tả việc lặp `memreport` và kiểm tra trên hardware thật khi tối ưu Palworld, nhưng không công bố một kiến trúc CI/gameplay automation đủ chi tiết để đối chiếu. Vì vậy không được suy đoán rằng Palworld dùng hay không dùng một hệ thống cụ thể. Ta có thể học từ hành vi game và nguồn donor, nhưng kiến trúc CI của Paldark phải dựa trên bằng chứng công khai ở trên và nhu cầu thật của repository này.

## 44.6 — Vì sao chỉ nói “làm lại V5 từ V4” là chưa đủ?

Hai implementation khác nhau có thể cùng đúng; hai game nhìn giống nhau có thể có state authority hoàn toàn khác. Ngược lại, V4 đang chứa cả hành vi đúng lẫn lỗi lịch sử. Nếu lấy toàn bộ V4 làm golden master, V5 sẽ được thưởng khi tái tạo cả bug.

Trước khi khởi công V5 phải đóng băng một **Paldark Conformance Pack**:

1. **Requirement catalog** — mỗi outcome người chơi có ID, owner và mức bắt buộc.
2. **Scenario specs** — Given/When/Then, negative cases, timeout và cleanup.
3. **Domain contracts** — input intent, authority mutation, event, snapshot và stable identity.
4. **Golden traces** — event/state trace đã normalize, bỏ pointer, timestamp tuyệt đối và dữ liệu nhiễu.
5. **Golden visuals** — ảnh chuẩn theo platform/RHI/resolution, có tolerance và người phê duyệt.
6. **Input recordings/replays** — các flow người thật và từng bug khó tái hiện.
7. **Regression corpus** — mỗi bug V1–V4 có test ID, buggy commit, fixed commit và oracle.
8. **Persistence fixtures** — save của các schema/version cũ và expected state sau migration.
9. **Performance budgets** — frame time, memory, load time, actor count và network budget theo scenario.
10. **Immutable V4 reference build** — commit, engine/toolchain, content hash và artifact đã nghiệm thu.

Khi pack này tồn tại, người dùng có thể chỉ nói một câu. Repository tự cung cấp phần hướng dẫn còn lại. AI không cần viết source giống V4; nó cần làm V5 pass cùng contract, regression và parity gates đã được duyệt.

### Differential qualification V4 ↔ V5

Cùng một scenario, seed, clock và input recording được chạy trên V4 reference và V5 candidate. Comparator không so pointer hoặc timestamp tuyệt đối; nó so:

- terminal outcome và normalized owner snapshots;
- chuỗi intent → validation → mutation → replication → presentation;
- stable entity/revision/correlation relationships;
- screenshot theo vùng/tolerance đã duyệt;
- frame time, memory, load time và network budget.

Mỗi khác biệt được phân loại `EXPECTED_CHANGE`, `V4_KNOWN_BUG`, `V5_REGRESSION` hoặc `INCONCLUSIVE`. `V4_KNOWN_BUG` phải lấy expected từ contract/fixed behavior, không lấy output lỗi của V4 làm chuẩn. V5 chỉ đạt parity khi không còn khác biệt chưa được duyệt.

## 44.7 — Phân rã một chức năng như tháo và lắp lại chiếc xe

Một feature không được mô tả bằng tên “Movement” hoặc “Capture”. Nó phải được phân thành chuỗi có thể quan sát:

```text
Precondition
→ physical input hoặc public request
→ semantic intent
→ authorize/validate
→ owner mutation
→ event/replication
→ presentation
→ terminal player outcome
```

Mỗi test case tối thiểu phải có:

| Trường | Ý nghĩa |
|---|---|
| `id` | ID ổn định, ví dụ `MOV-REG-154`. |
| `requirement` | Outcome nào đang được bảo vệ. |
| `bug_reference` | Issue/PR/buggy commit nếu là regression. |
| `fixture` | Map, actors, inventory, seed, clock, net topology. |
| `driver` | Domain request, semantic action hay platform input. |
| `when` | Hành động duy nhất của test. |
| `oracle` | State/event/visual/performance expected cụ thể. |
| `negative_oracle` | Điều tuyệt đối không được xảy ra. |
| `wait_until` | Điều kiện chờ và timeout, không dùng sleep mù. |
| `artifacts` | Log, JSON, replay, ảnh, trace, crash và metrics. |
| `teardown` | Cách trả môi trường về sạch dù test trước crash. |
| `owner` | Feature/team chịu trách nhiệm khi fail. |

Setup được phép dùng test API để đặt state nhanh. **Hành động đang nghiệm thu không được dùng test API để đi tắt.** Ví dụ test damage có thể spawn target bằng fixture API, nhưng cú đánh phải đi qua Attack path; test W phải gửi W, không gọi `AddMovementInput`.

### Ví dụ phân rã Movement và các bug #138/#147/#154/#156

| Phase | Input/điều kiện | Oracle bắt buộc | Bug bị bắt |
|---|---|---|---|
| Config parse | Load `Movement.Input.json` | Mọi property/key tồn tại, `FKey.IsValid=true`; schema fail rõ khi typo. | #154 và lỗi tên key. |
| Context install | Local player được possess | IMC nằm trong đúng `EnhancedInputLocalPlayerSubsystem`, action còn sống. | Mapping chưa add/lifetime lỗi. |
| Binding | Component local khởi tạo | Move/Look đều bind đúng trigger; pawn/controller/local-control khớp. | #147. |
| Physical input | Platform driver giữ W | `PALDARK_MOVEMENT_ACTION MoveForward axis!=0`; không inject action trực tiếp. | #147/#154/mất mapping W. |
| Camera input | Platform driver di chuột | LookYaw/LookPitch trigger và control rotation đổi trong ngưỡng. | #147. |
| Direction transform | Cùng W tại yaw 0/90/180 | world input/acceleration/velocity xoay theo yaw-only control basis. | #156. |
| Movement owner | W giữ tới condition | horizontal speed và location delta > ngưỡng; movement mode đúng. | Action có nhưng pawn không đi. |
| Presentation | Spawn ở test marker | capsule/mesh scale/socket/spring arm trong contract; camera không cắt mesh ở các yaw/pitch. | #138/#139. |
| Package parity | Chạy Win64 Development package | Chuỗi trên vẫn pass ngoài Editor và với config đã cook. | #154 và package-only regressions. |

Đây là khác biệt giữa “WASD test PASS” và một chuỗi bằng chứng có thể chỉ đúng phase đã gãy.

### Ví dụ phân rã vertical loop của #184

| Step | Action phải đi qua | Oracle mạnh hơn |
|---|---|---|
| Pickup | Physical F → Interact | Focus đúng stable resource ID; inventory revision `n→n+1`; resource removed với reason `Collected`, cùng correlation. |
| Equip | Tab/UI hoặc phím config | Equipment slot mang đúng definition; model/socket visible; inventory không tự tăng/giảm. |
| Weaken | LMB → Attack | Đúng weapon, đúng target, health `100→60→20`, target còn sống; animation contact và damage cùng correlation. |
| Capture | RMB + LMB → Aim/Throw | Seed cố định; sphere policy đúng; projectile hit đúng target; Capture.Success; cùng entity vào roster; actor removed vì Captured. |
| Failed capture | Seed fail cố định | Pal trở lại vị trí/state hợp lệ; không kẹt presentation; lần ném sau dùng được. |
| Summon | E | Đúng entity vừa bắt trở thành active actor; E tiếp theo recall nhưng roster không mất. |
| Auto-work | Đưa Pal vào bán kính, không nhấn G | assignment → arrival → production; Fuel `1→0`, Ore `0→1`; rời station thì quay về Follow. |
| Visual | Chụp sau terminal state | UI/mesh/camera so với baseline; ảnh có diff và metadata, không chỉ PNG magic. |

### Chống implementation “học thuộc bài test”

Một agent có thể làm một scenario xanh bằng hard-code mà feature vẫn sai. Test suite phải có:

- parameterized cases cho nhiều item, target, yaw, khoảng cách, latency và seed;
- invariant/property tests, ví dụ tổng quantity chỉ đổi theo transaction đã commit;
- metamorphic tests, ví dụ quay camera thêm 90° thì vector forward cũng quay 90°;
- negative/adversarial cases như duplicate request, stale revision, disconnect và asset thiếu;
- test map/fixture variants và một release suite không chỉ dùng đúng tutorial lane;
- static boundary checks để một implementation chơi được nhưng phá owner/authority vẫn bị chặn.

Test-only code được phép dựng fixture và đọc snapshot, nhưng không được tạo một nhánh gameplay kiểu `if (PaldarkAutoplay) return PASS`. Mutation phải đi qua production owner path giống người chơi thật.

## 44.8 — Kim tự tháp test phù hợp cho game Unreal

Không nên bắt bot chơi toàn game cho mọi lỗi. Càng xuống thấp, test càng nhanh và định vị tốt; càng lên cao, test càng giống người chơi nhưng đắt và dễ nhiễu.

| Tầng | Công cụ phù hợp | Ví dụ Paldark | Khi chạy |
|---|---|---|---|
| L0 — Static contract | Python/schema/source audit | manifest, tag, key validity, ownership, dependency DAG, Markdown | Mọi commit, vài phút. |
| L1 — Low-level | Unreal Low-Level Tests/Catch2 | capture formula, inventory transaction, save codec, direction math | Local + mọi PR. |
| L2 — Engine integration | Automation Spec/CQTest/commandlet | module load, GameFeature activation, asset resolve, Enhanced Input object lifetime | Mọi PR. |
| L3 — Functional map | `AFunctionalTest`, project-owned QA maps | Pickup, damage, capture success/failure, work transaction | PR theo impact + main. |
| L4 — Player-path E2E | Automation Driver/game driver + Gauntlet | W/mouse, HUD/equip, full #184 loop trong packaged build | Blocker trên PR/main. |
| L5 — Stateful/network | Gauntlet server + clients, replay/save fixtures | 1 server + 2 client, reconnect, replication, save/restart/migration | Main/nightly. |
| L6 — Visual/performance/stress | Screenshot Comparison, Insights metrics, soak bots | camera/mesh/HUD diff, 64 Pal, long-running work/world | Nightly/release. |
| L7 — Human exploratory | Designer/QA/player | fun, feel, readability, exploits mới, art direction | Mỗi milestone/release. |

Human test không biến mất. Nó chuyển từ việc lặp lại W/F/E hàng trăm lần sang tìm lỗi mới, đánh giá feel và phê duyệt thay đổi chuẩn. Khi tìm được bug mới, việc đầu tiên là đóng gói nó thành regression để con người không phải test lại mãi.

## 44.9 — Kiến trúc pipeline đề xuất

GitHub Actions nên là orchestration và merge gate; Unreal cung cấp build/test primitives bên trong:

```text
Static contracts
→ BuildGraph/UBT compile
→ Low-level + engine integration
→ Functional tests
→ Cook/package một lần
→ Gauntlet chạy đúng artifact đó
→ gom evidence
→ required check
→ promote artifact, không rebuild
```

### Runner tối thiểu

- `ubuntu-latest`: static Python/JSON/Markdown; không giả vờ build Unreal.
- self-hosted Windows có UE 5.6/toolchain: Editor compile, Win64 cook/package và physical-input packaged tests.
- runner có GPU/RHI chuẩn: visual comparison và performance; software Vulkan chỉ là smoke phụ.
- Linux Unreal runner nếu Linux client/server thực sự là platform hỗ trợ.

Runner Unreal nên dùng image/snapshot sạch hoặc ephemeral job workspace. Không cho pull request không tin cậy chạy trên máy có credential lâu dài. Cache chỉ chứa dữ liệu có thể tái tạo; package, logs, screenshots và test reports là artifact, không phải cache.

BuildGraph là lựa chọn phù hợp khi pipeline bắt đầu có nhiều node/artifact; Gauntlet phù hợp để khởi động và giám sát client/server/packaged sessions. Horde hữu ích khi cần farm, device pool, history và scale như Epic, nhưng không phải điều kiện để bắt đầu. Một Windows self-hosted runner sạch + GitHub Actions + Gauntlet đã đủ cho gate đầu tiên.

### Nhịp pipeline

| Trigger | Gate |
|---|---|
| Local trước push | L0 + L1 bị ảnh hưởng; cùng command như farm. |
| Pull request | L0, Win64 Editor compile, L1/L2, targeted L3, Movement physical-input blocker, một packaged vertical smoke nếu thời gian cho phép. |
| Merge vào `main` | Clean cook/package, Gauntlet packaged smoke, crash scan, upload evidence và artifact. |
| Nightly | Toàn L3/L4, visual matrix, save/restart, dedicated/listen + 2 client, performance và soak. |
| Release candidate | Clean rebuild đã định danh, full platform/config matrix, migration từ save cũ, long soak; promote đúng artifact đã test. |

Branch protection phải yêu cầu các check xanh và không cho bypass tùy tiện. Tên job phải duy nhất. Một legacy check đỏ thường trực phải được sửa hoặc bỏ khỏi required set; không được dạy team rằng màu đỏ là bình thường.

## 44.10 — Evidence pack để AI có thể tự tìm đúng chỗ lỗi

Mỗi test run phải tạo một thư mục tự đủ nghĩa:

```text
evidence/<run-id>/<test-id>/
  manifest.json
  result.json
  junit.xml
  runtime.log
  trace.jsonl
  replay/
  screenshots/ground-truth.png
  screenshots/incoming.png
  screenshots/diff.png
  video/
  perf.csv
  crash/
```

`manifest.json` tối thiểu chứa commit, build ID/hash, engine version, platform, config, RHI, map, scenario version, seed, clock mode, server/client topology và artifact SHA-256.

`result.json` không chỉ ghi PASS/FAIL. Nó phải chỉ được phase đầu tiên sai:

```json
{
  "test_id": "MOV-REG-156",
  "result": "FAIL",
  "phase": "direction_transform",
  "expected": { "yaw": 90, "velocity_axis": "+Y" },
  "actual": { "yaw": 90, "velocity_axis": "+X" },
  "correlation": "...",
  "owner": "Movement",
  "seed": 156
}
```

Trạng thái chuẩn là `PASS`, `FAIL`, `ERROR`, `FLAKY` hoặc `NOT_RUN`. `NOT_OBSERVED` trong required scenario phải quy về FAIL, hoặc `NOT_RUN` với `blocked_by=<test-id>` nếu một precondition trước đã fail.

Không dùng log mỗi tick. Dùng event terminal, state revision và correlation như Chương 41. Khi fail, artifact phải chứa đủ dữ kiện để AI tái hiện bằng một command, không yêu cầu người dùng quay lại game và mô tả từ đầu.

## 44.11 — Biến lịch sử bug V4 thành regression corpus

Bảng dưới là corpus khởi đầu từ lịch sử Git và Chương 18/36/43; chưa được gọi là “đủ tất cả bug” cho tới khi toàn bộ issue, feedback, video và test card V1–V4 được kiểm kê.

| Regression ID | Lỗi lịch sử | Reproduction/oracle cần khóa | Bằng chứng nguồn |
|---|---|---|---|
| `PRS-REG-138-A` | Mesh quá lớn, camera xuyên mesh | Spawn chuẩn; đo bounds/capsule/scale/camera distance; visual diff nhiều yaw/pitch. | PR #138, `98334389`, `de9ce23d`. |
| `PRS-REG-139-A` | Head/leader-pose sai, spawn lún hoặc lệch sàn | Bone/socket relation đúng; feet/capsule chạm floor sau settle. | PR #139, `bad5b2c8`. |
| `MOV-REG-147` | Không có Look action, chuột không xoay camera | Platform mouse → Look action → control rotation delta. | PR #147. |
| `MOV-REG-154` | Một chữ sai trong config làm Enhanced Input chết | Negative schema test + packaged W/mouse test; runtime PlayerInput phải là EnhancedPlayerInput. | PR #154, `a1d168c8`, `18349d0a`. |
| `MOV-REG-156` | Forward dùng actor thay vì hướng camera | W tại yaw 0/90/180; velocity xoay cùng control yaw. | PR #156. |
| `INP-REG-CONFLICT-C` | Hai context cùng bind C không arbitration | Resolver báo conflict hoặc priority/condition cho đúng một intent. | Audit #157. |
| `INT-REG-PHYSICAL-F` | QA command chạy nhưng F thật không pickup | Physical F → focus → inventory revision + actor consumed. | Chương 18/43. |
| `QA-REG-ASYNC` | Harness kết luận trước replication | Conditional wait theo correlation/revision; không sleep mù. | Chương 18.6. |
| `PKG-REG-COOKROOT` | Package pass với cook root hẹp nhưng fail root thật | Clean cook từ manifest đầy đủ; log cook roots; boot packaged artifact. | PR #157, Chương 18.7. |
| `CAP-REG-BALLISTIC` | Cầu rơi ngắn, không hội tụ tâm ngắm | Near/far target; projectile hit volume đúng; reject trước consume nếu không có nghiệm. | `574b83c7`, Chương 43.12. |
| `CAP-REG-ORIGIN` | Capture presentation kéo actor root về world origin | Root transform bất biến trong pull; chỉ visual mesh đổi local transform. | `574b83c7`, Chương 43.12. |
| `CAP-REG-RESET` | Bắt thất bại làm Pal kẹt, lần sau không sạch | Seed fail; target/movement/presentation reset; seed success tiếp theo hoạt động. | `574b83c7`. |
| `MOV-REG-CROUCH-FLOOR` | Crouch/stand làm nhân vật lơ lửng | Capsule/feet floor distance trong tolerance trước, trong và sau crouch. | `486631cc`. |
| `CMB-REG-CONTACT` | Melee aim/collision chọn sai target hoặc damage lệch frame | Target ở edge volumes; đúng target ID; damage tại contact notify. | `574b83c7`. |
| `CMP-REG-TOGGLE` | Summon/recall sai Pal hoặc mất roster | Capture entity X; E world/party/world vẫn cùng X; roster count không giảm. | Chương 43.4. |
| `CMP-REG-NONAV-FOLLOW` | Pal đứng yên khi map không có NavData | No-Nav test map; formation error giảm; catch-up ở >14 m. | `50acd945`. |
| `WRK-REG-AUTOHELP` | Phải nhấn G hoặc Pal không tự nhận việc | Summon, đưa vào 3 m, không G; assignment/arrival/output; rời >6 m quay follow. | `486631cc`, `50acd945`. |
| `PST-REG-ROUNDTRIP` | Codec có nhưng entity/world restore thiếu | Save fixture → restart process → normalized snapshot bằng expected; migration idempotent. | PR #148/#155. |
| `NET-REG-CLIENTPATH` | Server-local QA giả làm request client | Hai process; correlation bắt đầu ở client, commit server, presentation quay về đúng client. | Chương 18.6, PR #151. |

Quy tắc backfill cho từng bug:

1. tìm commit cuối còn lỗi và commit đầu đã sửa;
2. viết minimal reproduction có oracle;
3. chạy test trên buggy commit: **phải đỏ đúng lý do**;
4. chạy trên fixed commit: **phải xanh**;
5. nếu cả hai cùng xanh, test không bảo vệ bug; nếu cả hai cùng đỏ, fixture/oracle sai;
6. thêm test vào suite phù hợp và gắn owner;
7. lưu artifact cặp red/green làm bằng chứng ban đầu.

Đây là cách chứng minh test thật sự bắt bug, không chỉ chứng minh test tự báo PASS.

## 44.12 — Giao thức để AI tự sửa mà không “sửa luôn trọng tài”

Vòng lặp tự trị đề xuất:

1. AI đọc requirement ID và impact graph.
2. Với bug mới, AI tạo reproduction trước; với regression cũ, chạy test hiện có.
3. Chứng minh baseline đỏ và thu evidence pack.
4. Khoanh phase đầu tiên sai từ trace/correlation.
5. Sửa implementation nhỏ nhất.
6. Chạy L0/L1 và targeted test.
7. Chạy packaged scenario đúng platform của bug.
8. Chạy regression suite của các owner liên quan.
9. Tạo PR kèm red-before/green-after và artifact links.
10. CI required checks phán quyết; artifact xanh được promote, không rebuild.

AI không được tự làm các việc sau trong cùng thay đổi implementation nếu không có review riêng:

- nới tolerance/expected value;
- thay golden screenshot;
- đổi seed chỉ để lần này pass;
- thêm fallback làm test đi tắt;
- skip/quarantine test;
- đổi `FAIL` thành `NOT_OBSERVED`;
- xóa crash/ensure khỏi failure policy;
- sửa cả test lẫn code mà không chứng minh test đỏ trên buggy revision.

Retry chỉ dùng để đo flaky. Một lần retry xanh không xóa lần fail đầu. Test mới phải vào `staging` và chạy lặp đủ lâu trước khi được nâng thành `blocker`, theo bài học BVS của Riot.

CI không thể đảm bảo “tự sửa tất cả bug chưa từng biết”. Nó có thể đảm bảo mạnh hơn và thực tế hơn:

> Mọi bug đã tái hiện được sẽ không quay lại im lặng; bug mới tạo ra một regression mới; tỷ lệ công việc cần người lặp lại giảm dần theo thời gian.

## 44.13 — Lộ trình từ #184 tới lúc được phép bắt đầu V5

### Gate A — Làm #184 đáng tin

- terminal result tự thoát, exit code là bắt buộc;
- timeout trong/ngoài nhất quán;
- capture seed tất định;
- bỏ fallback khỏi acceptance path;
- screenshot sau assertion, tên duy nhất;
- capture oracle nối stable entity/correlation;
- JSON/JUnit + artifact bundle.

### Gate B — Nối vào CI thật

- thêm workflow PaldarkKit riêng;
- self-hosted Unreal runner sạch;
- build Editor và package Win64;
- chạy fast atomic tests và một packaged blocker;
- upload evidence dù PASS hay FAIL;
- sửa legacy red checks rồi bật branch protection.

### Gate C — Tách test pyramid

- Movement regression #138/#147/#154/#156;
- atomic Pickup/Combat/Capture/Companion/Work tests;
- giữ #184 loop làm end-to-end blocker;
- project-owned deterministic QA maps;
- staging/quarantine policy và flaky dashboard.

### Gate D — Những thứ V5 bắt buộc có ngay từ skeleton

- requirement/test IDs sống cùng feature;
- Low-Level + Functional test modules;
- Gauntlet packaged driver;
- stable entity IDs, seedable RNG, controllable clock;
- state/event snapshots chỉ đọc;
- replay/recording và save migration fixtures;
- visual/performance baselines;
- impact graph feature → test suite.

### Entry criteria cho “Làm lại PaldarkV5 từ đầu”

Không bắt đầu rewrite chỉ vì #184 đã merge. Chỉ bắt đầu khi:

1. V4 reference build và toolchain được đóng băng;
2. mọi bug đã biết được kiểm kê, bug quan trọng có red/green regression;
3. Movement và vertical loop chạy ổn định trên packaged Windows;
4. CI không còn job đỏ thường trực;
5. required checks và artifact retention hoạt động;
6. test mới qua staging trước khi thành blocker;
7. Conformance Pack có owner và người có quyền phê duyệt baseline.

### Exit criteria cho V5

V5 không “done” vì compile hay vì bot đi tới cuối map một lần. Nó chỉ đạt parity khi:

- toàn bộ required scenario trong Conformance Pack pass;
- regression corpus V1–V4 pass;
- mọi khác biệt trace/visual so với V4 được duyệt, không phải bị bỏ qua;
- packaged build, save/restart và topology multiplayer trong scope pass;
- performance budget không regression ngoài tolerance đã duyệt;
- artifact được tạo một lần và đúng artifact đó được giao test/phát hành.

## 44.14 — Quyết định kiến trúc

PR #184 nên được giữ và tiến hóa, không vứt đi. `UPaldarkAutoplaySubsystem` có thể trở thành game-side driver/controller đầu tiên, nhưng test definition nên tách dần thành scenario nhỏ, data-driven, được Automation/Gauntlet gọi và trả structured result.

Thứ tự đầu tư đúng cho Paldark không phải “thêm AI nhìn ảnh”, mà là:

1. làm oracle đúng;
2. làm scenario tái hiện được;
3. làm process/artifact đáng tin;
4. đưa vào merge gate;
5. backfill bug corpus;
6. sau đó mới cho AI tự chạy vòng sửa lỗi.

Khi đó bước ngoặt của #184 mới hoàn tất: người test không còn là người phải bấm lại mọi phím sau mỗi commit; họ trở thành người tìm lỗi mới và định nghĩa chất lượng. AI không còn nói “đã sửa”; nó phải nộp một bằng chứng máy có thể bác bỏ.

## 44.15 — Nguồn chính thức và nguồn sơ cấp

### Unreal Engine và GitHub

- [Epic — Automation Test Framework](https://dev.epicgames.com/documentation/unreal-engine/automation-test-framework-in-unreal-engine?lang=en-US)
- [Epic — Low-Level Tests](https://dev.epicgames.com/documentation/unreal-engine/low-level-tests-in-unreal-engine?lang=en-US)
- [Epic — Automation Driver](https://dev.epicgames.com/documentation/unreal-engine/automation-driver-in-unreal-engine?lang=en-US)
- [Epic — Functional Testing](https://dev.epicgames.com/documentation/unreal-engine/functional-testing-in-unreal-engine?lang=en-US)
- [Epic — Screenshot Comparison Tool](https://dev.epicgames.com/documentation/unreal-engine/screenshot-comparison-tool-in-unreal-engine?lang=en-US)
- [Epic — Gauntlet overview](https://dev.epicgames.com/documentation/unreal-engine/gauntlet-automation-framework-overview-in-unreal-engine?lang=en-US)
- [Epic — Running Gauntlet tests](https://dev.epicgames.com/documentation/unreal-engine/running-gauntlet-tests-in-unreal-engine)
- [Epic — BuildGraph](https://dev.epicgames.com/documentation/unreal-engine/buildgraph-for-unreal-engine?lang=en-US)
- [Epic — Horde](https://dev.epicgames.com/documentation/en-us/unreal-engine/horde-in-unreal-engine)
- [GitHub — Self-hosted runners](https://docs.github.com/en/actions/reference/runners/self-hosted-runners)
- [GitHub — Workflow artifacts](https://docs.github.com/en/actions/concepts/workflows-and-actions/workflow-artifacts)
- [GitHub — Protected branches and required checks](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)

### Studio/game development

- [Riot Games — Automated Testing for League of Legends](https://technology.riotgames.com/node/33)
- [GDC/DICE — AI for Testing: AutoPlayers in Battlefield V](https://www.gdcvault.com/play/1026308/AI-for-Testing-The-Development)
- [GDC/Ubisoft — AI Controlled Players for The Division](https://www.gdcvault.com/play/1026382/Automated-Testing-Using-AI-Controlled)
- [GDC/Rare — Automated Testing of Gameplay Features in Sea of Thieves](https://www.gdcvault.com/play/1026366/Automated-Testing-of-Gameplay-Features)
- [GDC/Rebellion — Automated Game Testing with a Numeric Planner](https://www.gdcvault.com/play/1027537/AI-Summit-Automated-Game-Testing)
- [GDC/Pontoco — Fixing Bugs by Cloning Them](https://gdcvault.com/play/1029182/Independent-Games-Summit-Fixing-Bugs)
- [Pocketpair — Fate Decided in 3 Days: The Accidental Story of Palworld](https://note.com/pocketpair/n/n54f674cccc40?hl=en)

---

**Bằng chứng cho chương này.** Merge `6b777c23`, diff `50acd945..9cd96a40`, source autoplay/scripts/build và workflow hiện tại là OBSERVED. Các lỗi process status, timeout, direct rotation, movement fallback, screenshot timing/PNG-only và capture oracle/RNG được suy ra trực tiếp từ source nên là OBSERVED + INFERRED về tác động. Không có archived autoplay artifact trong checkout local và không có workflow job gọi harness là OBSERVED; trạng thái run trên hạ tầng riêng của tác giả PR là UNKNOWN. Mô hình pipeline, Conformance Pack, regression IDs và entry/exit gates là PROPOSED. Các mô tả về Epic/Riot/studio bám tài liệu chính thức hoặc talk do chính studio trình bày; nội bộ CI/CD cụ thể của Pocketpair là UNKNOWN từ nguồn công khai đã tìm được.
