---
title: Mẫu làm việc máy đọc được
description: Task packet và human test card dùng để giao việc, giới hạn write-set và ghi bằng chứng kiểm thử Paldark.
---

# Mẫu làm việc máy đọc được

Hai mẫu YAML dưới đây biến giao việc và kiểm thử thành hợp đồng có cấu trúc. Chúng được dùng cùng [Chương 40 — Giao thức VibeCoding đa tác nhân](../Q6-Kien-Truc-VibeCoding/40-giao-thuc-vibecoding-da-agent.md) và [Chương 43 — Human gate](../Q6-Kien-Truc-VibeCoding/43-human-gate-adr-001-capture-to-work.md).

## Task packet v1

Task packet mô tả outcome, write-set, read-set, dependency, gate và bằng chứng mà một agent phải bàn giao.

<<< @/Templates/task-packet.yaml{yaml}

[Mở file YAML gốc trên GitHub](https://github.com/SlimeVRX/Paldark-Docs/blob/main/Templates/task-packet.yaml)

## Human test card v1

Human test card chỉ dẫn một người chơi thật cách kiểm tra outcome quan sát được mà không cần hiểu code hay đọc log nội bộ.

<<< @/Templates/human-test-card.yaml{yaml}

[Mở file YAML gốc trên GitHub](https://github.com/SlimeVRX/Paldark-Docs/blob/main/Templates/human-test-card.yaml)
