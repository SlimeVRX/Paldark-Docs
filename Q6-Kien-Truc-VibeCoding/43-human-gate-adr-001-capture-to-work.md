# Chương 43 — Human Gate gameplay-only: Wild Pal tới Work output

> **Test ID:** HT-ADR001-CAPTURE-WORK-005
>
> **Chuẩn điều khiển:** Palworld PC keyboard/mouse, baseline 1.0, ngày đối chiếu 2026-08-05
>
> **Deadline:** 2026-08-05 10:00 +07
>
> **Nguyên tắc bắt buộc:** người test chỉ mở game, dùng bàn phím/chuột và quan sát gameplay. Không dùng command line, console, tag, correlation ID hay Output Log.

## 43.1 — Human Gate là gì?

Human Gate là lần người thật xác nhận điều người chơi nhìn thấy và điều khiển được. Agent chịu trách nhiệm code, compile, dữ liệu và chẩn đoán kỹ thuật. Soliz chỉ cần:

1. bấm **Play**;
2. làm theo mục tiêu và prompt trên HUD;
3. báo bước đầu tiên khác mô tả, kèm ảnh hoặc video nếu tiện.

Human Gate không yêu cầu đọc log, tìm Gameplay Tag, gõ lệnh hay đặt actor thủ công.

Chuỗi cần nghiệm thu:

    nhặt Gậy gỗ và Cầu Pal
    → mở túi đồ và trang bị Gậy
    → làm yếu Wild Pal
    → bắt Pal
    → gọi Pal từ Party
    → nhặt Nhiên liệu
    → Party Pal tự tìm việc phù hợp
    → nhận Resonance Ore

**Kết quả runtime 2026-08-05: ADR-001 = 1/1 USER_VERIFIED.** Người chơi đã quan sát Pal tự nhận station và biến `Nhiên liệu 1 → 0`, `Ore 0 → 1`. Compile hoặc headless boot không được dùng để tạo kết quả này; đây là bằng chứng gameplay trực tiếp. Những regression animation/input được ghi sau gate vẫn phải sửa và retest riêng.

## 43.2 — Quyết định input: làm theo Palworld, không đổi phím để né xung đột

Việc bỏ Crafting khỏi phím C chỉ giải quyết triệu chứng tranh input. Nó không biến C thành phím Attack đúng. Palworld dùng input theo ngữ cảnh: một phím có thể làm việc khác trong OnFoot, Build, UI hoặc Mounted, nhưng tại một thời điểm một lần bấm chỉ được resolve thành đúng một command.

Contract cho lát cắt này:

| Input | Ý nghĩa trong gameplay |
|---|---|
| **W A S D** | Di chuyển |
| **Chuột** | Xoay camera và đặt tâm ngắm |
| **F** | Tương tác chính với vật thể có action: nhặt vật; Crafting/context khác chỉ dùng F khi đã có UI tương ứng |
| **Tab** | Mở/đóng túi đồ và chọn Equip/Unequip |
| **Left Mouse Button** | Đánh khi Gậy đang Equip; ném khi Cầu đang Equip và đã aim |
| **Giữ Right Mouse Button** | Đưa Cầu Pal đang Equip vào trạng thái ngắm |
| **Thả Right Mouse Button** | Hủy aim nếu Cầu chưa được ném |
| **Escape** | Hủy aim Cầu Pal |
| **E** | Gọi hoặc thu Pal đang chọn trong Party |
| **V** | Nhấc Pal trong căn cứ để ném vào một trạm cụ thể; đây còn là parity gap |

Không có phím **G** toàn cục để giao việc. Crafting và Work không được sở hữu một phím vật lý riêng. Trong ADR-001, Workstation là đích AI: Party Pal đã được gọi phải tự tìm station phù hợp với Work Suitability và workload khi player đưa Pal tới gần. Người chơi **không nhấn F hoặc G lên station**. Crafting UI/queue không thuộc gate này và hiện chưa có normal-play UI để nghiệm thu.

Player bắt đầu với tay trống. Gậy/Cầu chỉ xuất hiện trên tay sau khi đã được nhặt và người chơi bấm Equip trong túi đồ. Prompt cũng không được hardcode thành “Bấm E” hoặc “Bấm G”. HUD phải lấy key đang active từ Input Action/Mapping Context để sau khi remap, dòng hướng dẫn và hành động thực tế vẫn trùng nhau.

## 43.3 — Bằng chứng cho contract

| Luận điểm | Bằng chứng | Phân loại |
|---|---|---|
| LMB Attack, E summon, RMB aim/cancel sphere, Q sphere, V pick up Pal, 1/3 đổi Pal và 2 đổi sphere | [Palworld Controls Guide — ảnh Settings của Pocketpair](https://twinfinite.net/guides/palworld-controls-guide-controller-keyboard/) | REFERENCE, ảnh UI Palworld; bài 2024 |
| PaldarkV2 đã có đường trang bị Cầu → RMB ready → LMB throw với projectile rời tay | `PaldarkV2Character.cpp`, `PaldarkV2ThrowComponent.cpp`, `PaldarkV2PresentationComponent.cpp` | LOCAL IMPLEMENTATION đã được người dùng test kỹ |
| F là contextual interaction chính; V/C/4 là các interaction option khác; MMB là direct attack order | [Palworld 1.0 controls extracted từ UI input table](https://www.palworld.tools/controls) | EXTRACTED, fan database; không phải tài liệu Pocketpair |
| Crafting/building dùng hold F; Palworld 1.0 có tùy chọn chuyển hold sang toggle | [PC Gamer, 2026-07-13](https://www.pcgamer.com/games/survival-crafting/sick-of-holding-f-in-palworld-change-these-two-settings-to-make-crafting-and-building-less-obnoxious/) | OBSERVED, Palworld 1.0 |
| Assign thủ công bằng cách nhấc Pal rồi target-throw; Party Pal được summon có thể hỗ trợ lao động | [Mobalytics Palworld 1.0 work assignment, 2026-07-24](https://mobalytics.gg/gamebase/guides/palworld-assign-specific-tasks) | REFERENCE, gameplay guide hiện hành |
| Palworld 1.0 thêm direct attack order khi aim và nhấn mouse wheel | [Palworld 1.0 changelog mirror](https://steamdb.info/patchnotes/24088745/) | RELEASE-NOTE REFERENCE |
| Palworld-like cần IMC riêng cho Default, Melee, ThrowThing, Crafting và Build | [Case Study KYWorld](https://github.com/SlimeVRX/Soliz-Devin-PaldarkKit/blob/main/Documents/PALDARK_DESIGN_WIKI/07-Case-Study-KYWorld.md) và thư mục KYWorld Content/Blueprint/Character/Player/Input | EXTRACTED, local source/assets |
| Input cần tách physical key khỏi gameplay intent; context thuộc Local Player và có priority rõ | [Bài Enhanced Input](https://github.com/SlimeVRX/Soliz-Devin-PaldarkKit/blob/main/Documents/Book/Palworld_Course/M02-Traversal-Enhanced-Input/02-001-enhanced-input-va-player-controller.md) | INTERNAL DESIGN, dựa trên Enhanced Input |
| PaldarkV2 đã tập trung action/tag/context trong DA_InputConfig_M0 và dùng IMC_Melee/IMC_ThrowThing theo mode | PaldarkV2/Input/PaldarkV2InputConfig.h, PaldarkV2Character.cpp và Content/PaldarkV2/Input | LOCAL IMPLEMENTATION |

Các nguồn hiện hành đủ mạnh để bác bỏ C=Attack và G=AssignWork. Vanilla Palworld có quick-throw Q, nhưng gate này cố ý dùng mô hình equipment-driven đã được người dùng yêu cầu và PaldarkV2 chứng minh: nhặt → Equip → RMB aim → LMB use. Đây là quyết định normal-play của Paldark, không được báo cáo sai thành parity 1:1 của quick-slot Palworld.

## 43.4 — Trạng thái đã quan sát và gap còn lại

Người chơi đã xác nhận trên build trước:

- pickup Cầu Pal, đá, gỗ và nhiên liệu đi được qua Interaction → Inventory;
- pickup biến mất và số lượng trong HUD tăng;
- overlay focus xuất hiện với một số vật thể;
- V cũ đã spawn projectile nhưng hướng ném lệch tâm ngắm;
- C cũ không tạo phản hồi nhìn thấy;
- G cũ báo NoFollower và không giúp người chơi hiểu workflow.

Feedback gameplay mới nhất xác nhận được một đoạn dài hơn của spine:

- Wild Pal đã được bắt thành công và đi vào Party;
- **E** đã summon, recall rồi summon lại đúng Pal vừa bắt;
- Party Pal được đưa tới gần Trạm khai khoáng Ore đã tự nhận việc, không cần F/G;
- production authority đã consume `Nhiên liệu 1 → 0` và tạo `Ore 0 → 1` mà người chơi nhìn thấy;
- vì vậy kết quả toàn ADR-001 là **1/1 USER_VERIFIED**, không phải suy luận từ compile hay từ riêng E summon.

Hai lỗi nhìn thấy còn phải retest sau source checkpoint kế tiếp là: khi giữ RMB, player phải quay theo hướng camera/tâm ngắm; Crouch không được nâng capsule/feet khỏi mặt đất và sau khi đứng lên vẫn phải chạm đất.

Các kết quả đó chứng minh một số system seam hoạt động, nhưng không chứng minh layout phím hay loop gameplay đã PASS. Một build vẫn hướng dẫn **E → C → V → R → G** phải bị đánh FAIL vì dùng input tạm.

Gap được ghi rõ:

- **Manual assignment bằng V**: Palworld cho phép nhấc Pal trong căn cứ và ném vào station đang aim. PaldarkKit chưa được tính là có chức năng này.
- **Party Pal auto-help**: là normal-play path bắt buộc của ADR-001. Sau E summon, Pal phải tự chọn station phù hợp; không được yêu cầu G để kích hoạt.
- **Partner Skill/Roll**: ngoài phạm vi gate này và chưa gán phím bằng suy đoán.

## 43.5 — Build phải trông như thế nào ngay khi bấm Play?

Trong khoảng năm giây đầu phải nhìn thấy:

- bầu trời sáng và mặt đất đúng dưới chân nhân vật;
- một thẻ mục tiêu gọn ở giữa phía trên;
- số lượng vật phẩm cần cho loop;
- một tâm ngắm nhỏ giữa màn hình;
- Gậy gỗ và cụm Cầu Pal ở phía trước;
- gỗ, đá, Wild Pal, **Nhiên liệu màu cam** và **Trạm khai khoáng Ore màu vàng** được giãn thành một đường chơi; station nằm cuối sân, thẳng phía trước điểm spawn khoảng 17,5 m;
- không có vật thể khổng lồ hoặc nhãn chữ phủ màn hình.

Tên/HP Wild Pal có thể hiện trong tầm nhìn. Tên vật thể và prompt chỉ hiện khi tâm ngắm thực sự focus vật đó. Pickup phải dùng **F**, không phải E/G. Trạm khai khoáng chỉ hiện hướng dẫn đưa Pal tới gần; station không được nói dối rằng phải nhấn F/G.

Nếu một điều trên sai, dừng và báo **FAIL bước 0**.

## 43.6 — Chuẩn bị

1. Dừng PIE và đóng Unreal Editor nếu đang giữ native DLL cũ.
2. Mở [PaldarkKit.uproject](https://github.com/SlimeVRX/Soliz-Devin-PaldarkKit/blob/main/PaldarkKit/PaldarkKit.uproject) tại HEAD cần nghiệm thu.
3. Không mở Output Log, không nhập launch option và không chọn QA mode.
4. Bấm **Play** ở chế độ Selected Viewport.

Map Entry phải tự dựng tutorial lane. Người test không đặt actor, gắn tag hoặc đổi map.

## 43.7 — Human Gate hoàn toàn bằng gameplay

### Bước 0 — Màn hình bắt đầu

HUD phải tự chỉ việc đầu tiên và mọi thứ trong 43.5 phải đọc được.

**PASS:** màn hình sạch, tỷ lệ vật thể hợp lý, Cầu Pal nằm phía trước và prompt không phủ màn hình.

### Bước 1 — Nhặt Gậy gỗ và Cầu Pal bằng F

1. Đi tới Gậy gỗ, đặt tâm ngắm lên gậy cho tới khi thấy **[F] Gậy gỗ** và overlay focus.
2. Nhấn F một lần; model gậy phải biến mất nhưng tay player vẫn trống.
3. Đi tới Cầu Pal, focus cho tới khi thấy **[F] Cầu Pal**, rồi nhấn F một lần.
4. Quan sát model Cầu biến mất và số lượng trong HUD tăng.
5. Nhấn **Tab**. Túi đồ phải hiện Gậy gỗ và Cầu Pal; không cần console hay tag.
6. Bấm **Trang bị Gậy gỗ**. Túi đồ đóng, gậy mới xuất hiện trên tay.

**PASS:** mỗi F tạo đúng một lần pickup, model biến mất sau khi inventory nhận vật, tay vẫn trống trước Equip và gậy xuất hiện đúng sau Equip.

Nếu HUD vẫn ghi E, build này **FAIL contract input** dù pickup có tăng.

### Bước 2 — Làm yếu Wild Pal bằng LMB

1. Đứng cách Wild Pal khoảng 2 m và đặt Pal vào tâm ngắm.
2. Nhấn **Left Mouse Button** một lần.
3. Phải thấy vung gậy, Pal hit-react và HP giảm khoảng 100 → 60.
4. Chờ animation/recovery kết thúc rồi nhấn LMB lần hai.
5. Dừng ở khoảng 20 HP; không đánh lần ba.
6. Trong ít nhất một đòn, giữ **W** khi bấm LMB: thân trên vung gậy nhưng hai chân vẫn tiếp tục locomotion, không trượt bằng pose đứng yên.
7. Nhấn **Tab**, bấm **Trang bị Cầu Pal**. Gậy biến mất và Cầu xuất hiện trên tay.

**PASS:** mỗi lần LMB tạo đúng một attack, animation và thời điểm damage khớp nhau, upper-body blend giữ được chân di chuyển, Pal còn sống ở mức máu dễ bắt và Equip Cầu đổi đúng vật trên tay.

Nếu C đánh được nhưng LMB không đánh, build **FAIL contract input**.

### Bước 3 — Ngắm và ném Cầu Pal bằng RMB + LMB

1. Giữ **Right Mouse Button** trong khi vẫn đặt Wild Pal vào tâm ngắm.
2. Phải thấy nhân vật đưa Cầu Pal lên tay/trạng thái aim; chưa được consume cầu.
3. Di chuyển camera sang trái/phải để xác nhận hướng aim bám tâm ngắm; thân player phải quay theo camera forward, không tiếp tục nhìn lệch hoặc nhìn ngược hướng ném.
4. Trong khi vẫn giữ RMB, nhấn **Left Mouse Button** để ném đúng một quả.
5. Cầu phải rời tay, hội tụ qua tâm ngắm tại độ sâu của Pal và không chạm sàn ngay trước mặt.
6. Không thả RMB: sau khoảng **1,42 giây**, nhân vật phải trở thẳng về tư thế chuẩn bị ném, không lóe qua Idle và không phải nhả/nhấn lại RMB.
7. Nếu Cầu trước vẫn đang bay hoặc đang xử lý capture, LMB tiếp theo không được chơi một throw giả hoặc trừ thêm Cầu; HUD báo chờ kết quả nhưng tư thế aim vẫn giữ. Ngay khi kết quả chốt, LMB tiếp theo phải ném được.

Kiểm tra hủy, chỉ cần làm một lần khi còn ít nhất hai Cầu:

1. giữ RMB để aim;
2. thả RMB mà không nhấn LMB, hoặc nhấn **Escape**;
3. xác nhận aim kết thúc và số Cầu không giảm.

**PASS:** chỉ LMB trong trạng thái RMB aim mới commit throw; giữ RMB qua recovery trở lại aim-ready ngay; cancel không consume; bắt thành công làm Wild Pal biến khỏi world và thêm Pal vào Party.

Nếu Q/V vẫn là đường ném chính, hoặc LMB ném khi chưa aim, build **FAIL contract input/equipment**.

### Bước 4 — Gọi Pal bằng E

1. Nhấn **E** một lần.
2. Không cần mở menu hoặc chọn slot trong vertical slice một-Pal.

**PASS:** đúng Pal vừa bắt xuất hiện gần player và bắt đầu follow. Nhấn E lần nữa phải recall; nhấn E thêm lần nữa phải summon lại.

**Cơ chế Party hiện tại:** vertical slice có một active Party slot. Entity Pal luôn còn trong roster; E chỉ toggle representation của active slot:

- `Party → World`: spawn actor Pal gần player và gán `FollowOwner`;
- `World → Party`: destroy actor representation để recall, không xóa entity khỏi roster;
- E tiếp theo lại spawn đúng entity đó gần vị trí player hiện tại.

`FollowOwner` không còn đo một vòng tròn lớn quanh chính player rồi để Pal đứng đóng đinh. Pal giữ một **formation anchor** ở khoảng 1,5 m phía sau và 2,3 m bên cạnh hướng nhìn của owner. Pal bắt đầu sửa đội hình khi lệch anchor khoảng 1,4 m, dừng trong bán kính 0,65 m và đi với tốc độ 5 m/s — nhanh hơn walk speed 4,5 m/s của player để thật sự khép khoảng cách. Khi owner đứng yên, cứ khoảng 3 giây Pal chọn một điểm tuần tra ổn định nhỏ trong bán kính tối đa 1,2 m quanh anchor; điểm không đổi theo từng frame nên không rung. Khi owner di chuyển, loiter được bỏ ngay và Pal trở về anchor. Nếu bị bỏ xa trên 14 m, Pal catch-up về cạnh owner thay vì mất khỏi gameplay.

Movement đi theo hai tầng: ưu tiên pathfinding khi level có NavData; nếu navigation từ chối hoặc path thất bại bất đồng bộ, `CharacterMovement` lái trực tiếp tới anchor động. Tầng fallback là bắt buộc cho Human Gate đang chạy trên `/Engine/Maps/Entry`, nơi log gameplay đã xác nhận `NavigationUnavailable`; Work trước đây vẫn đi được vì đã có fallback, còn Follow đã bỏ qua kết quả thất bại nên đứng yên. Nếu có work target hợp lệ, `Working` vẫn ưu tiên hơn formation follow. Auto-work được nhận khi player đưa Party Pal vào phạm vi 3 m quanh trạm và tự nhả khi player rời xa trạm quá 6 m; sau đó Pal trở về `FollowOwner`. Hai bán kính khác nhau ngăn trạng thái Work/Follow rung qua lại ở rìa trạm.

Thiết kế này không đoán mò: KYWorld dùng nhánh xa `DistanceToTarget >= 500` để `MoveTo ParentActor`, còn nhánh gần chạy EQS patrol quanh `ParentActor` rồi MoveTo/Wait trong [`BT_GroundMonster_Friend.uasset`](https://github.com/SlimeVRX/Soliz-Devin-PaldarkKit/blob/main/02.Palworld/Source/Content/Blueprint/Character/Pal/GroundMonster/BT_GroundMonster_Friend.uasset) và [`EQS_Pal_PatrolParentActor.uasset`](https://github.com/SlimeVRX/Soliz-Devin-PaldarkKit/blob/main/02.Palworld/Source/Content/Blueprint/Character/Pal/EQS/EQS_Pal_PatrolParentActor.uasset). PaldarkV2 chứng minh navigation-first rồi `AddMovementInput` fallback trong [`PaldarkV2PalCharacter.cpp`](https://github.com/SlimeVRX/Soliz-Devin-PaldarkKit/blob/main/PaldarkV2/Source/PaldarkV2/Private/Pal/PaldarkV2PalCharacter.cpp); PaldarkV3 chứng minh owner-relative formation và catch-up trong [`PaldarkV3CompanionPal.cpp`](https://github.com/SlimeVRX/Soliz-Devin-PaldarkKit/blob/main/PaldarkV3/Source/PaldarkV3Gameplay/Private/Companion/PaldarkV3CompanionPal.cpp). PaldarkKit thu nhỏ bán kính patrol của KYWorld để một Pal cạnh player có chuyển động sống nhưng không đi lang thang xa.

**Bằng chứng hiện có:** người chơi đã bắt thành công và thấy chuỗi E summon → recall → summon lại đúng Pal.

Nếu R summon nhưng E không summon, build **FAIL contract input**.

### Bước 5 — Nhặt nhiên liệu bằng F

1. Đi thẳng về cuối sân; nhặt vật phẩm **Nhiên liệu màu cam** nằm trước station màu vàng.
2. Focus cho tới khi thấy **[F] Nhiên liệu**.
3. Tương tác F một lần.

**PASS:** nhiên liệu biến mất, HUD ghi Nhiên liệu 1 và inventory tăng đúng một.

### Bước 6 — Party Pal tự làm việc, không dùng G

1. Giữ Pal ở trạng thái đã summon bằng E.
2. Đi thẳng tới **Trạm khai khoáng Ore màu vàng** ở cuối sân, khoảng 17,5 m trước điểm spawn; đưa Party Pal vào phạm vi khoảng **3 m** quanh station.
3. Không nhấn **F**, không nhấn **G** và không mở console. Station này không phải menu Crafting.
4. Quan sát Pal rời trạng thái follow/tự do, tự chọn station, di chuyển tới station và bắt đầu trạng thái làm việc; station phải có feedback/pulse đang chạy.
5. Chờ Pal tới nơi, rồi chờ thêm khoảng **10 giây** cho một chu kỳ sản xuất.

**PASS:** Pal tự nhận việc, station có feedback đang chạy, HUD/inventory đổi **Nhiên liệu 1 → 0** và **Ore 0 → 1**.

Trạm chạy queue liên tục theo công thức **1 Nhiên liệu → 1 Resonance Ore / khoảng 10 giây**. Dòng kỹ thuật cũ `Chưa thể giao việc: MissingInput` thực chất có nghĩa:

- Pal **đã được giao việc** và vẫn đứng chờ tại station;
- túi Player hiện không còn một đơn vị **Nhiên liệu** để bắt đầu chu kỳ tiếp theo;
- sau khi một Ore hoàn thành, nếu nhiên liệu vừa về 0 thì trạng thái chờ này là bình thường;
- nhặt thêm Nhiên liệu sẽ làm production tự tiếp tục, không cần recall/summon và không nhấn F/G.

Checkpoint mới đổi thông báo thành tiếng Việt rõ nghĩa và chỉ phát một lần cho mỗi giai đoạn chờ, thay vì lặp `MissingInput` mỗi chu kỳ.

Nếu phải nhấn G mới chạy, build **FAIL Palworld parity**. Nếu Pal chỉ đứng follow và không tự tìm station, báo **FAIL bước 6 — auto-help chưa hoạt động**.

Manual assignment bằng V không phải đường cứu hộ cho gate này. Nó là chức năng Palworld còn thiếu và phải được triển khai, không được dùng để che lỗi auto-help.

“Bàn chế tạo” từng xuất hiện trong tutorial lane là nhãn gây hiểu nhầm của Workstation này. Tên nghiệm thu đúng là **Trạm khai khoáng Ore**. Crafting recipe/queue/UI là một gate riêng; hiện không yêu cầu người chơi nhấn F vào bàn và không tính Crafting là PASS từ ADR-001.

## 43.8 — Điều kiện PASS/FAIL toàn loop

Toàn Human Gate chỉ PASS khi bước 0–6 đều PASS và quan sát được:

1. pickup thực sự biến khỏi world;
2. damage thực sự giảm HP;
3. Equip Cầu + RMB/LMB có aim–throw–cancel đúng;
4. Wild Pal biến khỏi world sau capture;
5. E tạo đúng Pal party actor;
6. Party Pal tự tới station mà không có G;
7. Ore thực sự tăng từ 0 lên 1.

Save/restart, cook, package và multiplayer không thuộc gate này.

**Kết quả nghiệm thu:** **1/1 USER_VERIFIED ngày 2026-08-05** — người chơi đã trực tiếp quan sát đủ Capture → Party/Summon → Work output và `Nhiên liệu 1 → 0`, `Ore 0 → 1`.

## 43.9 — Cách báo lỗi ngắn nhất

Không gửi log. Chỉ cần:

    Build: commit đang test
    Kết quả: PASS hoặc FAIL
    Dừng ở bước: 0 / 1 / 2 / 3 / 4 / 5 / 6
    Điều tôi nhìn thấy: ...
    Ảnh hoặc video: ...

Ví dụ: “FAIL bước 3 — giữ RMB không thấy tư thế ngắm” là đủ để agent khoanh vùng. Không cần actor name, tag, correlation ID hay dòng PALDARK_*.

## 43.10 — Trách nhiệm kỹ thuật của agent

Trước khi giao Human Gate, agent phải tự:

- compile PaldarkKitEditor bằng Unreal Engine 5.6;
- parse toàn bộ input/content JSON;
- kiểm tra asset melee/throw/sphere load được;
- chạy audit phát hiện hai active contexts map cùng một key mà không có explicit arbitration;
- bảo đảm HUD prompt lấy key từ active mapping thay vì chuỗi hardcode;
- kiểm tra một input event chỉ phát một semantic intent và một correlation;
- chạy diff check và review đối kháng.

Các kiểm tra đó không thay thế gameplay PASS.

## 43.11 — Ngưỡng yêu cầu Soliz hỗ trợ asset binary

Agent tự triển khai từ source, asset name và ảnh Designer khi hành vi suy ra trực tiếp. Chỉ yêu cầu Soliz mở/convert asset nếu còn thiếu dữ kiện làm thay đổi kết quả, ví dụ:

- Blueprint chứa state machine gameplay không có source tương đương;
- animation notify/timeline/curve quyết định timing;
- DataTable/DataAsset bắt buộc nhưng không có JSON/CSV;
- widget phức tạp có binding, animation hoặc responsive rule không đọc được.

Mỗi yêu cầu phải nêu một dữ kiện thiếu, vì sao source hiện có chưa đủ và output tối thiểu cần nhận. Không yêu cầu convert chỉ để “tham khảo cho chắc”.

## 43.12 — Capture: điều kiện thật và checkpoint sửa lỗi sau feedback

Wild Pal trong tutorial có **100 HP**; Gậy gỗ gây **40 damage** mỗi đòn. Vì vậy chuỗi đúng là `100 → 60 → 20`; đòn thứ ba đưa HP về 0 và Wild Pal biến mất theo death lifecycle. Đây không phải capture. Người chơi phải dừng sau đúng hai đòn.

Một Cầu Pal trúng mục tiêu còn sống tạo đúng một lần roll authority-side:

```text
hp_ratio = current_hp / max_hp
capture_chance = clamp(0.85 × (1 - hp_ratio) × 1.0, 0.05, 0.95)
success = server_roll < capture_chance
```

Tương ứng: 100 HP = 5%, 60 HP = 34%, 20 HP = 68%. Capture vẫn là xác suất, không hardcode thành công để vượt gate. HUD phải hiện HP và phần trăm của lần ném để người test hiểu kết quả. Ba nhịp rung là presentation; không được nhân thêm ba roll escape 15% làm xác suất thực thấp hơn phần trăm công bố.

Static audit từ feedback đã tìm được ba lỗi độc lập:

1. khi ballistic solver không có nghiệm ở speed 1600, code âm thầm dùng vector thẳng; gravity làm Cầu rơi trước crosshair;
2. `AttemptStarted` gửi vị trí Cầu cho player nhưng bỏ vị trí ở event của Wild Pal; presentation đọc vector mặc định và kéo **actor root** về world origin, tạo cảm giác Pal bị bắn văng;
3. final roll thất bại publish result nhưng không publish reset/escape cho target, khiến Pal kẹt ở capture-pulling và lần ném sau không còn là một attempt sạch.

Checkpoint sửa lỗi dùng speed cơ sở 2500, tự tăng tối đa 5000 để tìm low arc; nếu vẫn không có nghiệm thì từ chối trước khi consume Cầu thay vì nói dối crosshair. Capture chỉ kéo visual mesh theo local space, không di chuyển actor/collision; movement của target được tạm dừng trong ba nhịp rung rồi phục hồi nếu thất bại. Mọi terminal failure đều reset presentation và dọn projectile đã settle trước khi cho phép lần ném kế tiếp.

### Retest gameplay-only ngắn nhất

1. Nhấn **C** khi đứng và khi đi: phải thấy crouch idle/crouch walk nhưng bàn chân/capsule vẫn chạm mặt đất; nhấn lại để đứng và vẫn phải chạm đất, không giữ độ cao lơ lửng. Shift phải tự đứng lên, C phải hủy sprint. Đây là phím Palworld; Left Ctrl được dành cho roll/dodge về sau.
2. Equip Gậy, đứng khoảng 2 m, đặt crosshair lên bất kỳ phần thân Pal và LMB đúng hai lần. Phải dừng ở 20 HP.
3. Equip Cầu, giữ RMB rồi xoay camera trái/phải: player phải quay theo camera forward. Thử một lần ở gần và một lần xa hơn: Cầu phải rời tay theo cung và hội tụ vào điểm crosshair, không rơi ngắn.
4. Nếu lần đầu báo thất bại 68%, Pal phải trở lại hình dạng/vị trí bình thường và nhận được lần ném thứ hai.
5. Khi thành công, Wild Pal biến khỏi world, HUD báo vào Party; tiếp tục ngay bước 4 bằng **E**.
6. Sau E summon, nhặt Nhiên liệu màu cam bằng F, đưa Pal tới trong khoảng 3 m của Trạm khai khoáng Ore màu vàng ở cuối sân; không nhấn F/G, chờ Pal tới nơi và thêm khoảng 10 giây để xác nhận `Nhiên liệu 1 → 0`, `Ore 0 → 1`.

Không cần console, log, tag hoặc command line cho retest này.
