# Chương 31 — Thế giới và nhịp sống

Người chơi đi qua một bờ biển lúc ban ngày, ghi nhớ những sinh vật và resource ở đó, rồi quay lại vào ban đêm. Nếu mọi thứ đứng nguyên như một bức ảnh, map có thể lớn nhưng thế giới vẫn trống. Time, weather, biome, spawn và respawn phải làm cùng nơi ấy đưa ra một lời mời khác; một vùng bị đánh sạch cũng không thể thành khoảng đất chết vĩnh viễn.

Nhịp sống đó đổi bằng việc liên tục tạo, dỡ và dựng lại representation, nên World cũng là nơi hiệu năng và identity dễ bị trộn nhất. Population budget phải ngăn một vùng đông lên vô hạn. Nếu spawner chỉ nhìn khoảng cách camera, server và save có thể kể hai thế giới khác nhau; nếu giữ mọi actor mãi mãi, relevancy cùng memory sẽ vỡ. Ta cần một scheduler biết entity nào tồn tại mà không coi mọi actor là vĩnh cửu.

## 31.1 — Vì sao hệ thống này tồn tại

World tạo lý do để người chơi đi tiếp và quay lại. Biome đặt lời hứa, time/weather lọc encounter, weighted row tạo độ hiếm, level/count range điều chỉnh sức ép, còn respawn giữ cho chuyến trở lại vẫn có ý nghĩa. Mỗi thay đổi ấy trở thành đầu vào cho capture, combat, work và economy; World tạo hoàn cảnh, không sở hữu hậu quả của tất cả hệ kia.

`FPalWildSpawnerDatabaseRow` cho thấy dữ liệu spawn có weight, level/count range, time và weather condition. `PalDungeonSpawnAreaData` cho thấy dungeon cũng có vùng spawn riêng. Đây là evidence về hình dạng data, không phải bằng chứng rằng runtime Paldark phải copy nguyên scheduler.

## 31.2 — Nó chạm những gì trong catalog

- `F-092` — Biome context.
- `F-093` — Weighted spawner.
- `F-094` — Level range.
- `F-095` — Count range.
- `F-096` — Time condition.
- `F-097` — Weather condition.
- `F-098` — Nocturnal flag.

Catalog mô tả điều kiện của một lần spawn; respawn là mảnh nối để những lần spawn ấy tạo thành thế giới chơi được dù không có mã riêng. Biome và world clock thuộc World. Khi creature entity đã được tạo, nó chuyển sang entity/creature owner; spawner không được giữ quyền sở hữu mãi chỉ vì nó đã khởi đầu sự xuất hiện.

## 31.3 — Trạng thái và chủ sở hữu

| Trạng thái | Chủ | Ai đọc | Đổi bằng yêu cầu gì |
|---|---|---|---|
| World time/day-night | `World` clock owner | spawner, weather, UI, save | server clock tick |
| Weather/temperature | `World` environment owner | spawner, creature, player, UI | `Paldark.World.Request.SetWeather` |
| Biome definition | `World` data registry | spawner, navigation, UI | file definition; không đổi runtime |
| Spawn row/weight/conditions | `World` spawner registry | scheduler, QA, telemetry | data load, không actor tự sửa |
| Population budget | `World` spawner authority | scheduler, relevancy, QA | `Paldark.World.Request.ReconcilePopulation` |
| Spawned entity identity/context | entity owner | combat, capture, companion, save | `Paldark.World.Request.Spawn/Despawn` |
| Respawn checkpoint | `World` | scheduler, save/load, QA | accepted despawn/death result |
| Player-visible actor | actor/relevancy bridge | relevant clients, presentation | resolve entity into actor |

Bảng tách bốn khái niệm thường bị gom thành “spawn”: điều kiện tĩnh, ngân sách population, entity identity và actor representation. Spawner chỉ quyết định khi nào tạo hoặc đề nghị dọn entity theo policy. Health, Capture và entity owner quyết định death, capture hoặc persistent identity. Actor unload chỉ nói representation không còn relevant; nó không chứng minh entity đã chết.

## 31.4 — Hợp đồng dữ liệu

`World.SpawnProfile` vì thế chỉ mô tả nguồn row, biome và điều kiện của scheduler. Actor pointer cùng current population là state runtime, không phải data tĩnh của một profile.

```cpp
USTRUCT()
struct FWorldSpawnProfileFragment : public FPaldarkFragment
{
    GENERATED_BODY()

    UPROPERTY() FName BiomeId;
    UPROPERTY() FName SpawnTableId;
    UPROPERTY() FName TimeProfileId;
    UPROPERTY() FName WeatherProfileId;
    UPROPERTY() int32 PopulationBudget = 0;
};
```

Definition đã điền:

```json
{
  "id": "World.Biome.ResonanceCoast",
  "schema": 1,
  "display": { "nameKey": "World.Biome.ResonanceCoast.Name" },
  "fragments": [
    {
      "type": "World.SpawnProfile",
      "biomeId": "World.Biome.ResonanceCoast",
      "spawnTableId": "World.SpawnTable.CoastDay",
      "timeProfileId": "World.Time.DayNight",
      "weatherProfileId": "World.Weather.Coast",
      "populationBudget": 24
    }
  ]
}
```

`24` là minh họa Paldark, không phải budget Palworld. Chunk `Paldark.World`, schema `1`, giữ world clock/checkpoint và những entity relation cần bền; không lưu mọi actor được dựng từ population scheduler.

## 31.5 — Giao diện lập trình

Khi clock hoặc weather đổi, nhiều vùng spawn có thể phản ứng nhưng chỉ World owner đổi environment state. `UWorldSpawnerComponent` nằm trên vùng spawn, `UWorldEnvironmentComponent` trên world owner. Dungeon có thể cung cấp profile riêng qua contract mà không include World spawner implementation.

```cpp
UFUNCTION()
FWorldSpawnResult RequestSpawn(FName SpawnProfileId);

UFUNCTION()
FWorldSpawnResult RequestDespawn(FPaldarkEntityId EntityId, FName ReasonId);

UFUNCTION()
FWorldSnapshot ReadEnvironment() const;

UFUNCTION()
FWorldPopulationResult RequestReconcilePopulation(FName BiomeId);
```

Thân hàm:

```cpp
FWorldPopulationResult UWorldSpawnerComponent::RequestReconcilePopulation(
    FName BiomeId)
{
    // Read time, weather, biome rows and current population through owners.
    // Apply budget, relevancy and respawn policy on the authority.
    // Publish entity spawn/despawn results without owning creature state.
}
```

Kênh phát:

- `Paldark.World.Event.TimeChanged`
- `Paldark.World.Event.WeatherChanged`
- `Paldark.World.Event.EntitySpawned`
- `Paldark.World.Event.EntityDespawned`
- `Paldark.World.Result.Rejected`

Kênh nghe:

- `Paldark.Core.Event.EntityTransferAccepted`
- `Paldark.Core.Event.HealthChanged`
- `Paldark.Capture.Event.EntityCreated`
- `Paldark.Dungeon.Event.AreaOpened`

World không include Combat, Capture hay Dungeon. Death/capture chỉ thông báo entity state; Dungeon chỉ công bố area context. Entity manager nhận spawn request và tạo identity theo contract Chương 14.

## 31.6 — Quyền hạn và đồng bộ

Mây và mưa có thể chuyển mềm ở client, nhưng encounter không được sinh từ dự đoán presentation. Server quyết định clock, weather, row selection, population budget, respawn timing và entity spawn/despawn. Client chỉ dự đoán mây, mưa hoặc ambient animation; nó không tự tạo creature thật và không sửa world time.

Relevant clients nhận environment snapshot, actor spawn/despawn và state cần nhìn thấy. Static spawn definitions không replicate payload; client đọc cùng registry và nhận id/context. Actor ngoài relevancy có thể unload, nhưng entity và checkpoint chỉ bị xóa bởi owner authority.

Scheduler phải có ngân sách theo biome/world partition, hạn chế số entity tạo-hủy mỗi frame và policy khi budget đầy. Đây là đề xuất Paldark INFERRED; con số budget, tick frequency và respawn runtime của Palworld là UNKNOWN.

## 31.7 — Log, console command, và cách biết là chạy đúng

Muốn hiểu vì sao một vùng trống, log phải phân biệt “không đủ điều kiện spawn” với “entity vẫn còn nhưng actor đã unload”. `LogPaldarkWorld` ghi mỗi decision với biome, row, reason, population before/after, authority và `corr`; các lifecycle reason phải tách `Spawned`, `Respawned`, `DespawnedForBudget`, `UnloadedForRelevancy` và `DestroyedByDeath`.

Command:

- `Paldark.World.QA.Setup`
- `Paldark.World.Status`
- `Paldark.World.QA.Trigger`
- `Paldark.World.QA.SetTime`
- `Paldark.World.QA.SetWeather`

Test đúng chủ động thay đổi hoàn cảnh: cố định time/weather, trigger population reconcile và kiểm row/weight/condition; đẩy population vượt budget để scheduler không tạo vô hạn; despawn một entity rồi chờ policy respawn; cuối cùng unload actor nhưng status vẫn thấy entity. Log phải chứng minh unload không bị nhầm thành death.

## 31.8 — Slice đã triển khai

Những nhánh ấy đã được đưa vào một slice native có seed và lifecycle reason quan sát được. World hiện được triển khai bằng native `World` Game Feature và
`UWorldFeatureSubsystem`, không include Combat, Capture, Dungeon, Creature
hoặc Health. Clock/time, weather, spawn rows, weighted selection, population
budget và lifecycle policy thuộc subsystem; actor chỉ là representation của
stable entity id.

`Data/World.SpawnRows.json` giữ đúng các field `weight`, `lvMin`, `lvMax`,
`numMin`, `numMax`, `onlyTime` và `onlyWeather`. QA dùng `-PaldarkWorldQA`,
seed từ correlation id và `FRandomStream`; log có `seed`, `roll`,
`total_weight`, `row`, `population_before` và `population_after`. Cùng biome
với `Day/Clear` và `Night/Clear` chọn hai row khác nhau. Budget đầy bị từ chối
với `PopulationBudgetFull`, còn điều kiện không khớp bị từ chối với
`NoMatchingRow`.

Lifecycle log phân biệt `Spawned`, `Respawned`, `DespawnedForBudget`,
`UnloadedForRelevancy` và `DestroyedByDeath`. World có owner codec
`Paldark.World` lưu clock, weather, respawn checkpoint và population budget.
Population/entity actor runtime không được lưu; actor sẽ được reconcile lại
từ World scheduler sau load thay vì lưu pointer actor.

World đã tạo ra những chuyến đi có nhịp, nhưng một hành trình mở không luôn cho người chơi cảm giác đã hoàn tất điều gì. Chương 32 thu hẹp không gian thành dungeon: entrance, room, boss và reward, một chuỗi có điểm bắt đầu và kết thúc mà vẫn dùng lại mọi owner đã dựng trước đó.

---

**Bằng chứng cho chương này.** `F-092` tới `F-098`, `FPalWildSpawnerDatabaseRow` với `Weight`, `LvMin/LvMax`, `NumMin/NumMax`, `OnlyTime`, `OnlyWeather`, `Nocturnal` và `PalDungeonSpawnAreaData` là EXTRACTED/REFERENCE. Population budget, scheduler policy, respawn timing và authority runtime là INFERRED/UNKNOWN. Fragment, channels, chunk và owner table là thiết kế Paldark bám Chương 14, 18 và L8.
