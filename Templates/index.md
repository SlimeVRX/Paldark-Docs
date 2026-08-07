---
title: Mẫu làm việc máy đọc được
description: Task packet và human test card dùng để giao việc, giới hạn write-set và ghi bằng chứng kiểm thử Paldark.
---

# Mẫu làm việc máy đọc được

Hãy hình dung hai agent cùng nhận một câu ngắn: “làm xong hệ bắt giữ”. Một agent sửa state, agent kia sửa UI, cả hai đều báo hoàn tất — rồi tới lúc ghép mới phát hiện họ hiểu chữ “xong” theo hai nghĩa khác nhau. Vấn đề không nằm ở tốc độ viết code; nó nằm ở hợp đồng bàn giao chưa đủ rõ để máy và người cùng đọc một cách.

Hai mẫu YAML dưới đây biến phần hợp đồng đó thành dữ liệu có cấu trúc. Chúng được dùng cùng [Chương 40 — Giao thức VibeCoding đa tác nhân](../Q6-Kien-Truc-VibeCoding/40-giao-thuc-vibecoding-da-agent.md) và [Chương 43 — Human gate](../Q6-Kien-Truc-VibeCoding/43-human-gate-adr-001-capture-to-work.md).

## Task packet v1

Task packet không kể agent phải gõ từng dòng code nào. Nó khóa điều quan trọng hơn: outcome cần tạo ra, vùng được phép ghi, vùng chỉ được đọc, dependency phải chờ, gate phải vượt qua và bằng chứng phải bàn giao. Nhờ đó, một nhiệm vụ có ranh giới trước khi công việc bắt đầu.

<<< @/Templates/task-packet.yaml{yaml}

[Mở file YAML gốc trên GitHub](https://github.com/SlimeVRX/Paldark-Docs/blob/main/Templates/task-packet.yaml)

## Human test card v1

Nếu task packet giúp agent biết phải bàn giao gì, human test card giúp một người chơi thật biết phải nhìn vào đâu. Tấm thẻ mô tả đường kiểm tra outcome quan sát được mà không yêu cầu người thử hiểu code hay giải nghĩa log nội bộ; nó là cây cầu từ chữ `COMPILED` tới điều thực sự xảy ra trên màn hình.

<<< @/Templates/human-test-card.yaml{yaml}

[Mở file YAML gốc trên GitHub](https://github.com/SlimeVRX/Paldark-Docs/blob/main/Templates/human-test-card.yaml)
