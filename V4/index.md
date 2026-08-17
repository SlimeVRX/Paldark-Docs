---
title: Paldark V4 — lưu trữ
description: Cổng đọc tài liệu và quyết định lịch sử trước Paldark V5.
---

# Paldark V4 — hồ sơ lưu trữ

> **Trạng thái:** `ARCHIVED — EVIDENCE ONLY`

V4 là tên chung cho PaldarkLab, PaldarkV2, PaldarkV3, PaldarkKit và bộ sách đã dẫn tới chuyên khảo KYWorld UE 5.4. Những tài liệu này tiếp tục được giữ nguyên URL để truy vết bằng chứng và bài học, nhưng không còn là nguồn thiết kế canonical cho implementation mới.

## Những gì V5 tiếp tục học từ V4

- stable identity, state ownership và authority-shaped request;
- transaction, reservation, idempotency và versioned payload;
- feature manifest, evidence ladder và task packet;
- fresh review và human gate cho behavior/polish;
- những failure thực tế do owner mơ hồ, duplicate path, context dài và kiểm thử hình thức.

## Những gì không được tự động mang sang V5

- target UE 5.4 hoặc quy trình chuyển qua lại 5.4↔5.6;
- project rỗng rồi copy từng feature;
- một plugin cho mỗi class hoặc nhiều plugin luôn active nhưng không có lifecycle thật;
- god component, core phụ thuộc UI, event bus thay cho transaction;
- status `done` chỉ dựa vào source/compile;
- scope gameplay không có denominator đóng.

## Đường đọc

1. [Chuyên khảo KYWorld UE 5.4](./kyworld-cpp-parity-ue54.md)
2. [Mục lục sáu quyển V4](/00-MucLuc)
3. [Retrospective và snapshot tiến độ](/Q5-Lo-Trinh/36-danh-gia-tien-do)
4. [Kiến trúc hội tụ ADR-001](/Q6-Kien-Truc-VibeCoding/39-kien-truc-hoi-tu-vibecoding)
5. [CI/CD tự kiểm chứng V4→V5](/Q6-Kien-Truc-VibeCoding/44-ci-cd-tu-kiem-chung-paldarkv5)

Mọi quyết định mới phải được ghi trong [sổ quyết định V5](/V5/), không sửa ngược hồ sơ V4 để làm lịch sử trông nhất quán hơn thực tế.
