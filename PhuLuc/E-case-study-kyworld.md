# Phụ lục E — KYWorld đã đi nhanh bằng cách nào, và Paldark nên học điều gì

## E.1 — Kết luận ngắn

KYWorld là bằng chứng rằng một nhóm nhỏ có thể dựng nhanh **một prototype Palworld nhìn thấy và tương tác được**. Nó không phải bằng chứng rằng toàn bộ Palworld, persistence hay multiplayer production đã được tái tạo trong bốn tuần.

Lịch sử Git local cho thấy:

- repo có **539 commit** trên toàn lịch sử;
- **530 commit** nằm trong khoảng hoạt động chính 05/12/2024–06/01/2025;
- `Palworld_Base` được thêm ngày 05/12/2024, sau đó development dày đặc trong khoảng **32 ngày lịch**;
- `git shortlog` cho thấy nhiều tác giả/identity, với ít nhất bốn người đóng góp lớn và các contributor khác;
- work được chia song song theo Inventory, AI, Build, Weapon/Combat, UI/content và integration.

Vì vậy cách mô tả có bằng chứng là **“xấp xỉ 4–5 tuần, nhiều nhánh/người làm song song”**, không phải “một người hoàn thành toàn bộ Palworld trong bốn tuần”.

## E.2 — Họ đã nén thời gian ở đâu

### 1. Chọn prototype thay vì production contract

Source snapshot không có bằng chứng cho `DOREPLIFETIME`, RPC server/client/net multicast, `USaveGame` subclass hay Server target. Điều đó loại bỏ một lượng lớn chi phí về authority, reconciliation, migration, reconnect và crash recovery.

Đây không phải lời chê. Đó là một quyết định scope: họ tối ưu cho **vòng lặp nhìn thấy được trong Editor**, đúng với mục tiêu prototype.

### 2. Blueprint và asset làm phần gameplay riêng của Palworld

C++ đọc được chứng minh các shell quan trọng:

- Enhanced Input theo Gameplay Tag;
- ASC và ability grant/remove;
- character/Pal/AI controller shell;
- item/equipment/weapon shell;
- damage helper, team attitude, animation/widget shell.

Nhưng interaction, inventory drag/drop, capture, craft và building chủ yếu nằm trong `.uasset`. Binary asset giúp tạo game feel nhanh trong Editor, nhưng không cho agent hiện tại đọc graph hoặc tái sử dụng logic một cách có kiểm chứng.

### 3. Phân công theo lát dọc có thể nhìn thấy

Lịch sử có các chuỗi thay đổi song song cho Inventory, AI, BuildMan, TestGun, UI, animation và content. Đây là điểm gần nhất với mục tiêu VibeCoding của Paldark: mỗi người tạo một kết quả có thể tích hợp, thay vì tất cả cùng sửa một “Core” trung tâm.

### 4. Commit nhỏ và tích hợp liên tục

Nhiều commit ngắn đưa animation, UI, input, asset, fix collision và content vào ngay khi feature đang hình thành. Điều này làm prototype tiến nhanh vì feedback loop ngắn. Nó khác với PR #135–#157 của PaldarkKit, nơi nhiều feature được hoàn thành ở tầng state/QA trước khi có đường nhìn thấy.

### 5. Dùng asset/taxonomy làm bản đồ scope

Các tên như `BP_PalSphere`, `GA_Pal_Encounter`, `BP_CraftMaster`, `BP_BuildPartMaster`, `DT_Crafting` và nhóm build-part cho ta một catalog thực dụng về những mảnh cần tồn tại. Chúng là **bản đồ khảo sát**, không tự động là architecture đúng.

## E.3 — Điều được phép mang sang Paldark

| Loại | Dùng như thế nào |
|---|---|
| Enhanced Input/GAS/equipment C++ shell | Đọc implementation, so sánh với khoá 05/11/13/17, rồi port sau khi contract Paldark được duyệt. |
| Taxonomy asset | Dùng để kiểm tra catalog feature/content có bỏ sót gì. |
| Gameplay flow | Dùng làm target video/human acceptance: người chơi bấm gì, thấy gì, state đổi gì. |
| Nhịp phân công | Chia theo vertical outcome và write-set độc lập. |
| UI/animation/content | Dùng làm reference cá nhân trong phạm vi đã xác nhận; không coi là C++ proof. |

## E.4 — Điều không được copy 1:1

1. **Blueprint graph chưa được export.** Agent không thể chứng minh logic bên trong chỉ từ tên `.uasset`.
2. **Capture prototype không đủ authority.** Luồng “thêm Pal rồi destroy actor” không giải quyết xác suất, reservation, retry, sphere settlement hay exactly-once.
3. **Craft không chứng minh atomicity.** Remove ingredient tuần tự rồi add output có thể half-commit.
4. **Building C++ chỉ có helper hẹp.** Preview/snap/support/overlap/permission nằm ngoài source C++ đọc được.
5. **Không có persistence/network production proof.** Copy architecture đó sẽ lặp lại khoảng trống mà V3 đã cố sửa.

## E.5 — Mô hình hội tụ thay cho “chép hay tự làm”

Không cần chọn một trong hai cực.

```text
First principles
  → xác định cảm giác, state, owner, invariant
  → đối chiếu KYWorld để phát hiện scope/game-feel bị bỏ sót
  → đối chiếu course source để chọn Unreal pattern
  → đối chiếu Lab/V2/V3 để tìm implementation/invariant đã chứng minh
  → viết ADR và contract để người dùng duyệt
  → port hoặc viết implementation phía sau contract
  → compile
  → người dùng chạy test card và trả log/video
```

Trong mô hình này:

- **KYWorld là chuẩn hành vi và scope**;
- **PaldarkLab là donor breadth/playable implementation**;
- **PaldarkV2 là donor failure-path/transaction**;
- **PaldarkV3 là donor invariant và module boundary**;
- **PaldarkKit là shell tích hợp hiện tại**;
- **13 khoá học là bộ giải thích và pattern library**.

Ta không restart và cũng không nhập cả codebase cũ. Mỗi lần port là một quyết định có owner, invariant, nguồn và acceptance riêng.

## E.6 — Bài học quản trị cho nhiều AI agent

KYWorld đi nhanh vì công việc song song tạo ra vật thể nhìn thấy. Paldark chỉ giữ được ưu điểm đó nếu:

- task được chia theo outcome dọc, không chia “hãy tạo thêm một subsystem”;
- mỗi task có write-set riêng và không sửa shared Core nếu chưa có ADR;
- một feature không được gọi là hoàn thành chỉ vì `RunQA` in log xanh;
- integration contract được chốt trước khi hai agent viết producer/consumer;
- người dùng chịu trách nhiệm visual/runtime acceptance, agent chịu trách nhiệm thiết kế, C++ và compile;
- content/data entry lặp lại được giao cho người hoặc công cụ sau khi schema đã ổn định.

Đây là phần đáng sao chép nhất từ KYWorld: **nhịp tạo gameplay và phân công**, không phải từng class hay Blueprint.
