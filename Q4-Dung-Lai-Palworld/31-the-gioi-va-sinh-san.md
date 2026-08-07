# Chương 31 — Thế giới và nhịp sống

Một thế giới trống không chỉ là một map lớn. Người chơi quay lại cùng một bờ biển vào ban ngày và ban đêm phải thấy hai lời mời khác nhau; đi qua biome khác phải gặp creature, resource và rủi ro khác; đánh sạch một khu vực không được biến nơi đó thành khoảng đất chết vĩnh viễn. Chu kỳ, thời tiết, spawn và respawn là thứ khiến thế giới có nhịp riêng.

Đây cũng là hệ thống dễ làm vỡ hiệu năng và state nhất. Spawner tạo và hủy entity liên tục, còn population budget phải ngăn một vùng đông dần vô hạn. Nếu spawn chỉ nhìn khoảng cách camera, save và server authority sẽ cho ra các kết quả khác nhau; nếu giữ mọi actor mãi mãi, relevancy và memory sẽ vỡ.

## 31.1 — Vì sao hệ thống này tồn tại

World tạo lý do để người chơi đi tiếp. Biome đặt lời hứa, time/weather lọc encounter, weighted row tạo hiếm có, level/count range điều chỉnh sức ép, còn respawn làm cho chuyến quay lại vẫn có ý nghĩa. Những thứ này phối hợp với capture, combat, work và economy chứ không tự đứng riêng.

`FPalWildSpawnerDatabaseRow` cho thấy dữ liệu spawn có weight, level/count range, time và weather condition. `PalDungeonSpawnAreaData` cho thấy dungeon cũng có vùng spawn riêng. Đây là evidence về hình dạng data, không phải bằng chứng rằng runtime Paldark phải copy nguyên scheduler.

## 31.2 — Nó chạm những gì trong catalog

- `F-092` — Biome context.
- `F-093` — Weighted spawner.
- `F-094` — Level range.
- `F-095` — Count range.
- `F-096` — Time condition.
- `F-097` — Weather condition.
- `F-098` — Nocturnal flag.

Respawn là phần cần thiết để các feature này tạo thành một thế giới chơi được, dù catalog không tách thành một mã riêng. Biome và world clock là state của World; creature entity sau khi spawn thuộc entity/creature owner, không thuộc spawner mãi mãi.

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

Spawner chỉ quyết định khi nào tạo hoặc đề nghị dọn entity theo policy. Health, capture và entity owner quyết định death, capture hoặc persistent identity. Không được dùng việc actor bị unload như bằng chứng entity đã chết.

## 31.4 — Hợp đồng dữ liệu

Mảnh do World định nghĩa là `World.SpawnProfile`. Nó mô tả nguồn row và điều kiện; không chứa actor pointer hay current population.

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

Component là `UWorldSpawnerComponent` trên vùng spawn và `UWorldEnvironmentComponent` trên world owner. Dungeon có thể cung cấp profile riêng qua contract, không include World spawner implementation.

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

Server quyết định clock, weather, row selection, population budget, respawn timing và entity spawn/despawn. Client có thể dự đoán presentation của mây, mưa hoặc ambient animation; không tự tạo creature thật và không tự sửa world time.

Relevant clients nhận environment snapshot, actor spawn/despawn và state cần nhìn thấy. Static spawn definitions không replicate payload; client đọc cùng registry và nhận id/context. Actor ngoài relevancy có thể unload, nhưng entity và checkpoint chỉ bị xóa bởi owner authority.

Scheduler phải có ngân sách theo biome/world partition, hạn chế số entity tạo-hủy mỗi frame và policy khi budget đầy. Đây là đề xuất Paldark INFERRED; con số budget, tick frequency và respawn runtime của Palworld là UNKNOWN.

## 31.7 — Log, console command, và cách biết là chạy đúng

Dùng `LogPaldarkWorld`. Mỗi decision cần có biome, row, reason, population before/after, authority và `corr`. Phân biệt `Spawned`, `Respawned`, `DespawnedForBudget`, `UnloadedForRelevancy` và `DestroyedByDeath`.

Command:

- `Paldark.World.QA.Setup`
- `Paldark.World.Status`
- `Paldark.World.QA.Trigger`
- `Paldark.World.QA.SetTime`
- `Paldark.World.QA.SetWeather`

Test đúng: cố định time/weather, trigger population reconcile, kiểm row/weight/condition; vượt budget để thấy scheduler không tạo vô hạn; despawn một entity rồi đợi policy respawn; unload actor nhưng status entity vẫn tồn tại. Log phải chứng minh actor unload không bị nhầm là death.

## 31.8 — Slice đã triển khai

World hiện được triển khai bằng native `World` Game Feature và
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

---

**Bằng chứng cho chương này.** `F-092` tới `F-098`, `FPalWildSpawnerDatabaseRow` với `Weight`, `LvMin/LvMax`, `NumMin/NumMax`, `OnlyTime`, `OnlyWeather`, `Nocturnal` và `PalDungeonSpawnAreaData` là EXTRACTED/REFERENCE. Population budget, scheduler policy, respawn timing và authority runtime là INFERRED/UNKNOWN. Fragment, channels, chunk và owner table là thiết kế Paldark bám Chương 14, 18 và L8.
