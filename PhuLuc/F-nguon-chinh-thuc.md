# Phụ lục F — Nguồn Unreal/Lyra/UEFN chính thức và quyết định Paldark được phép suy ra

Khi một quyết định kiến trúc đứng cạnh liên kết tài liệu Epic, người đọc có thể vô thức gộp hai câu thành một: “Epic hỗ trợ cơ chế này, vậy Paldark buộc phải thiết kế như thế”. Thực ra giữa chúng luôn có một bước suy luận.

Phụ lục này làm bước suy luận ấy hiện ra. Cột giữa ghi **điều Epic thực sự công bố**; cột cuối ghi **quyết định Paldark được phép rút ra** trong bối cảnh của mình. Một URL chính thức cho biết engine hoặc framework được thiết kế để giải bài toán nào, nhưng không tự biến lựa chọn của Paldark thành fact.

| Nguồn chính thức | Điều nguồn hỗ trợ | Quyết định Paldark suy ra |
|---|---|---|
| [Lyra Sample Game](https://dev.epicgames.com/documentation/unreal-engine/lyra-sample-game-in-unreal-engine?lang=en-US) | Lyra đặt generic content ở core, gameplay trong Game Feature plugins; Experience chọn plugin cần nạp; ShooterCore là một feature lớn chứa nhiều mechanics/UI/abilities. | Không đồng nhất “một danh từ hệ thống” với “một plugin”. Dùng Experience để compose các pack có cohesion và lifecycle thật. `[Inference]` |
| [Game Features and Modular Gameplay](https://dev.epicgames.com/documentation/unreal-engine/game-features-and-modular-gameplay-in-unreal-engine?lang=en-US) | Game Feature có thể register/load/activate/deactivate; action có thể add component hoặc Data Registry source. | Chỉ dùng GameFeature boundary khi cần activation/content isolation. Feature luôn-on có thể ở module/domain plugin thường. `[Inference]` |
| [Gameplay Ability System overview](https://dev.epicgames.com/documentation/en-us/unreal-engine/understanding-the-unreal-engine-gameplay-ability-system) | ASC quản lý ability/effect/attribute/tag/cue, có replication và prediction lifecycle. | Combat/status/cost/cooldown nên hội tụ về GAS thay vì duy trì một hệ custom cạnh tranh lâu dài. Capture vẫn là transaction domain dùng Health/GAS snapshot, không phải một ability tự sở hữu roster. `[Inference]` |
| [Data Registries](https://dev.epicgames.com/documentation/en-us/unreal-engine/data-registries-in-unreal-engine) | Registry phục vụ dữ liệu `USTRUCT` đọc toàn cục, source linh hoạt, lookup sync/async; runtime state nên lưu ở SaveGame. | Tách definition read-only khỏi instance mutable; không dùng JSON fixture/registry làm save state. `[Inference]` |
| [Enhanced Input](https://dev.epicgames.com/documentation/unreal-engine/enhanced-input-in-unreal-engine?lang=en-US) | Mapping Context và Input Action hỗ trợ mapping theo ngữ cảnh lúc runtime. | Experience/feature cấp mapping context; một action semantic không hard-code phím ở nhiều feature. Cần resolver conflict trung tâm, không để Crafting và Combat cùng tự bind `C`. `[Inference]` |
| [Behavior Tree overview](https://dev.epicgames.com/documentation/en-us/unreal-engine/behavior-tree-in-unreal-engine---overview) | UE Behavior Tree dùng Blackboard và mô hình event-driven. | AI decision có thể dùng BT/StateTree, nhưng authoritative work reservation/state không được nhốt trong node AI; AI chỉ thực thi intent từ domain scheduler. `[Inference]` |
| [Saving and Loading Your Game](https://dev.epicgames.com/documentation/unreal-engine/saving-and-loading-your-game-in-unreal-engine) | Custom SaveGame class và async save là cơ chế engine cho state bền. | Dùng engine storage adapter, nhưng thêm stable ID, player/world scope, generation, migration và atomic coordination ở tầng Paldark. `[Inference]` |
| [Verse Code Style Guide](https://dev.epicgames.com/documentation/fortnite/verse-code-style-guide-in-unreal-editor-for-fortnite?lang=en-US) | Ưu tiên interface, scope hạn chế và event naming rõ. | API domain public phải nhỏ; implementation/private state không được lộ qua Core; notification đặt tên theo sự kiện đã xảy ra. `[Inference]` |
| [Verse Modules](https://dev.epicgames.com/documentation/en-us/fortnite/module) | Module là đơn vị dependency/phân phối. | Mỗi agent phải sở hữu write-set/module rõ và phụ thuộc có hướng; đây là nguyên tắc tổ chức, không phải yêu cầu port Verse sang C++. `[Inference]` |
| [Debugging and Troubleshooting in Verse](https://dev.epicgames.com/documentation/fortnite/debugging-and-troubleshooting-in-verse?lang=en-US) | Log channel/level và debug draw giúp khoanh vùng behavior. | Paldark dùng channel theo domain + correlation ID + phase; debug draw/presentation là lớp quan sát, không là source of truth. `[Inference]` |

## F.1 — Ba điều tài liệu chính thức không chứng minh

Tài liệu chính thức là nguồn mạnh cho cơ chế engine, nhưng sức mạnh đó có biên. Ba giới hạn sau ngăn ta dùng uy tín của nguồn để che một khoảng trống trong lập luận:

1. Lyra không chứng minh plugin-per-system hiện tại của PaldarkKit là đúng. ShooterCore cho thấy một feature có thể gom một vertical capability lớn.
2. GAS không tự giải transaction capture, inventory hay persistence. Nó giải ability/effect/attribute lifecycle.
3. Game Features không tự giải multi-agent collaboration. Write-set, API approval, schema version và evidence gate vẫn là quy tắc Paldark phải tự định nghĩa.

## F.2 — Thứ tự ưu tiên nguồn khi có xung đột

Nếu hai nguồn kể hai câu chuyện khác nhau, ta không chọn câu nghe quen hơn. Paldark ưu tiên nguồn theo khoảng cách của nó tới behavior đang cần chứng minh:

1. Behavior thực tế đã quan sát từ phiên bản Palworld mục tiêu.
2. Unreal/Lyra source hoặc tài liệu chính thức cho cơ chế engine.
3. Course source local đọc được.
4. KYWorld/Lab/V2/V3 như implementation/reference donor, kèm giới hạn của từng donor.
5. Course document/Knowledge.
6. Suy luận thiết kế Paldark.

Nếu ba cấp đầu chưa đủ, claim phải ở lại dưới nhãn `UNKNOWN` hoặc `INFERRED`. Một khoảng trống được ghi đúng tên vẫn hữu ích cho thiết kế; một câu chắc chắn hơn bằng chứng chỉ khiến lần kiểm toán sau khó tìm ra nơi sai bắt đầu.
