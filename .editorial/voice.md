# Quy chuẩn giọng văn Paldark

Tệp tham chiếu chính: [Chương 1 — Nhìn một game thì nhìn cái gì](../Q1-Doc-Mot-Game/01-nhin-mot-game-thi-nhin-cai-gi.md).

## Lời hứa với người đọc

Paldark là một cuốn sách kỹ thuật, không phải một kho ghi chú được đặt cạnh nhau. Mỗi chương phải giúp người đọc đi từ điều họ có thể nhìn thấy hoặc cảm thấy trong game đến nguyên nhân kiến trúc nằm phía sau. Người đọc cần hiểu **vì sao** một ranh giới tồn tại trước khi gặp tên module, API hay quy tắc CI thực thi ranh giới đó.

## Nhịp của một chương

1. Mở bằng một cảnh, một va chạm hoặc một câu hỏi có thật trong quá trình chơi và làm game.
2. Đi ngược từ kết quả người chơi cảm nhận tới hành vi, trạng thái, quyền ghi và hợp đồng dữ liệu.
3. Đưa khái niệm kỹ thuật vào đúng lúc nó giải quyết được câu hỏi vừa đặt ra.
4. Giới thiệu bảng, danh sách, sơ đồ và đoạn mã bằng văn xuôi; sau chúng phải có một câu diễn giải điều người đọc nên rút ra.
5. Kết mục hoặc kết chương bằng hệ quả, giới hạn, hoặc cây cầu sang phần tiếp theo.

Không phải chương nào cũng cần lặp đúng năm bước này, nhưng chương không được biến thành một chuỗi heading và checklist thiếu mạch lập luận.

## Giọng kể

- Viết bằng tiếng Việt tự nhiên, sáng rõ và có nhịp. Đoạn văn thường từ hai đến năm câu; xen kẽ câu ngắn khi cần đóng ý.
- Dùng “bạn” khi đặt người đọc vào một tình huống cụ thể; dùng “chúng ta” khi cùng lần theo lập luận. Không lạm dụng đại từ ở mọi đoạn.
- Câu hỏi tu từ phải mở ra một vấn đề sẽ được trả lời ngay sau đó, không dùng chỉ để trang trí.
- Ưu tiên động từ và quan hệ nhân–quả: điều gì thay đổi, ai sở hữu nó, ai được phép ghi, và sai lệch sẽ xuất hiện ở đâu.
- Giữ chất gần gũi của bản mẫu, nhưng đây vẫn là văn viết. Tránh giọng chat, lời quảng cáo, khẩu hiệu và những câu khẳng định lớn hơn bằng chứng.

## Kỷ luật kỹ thuật

- Không làm thay đổi sự thật, con số, công thức, trạng thái triển khai hoặc cấp độ bằng chứng.
- Không nâng một đề xuất thành hiện trạng, một quan sát thành quy luật, hay một đường dẫn nội bộ thành nguồn công khai.
- Giữ nguyên code, bảng, Mermaid, liên kết, tên type/API, identifier và từ khóa máy đọc được, trừ khi có lỗi đã được xác nhận.
- Thuật ngữ tiếng Anh và identifier đặt trong backtick khi phù hợp; lần xuất hiện đầu tiên cần có nghĩa hoặc vai trò bằng tiếng Việt.
- Giữ cấu trúc heading và số mục ổn định để không phá anchor. Chỉ đổi khi có lý do biên tập rõ ràng và đã kiểm tra liên kết.
- Tài liệu snapshot hoặc lịch sử phải nói rõ mốc thời gian. Danh mục sống vẫn có thể thiên về tra cứu, nhưng cần lời dẫn giải thích cách đọc và cách dùng.

## Dấu hiệu một trang chưa đạt

- Mở đầu bằng “Chương này trình bày…” mà chưa cho người đọc biết vấn đề đáng quan tâm là gì.
- Ba danh sách hoặc bảng xuất hiện liền nhau mà không có văn xuôi nối và giải nghĩa.
- Các câu ngắn cùng cấu trúc lặp liên tiếp như biên bản họp.
- Thuật ngữ được định nghĩa bằng một thuật ngữ khác nhưng không có ví dụ hoặc hệ quả.
- Đoạn kết chỉ dừng lại ở “tóm lại” mà không cho thấy phần vừa đọc thay đổi quyết định thiết kế nào.
