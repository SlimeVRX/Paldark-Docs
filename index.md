---
title: Paldark V5
description: Cổng quyết định cho việc tái cấu trúc toàn bộ gameplay KYWorld trên Unreal Engine 5.6.1 mà không đánh mất polish.
---

# Paldark V5

## Tái cấu trúc KYWorld trên một target UE 5.6.1

> **Trạng thái chương trình:** `PRE-CODE — DESIGN REVIEW`
>
> **Target đã chốt:** Unreal Engine **5.6.1 only**. Local build đang quan sát để đề xuất P1 pin: `++UE5+Release-5.6`, changelist `44394996`
>
> **Reference:** KYWorld được giữ bất biến; PaldarkV5 là full-history fork/clone tại approved gold commit, nâng một chiều rồi refactor trên candidate riêng

Paldark V5 không bắt đầu bằng việc chạy công cụ chuyển Blueprint. Nó bắt đầu bằng việc khóa hai thứ khó sửa nhất khi project đã phình lớn: **Core sẽ cho phép những quan hệ nào tồn tại** và **gameplay phải đi qua những mốc quan sát nào để kết quả cuối vẫn là KYWorld đã được polish**.

Implementation chưa được phép bắt đầu. Bộ tài liệu V5 hiện là proposal để người sở hữu dự án duyệt Core, dependency order, human gate và Completion Contract trước khi tạo gameplay code.

## Đọc V5 theo thứ tự

1. [Hiến chương và sổ quyết định](/V5/) — mục tiêu, non-goal, trạng thái từng quyết định.
2. [Chiến lược project và baseline UE 5.6.1](/V5/01-project-baseline-ue561) — vì sao seed toàn bộ KYWorld tốt hơn project rỗng.
3. [Core Technical Design](/V5/02-core-technical-design) — primitive, module, capability, owner, lifecycle và dependency rules.
4. [Gameplay dependency roadmap](/V5/03-gameplay-roadmap) — feature decomposition, prerequisite DAG và W0–W12 mới.
5. [Feature Dossier và Human Gate](/V5/04-feature-dossier-human-gate) — đầu ra bắt buộc trước khi một task được code.
6. [Conversion và công cụ Blueprint→C++](/V5/05-blueprint-conversion) — vai trò, giới hạn và qualification gate của tool.
7. [Completion Contract](/V5/06-completion-contract) — cách chứng minh toàn bộ corpus đã được xử lý.
8. [Quyết định cần người duyệt](/V5/07-open-decisions) — danh sách ngắn những điểm chưa được phép tự suy đoán.
9. [Catalog máy đọc được](/V5/Catalogs/) — decision, capability, ownership, unknown và toolchain lock.

## V4 được giữ nguyên để truy vết

Paldark V4, PaldarkKit và chuyên khảo UE 5.4 vẫn có giá trị như dữ liệu thực nghiệm: chúng cho biết kiến trúc nào đã giúp ích, rework tập trung ở đâu và human gate nào đã thất bại. Chúng không còn quyền ghi đè V5.

- [Cổng lưu trữ Paldark V4](/V4/)
- [Chuyên khảo KYWorld C++ parity theo phương án UE 5.4](/V4/kyworld-cpp-parity-ue54)
- [Sáu quyển Paldark V4](/00-MucLuc)

## Nguyên tắc điều hành

```text
Reference trước implementation
Target trước task
Owner trước dependency
Human gate trước code
Một authoritative path tại một thời điểm
Evidence trước chữ “done”
```

Một task có thể tự do chọn cách cài đặt trong write-set đã duyệt. Nó không được tự thay đổi target, owner, public contract, asset path hoặc acceptance oracle. Nhờ vậy converter có thể viết lại code nhanh, trong khi chương trình vẫn hội tụ về cùng gameplay và cùng kiến trúc.
