---
title: V5.1 — Project baseline UE 5.8.1
description: Baseline hiện hành cho PaldarkV5 trên Unreal Engine 5.8.1 và ranh giới bất biến giữa KYWorld reference, candidate, staging và gold chưa được duyệt.
---

# V5.1 — Project baseline UE 5.8.1

> **Canonical engine target:** Unreal Engine **5.8.1 only**.
>
> **Gold status:** `NOT FROZEN / NOT TAGGED`.
>
> Tài liệu UE5.6.1 cũ là historical audit, không phải current build/parity evidence.

## 1. Baseline quan sát được

```yaml
project: PaldarkV5/Palworld_Base.uproject
engine:
  version: 5.8.1
  branch: ++UE5+Release-5.8
  changelist: 56057345
  install: D:/UE_5.8
candidate_repository: Soliz-Devin-Palworld
reference_tree: 02.Palworld/Source
reference_commit: a6eab166
candidate_import_commit: b77268d9
converter_integration_commit: d9ce0ce9
gold_tag: null
```

`reference_commit` và các candidate commit trên là provenance anchors đã quan sát, không tự động là owner-approved gold. Mọi receipt/test phải pin full SHA khi tạo certificate.

## 2. Bốn vùng không được nhập làm một

| Vùng | Vai trò | Write policy |
|---|---|---|
| `02.Palworld/Source` | KYWorld source/history reference | Read-only trong migration |
| `PaldarkV5/Content` | Candidate serialized assets | Chỉ task packet được duyệt; không dùng converter để overwrite |
| `PaldarkV5/Source` | Candidate native gameplay | Chỉ sau target design + allowlisted write-set |
| `PaldarkV5/Saved/BPScaffold` | Disposable/immutable-per-run evidence staging | Tool được ghi; không package làm gameplay source |

Original KYWorld không bị dùng làm nơi thử nghiệm. PaldarkV5 là candidate đã nâng một chiều lên 5.8.1. Từ đây không có nhánh hỗ trợ runtime 5.4/5.6 và không backport engine.

## 3. Provenance gap cần nói thật

PaldarkV5 xuất hiện trong monorepo như một imported tree tại `b77268d9`; lịch sử KYWorld đầy đủ vẫn nằm ở `02.Palworld/Source`. Vì vậy hiện trạng không đạt đề xuất cũ “candidate repository là full-history fork/clone” theo nghĩa Git ancestry trực tiếp.

Không cần copy project lần nữa chỉ để sửa hình thức. Cần đóng gap bằng machine-readable provenance:

- exact reference full SHA và remote;
- manifest path/hash của seed;
- mapping package/path trước–sau upgrade;
- engine-only compatibility/resave ledger;
- explicit owner decision chấp nhận imported-tree topology hoặc kế hoạch graft history riêng.

Cho tới khi đóng, `gold_tag: null` và P0/P1 chưa pass.

## 4. Engine-only rule

Mọi active build, MCP session, plugin qualification, graph export và candidate compile dùng cùng exact UE5.8.1 CL. Không dùng kết quả UE5.6 để bù ô trống UE5.8.

Engine delta và gameplay delta phải tách evidence:

```text
KYWorld reference provenance
→ UE5.8.1 compatibility candidate
→ gold characterization/sign-off
→ immutable gold tag/build
→ gameplay refactor candidate từ cùng baseline
```

Hiện project/editor/tool pilot hoạt động trên 5.8.1 nhưng chưa có owner-approved immutable gold. Vì vậy không được gọi current candidate là parity oracle chỉ vì compile hoặc Editor boot.

## 5. Identity policy trong parity phase

- giữ `/Game/...` object paths;
- giữ `Palworld_Base` serialized module/project identity nếu đổi tên làm mất reference;
- thêm native seams có chủ ý, không bulk rename/move asset;
- rebrand/module rename là migration unit riêng sau reference closure;
- mọi resave rộng cần before/after package manifest.

Repository folder có thể tên PaldarkV5 mà serialized identity vẫn giữ compatibility. Đây là lựa chọn kỹ thuật, không phải thiếu refactor.

## 6. Gold freeze gate

Gold chỉ được tag khi:

1. owner chọn exact KYWorld scope/commit và xử lý branch delta;
2. UE5.8.1 toolchain/plugin/config lock được duyệt;
3. Editor build, Blueprint compile, Data Validation, Map Check, cook/package/cold launch pass theo target scope;
4. Start → Customization → Main và canonical gameplay path được rehearsal;
5. engine-caused deviation có terminal decision;
6. maps/runtime roots/corpus denominator được pin;
7. packaged gold build và rollback/reset recipe tái tạo được;
8. tag/branch protection làm reference bất biến.

Trước gate này, extraction pilot được dùng để qualify method, không được dùng làm evidence rằng gameplay reference đã đóng.

## 7. Candidate safety

- converter ghi staging, không ghi `Content/` hoặc production `Source/`;
- native candidate bắt đầu dormant;
- old Blueprint vẫn là authority cho tới explicit one-capability switch;
- không cho old/new path cùng commit mutation;
- switch phải revert được và có rollback rehearsal;
- legacy executable graph chỉ retire sau automated + human parity evidence.

Quy trình tool và state machine: [MCP + Blueprint conversion pipeline](/V5/08-mcp-conversion-pipeline).

## 8. Supersession policy

[Baseline UE5.6.1 cũ](/V5/01-project-baseline-ue561) được giữ để truy vết quyết định tại thời điểm trước khi owner chuyển target. Mọi engine/version/build/test claim trên trang đó mang nhãn `STALE HISTORICAL EVIDENCE` và không được tham chiếu như current proof.
