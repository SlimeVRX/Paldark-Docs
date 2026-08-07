# Phụ lục E — KYWorld đã đi nhanh bằng cách nào, và Paldark nên học điều gì

## E.1 — Kết luận ngắn

Nhìn vào hơn năm trăm commit trong khoảng một tháng, ta rất dễ kể một câu chuyện hấp dẫn: một nhóm nhỏ đã “làm lại Palworld” chỉ trong bốn tuần. Câu chuyện ấy có một phần đúng, nhưng phần bị bỏ đi mới là thứ quyết định ta học được gì.

KYWorld chứng minh rằng một nhóm nhỏ có thể dựng nhanh **một prototype Palworld nhìn thấy và tương tác được**. Nó không chứng minh toàn bộ Palworld, persistence hay multiplayer production đã được tái tạo trong bốn tuần. Muốn học đúng từ tốc độ của họ, trước hết phải gọi đúng thứ họ đã tối ưu.

Lịch sử Git local cho thấy:

- repo có **539 commit** trên toàn lịch sử;
- **530 commit** nằm trong khoảng hoạt động chính 05/12/2024–06/01/2025;
- `Palworld_Base` được thêm ngày 05/12/2024, sau đó development dày đặc trong khoảng **32 ngày lịch**;
- `git shortlog` cho thấy nhiều tác giả/identity, với ít nhất bốn người đóng góp lớn và các contributor khác;
- work được chia song song theo Inventory, AI, Build, Weapon/Combat, UI/content và integration.

Những con số trên dẫn tới cách mô tả có bằng chứng: **“xấp xỉ 4–5 tuần, nhiều nhánh/người làm song song”**. Chúng không nâng đỡ câu “một người hoàn thành toàn bộ Palworld trong bốn tuần”. Khác biệt này không làm thành quả nhỏ đi; nó chỉ đặt bài học về đúng kích thước.

## E.2 — Họ đã nén thời gian ở đâu

Không có bí quyết đơn lẻ tạo ra tốc độ ấy. Thời gian được nén bằng một chuỗi lựa chọn scope, công cụ và cách chia việc; mỗi lựa chọn đồng thời bỏ lại một loại chi phí cho giai đoạn sau.

### 1. Chọn prototype thay vì production contract

Source snapshot không có bằng chứng cho `DOREPLIFETIME`, RPC server/client/net multicast, `USaveGame` subclass hay Server target. Điều đó loại bỏ một lượng lớn chi phí về authority, reconciliation, migration, reconnect và crash recovery.

Đó không phải một thiếu sót cần phê phán, mà là quyết định scope. Nhóm tối ưu cho **vòng lặp nhìn thấy được trong Editor**, nên không trả trước chi phí của authority, reconciliation, migration, reconnect và crash recovery. Prototype đi nhanh chính vì nó chưa nhận mọi nghĩa vụ của production.

### 2. Blueprint và asset làm phần gameplay riêng của Palworld

C++ đọc được chứng minh các shell quan trọng:

- Enhanced Input theo Gameplay Tag;
- ASC và ability grant/remove;
- character/Pal/AI controller shell;
- item/equipment/weapon shell;
- damage helper, team attitude, animation/widget shell.

Phần còn lại của câu chuyện nằm trong `.uasset`: interaction, inventory drag/drop, capture, craft và building chủ yếu được xây ở đó. Binary asset giúp đi rất nhanh từ ý tưởng tới cảm giác trong Editor, nhưng agent hiện tại không thể đọc graph chỉ từ tên file. Vì vậy chúng là bằng chứng về scope và sự tồn tại của asset, chưa phải logic có thể tái sử dụng một cách kiểm chứng.

### 3. Phân công theo lát dọc có thể nhìn thấy

Lịch sử cho thấy các chuỗi thay đổi song song ở Inventory, AI, BuildMan, TestGun, UI, animation và content. Mỗi nhánh công việc kết thúc ở một thứ có thể nhìn thấy hoặc ghép vào game, thay vì tất cả cùng dồn vào một “Core” trung tâm. Đây là phần KYWorld tiến gần nhất tới mục tiêu VibeCoding của Paldark.

### 4. Commit nhỏ và tích hợp liên tục

Nhiều commit ngắn đưa animation, UI, input, asset, sửa collision và content vào ngay khi feature đang hình thành. Feedback xuất hiện sớm, nên sai lệch về cảm giác cũng lộ sớm. Nhịp này khác PR #135–#157 của PaldarkKit, nơi nhiều feature đã đi xa ở tầng state và QA trước khi có một đường chơi nhìn thấy được.

### 5. Dùng asset/taxonomy làm bản đồ scope

Tên asset cũng trở thành một loại bản đồ. `BP_PalSphere`, `GA_Pal_Encounter`, `BP_CraftMaster`, `BP_BuildPartMaster`, `DT_Crafting` và nhóm build-part cho biết prototype đã cần tới những mảnh nào. Bản đồ ấy rất hữu ích để tìm scope bị bỏ quên, nhưng nó không tự nói ai nên sở hữu state hoặc ranh giới module nào là đúng.

## E.3 — Điều được phép mang sang Paldark

Khi đã phân biệt được behavior, source và asset, ta có thể mang bài học sang Paldark mà không giả vờ mọi thứ đều là code đã hiểu. Mỗi loại donor dưới đây có một cách dùng khác nhau:

| Loại | Dùng như thế nào |
|---|---|
| Enhanced Input/GAS/equipment C++ shell | Đọc implementation, so sánh với khoá 05/11/13/17, rồi port sau khi contract Paldark được duyệt. |
| Taxonomy asset | Dùng để kiểm tra catalog feature/content có bỏ sót gì. |
| Gameplay flow | Dùng làm target video/human acceptance: người chơi bấm gì, thấy gì, state đổi gì. |
| Nhịp phân công | Chia theo vertical outcome và write-set độc lập. |
| UI/animation/content | Dùng làm reference cá nhân trong phạm vi đã xác nhận; không coi là C++ proof. |

## E.4 — Điều không được copy 1:1

Tốc độ của prototype đi kèm những giả định phù hợp với prototype. Nếu bê nguyên chúng vào Paldark, ta cũng bê theo phần chi phí KYWorld đã chủ động để lại cho tương lai.

1. **Blueprint graph chưa được export.** Agent không thể chứng minh logic bên trong chỉ từ tên `.uasset`.
2. **Capture prototype không đủ authority.** Luồng “thêm Pal rồi destroy actor” không giải quyết xác suất, reservation, retry, sphere settlement hay exactly-once.
3. **Craft không chứng minh atomicity.** Remove ingredient tuần tự rồi add output có thể half-commit.
4. **Building C++ chỉ có helper hẹp.** Preview/snap/support/overlap/permission nằm ngoài source C++ đọc được.
5. **Không có persistence/network production proof.** Copy architecture đó sẽ lặp lại khoảng trống mà V3 đã cố sửa.

## E.5 — Mô hình hội tụ thay cho “chép hay tự làm”

“Chép KYWorld” và “tự làm lại từ số không” là một lựa chọn giả. Paldark có thể giữ contract do mình suy ra từ first principles, đồng thời dùng donor để không lặp lại công việc đã có bằng chứng. Đường hội tụ đi theo thứ tự sau:

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

Theo mô hình này, dự án không restart và cũng không nuốt trọn một codebase cũ. Mỗi lần port trở thành một quyết định nhỏ có owner, invariant, provenance và acceptance riêng. Donor giúp ta đi nhanh; contract giữ cho những bước nhanh ấy vẫn hội tụ về cùng một game.

## E.6 — Bài học quản trị cho nhiều AI agent

KYWorld đi nhanh vì các luồng công việc song song đều tiến về một vật thể nhìn thấy. Paldark chỉ giữ được ưu điểm đó khi tốc độ của từng agent được buộc vào một outcome chung:

- task được chia theo outcome dọc, không chia “hãy tạo thêm một subsystem”;
- mỗi task có write-set riêng và không sửa shared Core nếu chưa có ADR;
- một feature không được gọi là hoàn thành chỉ vì `RunQA` in log xanh;
- integration contract được chốt trước khi hai agent viết producer/consumer;
- người dùng chịu trách nhiệm visual/runtime acceptance, agent chịu trách nhiệm thiết kế, C++ và compile;
- content/data entry lặp lại được giao cho người hoặc công cụ sau khi schema đã ổn định.

Phần đáng sao chép nhất từ KYWorld, vì vậy, không phải một class hay Blueprint riêng lẻ. Đó là **nhịp tạo gameplay và cách chia việc quanh kết quả nhìn thấy được**. Paldark thêm vào nhịp ấy thứ prototype chưa cần trả trước: owner rõ, contract typed và bằng chứng đủ để nhiều người tiếp tục xây mà không phải đoán lại.
