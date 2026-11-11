# Schema nền MVP: gộp migration, thu gọn bảng, ví credit AI

Status: accepted (thay thế ADR 0006; sửa lại phần lưu dữ liệu của ADR 0004 và 0005 theo bảng `phonemes` mới)

Ngày: 2026-11-10

## Context

Schema cũ lớn dần qua nhiều migration, có nhiều bảng chưa dùng (`phoneme_confusions`, `usage_counters`, `plan_limits`, `tutor_lesson_events`, `content_audit_log` riêng cho nội dung...). Nhiều cột chỉ để chờ tính năng chưa làm (`cefr_level` của từ điển, `pos_pronunciations`, `source`). Cơ chế hạn mức theo bộ đếm (ADR 0006) khó mở rộng khi mỗi tính năng AI tốn chi phí khác nhau theo số token.

Dự án chưa có dữ liệu thật ở prod, nên có thể làm lại baseline thay vì chồng thêm migration.

## Decision

1. **Một baseline** `V1__init_schema.sql` (schema) và `V2__seed_reference_data.sql` (44 âm vị, cấu hình credit AI, 2 tài khoản dev). Các migration cũ bị xoá. Bản thiết kế gốc nằm ở `docs/design/schema-mvp.sql`.
2. **Ví credit AI thay bộ đếm năng lượng**:
   - `ai_settings` (giá trị 1 credit theo VND, ví Free, ngưỡng tối thiểu để bắt đầu), `ai_feature_prices` (giá token vào/ra theo tính năng), `ai_wallets` (số dư mỗi người), `ai_usage_logs` (nhật ký trừ credit).
   - Free: 20 credit mỗi ngày, làm mới 00:00 giờ Việt Nam. Pro: `credits_per_month` theo từng đơn, nạp lười khi dùng. Giáo viên và admin có ví không tự làm mới.
   - Chi phí = `ceil((in*giaVao + out*giaRa)/1e6/giaTri1Credit)`, tối thiểu 1. Phiên gia sư tính cố định 3 credit khi phiên bắt đầu; cần số dư tối thiểu 5 để tạo phiên.
   - Chấm shadowing bằng Azure vẫn không tốn credit (giữ quyết định của ADR 0006).
3. **Gói Pro theo đơn**: `pro_plans` và `pro_orders`; gói đang hiệu lực đọc qua view `v_active_pro` và `SubscriptionQueryService.activeOrder`.
4. **Luyện tập**:
   - `sentence_attempts` có `total_score`, `client_request_id` (duy nhất theo người dùng, để gửi lại không tạo lượt trùng), `listen_count`.
   - Âm vị lưu trong `sentence_attempt_phonemes` với `target_phoneme_id`, `heard_phoneme_id`, `alt_phoneme_id`; `azure_symbol` giữ ký hiệu gốc Azure trả về; phải có ít nhất một trong ba: âm đích, âm nghe được, ký hiệu gốc. Âm Azure không có trong `phonemes` vẫn được lưu (kèm ký hiệu gốc) để hiển thị và xử lý lại khi bổ sung bộ chuyển đổi.
   - `user_sentence_review` bỏ cột trạng thái: bỏ ghim là xoá dòng; lý do chỉ còn `low_score`, `manual`.
   - Thứ tự câu trong bài lấy theo `start_ms` (1-based), không còn cột `sort_order`.
5. **Ngữ âm**: bỏ `phoneme_confusions` và không có cột mẹo trong `phonemes`. Mẹo sửa phát âm tiếng Việt (44 âm) là dữ liệu tĩnh ở `resources/pronunciation-tips.json`, đọc bởi `PhonemeTips` cho kết quả shadowing và gia sư AI. Đặt ở tệp tĩnh vì đặc tả không có chức năng sửa mẹo, mẹo là dữ liệu chung cần người có chuyên môn ngữ âm duyệt, và thay đổi đi qua pull request. Nếu sau này cần sửa không qua triển khai thì thêm bảng riêng chỉ quản trị viên sửa, không đưa lại cột vào `phonemes`. `ai_feedback` dùng khoá chính `attempt_id`, chỉ giữ `content`.
6. **Gia sư**: `tutor_offers` có người dùng, bài, lượt và `accepted_at`/`declined_at` (nhận hoặc bỏ qua, tối đa một trong hai); `tutor_lesson_events` ghi việc bật/tắt Chế độ gia sư; `tutor_sessions` bỏ `offer_id`, `live_model`, `charged` (đã trừ khi `started_at` khác null).
7. **Nhật ký chung** `audit_logs` cho nội dung, quản trị và báo lỗi; ghi chép lại tên người thực hiện và tên đối tượng; `actor_id` null là "Hệ thống" và không có khóa ngoại tới `users`. Bảng chỉ thêm: trigger chặn sửa và xóa dòng.
8. **Từ điển**: `dictionary_words` bỏ `cefr_level`, `pos_pronunciations`, `source`, mốc thời gian; nghĩa là jsonb với khoá `meaning_vi`, `definition_en`, `definition_vi`.
9. **Từ vựng** (giữ quyết định của ADR 0008, 0009, 0010): từ đã lưu là thẻ trong bộ `kind = 'saved'` của học viên, có `dict_word_id`, `dict_meaning_no`, `source_sentence_id`; không còn bảng `user_saved_words`, `vocab_card_phonetics`, `vocab_deck_tags`. Phiên học là `vocab_sessions`, chống ghi trùng câu trả lời bằng `client_request_id`. Trạng thái thẻ không lưu mà suy từ `user_card_progress` (chưa có dòng là Mới; khoảng ôn từ 21 ngày là Đã thuộc; nhớ liên tiếp dưới 2 lần là Đang học; còn lại là Đang ôn). Bộ, phần, thẻ không còn `slug`, `sort_order`, tên tiếng Việt và mức CEFR; thứ tự theo `created_at`.
10. **Toàn vẹn dữ liệu**: đơn thanh toán có trạng thái `canceled` và mỗi học viên tối đa một đơn `pending`; câu và thẻ chỉ xóa mềm (khóa ngoại từ lượt làm và nhật ký ôn thẻ là `RESTRICT`) để không mất lịch sử học; `sentence_attempts.duration_ms` lưu thời gian mỗi lượt; trigger `updated_at` cho mọi bảng có cột này; hai view thống kê tính "ngày" theo `users.timezone`.
11. Hibernate `ddl-auto: validate` bật ở mọi profile kể cả test; mọi entity phải khớp bảng.

## Các phương án đã loại bỏ

1. **Thêm migration chồng lên schema cũ**: giữ được lịch sử nhưng kéo theo các bảng và cột thừa, khó đọc với người mới. Prod chưa có dữ liệu nên không đáng.
2. **Giữ bộ đếm theo tính năng**: không phản ánh chi phí thật của từng lần gọi LLM.

## Consequences

- Phải xoá database local và staging rồi chạy lại Flyway (checksum của V1 và V2 đã đổi). Dữ liệu bài học nạp lại bằng `backend/seed/seed-lessons.sh`.
- API đổi, frontend cần cập nhật (task riêng): `lessonId` thay `lessonSlug`, `clientRequestId` bắt buộc khi gửi bài nghe chép, trường `credit` thay `usage`, `offerId` kiểu số, không còn `cefrLevel` ở từ điển, `GET /api/v1/credits/balance` thay `/me/usage`. Từ vựng: bộ gọi theo id thay `slug` (`/vocab/decks/{deckId}`, `?deck={deckId}`); id từ đã lưu là id thẻ; `translationVi` thành `meaningVi`, `explanationEn/Vi` thành `definitionEn/Vi`; bỏ `cefrLevel`, `nameVi`, `imageUrl` của thẻ; bài nguồn trả `lessonId` thay `slug`.
- Từ nay quy tắc "không sửa V1" áp dụng lại: thay đổi schema thêm bằng migration mới theo tên có mốc thời gian.
- Phần chưa có trong schema nền: kiểm tra trình độ (`assessment_*`), kế hoạch hằng ngày, danh mục lỗi chấm điểm, bảng tiến độ bài học; thêm bằng migration khi làm các tuần tương ứng.

## Điều chỉnh baseline sau rà soát (2026-11-11)

Rà soát so với bản trước refactor thấy baseline làm mất một số chức năng đang chạy. Cả nhóm đồng ý làm lại baseline một lần nữa thay vì thêm migration, nên thay đổi được gộp thẳng vào `V1` và `V2` (đã phản ánh ở các mục 4, 5, 6, 7, 10 phía trên). Nhóm không còn migration nào đi kèm; ai đã chạy bản baseline trước phải xoá database local một lần nữa (checksum V1 và V2 đổi) rồi chạy lại Flyway và nạp seed.

- Giữ các quyết định ban đầu của ADR này: dictionary không có `cefr_level`, `pos_pronunciations`, `source`; chỉ dùng video YouTube (không có bài nguồn âm thanh); thứ tự nhóm và thẻ theo `created_at` (chức năng nhập thẻ từ Excel hoặc CSV do người làm module NT bổ sung thứ tự nếu cần).
- Dữ liệu từ điển nạp từ `dictionary_words.enriched.jsonl` (IPA và âm thanh bổ sung), đã chuyển thành `backend/seed/dictionary-words.sql.gz` với khoá nghĩa `meaning_vi`.
- Chưa làm: trừ credit của phiên gia sư theo từng lượt (hiện trừ một lần lúc bắt đầu), bài kiểm tra trình độ, thống kê làm mới mỗi giờ.
