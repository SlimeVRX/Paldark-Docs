# Phụ lục C — Trạng thái submodule

Một tài liệu có thể dẫn đúng tên khóa học nhưng vẫn đọc nhầm source nếu submodule đã trôi sang commit khác. Vì vậy phụ lục ngắn này đóng băng điểm tham chiếu vật lý mà quá trình khảo sát đã thực sự nhìn thấy.

Dưới đây là đầu ra nguyên trạng của `git submodule status` tại thời điểm dựng phụ lục:

```text
a6eab166bedeb3a48ea1fa6c082e2560e59b8134 02.Palworld/Source (heads/main)
1c2c18ff9fa64ac773db2567361ccc31d753d5cf 05.Udemy-ue5-gas-crash-course/Source (heads/main)
da2a8aab4b66b51b7c41e4541c1c9c982c96cb42 07.Udemy-ue5-multiplayer-crash-course/Source (heads/main)
6a4288e7a1eb313709d4de97a75ea1374fc6f2ad 08.Udemy-ue5-dedicated-servers-with-aws-and-gamelift/Source (heads/main)
c513708e16abcfbcda262b7ca68738ad88de7695 09.Udemy-ue5-inventory-system/Source (heads/main)
88f0f15c18e0167ac0a5e5354e0fcb0d2f00840f 10.Udemy-ue5-cpp-multiplayer-shooter/Source (heads/main)
cd631e409fcb7f78f3a6d8bc3a58496a93c8d52b 11.Udemy-ue5-gas-top-down-rpg/Source (heads/main)
f170c1986c3bee89f50b4dfc68957d6e2a94cb5a 13.Udemy-ue5-multiplayer-in-unreal-with-gas-and-aws-dedicated-servers/Source (heads/master)
7b390ac14a3a2d6729f7405a8367e6a2c6e5b4 17.Hipernova-Lyra-Inventory/Source (heads/main)
```

Quá trình biên soạn không thay đổi hay commit nội dung bên trong bất kỳ submodule nào. Các hash trên chỉ giúp người kiểm toán quay lại đúng snapshot; chúng không tự chứng minh source đã được tích hợp, build hoặc chạy trong Paldark.
