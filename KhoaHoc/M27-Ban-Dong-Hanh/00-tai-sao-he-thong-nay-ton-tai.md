# Bài 00 — Vì sao bắt được Pal nhưng người chơi vẫn chưa có bạn đồng hành?

> Khoá 27 — Bạn đồng hành. Bài này không có code. Nó quyết định code sẽ phải làm gì.

## Câu hỏi

Người chơi vừa ném cầu, cầu rung ba lần rồi đứng yên. Dòng chữ "bắt được" hiện lên. Một bản ghi mới xuất hiện trong danh sách.

Và rồi… không có gì cả. Nhân vật vẫn đứng một mình giữa rừng.

Người chơi vừa *thắng* một cuộc chiến, nhưng chưa *có* gì. Vì sao?

## Thứ người chơi thật sự muốn

Hãy tách hai thứ mà từ "bắt được Pal" gộp làm một:

- **Sở hữu**: một dòng dữ liệu nói rằng con Pal này thuộc về tôi.
- **Đồng hành**: một sinh vật đi cạnh tôi, phản ứng với thế giới, và tôi biết nó đang nghĩ gì.

Chương 26 mới cho cái thứ nhất. Cái thứ hai chưa hề tồn tại.

Điều đáng chú ý: người chơi gần như không quan tâm tới cái thứ nhất. Không ai chơi Palworld để có thêm một dòng trong cơ sở dữ liệu. Họ chơi vì con Pal *đi theo họ* — và vì thỉnh thoảng nó làm điều họ không ra lệnh.

Đó là chỗ khó thật sự. Một bạn đồng hành chỉ đi theo đúng khoảng cách cố định là một cái bóng, không phải một sinh vật. Cảm giác "nó sống" đến từ việc nó **tự quyết định** những chuyện nhỏ: dừng lại nhìn quanh, đi vòng qua tảng đá thay vì đâm vào, chạy khi sắp chết.

## Từ cảm giác ra yêu cầu

Tách cảm giác "nó sống" thành những điều kiểm chứng được:

| Người chơi cảm thấy | Điều kiện kỹ thuật tối thiểu |
|---|---|
| "Nó đi theo tôi" | có khái niệm *chủ*, và một khoảng cách mong muốn |
| "Nó không dính vào tôi" | khoảng cách có **hai** ngưỡng, không phải một |
| "Nó biết đường" | điều hướng theo NavMesh, không phải nội suy thẳng |
| "Nó thấy tôi / thấy quái" | có tri giác (perception), có thứ để thấy và thứ để mất dấu |
| "Nó sợ chết" | đọc được HP của chính nó và đổi hành vi theo |
| "Tôi hiểu nó đang làm gì" | trạng thái hiện tại phải **quan sát được từ bên ngoài** |

Dòng cuối cùng dễ bị bỏ qua nhất và lại quan trọng nhất. Một AI đúng mà người chơi không đọc được ý định thì vẫn bị cảm nhận là hỏng. Vì vậy trạng thái hành vi là một **state công khai có chủ sở hữu**, không phải biến nội bộ của một hàm tick.

## Hai ngưỡng, không phải một

Đây là chỗ hầu hết bản dựng đầu tiên sai, nên nói trước.

Nếu chỉ có một khoảng cách mong muốn `D`, thì luật sẽ là "xa hơn `D` thì đuổi, gần hơn `D` thì dừng". Kết quả: Pal đuổi tới đúng `D`, dừng, người chơi nhích một bước, nó lại đuổi. Nó rung. Người chơi không mô tả được vì sao khó chịu, nhưng thấy khó chịu.

Cần **hai** ngưỡng: bắt đầu đuổi khi vượt `Max`, chỉ dừng khi đã vào trong `Min`. Khoảng giữa hai ngưỡng là vùng mà Pal *không đổi quyết định*. Đó là hysteresis, và nó không phải mẹo tối ưu — nó là điều kiện để hành vi trông có chủ đích.

Một quan sát tổng quát hơn, sẽ gặp lại ở mọi hệ thống AI sau này: **mọi chuyển trạng thái đều cần một vùng chết, nếu không hệ thống sẽ dao động ở đúng biên.**

## Cái gì thuộc về ai

Chương 27 chạm vào state của bốn hệ thống khác. Nếu không chốt quyền sở hữu ngay bây giờ thì AI sẽ trở thành nơi mọi thứ rò rỉ vào — nó biết HP, biết túi đồ, biết công việc, và không ai gỡ ra được nữa.

| Trạng thái | Chủ | Chương 27 được làm gì |
|---|---|---|
| Trạng thái hành vi, mục tiêu điều hướng | **PalBehavior** | ghi |
| HP | Health | chỉ đọc |
| Entity id, roster, chủ sở hữu | Creature / Companion | chỉ đọc |
| Phân công công việc | Work | chỉ nhận yêu cầu |
| Spawn / despawn | World | không đụng |
| Quyết định gây sát thương | Combat | chỉ phát tín hiệu "tôi thấy mục tiêu" |

Dòng cuối là một cám dỗ lớn: Pal thấy quái thì cho nó đánh luôn, vài dòng là xong. Làm thế thì Combat có hai chủ, và luật sát thương sẽ tách đôi — một nhánh cho người chơi, một nhánh cho Pal. Chương 25 cấm đúng điều đó. AI chỉ được phép nói "tôi thấy X"; ai đó khác quyết định có đánh hay không.

## Bài này kết luận gì

Bạn đồng hành **không phải** là một tính năng của Capture, cũng không phải một cờ trong Companion. Nó là một hệ thống riêng, sở hữu đúng một thứ — *ý định hiện tại của một sinh vật* — và đọc mọi thứ khác qua hợp đồng.

Câu hỏi kế tiếp sinh ra từ đây: nếu Pal phải tự quyết định, thì **cỗ máy ra quyết định đó nên có hình dạng gì?** Behavior Tree như KYWorld và như mọi tài liệu Unreal đều dạy, hay một thứ khác? Đó là bài 01 và bài 02.
