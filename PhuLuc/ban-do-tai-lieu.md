# Bản đồ tài liệu tham chiếu Paldark, chương 21–35

> Phạm vi: các catalog `course.yaml` trong 13 thư mục có catalog thực tế (`02`, `05`, `07`–`17`; không có `01`). Catalog được parse bằng script; sau đó chọn lọc theo chủ đề và đọc các bài có điểm khớp cao. Đường dẫn `document` là tương đối với thư mục khoá học. `source_paths` là tương đối với thư mục source được ghi trong catalog; riêng `02.Palworld` là tương đối với `02.Palworld/Source`.
>
> Nhãn KYWorld:
> - **C++ source proof**: có class `.h/.cpp` đọc được trong snapshot; chưa tự chứng minh đã tích hợp/test trong Paldark.
> - **Blueprint asset**: có Blueprint class/ability/component/widget được catalog dẫn tới; graph binary chưa được export/inspect nên chỉ chứng minh asset tồn tại và doc mô tả flow.
> - **Data/asset**: DataTable, DataAsset, map, mesh, animation hoặc content cấu hình; không tự chứng minh có runtime behavior.
> - **Thiếu/không thấy**: catalog hoặc `02.Palworld/Source` không có triển khai tương ứng.
>
> Kiểm kê source/commit và các bất thường của course nằm ở [Phụ lục D](D-kiem-ke-13-khoa-hoc.md). Khoá 12/14/15/16 là doc-only trong workspace hiện tại.

## Chương 21 — Di chuyển và input

| Khoá / lesson | Tiêu đề | `document` | `source_paths` đáng đọc |
|---|---|---|---|
| `02.Palworld` / `10-003` | Enhanced Input and DataAsset InputConfig | `02.Palworld/Documents/10-KYWorld Source Architecture/03-Enhanced Input and DataAsset InputConfig.txt` | `Source/Palworld_Base/Public/Component/Input/BaseInputComponent.h`; `Public/DataAsset/Input/DataAsset_InputConfig.h`; `Private/DataAsset/Input/DataAsset_InputConfig.cpp`; `Content/Blueprint/DataAsset/InputData/DA_InputConfig.uasset` |
| `13.…` / `02-007` | Add the Look Input Action | `13.Udemy-ue5-multiplayer-in-unreal-with-gas-and-aws-dedicated-servers/Documents/02 - Basic Character Movement Control and Animations/007 08 Add the Look Input Action_en.txt` | Catalog không khai báo `source_paths`; dùng như bài API/input, không như source proof |
| `13.…` / `02-008` | Add the Move Input Action | `13.Udemy-ue5-multiplayer-in-unreal-with-gas-and-aws-dedicated-servers/Documents/02 - Basic Character Movement Control and Animations/008 09 Add the Move Input Action_en.txt` | Catalog không khai báo `source_paths` |
| `14.…` / `02-007` | Enhanced Input System in Lyra | `14.Udemy-ue5-exploring-lyra-for-game-development/Documents/02 - Lyra and Gameplay Ability System Concepts/007 Enhanced Input System in Lyra_en.txt` | Catalog không có source snapshot |

**KYWorld:** `PlayerCharacter.h/.cpp`, `BaseCharacter.h/.cpp`, `BaseInputComponent.h`, `DataAsset_InputConfig.h/.cpp` có C++ source proof; `DA_InputConfig.uasset` là data asset được C++ tham chiếu. Animation Blueprint và montage trong `Content/Blueprint/Character/Player` là presentation assets, không phải movement authority riêng.

## Chương 22 — Tương tác và thu thập

| Khoá / lesson | Tiêu đề | `document` | `source_paths` đáng đọc |
|---|---|---|---|
| `02.Palworld` / `02-001` | IInteractInterface | `02.Palworld/Documents/02-Interaction System/01-IInteractInterface.txt` | `Content/Blueprint/Component/Inventory/IInteractInterface.uasset`; `Source/Palworld_Base/Public/Item/ItemBase.h` |
| `02.Palworld` / `02-002` | F Key Interaction Flow | `02.Palworld/Documents/02-Interaction System/02-F Key Interaction Flow.txt` | `Content/Blueprint/Character/Player/GameplayAbility/Inventory/GA_Interact.uasset`; `Content/Blueprint/Component/Inventory/InventoryManager.uasset`; `Content/Blueprint/Component/Inventory/InventorySystem.uasset` |
| `02.Palworld` / `02-003` | InteractionTrace and Item Outline | `02.Palworld/Documents/02-Interaction System/03-InteractionTrace and Item Outline.txt` | `Content/Blueprint/Character/Player/GameplayAbility/Inventory/GA_Interact.uasset`; `Content/Blueprint/Component/Inventory/UI/W_PickupWidget.uasset`; `Source/Palworld_Base/Public/Item/ItemBase.h` |
| `09.…` / `01-007` | Primary Interact Action | `09.Udemy-ue5-inventory-system/Documents/01 - Introduction/007 Primary Interact Action_en.txt` | Catalog không khai báo `source_paths` |
| `09.…` / `01-009` | Item Trace Channel | `09.Udemy-ue5-inventory-system/Documents/01 - Introduction/009 Item Trace Channel_en.txt` | Catalog không khai báo `source_paths` |

**KYWorld:** interaction có Blueprint assets + document mô tả flow (`GA_Interact`, interface, widgets) và item-base C++; chưa có graph export để đọc implementation, và không thấy một C++ interaction subsystem độc lập.

## Chương 23 — Vật phẩm và túi đồ

| Khoá / lesson | Tiêu đề | `document` | `source_paths` đáng đọc |
|---|---|---|---|
| `02.Palworld` / `03-001` | Item Class Hierarchy | `02.Palworld/Documents/03-Item System/01-Item Class Hierarchy.txt` | `Source/Palworld_Base/Public/Item/ItemBase.h`; `EquipmentBase.h`; `ResourceItemBase.h`; `MaterialItemBase.h` |
| `02.Palworld` / `04-001` | Architecture and FSlotStruct | `02.Palworld/Documents/04-Inventory System/01-Architecture and FSlotStruct.txt` | `Source/Palworld_Base/Public/Component/Inventory/InventoryComponentBase.h`; `Content/Blueprint/Component/Inventory/Struct/FSlotStruct.uasset`; `InventorySystem.uasset` |
| `02.Palworld` / `04-003` | FindSlot AddToStack and CreateNewStack | `02.Palworld/Documents/04-Inventory System/03-FindSlot AddToStack and CreateNewStack.txt` | `Content/Blueprint/Component/Inventory/InventorySystem.uasset`; `Struct/FSlotStruct.uasset` |
| `09.…` / `03-002` | Fast Array Serializer | `09.Udemy-ue5-inventory-system/Documents/03 - Inventory Data/002 Fast Array Serializer_en.txt` | Catalog không khai báo `source_paths` |
| `17.…` / `10-001` | Inventory — How is it developed? | `17.Hipernova-Lyra-Inventory/Documents/10-Inventory System/01-Inventory - How is it developed.txt` | `Source/Source/LyraGame/Inventory/`; `Source/Plugins/GameFeatures/InventoryExtendedForLyra/Source/InventoryExtendedforLyraRuntime/Public/Inventory/` |

**KYWorld:** item hierarchy và `InventoryComponentBase` có C++ source proof; slot/stack/transfer chủ yếu nằm trong Blueprint assets. Asset/document cho thấy scope inventory prototype, nhưng không phải source proof cho replicated Fast Array như khoá 09 hay fragment/container architecture như khoá 17.

## Chương 24 — Chế tạo

| Khoá / lesson | Tiêu đề | `document` | `source_paths` đáng đọc |
|---|---|---|---|
| `02.Palworld` / `07-001` | Workbench and Crafting | `02.Palworld/Documents/07-Interactive Objects/01-Workbench and Crafting.txt` | `Content/Blueprint/Craft/CraftPart/BP_WorkBenchPrimitive.uasset`; `BP_CraftMaster.uasset`; `CraftMenu/W_CraftWindow.uasset`; `Crafting/DT_Crafting.uasset` |
| `02.Palworld` / `07-002` | Container Wood Box | `02.Palworld/Documents/07-Interactive Objects/02-Container Wood Box.txt` | `Content/Blueprint/Craft/CraftPart/BP_WoodBox.uasset`; `Content/Blueprint/Component/Inventory/BP_Item/BP_WoodBox.uasset`; `UI/W_ContainerInventory.uasset` |
| `17.…` / `06-001` | Adding New Crafteable ItemDefinition | `17.Hipernova-Lyra-Inventory/Documents/06-Craft System/01-Adding New Crafteable ItemDefinition.txt` | `InventoryFragment_CraftItem.h`; `LyraInventoryManagerComponent.h` |
| `17.…` / `06-002` | Craft — How does it work? | `17.Hipernova-Lyra-Inventory/Documents/06-Craft System/02-Craft - How does it work.txt` | `InventoryFragment_CraftItem.h`; `LyraInventoryManagerComponent.h` |

**KYWorld:** crafting có Blueprint + DataTable assets và document mô tả flow; graph chưa đọc được, không có C++ crafting service trong catalog.

## Chương 25 — Chiến đấu

| Khoá / lesson | Tiêu đề | `document` | `source_paths` đáng đọc nhất |
|---|---|---|---|
| `02.Palworld` / `10-004` | Ability System Component and Gameplay Abilities | `02.Palworld/Documents/10-KYWorld Source Architecture/04-Ability System Component and Gameplay Abilities.txt` | `BaseAbilitySystemComponent.h/.cpp`; `BaseAttributeSet.h`; `BaseGameplayAbility.h`; `DataAsset_StartupBase.h` |
| `02.Palworld` / `10-007` | Gameplay Tags and Damage Library | `02.Palworld/Documents/10-KYWorld Source Architecture/07-Gameplay Tags and Damage Library.txt` | `BaseGameplayTag.h/.cpp`; `BaseFunctionLibrary.h/.cpp` |
| `05.…` / `06-014` | Melee Damage Effect | `05.Udemy-ue5-gas-crash-course/Documents/06-Enemy Combat/14-Melee Damage Effect.txt` | Catalog không khai báo `source_paths` |
| `11.…` / `16-001` | Melee Attack Ability | `11.Udemy-ue5-gas-top-down-rpg/Documents/16 - Enemy Melee Attacks/001 Melee Attack Ability_en.txt` | Catalog không khai báo `source_paths` |
| `15.…` / `07-001` | Gameplay Ability — Basic Attack | `15.Udemy-ue5-build-an-rpg-using-lyra-framework/Documents/07 - Creating a Melee Attack Ability/001 Gameplay Ability - Basic Attack_en.txt` | Catalog không có source snapshot |
| `17.…` / `05-001` | Combo System | `17.Hipernova-Lyra-Inventory/Documents/05-Combat System/01-Combo System.txt` | `LyraGameplayAbility_MeleeWeapon.h`; `Source/Source/LyraGame/AbilitySystem/` |

**KYWorld:** GAS foundation và generic abilities là C++; concrete attack abilities, montages, character skills và HUD phần lớn là Blueprint assets.

## Chương 26 — Bắt giữ

| Khoá / lesson | Tiêu đề | `document` | `source_paths` đáng đọc nhất |
|---|---|---|---|
| `02.Palworld` / `05-001` | Pal Hierarchy and FPalProfile | `02.Palworld/Documents/05-Pal System/01-Pal Hierarchy and FPalProfile.txt` | `Source/Palworld_Base/Public/Character/Pal/PalCharacterBase.h`; `Content/Blueprint/Component/Inventory/Struct/FPalProfileStruct.uasset`; `BP_PalCharacterBase.uasset` |
| `02.Palworld` / `05-002` | PalDataComponent and Capture Flow | `02.Palworld/Documents/05-Pal System/02-PalDataComponent and Capture Flow.txt` | `PalDataComponent.uasset`; `BP_PalSphere.uasset`; `GA_Pal_Encounter.uasset` |
| `02.Palworld` / `05-003` | PalInventorySystemComponent and PalMap | `02.Palworld/Documents/05-Pal System/03-PalInventorySystemComponent and PalMap.txt` | `PalInventorySystem.uasset`; `FPalStruct.uasset`; `W_PalBoxGrid.uasset` |
| `02.Palworld` / `10-006` | Pal Character and AI Controller | `02.Palworld/Documents/10-KYWorld Source Architecture/06-Pal Character and AI Controller.txt` | `PalCharacterBase.h/.cpp`; `BaseAIController.h/.cpp`; `Content/Blueprint/Character/Pal/BP_BaseAIController.uasset` |

**KYWorld:** capture flow là Blueprint runtime (`BP_PalSphere`, `GA_Pal_Encounter`, `PalDataComponent`); Pal actor/AI base có C++. Không thấy C++ capture service riêng.

## Chương 27 — Bạn đồng hành

| Khoá / lesson | Tiêu đề | `document` | `source_paths` đáng đọc nhất |
|---|---|---|---|
| `02.Palworld` / `05-001` | Pal Hierarchy and FPalProfile | `02.Palworld/Documents/05-Pal System/01-Pal Hierarchy and FPalProfile.txt` | `PalCharacterBase.h`; `FPalProfileStruct.uasset`; `BP_PalCharacterBase.uasset` |
| `02.Palworld` / `05-003` | PalInventorySystemComponent and PalMap | `02.Palworld/Documents/05-Pal System/03-PalInventorySystemComponent and PalMap.txt` | `PalInventorySystem.uasset`; `FPalStruct.uasset`; `W_PalBoxGrid.uasset` |
| `02.Palworld` / `10-006` | Pal Character and AI Controller | `02.Palworld/Documents/10-KYWorld Source Architecture/06-Pal Character and AI Controller.txt` | `PalCharacterBase.h/.cpp`; `BaseAIController.h/.cpp`; `BP_BaseAIController.uasset` |
| `11.…` / `15-002` | AI Controller Blackboard and Behavior Tree | `11.Udemy-ue5-gas-top-down-rpg/Documents/15 - Enemy AI/002 AI Controller Blackboard and Behavior Tree_en.txt` | Catalog không khai báo `source_paths` |
| `11.…` / `15-003` | Behavior Tree Service | `11.Udemy-ue5-gas-top-down-rpg/Documents/15 - Enemy AI/003 Behavior Tree Service_en.txt` | Catalog không khai báo `source_paths` |

**KYWorld:** companion data/box/party là Blueprint và DataTable; AI controller và Pal character base có C++ nhưng hành vi cụ thể dùng Behavior Tree/Blueprint assets.

## Chương 28 — Xây dựng

| Khoá / lesson | Tiêu đề | `document` | `source_paths` đáng đọc nhất |
|---|---|---|---|
| `02.Palworld` / `11-005` | BuildObject and Work Suitability Tables | `02.Palworld/Documents/11-Palworld DataTable Architecture/05-BuildObject and Work Suitability Tables.txt` | Catalog không gắn source path; đọc như data contract |
| `02.Palworld` / `07-001` | Workbench and Crafting | `02.Palworld/Documents/07-Interactive Objects/01-Workbench and Crafting.txt` | `BP_CraftMaster.uasset`; `DT_Crafting.uasset` |
| `17.…` / `02-001` | How Work Building System? | `17.Hipernova-Lyra-Inventory/Documents/02-Building System/01-How Work Building System.txt` | `InventoryFragment_Building.h` |
| `15.…` / `04-005` | Introduction to Ulag Snap and Swap — Level Creation Automation | `15.Udemy-ue5-build-an-rpg-using-lyra-framework/Documents/04 - Environment Creation/005 Introduction to Ulag Snap and Swap - Level Creation Automation_en.txt` | Catalog không có source snapshot |

**KYWorld:** build content là Blueprint/data (`BP_BuildPartMaster`, `BP_Wall`, `BP_Floor`, `DT_Building`, `FBuildRecipe`, `BPI_BuildingInterface`); không thấy C++ building subsystem.

## Chương 29 — Làm việc và tự động hoá

| Khoá / lesson | Tiêu đề | `document` | `source_paths` đáng đọc nhất |
|---|---|---|---|
| `02.Palworld` / `11-005` | BuildObject and Work Suitability Tables | `02.Palworld/Documents/11-Palworld DataTable Architecture/05-BuildObject and Work Suitability Tables.txt` | Catalog không gắn source path |
| `02.Palworld` / `10-006` | Pal Character and AI Controller | `02.Palworld/Documents/10-KYWorld Source Architecture/06-Pal Character and AI Controller.txt` | `PalCharacterBase.h/.cpp`; `BaseAIController.h/.cpp`; `BP_BaseAIController.uasset` |
| `11.…` / `15-002` | AI Controller Blackboard and Behavior Tree | `11.Udemy-ue5-gas-top-down-rpg/Documents/15 - Enemy AI/002 AI Controller Blackboard and Behavior Tree_en.txt` | Catalog không khai báo `source_paths` |
| `11.…` / `15-003` | Behavior Tree Service | `11.Udemy-ue5-gas-top-down-rpg/Documents/15 - Enemy AI/003 Behavior Tree Service_en.txt` | Catalog không khai báo `source_paths` |
| `17.…` / `06-002` | Craft — How does it work? | `17.Hipernova-Lyra-Inventory/Documents/06-Craft System/02-Craft - How does it work.txt` | `InventoryFragment_CraftItem.h`; `LyraInventoryManagerComponent.h` |

**KYWorld:** có nền AI C++/Blueprint và bảng suitability, nhưng không thấy hệ thống worker automation hoàn chỉnh trong `Source`.

## Chương 30 — Tiến trình và công nghệ

| Khoá / lesson | Tiêu đề | `document` | `source_paths` đáng đọc nhất |
|---|---|---|---|
| `02.Palworld` / `11-007` | Progression and Special System Tables | `02.Palworld/Documents/11-Palworld DataTable Architecture/07-Progression and Special System Tables.txt` | Catalog không gắn source path |
| `02.Palworld` / `09-001` | Player Stats and Weight | `02.Palworld/Documents/09-Player Stats and Menu/01-Player Stats and Weight.txt` | `Source/Palworld_Base/Public/AbilitySystem/BaseAttributeSet.h`; `DT_PlayerStatData.uasset` |
| `11.…` / `31-015` | Loading World State | `11.Udemy-ue5-gas-top-down-rpg/Documents/31 - Checkpoints/015 Loading World State_en.txt` | Catalog không khai báo `source_paths` |
| `13.…` / `11-015` | Update Level and Upgrade Point Based on Experience | `13.Udemy-ue5-multiplayer-in-unreal-with-gas-and-aws-dedicated-servers/Documents/11 - Character Level, Stats and Stats Driven Attributes/015 120 Update Level and Upgrade Point Based on Experience_en.txt` | Catalog không khai báo `source_paths` |

**KYWorld:** attribute base và player stat data có C++; progression/technology tables là data-only trong snapshot, không thấy progression subsystem/tech unlock C++.

## Chương 31 — Thế giới và sinh sản

| Khoá / lesson | Tiêu đề | `document` | `source_paths` đáng đọc nhất |
|---|---|---|---|
| `02.Palworld` / `11-001` | DataTable Architecture and Folder Map | `02.Palworld/Documents/11-Palworld DataTable Architecture/01-DataTable Architecture and Folder Map.txt` | DataTable catalog; không có source path cụ thể |
| `02.Palworld` / `11-006` | Spawner and Dungeon Tables | `02.Palworld/Documents/11-Palworld DataTable Architecture/06-Spawner and Dungeon Tables.txt` | DataTable catalog; không có source path cụ thể |
| `14.…` / `03-019` | Environment Creation — Ultra Dynamic Sky and Weather | `14.Udemy-ue5-exploring-lyra-for-game-development/Documents/03 - Developing a Combat Game/019 Environment Creation - Ultra Dynamic Sky and Weather_en.txt` | Catalog không có source snapshot |
| `11.…` / `32-011` | Spawn Volumes | `11.Udemy-ue5-gas-top-down-rpg/Documents/32 - Map Entrance/011 Spawn Volumes_en.txt` | Catalog không khai báo `source_paths` |
| `17.…` / `16-002` | Bed | `17.Hipernova-Lyra-Inventory/Documents/16-Respawn System/02-Bed.txt` | `LyraPlayerSpawningManagerComponent.h`; `WorldInteractable.h` |

**KYWorld:** có DataTables và map/content assets cho world/spawn/dungeon, nhưng không thấy world clock/weather/spawn scheduler C++ tương ứng; xem đây là data/content reference, không phải full world implementation.

## Chương 32 — Hang động và trùm

| Khoá / lesson | Tiêu đề | `document` | `source_paths` đáng đọc nhất |
|---|---|---|---|
| `02.Palworld` / `11-006` | Spawner and Dungeon Tables | `02.Palworld/Documents/11-Palworld DataTable Architecture/06-Spawner and Dungeon Tables.txt` | DataTable catalog; không có source path cụ thể |
| `02.Palworld` / `10-004` | Ability System Component and Gameplay Abilities | `02.Palworld/Documents/10-KYWorld Source Architecture/04-Ability System Component and Gameplay Abilities.txt` | `BaseAbilitySystemComponent.h/.cpp`; `BaseGameplayAbility.h`; startup data assets |
| `11.…` / `32-011` | Spawn Volumes | `11.Udemy-ue5-gas-top-down-rpg/Documents/32 - Map Entrance/011 Spawn Volumes_en.txt` | Catalog không khai báo `source_paths` |
| `15.…` / `07-014` | Enemy Death | `15.Udemy-ue5-build-an-rpg-using-lyra-framework/Documents/07 - Creating a Melee Attack Ability/014 Enemy Death_en.txt` | Catalog không có source snapshot |

**KYWorld:** dungeon tables và boss/skill assets có tính data/Blueprint; không thấy C++ dungeon run, room state, reward claim hay boss encounter manager trong `02.Palworld/Source`.

## Chương 33 — Lưu trữ

| Khoá / lesson | Tiêu đề | `document` | `source_paths` đáng đọc nhất |
|---|---|---|---|
| `02.Palworld` / `01-002` | Level Flow and GameInstance Persistence | `02.Palworld/Documents/01-Project Overview/02-Level Flow and GameInstance Persistence.txt` | `Content/Level/StartLevel.umap`; `CustomizationLevel.umap`; `ThirdPersonMap.umap` |
| `02.Palworld` / `08-002` | Mesh Application and GameInstance Persistence | `02.Palworld/Documents/08-Character Customization/02-Mesh Application and GameInstance Persistence.txt` | `PlayerCharacter.h`; `BP_PalGameInstance.uasset`; `DT_Head.uasset`; `DT_Hair.uasset` |
| `11.…` / `31-005` | Interface Function for Saving Progress | `11.Udemy-ue5-gas-top-down-rpg/Documents/31 - Checkpoints/005 Interface Function for Saving Progress_en.txt` | Catalog không khai báo `source_paths` |
| `11.…` / `31-015` | Loading World State | `11.Udemy-ue5-gas-top-down-rpg/Documents/31 - Checkpoints/015 Loading World State_en.txt` | Catalog không khai báo `source_paths` |

**KYWorld:** chỉ có GameInstance/level persistence mẫu và player customization persistence; không có generic save chunk codec, schema migration hoặc persistent world-state C++ trong source snapshot.

## Chương 34 — Nhiều người chơi

| Khoá / lesson | Tiêu đề | `document` | `source_paths` đáng đọc nhất |
|---|---|---|---|
| `07.…` / `02-001` | The Client-Server Model | `07.Udemy-ue5-multiplayer-crash-course/Documents/02 - Multiplayer Fundamentals/001 The Client-Server Model_en.txt` | Catalog không khai báo `source_paths` |
| `07.…` / `03-001` | Actor Replication | `07.Udemy-ue5-multiplayer-crash-course/Documents/03 - Actor Replication/001 Actor Replication_en.txt` | Catalog không khai báo `source_paths` |
| `07.…` / `03-002` | Authority and Net Role | `07.Udemy-ue5-multiplayer-crash-course/Documents/03 - Actor Replication/002 Authority and Net Role_en.txt` | Catalog không khai báo `source_paths` |
| `07.…` / `04-002` | Run on Server | `07.Udemy-ue5-multiplayer-crash-course/Documents/04 - Remote Functions/002 Run on Server_en.txt` | Catalog không khai báo `source_paths` |
| `13.…` / `03-004` | Setup the Server Client Call Chain | `13.Udemy-ue5-multiplayer-in-unreal-with-gas-and-aws-dedicated-servers/Documents/03 - Integrate Gameplay Ability System to the Character/004 21 Setup the Server Client Call Chain_en.txt` | Catalog không khai báo `source_paths` |

**KYWorld:** C++ GameMode, PlayerController, Character, AbilitySystemComponent và AI classes tồn tại; nhưng snapshot không cung cấp một multiplayer feature/replication architecture tương đương Paldark hiện tại.

## Chương 35 — Nhân giống và kinh tế

| Khoá / lesson | Tiêu đề | `document` | `source_paths` đáng đọc nhất |
|---|---|---|---|
| `02.Palworld` / `11-003` | Item and Economy Tables | `02.Palworld/Documents/11-Palworld DataTable Architecture/03-Item and Economy Tables.txt` | Catalog không gắn source path |
| `02.Palworld` / `11-007` | Progression and Special System Tables | `02.Palworld/Documents/11-Palworld DataTable Architecture/07-Progression and Special System Tables.txt` | Catalog không gắn source path |
| `02.Palworld` / `05-002` | PalDataComponent and Capture Flow | `02.Palworld/Documents/05-Pal System/02-PalDataComponent and Capture Flow.txt` | `PalDataComponent.uasset`; `BP_PalSphere.uasset`; `GA_Pal_Encounter.uasset` |
| `17.…` / `06-002` | Craft — How does it work? | `17.Hipernova-Lyra-Inventory/Documents/06-Craft System/02-Craft - How does it work.txt` | `InventoryFragment_CraftItem.h`; `LyraInventoryManagerComponent.h` |

**KYWorld:** có item/economy data tables và Pal data/capture assets; không thấy C++ breeding farm, parent/progress/claimed state, condenser hay market/economy service. Đây là chương có mapping data rõ nhưng implementation gameplay thiếu.

## Trả lời ba câu hỏi

### 1. KYWorld có source proof gì, và gì chỉ là Blueprint/data/asset?

**Có C++ source đọc được trong `02.Palworld/Source`:**

- player/base character, player controller và game mode;
- Enhanced Input component và input-config DataAsset reader;
- GAS nền: `BaseAbilitySystemComponent`, `BaseAttributeSet`, base/player/Pal gameplay abilities;
- item/resource/equipment/weapon/armor class hierarchy;
- `InventoryComponentBase` và pawn equipment component;
- Pal character base và AI controller;
- gameplay tags/damage helper;
- base widgets/minimap và animation instances.

**Có Blueprint/content asset và document mô tả trong `02.Palworld/Source/Content` (graph chưa export/inspect):**

- interaction (`IInteractInterface`, `GA_Interact`, pickup widget);
- inventory slot/stack/transfer, Pal inventory/PalBox;
- capture (`BP_PalSphere`, `GA_Pal_Encounter`, `PalDataComponent`);
- crafting/workbench/container;
- building parts/menu;
- Pal AI Behavior Trees, EQS, abilities and animation montages;
- HUD, party, pickup and death widgets.

**Chỉ nên coi là data/asset, không tự gọi là implementation:**

- `DT_*`, `F*Struct`, `DA_*`, gameplay tables, item/economy/progression/spawner/dungeon tables;
- maps, meshes, skeletons, animation sequences/montages, materials, icons;
- Pal/building/weapon content assets khi không có Blueprint logic được dẫn tới.

**Không thấy triển khai hoàn chỉnh tương ứng:** world clock/weather scheduler; generic save chunks/migration; dungeon run/reward-claim state; breeding farm/progress/claimed state; condenser; worker automation; complete multiplayer authority/persistence layer. Đây là phân loại theo file/class có trong snapshot, không phải runtime QA claim.

### 2. So sánh nguồn GAS và inventory

**GAS**

- `05` là khoá ngắn, tốt nhất để học primitives theo thứ tự: ASC, AttributeSet, Gameplay Ability, Gameplay Effect, cost/cooldown, target và damage. Hợp với chương 25 khi cần dựng nền GAS tối thiểu.
- `11` là project RPG hoàn chỉnh hơn: attributes, abilities, effects, tags, enemy AI và save/load/checkpoint. Hợp với chương 25, 30, 32 và các stateful ability flows; đổi lại có nhiều coupling theo Aura/top-down RPG.
- `13` nhấn mạnh multiplayer GAS: server/client call chain, prediction/replication, combo, ranged/melee, attributes và dedicated-server/session workflow. Hợp với chương 25 và 34; không phải nguồn inventory chính.

**Inventory**

- `09` là inventory C++ từ nền tảng: Fast Array Serializer, replicated item data, fragments, slots/grid, stacking, drag/drop, equipment, shop. Đây là nguồn tốt nhất cho inventory authoritative/replicated của chương 23.
- `17` là snapshot Lyra + plugin Inventory Extended: inventory manager/fragment interfaces, crafting, building, armor, equipment, weapon và các integration points với Lyra/GAS. Đây là nguồn tốt nhất cho chương 23, 24, 28 và integration với Game Features; không nên dùng nó như bài nhập môn Fast Array.

### 3. Game Features/Modular Gameplay trong khoá 14/15

**Có.**

- `14-016` — `14.Udemy-ue5-exploring-lyra-for-game-development/Documents/02 - Lyra and Gameplay Ability System Concepts/016 Introduction to Game Feature Plugin_en.txt`
- `14-017` — `14.Udemy-ue5-exploring-lyra-for-game-development/Documents/02 - Lyra and Gameplay Ability System Concepts/017 Shooter Core Game Feature Plugin_en.txt`
- `12-001` — `14.Udemy-ue5-exploring-lyra-for-game-development/Documents/12 - Lyra from Scratch in Unreal Engine 5.3/001 Creating a New Game Feature Plugin_en.txt`
- `02-004` — `15.Udemy-ue5-build-an-rpg-using-lyra-framework/Documents/02 - Creating a new RPG Experience/004 Create Game Feature Plugin RPGCore_en.txt`

Các bài này bổ sung điều mà kiến trúc Paldark phải làm rõ khi triển khai: Game Feature Plugin không chỉ là folder/module; nó có activation lifecycle, `GameFeatureData`, actions để register/attach behavior vào host, và cách Lyra tách Experience/feature composition khỏi pawn/game mode cứng. `14-017` cho thấy một feature lớn (Shooter Core) được ghép từ nhiều phần; `14-12-001` và `15-02-004` cho thấy quy trình tạo feature mới trong Lyra. Tuy nhiên catalog của `14`/`15` không có source snapshot C++ tương ứng, nên các bài này là giáo trình hướng dẫn, không phải source proof cho class cụ thể.

## Ghi chú độ tin cậy

- `02.Palworld` có source paths cụ thể nên là bản đồ scope/implementation candidate tốt nhất; C++ đọc được và Blueprint binary phải được phân biệt.
- Catalog của nhiều khoá Udemy chỉ có `document`, không có `source_paths`; các dòng đó là bài học tham chiếu, không phải bằng chứng source đã được snapshot.
- “Blueprint asset” ở đây chỉ nghĩa là asset được catalog dẫn tới; không suy diễn graph, nhánh logic hoặc runtime result đã được đọc/kiểm thử.
- Chương 33 của Paldark cần codec owner-owned riêng; không dùng GameInstance persistence của KYWorld làm bằng chứng cho kiến trúc đó.
