# Chương 36 — Kiểm toán thật PR #135–#157 và tiến độ 21–35

> Snapshot kiểm toán: `5e70218d` (sau PR #157).
> Snapshot hiện tại để so sánh: `09e9b5e7` (sau PR #178).
> Phương pháp: Git/GitHub metadata, first-parent diff và static source audit. Không chạy game; điểm playable/parity có sai số khoảng ±5% cho tới khi người dùng nghiệm thu runtime.

Một buổi làm việc có thể tạo ra hàng trăm file, hàng chục plugin và một dãy check xanh. Đứng trước khối lượng ấy, chữ “tiến độ” nghe như chỉ cần một con số. Nhưng người viết code, người chơi thử và người so sánh với Palworld đang đo ba thứ khác nhau.

Vì vậy chương này tách ba câu hỏi thường bị trộn thành một:

1. **Engineering:** đã có contract/state/authority/data/persistence tới đâu?
2. **Playable:** người chơi có thể đi vào đường đó bằng input bình thường, không dùng QA flag/console, tới đâu?
3. **Palworld parity:** catalog hành vi/content của Palworld đã được phủ tới đâu?

Một hệ thống đạt 60% engineering nhưng vẫn có 0% playable là điều hoàn toàn có thể xảy ra. Phần lớn PR #135–#157 mang đúng hình dạng ấy: nền móng đã có, nhưng người chơi chưa có con đường bình thường để bước lên nền móng đó.

## 36.1 — “11 giờ” thực tế là bao lâu

Trước khi đánh giá hiệu quả, ta phải biết chiếc đồng hồ nào đang được dùng. “Mười một giờ” có thể là thời gian code, thời gian PR mở, khoảng giữa hai merge hoặc chỉ là cách làm tròn một phiên làm việc. Git chỉ cho phép chứng minh một vài trong số đó.

| Mốc | Giờ merge UTC+7 | Khoảng cách |
|---|---:|---:|
| PR #135 | 03/08/2026 06:18:14 | — |
| PR #156 | 03/08/2026 16:53:41 | **10:35:27** |
| PR #157 | 03/08/2026 21:21:17 | **15:03:03** tính từ #135 |

Vì vậy “11 giờ” gần đúng nếu dừng ở #156. Khi câu hỏi bao gồm #157, số wall-clock có bằng chứng là **15 giờ 03 phút**. Riêng khoảng #156→#157 là **4 giờ 27 phút 36 giây**.

Không được biến merge gap thành “thời gian code”. Với #157:

- code cuối được commit lúc 17:03:28;
- năm check tĩnh hoàn tất lúc 17:05:13;
- PR merge lúc 21:21:18;
- PR body tự báo full-root cook năm nhánh, package 1,6 GB và listen/client;
- repo/CI không lưu artifact hoặc log có timestamp để tách chính xác phút cook, package và chờ merge.

Vì thế kết luận có thể bảo vệ chỉ là: **#157 chiếm nhiều wall-clock nhất; hơn bốn giờ sau CI chắc chắn không phải thời gian chạy CI.** Ta không biết chính xác phần còn lại được dùng cho cook, package hay chờ merge, nên phân bổ chi tiết phải ở lại dưới nhãn `UNKNOWN`.

## 36.2 — Khối lượng tạo ra

Nếu nhìn bằng khối lượng, cửa sổ #135–#157 rất ấn tượng. Nhưng đây cũng là nơi cần phân biệt “nhiều vật liệu xây dựng” với “nhiều căn phòng người chơi đã bước vào”.

Range diff trước #135 tới sau #157:

- **275 file**, `+16.436/-577` net;
- cộng first-parent từng PR: `+16.609/-750`, 462 lượt chạm file;
- 70 `.cpp`, 71 `.h`, 21 `Build.cs`, 44 JSON, 17 `.uplugin`, 17 `GameFeatureData.uasset`;
- 17 plugin được thêm/di chuyển trong chuỗi; tổng tại #157 là **19 Game Feature plugins** khi tính Movement và PlayerPresentation đã có trước đó;
- 273 lời gọi `UE_LOG`; 512 dòng code thêm có token QA;
- **không có C++ Automation Test/Spec mới**; #145 còn xoá hai Python test Work cũ.

Các con số chứng minh một lượng source lớn đã được tạo trong thời gian ngắn. Chúng không cho phép suy ra lượng gameplay nhìn thấy tăng theo cùng tỷ lệ; số file và số dòng không biết người chơi có bấm được một phím hay không.

Các phần Git có thể tái tạo bằng:

```bash
git log --first-parent --merges --reverse --format='%H %cI %s' d4c661db..5e70218d
git diff --shortstat d4c661db..5e70218d
git ls-tree -d --name-only 5e70218d:PaldarkKit/Plugins/GameFeatures
git diff --numstat d4c661db..5e70218d
```

Thời gian `created→merged`, review và check-run lấy từ GitHub API cho từng PR #135–#157. Không dùng nội dung PR body làm artifact độc lập nếu repo/check-run không lưu log tương ứng.

## 36.3 — Từng PR thực sự mang lại gì

Muốn biết khối lượng ấy đi đâu, ta phải hạ mắt từ tổng diff xuống từng PR. Cột `Open` chỉ là thời gian GitHub tính từ lúc tạo tới lúc merge, không phải giờ lao động; cột `ROI` được chấm theo mục tiêu người dùng: gameplay nhìn thấy cộng với nền móng thực sự cần thiết, trong đó compile là gate kỹ thuật chứ chưa phải đích đến.

| PR | Open | Diff | Kết quả thực tế | ROI |
|---|---:|---:|---|---|
| [#135](https://github.com/SlimeVRX/Soliz-Devin-Palworld/pull/135) | 1,0m | +57/-0 | Chỉ thêm hướng dẫn test Windows/listen. | Thấp |
| [#136](https://github.com/SlimeVRX/Soliz-Devin-Palworld/pull/136) | 1,8m | +1320/-24 | Interaction E/hold, server validate và resource replicated; target vẫn là fixture QA. | Cao |
| [#137](https://github.com/SlimeVRX/Soliz-Devin-Palworld/pull/137) | 46,6m | +1380/-8 | Inventory stack/transaction/event bus; thay thiết kế RPC của #136. | Rất cao |
| [#138](https://github.com/SlimeVRX/Soliz-Devin-Palworld/pull/138) | 15,6m | +426/-16 | Sửa camera, capsule, mesh, floor và input component. | Cao |
| [#139](https://github.com/SlimeVRX/Soliz-Devin-Palworld/pull/139) | 4,0m | +91/-3 | Sửa head/leader-pose và spawn lún sàn. | Cao |
| [#140](https://github.com/SlimeVRX/Soliz-Devin-Palworld/pull/140) | 6,6m | +1416/-14 | Crafting có recipe, consume/refund, timed job; thiếu station/UI thật. | Cao |
| [#141](https://github.com/SlimeVRX/Soliz-Devin-Palworld/pull/141) | 12,2m | +1443/-6 | Tách Combat/Health authority, cooldown/range/damage/death; chưa GAS, weapon, animation. | Cao |
| [#142](https://github.com/SlimeVRX/Soliz-Devin-Palworld/pull/142) | 10,5m | +1445/-3 | Capture/Creature/roster; server tin seed và damage client gửi. | Trung bình |
| [#143](https://github.com/SlimeVRX/Soliz-Devin-Palworld/pull/143) | 2,4m | +963/-2 | Party + summon một actor rỗng; summon/recall chỉ đi qua QA. | Trung bình |
| [#144](https://github.com/SlimeVRX/Soliz-Devin-Palworld/pull/144) | 10,2m | +1304/-12 | Build validate tech/material/ground/overlap nhưng không preview/input/spawn structure; progression tối thiểu. | Thấp–TB |
| [#145](https://github.com/SlimeVRX/Soliz-Devin-Palworld/pull/145) | 1,5m | +720/-447 | Work fuel→ore/offline reconcile; meaningful flow chỉ QA, chưa live scheduler. | Thấp–TB |
| [#146](https://github.com/SlimeVRX/Soliz-Devin-Palworld/pull/146) | 7,6m | +455/-47 | XP/level/point và graph hai node; chưa nối event gameplay. | Trung bình |
| [#147](https://github.com/SlimeVRX/Soliz-Devin-Palworld/pull/147) | 3,4m | +136/-4 | Mouse-look và local input binding. | Rất cao |
| [#148](https://github.com/SlimeVRX/Soliz-Devin-Palworld/pull/148) | 12,5m | +1097/-38 | Generation/chunk/manifest/checksum và năm codec; còn lỗi registry/sort/restore. | TB–cao dài hạn |
| [#149](https://github.com/SlimeVRX/Soliz-Devin-Palworld/pull/149) | 7,8m | +698/-3 | Spawn rows/population lifecycle chỉ chạy QA; actor rỗng/invisible. | Thấp |
| [#150](https://github.com/SlimeVRX/Soliz-Devin-Palworld/pull/150) | 6,7m | +940/-5 | Dungeon run/room order/reward idempotency state; không có dungeon để chơi. | Thấp |
| [#151](https://github.com/SlimeVRX/Soliz-Devin-Palworld/pull/151) | 6,1m | +817/-1 | Harness relevancy/dedup/permission hai client; không có session/join/reconnect gameplay. | Thấp |
| [#152](https://github.com/SlimeVRX/Soliz-Devin-Palworld/pull/152) | 16,2m | +600/-45 | Economy buy QA; Breeding/Condenser là deferred stub. | Thấp |
| [#153](https://github.com/SlimeVRX/Soliz-Devin-Palworld/pull/153) | 28,4m | +429/-35 | Thêm state breeding/condenser nhưng vẫn QA-only; transaction/rollback chưa atomic. | Thấp |
| [#154](https://github.com/SlimeVRX/Soliz-Devin-Palworld/pull/154) | 5,5m | +136/-2 | Sửa critical `DefaultPlayerInputClass`; phần lớn phần còn lại là diagnostics. | Fix cao |
| [#155](https://github.com/SlimeVRX/Soliz-Devin-Palworld/pull/155) | 29,6m | +559/-27 | Thêm bốn persistence codec và restart QA; restore entity/world chưa hoàn chỉnh. | Trung bình |
| [#156](https://github.com/SlimeVRX/Soliz-Devin-Palworld/pull/156) | 2,9m | +143/-5 | WASD theo camera và rotation config. | Rất cao |
| [#157](https://github.com/SlimeVRX/Soliz-Devin-Palworld/pull/157) | 257,2m | +34/-3 | Một fix Boolean modifier cho Capture; còn lại là tài liệu cook/package tự báo cáo. | Fix cao; thời gian rất thấp |

## 36.4 — CI không phải nơi 11/15 giờ đã đi

Một lời giải thích dễ chấp nhận là “CI Unreal quá chậm”. Dữ liệu check-run lại kể câu chuyện khác: pipeline trong cửa sổ này chưa hề chạy Unreal compile, cook, package hay gameplay test.

Cả 23 PR chạy đúng năm check Python/static, tổng 115 lượt:

- 92 success;
- 23 failure đều là `PaldarkV3 structural validation`;
- failure đó đã tồn tại ở base `d4c661db` trước #135;
- không có Unreal compile, cook, package hay gameplay check;
- không có human review/review comment; comment duy nhất là bot báo CI failure.

Do đó không có bằng chứng cho câu “CI Unreal đã lấy phần lớn thời gian”. Điều có thể thấy là **nhiều công sức code đi vào QA harness, log và cook/package nằm ngoài CI**, còn #157 tạo ra khoảng wall-clock dài nhất. Hai kết luận ấy hẹp hơn, nhưng chính vì hẹp nên dùng được cho quyết định tiếp theo.

## 36.5 — Rework cho thấy ta đã tối ưu sai nhịp

Rework tự nó không phải lãng phí. Một lần sửa sau feedback có thể là giá của việc học đúng. Vấn đề xuất hiện khi feedback chủ yếu đến từ scaffold và QA của nhiều hệ thống mở ngang, trong khi chưa có một vertical loop bình thường buộc chúng gặp nhau trong cùng phiên chơi.

- RPC của #136 bị #137 thay.
- #138, #139, #147, #154 và #156 đều sửa lại player/input.
- fallback progression của #144 bị #146 sửa.
- #152 tạo deferred stub rồi #153 làm lại.
- #148 thiếu codec nên #155 trả nợ.
- Capture #142 phải tới #157 mới sửa scalar modifier; các lỗ authority lớn hơn vẫn còn.
- Crafting và Combat cùng bind phím `C` ở priority 0 tại #157.

Danh sách trên cho thấy nhịp tối ưu đã đặt breadth trước integration. Mỗi hệ thống có thể tiến thêm một đoạn trên giấy, nhưng những xung đột như hai feature cùng chiếm phím `C` chỉ lộ ra khi người chơi đi qua cả hai. Đó là lý do lát cắt dọc phải đến sớm hơn, không phải muộn hơn.

## 36.6 — Chấm tiến độ đúng cách

Một con số duy nhất sẽ thưởng quá mức cho source chưa có entry point hoặc phạt sạch phần kiến trúc chỉ vì tutorial đang hỏng ở bước đầu. Ba cột `E/V/P` giữ ba loại tiến bộ tách biệt, để mỗi lần tăng điểm đều nói rõ điều gì vừa trở nên đúng hơn.

| Ch. | Hệ thống | #157 `E/V/P` | HEAD #178 `E/V/P` | Sau `61c3aaac` `E/V/P` | Khoảng trống quyết định |
|---:|---|---:|---:|---:|---|
| 21 | Di chuyển/input | 68/70/22 | 70/75/23 | 70/75/23 | stamina, climb, swim, glide, mount; server behavior cần nghiệm thu |
| 22 | Tương tác/thu thập | 58/5/12 | 62/10/14 | 70/45/17 | human gate; generic query/prompt, resource respawn/lifecycle |
| 23 | Inventory | 62/5/12 | 65/10/13 | 68/35/15 | human gate; UI/equip/use/drop/transfer/weight; atomic multi-item transaction |
| 24 | Crafting | 58/5/8 | 60/5/8 | 60/5/8 | station/queue/cancel/persist/UI và conflict input |
| 25 | Combat | 55/5/8 | 62/30/12 | 64/30/13 | weapon/projectile/dodge/element/status/GAS/AI combat |
| 26 | Capture | 60/5/10 | 70/25/18 | 82/50/25 | human gate; capture UI/game feel, species tuning, save/rejoin |
| 27 | Companion | 55/0/7 | 70/20/15 | 80/45/22 | human gate; party UI/skill/mount và canonical Creature roster persistence |
| 28 | Build | 55/0/6 | 56/0/6 | 56/0/6 | normal input, ghost/snap/rotate/actor/lifecycle/materialization |
| 29 | Work | 55/0/7 | 68/0/12 | 80/35/19 | human gate; suitability/reservation/logistics/needs/offline/crash atomicity |
| 30 | Progression | 55/0/7 | 56/0/7 | 58/0/8 | normal path, gameplay event, full graph/UI/content |
| 31 | World/life | 55/0/6 | 67/35/14 | 74/50/18 | human gate; clock/weather/population vẫn QA; biome/respawn/save ecology |
| 32 | Dungeon/boss | 50/0/5 | 51/0/5 | 51/0/5 | entrance/rooms/boss actor/normal run/resume |
| 33 | Persistence | 65/0/18 | 66/0/18 | 70/0/19 | normal save input, numeric generation, relation restore, roster codec, multi-profile |
| 34 | Multiplayer | 58/15/10 | 63/15/11 | 63/15/11 | chưa có runtime proof mới; session/reconnect/guild/dedicated evidence |
| 35 | Breeding/economy | 42/0/4 | 43/0/4 | 43/0/4 | normal API/input/UI/actor/replication và atomic transactions |

| Snapshot | Engineering | Playable bình thường | Palworld parity |
|---|---:|---:|---:|
| Sau #157 | **56,7%** | **7,0%** | **9,5%** |
| HEAD #178 | **61,9%** | **15,0%** | **12,0%** |
| Delta #158–#178 | +5,2 | +8,0 | +2,5 |
| Sau `61c3aaac` / PR #182 | **65,9%** | **25,7%** | **14,2%** |
| Delta #178→`61c3aaac` | +4,0 | +10,7 | +2,2 |

Các số là ước lượng tĩnh với sai số khoảng ±5%, dùng để so sánh snapshot và ra quyết định chứ không phải phép đo khoa học tuyệt đối. `E` cao vì contract và state có thật; `V` và `P` thấp hơn vì UI, AI, content và entry point bình thường vẫn còn thưa.

Commit hardening `cfa7bdf2` tăng độ an toàn kỹ thuật của chính spine nhưng **không được tự cộng điểm V/P trước Human Gate**. Snapshot **65,9/25,7/14,2** là static estimate về lượng source hiện có, không phải điểm gameplay đã được người chơi xác nhận.

### Kết quả runtime #182 ngày 2026-08-04

Rồi người chơi thật bước vào bản build. Ảnh test của Soliz khiến verdict `PLAYER_OBSERVABLE` phải hạ xuống **FAIL** ngay ở entry: resource sai tỷ lệ, ground sai transform, fixture chồng lấn, nhãn screen-space phủ màn hình và HUD không nói rõ nên bắt đầu từ đâu. Đây là lỗi của đường trải nghiệm được bàn giao, không phải lỗi thao tác của người test.

Để không tiếp tục tạo độ chính xác giả, tiến độ được báo theo hai trục tách biệt:

| Phép đo | Kết quả sau test #182 | Ý nghĩa |
|---|---:|---|
| Static estimate `E/V/P` | **65,9/25,7/14,2 ±5** | source/contract/normal-path coverage tìm thấy khi audit |
| Runtime-certified vertical loop | **0/1 PASS** | chưa có lần chơi trọn Sphere → Capture → Summon → Work → Ore |
| `PLAYER_OBSERVABLE` / `USER_VERIFIED` | **FAIL / chưa đạt** | người chơi chưa thể đi qua entry cũ một cách rõ ràng |

Không quy đổi tùy tiện `0/1` thành phần trăm cho từng chương: một lỗi entry có thể chặn quan sát Interaction, Capture, Companion và Work nhưng không chứng minh toàn bộ source của bốn hệ thống bằng 0. Chỉ cập nhật điểm V/P chương sau bằng chứng gameplay cụ thể.

Commit `4dfdf16e` sửa đúng blocker quan sát được: scale visual tách khỏi collision, ground về Z=0, fixture thành tutorial lane, resource label mặc định ẩn, một focus prompt, objective theo state, sky/light và station query không chặn Pal arrival. Đây vẫn chỉ là **ứng viên retest**; không tăng V/P trước verdict từ [Human Gate gameplay-only](../Q6-Kien-Truc-VibeCoding/43-human-gate-adr-001-capture-to-work.md).

## 36.7 — #178 đi đúng hướng; `61c3aaac` đóng các blocker static của spine

#158–#178 bắt đầu dịch trọng tâm về thứ người chơi có thể chạm tới: HUD, PalBehavior, projectile, shake, world content và presentation. Delta ấy có giá trị hơn cho playable path, nhưng cũng buộc các seam gặp nhau. Tại snapshot #178, source tĩnh làm lộ hai blocker tích hợp cụ thể:

1. **Interaction kind không khớp.** Interaction giữ target gần nhất nhưng đọc kind từ fixture `qa_target` là `Harvest`; world pickup yêu cầu `Pickup` và target kiểm kind tuyệt đối. Xem [InteractionFeatureComponent.cpp](https://github.com/SlimeVRX/Soliz-Devin-PaldarkKit/blob/main/PaldarkKit/Plugins/GameFeatures/Interaction/Source/Interaction/Private/InteractionFeatureComponent.cpp), [InteractionQATarget.cpp](https://github.com/SlimeVRX/Soliz-Devin-PaldarkKit/blob/main/PaldarkKit/Plugins/GameFeatures/Interaction/Source/Interaction/Private/InteractionQATarget.cpp) và [WorldFeatureSubsystem.cpp](https://github.com/SlimeVRX/Soliz-Devin-PaldarkKit/blob/main/PaldarkKit/Plugins/GameFeatures/World/Source/World/Private/WorldFeatureSubsystem.cpp).
2. **PalBehavior và Work nói hai schema khác nhau.** Producer phát `TargetCorrelationId`/`NavigationTarget`; consumer đọc `CorrelationId`/`ArrivalLocation`. Vì reader thất bại, `bWorkerAtStation` không bật; QA che lỗi bằng cách tự set state. Xem [PalBehaviorComponent.cpp](https://github.com/SlimeVRX/Soliz-Devin-PaldarkKit/blob/main/PaldarkKit/Plugins/GameFeatures/PalBehavior/Source/PalBehavior/Private/PalBehaviorComponent.cpp) và [WorkFeatureComponent.cpp](https://github.com/SlimeVRX/Soliz-Devin-PaldarkKit/blob/main/PaldarkKit/Plugins/GameFeatures/Work/Source/Work/Private/WorkFeatureComponent.cpp).

Hai lỗi không nằm trong logic riêng của producer hay consumer; chúng nằm ở ngôn ngữ hai bên dùng để gặp nhau. Đó là bằng chứng trực tiếp cho typed, versioned domain contract và cho việc khép integration slice trước khi mở thêm hệ thống. Commit `61c3aaac` đã sửa cả hai:

- Interaction camera-trace target thật, lấy `InteractionKind` từ target và để server resolve có giới hạn; pickup skeletal giữ collision query ổn định.
- PalBehavior và Work dùng chung `FPalBehaviorArrivedMessage` version 2, cùng correlation/location; Work kiểm lại actor và khoảng cách authority.

Các blocker authority/integration của vertical spine cũng đã được xử lý ở `61c3aaac`:

- Capture không còn nhận seed/aim/health/damage verdict từ client; có settlement idempotent, refund lỗi kỹ thuật, stable-ID adoption và remove Wild actor sau roster commit.
- Companion giữ cùng GUID/definition/presentation variant qua Party → deferred Summon.
- Work có normal `G`, no-NavMesh direct movement fallback, Fuel → ResonanceOre transaction với compensation và `parent_corr`.
- Inventory/Companion/Work/Progression loại Pal actor khỏi player-owned codec/state scope.

Những blocker còn lại không được che bằng điểm số:

- Human card cũ đã FAIL ở entry. Card thay thế [HT-ADR001-CAPTURE-WORK-002](../Q6-Kien-Truc-VibeCoding/43-human-gate-adr-001-capture-to-work.md) chỉ yêu cầu gameplay và ảnh/video; không yêu cầu command line, tag hay log. `V=25,7%` vẫn là static normal-path coverage, không phải `USER_VERIFIED`.
- Persistence chưa có normal save input; vẫn sort generation theo chuỗi (`9`/`10`), relation resolution chỉ log, Creature roster chưa có codec và registry chưa profile-keyed.
- Build, Progression, Dungeon, Economy, Breeding và Condenser chưa có normal-play entry point.

## 36.8 — 11 giờ có đáng không?

Câu hỏi “có đáng không?” không có nghĩa nếu ta chưa nói đáng theo mục tiêu nào. Cùng một cửa sổ công việc có thể là proof-of-concept nền tảng khá, nhưng là kết quả gameplay yếu.

Phán quyết phải phụ thuộc KPI:

- **Foundation/modular proof-of-concept:** khoảng **5/10**. Ta có 19 plugin tổng, owner contracts, state machines, intent path, persistence shell và một số va chạm thật làm lộ lỗi thiết kế.
- **Gameplay Palworld người chơi có thể cảm nhận tại #157:** khoảng **2,5–3/10**. Playable bình thường trung bình chỉ khoảng 7% và parity khoảng 9,5%.
- **Ứng viên sau `61c3aaac`:** khoảng **3,5–4/10 theo static source**, vì đã có một spine có thể đi từ Wild Pal tới Work output. Điểm này phải hạ ngay nếu human card fail; chưa được gọi là bản game đã nghiệm thu.

Vì mục tiêu được người dùng nhắc lại là gameplay, **ROI tổng không tương xứng**. Phần đáng tiền nhất là Interaction → Inventory → Crafting/Combat/Capture và các sửa Movement. Phần ROI thấp trong cửa sổ này là Dungeon, Multiplayer harness, Economy/Breeding/Condenser và phần lớn World/Persistence QA chưa có đường chơi.

Phán quyết ấy không dẫn tới việc xóa nền móng đã làm. Nó dẫn tới một thay đổi nhịp sử dụng nền móng: **ngừng mở rộng ngang, khép một vertical spine, rồi mới mở hệ thống tiếp theo**. Source cũ chỉ bắt đầu sinh lợi khi người chơi có một đường xuyên qua nó.

## 36.9 — Quy tắc có hiệu lực sau design gate

Một bài kiểm toán chỉ có ích khi nó thay đổi cách phiên sau được tổ chức. Sáu quy tắc dưới đây biến các lỗi của cửa sổ #135–#157 thành gate cụ thể cho công việc kế tiếp:

1. Agent chịu trách nhiệm ADR/contract, C++, compile, dữ liệu, log kỹ thuật và test card; người dùng chỉ mở Editor, chơi, quan sát và gửi ảnh/video gameplay nếu có lỗi. Không giao command line, tag hay log cho người dùng.
2. Không cook/package/listen-client/CI babysitting trong sprint gameplay trừ khi người dùng đổi scope hoặc compiler/linker bắt buộc.
3. Không tạo QA-only subsystem mới để gọi là tiến độ gameplay.
4. Mỗi PR phải khép một outcome nhìn thấy hoặc sửa một invariant chặn vertical spine.
5. Mỗi PR kết thúc bằng countdown có deadline cố định, ví dụ: `Vertical Spine — Capture settlement + 08h12m` và footer `T-08h12m | deadline 2026-08-05 10:00 +07`.
6. Countdown dùng thời gian tuyệt đối lúc tạo PR/commit; không làm tròn thành một con số đẹp và không reset giữa sprint.

## 36.10 — Khoảng cách tới một lát cắt chơi được kiểu KYWorld

Sau `61c3aaac`, câu hỏi không còn là “có đủ subsystem chưa?” mà là “người chơi còn vấp ở đâu trên một đường cụ thể?”. Commit `4dfdf16e` đóng các blocker presentation mà test #182 đã làm lộ, nhưng compile chỉ biến nó thành ứng viên retest — chưa thành bằng chứng người chơi.

Commit `4dfdf16e` đóng thêm các blocker presentation mà test #182 làm lộ. Đây là thay đổi source đã compile, **chưa phải bằng chứng người chơi**:

| Rủi ro sau `61c3aaac` | Trạng thái sau `4dfdf16e` | Bằng chứng thiết kế/implementation |
|---|---|---|
| HUD và Work lệch vòng đời | đóng static | Pal giữ `Working` sau arrival; HUD đọc Companion snapshot, Fuel/Ore và nghe Work fail/finished; thiếu input là paused/retry, không giả báo unassigned |
| Pickup mất đồ hoặc chặn focus | đóng static | inventory 8 slot; batch preflight nguyên tử; world chỉ decrement sau synchronous receipt; target cạn hide/disable; focus/prompt gọi `CanInteract` |
| Combat chọn nearest Pal sai ý người chơi | đóng một phần | server lọc range + forward cone + aim location + alive, bỏ qua companion đang follow; target ID canonical; còn thiếu target HP/capture chance trên reticle |
| Work station đến trước component hoặc bị E “ăn” | đóng static | World giữ weak registry + snapshot replay; Work chọn station hợp lệ gần nhất; station không nhận E và label chỉ G |
| Pal chết trở thành blocker vô hình | đóng static | Health có replicated death lifecycle; PalBehavior dừng nav/timer; combat/capture lọc alive; creature tắt collision/damage rồi remove; companion dọn actor representation |
| Entry không đọc được | chờ human retest | ground Z=0, visual scale tách collision, fixture thành lane, sky/light, một objective và một focus prompt; station query-only để Pal không bị chặn ngoài arrival radius |

Rủi ro ngoài phạm vi Standalone card vẫn còn: Crafting và Combat cùng chiếm phím `C` ở remote client; combat chưa cache result chống replay correlation; Work save/load chưa tái dựng transient assignment lease; persistence registry chưa profile-keyed. Chúng phải vào lát cắt tương ứng, không được tính là đã hoàn thành.

Ba lát cắt tiếp theo được khóa theo ROI, không mở thêm breadth trước khi qua human gate:

| Thứ tự | Lát cắt | Outcome người chơi | Điều kiện nghiệm thu |
|---:|---|---|---|
| A — source complete | Playability hardening | Có thể nhặt đồ tự nhiên, xử lý Pal chết và luôn tìm thấy Work station | `4dfdf16e` compile PASS; chờ bước 1/2/5 trong human card |
| B — source phần lõi complete | Objective/feedback contract | HUD dẫn đúng `NeedSphere → Weaken → Captured → Summon → NeedFuel → Assign → Producing → OreProduced` | snapshot/event/state đã nối; còn bỏ global Crafting `C` khỏi remote combat context và cần người chơi xác nhận readability |
| C — targeting complete, readability pending | Directed combat/capture UX | Đánh và bắt đúng Wild Pal mà camera đang nhắm | range/cone/aim/alive/friendly filter đã có; còn reticle target HP/chance và human verification |
| H — source complete, chờ retest | Entry presentation | Bấm Play là thấy tutorial lane có tỷ lệ, ánh sáng và thứ tự mục tiêu rõ ràng | bước 0 trong human card PASS; người dùng không phải tự đặt actor hay dựng map |

`4dfdf16e` tự dựng H bằng C++/JSON ngay khi bấm Play. Soliz không có nhiệm vụ tạo map, đặt NavMesh, tìm tag hay đọc Output Log. Nếu Human Gate thất bại, agent nhận số bước + ảnh gameplay rồi tự khoanh vùng bằng source/log; chỉ yêu cầu một asset binary cụ thể khi bằng chứng cho thấy source hiện có không đủ.

KYWorld chứng minh outcome chủ yếu bằng Blueprint/GAS/UI binary; C++ của họ phần lớn là framework seam, nên static source không phải lúc nào cũng đủ làm parity evidence. Tuy nhiên ảnh Designer của `W_DisplayInfo` đã cho thấy đây chỉ là một panel ẩn/hiện, một text message và hai image trang trí; `UPaldarkHUDWidget::SetCrosshairText()` hiện đã đáp ứng đường dữ liệu cần thiết bằng C++. Vì vậy **không convert `W_DisplayInfo`** và không yêu cầu Soliz cung cấp thêm thông tin về asset này. Quy tắc ngưỡng yêu cầu hỗ trợ binary được ghi tại [Chương 43](../Q6-Kien-Truc-VibeCoding/43-human-gate-adr-001-capture-to-work.md): chỉ escalate khi còn một dữ kiện gameplay/presentation không thể suy ra từ source, tên component hoặc ảnh hiện có.

## 36.11 — Hiệu chỉnh sau gameplay feedback tại `1e384ea8`

Khoảng `61c3aaac → 1e384ea8` lại tạo ra 22 commit, 139 file, `+4568/−1071`; riêng C++ là `+3938/−577`. Nếu chỉ nhìn production volume, dự án đã tiến một bước lớn. Human Gate lại trả về benchmark chính **0/1 PASS**, buộc toàn bộ khối lượng ấy được đọc dưới ánh sáng khác:

- F pickup chạy, nhưng prompt từng còn ghi E;
- attack animation chạy, nhưng người chơi quan sát thấy locomotion chưa đạt;
- không có state model Inventory → Equip, gậy bị cấp sẵn trên tay;
- Q/V throw không đúng workflow người chơi yêu cầu;
- projectile không có đường bay quan sát được từ tay tới tâm ngắm;
- vì bước ném hỏng, Capture → Party → Summon → Work không thể test.

Vì vậy phải hạ normal-play từ static estimate `25,7%` xuống **16–18% đã hiệu chỉnh theo runtime**; Palworld parity giữ khoảng **11–12%** và Engineering khoảng **66%**, sai số ±5. Đây là hiệu chỉnh toàn dự án, không tự biến một blocker đầu chuỗi thành điểm 0 cho mọi implementation phía sau.

| KPI phiên | Verdict |
|---|---:|
| Sản lượng/nền móng kỹ thuật | 5–6/10 |
| Kết quả theo benchmark gameplay | 2/10 |
| ROI tổng | khoảng 3/10 |
| Full vertical loop | 0/1 PASS |

Theo mục tiêu “bản chơi được”, phiên đó **không đáng**, dù một phần code nền vẫn có thể tái sử dụng. Compile và CI không phải nguyên nhân chính; vấn đề là source tiếp tục mở rộng trước khi state model và những seam người chơi thật sự đi qua được khép lại.

Ứng viên kế tiếp sửa đúng một lát cắt duy nhất:

    tay trống
    → F nhặt Gậy/Cầu
    → Tab Equip
    → LMB melee theo equipment context
    → Tab Equip Cầu
    → RMB aim + LMB throw
    → projectile thật rời tay
    → Capture

Source ứng viên đã nối equipment contract, Inventory UI, context arbitration, aim/throw parity với PaldarkV2 và server validation. **Không tăng V/P trước feedback gameplay mới.** Hướng dẫn nghiệm thu duy nhất là [HT-ADR001-CAPTURE-WORK-005](../Q6-Kien-Truc-VibeCoding/43-human-gate-adr-001-capture-to-work.md); người test không dùng console, tag hoặc log.

## 36.12 — Hiệu chỉnh từ gameplay feedback kế tiếp

Lần feedback kế tiếp cho ba mảnh bằng chứng thật: F pickup chạy; Tab/Equip đưa đúng Gậy hoặc Cầu lên tay; LMB gây 40 damage ở authority, để ba đòn đưa Wild Pal `100 → 60 → 20 → 0` rồi death lifecycle loại actor khỏi world. Đó là tiến bộ quan sát được, nhưng full loop vẫn **0/1 PASS** vì Capture còn đứng chắn trước Summon và Work.

Static audit tìm thấy nguyên nhân cụ thể thay vì quy lỗi cho tester:

- melee gửi điểm aim cũ sau 0,55 giây wind-up và tính cả widget/non-collision bounds;
- tốc độ Cầu 1600 không đủ cho một số điểm trace 50 m, solver fail rồi code âm thầm dùng đường thẳng nên gravity làm rơi ngắn;
- target event thiếu vị trí Cầu và presentation di chuyển actor root, tạo cảm giác Pal bị projectile bắn văng;
- final roll thất bại không reset target; projectile đã settle tồn tại tới hết lifespan;
- ba roll escape 15% làm chance thật ở 20 HP chỉ khoảng 41,8% dù final threshold ghi 68%.

Ứng viên retest sửa đúng các lỗi đó, nối crouch code/asset V2 vào phím **C** chuẩn Palworld, và giữ capture là một roll 68% ở 20 HP thay vì hardcode thành công. Engineering của Movement/Combat/Capture có source delta dương, nhưng **V/P trong bảng 36.6 chưa tăng** cho tới khi Soliz thấy Crouch, melee, đường Cầu, retry, Capture → E Summon → auto-work trực tiếp trong gameplay.

## 36.13 — Bằng chứng runtime mới: Capture → Party → E Summon đã đi được

Cuối cùng, feedback gameplay mới nhất thay đổi một kết luận cục bộ quan trọng. Soliz đã **bắt thành công Wild Pal**, rồi nhấn **E** để summon đúng Pal từ Party ra world; Pal xuất hiện và có thể di chuyển tự do hoặc follow. Capture settlement, roster handoff và Companion summon vì thế không còn chỉ tồn tại trong source audit. Đoạn `Capture → Party → E Summon` đã đi qua tay người chơi thật.

Không được suy rộng kết quả này thành PASS toàn ADR-001:

| Phép đo hiện tại | Verdict | Giới hạn bằng chứng |
|---|---:|---|
| Capture → Party → E Summon | **USER_VERIFIED** | người chơi đã thấy Pal được bắt và summon |
| Workstation → Work output | **chưa nghiệm thu** | chưa thấy Pal tự nhận station và chưa thấy Fuel/Ore transaction |
| Full vertical loop | **0/1 PASS** | chỉ đổi thành 1/1 khi `Nhiên liệu 1 → 0`, `Ore 0 → 1` qua gameplay |

Bằng chứng mới làm giảm bất định ở chương Capture/Companion, nhưng chưa đủ cơ sở để tăng lại toàn bộ V/P trong bảng 36.6: benchmark đang khóa theo outcome cuối chuỗi, Work vẫn chưa được chứng minh và sai số static vẫn khoảng ±5%. Hai lỗi presentation/movement còn cần retest là player chưa chắc quay theo camera forward trong RMB aim và Crouch làm nhân vật lơ lửng trên mặt đất.

Đích Work trong tutorial lane phải được gọi đúng là **Trạm khai khoáng Ore màu vàng**, không phải “Bàn chế tạo”. Nó nằm cuối sân, thẳng trước điểm spawn khoảng 17,5 m; **Nhiên liệu màu cam** nằm trước station. Đường test tiếp theo hoàn toàn bằng gameplay:

1. nhặt Nhiên liệu màu cam bằng **F**;
2. giữ Pal đã summon bằng **E**, đi cùng Pal tới trong khoảng **3 m** của Trạm khai khoáng Ore;
3. không nhấn **F**, không nhấn **G**;
4. chờ Pal tới station, quan sát station feedback, rồi chờ thêm khoảng **10 giây**;
5. chỉ PASS khi thấy `Nhiên liệu 1 → 0` và `Ore 0 → 1`.

Crafting không phải phần còn lại của gate này. Recipe, queue và UI Crafting chưa có normal-play path để giao người chơi test; nhãn hoặc prompt từng khiến Workstation trông giống bàn Crafting là lỗi hướng dẫn, không phải chức năng người test đã bỏ sót. Đường kiểm chứng phải hẹp đến mức một lần PASS hoặc FAIL trả lời được đúng câu hỏi đang đặt ra.
