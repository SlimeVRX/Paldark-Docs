---
title: V5.1 — Chiến lược project và baseline UE 5.6.1
description: Quyết định seed toàn bộ KYWorld, nâng engine một chiều và tách gold reference khỏi candidate mà không copy feature qua lại.
---

# V5.1 — Chiến lược project và baseline UE 5.6.1

## 1. Quyết định cần đạt

Ta cần đồng thời giữ bốn điều:

1. mọi code V5 chỉ build và chạy trên UE 5.6.1;
2. KYWorld gốc không bị dùng làm nơi thử nghiệm;
3. toàn bộ asset identity, default và reference graph được giữ khi bắt đầu;
4. sau khi khởi tạo, feature được refactor tại chỗ, không copy qua lại giữa hai project.

## 2. So sánh hai chiến lược

| Tiêu chí | Project UE 5.6.1 rỗng rồi copy feature | Seed toàn bộ KYWorld rồi nâng một chiều |
|---|---:|---:|
| Giữ `/Game/...` object path | Rủi ro cao | Tự nhiên |
| Giữ CDO/default/component hierarchy | Phải tái dựng | Được mang theo |
| Giữ hard/soft/string reference | Dễ bỏ sót | Có baseline đầy đủ |
| Có game chơi được ở đầu chương trình | Không | Có, sau compatibility gate |
| Cô lập engine delta khỏi refactor | Khó vì copy kéo dài | Có thể khóa thành một phase |
| Chi phí disk/upgrade ban đầu | Thấp hơn | Cao hơn một lần |
| Chi phí tổng trong parity program | Cao và lặp lại | Thấp hơn, thay đổi tại chỗ |

**Khuyến nghị:** full-history fork/clone KYWorld vào một repository mới mang vai trò PaldarkV5, pin approved gold commit, nâng đúng một lần lên UE 5.6.1, sau đó refactor tại chỗ.

Đây không phải “code vào KYWorld gốc”. Repo gốc tiếp tục là archive. PaldarkV5 giữ cả history và lấy approved commit làm seed, thay vì nhập từng organ vào một cơ thể rỗng.

## 3. Ba mốc bất biến

```text
KYWorld Archive 5.4
    provenance only; không mở/resave
        |
        | one-way seed + engine compatibility
        v
KYWorld Gold 5.6.1
    behavior/reference tag + immutable build
        |
        | candidate branch từ đúng tag
        v
PaldarkV5 Candidate 5.6.1
    refactor tại chỗ, không copy feature qua lại
```

- **Archive 5.4** giữ exact Git object và chứng minh nguồn gốc. Nó không phải active build target V5.
- **Gold 5.6.1** là kết quả chỉ có engine/toolchain compatibility change, chưa thay gameplay authority. Mọi A/B reference trong chương trình dùng build này.
- **Candidate 5.6.1** bắt đầu từ đúng gold tag và nhận Core/refactor mới.

Như vậy chương trình không hề chuyển code lên/xuống giữa 5.4 và 5.6. Cả reference chạy và candidate đều ở UE 5.6.1.

## 4. Toolchain pin

Máy hiện có Launcher build:

```yaml
engine: 5.6.1
branch: ++UE5+Release-5.6
changelist: 44394996
compatible_changelist: 43139311
platform: Win64
compiler: Visual Studio 2022
```

`EngineAssociation: 5.6` không đủ làm pin vì hai máy có thể có patch/changelist khác nhau. `baseline.yaml` phải lưu cả `Build.version`, compiler/toolset, enabled plugin, config hash và target name.

## 5. Trình tự one-way seed

### B0 — Freeze provenance

- pin exact KYWorld commit và quyết định gold branch;
- hash 10.173 tracked path;
- lưu `.uproject`, Config, plugin list, map roots và asset census;
- không mở archive duy nhất bằng editor mới vì resave asset là thay đổi một chiều.

### B1 — Tạo repository PaldarkV5 bằng full-history fork/clone

- clone/fork toàn bộ KYWorld Git history vào remote game V5 mới; historyless file snapshot không đạt P1;
- giữ toàn bộ tracked source/content/config; `DerivedDataCache`, `Intermediate`, `Saved` và build artifact tiếp tục bị loại theo ignore policy, không phải selective-copy gameplay asset;
- lưu provenance manifest trỏ về exact approved KYWorld commit và original remote;
- tag seed trước engine edit;
- nếu hạ tầng buộc phải bỏ history, đó là một ADR mới với migration/audit cost rõ ràng, không được gọi là cùng chiến lược đã duyệt.

### B2 — Upgrade UE 5.6.1-only

- đổi engine association và build settings trong commit engine-only;
- kiểm plugin compatibility, GAS, Enhanced Input, AI, Chaos/Field System, UMG và asset version;
- compile native module trước khi resave rộng;
- mọi compatibility fix là commit riêng, cấm refactor gameplay trong phase này;
- resave có manifest package trước/sau, không “Save All” không kiểm soát.

### B3 — Qualification của gold 5.6.1

- Editor boot, compile all Blueprint, Data Validation và Map Check;
- xác nhận flow thực `StartLevel → CustomizationLevel → WorldMap`;
- chạy behavior smoke cho movement, inventory, combat, Pal/capture, production và world;
- ghi toàn bộ engine-caused deviation và quyết định `FIX_TO_5.4_BEHAVIOR` hoặc `ACCEPT_5.6_BEHAVIOR`;
- chỉ khi human sign-off xong mới tag `KYWorld-Gold-UE5.6.1`.

### B4 — Tách candidate

- tạo candidate branch/worktree từ gold tag;
- gold branch/tag bị protected và read-only;
- có thể giữ packaged gold build để A/B mà không mở hai Editor cùng lúc;
- từ đây mọi task chỉ sửa candidate; không chép ngược vào gold.

## 6. Project identity và asset path

Repository có thể tên `PaldarkV5` ngay từ ngày đầu. Nhưng `.uproject`, runtime module `Palworld_Base` và serialized `/Script/Palworld_Base` là **reference identity**, không chỉ là nhãn giao diện.

Khuyến nghị trong parity phase:

- giữ `/Game/...` path;
- giữ legacy module/project identity đủ để asset cũ load nguyên trạng;
- thêm module/plugin Paldark mới bên cạnh;
- coi `Palworld_Base` là compatibility island phải giảm dần về zero authoritative logic;
- rename project/module cuối cùng là một migration unit riêng với redirect/reference/cook gate, không trộn vào Core skeleton hoặc feature conversion.

Nếu owner muốn rename ngay từ đầu, quyết định đó phải được rehearsal trên một disposable copy và chứng minh zero missing parent/reference trước khi chạm gold.

## 7. Branch và commit policy

```text
tag/kyworld-seed-<approved-gold-commit>
branch/reference-ue561  -> tag/KYWorld-Gold-UE5.6.1 (immutable)
branch/main             -> integration candidate, luôn playable
branch/task/<unit-id>   -> có thể tạm broken trong write-set
```

Không merge task branch nếu:

- compile/package reference bị mất;
- old và new path cùng mutate;
- asset path/default/reference thay ngoài allowlist;
- human gate bắt buộc chưa pass;
- evidence không trỏ đúng candidate SHA.

## 8. Vì sao không cần “giữ code không bao giờ hỏng”

Một task branch có thể hỏng trong lúc converter hoặc người triển khai thử nghiệm. Điều không được phép là làm **integration state** mất khả năng quan sát trong thời gian dài.

Target được bảo vệ bởi ba ranh giới:

1. gold reference không đổi;
2. task chỉ thay một authoritative path có rollback;
3. main chỉ nhận packet đã pass acceptance.

Nhờ vậy implementation có thể thay đổi mạnh bên trong, nhưng failure không lan sang task sau và không làm mất oracle cuối chương trình.

## 9. Exit gate của quyết định baseline

ADR này chỉ được `ACCEPTED` khi owner duyệt:

- full-history fork/clone + one-way upgrade;
- exact UE 5.6.1 build pin;
- gold/candidate tách từ cùng upgraded snapshot;
- policy giữ asset/project identity trong parity phase;
- target platform đầu tiên và plugin list bắt buộc.

Chưa có exit gate này thì không được tạo PaldarkV5 skeleton hay chạy converter vào source production.
