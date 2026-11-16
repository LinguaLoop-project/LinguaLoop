# XL — Xử lý báo cáo học viên: Quy trình nghiệp vụ

## 1. Nguyên tắc

1. **Lỗi nội dung thì người tạo sửa, vi phạm thì nền tảng xử lý.** Báo cáo được định tuyến theo lý do ngay khi học viên gửi (BR-XL-01), giống cách các nền tảng học tập lớn tách báo cáo lỗi nội dung khỏi báo cáo vi phạm chính sách.
2. **Báo cáo không bị bỏ quên** nhờ nhắc nhở và giám sát (BR-XL-11), không chuyển qua lại giữa giáo viên và quản trị viên.
3. **Kiểm chứng việc sửa bằng bản chụp**: so nội dung hiện tại với nội dung lúc học viên báo (BR-XL-05) hoặc lúc bị gỡ (BR-XL-13), không chỉ dựa vào nhật ký sửa.
4. **Học viên chỉ gửi báo cáo**, không xem trạng thái hay kết quả (BR-BC-02).

## 2. Nguồn báo cáo

Học viên gửi báo cáo ở module BC (UC-BC-01) về một **câu** của bài học hoặc một **thẻ** của bộ thẻ. Mỗi báo cáo có đúng một lý do; lỗi nội dung kèm bản sửa đúng, còn Phụ đề lệch thời gian, Phản cảm và Khác kèm mô tả (BR-BC-05). Một học viên không gửi lặp cùng lý do cho cùng nội dung khi báo cáo cũ chưa xong (BR-BC-08). Khi lưu, hệ thống chụp lại giá trị hiện tại của nội dung bị báo (BR-BC-10).

## 3. Hai luồng xử lý

```
                         HỌC VIÊN gửi báo cáo (UC-BC-01)
                                       │
                 ┌──── lý do Phản cảm ─┴─ lý do khác ────┐
                 ▼                                         ▼
        CHỜ QUẢN TRỊ VIÊN                            CHỜ GIÁO VIÊN
        (luồng vi phạm)                          (luồng lỗi nội dung)
          │          │                            │           │          │
     Gỡ nội dung  Từ chối                   Sửa đúng trường  Từ chối   quá 7 ngày: nhắc giáo viên
     (UC-XL-04)  (UC-XL-03)                   (UC-XL-02)   (UC-XL-03)  quá 30 ngày: quản trị viên
          ▼          ▼                            ▼           ▼        được gỡ nội dung (UC-XL-04)
       ĐÃ XỬ LÝ    TỪ CHỐI                     ĐÃ XỬ LÝ     TỪ CHỐI
          │
     bài/bộ mang dấu "Bị gỡ do báo cáo" ──► giáo viên sửa ──► gửi yêu cầu ──► quản trị viên duyệt (UC-XL-05)
```

Báo cáo có 4 trạng thái (BR-XL-02): **Chờ giáo viên**, **Chờ quản trị viên**, **Đã xử lý**, **Từ chối**. Hai trạng thái Đã xử lý và Từ chối là kết thúc.

| Từ | Đến | Người thực hiện | UC | Điều kiện |
|---|---|---|---|---|
| (học viên gửi) | Chờ giáo viên | Học viên | UC-BC-01 | Lý do không phải Phản cảm |
| (học viên gửi) | Chờ quản trị viên | Học viên | UC-BC-01 | Lý do Phản cảm |
| Chờ giáo viên | Đã xử lý | Giáo viên chủ | UC-XL-02 | Trường tương ứng với lý do đã khác bản chụp của báo cáo mới nhất; bắt buộc ghi chú (BR-XL-05) |
| Chờ giáo viên | Từ chối | Giáo viên chủ | UC-XL-03 | Báo cáo không đúng; bắt buộc lý do |
| Chờ giáo viên | Từ chối | Quản trị viên | UC-XL-03 | Chỉ khi không có giáo viên xử lý (BR-XL-12) |
| Chờ giáo viên | Đã xử lý | Quản trị viên | UC-XL-04 | Chỉ khi báo cáo đã chờ quá 30 ngày (BR-XL-11); gỡ bài học hoặc bộ thẻ |
| Chờ quản trị viên | Đã xử lý | Quản trị viên | UC-XL-04 | Gỡ bài học hoặc bộ thẻ, gắn dấu "Bị gỡ do báo cáo" |
| Chờ quản trị viên | Từ chối | Quản trị viên | UC-XL-03 | Báo cáo không đúng |
| Mọi trạng thái đang mở | Từ chối | Quản trị viên | UC-XL-03 (2a) | Từ chối hàng loạt báo cáo rác của một học viên (BR-XL-14) |
| Mọi trạng thái đang mở | Đã xử lý | Hệ thống | UC-XL-06 | Câu hoặc thẻ bị xóa riêng, hoặc bài học, bộ thẻ bị xóa vĩnh viễn (BR-XL-08) |

Lý do từ chối, ghi chú xử lý, lý do gỡ và lý do từ chối yêu cầu xuất bản lại đều bắt buộc, dài 1 đến 500 ký tự (BR-XL-04).

## 4. Luồng lỗi nội dung

| Bước | Người thực hiện | UC | Ghi chú |
|---|---|---|---|
| 1. Xem báo cáo đang chờ mình | Giáo viên chủ | UC-XL-01 | Báo cáo trùng gộp một dòng; không thấy tên học viên (BR-XL-06, BR-XL-09) |
| 2a. Báo cáo đúng: sửa đúng trường rồi đánh dấu Đã xử lý | Giáo viên chủ | UC-XL-02 | Sửa tay hoặc áp dụng bản sửa đề xuất (BR-XL-10) |
| 2b. Báo cáo sai: từ chối kèm lý do | Giáo viên chủ | UC-XL-03 | Kết thúc |
| 3. Chưa xử lý sau 7 ngày | Hệ thống | UC-XL-06 | Nhãn "Quá hạn" và một thông báo cho giáo viên; quản trị viên lọc được dòng quá hạn |
| 4. Chưa xử lý sau 30 ngày | Quản trị viên | UC-XL-04 | Được gỡ bài học hoặc bộ thẻ, buộc giáo viên sửa rồi gửi duyệt mới xuất bản lại |

**Không có giáo viên xử lý** (nội dung chưa có giáo viên chủ, hoặc giáo viên chủ bị khóa): báo cáo vẫn ở Chờ giáo viên. Quản trị viên thấy qua bộ lọc "Không có giáo viên xử lý", rồi giao nội dung cho một giáo viên ngay từ chi tiết báo cáo (UC-QT-06; báo cáo đi theo giáo viên nhận, BR-QT-08) hoặc từ chối (BR-XL-12).

**Kiểm "đã sửa"**: trường tương ứng với lý do phải khác giá trị đã chụp của **báo cáo mới nhất** trong nhóm (BR-XL-05). Sửa trường khác, hoặc sửa rồi sửa lại về như cũ, không được tính. Nếu học viên vẫn báo sau một lần sửa, lần sửa đó chưa đúng và giáo viên phải sửa tiếp.

## 5. Luồng vi phạm

| Bước | Người thực hiện | UC | Ghi chú |
|---|---|---|---|
| 1. Xem báo cáo Phản cảm | Quản trị viên | UC-XL-01 | Thấy tên học viên, giáo viên chủ; giáo viên chủ không thấy báo cáo này |
| 2a. Vi phạm thật: gỡ nội dung và đóng báo cáo | Quản trị viên | UC-XL-04 | Bài học hoặc bộ thẻ về Nháp, mang dấu "Bị gỡ do báo cáo"; mọi báo cáo Phản cảm đang mở của bài học hoặc bộ thẻ được đóng cùng và câu, thẻ của chúng được chụp lại; giáo viên thấy lý do gỡ |
| 2b. Không vi phạm: từ chối | Quản trị viên | UC-XL-03 | Kết thúc |
| 3. Sửa và gửi yêu cầu xuất bản lại | Giáo viên chủ | UC-BH-06, UC-BT-05 | Chỉ gửi được khi mọi câu, thẻ bị báo đã khác bản chụp hoặc đã bị xóa |
| 4. Duyệt hoặc từ chối yêu cầu | Quản trị viên | UC-XL-05 | Xem so sánh lúc gỡ và hiện tại; duyệt thì xuất bản và bỏ dấu, từ chối thì giáo viên sửa tiếp |

Nếu giáo viên tự gỡ xuất bản hoặc xóa bài học, bộ thẻ trước khi quản trị viên xử lý, quản trị viên vẫn gỡ được để gắn dấu. Lần xuất bản hoặc khôi phục sau vẫn phải qua duyệt (UC-XL-04 nhánh 2a). Sau khi được duyệt, giáo viên sửa nội dung như bình thường (BR-BH-13), và học viên vẫn báo cáo được nếu có vấn đề mới.

## 6. Khi nội dung bị báo thay đổi

| Tình huống | Hệ quả với báo cáo đang mở | Quy tắc |
|---|---|---|
| Câu hoặc thẻ bị xóa riêng (xóa câu, xóa thẻ, xóa nhóm thẻ) | Hệ thống tự đóng ở Đã xử lý, ở cả hai luồng | BR-XL-08 |
| Bài học hoặc bộ thẻ bị xóa | Báo cáo lỗi nội dung tạm ẩn khỏi hàng đợi của giáo viên, giữ nguyên trạng thái; báo cáo Phản cảm vẫn hiện với quản trị viên | BR-XL-08 |
| Bài học hoặc bộ thẻ được khôi phục | Báo cáo đã ẩn hiện lại; nhờ vậy giáo viên không né được báo cáo bằng cách xóa rồi khôi phục | BR-XL-08 |
| Bài học hoặc bộ thẻ bị xóa vĩnh viễn (quá 30 ngày) | Hệ thống tự đóng ở Đã xử lý và ghi nhật ký trước khi xóa | BR-XL-08 |
| Nội dung được giao cho giáo viên khác (UC-QT-06, UC-QT-07) | Báo cáo lỗi nội dung đi theo giáo viên nhận, giữ Chờ giáo viên; báo cáo Phản cảm vẫn do quản trị viên xử lý | BR-QT-08, BR-XL-12 |

## 7. Chống lạm dụng

| Lạm dụng | Cách chặn | Quy tắc |
|---|---|---|
| Giáo viên tự phán xử nội dung phản cảm của mình | Báo cáo Phản cảm không qua giáo viên | BR-XL-01 |
| Giáo viên gỡ hoặc xóa trước để né, rồi xuất bản lại | Dấu "Bị gỡ do báo cáo" vẫn được gắn; xuất bản lại phải qua quản trị viên duyệt | BR-XL-13 |
| Giáo viên sửa cho có (sửa trường khác, sửa rồi sửa lại) | So với bản chụp của đúng trường tương ứng | BR-XL-05 |
| Giáo viên bỏ mặc báo cáo | Nhắc sau 7 ngày, quản trị viên giám sát, gỡ được sau 30 ngày | BR-XL-11 |
| Học viên gửi lặp một báo cáo | Không nhận báo cáo trùng khi báo cáo cũ chưa xong | BR-BC-08 |
| Học viên gửi rác ở nhiều nội dung | Quản trị viên thấy số báo cáo bị từ chối trong 30 ngày cạnh tên học viên, lọc "Học viên có nhiều báo cáo bị từ chối" (từ 5 trở lên), từ chối hàng loạt; lạm dụng thì khóa tài khoản (UC-QT-02) | BR-XL-14 |

## 8. Quyền và thông tin theo vai trò

| | Giáo viên chủ | Quản trị viên | Học viên |
|---|---|---|---|
| Xem báo cáo | Báo cáo lỗi nội dung về nội dung của mình | Mọi báo cáo, mọi trạng thái | Không |
| Thao tác | Sửa theo báo cáo, từ chối (lỗi nội dung); gửi yêu cầu xuất bản lại | Gỡ nội dung, từ chối (Phản cảm); từ chối hoặc giao nội dung khi không có giáo viên xử lý; gỡ báo cáo lỗi quá 30 ngày; từ chối hàng loạt theo học viên; duyệt xuất bản lại | Chỉ gửi báo cáo |
| Lọc danh sách | Trạng thái, loại nội dung, lý do, "Quá hạn", tên bài học hoặc bộ thẻ | Như giáo viên, thêm giáo viên chủ, học viên đã báo, "Học viên có nhiều báo cáo bị từ chối", "Không có giáo viên xử lý" | — |
| Tên học viên đã báo | Không thấy | Thấy, kèm số báo cáo đã gửi và số bị từ chối trong 30 ngày | — |
| Lý do, mô tả, bản sửa đề xuất, ngày gửi | Thấy (với báo cáo của mình) | Thấy | — |
| Lý do từ chối, ghi chú xử lý, lý do gỡ, lý do từ chối yêu cầu | Thấy | Thấy | Không |

Nguồn: BR-XL-02, BR-XL-03, BR-XL-04, BR-XL-09, BR-XL-12, BR-XL-14.

## 9. Lịch sử xử lý

Mọi thao tác trên báo cáo, kể cả khi hệ thống tự đóng, ẩn hoặc nhắc, được ghi vào lịch sử xử lý của từng báo cáo: người thực hiện (hoặc "Hệ thống"), vai trò, thời điểm, trạng thái mới và ghi chú. Lịch sử không sửa được và hiển thị trong chi tiết báo cáo (BR-XL-07). Báo cáo vẫn được giữ khi nội dung gốc bị gỡ xuất bản hoặc bị xóa (BR-BC-04).
