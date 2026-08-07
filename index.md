---
title: Paldark — Thiết kế game cho nhiều người và AI cùng xây
description: Cuốn sách trực tuyến về cách đọc một game, thiết kế kiến trúc modular và tổ chức nhiều người hoặc AI agent cùng dựng Paldark.
---

# Paldark — Thiết kế game cho nhiều người và AI cùng xây

Paldark là một cuốn sách kỹ thuật đi từ câu hỏi rất gần người chơi — *điều gì khiến Palworld vui?* — tới câu hỏi kiến trúc khó hơn: **làm sao để hàng trăm người hoặc AI agent cùng dựng một game lớn mà phần việc của họ vẫn ghép được vào nhau?**

::: tip Một mạch lập luận, không phải một kho bài rời
Sáu quyển, 46 chương và các phụ lục dùng lại kết luận của nhau. Bạn có thể tra cứu từng trang, nhưng đọc tuần tự sẽ cho thấy vì sao mỗi luật kiến trúc tồn tại.
:::

## Sáu quyển của Paldark

<div class="book-grid">
  <a class="book-card" href="./Q1-Doc-Mot-Game/01-nhin-mot-game-thi-nhin-cai-gi">
    <small>Quyển 1 · Chương 01–05</small>
    <strong>Đọc một game</strong>
    <span>Đi ngược từ cảm giác người chơi tới điều kiện và hệ thống phải xây.</span>
  </a>
  <a class="book-card" href="./Q2-Van-De-Nghin-Nguoi/06-vi-sao-codebase-vo-khi-dong-nguoi">
    <small>Quyển 2 · Chương 06–11</small>
    <strong>Vấn đề của nghìn người</strong>
    <span>Hiểu va chạm khi đông người cùng code, rồi rút luật từ Lyra và UEFN.</span>
  </a>
  <a class="book-card" href="./Q3-Bo-Khung/12-danh-muc-khai-niem-va-quyen-ghi">
    <small>Quyển 3 · Chương 12–19</small>
    <strong>Bộ khung</strong>
    <span>Module, hợp đồng dữ liệu, quyền ghi, đăng ký, test và CI làm trọng tài.</span>
  </a>
  <a class="book-card" href="./Q4-Dung-Lai-Palworld/20-nen-va-cach-doc-quyen-nay">
    <small>Quyển 4 · Chương 20–35</small>
    <strong>Dựng lại Palworld</strong>
    <span>Áp bộ khung lên 15 hệ thống gameplay theo thứ tự tạo thành vòng chơi.</span>
  </a>
  <a class="book-card" href="./Q5-Lo-Trinh/36-danh-gia-tien-do">
    <small>Quyển 5 · Chương 36–38</small>
    <strong>Đánh giá và lộ trình</strong>
    <span>Đo tiến độ thật, độ phức tạp còn lại và biến từng hệ thống thành khóa học.</span>
  </a>
  <a class="book-card" href="./Q6-Kien-Truc-VibeCoding/39-kien-truc-hoi-tu-vibecoding">
    <small>Quyển 6 · Chương 39–46</small>
    <strong>VibeCoding đa tác nhân</strong>
    <span>Kiến trúc hội tụ, write-set, human gate và vòng tự kiểm chứng người–AI.</span>
  </a>
</div>

## Luận đề trung tâm

Một game lớn không vỡ chỉ vì có nhiều code. Nó vỡ khi nhiều người cùng thay đổi một trạng thái nhưng không rõ ai sở hữu, khi hợp đồng chỉ tồn tại trong trí nhớ, và khi chữ “xong” không gắn với bằng chứng người chơi có thể quan sát.

Paldark giải bài toán đó bằng một chuỗi nhất quán:

```mermaid
flowchart LR
  A[Trải nghiệm người chơi] --> B[Điều kiện bắt buộc]
  B --> C[Canonical state]
  C --> D[Một chủ ghi]
  D --> E[Hợp đồng typed]
  E --> F[Log và test]
  F --> G[Bằng chứng người chơi]
```

Mỗi chương trả lời một đoạn của chuỗi. Mỗi phụ lục giữ nguồn, độ tin cậy và các câu hỏi chưa thể kết luận.

## Chọn đường đọc

<div class="reading-paths">
  <div><strong>Đọc như một cuốn sách</strong><span>Bắt đầu ở Chương 1 và đi tuần tự qua sáu quyển.</span></div>
  <div><strong>Dựng một vertical slice</strong><span>Đọc Quyển 3, Chương 39–45 rồi quay về hệ thống tương ứng trong Quyển 4.</span></div>
  <div><strong>Tra cứu nhanh</strong><span>Dùng ô tìm kiếm, mục lục trái, danh mục sống và sổ bằng chứng.</span></div>
</div>

## Bắt đầu

- [Đọc Chương 1 — Nhìn một game thì nhìn cái gì](./Q1-Doc-Mot-Game/01-nhin-mot-game-thi-nhin-cai-gi.md)
- [Mở mục lục đầy đủ](./00-MucLuc.md)
- [Tra danh mục khái niệm](./DanhMuc/khai-niem.md)
- [Xem sổ bằng chứng](./PhuLuc/A-so-bang-chung.md)

> Một số chương dẫn tới source repository phục vụ kiểm toán. Các liên kết đó có thể yêu cầu quyền truy cập GitHub tương ứng; toàn bộ phần giải thích và kết luận của cuốn sách vẫn đọc được ngay trên website này.
