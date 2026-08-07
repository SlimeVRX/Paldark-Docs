# Chương 29 — Làm việc và tự động hóa

Người chơi giao một Pal cho station, đặt input vào kho rồi rời căn cứ đi khám phá. Khi quay về, output đã nằm đó. Căn cứ không còn là tập hợp công trình đứng yên; nó đã có nhịp sống riêng, và roster không còn chỉ là bộ sưu tập mà trở thành nhân lực. Cảm giác “việc vẫn chạy khi mình đi vắng” là phần thưởng lớn nhất của automation.

Đằng sau cảm giác nhẹ nhàng ấy là hệ state dày nhất từ đầu quyển: worker có assignment, suitability, queue, progress, hunger, sanity, output và relation với station. Chỉ cần người chơi rời relevancy, game đã phải trả lời ai tiếp tục mô phỏng, tick thật hay tính bù, và cần lưu những gì để kết quả không phụ thuộc vào việc actor representation còn tồn tại hay không.

## 29.1 — Vì sao hệ thống này tồn tại

Work nối ba vòng lặp trước thành một dây chuyền: bắt Pal cung cấp worker, xây dựng cung cấp station, còn Inventory nhận input/output. `EPalWorkSuitability` có 13 loại việc; hình dạng ấy cho thấy một Pal không thể chỉ có cờ “làm việc được”. Năng lực phải được đọc theo loại station. `Work.Capable` đã được định nghĩa ở Chương 14 và 16, nên chương này dùng lại thay vì tạo một fragment gần giống rồi buộc registry hiểu hai ngôn ngữ.

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

Catalog trải từ năng lực tới nhu cầu và lỗi kẹt, cho thấy “worker đang làm” chỉ là trạng thái ở giữa một vòng dài. `EPalWorkSuitability` có 13 loại là `EXTRACTED`; tên và số 13 mô tả hình dạng tham khảo, không phải lời hứa vertical slice phải có đủ. `WorkOutput` 300 giây → 60 giây là tuning `REFERENCE`, không được hard-code vào scheduler.

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

Theo bảng, Work sở hữu chính phần “điều phối”: assignment, queue, progress và offline checkpoint. Nó không sở hữu cơ thể worker hay kho chứa kết quả. Hunger, Sanity thuộc need owner; quantity thuộc Inventory. Nếu tiến độ cần phản ứng với một need, Work đọc modifier hoặc gửi request qua contract, còn output vẫn phải đi qua Inventory transaction.

## 29.4 — Hợp đồng dữ liệu

Data contract phải phản ánh đúng việc Pal và station gặp nhau qua capability. Vì thế chương này **dùng lại** `Work.Capable` và `Work.Station` từ Chương 14/16, không định nghĩa lại hình dạng fragment. Definition worker chỉ gắn mảnh đã đăng ký:

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

Ở runtime, station cần giữ queue còn actor Pal chỉ trình bày hoạt động khi available. `UWorkStationComponent` nằm trên station, `UWorkRuntimeComponent` trên Pal actor representation. Scheduler luôn làm việc với stable id vì worker entity có thể tồn tại khi actor chưa được dựng.

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

Đây là lúc tình huống mở đầu quay lại thành một quyết định kỹ thuật. Câu “offline chạy như bình thường” không đủ, vì “bình thường” có thể là server vẫn tick hoặc không có process nào chạy cả. Có ba lựa chọn:

1. **Server mô phỏng liên tục.** Dedicated server giữ assignment và scheduler cho cả station không relevant. Kết quả gần real-time, nhưng tốn tick và yêu cầu server luôn sống.
2. **Tính bù khi quay lại.** Lưu `LastSimulationTime`, assignment, queue, progress, input/output relation và các modifier ảnh hưởng tốc độ. Khi station được load hoặc player quay lại, Work tính delta thời gian qua policy đã chọn.
3. **Hybrid.** Server tick các station active trong một budget; station inactive lưu checkpoint và tính bù khi được truy cập.

Paldark nên bắt đầu bằng hybrid, nhưng đây là **INFERRED** và cần benchmark. Nếu chọn tính bù, state tối thiểu phải lưu: stable worker id, station id, task/recipe id, progress, queue order, last simulation timestamp, input reservation, output pending, suitability/work rate modifier và need state nào thực sự ảnh hưởng sản xuất. Actor pointer cùng animation state không thuộc phép tính. Nếu server không tồn tại trong thời gian offline, client cũng không được tự tính bù rồi gửi thành quả; server/load authority phải là bên tính.

## 29.6 — Quyền hạn và đồng bộ

Kéo-thả một Pal vào station cần phản hồi ngay trên UI, nhưng slot conflict và output không thể do client kết luận. Server/authority của Work quyết định assignment, queue, progress, output request và offline reconcile. Client được xem suitability, kéo ghost và hiển thị progress dự đoán; nó không tự assign hoặc tạo output.

Assignment, queue summary, progress, output result và worker activity relevant replicate. Definition `Work.Capable`/`Work.Station` là static. Path, animation, task marker và actor representation chỉ là presentation; worker entity không relevant vẫn được scheduler xử lý theo policy.

Need owner quyết định Hunger/Sanity. Nếu hunger làm giảm output, Work đọc snapshot/modifier hoặc nghe event; nó không ghi hunger. Nếu worker chết, Health/need owner phát result; Work xử lý assignment fail/requeue theo contract.

## 29.7 — Log, console command, và cách biết là chạy đúng

Khi người chơi quay về mà không thấy output, log phải chỉ được dây chuyền đứt ở đâu. `LogPaldarkWork` ghi mỗi assignment, queue transition, progress checkpoint, offline reconcile, output request và failure với `corr`, worker stable id, station id, task, before/after cùng policy. Đặc biệt phải phân biệt `simulation=LiveTick`, `OfflineCatchUp` và `Hybrid`.

Command:

- `Paldark.Work.QA.Setup`
- `Paldark.Work.Status`
- `Paldark.Work.QA.Assign`
- `Paldark.Work.QA.Trigger`
- `Paldark.Pal.CurrentActivity` — command thật để đối chiếu activity.

Test phải có hai nhịp giống trải nghiệm thật: assign worker và tick khi player còn gần; sau đó lưu checkpoint, rời relevancy hoặc dừng process theo môi trường test, quay lại rồi `RequestReconcile`. Pass nghĩa là output khớp policy, không bị nhân đôi, chỉ Inventory ghi quantity, log nói rõ live/offline path và `Paldark.Work.Event.Finished` nối được tới transaction cùng correlation.

---

**Bằng chứng cho chương này.** `F-064` tới `F-077`, `EPalWorkSuitability` có 13 loại và `WorkOutput` tuning 300→60 là EXTRACTED/REFERENCE từ catalog và whitepaper. `Work.Capable`, `Work.Station`, `Paldark.Work.Event.AssignmentChanged`, `Paldark.Work.Event.Finished`, `Paldark.Work.Result.Fail`, `Paldark.Build.Event.StructureReady`, `Paldark.Pal.Event.InstanceAvailable` là contract đã xuất hiện ở Chương 14/16 và được dùng lại, không định nghĩa lại. Offline policy, scheduler owner, checkpoint fields và hybrid proposal là INFERRED; runtime Palworld mô phỏng tick hay catch-up là UNKNOWN.

### 29.8 — Slice đã triển khai và giới hạn bằng chứng

Slice native thu hẹp bài toán nhưng vẫn giữ đúng ranh giới. Nó dùng `Work.Capable`, `Work.Station` và ba kênh Work
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

Automation khiến người chơi quay về với nhiều output hơn, nhưng nếu mọi station và recipe đều mở ngay từ đầu thì thành quả ấy không tạo ra hướng đi. Chương 30 bổ sung nhịp dài hơn: một owner duy nhất cho level, point và technology unlock, để mỗi vòng sản xuất mở ra lựa chọn mới thay vì chỉ làm con số lớn lên.
