# Phụ lục B — Câu hỏi mở và giả định cần xác nhận

Mỗi mục ghi rõ điều cần làm rõ, input mong đợi và quyết định mà câu trả lời sẽ mở khóa.

| # | Cần làm rõ | Input mong đợi từ người dùng | Dùng để quyết định |
|---:|---|---|---|
| 1 | Công thức capture thật từ `CaptureRateCorrect` là gì? | Cho phép dùng công thức nguồn, hoặc xác nhận đây là bài toán Paldark mới. | Chốt resolver capture và test không bịa balance. |
| 2 | Movement/Interaction/Combat có cần save chunk không? | Xác nhận có lưu stamina, mount relation, interaction session, ammo/cooldown hay không. | Giữ giả định hiện tại hoặc thêm chunk riêng. |
| 3 | Giả định Chương 20.2 về thứ tự persistence có đúng không? | Xác nhận order/transaction boundary mong muốn khi load các chunk. | Chốt dependency graph và test crash recovery. |
| 4 | Offline Work mô phỏng liên tục, tính bù khi quay lại hay hybrid? | Chọn một policy và giới hạn sai số/tick. | Chốt scheduler, timestamp và reconciliation. |
| 5 | Work cần lưu tối thiểu queue, progress, reservation, output và modifier nào? | Danh sách state phải giữ qua phiên. | Chốt `Paldark.Work` codec. |
| 6 | UEFN khóa asset/module bằng cơ chế cụ thể nào? | Tên cơ chế hoặc tài liệu chính thức cần ưu tiên. | Chọn policy ownership và CI tương ứng. |
| 7 | Hipernova Lyra đã sửa những gì, ở commit/lịch sử nào? | Link/commit/history được phép dùng làm nguồn. | Phân biệt fork change với behavior Lyra gốc. |
| 8 | Rủi ro hiệu năng ở Chương 11.3 có ngưỡng đo nào? | Budget actor, replication, scan, memory và frame time. | Viết performance gate và population budget. |
| 9 | Schema guild/permission Palworld có tồn tại ở nguồn nào không? | Header, dump hoặc xác nhận thiết kế Paldark. | Chốt Guild owner và save schema. |
| 10 | Entity owner của structure/item/player có cần definition-specific policy không? | Bảng loại entity và owner relation. | Chốt `EntityCreateContext` usage. |
| 11 | Correlation ID có format/nguồn phát nào ngoài `FGuid` không? | Quy ước trace ID của runtime/telemetry. | Chốt log envelope và distributed tracing. |
| 12 | Damage có downed state riêng hay chỉ dead/alive? | State machine Health mong muốn. | Chốt `FDamageResult` semantics và Capture validator. |
| 13 | Effect/status owner là Core hay feature riêng? | Danh sách status/attribute cần lưu và replicate. | Chốt interface `EffectRequest` và ownership catalog. |
| 14 | Item definition có cần type taxonomy runtime không? | Danh sách item categories và query cần thiết. | Chốt `FPaldarkItemSnapshot` và registry schema. |
| 15 | Crafting input reservation commit/rollback thế nào khi output fail? | Transaction policy. | Chốt atomic boundary giữa Crafting và Inventory. |
| 16 | Build technology gate chỉ query Progression hay có cached capability? | Quy tắc cache/invalidation. | Chốt Build validator và event dependency. |
| 17 | Spawn budget tính theo actor, entity hay population unit? | Định nghĩa population unit và ngân sách. | Chốt World scheduler/relevancy. |
| 18 | Respawn checkpoint có lưu theo chunk World hay Dungeon? | Phân loại spawn context. | Chốt owner và migration. |
| 19 | Reward claim idempotency key là run ID, room ID hay reward ID? | Quy tắc retry/reconnect. | Chốt Dungeon reward transaction. |
| 20 | Save migration thất bại ở một chunk thì rollback toàn generation hay skip chunk? | Chính sách tương thích và recovery. | Chốt PersistenceResult/MigrationResult. |
| 21 | Relevancy có dựa distance, partition, interest hay guild? | Policy map cho từng state. | Chốt Multiplayer net bridge. |
| 22 | Guild shared asset có owner trực tiếp hay permission overlay? | Mô hình ownership và role. | Chốt L8 cho asset chung. |
| 23 | Bảng breeding combination đầy đủ ở đâu? | Dataset/nguồn được phép dùng. | Chốt schema và validation. |
| 24 | Tỷ lệ mutation/trait inheritance có nguồn không? | Số liệu hoặc quyết định Paldark. | Chốt Breeding resolver và test. |
| 25 | Condenser rank/sacrifice có tạo entity mới hay mutate entity cũ? | State transition mong muốn. | Chốt EntityIdentity và transaction. |
| 26 | Economy stock/price refresh theo thời gian nào? | Clock, seed, persistence policy. | Chốt merchant owner và save. |
| 27 | Các command QA nào là contract bắt buộc trong vertical slice? | Danh sách command ưu tiên. | Chốt test harness và CI runtime. |
| 28 | Blueprint presentation có được giữ snapshot cache không? | Quy tắc stale-read cho UI. | Chốt replication/UI boundary. |
| 29 | `FDamageResult` có cần source/ability/mitigation fields ngoài yêu cầu tối thiểu không? | Quyết định payload mở rộng. | Giữ Core API nhỏ hoặc thêm result fragment. |
| 30 | Save order có dependency cycle nào giữa entity, Inventory, Companion và World không? | Sơ đồ relation thực tế. | Chốt topological order và deferred resolution. |
| 31 | Input profile của feature có nên trở thành definition/fragment trong Data Registry không? | Quyết định schema, owner và lifecycle nạp cho `Movement.Input.json` cùng các profile tương lai. | Giữ đường trung gian JSON + runtime-created `UInputAction`/`UInputMappingContext`, hoặc nâng thành registry chung theo Chương 14 mà không đưa hard-code trở lại. |
| 32 | Composition content nên nằm ở plugin mounted path (`/PlayerPresentation/...`) thay vì `PaldarkKit/Content/` như slice hiện tại? | Đã chọn plugin `Plugins/GameFeatures/<Feature>/Content`; asset Palworld vẫn giữ package path cần thiết cho soft reference. | Giữ composition artifact trong plugin; packaging/cook phải đưa asset presentation được chọn vào runtime. |
| 33 | Generator manifest text → `GameFeatureData.uasset` phải deterministic đến mức nào và artifact có commit hay chỉ CI lưu? | Đã chọn generator generic, semantic fingerprint và artifact commit như sản phẩm phái sinh. | CI chạy lại từng manifest, so semantic composition; không dùng raw binary SHA256. |
| 34 | Phạm vi sử dụng asset Palworld cho PlayerPresentation là gì? | Tất cả Asset của Palworld được sử dụng cho mục đích học tập cá nhân, phi thương mại. | Đóng câu hỏi cho phạm vi học tập cá nhân phi thương mại; không mở rộng sang phân phối hoặc sử dụng thương mại. |
| 35 | Phiên bản Palworld nào là mục tiêu parity? | Số version/build/date và platform; nếu có mod/difficulty setting thì ghi kèm. | Khoá công thức, catalog, DataTable và video behavior; tránh trộn dữ liệu nhiều phiên bản. |
| 36 | ADR-001 có được duyệt không? | `APPROVE` hoặc sửa riêng bốn quyết định ở Chương 39.12. | Mở/không mở code gate cho kiến trúc hội tụ và vertical spine. |
| 37 | Logic Blueprint KYWorld thực sự làm gì? | Export graph hoặc ảnh/video node cho `InventorySystem`, `PalDataComponent`, `GA_Pal_Encounter`, `BP_PalSphere`, `BP_CraftMaster`, `BP_BuildPartMaster`, `SpawnManager`. | Nâng bằng chứng từ `[Asset]` lên implementation-readable; quyết định port hay chỉ dùng làm reference. |
| 38 | Behavior baseline của capture/work/build/dungeon/breeding là gì? | Video có input, timestamp, success/failure và state trước/sau từ phiên bản mục tiêu. | Viết state machine, human test card và parity acceptance có nguồn. |
| 39 | Vertical spine ưu tiên kết thúc ở roster/summon hay đi tiếp tới work output trong sprint đầu? | Chọn milestone human-visible tối thiểu; đề xuất đi tới Work nếu thời gian còn, nhưng không mở Work trước khi Capture khép. | Cắt scope PR và phân bổ countdown mà không tạo đoạn dang dở. |

Mục license asset Palworld đã được đóng đúng phạm vi người dùng xác nhận:
chỉ học tập cá nhân, phi thương mại. Quyết định này không cấp phép, không
mở rộng sang phân phối thương mại, sản phẩm thương mại hoặc cung cấp asset cho
bên thứ ba.

Các mục trên là câu hỏi, không phải tuyên bố thiếu sót của implementation.
Mục composition native đã được đóng bằng quyết định chuyển sang Game Features +
ModularGameplay; câu hỏi còn lại là cách đặt content và cách sinh/kiểm artifact
`.uasset`. Riêng mục 31 được mở ra bởi Movement vertical slice: đường JSON
feature-owned đã chạy, nhưng chưa phải Data Registry đầy đủ. Khi có câu trả lời,
cập nhật catalog và contract thay vì sửa ngầm từng feature.
