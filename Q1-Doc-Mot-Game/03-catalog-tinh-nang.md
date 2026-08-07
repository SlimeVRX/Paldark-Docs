# Chương 3 — Catalog tính năng

Bạn không nên mở editor rồi hỏi “hôm nay code feature nào?”. Trước đó phải biết feature phục vụ cảm giác nào, nối vào vòng lặp ở đâu và có phải một hệ thống riêng hay chỉ là một biến thể của thứ đã có. Catalog này là bản kiểm kê để trả lời ba câu hỏi đó.

Mã `F-xxx` là ID làm việc của tài liệu, không phải ID trong Palworld gốc. “Linh hồn của game” nghĩa là bỏ nó thì vòng lặp cốt lõi đổi bản chất; “cần thiết” nghĩa là cần cho một vertical slice có thể chơi; “có thì tốt” mở rộng chiều sâu; “bỏ được” chỉ nên làm sau khi lõi đã đứng.

## Di chuyển và khám phá

Người chơi cần một cơ thể có thể đi qua thế giới trước khi collection, combat hay building có ý nghĩa. Nhóm này tồn tại để tạo nhịp “thấy một nơi xa thì muốn tới đó”, chứ không phải để khoe đủ loại locomotion.

Đi bộ, nhảy và sprint là lõi của vertical slice. Leo, bơi và glide mở thêm loại địa hình; cưỡi là điểm nối sang companion. Movement runtime cụ thể của Palworld chưa đủ source trong dossier, nên các dòng không có declaration sẽ được đánh dấu ngắn là INFERRED.

| Mã | Tính năng | Người chơi làm gì | Cảm giác phục vụ | Mức độ | Bằng chứng |
|---|---|---|---|---|---|
| F-001 | Đi bộ và chạy | Di chuyển qua địa hình bằng input cơ bản, đổi tốc độ giữa đi bộ và chạy để thăm dò hoặc rút lui | cảm giác cơ thể đáp ứng ngay và thế giới có thể tiếp cận | linh hồn của game | INFERRED |
| F-002 | Nhảy | Nhảy qua khe, vật cản thấp hoặc tạo khoảng trống khi combat | một lựa chọn nhỏ nhưng làm địa hình bớt phẳng | cần thiết | INFERRED |
| F-003 | Sprint | Giữ nút để tăng tốc, đổi tốc độ lấy bằng stamina hoặc sự an toàn | muốn đi nhanh hơn nhưng phải tự quản lý nhịp | cần thiết | INFERRED |
| F-004 | Leo trèo | Bám vào vách đá và leo lên, tiêu hao thể lực; hết thể lực thì rơi | vượt rào cản theo chiều dọc, thấy thế giới mở ra | có thì tốt | INFERRED |
| F-005 | Bơi | Xuống nước và bơi qua vùng tưởng như chặn đường, với tốc độ khác trên cạn | băng qua một ranh giới tự nhiên thay vì quay lại | có thì tốt | INFERRED |
| F-006 | Lướt / glide | Mở thiết bị hoặc partner phù hợp rồi lướt từ điểm cao sang điểm xa | đổi độ cao đã kiếm được thành khoảng cách | có thì tốt | `EPalItemTypeA` có taxonomy Glider; EXTRACTED |
| F-007 | Cưỡi | Gọi một Pal có mount capability và di chuyển bằng bộ điều khiển của nó | cảm giác Pal làm thế giới lớn lên | linh hồn của game | `DT_PartnerSkillData` / `MountType`; REFERENCE |

## Sinh vật và encounter

Encounter là đầu vào của collection. Người chơi phải gặp một thứ có identity trước khi có thể muốn bắt, đánh, nuôi hoặc đưa nó về base.

Các field như stat, element, passive, level và nocturnal làm cho hai encounter không chỉ khác model. Những mục còn lại là cách đưa data row vào thế giới; exact AI state và spawn lifecycle chưa được xác minh đầy đủ.

| Mã | Tính năng | Người chơi làm gì | Cảm giác phục vụ | Mức độ | Bằng chứng |
|---|---|---|---|---|---|
| F-008 | Sinh vật lang thang | Bắt gặp một creature đang di chuyển trong biome thay vì chờ nó ở một menu | tò mò và muốn tiến lại gần xem nó là gì | linh hồn của game | `PalWildSpawnerDatabaseRow`; EXTRACTED |
| F-009 | Sinh vật thù địch | Bị creature phát hiện hoặc chủ động khiêu khích để bắt đầu combat | căng thẳng trước khi trận đánh thật sự bắt đầu | cần thiết | `PalCharacterParameterDatabaseRow`; REFERENCE |
| F-010 | Cấp độ encounter | Đọc level của creature và cân nhắc có nên đánh hoặc bắt ngay | nhận ra mình đang ở sai khu vực hoặc đã tiến bộ | cần thiết | Spawner `LvMin/LvMax`; EXTRACTED |
| F-011 | Hệ nguyên tố | Chọn skill hoặc Pal dựa trên element của mục tiêu | tìm ra kèo khắc chế thay vì chỉ spam đòn mạnh | cần thiết | Skill tables; REFERENCE |
| F-012 | Stat sinh vật | So sánh HP, attack, defense, speed và capture correction giữa các species | mỗi loài có lý do để tồn tại | linh hồn của game | `PalCharacterParameterDatabaseRow.h`; EXTRACTED |
| F-013 | Passive skill | Đọc hoặc nhận một trait làm thay đổi cách build creature | một con cùng loài vẫn có thể là bản khác | có thì tốt | `PassiveSkill1..4`; EXTRACTED |
| F-014 | Kỹ năng chủ động | Để creature dùng move riêng trong combat hoặc partner context | mong chờ khoảnh khắc nó thể hiện identity | cần thiết | Skill tables; REFERENCE |

## Bắt và sở hữu

Capture là bản lề biến một mối đe dọa ngoài thế giới thành tài sản của người chơi. Nó nối combat với roster, worker, partner và breeding.

Tỉ lệ bắt, HP mục tiêu và loại sphere là các núm có evidence trong tài liệu. Roster/instance persistence là yêu cầu clean-room hợp lý, nhưng không được nhầm với bằng chứng về save runtime Palworld gốc.

| Mã | Tính năng | Người chơi làm gì | Cảm giác phục vụ | Mức độ | Bằng chứng |
|---|---|---|---|---|---|
| F-015 | Ném sphere | Nhắm vào target đang ở trong tầm rồi ném capture item | một hành động đơn giản nhưng có rủi ro | linh hồn của game | Capture documents; REFERENCE |
| F-016 | Tỉ lệ bắt | Nhìn cơ hội thành công thay đổi trước khi quyết định ném | hồi hộp vì phần thưởng chưa chắc chắn | linh hồn của game | `CaptureRateCorrect`; EXTRACTED |
| F-017 | Điều chỉnh theo HP | Đánh target yếu đi trước khi thử lại để tăng cơ hội | thấy combat chuẩn bị cho collection | cần thiết | Capture formula; REFERENCE |
| F-018 | Điều chỉnh theo sphere | Chọn sphere tier cao hơn để đổi tài nguyên lấy xác suất tốt hơn | cân nhắc vật liệu trước mỗi lần bắt | cần thiết | Item/capture tables; REFERENCE |
| F-019 | Capture thất bại | Nhận feedback thất bại và để target tiếp tục tồn tại hoặc phản công | tiếc nhưng hiểu mình còn cơ hội sửa sai | cần thiết | `FCaptureResult.FailedCaptureType`; EXTRACTED |
| F-020 | Kết quả capture | Nhận success/fail count và feedback thay vì chỉ thấy target biến mất | biết chính xác khoảnh khắc may rủi kết thúc | linh hồn của game | `FCaptureResult` ba field; EXTRACTED |
| F-021 | Tạo creature instance | Đưa Pal bắt được vào roster hoặc storage với identity riêng | cảm giác “con này là của mình” | linh hồn của game | `FPalInstanceID`; EXTRACTED |

## Chiến đấu

Combat giữ cho chuyến đi có rủi ro. Nó cho người chơi lý do phải chuẩn bị weapon, Pal, food và resistance trước khi rời căn cứ.

Damage theo element, weapon taxonomy và skill table có evidence; lock-on, dodge timing và hit reaction là các hành vi cần vertical slice nhưng runtime detail chưa có đủ trong dossier.

| Mã | Tính năng | Người chơi làm gì | Cảm giác phục vụ | Mức độ | Bằng chứng |
|---|---|---|---|---|---|
| F-022 | Đánh cận chiến | Tiếp cận mục tiêu và dùng weapon melee trong khoảng cách nguy hiểm | đổi an toàn lấy sát thương và nhịp áp sát | cần thiết | `EPalWeaponType`; EXTRACTED |
| F-023 | Đánh tầm xa | Giữ khoảng cách, ngắm và bắn projectile vào target | kiểm soát khoảng cách thay vì lao vào | cần thiết | `EPalWeaponType`; EXTRACTED |
| F-024 | Projectile | Theo dõi đường bay, tốc độ và điểm va chạm của đạn | mỗi phát bắn có dự đoán và rủi ro | có thì tốt | Skill tables; REFERENCE |
| F-025 | Né tránh | Đổi vị trí đúng thời điểm để tránh attack thay vì chịu damage | cảm giác đọc được đòn đối thủ | có thì tốt | INFERRED |
| F-026 | Damage nguyên tố | Tính multiplier giữa element của attack và target | mỗi lựa chọn Pal có lúc tỏa sáng | cần thiết | Element matrix; REFERENCE |
| F-027 | Critical hit | Có cơ hội tạo một hit vượt damage thông thường | một cú đánh bất ngờ phá nhịp trận đấu | có thì tốt | Skill tables; REFERENCE |
| F-028 | Death và knockdown | Nhìn target chuyển sang trạng thái không thể tiếp tục chiến đấu | thấy hành động đã tạo hậu quả rõ | cần thiết | `Health`/death contracts; REFERENCE |

## Đồng hành và cưỡi

Sau capture, Pal phải tiếp tục sống trong quyết định của người chơi. Party và partner biến collection thành thứ được gọi ra, trang bị và sử dụng trong một tình huống cụ thể.

MountType có bốn giá trị và partner row có buff/work fields. Party slot, summon lifecycle và quyền điều khiển chưa có số runtime chắc chắn; các mục đó là INFERRED clean-room.

| Mã | Tính năng | Người chơi làm gì | Cảm giác phục vụ | Mức độ | Bằng chứng |
|---|---|---|---|---|---|
| F-029 | Roster party | Sắp xếp các Pal đã sở hữu vào nhóm có thể mang theo | chuẩn bị đội hình trước khi rời base | cần thiết | Party runtime chưa có schema; INFERRED |
| F-030 | Active companion | Chọn một Pal sẽ xuất hiện khi gọi ra | cảm giác mình đang đưa ra quyết định, không chỉ mở kho | cần thiết | INFERRED |
| F-031 | Summon companion | Gọi Pal từ roster vào world và giao cho nó một context | từ vật sở hữu biến thành bạn đồng hành có mặt | linh hồn của game | INFERRED |
| F-032 | Recall companion | Thu Pal về khi đổi chiến thuật hoặc rời nguy hiểm | kiểm soát được ranh giới giữa party và world | cần thiết | INFERRED |
| F-033 | Partner skill | Kích hoạt khả năng riêng của Pal khi đủ điều kiện | mỗi Pal có lý do riêng để được chọn | cần thiết | `DT_PartnerSkillData`; REFERENCE |
| F-034 | Buff equip | Trang bị hoặc gọi partner để áp buff ATK/DEF hoặc work | thấy Pal có giá trị ngay cả khi chưa tấn công | có thì tốt | `BuffOnEquip_ATK/DEF`; REFERENCE |
| F-035 | Mount mặt đất | Gắn người chơi vào mount ground và đổi movement mode | di chuyển nhanh hơn nhưng vẫn đọc địa hình | cần thiết | `MountType=Ride`; EXTRACTED |

## Vật phẩm và inventory

Inventory là nơi encounter, loot, craft, shop và equipment gặp nhau. Nếu item chỉ là một tên trong array, những hệ thống phía sau sẽ không có state chung để phối hợp.

Definition/instance, stack, weight và item taxonomy là các contract được tài liệu KYWorld/whitepaper mô tả. Durability, sorting và discard là feature mở rộng; chỉ ghi evidence khi có field/bảng cụ thể.

| Mã | Tính năng | Người chơi làm gì | Cảm giác phục vụ | Mức độ | Bằng chứng |
|---|---|---|---|---|---|
| F-036 | Item definition | Chọn một loại item bằng dữ liệu tĩnh trước khi item xuất hiện runtime | biết item có identity ổn định | cần thiết | `FPalStaticItemDataStruct`; EXTRACTED |
| F-037 | Item instance | Nhặt hoặc tạo một bản chạy thật có owner và state riêng | vật phẩm trở thành tài sản cụ thể | cần thiết | `FPalInstanceID`; EXTRACTED |
| F-038 | Stack count | Gộp nhiều đơn vị cùng loại vào một stack | giảm ma sát quản lý kho | cần thiết | KYWorld `FSlotStruct`; REFERENCE |
| F-039 | Weight | Mang item và thấy tải trọng giới hạn lựa chọn | sức chứa có giá chứ không chỉ là ô trống | cần thiết | `Weight` item/player docs; REFERENCE |
| F-040 | Capacity | Đụng giới hạn kho và phải dùng, cất hoặc bỏ bớt | mỗi chuyến đi có bài toán chuẩn bị | linh hồn của game | Inventory documents; REFERENCE |
| F-041 | Item category | Lọc hoặc xử lý item theo type như weapon, food, material | menu hiểu item dùng vào việc gì | có thì tốt | `EPalItemTypeA`; EXTRACTED |
| F-042 | Transfer giữa container | Kéo item từ player bag sang chest, station hoặc base storage | cảm giác căn cứ thực sự chứa tài sản | cần thiết | KYWorld inventory transfer docs; REFERENCE |

## Chế tạo

Crafting biến resource thành hướng đi. Nó không chỉ trả một output; nó đặt ra câu hỏi người chơi đang thiếu gì, cần station nào và nên dành nguyên liệu cho việc nào.

Recipe/material/required station là các khái niệm có trong DataTable analysis. Queue, cancel và rollback là yêu cầu giao dịch clean-room; source Palworld hiện chưa đưa runtime contract đủ chi tiết.

| Mã | Tính năng | Người chơi làm gì | Cảm giác phục vụ | Mức độ | Bằng chứng |
|---|---|---|---|---|---|
| F-043 | Recipe definition | Chọn công thức để xem input, output và station cần thiết | biết mình đang hướng đến món gì | cần thiết | Recipe tables; REFERENCE |
| F-044 | Material requirement | Kiểm tra đủ từng material trước khi bắt đầu | resource có mục đích rõ | cần thiết | Item/economy tables; REFERENCE |
| F-045 | Station requirement | Đưa recipe đến đúng workbench hoặc station | công trình trở thành điều kiện chơi, không chỉ trang trí | có thì tốt | BuildObject/workbench docs; REFERENCE |
| F-046 | Craft queue | Xếp nhiều đơn để station xử lý lần lượt | đặt kế hoạch rồi làm việc khác | có thì tốt | INFERRED |
| F-047 | Craft progress | Nhìn một đơn đang chạy thay vì nhận output ngay | thời gian chờ có nhịp và kỳ vọng | có thì tốt | INFERRED |
| F-048 | Output stack | Nhận sản phẩm đúng số lượng và đưa vào inventory | thấy resource đã biến thành giá trị | cần thiết | Recipe tables; REFERENCE |
| F-049 | Craft failure reason | Biết thiếu input, station, capacity hay technology | có thể sửa lỗi thay vì bấm lại mù | có thì tốt | INFERRED |

## Nấu ăn và tiêu hao

Nấu ăn tạo một khoảng chuẩn bị trước chuyến đi và làm food trở thành lựa chọn thay vì vật phẩm hồi máu đơn giản. Nhóm này nối inventory với attribute và nhịp thời gian.

Các recipe/item/effect cụ thể chưa được trích đầy đủ trong dossier, nên chỉ những dòng bám vào item/effect contract mới có reference; runtime cook timer và failure state là INFERRED.

| Mã | Tính năng | Người chơi làm gì | Cảm giác phục vụ | Mức độ | Bằng chứng |
|---|---|---|---|---|---|
| F-050 | Cook recipe | Chọn món và đưa ingredient vào cooking station | chuẩn bị một chuyến đi bằng quyết định cụ thể | có thì tốt | Item/recipe tables; REFERENCE |
| F-051 | Nhiên liệu | Nạp fuel hoặc duy trì điều kiện để station hoạt động | thấy production cần đầu vào liên tục | có thì tốt | INFERRED |
| F-052 | Thời gian nấu | Chờ station hoàn thành thay vì nhận món lập tức | nhịp chuẩn bị có khoảng nghỉ | bỏ được | INFERRED |
| F-053 | Food output | Nhận item food có identity và quantity | phần thưởng có thể mang theo | cần thiết | Item tables; REFERENCE |
| F-054 | Hồi nhiều chỉ số | Ăn một món để thay đổi nhiều attribute cùng lúc | một quyết định nhỏ cứu cả chuyến đi | có thì tốt | Gameplay effect design; INFERRED |
| F-055 | Gameplay effect có hạn | Nhận buff có thời lượng rồi để nó tự hết | chuẩn bị có cửa sổ tác dụng | có thì tốt | INFERRED |
| F-056 | Consumable use | Dùng food/medicine từ inventory vào đúng target | inventory quay lại phục vụ sinh tồn | cần thiết | Item category; REFERENCE |

## Xây dựng

Building biến progression thành một thứ nhìn thấy được trong không gian. Người chơi không chỉ mở một recipe; họ chọn vị trí, hình dạng và cách căn cứ sẽ vận hành.

BuildObject tables có cost, HP, work type, capacity và grid-related data được phân tích. Preview/validate/commit là mô hình clean-room; exact snap distance và collision rule chưa có evidence.

| Mã | Tính năng | Người chơi làm gì | Cảm giác phục vụ | Mức độ | Bằng chứng |
|---|---|---|---|---|---|
| F-057 | Preview | Đặt ghost structure trước khi tiêu cost | được thử ý tưởng mà chưa mất tài nguyên | cần thiết | INFERRED |
| F-058 | Grid snap | Đưa vị trí về ô lưới để công trình thẳng hàng | cảm giác căn cứ có trật tự | có thì tốt | BuildObject/grid docs; REFERENCE |
| F-059 | Xoay công trình | Xoay preview theo bước rồi chọn hướng phù hợp | làm layout phản ánh ý đồ người chơi | có thì tốt | INFERRED |
| F-060 | Kiểm tra nền | Thấy vị trí đỏ khi nền, độ dốc hoặc khoảng trống không hợp lệ | hiểu vì sao không thể đặt | cần thiết | INFERRED |
| F-061 | Chồng lấn | Phát hiện structure đang chiếm cùng không gian trước commit | tránh căn cứ tự cắt vào nhau | cần thiết | INFERRED |
| F-062 | Technology gate | Từ chối build khi node công nghệ chưa mở | progression có tác động lên không gian | có thì tốt | Technology/build tables; REFERENCE |
| F-063 | Commit structure | Biến preview thành actor có owner, HP và identity | thấy ý tưởng thành một phần căn cứ | linh hồn của game | BuildObject HP; REFERENCE |

## Thợ và tự động hóa

Automation là lý do Pal có giá trị sau khi capture. Một con Pal có thể biến thành output của căn cứ, nhưng chỉ khi hệ thống biết năng lực nào phù hợp với station nào.

13 loại work suitability là declaration thật; các field `WorkSuitability_*` được extracted. Scheduler priority, queue fairness và offline simulation chưa được xác minh, nên không giả vờ ghi chúng là Palworld fact.

| Mã | Tính năng | Người chơi làm gì | Cảm giác phục vụ | Mức độ | Bằng chứng |
|---|---|---|---|---|---|
| F-064 | Work suitability | Đọc năng lực của Pal rồi chọn việc phù hợp | bắt Pal tốt cho công việc có giá trị | linh hồn của game | `WorkSuitability_*`; EXTRACTED |
| F-065 | Work level | So sánh cấp suitability với yêu cầu station | một Pal cùng loại vẫn có chất lượng khác | cần thiết | `EPalWorkSuitability.h`; EXTRACTED |
| F-066 | Station slot | Đặt giới hạn số worker một công trình nhận | căn cứ có chỗ hữu hạn để quản lý | cần thiết | Build/work tables; REFERENCE |
| F-067 | Worker assignment | Gán một Pal cụ thể vào station | thấy roster biến thành nhân lực | linh hồn của game | INFERRED |
| F-068 | Hàng đợi việc | Xếp nhiều task khi station chưa xử lý xong task trước | base tự tiếp tục nhưng vẫn có thứ tự | có thì tốt | INFERRED |
| F-069 | Chọn theo năng lực | Ưu tiên worker có suitability cao hơn cho task | tối ưu roster bằng hiểu biết, không bằng ngẫu nhiên | có thì tốt | `WorkSuitability_*`; EXTRACTED |
| F-070 | Ngăn tranh chấp slot | Từ chối assignment thứ hai khi slot đã bị giữ | scheduler không làm hai worker cùng giành một chỗ | cần thiết | INFERRED |

## Nhu cầu và năng suất

Căn cứ chỉ đáng quản lý nếu có lúc nó hoạt động tốt và có lúc nó trục trặc. Hunger, sanity và output tạo ra feedback để người chơi chăm worker thay vì bỏ mặc một dây chuyền tự chạy.

Tài liệu design có các núm WorkOutput và nguyên tắc tuning, nhưng full hunger/sanity runtime chưa nằm trong evidence register. Các dòng về nhu cầu được ghi INFERRED nơi cần.

| Mã | Tính năng | Người chơi làm gì | Cảm giác phục vụ | Mức độ | Bằng chứng |
|---|---|---|---|---|---|
| F-071 | Hunger decay | Để hunger giảm theo thời gian khi Pal làm việc | thấy lao động có chi phí sinh tồn | cần thiết | INFERRED |
| F-072 | Sanity decay | Để sanity giảm khi điều kiện làm việc kéo dài | base không chỉ là máy sản xuất | có thì tốt | INFERRED |
| F-073 | Ăn trong base | Cho worker tự lấy food từ storage theo policy | giữ dây chuyền chạy bằng hậu cần | có thì tốt | INFERRED |
| F-074 | Nghỉ ngơi | Để worker tạm dừng và hồi nhu cầu | thấy lịch làm việc có nhịp | có thì tốt | INFERRED |
| F-075 | Năng suất theo nhu cầu | Giảm output hoặc tốc độ khi hunger/sanity thấp | nhìn thấy quyết định chăm sóc có hậu quả | cần thiết | WorkOutput 300s→60s; REFERENCE |
| F-076 | Sick state | Nhận trạng thái lỗi cần chữa thay vì chỉ giảm một số | worker trở thành thứ cần quản lý | bỏ được | INFERRED |
| F-077 | Worker bị kẹt | Nhận thông báo khi path, station hoặc storage chặn task | có thể sửa base dựa trên nguyên nhân | có thì tốt | INFERRED |

## Tiến trình người chơi

Progression biến những hành động lặp lại thành cảm giác đang đi đâu đó. Nó cần phản hồi sớm để người mới hiểu game, nhưng cũng phải để khoảng trống cho mục tiêu dài.

Player level, EXP ratio, curve principle và status point là các phần được tài liệu progression nhắc tới. Giá trị XP cụ thể và save owner chưa được xác minh đầy đủ.

| Mã | Tính năng | Người chơi làm gì | Cảm giác phục vụ | Mức độ | Bằng chứng |
|---|---|---|---|---|---|
| F-078 | EXP gain | Nhận EXP từ combat, capture, craft hoặc khám phá | hành động khác nhau cùng đẩy một đường tiến bộ | cần thiết | Progression tables; REFERENCE |
| F-079 | EXP curve | Thấy level đầu lên nhanh hơn về sau | đầu game phản hồi rộng, cuối game có mục tiêu | cần thiết | First impression/upward mobility; REFERENCE |
| F-080 | Level up | Đạt ngưỡng rồi nhận level mới và mở giới hạn | một khoảnh khắc xác nhận mình đã mạnh hơn | linh hồn của game | Player level 1–55+; REFERENCE |
| F-081 | Level gate | Bị chặn ở recipe/area khi chưa đủ level | thế giới có thứ để quay lại sau | cần thiết | Progression tables; REFERENCE |
| F-082 | Status point | Nhận point rồi chọn attribute muốn tăng | build nhân vật mang dấu tay người chơi | có thì tốt | INFERRED |
| F-083 | Phân bổ status | Đầu tư point vào weight, health, stamina hoặc damage | giải một vấn đề cụ thể bằng build | có thì tốt | INFERRED |
| F-084 | Stat scaling | Thấy level/point thay đổi stat trong combat và traversal | con số biến thành cảm giác khi chơi | cần thiết | Character stat fields; EXTRACTED |

## Technology và mở khóa

Technology tree là bản đồ lựa chọn. Nó nối resource và level với recipe, structure, equipment và station, nên UI chỉ là phần trình bày của một graph data.

150+ technology nodes và tier cost 1→10 là số reference. Prerequisite schema chi tiết và unlock persistence là yêu cầu tái tạo, không nên trình bày như declaration gốc nếu chưa có.

| Mã | Tính năng | Người chơi làm gì | Cảm giác phục vụ | Mức độ | Bằng chứng |
|---|---|---|---|---|---|
| F-085 | Technology node | Chọn node trong cây thay vì nhận unlock tuyến tính | tiến bộ có hướng do người chơi chọn | linh hồn của game | 150+ nodes; REFERENCE |
| F-086 | Prerequisite | Kiểm tra node trước đã mở trước khi mua node sau | mỗi lựa chọn tạo đường đi tiếp theo | cần thiết | INFERRED |
| F-087 | Technology cost | Tiêu technology point theo tier | mở khóa có giá và buộc ưu tiên | cần thiết | Tier 1≈1 point, Tier 4≈10; REFERENCE |
| F-088 | Unlock recipe | Mở công thức mới trong crafting menu | resource cũ có cách dùng mới | cần thiết | Technology tables; REFERENCE |
| F-089 | Unlock structure | Mở building class hoặc station mới | progression làm căn cứ đổi hình dạng | cần thiết | BuildObject tables; REFERENCE |
| F-090 | Unlock equipment | Mở weapon, armor hoặc tool mới | khả năng chiến đấu tăng theo lựa chọn | có thì tốt | Item tables; REFERENCE |
| F-091 | Unlock station | Mở nơi cho worker hoặc craft recipe hoạt động | base phát triển theo technology | có thì tốt | Work/build tables; REFERENCE |

## Thế giới và spawn

Spawn tạo nhịp cho exploration: cùng một khu vực có thể khác đi theo giờ, thời tiết, level range và mật độ. Không có spawn variation, map nhanh chóng thành danh sách cố định.

Spawner header có nhóm Pal/NPC, level/number ranges, Weight, OnlyTime, OnlyWeather, SpawnerType và randomizer flag. Respawn timer cụ thể chưa có evidence.

| Mã | Tính năng | Người chơi làm gì | Cảm giác phục vụ | Mức độ | Bằng chứng |
|---|---|---|---|---|---|
| F-092 | Biome context | Đi vào vùng có tập creature, resource và điều kiện riêng | mỗi khu vực có lời hứa khác nhau | linh hồn của game | Spawner/character tables; REFERENCE |
| F-093 | Weighted spawner | Bốc một row theo `Weight` thay vì spawn mọi thứ như nhau | chờ encounter hiếm có ý nghĩa | cần thiết | `PalWildSpawnerDatabaseRow.Weight`; EXTRACTED |
| F-094 | Level range | Spawn creature trong `LvMin/LvMax` của row | độ nguy hiểm thay đổi theo khu vực | cần thiết | `LvMin/LvMax`; EXTRACTED |
| F-095 | Count range | Spawn số lượng trong `NumMin/NumMax` | mật độ encounter không đứng yên | có thì tốt | `NumMin/NumMax`; EXTRACTED |
| F-096 | Time condition | Chỉ cho row hợp lệ ở thời điểm trong ngày | đi cùng một nơi vào giờ khác cho kết quả khác | có thì tốt | `OnlyTime`; EXTRACTED |
| F-097 | Weather condition | Lọc encounter theo weather hiện tại | thời tiết thay đổi quyết định đi hay chờ | có thì tốt | `OnlyWeather`; EXTRACTED |
| F-098 | Nocturnal flag | Nhận diện creature hoạt động ban đêm và săn theo lịch | thế giới có nhịp sống, không chỉ timer spawn | có thì tốt | `Nocturnal`; EXTRACTED |

## Hầm ngục và encounter lớn

Dungeon gom exploration, combat và reward thành một chuyến có mục tiêu. Nó tồn tại để người chơi chuẩn bị rồi bước vào một không gian có nhịp khác overworld.

Evidence hiện có dungeon tier ranges và drop schema tám slot; exact room graph, boss runtime và reset rule chưa có. Các dòng không có declaration được ghi UNKNOWN hoặc INFERRED.

| Mã | Tính năng | Người chơi làm gì | Cảm giác phục vụ | Mức độ | Bằng chứng |
|---|---|---|---|---|---|
| F-099 | Dungeon entrance | Tìm hoặc dùng entrance để chuyển từ overworld vào encounter riêng | có điểm chuẩn bị và điểm không quay lại | có thì tốt | Dungeon documents; REFERENCE |
| F-100 | Dungeon tier | Chọn hoặc nhận tier phù hợp với progression | thử thách có thang độ rõ | cần thiết | Dungeon tier ranges; REFERENCE |
| F-101 | Encounter room | Đi qua chuỗi phòng có enemy, loot hoặc điều kiện | mỗi bước trong chuyến đi tạo quyết định | có thì tốt | INFERRED |
| F-102 | Boss flag | Nhận diện encounter là boss để đổi UI, music hoặc reward | biết mình đang bước vào khoảnh khắc lớn | có thì tốt | Boss flag chưa có declaration runtime; UNKNOWN |
| F-103 | Boss tuning | Gặp cùng creature với multiplier difficulty riêng | một identity cũ có thể trở thành thử thách mới | có thì tốt | INFERRED |
| F-104 | Treasure reward | Mở reward container sau khi vượt encounter | kết thúc chuyến đi có payoff hữu hình | cần thiết | 8-slot drop schema; REFERENCE |
| F-105 | First-defeat reward | Nhận phần thưởng đặc biệt một lần theo player state | lần đầu bước vào có ý nghĩa hơn farm lặp | có thì tốt | First-defeat persistence chưa có source; UNKNOWN |

## Kinh tế và cửa hàng

Economy làm cho item có giá trị tương đối. Khi người chơi có thể đổi vật phẩm hoặc currency, họ phải cân nhắc giữ, dùng hay bán output của mình.

Item/economy tables và shop header family là nguồn chính. Offer rotation, stock limit và permission là feature cần thiết kế thêm, không có số gốc trong dossier.

| Mã | Tính năng | Người chơi làm gì | Cảm giác phục vụ | Mức độ | Bằng chứng |
|---|---|---|---|---|---|
| F-106 | Currency item | Nhặt, giữ hoặc tiêu một loại item làm tiền | giá trị của output được quy về một đơn vị so sánh | cần thiết | Shop/item tables; REFERENCE |
| F-107 | Shop offer | Mở cửa hàng và xem danh sách hàng hiện có | thế giới có nơi đổi resource thành lựa chọn | cần thiết | `PalItemShop*`; OBSERVED |
| F-108 | Giá mua | Trả currency hoặc item để lấy hàng | quyết định mua có cost rõ | cần thiết | Economy tables; REFERENCE |
| F-109 | Giá bán | Đổi item dư thành currency hoặc resource khác | inventory dư vẫn có đường ra | có thì tốt | Economy tables; REFERENCE |
| F-110 | Mua bằng item | Đưa đúng vật phẩm yêu cầu thay vì chỉ tiền | shop phản ánh scarcity của thế giới | có thì tốt | `PalShopProductRequireItemData.h`; OBSERVED |
| F-111 | Stock limit | Thấy hàng không vô hạn hoặc bị giới hạn theo offer | mua sắm cần thời điểm | bỏ được | INFERRED |
| F-112 | Shop refresh | Quay lại sau thời gian hoặc điều kiện để xem offer mới | thế giới tiếp tục vận động | bỏ được | INFERRED |

## Nhân giống và nâng cấp Pal

Breeding cho collection một đường đầu tư dài hạn; condenser cho phép những bản sao dư thừa trở thành tiến bộ. Hai hệ thống này giữ cho việc bắt thêm Pal còn ý nghĩa sau khi roster đã đầy.

Combo key→child ID, BreedCombiRank 1–9, condenser rank 1–5, sacrifice 1→100+ và replicated breeding progress đều có evidence. Trait inheritance chi tiết chưa có full table.

| Mã | Tính năng | Người chơi làm gì | Cảm giác phục vụ | Mức độ | Bằng chứng |
|---|---|---|---|---|---|
| F-113 | Breeding farm | Đưa hai parent vào farm và cung cấp điều kiện cần | collection biến thành đầu tư có kế hoạch | có thì tốt | `PalMapObjectBreedFarmModel.h`; EXTRACTED |
| F-114 | Parent selection | Chọn cặp parent theo species, gender hoặc mục tiêu | build creature bắt đầu trước khi có con | có thì tốt | `PalCombiUniqueDatabaseRow`; EXTRACTED |
| F-115 | Breeding progress | Theo dõi tiến độ farm theo thời gian | chờ đợi có state nhìn thấy được | cần thiết | `BreedProgressTime` replicated; EXTRACTED |
| F-116 | Egg result | Nhận egg hoặc child result sau khi hoàn tất | một chu kỳ dài trả về bất ngờ mới | cần thiết | Breeding docs; REFERENCE |
| F-117 | Combination lookup | Tra cặp parent để ra child ID | designer kiểm soát kết quả bằng data thay vì if-else | có thì tốt | Combo key→child ID; EXTRACTED |
| F-118 | Trait inheritance | Chuyển một phần passive/stat từ parent sang child | làm breeding trở thành bài toán build | có thì tốt | Full inheritance table chưa có; UNKNOWN |
| F-119 | Condenser rank | Dùng bản sao và sacrifice để nâng rank Pal | bản dư thừa vẫn có giá trị | có thì tốt | Rank 1–5, sacrifice 1→100+; REFERENCE |

## Multiplayer và lưu trữ

Co-op chỉ có giá trị khi thành quả của một người có thể trở thành input của người khác mà không làm hỏng state. Multiplayer và save vì vậy là nền bảo vệ cho mọi feature, không phải phần thêm sau cùng.

Replication declarations, `FPalInstanceID` và `FGuid` là evidence. Guild schema, permissions, save slots, migration và reconnect behavior vẫn UNKNOWN trong dossier.

| Mã | Tính năng | Người chơi làm gì | Cảm giác phục vụ | Mức độ | Bằng chứng |
|---|---|---|---|---|---|
| F-120 | Server authority | Gửi intent lên server rồi nhận kết quả được validate | co-op có cùng sự thật thay vì ai cũng tự sửa | linh hồn của game | Multiplayer declarations; REFERENCE |
| F-121 | Client intent | Bấm attack, build, capture hoặc craft như một yêu cầu | input nhanh nhưng không tự quyết state | cần thiết | INFERRED clean-room |
| F-122 | Replicated property | Nhận bản sao state từ authority ở client liên quan | người chơi khác thấy cùng kết quả | cần thiết | `BreedProgressTime`, `TargetBreedItemIds`; EXTRACTED |
| F-123 | OnRep notification | Cập nhật UI/effect khi property replicated đổi | presentation phản ứng đúng lần state đổi | có thì tốt | `OnRep_UpdateBreedProgress`; EXTRACTED |
| F-124 | Relevancy | Chỉ đồng bộ actor/state cho client cần nhìn thấy | thế giới nhiều người không gửi mọi thứ cho mọi người | có thì tốt | INFERRED |
| F-125 | Stable instance ID | Giữ creature/item/structure nhận diện được qua reorder | save và reference không vỡ khi array đổi | cần thiết | `FPalInstanceID`, `FGuid`; EXTRACTED |
| F-126 | Save profile | Thoát game rồi quay lại thấy roster, inventory và tech còn đó | thành quả có trọng lượng dài hạn | linh hồn của game | Full save schema chưa có; UNKNOWN |

## Cách đọc catalog này

Đừng biến 126 dòng thành 126 task độc lập. Một dòng thường là mặt ngoài của nhiều hệ thống: cưỡi cần movement, creature instance, partner data và camera; một item instance lại được loot, craft, equipment, shop và save dùng chung. Bước tiếp theo là gom các dòng có chung owner và chung mutation thành hệ thống `S-xxx`.

Các số neo trong catalog đến từ evidence đã có: `DT_PalMonsterParameter` có 663+ entries; `EPalWorkSuitability` có 13 loại việc; drop schema có tám slot; technology có 150+ nodes; `DT_ItemDataTable` có 1984+ rows theo tài liệu phân tích; build objects 300+; player level 1–55+; Pal khoảng 50. Những con số này nói về source/data scope, không tự động nói rằng người chơi sẽ gặp đúng từng entry trong một lượt chơi.

---

**Bằng chứng cho chương này.** Mỗi dòng trỏ tới field, bảng hoặc declaration cụ thể khi có thể. `EXTRACTED` dựa trên các header như `PalCharacterParameterDatabaseRow.h`, `EPalWorkSuitability.h`, `PalWildSpawnerDatabaseRow.h`, `CaptureResult.h`, `PalCombiUniqueDatabaseRow.h` và `PalMapObjectBreedFarmModel.h`. `REFERENCE` dựa trên `Documents/Book/Palworld_Whitepaper/C00–C15` và `02.Palworld/Documents/`; `INFERRED` là taxonomy/hành vi clean-room; `UNKNOWN` giữ nguyên ở nơi full runtime owner, dungeon runtime, scheduler hoặc guild/save schema chưa có bằng chứng.
