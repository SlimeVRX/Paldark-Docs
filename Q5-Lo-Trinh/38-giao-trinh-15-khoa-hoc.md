# Giáo trình tổng — 15 khoá Paldark dựa trên 13 nguồn học

Tài liệu này là **curriculum contract/mục lục bài giảng**, chưa phải nội dung hoàn chỉnh của từng bài. Mười lăm khoá tương ứng hệ thống 21–35; chúng dùng 13 course repository làm nguồn. Mỗi bài được đặt theo một câu hỏi bắt buộc phải trả lời trước khi bài kế tiếp xuất hiện. Nguồn tham chiếu được đối chiếu trong [bản đồ tài liệu](../PhuLuc/ban-do-tai-lieu.md) và được chấm độ tin cậy trong [kiểm kê 13 khoá](../PhuLuc/D-kiem-ke-13-khoa-hoc.md).

Mỗi source citation khi triển khai bài thật phải mang một nhãn: `[C++]`, `[Asset]`, `[Doc]`, `[Inference]` hoặc `[Unknown]`. `KYWorld` có thể là đường dẫn C++ **hoặc** asset binary; tên một `.uasset` chỉ chứng minh asset tồn tại, không chứng minh graph bên trong đã được đọc. Khoá 12/14/15/16 là doc-only trong workspace hiện tại. Course 10 và 14 có bất thường mapping được ghi ở Phụ lục D; không dùng SHA/path chưa xác minh để tuyên bố source proof.

Điểm phức tạp trong từng mục dùng mô hình bảy trục `S/N/A/U/C/R/I` ở Chương 37; không xem số bài là estimate giờ. Các khoá có AI, UI, mạng, content, luật hoặc integration có nhiều bài hơn vì đó là phần còn thiếu thực sự.

Một bài chỉ được đánh dấu hoàn chỉnh sau chuỗi `DESIGNED → SOURCE_PRESENT → COMPILED → INTEGRATED → PLAYER_OBSERVABLE → USER_VERIFIED`; bài giảng được viết sau feedback để lý thuyết và code không chạy lệch nhau.

## Khoá 21 — Di chuyển và input

**Người học làm được gì:** Từ một phím và một chuyển động camera, người học tạo được locomotion third-person theo hướng camera, có presentation tách khỏi authority và sẵn sàng mở rộng sang cưỡi, lượn, leo và bơi.

**Độ phức tạp:** **17 điểm** (S2/N3/A1/U2/C4/R2/I3) — **6 bài giảng**.

1. **Vì sao bấm W sau khi xoay camera mà nhân vật vẫn chạy về hướng cũ?** Câu hỏi này buộc phân biệt input intent, control rotation và actor rotation trước khi sửa vector di chuyển. **Đụng:** `Movement`, `PlayerPresentation`. **Nguồn:** `02.Palworld 10-003`; KYWorld `BaseInputComponent.h`, `DataAsset_InputConfig.h/.cpp`, `PlayerCharacter.h/.cpp`.
2. **Ai biến giá trị Axis2D thành một hướng trên mặt đất?** Chọn yaw-only basis và đặt contract cho `MoveForward`/`MoveRight`; pitch/roll không được lọt vào movement plane. **Đụng:** `Movement`. **Nguồn:** `13.… 02-008`; `11.… 02-010`; KYWorld `BaseCharacter.h/.cpp`.
3. **Vì sao camera xoay được nhưng thân nhân vật không nên dính cứng vào camera?** Tách `bUseControllerRotationYaw`, `bOrientRotationToMovement` và spring-arm control rotation thành ba quyết định presentation có thể kiểm tra độc lập. **Đụng:** `Movement`, `PlayerPresentation`. **Nguồn:** `14.… 02-007`; KYWorld `PlayerCharacter.h/.cpp`.
4. **Làm sao một input data-driven sống qua nhiều pawn mà không biến thành chuỗi tên rải rác?** Tạo InputConfig/DataAsset và mapping contract, để feature chỉ biết action generic. **Đụng:** `Movement/Data`, `Movement/Source`. **Nguồn:** KYWorld `DA_InputConfig.uasset`, `DataAsset_InputConfig.h/.cpp`.
5. **Khi locomotion đúng, vì sao người chơi vẫn thấy nhân vật “trượt”?** Nối speed, acceleration, rotation rate và animation-facing state vào presentation mà không cho AnimBP sở hữu movement state. **Đụng:** `PlayerPresentation`, `Movement`. **Nguồn:** `13.… 02-009`, `02-010`, `02-011`; KYWorld `PlayerAnimInstance.h/.cpp`.
6. **Làm sao để cưỡi, lượn, leo và bơi không phá contract locomotion hiện tại?** Mở rộng movement mode bằng intent/capability thay vì thêm nhánh đặc biệt vào input handler. **Đụng:** `Movement`, `Creature`, `Companion`. **Nguồn:** tự phân rã từ bảng 37.2; tham chiếu `KYWorld 10-002`, không có source trực tiếp cho các mode này.

**Điều kiện tiên quyết:** Core/Game Features composition và các contract entity hiện có; không cần hoàn tất khoá khác.

## Khoá 22 — Tương tác và thu thập

**Người học làm được gì:** Người học tạo được vòng lặp nhìn thấy vật thể, nhận prompt, trace, tương tác có authority và nhận phản hồi thu thập qua một contract generic.

**Độ phức tạp:** **20 điểm** (S3/N3/A1/U3/C4/R2/I4) — **5 bài giảng**.

1. **Vì sao nhìn thấy một vật thể mà người chơi vẫn không biết có thể nhặt?** Xác định cảm giác “đang ngắm đúng vật” và state tối thiểu cho target/prompt. **Đụng:** `Interaction`, `PlayerPresentation`. **Nguồn:** KYWorld `IInteractInterface.uasset`, `W_PickupWidget.uasset`.
2. **Trace nào quyết định vật thể trước mặt là mục tiêu hợp lệ?** Chọn channel, khoảng cách, lọc interface và stable target identity trước khi gọi mutation. **Đụng:** `Interaction/Source`, `Interaction/Data`. **Nguồn:** `02.Palworld 02-003`; `09.… 01-009`; KYWorld `GA_Interact.uasset`.
3. **Tại sao phím F phải gửi intent thay vì tự trừ item ở client?** Tách local prompt khỏi server interaction command, validation và rejection reason. **Đụng:** `Interaction`, `Inventory`, `Multiplayer`. **Nguồn:** `02.Palworld 02-002`; `09.… 01-007`.
4. **Làm sao thu thập có cảm giác hoàn tất chứ không chỉ đổi một con số?** Nối owner mutation với pickup animation, outline, notification và generic gameplay message. **Đụng:** `Interaction/Content`, `Inventory/Content`. **Nguồn:** `09.… 01-011`; KYWorld `W_PickupWidget.uasset`.
5. **Khi hai người cùng tương tác một node, ai thắng và người kia thấy gì?** Định nghĩa idempotency, lock/claim và thông báo thất bại mà không để Interaction biết implementation của resource. **Đụng:** `Interaction`, `Multiplayer`, `World`. **Nguồn:** tự phân rã; tham chiếu `07.… 03-002`, `03-008`.

**Điều kiện tiên quyết:** Khoá 21; đọc contract Inventory của khoá 23 trước khi nối reward/item.

## Khoá 23 — Vật phẩm và túi đồ

**Người học làm được gì:** Người học xây được inventory authoritative có item definition, slot/stack, replicated delta, equipment, container và UMG grid mà UI không trở thành owner của state.

**Độ phức tạp:** **26 điểm** (S4/N4/A1/U5/C4/R3/I5) — **11 bài giảng**.

1. **Vì sao nhặt một vật mà người chơi cần thấy nó nằm ở đúng ô, đúng số lượng?** Từ cảm giác inventory, phân rã item identity, stack count, slot và container owner. **Đụng:** `Inventory`, `PlayerPresentation`. **Nguồn:** `09.… 03-002/03-007` cho Fast Array/manifest; KYWorld `InventoryComponentBase.h` chỉ là shell và `FSlotStruct.uasset` chỉ chứng minh asset/taxonomy tồn tại.
2. **Item definition và item instance khác nhau ở đâu?** Chọn data-driven definition + mutable instance để equipment, durability và persistence không trộn vào DataTable. **Đụng:** `Inventory/Data`, `Inventory/Source`. **Nguồn:** `09.… 03-007`; `02.Palworld 03-001/03-002`.
3. **Làm sao thêm một item mà không sửa switch lớn?** Dùng fragments/traits cho icon, stackable, equippable và usable behavior. **Đụng:** `Inventory`. **Nguồn:** `09.… 04-002`, `04-011`; `17.… 10-001`.
4. **Khi item đổi trên server, client nhận delta nào?** Chọn Fast Array/replicated container, owner boundary và notification thay vì gửi cả inventory mỗi lần. **Đụng:** `Inventory`, `Multiplayer`. **Nguồn:** `09.… 03-002`, `03-006`; `07.… 03-004`, `03-005`.
5. **Tại sao một stack mới không được tự ý vượt max stack?** Đặt thuật toán FindSlot/AddToStack/CreateNewStack và các rejection path có thể truy nguyên. **Đụng:** `Inventory/Source`. **Nguồn:** KYWorld `InventorySystem.uasset`, `FSlotStruct.uasset`; `02.Palworld 04-003/04-004`.
6. **Kéo một item sang ô khác phải giữ invariant nào?** Thiết kế move, swap, split và transfer giữa player/container như command có validate. **Đụng:** `Inventory`, `Interaction`. **Nguồn:** KYWorld `InventoryManager.uasset`, `W_ContainerInventory.uasset`; `09.… 08-011`, `09-007`.
7. **Làm sao UI biết ô nào đổi mà không sở hữu inventory?** Tạo view model/read model và message từ owner sang UMG. **Đụng:** `Inventory/Content`, `PlayerPresentation`. **Nguồn:** `09.… 02-005`, `04-013`; `17.… 10-002`.
8. **Vì sao trang bị phải là một transaction với gameplay effect/ability?** Nối equipment item với `PawnEquipmentComponent`, spawned actor và ability grant/revoke. **Đụng:** `Inventory`, `Combat`, `PlayerPresentation`. **Nguồn:** KYWorld `PawnEquipmentComponent.h`, `EquipmentBase.h`, `WeaponBase.h`; `09.… 16-004`; `17.… 20-004`.
9. **Inventory và rương dùng chung contract nào?** Tách container interface khỏi player-specific UI để wood box, PalBox và loot actor dùng cùng mutation path. **Đụng:** `Inventory`, `Interaction`. **Nguồn:** KYWorld `InventoryManager.uasset`, `W_ContainerInventory.uasset`, `W_PalBox.uasset`; `17.… 10-002`.
10. **Trọng lượng ảnh hưởng movement và pickup ra sao mà không tạo vòng phụ thuộc?** Đặt weight aggregate ở Inventory, expose read-only attribute cho Movement/Progression và trả rejection rõ ràng. **Đụng:** `Inventory`, `Movement`, `Progression`. **Nguồn:** KYWorld `BaseAttributeSet.h` là shell; `DT_PlayerStatData.uasset`/`02.Palworld 09-001` chỉ cho stat taxonomy. Aggregate/query contract là `[Inference]`.
11. **Làm sao chứng minh inventory không mất item khi restart hoặc khi hai client cùng sửa?** Gắn codec/persistence và authority test vào owner mà không cho UI hay Persistence biết item implementation. **Đụng:** `Inventory`, `PaldarkPersistence`, `Multiplayer`. **Nguồn:** `09.… 03-002`; tự phân rã từ contract persistence hiện có.

**Điều kiện tiên quyết:** Khoá 21 và 22; khoá 34 cần nền replication nhưng có thể học sau phần local UI.

## Khoá 24 — Chế tạo

**Người học làm được gì:** Người học biến recipe và nguyên liệu thành một workstation có queue, thời gian, thiếu nguyên liệu, output và UI quan sát được.

**Độ phức tạp:** **25 điểm** (S4/N3/A1/U4/C4/R4/I5) — **9 bài giảng**.

1. **Vì sao đứng trước bàn chế tạo mà chưa có gì xảy ra?** Phân rã cảm giác “bàn này phục vụ recipe nào” thành target workstation, recipe availability và prompt. **Đụng:** `Crafting`, `Interaction`. **Nguồn:** KYWorld `BP_WorkBenchPrimitive.uasset`, `BP_CraftMaster.uasset`, `W_CraftWindow.uasset`.
2. **Recipe cần kiểm tra những điều kiện nào trước khi trừ nguyên liệu?** Định nghĩa recipe row, required ingredients, station tag, unlock và quantity. **Đụng:** `Crafting/Data`, `Inventory`. **Nguồn:** KYWorld `DT_Crafting.uasset`; `17.… 06-001`.
3. **Tại sao craft phải là command server-side chứ không phải nút UI gọi trực tiếp?** Tạo request/validation/commit/reject và ngăn double-spend. **Đụng:** `Crafting`, `Inventory`, `Multiplayer`. **Nguồn:** `17.… 06-002`; `07.… 04-002`.
4. **Làm sao hàng đợi craft tạo ra thời gian chờ có ý nghĩa?** Chọn queue state, start/end time, pause/cancel và owner của output. **Đụng:** `Crafting`. **Nguồn:** tự phân rã; KYWorld `BP_CraftMaster.uasset`.
5. **Khi recipe thiếu nguyên liệu, UI phải nói gì và lấy dữ liệu từ đâu?** Tạo read model cho missing ingredients, progress và disabled action. **Đụng:** `Crafting/Content`, `Inventory/Content`. **Nguồn:** KYWorld `W_CraftWindow.uasset`; `17.… 14-001`.
6. **Làm sao workstation, rương và PalBox đều tương tác mà không biết recipe implementation?** Dùng generic interaction/container contracts và feature message. **Đụng:** `Crafting`, `Interaction`, `Inventory`. **Nguồn:** KYWorld `BPI_BuildingInterface.uasset`, `W_ContainerInventory.uasset`.
7. **Output craft đi vào inventory hay rơi xuống đất khi đầy?** Định nghĩa overflow policy, pickup actor và transaction boundary. **Đụng:** `Crafting`, `Inventory`, `Interaction`. **Nguồn:** `09.… 11-004`, `11-005`.
8. **Data row nào biến một bàn thành nhiều loại máy?** Tách recipe content khỏi C++/Blueprint logic và dùng tags/capabilities cho station. **Đụng:** `Crafting/Data`, `Work/Data`. **Nguồn:** KYWorld `DT_Crafting.uasset`; `17.… 06-001`.
9. **Làm sao save/load queue mà không craft lại vật phẩm?** Chọn persistent queue state, monotonic timestamps và idempotent completion. **Đụng:** `Crafting`, `PaldarkPersistence`. **Nguồn:** `11.… 31-005`, `31-006`, `31-007`; tự phân rã từ owner-codec contract.

**Điều kiện tiên quyết:** Khoá 22 và 23; khoá 30 nếu recipe cần tech unlock.

## Khoá 25 — Chiến đấu

**Người học làm được gì:** Người học chuyển combat từ input tới target, ability/effect, hit feedback và damage rule thành một vòng lặp chiến đấu authoritative có thể mở rộng theo nguyên tố và vũ khí.

**Độ phức tạp:** **33 điểm** (S5/N5/A4/U4/C5/R5/I5) — **12 bài giảng**.

1. **Vì sao đánh trúng một con Pal phải làm nó phản ứng ngay, chứ không chỉ giảm HP?** Phân rã hit feel thành target, hit window, damage event, reaction và feedback. **Đụng:** `Combat`, `Health`, `Creature`. **Nguồn:** KYWorld `GA_PalAttackBase.uasset`, `GA_Pal_HitReact.uasset`; `02.Palworld 10-004`.
2. **Ai sở hữu HP và ai chỉ được yêu cầu gây damage?** Chốt Health owner, combat intent và rejection cho client/feature khác. **Đụng:** `Combat`, `Health`. **Nguồn:** `05.… 04-002` và `11.… 03-004` cho AttributeSet/ASC authority pattern; KYWorld `BaseAttributeSet.h` chỉ là shell.
3. **Vì sao GAS cần ASC, AttributeSet, Ability và Effect cùng lúc?** Dựng tối thiểu primitives và chỉ ra boundary nào mỗi loại chịu trách nhiệm. **Đụng:** `Combat`, `Health`. **Nguồn:** `05.… 02-003` (ASC), `04-002` (AttributeSet); KYWorld có `BaseAbilitySystemComponent.h/.cpp`, còn `BaseAttributeSet.h` chỉ là shell.
4. **Khi nút tấn công được bấm, ability bắt đầu ở đâu và kết thúc lúc nào?** Nối input tag, activation policy, cancel và cooldown; không nhét combat rule vào input component. **Đụng:** `Combat`, `Movement`. **Nguồn:** `05.… 03-002`; `13.… 05-006`.
5. **Hitbox nên tồn tại cả montage hay chỉ trong notify window?** Chọn trace/overlap timing, attack montage và duplicate-hit guard. **Đụng:** `Combat/Content`, `PlayerPresentation`. **Nguồn:** `05.… 06-010`, `06-011`; `15.… 07-001`.
6. **Damage từ nhiều nguồn được tính theo thứ tự nào?** Xác định base damage, armor, resistance, critical và elemental modifier bằng execution/effect chain. **Đụng:** `Combat`, `Health`, `Progression`. **Nguồn:** `05.… 06-014`; `17.… 07-004`; KYWorld `BaseFunctionLibrary.h/.cpp`.
7. **Làm sao chọn target mà không để từng ability tự viết một luật khác?** Tạo generic target query/selection contract cho melee, projectile và AI. **Đụng:** `Combat`, `Creature`. **Nguồn:** `05.… 06-002`; `13.… 05-010`; KYWorld `BaseGameplayTag.h/.cpp`.
8. **Vì sao client thấy đòn đánh trước server nhưng không được tự quyết damage?** Chọn authority, prediction và reconciliation cho GAS combat. **Đụng:** `Combat`, `Multiplayer`. **Nguồn:** `13.… 03-004`; `13.… 13-001`.
9. **Projectile và melee dùng chung damage contract nào?** Tách delivery mechanism khỏi damage payload và thêm projectile lifetime/impact owner. **Đụng:** `Combat`, `Creature`. **Nguồn:** `13.… 18-007`; `10.… 05-006`.
10. **Một con Pal chết cần state transition và presentation nào?** Chốt death, hit react, loot/reward hook và respawn boundary mà không để UI sửa Health. **Đụng:** `Health`, `Creature`, `Combat`. **Nguồn:** `15.… 07-014`; KYWorld `GA_Pal_Death.uasset`.
11. **Làm sao data table biến một Pal thành nhiều bộ kỹ năng/element?** Đặt ability startup data, tags, skill rows và content assets vào data layer. **Đụng:** `Combat/Data`, `Creature/Data`. **Nguồn:** KYWorld `DataAsset_StartupPal.h`, `DT_PalData.uasset`; `02.Palworld 11-004`.
12. **Bài combat nào phải được tự kiểm trước khi gọi là xong?** Viết checklist compile-time/runtime-user cho hit, miss, death, rejection và second client; không dùng log giả làm proof. **Đụng:** `Combat/Tests`, `Multiplayer`. **Nguồn:** tự phân rã theo quy tắc bằng chứng của dự án.

**Điều kiện tiên quyết:** Khoá 21; phần GAS nền của khoá này có thể học trước 23, nhưng combat hoàn chỉnh cần 26/27 để có Pal target.

## Khoá 26 — Bắt giữ

**Người học làm được gì:** Người học xây được khoảnh khắc ném sphere vào Pal, tính xác suất từ state thật, phát animation/feedback và commit capture một lần trên server.

**Độ phức tạp:** **30 điểm** (S5/N4/A3/U4/C4/R5/I5) — **11 bài giảng**.

1. **Vì sao ném cầu vào một con Pal đầy máu lại phải trượt?** Từ cảm giác capture, xác định các biến bắt buộc: HP ratio, target species, sphere tier, status và distance. **Đụng:** `Capture`, `Creature`, `Combat`. **Nguồn:** KYWorld `BP_PalSphere.uasset`, `GA_Pal_Encounter.uasset`; `02.Palworld 05-002`.
2. **Capture request xác định Pal nào và sphere nào bằng identity nào?** Tách stable entity id khỏi actor pointer và inventory item instance. **Đụng:** `Capture`, `Creature`, `Inventory`. **Nguồn:** `02.Palworld 05-001/05-003` chỉ cho Pal hierarchy/Pal inventory; stable identity contract đến từ V3/Paldark và là `[Inference]` cho capture.
3. **Công thức tỉ lệ bắt gồm những modifier nào và thứ tự ra sao?** Chọn base chance, HP multiplier, status multiplier, sphere multiplier và clamp/rounding. **Đụng:** `Capture/Data`, `Creature`. **Nguồn:** KYWorld `FPalProfileStruct.uasset`, `DT_PalData.uasset`; tự phân rã công thức.
4. **Vì sao ném sphere phải là một projectile chứ không phải teleport item?** Tạo trajectory, collision, target lock và miss outcome. **Đụng:** `Capture/Content`, `Combat`. **Nguồn:** KYWorld `BP_PalSphere.uasset`; `13.… 18-007`.
5. **Khi sphere trúng, chuỗi rung và lắc cần state nào?** Mô hình hoá capture attempt, shake count, escape window và presentation event. **Đụng:** `Capture`, `PlayerPresentation`. **Nguồn:** KYWorld `GA_Pal_Encounter.uasset`; tự phân rã vì KYWorld không có source cụ thể cho luật rung.
6. **Ai quyết định bắt thành công và làm sao chống double claim?** Đặt server authority, random seed/source và idempotent capture transaction. **Đụng:** `Capture`, `Multiplayer`. **Nguồn:** `07.… 03-002`, `04-002`; tự phân rã.
7. **Capture fail trả lại sphere hay tiêu sphere?** Chốt item consumption policy, inventory mutation và rejection path. **Đụng:** `Capture`, `Inventory`. **Nguồn:** `09.… 11-003/12-003` cho server drop/consume primitive; KYWorld `InventoryComponentBase.h` là shell và `BP_PalSphere.uasset` không chứng minh settlement policy. Policy còn `UNKNOWN`.
8. **Capture success đưa Pal vào party, box hay world state nào?** Tách captured entity record, party/box capacity và spawn/despawn event. **Đụng:** `Capture`, `Companion`, `Inventory`. **Nguồn:** KYWorld `PalInventorySystem.uasset`, `W_PalBox.uasset`; `02.Palworld 05-003`.
9. **UI tỉ lệ bắt lấy dữ liệu nào mà không tiết lộ một con số giả?** Tạo read model cho chance, modifiers, current HP và result, trace được về state thật. **Đụng:** `Capture/Content`, `PlayerPresentation`. **Nguồn:** KYWorld `W_DetailWidget.uasset`; tự phân rã theo evidence rule.
10. **Pal đang bị capture có được tiếp tục tấn công không?** Định nghĩa state lock, cancel, damage interaction và AI interruption. **Đụng:** `Capture`, `Creature`, `Combat`. **Nguồn:** `11.… 15-008`; KYWorld `GA_Pal_Encounter.uasset`.
11. **Làm sao save capture success mà không tạo Pal thứ hai sau load?** Gắn capture transaction với owner codec/entity registry và replay-safe claim id. **Đụng:** `Capture`, `Companion`, `PaldarkPersistence`. **Nguồn:** `11.… 31-006/31-007`; tự phân rã từ persistence contract.

**Điều kiện tiên quyết:** Khoá 23 và phần target/health của khoá 25; khoá 27 học sau khi capture record tồn tại.

## Khoá 27 — Bạn đồng hành

**Người học làm được gì:** Người học khiến Pal đã bắt được xuất hiện, đi theo, nhận lệnh và chiến đấu hỗ trợ bằng AI state có thể quan sát và có owner rõ ràng.

**Độ phức tạp:** **31 điểm** (S4/N4/A5/U4/C5/R4/I5) — **11 bài giảng dự kiến**. Sáu bài nền `00–05` đã được biên soạn trong [Khóa 27 — Bạn đồng hành](../KhoaHoc/M27-Ban-Dong-Hanh/00-tai-sao-he-thong-nay-ton-tai.md).

1. **Vì sao bắt được Pal nhưng người chơi vẫn chưa có bạn đồng hành?** Phân rã captured record thành spawned companion, party slot, follow target và possession/ownership. **Đụng:** `Companion`, `Capture`. **Nguồn:** KYWorld `PalCharacterBase.h/.cpp`, `PalInventorySystem.uasset`.
2. **Ai spawn Pal và khi nào spawn lại sau level transition?** Chọn Companion owner, spawn descriptor, stable entity id và despawn policy. **Đụng:** `Companion`, `World`, `Multiplayer`. **Nguồn:** KYWorld `BaseGameMode.h/.cpp`, `BP_PalCharacterBase.uasset`.
3. **Máy trạng thái nào giúp Pal đi theo mà không teleport vô lý?** Thiết kế state `Idle/Follow/Combat/Work/Disabled`, follow distance, hysteresis, acceptance radius và navigation request trong C++; dùng Blackboard/Behavior Tree của KYWorld làm đối chứng, không mặc định là implementation đích. **Đụng:** `Companion`, `Creature`. **Nguồn:** [Khóa M27, Bài 02–03](../KhoaHoc/M27-Ban-Dong-Hanh/02-doi-chieu-kyworld-va-khoa-hoc.md); KYWorld `BaseAIController.h/.cpp`; `11.… 15-002`.
4. **Priority và ranh giới nào cho phép đổi giữa idle, follow, combat và work?** Dựng transition contract, owner của state và fail-safe thay vì một tick function khổng lồ. **Đụng:** `Companion`, `Creature`, `Work`. **Nguồn:** [Khóa M27, Bài 03–05](../KhoaHoc/M27-Ban-Dong-Hanh/03-may-trang-thai-trong-code.md); KYWorld Behavior Tree dùng làm đáp án đối chiếu.
5. **Perception xác định enemy và quên target lúc nào?** Nối sight/damage stimuli, target invalidation và death notification. **Đụng:** `Companion`, `Combat`, `Creature`. **Nguồn:** `11.… 15-003`, `15-007`; `13.… 07-001`–`07-005`.
6. **Lệnh “đánh mục tiêu này” đi qua AI và network ra sao?** Tạo generic companion intent/message, server validation và client observation. **Đụng:** `Companion`, `Multiplayer`. **Nguồn:** `07.… 04-002`; tự phân rã theo Core message contract.
7. **Pal dùng skill nào và cooldown/state effect thuộc ai?** Nối startup ability data, GAS tags và AI task mà AI không sở hữu damage. **Đụng:** `Companion`, `Combat`. **Nguồn:** KYWorld `GA_Pal_FarSkill.uasset`, `BTTask_AbilityActivateByTag.uasset`; `02.Palworld 10-004`.
8. **Animation làm sao phản ánh speed, attack và hit react thật?** Tạo AnimInstance read model, montage notify và locomotion state. **Đụng:** `Companion`, `PlayerPresentation`. **Nguồn:** KYWorld `ABP_PalBase.uasset`, `BaseAnimInstance.h/.cpp`.
9. **Pal bị kẹt, chết hoặc mất chủ thì recovery thế nào?** Định nghĩa stuck timeout, teleport fallback, death transition và return-to-party. **Đụng:** `Companion`, `World`. **Nguồn:** tự phân rã; tham chiếu `13.… 07-012`.
10. **Làm sao Pal chuyển từ companion sang worker mà không nhân đôi actor/state?** Chọn mode transition, assignment record và single owner cho active role. **Đụng:** `Companion`, `Work`. **Nguồn:** KYWorld `PalInventorySystem.uasset`; `02.Palworld 11-005`.
11. **Companion nào được persist và spawn lại bằng chứng gì?** Lưu stable id/party order/role, không lưu raw actor pointer. **Đụng:** `Companion`, `PaldarkPersistence`. **Nguồn:** `11.… 31-015`; tự phân rã từ owner codec.

**Điều kiện tiên quyết:** Khoá 26 và phần AI cơ bản của khoá 25; khoá 29 cần hoàn tất mode/assignment contract.

## Khoá 28 — Xây dựng

**Người học làm được gì:** Người học đặt, snap, xác nhận, phá dỡ và hiển thị các building part theo lưới, với chi phí tài nguyên và authority tách khỏi UI preview.

**Độ phức tạp:** **30 điểm** (S5/N4/A2/U5/C5/R4/I5) — **10 bài giảng**.

1. **Vì sao đặt một bức tường phải “dính” đúng chỗ thay vì rơi tự do?** Phân rã build feel thành preview transform, snap rule, collision và confirm. **Đụng:** `Build`, `PlayerPresentation`. **Nguồn:** KYWorld `BP_BuildPartMaster.uasset`, `BPI_BuildingInterface.uasset`; `02.Palworld 11-005`.
2. **Ai sở hữu preview và ai sở hữu building thật?** Tách client-only ghost actor khỏi server-owned construction record. **Đụng:** `Build`, `Multiplayer`. **Nguồn:** `07.… 03-002`; tự phân rã.
3. **Snap grid tính transform và rotation thế nào?** Chọn grid cell, socket/anchor, rotation increment và tolerance. **Đụng:** `Build/Source`, `Build/Data`. **Nguồn:** KYWorld `FBuilding.uasset`/`FBuildRecipe.uasset` là assets; `17.… 02-001` chỉ là bài `[Doc]` về building/GAS/snap, còn C++ local chỉ có `BuildingActorClass` fragment. Placement algorithm chưa có source proof.
4. **Khi vị trí bị chặn, preview phải nói “không thể đặt” bằng gì?** Tạo validation result, collision query và màu/material feedback. **Đụng:** `Build/Content`. **Nguồn:** KYWorld `MAT_Progress.uasset`, `MAT_RedColor.uasset`, `MAT_GreenColor.uasset`.
5. **Xây một part trừ nguyên liệu và mở khóa recipe theo transaction nào?** Nối Build với Inventory/Progression mà không để Build tự sửa item state. **Đụng:** `Build`, `Inventory`, `Progression`. **Nguồn:** `17.… 06-001` chỉ cho craft/item fragment primitive; KYWorld `DT_Building.uasset` chỉ cho taxonomy/cost; transaction Build là `[Inference]` cần V2/V3 invariant.
6. **Làm sao các part như wall, floor, roof dùng chung logic?** Tách master actor, part data và Blueprint child content. **Đụng:** `Build/Source`, `Build/Content`. **Nguồn:** KYWorld `BP_BuildPartMaster.uasset`, `BP_Wall.uasset`, `BP_Floor.uasset`, `BP_Roof.uasset`.
7. **Cửa và structure có collision/interaction riêng ra sao?** Gắn interface và component behavior mà không fork placement algorithm. **Đụng:** `Build`, `Interaction`. **Nguồn:** KYWorld `BP_Door.uasset`, `BP_GCDoor.uasset`, `BPI_BuildingInterface.uasset`.
8. **Phá dỡ trả lại tài nguyên và cập nhật network thế nào?** Định nghĩa dismantle authority, refund policy, replicated removal và UI refresh. **Đụng:** `Build`, `Inventory`, `Multiplayer`. **Nguồn:** `07.… 03-004`; tự phân rã.
9. **Palette/build menu lấy content từ đâu mà không hard-code hàng trăm nút?** Tạo data-driven category, recipe filter và UMG radial/menu. **Đụng:** `Build/Content`, `Build/Data`. **Nguồn:** KYWorld `W_BuildMenu.uasset`, `DT_Building.uasset`, `E_BuildType.uasset`.
10. **Building tồn tại sau restart bằng state nào?** Persist stable build id, transform, definition và owner; không persist transient preview. **Đụng:** `Build`, `World`, `PaldarkPersistence`. **Nguồn:** `11.… 31-015`; tự phân rã.

**Điều kiện tiên quyết:** Khoá 22, 23 và 30 cho unlock; có thể học song song với 29 sau khi placement contract ổn định.

## Khoá 29 — Làm việc và tự động hoá

**Người học làm được gì:** Người học khiến Pal được giao tới đúng trạm, chọn công việc theo suitability, xử lý hunger/interrupt và tạo output mà người chơi quan sát được.

**Độ phức tạp:** **33 điểm** (S5/N4/A5/U4/C5/R5/I5) — **12 bài giảng**.

1. **Bắt Pal xong thì người chơi giao nó làm gì để vòng lặp có ý nghĩa?** Xác định cảm giác “giao việc rồi thấy nó tự làm” và state assignment/station/output. **Đụng:** `Work`, `Companion`. **Nguồn:** KYWorld `11-005 BuildObject and Work Suitability Tables`; `10-006`.
2. **Trạm làm việc và Pal nói chuyện bằng contract nào?** Tách station capability, suitability tags và worker assignment khỏi actor class cụ thể. **Đụng:** `Work`, `Build`. **Nguồn:** `17.… 06-001/06-002` chỉ cho craft item/how-craft, không chứng minh station↔worker; KYWorld chỉ cho work/build taxonomy. Contract scheduler/reservation là `[Inference]`.
3. **Pal chọn task nào khi có nhiều việc cùng lúc?** Đặt priority, queue, reservation và starvation policy. **Đụng:** `Work/Source`, `Work/Data`. **Nguồn:** tự phân rã; `02.Palworld 11-005`.
4. **AI đi từ vị trí hiện tại tới station bằng state machine nào?** Dựng Blackboard/Behavior Tree task cho acquire, navigate, interact và leave. **Đụng:** `Work`, `Companion`. **Nguồn:** KYWorld `BaseAIController.h/.cpp`, `BTTask_PalBase.uasset`; `11.… 15-002/15-008`.
5. **Suitability là một tag, điểm số hay luật ưu tiên?** Chọn data model cho watering, kindling, gathering, handiwork và level. **Đụng:** `Work/Data`, `Progression`. **Nguồn:** KYWorld `11-005`; tự phân rã luật.
6. **Trạm biết worker đang làm gì mà không điều khiển AI trực tiếp bằng cách nào?** Dùng assignment/intent events, reservation token và station read model. **Đụng:** `Work`, `Build`. **Nguồn:** `14.… 02-023` gameplay messages; tự phân rã.
7. **Hunger, sanity và sleep làm công việc bị gián đoạn thế nào?** Định nghĩa need state, interrupt priority và safe return. **Đụng:** `Work`, `Companion`, `Creature`. **Nguồn:** KYWorld Pal behavior assets; tự phân rã vì catalog không có implementation cụ thể.
8. **Output xuất hiện ở đâu và ai sở hữu nó?** Nối station production với Inventory/container/loot, tránh worker tự spawn item không authority. **Đụng:** `Work`, `Inventory`, `Crafting`. **Nguồn:** `09.… 11-004/11-005`; `17.… 06-002`.
9. **Khi hai Pal tranh một station, hệ thống giải quyết ra sao?** Chọn reservation, retry/backoff, cancel và deterministic tie-break. **Đụng:** `Work`, `Multiplayer`. **Nguồn:** tự phân rã từ N4/S5.
10. **Pal bị kẹt trên đường hoặc station bị phá thì recovery nào hợp lý?** Dùng perception/timeout/replan, không teleport vô điều kiện. **Đụng:** `Work`, `Companion`, `Build`. **Nguồn:** `11.… 15-003/15-014`; tự phân rã.
11. **Người chơi nhìn thấy automation tiến triển bằng UI nào?** Tạo station panel, worker portrait, progress bar, output count và failure reason. **Đụng:** `Work/Content`, `PlayerPresentation`. **Nguồn:** KYWorld `W_CraftWindow.uasset`; `17.… 10-001`.
12. **Work state lưu và phục hồi thế nào khi không có actor active?** Persist assignment, progress, reservation-safe timestamp và output claim id; reconcile actor sau load. **Đụng:** `Work`, `PaldarkPersistence`, `World`. **Nguồn:** `11.… 31-015`; tự phân rã theo owner codec.

**Điều kiện tiên quyết:** Khoá 27, 28 và 23; khoá 31 cung cấp world scheduler nếu cần offline/world time.

## Khoá 30 — Tiến trình và công nghệ

**Người học làm được gì:** Người học xây được progression có level, điểm, tech unlock, điều kiện recipe/build và UI phản ánh đúng state owner.

**Độ phức tạp:** **26 điểm** (S4/N3/A1/U5/C5/R3/I5) — **8 bài giảng**.

1. **Vì sao người chơi cần thấy “mình mạnh lên” trước khi cần một cây tech?** Phân rã progression feel thành level, reward, unlock và feedback. **Đụng:** `Progression`, `PlayerPresentation`. **Nguồn:** KYWorld `DT_PlayerStatData.uasset`; `02.Palworld 09-001`.
2. **Level, experience và upgrade point ai sở hữu?** Chốt progression state owner và read-only contracts cho Combat/Inventory/Build. **Đụng:** `Progression`, `Combat`, `Inventory`. **Nguồn:** `13.… 11-015/11-016`; `11.… 31-006`.
3. **Một tech node cần điều kiện nào trước khi unlock?** Thiết kế prerequisite graph, cost, level gate, item gate và cycle rejection. **Đụng:** `Progression/Data`. **Nguồn:** KYWorld `11-007`; tự phân rã.
4. **Unlock phải làm thay đổi recipe/build/ability bằng event nào?** Tạo generic unlock message và feature-specific consumers, không cho Progression gọi class Crafting trực tiếp. **Đụng:** `Progression`, `Crafting`, `Build`, `Combat`. **Nguồn:** `14.… 02-023`; tự phân rã theo Core contracts.
5. **Cây tech hiển thị dependency và trạng thái bị khóa ra sao?** Tạo UMG graph/read model, tooltip missing requirements và pending purchase. **Đụng:** `Progression/Content`. **Nguồn:** `15.… 14-001`; KYWorld `W_PlayerMenu.uasset`.
6. **Tại sao purchase phải idempotent và server-authoritative?** Chặn double-spend, stale UI và replay bằng command/result. **Đụng:** `Progression`, `Multiplayer`. **Nguồn:** `07.… 04-002`; tự phân rã.
7. **Data rows nào đủ để 15 hệ thống dùng progression mà không hard-code?** Tạo progression/tech/curve tables, versioning và content validation. **Đụng:** `Progression/Data`. **Nguồn:** KYWorld `11-007`; `13.… 11-004`, `11-014`.
8. **Progression save/load không làm unlock lặp lại bằng cách nào?** Persist level/xp/unlocked IDs/claim IDs và phục hồi consumers qua generic message. **Đụng:** `Progression`, `PaldarkPersistence`. **Nguồn:** `11.… 31-007`, `31-012`; tự phân rã.

**Điều kiện tiên quyết:** Khoá 23; đọc 24 và 28 trước khi viết consumer unlock; không cần 25 để học phần graph.

## Khoá 31 — Thế giới và nhịp sống

**Người học làm được gì:** Người học tạo được world scheduler có ngày đêm, weather, biome/spawn data, respawn checkpoint và actor reconciliation sau load.

**Độ phức tạp:** **30 điểm** (S5/N4/A4/U3/C5/R4/I5) — **10 bài giảng**.

1. **Vì sao một thế giới sống phải thay đổi dù người chơi đứng yên?** Phân rã cảm giác ngày đêm, weather và population thành clock/weather/spawn state. **Đụng:** `World`, `PlayerPresentation`. **Nguồn:** `14.… 03-019` chỉ là Ultra Dynamic Sky/weather **presentation** reference; KYWorld `11-001/11-006` cho data/spawn taxonomy. Authoritative clock/simulation là `[Inference]`.
2. **Clock thuộc World hay từng map/actor?** Chọn single world time owner, tick policy và observable contract cho mọi feature. **Đụng:** `World/Source`. **Nguồn:** tự phân rã; tham chiếu `11.… 31-015`.
3. **Weather chuyển trạng thái theo luật nào?** Thiết kế weather profile, duration, transition và gameplay tags mà presentation chỉ quan sát. **Đụng:** `World/Data`, `World/Content`. **Nguồn:** `14.… 03-019` chỉ hỗ trợ presentation setup; duration/transition/authority vẫn `[Inference]`.
4. **Spawn table biến thành spawn decision như thế nào?** Nối biome, time, weather, rarity, population cap và deterministic seed. **Đụng:** `World/Data`, `Creature`. **Nguồn:** KYWorld `11-006`; `11.… 32-011`.
5. **Làm sao spawn actor mà không nhân đôi entity sau restart?** Tách persistent entity identity, runtime actor registry và reconcile pass. **Đụng:** `World`, `Creature`, `PaldarkPersistence`. **Nguồn:** tự phân rã theo `FPaldarkEntityId`.
6. **Pal hoang dã chọn idle, patrol hay flee bằng AI nào?** Nối world spawn context với Behavior Tree/perception, không để World sở hữu AI state. **Đụng:** `World`, `Creature`. **Nguồn:** KYWorld `BaseAIController.h/.cpp`; `11.… 15-002/15-003`.
7. **Checkpoint respawn cần lưu gì và hiển thị ở đâu?** Chốt checkpoint identity, selection, bed/respawn interaction và feedback. **Đụng:** `World`, `Interaction`, `PlayerPresentation`. **Nguồn:** `17.… 16-002`; `11.… 31-003/31-004`.
8. **World event gửi tới feature khác bằng channel nào?** Tạo generic weather/time/spawn messages thay vì World gọi Combat/Work trực tiếp. **Đụng:** `World`, `Core`. **Nguồn:** `14.… 02-023`; tự phân rã.
9. **World tick, server authority và client observation khác nhau thế nào?** Đặt replication snapshot, interpolation và late-join initialization. **Đụng:** `World`, `Multiplayer`. **Nguồn:** `07.… 03-001/03-004`; `13.… 03-004`.
10. **World state save/load phục hồi actor, clock và checkpoint theo thứ tự nào?** Thiết kế codec owner, schema/version và reconcile sau deserialize. **Đụng:** `World`, `PaldarkPersistence`. **Nguồn:** `11.… 31-015`; tự phân rã.

**Điều kiện tiên quyết:** Khoá 27 cho Pal actors; khoá 33 cho persistence; khoá 34 cho replicated world observation.

## Khoá 32 — Hang động và trùm

**Người học làm được gì:** Người học tạo được dungeon run có cổng vào, room generation, encounter/boss state, reward claim một lần và UI tiến trình.

**Độ phức tạp:** **31 điểm** (S5/N4/A4/U4/C5/R4/I5) — **10 bài giảng**.

1. **Vì sao bước qua cổng hang động phải biến thành một run có mục tiêu?** Phân rã run context, seed, room index, encounter và completion. **Đụng:** `Dungeon`, `PlayerPresentation`. **Nguồn:** KYWorld `11-006`; `11.… 32-011`.
2. **Dungeon tạo room từ data nào thay vì hard-code map?** Chọn room definition, weighted pool, entrance/exit và seed. **Đụng:** `Dungeon/Data`, `Dungeon/Content`. **Nguồn:** KYWorld `11-006`; tự phân rã.
3. **Khi nào room được coi là cleared?** Định nghĩa encounter set, alive count, objective completion và transition trigger. **Đụng:** `Dungeon`, `Creature`, `Combat`. **Nguồn:** `15.… 07-014`; tự phân rã.
4. **Boss encounter khác một Pal thường ở state nào?** Tạo boss phase, arena lock, telegraph, death và reward hook. **Đụng:** `Dungeon`, `Combat`, `Creature`. **Nguồn:** `15.… 11-001` cho Boss AOE; `07-010/07-014` chỉ cho melee interruption/enemy death; phase/arena/reward state vẫn `[Inference]`.
5. **AI boss cần perception và behavior tree gì để trông có chủ đích?** Chọn phase task, target selection, cooldown và interrupt. **Đụng:** `Dungeon`, `Combat`, `Creature`. **Nguồn:** `11.… 15-007/15-008/15-014`.
6. **Reward được tạo khi boss chết hay khi người chơi claim?** Tách reward generation khỏi claim state để không nhận lần hai. **Đụng:** `Dungeon`, `Inventory`, `Progression`. **Nguồn:** `11.… 31-005/31-006`; tự phân rã theo first-claim contract.
7. **UI phải nói người chơi đang ở room nào và còn gì?** Tạo dungeon HUD, boss bar, objective/prompt và reward result. **Đụng:** `Dungeon/Content`, `PlayerPresentation`. **Nguồn:** KYWorld `W_HUD.uasset`; `15.… 07-013`.
8. **Run authority và client late join được đồng bộ ra sao?** Replicate run context/room/phase, không replicate arbitrary actor pointers. **Đụng:** `Dungeon`, `Multiplayer`. **Nguồn:** `07.… 03-001/03-004`; `13.… 03-004`.
9. **Thoát dungeon giữa chừng lưu context hay reset?** Chọn abandon/return/rejoin policy và idempotent transition. **Đụng:** `Dungeon`, `World`, `PaldarkPersistence`. **Nguồn:** `11.… 30-023`; tự phân rã.
10. **Làm sao schema load không mở lại reward door?** Codec lưu completion, claim state, claim ID và reject schema không hỗ trợ. **Đụng:** `Dungeon`, `PaldarkPersistence`. **Nguồn:** `11.… 31-007/31-015`; tự phân rã theo bài học ch 33.

**Điều kiện tiên quyết:** Khoá 25, 27 và 31; khoá 33 cần trước khi lưu run/reward.

## Khoá 33 — Lưu trữ

**Người học làm được gì:** Người học thiết kế persistence generic với owner codec, chunk schema, missing-chunk recovery, migration và restart-safe state mà Persistence không biết feature names.

**Độ phức tạp:** **28 điểm** (S5/N5/A1/U3/C4/R5/I5) — **7 bài giảng**.

1. **Sau khi restart, người chơi mong điều gì còn nguyên?** Phân rã cảm giác continuity thành state contract, owner và non-persistent runtime actor. **Đụng:** `PaldarkPersistence` và từng feature owner. **Nguồn:** `02.Palworld 01-002`; `11.… 31-006`.
2. **Vì sao Persistence không được biết “Dungeon” hay “Breeding”?** Dựng `IPaldarkSaveChunkCodec`/registry và dependency inversion trước khi viết serializer. **Đụng:** `PaldarkPersistence`, owner features. **Nguồn:** `11.… 31-005`; tự phân rã theo kiến trúc hiện tại.
3. **Một chunk cần header nào để biết có thể đọc?** Chọn chunk ID generic, schema version, generation, checksum và payload boundary. **Đụng:** `PaldarkPersistence`. **Nguồn:** tự phân rã; đối chiếu `11.… 31-014`.
4. **Thiếu chunk có phải lỗi fatal không?** Định nghĩa pending/default/reconcile semantics và không nuốt lỗi schema unsupported. **Đụng:** `PaldarkPersistence`. **Nguồn:** `11.… 31-007/31-015`; tự phân rã.
5. **Migration chạy một hay nhiều lần mà không đổi state?** Thiết kế version step, idempotency, source preservation và reject unsupported range. **Đụng:** `PaldarkPersistence`. **Nguồn:** tự phân rã; KYWorld chỉ có `BP_PalGameInstance.uasset`, không có migration codec.
6. **Owner codec serialize state nào và bỏ actor nào?** Viết codec cho World/Dungeon/Breeding/Condenser/Inventory theo owner, stable ID và before/after traceability. **Đụng:** `World`, `Dungeon`, `Breeding`, `Condenser`, `Inventory`, `PaldarkPersistence`. **Nguồn:** `02.Palworld 08-002`; các source owner hiện có.
7. **Làm sao chứng minh restart thật chứ không chỉ round-trip trong RAM?** Tạo save process/load process contract và checklist đọc state từ biến thật; không gọi placeholder là evidence. **Đụng:** `PaldarkPersistence`, `Tests`. **Nguồn:** `11.… 31-006/31-007`; tự phân rã theo evidence rule.

**Điều kiện tiên quyết:** L1/L2 contracts của các owner feature; khoá 34 chỉ cần khi persistence state có replicated observation.

## Khoá 34 — Nhiều người chơi

**Người học làm được gì:** Người học biến các intent gameplay thành server-authoritative multiplayer có replication, ownership, session flow, late join và rejection quan sát được.

**Độ phức tạp:** **29 điểm** (S5/N5/A2/U4/C3/R5/I5) — **9 bài giảng**.

1. **Vì sao hai người cùng nhìn một Pal phải thấy cùng state nhưng không cùng quyền sửa?** Phân rã client/server model, authority và replicated observation. **Đụng:** `Multiplayer`, mọi gameplay feature. **Nguồn:** `07.… 02-001`, `03-001`, `03-002`.
2. **Input intent đi từ client tới server bằng đường nào?** Chọn RPC/message boundary, ownership và validation; không gửi mutable state từ UI. **Đụng:** `Multiplayer`, `Movement`, `Interaction`. **Nguồn:** `07.… 04-001/04-002`, `03-008`.
3. **State nào replicate, state nào chỉ là local presentation?** Tạo replication policy cho inventory, companion, world, dungeon và UI read model. **Đụng:** `Multiplayer`, `Core`. **Nguồn:** `07.… 03-004/03-006`; `13.… 03-004`.
4. **Vì sao cùng một command có thể tới hai lần?** Đặt correlation ID, idempotency key, sequence và rejection reason cho mutation. **Đụng:** `Multiplayer`, `PaldarkPersistence`, feature owners. **Nguồn:** tự phân rã theo evidence/intent contract.
5. **Client thấy phản hồi tức thời mà server vẫn là authority bằng cách nào?** Chọn prediction/rollback cho movement và GAS ability, không dự đoán persistence truth. **Đụng:** `Movement`, `Combat`, `Multiplayer`. **Nguồn:** `13.… 03-004`; `13.… 13-001`.
6. **Late join nhận world, companion và dungeon state theo thứ tự nào?** Thiết kế initial snapshot, actor spawn/reconcile và UI readiness. **Đụng:** `Multiplayer`, `World`, `Companion`, `Dungeon`. **Nguồn:** `07.… 03-001/03-004`; tự phân rã.
7. **Session/lobby chỉ là kết nối hay còn là gameplay state?** Tách session orchestration khỏi feature state và chọn GameMode/GameState/PlayerState ownership. **Đụng:** `Multiplayer`, `World`. **Nguồn:** `10.… 02-005/02-008/02-011`; `08.… 09-001/09-002`.
8. **Khi client bị từ chối, người chơi thấy lý do nào?** Tạo generic rejection message/correlation display cho interaction, capture, build, craft và combat. **Đụng:** `Multiplayer`, `PlayerPresentation`. **Nguồn:** `07.… 04-002`; `14.… 02-023`.
9. **Làm sao test logic multiplayer mà không biến tài liệu thành QA runtime?** Viết compile-facing contracts, source traceability và checklist người dùng sẽ chạy trên Windows. **Đụng:** `Multiplayer/Tests`, feature tests. **Nguồn:** `07.… 02-002`; tự phân rã theo chế độ dự án.

**Điều kiện tiên quyết:** Khoá 21 và 23; học sau khi có ít nhất một owner state (25 hoặc 26) để có command thực.

## Khoá 35 — Nhân giống và kinh tế

**Người học làm được gì:** Người học xây được vòng lặp breeding–egg–hatch và economy–shop–trade với parent data, công thức di truyền, claim state và authority rõ ràng.

**Độ phức tạp:** **32 điểm** (S5/N4/A3/U5/C5/R5/I5) — **11 bài giảng**.

1. **Vì sao hai Pal cùng đưa vào farm lại phải tạo ra một kết quả cụ thể?** Phân rã breeding feel thành farm, parent pair, compatibility, timer, egg và claim. **Đụng:** `Breeding`, `Companion`. **Nguồn:** KYWorld `05-001/05-003` chỉ cho Pal hierarchy/inventory; `11-007` là progression/special-table taxonomy. Toàn bộ breeding flow ở đây là `[Inference]` cần behavior/data source riêng.
2. **Parent identity và snapshot phải lưu gì trước khi breeding bắt đầu?** Chọn stable entity IDs, immutable parent snapshot và lock/eligibility rules. **Đụng:** `Breeding`, `Companion`, `PaldarkPersistence`. **Nguồn:** `02.Palworld 05-001` chỉ cho Pal hierarchy; identity/lock/snapshot là V3/Paldark `[Inference]`.
3. **Công thức inheritance chọn Pal con bằng luật nào?** Định nghĩa species/result table, passive traits, IV/stat inheritance và weighted selection. **Đụng:** `Breeding/Data`, `Progression`. **Nguồn:** KYWorld `FPalProfileStruct.uasset`/`DT_PalData.uasset` chỉ cho Pal taxonomy; công thức/table inheritance là `UNKNOWN`, không có proof trong 13 Knowledge synthesis.
4. **Breeding timer chạy khi online và offline khác nhau ra sao?** Chọn world clock, elapsed time, pause và catch-up policy. **Đụng:** `Breeding`, `World`. **Nguồn:** `11.… 31-015`; tự phân rã.
5. **Khi nào egg tồn tại và ai được claim?** Tách egg creation, incubation, hatch completion và one-time claim transaction. **Đụng:** `Breeding`, `Inventory`, `Companion`. **Nguồn:** tự phân rã theo Dungeon reward claim; `11.… 31-006/31-007`.
6. **Egg/hatch cần UI feedback nào để người chơi hiểu tiến triển?** Tạo farm panel, timer, parent card, result preview và claim prompt. **Đụng:** `Breeding/Content`, `PlayerPresentation`. **Nguồn:** KYWorld `W_DetailWidget.uasset`/`W_PalBox.uasset` chỉ là generic Pal UI reference; breeding UI là `[Inference]`.
7. **Economy item price thuộc item, shop hay market?** Chọn owner cho base price, buy/sell modifier, currency và stock. **Đụng:** `Economy`, `Inventory`. **Nguồn:** KYWorld `11-003` chỉ cho item/economy taxonomy; `13.… 14-001/15-001` cho shop/inventory primitive. Currency/stock/price policy là `[Inference]`; khoá 09 mục 14 là Composite Pattern, không phải shop.
8. **Shop transaction chống mua hai lần và thiếu tiền thế nào?** Tạo server command, price snapshot, inventory/currency mutation và rejection. **Đụng:** `Economy`, `Inventory`, `Multiplayer`. **Nguồn:** `13.… 14-001` (shop), `15-001` (inventory), `07.… 04-002` (server RPC); khoá 09 không có shop proof.
9. **Kinh tế thay đổi theo progression/quality bằng công thức nào?** Nối rarity, level, passive quality, supply/demand hoặc merchant modifier mà không hard-code UI. **Đụng:** `Economy`, `Progression`, `Breeding`. **Nguồn:** KYWorld `11-003/11-007` chỉ cho item/progression/special-table taxonomy; pricing formula là `UNKNOWN`.
10. **Breeding và economy lưu state nào mà không tạo duplicate egg/currency?** Dùng codec owner, generation, claim ID và idempotent transaction. **Đụng:** `Breeding`, `Economy`, `PaldarkPersistence`. **Nguồn:** `02.Palworld 01-002` chỉ là generic GameInstance persistence; `11.… 31-006/31-007` cho save/claim primitive; domain schema/atomicity dùng V3 invariant và vẫn `[Inference]`.
11. **Làm sao đóng vòng lặp “bắt Pal → giao việc → sinh sản/bán” bằng message generic?** Nối Companion, Work, Breeding và Economy qua intents/events, không tạo global feature-aware router. **Đụng:** `Breeding`, `Companion`, `Work`, `Economy`, `Core`. **Nguồn:** `14.… 02-023`; tự phân rã từ vòng lặp 37.3.

**Điều kiện tiên quyết:** Khoá 23, 27, 29 và 30; khoá 31/33/34 cần trước khi làm offline, persistence và multiplayer claim.

## Bảng thứ tự phụ thuộc giữa 15 khoá

```text
21 → 22 → 23 → 24
                 ↘
                  28 → 29
25 → 26 → 27 ───────↗
21/23 → 30 → 32
27/31 → 32
31 + 33 → 35
23 + 25/26 → 34
33 là nền persistence cho 27, 29, 31, 32, 35
```

Đây là thứ tự của **câu hỏi và contract**, không phải thứ tự PR. Một implementation có thể mở nhiều feature cùng lúc, nhưng bài giảng không được dùng state, AI, UI hoặc message channel trước khi bài trước tạo ra nhu cầu của nó.
