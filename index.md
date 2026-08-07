---
title: Paldark — Thiết kế game cho nhiều người và AI cùng xây
description: Cuốn sách trực tuyến về cách đọc một game, thiết kế kiến trúc modular và tổ chức nhiều người hoặc AI agent cùng dựng Paldark.
---

# Paldark — Thiết kế game cho nhiều người và AI cùng xây

Hãy bắt đầu ở một khoảnh khắc rất bình thường trong Palworld: bạn rời căn cứ, bắt một sinh vật mới, nhặt thêm tài nguyên rồi quay về chế tạo. Với người chơi, đó là một chuyến đi liền mạch. Với người làm game, vài phút ấy là lúc input, chiến đấu, bắt giữ, túi đồ, AI, xây dựng và lưu trữ cùng chạm vào một thế giới chung.

Paldark đi ngược từ trải nghiệm đó. Cuốn sách bắt đầu bằng câu hỏi gần gũi — *điều gì khiến Palworld vui?* — rồi lần tới câu hỏi kiến trúc khó hơn: **làm sao để hàng trăm người hoặc AI agent cùng dựng một game lớn mà phần việc của họ vẫn ghép được vào nhau?**

::: tip Một mạch lập luận, không phải một kho bài rời
Sáu quyển, 46 chương và các phụ lục nối thành một đường suy luận. Bạn vẫn có thể tra cứu từng trang, nhưng đọc tuần tự sẽ cho thấy một luật kiến trúc sinh ra từ va chạm nào và nó bảo vệ trải nghiệm người chơi ra sao.
:::

## Sáu quyển của Paldark

Đường đi của cuốn sách có chủ ý: nhìn game trước, nhìn sự cộng tác sau, rồi mới đóng những quan sát ấy thành kiến trúc. Sáu quyển dưới đây là sáu chặng của cùng một câu hỏi, không phải sáu bộ tài liệu độc lập.

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

Một game lớn hiếm khi vỡ chỉ vì nó có nhiều code. Nó vỡ ở những đường nối: hai hệ thống cùng tin rằng mình được quyền đổi một trạng thái; một hợp đồng chỉ còn tồn tại trong trí nhớ của người viết đầu tiên; hoặc cả đội gọi một tính năng là “xong” trong khi người chơi chưa thể nhìn thấy kết quả.

Vì thế Paldark không bắt đầu bằng tên module. Nó bắt đầu từ điều người chơi cảm nhận, hỏi điều kiện nào phải đúng để cảm giác ấy xuất hiện, rồi mới lần xuống trạng thái chuẩn, chủ sở hữu và bằng chứng. Chuỗi suy luận ấy có thể đọc gọn như sau:

```mermaid
flowchart LR
  A[Trải nghiệm người chơi] --> B[Điều kiện bắt buộc]
  B --> C[Canonical state]
  C --> D[Một chủ ghi]
  D --> E[Hợp đồng typed]
  E --> F[Log và test]
  F --> G[Bằng chứng người chơi]
```

Mỗi chương làm rõ một đoạn của chuỗi; mỗi phụ lục giữ lại nguồn, độ tin cậy và những câu hỏi chưa đủ bằng chứng để kết luận. Nhờ vậy, kiến trúc không còn là một tập sở thích của tác giả mà trở thành lập luận người khác có thể kiểm tra.

## Chọn đường đọc

Không phải ai mở cuốn sách này cũng đang đứng ở cùng một nơi. Bạn có thể đi từ đầu để theo trọn lập luận, hoặc chọn một đường ngắn hơn nếu đang cần giải quyết một vấn đề cụ thể.

<div class="reading-paths">
  <div><strong>Đọc như một cuốn sách</strong><span>Bắt đầu ở Chương 1 và đi tuần tự qua sáu quyển.</span></div>
  <div><strong>Dựng một vertical slice</strong><span>Đọc Quyển 3, Chương 39–45 rồi quay về hệ thống tương ứng trong Quyển 4.</span></div>
  <div><strong>Tra cứu nhanh</strong><span>Dùng ô tìm kiếm, mục lục trái, danh mục sống và sổ bằng chứng.</span></div>
</div>

## Bắt đầu

Nếu đây là lần đầu bạn đến với Paldark, hãy vào Chương 1. Chương ấy chưa yêu cầu bạn tin vào một framework nào; nó chỉ đề nghị bạn nhìn lại một phiên chơi và hỏi đúng câu hỏi đầu tiên.

- [Đọc Chương 1 — Nhìn một game thì nhìn cái gì](./Q1-Doc-Mot-Game/01-nhin-mot-game-thi-nhin-cai-gi.md)
- [Mở mục lục đầy đủ](./00-MucLuc.md)
- [Tra danh mục khái niệm](./DanhMuc/khai-niem.md)
- [Xem sổ bằng chứng](./PhuLuc/A-so-bang-chung.md)

> Một số chương dẫn tới source repository phục vụ kiểm toán. Các liên kết đó có thể yêu cầu quyền truy cập GitHub tương ứng; toàn bộ phần giải thích và kết luận của cuốn sách vẫn đọc được ngay trên website này.
