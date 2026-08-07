# Danh mục khái niệm sống

Danh mục này được rút từ mục 3–5 của các chương 21–35. Tên trong đây là contract dùng chung; một feature không được tự tạo biến thể tên nếu khái niệm đã có.

| Khái niệm | Nghĩa và ranh giới | Chủ/nguồn |
|---|---|---|
| `FPaldarkEntityId` | ID bền vững bọc một `FGuid`; dùng cho mọi entity, không phải actor pointer, definition ID hay creature-only ID. | Core, Ch.12.2, 14.4 |
| Definition | Dữ liệu tĩnh `id/schema/fragments`, không phải runtime state. | Data, Ch.14.1 |
| Fragment | Mảnh dữ liệu có namespace, gắn vào definition/entity theo feature. | Feature owner, Ch.14.2 |
| Entity | Cá thể có identity và state; có thể tồn tại khi actor chưa spawn. | EntityIdentity, Ch.14.4 |
| Actor | Biểu diễn runtime của entity; có thể resolve rỗng khi chưa nạp. | Runtime/bridge, Ch.14.4 |
| Stable identity | Tham chiếu qua `FPaldarkEntityId`, không qua pointer. | Core, Ch.14.4 |
| Entity/actor bridge | Contract `Paldark.Core.ActorResolve` nối entity với actor hiện có. | Runtime, Ch.27 |
| Save chunk | `FPaldarkSaveChunk` độc lập, có `ChunkId`, schema và payload. | Feature owner, Ch.14.5, 33 |
| Request | Ý định/mutation gửi tới owner; bên nhận quyết định. | Core, Ch.12.4, 25 |
| Result | Kết quả mutation, không phải quyền ghi mới. | Core/feature owner |
| `FDamageResult` | Target, lượng áp thực tế, HP trước/sau, chết/gục và correlation; dùng cho L12 và Capture. | Health owner, Ch.25–26 |
| Snapshot | Struct đọc trạng thái đã gom; đọc không cần authority/correlation. | Core, Ch.12.4 |
| `FPaldarkHealthSnapshot` | Current, Maximum, `bAlive`. | Health owner |
| `FPaldarkItemSnapshot` | Definition, quantity, owner và container. | Inventory owner |
| Interface | Contract gọi trực tiếp dạng `Paldark.<Owner>.<Name>`. | Core, Ch.15–16 |
| Event channel | Kênh bất đồng bộ dạng `Paldark.<Owner>.Event.<Name>`. | Message bus |
| Result channel | Kênh kết quả dạng `Paldark.<Owner>.Result.<Name>`. | Message bus |
| Owner/state owner | Một nơi duy nhất được phép ghi state theo L8. | Ch.11–12 |
| Authority | Tính chất của từng mutation/state, không phải module gameplay tổng. | Ch.12.4, 13.2, 34 |
| Relevancy | Tập client nhận snapshot/delta của entity/state. | Multiplayer/world bridge, Ch.31, 34 |
| `FPaldarkEntityCreateContext` | `DefinitionId`, `Owner`, `Reason`, `CorrelationId`; không chứa fragment override. | EntityIdentity, Ch.14.4, 26 |
| `Work.Capable` | Fragment năng lực worker, dùng lại nguyên tên từ Ch.14/16. | Work |
| `Work.Station` | Definition/fragment mô tả station làm việc. | Work |
| Worker assignment | Quan hệ worker–station và queue do Work ghi. | Work, Ch.29 |
| Offline simulation | Mô phỏng liên tục, tính bù hoặc hybrid; chính sách cần chốt. | Work, Ch.29 |
| Population budget | Ngân sách entity sống do World spawner làm chủ. | World, Ch.31 |
| Party/summon/recall | Quan hệ entity–player; không đồng nghĩa actor đang tồn tại. | Companion, Ch.27 |
| Preview session | Trạng thái tạm trước khi commit build, không phải structure entity. | Build, Ch.28 |
| Progression node set | Tập node đã mở, chỉ Progression được ghi. | Progression, Ch.30 |
| Atomic generation | Thế hệ save đầy đủ có commit marker; thiếu marker thì bỏ. | Persistence, Ch.33 |
| Migration | Chuyển schema chunk cũ sang mới, tách khỏi save/load result. | Persistence, Ch.33 |
| Breeding combination | Lookup bảng tổ hợp parent–child; bảng đầy đủ chưa biết. | Breeding, Ch.35 |
| Condenser transaction | Giao dịch hy sinh/cô đặc entity, cần Inventory và EntityIdentity qua interface. | Condenser, Ch.35 |
| Guild permission | Quyền sở hữu chung do Paldark thiết kế; schema Palworld chưa biết. | Guild/Multiplayer, Ch.34 |

## Quy tắc ID và tên

Không dùng `FCreatureInstanceId` và không dùng `FGuid` trần cho entity reference trong API công khai. `FGuid` chỉ còn xuất hiện bên trong wrapper hoặc ở trường correlation được contract yêu cầu. Interface, event và result channel không được dùng lẫn hình dạng tên.
