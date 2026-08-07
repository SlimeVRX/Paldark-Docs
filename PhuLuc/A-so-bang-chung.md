# Phụ lục A — Sổ bằng chứng

Sổ này gom claim ở khối bằng chứng cuối các chương 1–35. Nhãn được giữ theo cách các chương đã dùng; claim thiết kế không được đọc như fact Palworld.

| Chương | Claim | Nguồn | Nhãn |
|---:|---|---|---|
| 1 | Cách đọc game phải tách cảm giác, hệ thống và bằng chứng | Chương 1, tài liệu phương pháp | INFERRED |
| 2 | Các hệ thống Palworld và schema guild/permission cần phân biệt fact với thiết kế | `Documents/Book/Palworld_Whitepaper/`, source dossier | UNKNOWN/EXTRACTED |
| 3 | Catalog có mã `F-001`–`F-126` | `Q1-Doc-Mot-Game/03-catalog-tinh-nang.md` | EXTRACTED |
| 4 | Feature phải được tách thành state, owner và mutation | Q1 Chương 4 | INFERRED |
| 5 | Thứ tự dựng phải đi từ nền tới vòng chơi | Q1 Chương 5 | INFERRED |
| 6 | Codebase đông agent vỡ vì shared file và ownership mơ hồ | Q2 Chương 6 | INFERRED |
| 7 | Lyra cung cấp modularity nhưng có chi phí học và tích hợp | Lyra source/documentation | REFERENCE |
| 8 | UEFN minh họa asset/module locking và parallel ownership | UEFN documentation | REFERENCE; cơ chế cụ thể UNKNOWN |
| 9 | Các nguyên tắc modular có tiền lệ thực tế | Q2 Chương 10, source khảo sát | OBSERVED/REFERENCE |
| 10 | L1–L12 là luật kiến trúc Paldark | Q2 Chương 11 | INFERRED |
| 11 | Rủi ro hiệu năng của nhiều actor, replication và scan cần đo bằng profile | Q2 Chương 11.3 | UNKNOWN/INFERRED |
| 12 | `FPaldarkEntityId` là stable ID chung, không phải actor/definition | Q3 Chương 12.2 | INFERRED |
| 13 | Đọc snapshot không cần authority/correlation; mutation mới cần owner/authority | Q3 Chương 12.4 | INFERRED |
| 14 | Bốn module Core/Data/Persistence/Runtime tạo topology nền | Q3 Chương 13 | INFERRED |
| 15 | Definition–fragment–entity–save là mô hình dữ liệu | Q3 Chương 14 | INFERRED |
| 16 | `TMap<FGameplayTag,int32>` là hình dạng Work.Capable | Q3 Chương 14.2, Work schema | EXTRACTED/INFERRED |
| 17 | Registry có bốn bước scan, resolve, validate, freeze | Q3 Chương 14.3 | INFERRED |
| 18 | Entity tách khỏi actor và mọi relation dùng stable ID | Q3 Chương 14.4 | INFERRED |
| 19 | Mỗi feature có save chunk riêng, có schema và migration | Q3 Chương 14.5 | INFERRED |
| 20 | Static registration cần chống linker stripping và init-order | Q3 Chương 15 | REFERENCE/INFERRED |
| 21 | Interface/event/result có namespace khác nhau | Q3 Chương 15, quyết định thiết kế | INFERRED |
| 22 | Feature plugin có manifest, data, code, docs, tests và save codec | Q3 Chương 16 | INFERRED |
| 23 | Blueprint chỉ presentation, public contract nằm ở C++ | Q3 Chương 17 | INFERRED |
| 24 | Log/test/evidence là phần của contract | Q3 Chương 18 | INFERRED |
| 25 | CI có thể bắt cấu trúc, namespace, schema và link nhưng không bắt gameplay đúng | Q3 Chương 19 | INFERRED |
| 26 | Input, movement mode và mount relation cần owner tách biệt | Q4 Chương 21 | INFERRED |
| 27 | Interaction có focus, range, harvest và pickup request | Q4 Chương 22 | INFERRED |
| 28 | Item definition/fragment/entity/quantity/container tách theo Chương 14 | Q4 Chương 23 | INFERRED |
| 29 | `EPalWeaponType`, `MagazineSize`, `Durability` và field damage cho thấy hình dạng weapon | `C03-Combat.md` và source dossier | EXTRACTED/REFERENCE |
| 30 | Crafting queue và input reservation phải đi qua owner Inventory/Crafting | Q4 Chương 24 | INFERRED |
| 31 | `EPalWeaponType` có 21 giá trị gồm `MAX` | `C03-Combat.md` | EXTRACTED |
| 32 | Damage do bên gây gửi request, Health owner quyết định áp dụng | Q3 Chương 12.4, Q4 Chương 25 | INFERRED |
| 33 | `FDamageResult` cần HP trước/sau, death/downed và correlation | quyết định thiết kế; Q4 Chương 25 | INFERRED |
| 34 | `CaptureRateCorrect` nằm trong `PalCharacterParameterDatabaseRow.h` | source header | EXTRACTED |
| 35 | Công thức capture thật không được suy ra từ field đơn lẻ | source dossier, Q4 Chương 26 | UNKNOWN |
| 36 | Party có thể giữ entity khi actor chưa spawn | Q3 Chương 14.4, Q4 Chương 27 | INFERRED |
| 37 | Build preview khác structure entity bền | Q4 Chương 28 | INFERRED |
| 38 | `EPalWorkSuitability` có 13 loại việc | source/header khảo sát | EXTRACTED |
| 39 | Work offline cần policy mô phỏng/tính bù và dữ liệu timestamp/queue/output | Q4 Chương 29 | INFERRED; policy UNKNOWN |
| 40 | Progression là owner duy nhất của unlocked-node set | Q4 Chương 30, L8 | INFERRED |
| 41 | `FPalWildSpawnerDatabaseRow` và `PalDungeonSpawnAreaData` cho thấy spawn có row/area/condition | source headers | EXTRACTED |
| 42 | Population budget là rủi ro hiệu năng và state khi spawn/despawn liên tục | Q4 Chương 31 | INFERRED |
| 43 | Dungeon run/room/boss/reward cần idempotent claim | Q4 Chương 32 | INFERRED |
| 44 | Save cần generation, commit marker, migration, checksum và round-trip comparison | Q4 Chương 33 | INFERRED |
| 45 | Giả định save order ở Chương 20.2 chưa phải fact runtime | Chương 20.2, Q4 Chương 33 | UNKNOWN |
| 46 | Network authority là tính chất của từng state, không phải module gameplay tổng | Chương 13.2, Q4 Chương 34 | INFERRED |
| 47 | Guild/permission của Paldark là thiết kế vì schema Palworld chưa biết | Q2 Chương 2, Q4 Chương 34 | UNKNOWN/INFERRED |
| 48 | `FPalBreedingItemEffectData` mô tả vật phẩm ảnh hưởng breeding | source header | EXTRACTED |
| 49 | `UPalMapObjectBreedFarmModel` mô tả farm breeding và assignment | source header | EXTRACTED |
| 50 | `FPalCombiUniqueDatabaseRow` cho thấy bảng tổ hợp/rank | source header | EXTRACTED |
| 51 | Bảng tổ hợp đầy đủ và mutation rate chưa biết | Q4 Chương 35 | UNKNOWN |
| 52 | PR #135→#157 merge trong 15:03:03; khoảng gần 11 giờ chỉ đúng tới #156 | first-parent merge metadata `099fc590`→`5e70218d`, GitHub PR metadata | OBSERVED |
| 53 | Range #135–#157 có 275 file, `+16.436/-577` net; tổng tại #157 là 19 Game Feature plugins | Git range diff và tree tại `5e70218d` | OBSERVED |
| 54 | Điểm E/V/P trung bình #157 là 56,7/7,0/9,5 và HEAD #178 là 61,9/15,0/12,0 | static source audit Chương 36; sai số ±5, chưa runtime | OBSERVED/INFERRED |
| 55 | Interaction normal path có thể gửi `Harvest` tới world target yêu cầu `Pickup` | `InteractionFeatureComponent.cpp`, `InteractionQATarget.cpp`, `WorldFeatureSubsystem.cpp` tại `09e9b5e7` | OBSERVED |
| 56 | PalBehavior phát `TargetCorrelationId`/`NavigationTarget` trong khi Work đọc `CorrelationId`/`ArrivalLocation` | `PalBehaviorComponent.cpp`, `WorkFeatureComponent.cpp` tại `09e9b5e7` | OBSERVED |
| 57 | Chỉ 9/13 course có Source submodule; 12/14/15/16 là doc-only trong workspace | `.gitmodules`, cây course, Phụ lục D | OBSERVED |
| 58 | KYWorld có 539 commit toàn lịch sử, 530 commit trong 05/12/2024–06/01/2025 và nhiều tác giả làm song song | Git history/shortlog của `02.Palworld/Source` | OBSERVED |
| 59 | KYWorld Palworld-specific gameplay chủ yếu là Blueprint binary; tên asset không chứng minh graph implementation | course/source inventory, Phụ lục D/E | OBSERVED; nội dung graph UNKNOWN |
| 60 | `PaldarkCore` hiện phụ thuộc UMG và global event bus dùng `AActor* + FName + TArray<uint8>` | `PaldarkCore.Build.cs`, `PaldarkWorldLabelWidget.h`, `PaldarkCoreEventBus.h` | OBSERVED |
| 61 | System/domain boundary không đồng nghĩa GameFeature activation boundary | Chương 39, Epic Lyra/Game Features docs, current plugin audit | REFERENCE/INFERRED |
| 62 | Chiến lược hội tụ Kit shell + V3 invariant + Lab/V2 donor + KYWorld behavior reference | Chương 39 ADR-001 | PROPOSED/INFERRED |
| 63 | Agent compile; Soliz làm visual/runtime test card trong sprint hiện tại | Chương 40–42, yêu cầu người dùng | DECIDED, chờ ADR approval cho code |
| 64 | DeepWiki hiện tại là render từ snapshot `638298d1` và chứa claim đã lỗi thời sau audit | `Documents/DeepWiki/Wiki-—-SlimeVRX-Soliz-Devin-PaldarkKit.md`, Phụ lục G | OBSERVED |
| 65 | Cả 13 `Knowledge/*Synthesized.html` và file Knowledge bổ sung của khoá 05 đã được đọc/đối chiếu; code block Knowledge chỉ là ví dụ nếu không có lesson source | Phụ lục D, cây `Knowledge/` của 02/05/07–17 | OBSERVED |

## Giới hạn của sổ

`EXTRACTED` và `OBSERVED` là hình dạng hoặc факт có nguồn; `REFERENCE` là mẫu tham khảo; `INFERRED` là quyết định thiết kế Paldark; `UNKNOWN` là khoảng trống cần người dùng hoặc khảo sát bổ sung. Không dùng một dòng `INFERRED` để tuyên bố Palworld vận hành đúng như vậy.
