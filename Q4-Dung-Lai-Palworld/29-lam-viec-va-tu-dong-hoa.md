# Chương 29 — Làm việc và tự động hóa

Đây là hệ thống làm cho một căn cứ có đời sống riêng. Người chơi không chỉ đặt máy rồi đứng nhìn; họ bắt Pal phù hợp, giao Pal vào station, cung cấp input, rồi quay lại thấy output đã tích lũy. Cảm giác đặc biệt nằm ở việc roster biến thành nhân lực và căn cứ tiếp tục có ích khi người chơi đi nơi khác.

Đồng thời đây là hệ thống khó nhất về state. Worker có assignment, suitability, queue, progress, hunger, sanity, output và relation với station. Khi người chơi vắng mặt, game phải trả lời: ai mô phỏng, mô phỏng từng tick hay tính bù, và dữ liệu nào đủ để kết quả không phụ thuộc vào việc actor có đang tồn tại hay không.

## 29.1 — Vì sao hệ thống này tồn tại

Work nối ba vòng lặp: bắt Pal, xây station và sản xuất item. `EPalWorkSuitability` có 13 loại việc; đó là hình dạng cho thấy một Pal không chỉ có một cờ “worker được hay không”, mà có nhiều năng lực cần đọc theo station. `Work.Capable` đã được định nghĩa ở Chương 14 và Chương 16; chương này dùng lại, không định nghĩa fragment khác thay thế.

Tự động hóa không có nghĩa là bỏ hết quyết định cho AI. Người chơi vẫn chọn worker, station, priority và hậu cần. Máy chỉ thực hiện contract đã được chốt. Nếu worker kẹt, thiếu input hoặc chết đói, log phải cho biết dây chuyền đứt ở đâu.

## 29.2 — Nó chạm những gì trong catalog

- `F-064` — Work suitability.
- `F-065` — Work level.
- `F-066` — Station slot.
- `F-067` — Worker assignment.
- `F-068` — Hàng đợi việc.
- `F-069` — Chọn theo năng lực.
- `F-070` — Ngăn tranh chấp slot.
- `F-071` — Hunger decay.
- `F-072` — Sanity decay.
- `F-073` — Ăn trong base.
- `F-074` — Nghỉ ngơi.
- `F-075` — Năng suất theo nhu cầu.
- `F-076` — Sick state.
- `F-077` — Worker bị kẹt.

`EPalWorkSuitability` có 13 loại là EXTRACTED; tên và số 13 là hình dạng dữ liệu tham khảo, không phải lời hứa Paldark phải có đúng mọi loại ngay ở vertical slice. `WorkOutput` 300 giây → 60 giây là ví dụ tuning REFERENCE, không được hard-code vào scheduler.

## 29.3 — Trạng thái và chủ sở hữu

| Trạng thái | Chủ | Ai đọc | Đổi bằng yêu cầu gì |
|---|---|---|---|
| Worker capability `Work.Capable` | definition registry của Work | assignment, scheduler, UI | thêm definition fragment; runtime chỉ đọc |
| Station slot và requirement | `Work` station owner | assignment UI, scheduler, build observer | `Paldark.Work.Request.Assign` |
| Assignment worker–station | `Work` | Pal actor bridge, UI, save, scheduler | `Paldark.Work.Request.Assign/Unassign` |
| Task queue và progress | `Work` | UI, save, output handler | `Paldark.Work.Request.Enqueue` |
| Hunger/sanity của worker | health/need owner tương ứng | Work scheduler, UI, log | need request qua core contract |
| Output transaction | Inventory owner | Work, UI, save | `Paldark.Inventory.Request.Add` |
| Offline checkpoint và last simulation time | `Work` persistence owner | scheduler, save/load, QA | `Paldark.Work.Request.Reconcile` |

Work không ghi Hunger, Sanity hay Inventory quantity. Nó quyết định assignment, queue, progress và offline checkpoint. Nếu Work cần thay đổi need, nó gửi request tới owner tương ứng; output cũng phải đi qua Inventory transaction.

## 29.4 — Hợp đồng dữ liệu

Chương này **dùng lại** `Work.Capable` và `Work.Station` từ Chương 14/16, không định nghĩa lại hình dạng fragment. Definition worker chỉ gắn mảnh đã đăng ký:

```json
{
  "id": "Creature.Worker.CuteFox",
  "schema": 1,
  "display": { "nameKey": "Creature.Worker.CuteFox.Name" },
  "fragments": [
    {
      "type": "Work.Capable",
      "levels": {
        "Work.Mining": 2,
        "Work.Transport": 1
      }
    }
  ]
}
```

File station cũng dùng `Work.Station` đã khai báo:

```json
{
  "id": "Work.Station.ResonanceMine",
  "schema": 1,
  "display": { "nameKey": "Work.Station.ResonanceMine.Name" },
  "fragments": [
    {
      "type": "Work.Station",
      "workKind": "Work.Mining",
      "slotCount": 1,
      "outputDefinitionId": "Inventory.Item.ResonanceOre",
      "inputDefinitionId": "Inventory.Item.Fuel",
      "progressProfileId": "Work.Progress.Standard"
    }
  ]
}
```

`slotCount`, output và progress profile là Paldark data minh họa. Mảnh `Work.Capable` vẫn có hình dạng `Levels` theo Chương 14; không tạo `WorkerSuitabilityFragment` mới. Khối lưu là `Paldark.Work`, schema `1`, giữ assignment, queue, progress bền, output relation và offline checkpoint.

## 29.5 — Giao diện lập trình

Component là `UWorkStationComponent` trên station và `UWorkRuntimeComponent` trên Pal actor representation. Worker entity có thể chưa có actor; scheduler phải làm việc với stable id.

```cpp
UFUNCTION()
FWorkResult RequestAssign(
    FPaldarkEntityId WorkerId, FPaldarkEntityId StationId);

UFUNCTION()
FWorkResult RequestEnqueue(
    FPaldarkEntityId StationId, FName TaskDefinitionId);

UFUNCTION()
FWorkSnapshot ReadStation(FPaldarkEntityId StationId) const;

UFUNCTION()
FWorkResult RequestReconcile(
    FPaldarkEntityId StationId, FDateTime LastSimulationTime);
```

Thân hàm:

```cpp
FWorkResult UWorkStationComponent::RequestReconcile(
    FPaldarkEntityId StationId,
    FDateTime LastSimulationTime)
{
    // Load the persisted Work checkpoint and current world clock.
    // Select the configured offline simulation policy.
    // Apply accepted progress/output transactions and publish the result.
}
```

Kênh phát, dùng đúng các kênh đã khai báo ở Chương 16:

- `Paldark.Work.Event.AssignmentChanged`
- `Paldark.Work.Event.Finished`
- `Paldark.Work.Result.Fail`

Kênh nghe:

- `Paldark.Build.Event.StructureReady`
- `Paldark.Pal.Event.InstanceAvailable`
- `Paldark.Inventory.Event.TransferAccepted`
- core need/clock interface của Paldark.

Không có include từ Work sang Build, Pal hay Inventory. `StructureReady` cho Work biết station đã tồn tại; `InstanceAvailable` cho biết entity/actor bridge có thể quan sát; Inventory quyết định transaction. Các kênh `Paldark.Work.Event.*` là contract đã có, không đổi tên ở chương này.

### Worker vắng mặt: ba chính sách phải chốt

Tài liệu không được viết “offline chạy như bình thường” rồi bỏ qua chi tiết. Có ba lựa chọn:

1. **Server mô phỏng liên tục.** Dedicated server giữ assignment và scheduler cho cả station không relevant. Kết quả gần real-time, nhưng tốn tick và yêu cầu server luôn sống.
2. **Tính bù khi quay lại.** Lưu `LastSimulationTime`, assignment, queue, progress, input/output relation và các modifier ảnh hưởng tốc độ. Khi station được load hoặc player quay lại, Work tính delta thời gian qua policy đã chọn.
3. **Hybrid.** Server tick các station active trong một budget; station inactive lưu checkpoint và tính bù khi được truy cập.

Paldark nên bắt đầu bằng hybrid, nhưng đây là **INFERRED**, cần benchmark. Nếu chọn tính bù, state tối thiểu phải lưu: stable worker id, station id, task/recipe id, progress, queue order, last simulation timestamp, input reservation, output pending, suitability/work rate modifier và need state nào thực sự ảnh hưởng sản xuất. Không lưu actor pointer hay animation state. Nếu server không tồn tại trong thời gian offline, client không được tự tính bù rồi gửi kết quả; server/load authority phải tính.

## 29.6 — Quyền hạn và đồng bộ

Server/authority của Work quyết định assignment, slot conflict, queue, progress, output request và offline reconcile. Client được kéo-thả worker, xem suitability và hiển thị progress dự đoán; không được tự assign hoặc tạo output.

Assignment, queue summary, progress, output result và worker activity relevant replicate. Definition `Work.Capable`/`Work.Station` là static. Path, animation, task marker và actor representation chỉ là presentation; worker entity không relevant vẫn được scheduler xử lý theo policy.

Need owner quyết định Hunger/Sanity. Nếu hunger làm giảm output, Work đọc snapshot/modifier hoặc nghe event; nó không ghi hunger. Nếu worker chết, Health/need owner phát result; Work xử lý assignment fail/requeue theo contract.

## 29.7 — Log, console command, và cách biết là chạy đúng

Dùng `LogPaldarkWork`. Mỗi assignment, queue transition, progress checkpoint, offline reconcile, output request và failure phải có `corr`, worker stable id, station id, task, before/after và policy. Đặc biệt log phải ghi `simulation=LiveTick`, `OfflineCatchUp` hoặc `Hybrid`.

Command:

- `Paldark.Work.QA.Setup`
- `Paldark.Work.Status`
- `Paldark.Work.QA.Assign`
- `Paldark.Work.QA.Trigger`
- `Paldark.Pal.CurrentActivity` — command thật để đối chiếu activity.

Test phải có hai phiên: assign worker rồi tick khi player gần; lưu checkpoint, rời relevancy hoặc dừng process theo môi trường test, quay lại và `RequestReconcile`; so sánh output với policy. Đúng là không có duplicate output, không có hai owner ghi quantity, log cho biết live/offline path, và `Paldark.Work.Event.Finished` nối với Inventory transaction cùng correlation.

---

**Bằng chứng cho chương này.** `F-064` tới `F-077`, `EPalWorkSuitability` có 13 loại và `WorkOutput` tuning 300→60 là EXTRACTED/REFERENCE từ catalog và whitepaper. `Work.Capable`, `Work.Station`, `Paldark.Work.Event.AssignmentChanged`, `Paldark.Work.Event.Finished`, `Paldark.Work.Result.Fail`, `Paldark.Build.Event.StructureReady`, `Paldark.Pal.Event.InstanceAvailable` là contract đã xuất hiện ở Chương 14/16 và được dùng lại, không định nghĩa lại. Offline policy, scheduler owner, checkpoint fields và hybrid proposal là INFERRED; runtime Palworld mô phỏng tick hay catch-up là UNKNOWN.

### 29.8 — Slice đã triển khai và giới hạn bằng chứng

Slice native Work dùng đúng `Work.Capable`, `Work.Station` và ba kênh Work
đã có; không tạo fragment hoặc channel thay thế. `Paldark.Build.Event.StructureReady`
được nghe qua Core message bus để nhận stable station id. Worker chỉ được lưu
bằng `FPaldarkEntityId`; QA cố ý ghi `actor_available=false` để chứng minh
scheduler không cần actor representation.

Chính sách được chọn là **hybrid (INFERRED)**: live progress dùng
`simulation=LiveTick`, checkpoint/reconcile dùng `simulation=OfflineCatchUp`,
và tổng kết dùng `simulation=Hybrid`. QA hiện tua `LastSimulationTime` lùi
10 giây để mô phỏng offline catch-up trong cùng process; chưa phải unload hoặc
relevancy test thật. Hai output được tạo từ hai input transaction, một trong
live tick và một trong catch-up; sau đó lần thứ ba bị từ chối `MissingInput`.
Vì progress được trừ khỏi checkpoint trước khi reconcile, log tổng kết ghi
`duplicate=false` và output cuối khớp elapsed simulation, không nhân đôi.

`300 → 60` giây chỉ là tuning reference trong tài liệu; scheduler không hard-code
giá trị đó. Slice này không sở hữu Hunger, Sanity, sickness, rest, stuck/AI,
animation hay UI. Các hệ thống need chưa tồn tại ở thời điểm này nên được hoãn
có chủ ý; Work chỉ có thể đọc modifier sau này, không ghi need state.
