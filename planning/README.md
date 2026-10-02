# LinguaLoop — Kế hoạch làm việc (Kế & Lâm)


## 1. Cách làm việc

- **Mỗi việc là một Issue.** Tên theo dạng `[Nghe chép] Chấm từng từ`: ngoặc vuông là tên trang giao diện, phần sau là việc cụ thể. Không dùng mã màn hình.
- Mỗi Issue có người làm (assignee) và nhãn **Tuần N**. PR ghi `Closes #số` để Issue tự đóng khi merge.
- **Mỗi người làm trọn một việc từ database, backend đến giao diện**, để tự chạy và tự test được, không chờ người kia.
- Cuối mỗi tuần: demo đúng mục tiêu của tuần đó. Việc chưa xong chuyển sang tuần sau, ghi rõ lý do.

## 2. Lộ trình 12 tuần

Tên trong dấu `backtick` là trang mockup trong `design/`.

| Tuần | Demo cuối tuần | Kế | Lâm |
|---|---|---|---|
| **1** | Đăng ký, đăng nhập, vào trang Hôm nay có sidebar | Auth, phân quyền, ghi nhật ký (`login`, `register`, `verify`) | Bộ giao diện chung: màu, nút, bảng, 3 layout. Quota tạm. Thử gọi Azure Speech |
| **2** | Học viên chọn bài, nghe chép một câu, thấy kết quả tô màu | Nghe chép: phát câu, gõ lại, chấm từng từ, lưu lượt làm (`dictation`)  | Seed bài mẫu, thư viện bài học (`lessons`, `topic`, `lesson`) |
| **3** | Giáo viên đăng bài, học viên làm bài đó | Giáo viên: chủ đề, danh sách bài, soạn bài, cắt câu (teacher `topics`, `lessons`, `compose`) | Nghe chép hoàn thiện: câu cần ôn, ghi chú, lịch sử. Chốt cách lưu điểm âm vị Azure |
| **4** | Tra từ, lưu từ. Đọc một câu và nhận điểm | Từ điển, tra từ, từ đã lưu (`vocab`, `mywords`), giáo viên: từ điển | Shadowing: ghi âm, gửi Azure, nhận điểm tổng, trừ lượt (`shadowing`) |
| **5** | Học một bộ từ và ôn thẻ. Xem lỗi từng âm vị | Bộ từ, học và ôn thẻ (`deck`, `group`, `vocab`), giáo viên: bộ từ | Kết quả shadowing: tô từ, âm vị, mẹo sửa. Giáo viên: ngữ âm (`phoneme`) |
| **6** | **Chốt cam kết sản phẩm và metric.** Chạy trọn luồng học | Cài đặt, quyền riêng tư, sửa lỗi tồn đọng (`settings`) | Câu cần ôn lại, sửa lỗi tồn đọng của nghe chép và shadowing |
| **7** | Người mới: đăng ký, onboarding, làm bài test, ra trình độ | Onboarding, kiểm tra trình độ, ngân hàng câu hỏi (`test`, teacher `qbank`) | Hạn mức Free/Pro thật. Bảng giá, thanh toán thử |
| **8** | Trang Hôm nay hiện kế hoạch theo điểm yếu | Cung cấp số thẻ đến hạn và gợi ý bài | Thống kê điểm yếu, bộ sinh đề xuất, trang Hôm nay (`weakness`, `index`) |
| **9** | Hết lượt chấm, nâng cấp Pro, chấm tiếp. Luyện sửa lỗi có so sánh trước/sau | Báo lỗi nội dung | Paywall, gói Pro. Luyện sửa lỗi: cặp âm, nghe chép nhắm lỗi, đo cải thiện |
| **10** | Admin xử lý người dùng và báo lỗi | Admin: người dùng, báo lỗi (`users`, `reports`) | Nhận xét AI, video khẩu hình (Pro). **Dịch vụ AI gợi ý mức CEFR cho câu** (dùng chung kết nối LLM với nhận xét AI) |
| **11** | Admin thấy tổng quan. Học viên thấy tiến độ. Giáo viên được AI gợi ý CEFR | Admin: tổng quan, duyệt bộ từ, nhật ký. Kiểm tra lại trình độ. **Giáo viên: nút "Nhờ AI gợi ý CEFR" trong soạn bài và màn duyệt CEFR (`compose`, `cefr`)** | Tiến độ, so sánh ghi âm trước/sau. Admin: hạn mức, đăng ký Pro (`limits`, `subs`), danh mục lỗi chấm điểm (`errors`) |
| **12** | Test với nhóm người khảo sát, sửa lỗi, tài liệu | Cả hai: test người dùng thật, sửa lỗi, độ phủ test, AI Usage Log | |

**Gợi ý CEFR cho câu (soạn bài của giáo viên) chia hai phần:** Lâm làm dịch vụ AI (gọi LLM, trả mức CEFR và độ tin cậy) vì cùng kết nối LLM với nhận xét AI. Kế làm phần giao diện: nút trong màn soạn bài và màn duyệt, vì các màn của giáo viên thuộc phần của Kế. Ở tuần 3, soạn bài chỉ có ô chọn CEFR bằng tay.

**Trước tuần 8** (điểm yếu và luyện sửa lỗi), Kế và Lâm họp riêng để chốt thiết kế database và kế hoạch cho phần này (ví dụ cách lưu lượt luyện từ đơn, cách phân biệt lượt học bài với lượt luyện sửa lỗi). Những thay đổi đó chỉ thêm cột nên làm muộn không ảnh hưởng nghe chép và shadowing đã xong.

Việc ít quan trọng (Could) nằm ở tuần 10–11. Nếu trễ, cắt ở đó trước: bộ từ của tôi, danh mục lỗi, lịch sử thay đổi của giáo viên.

## 3. Ai sở hữu bảng dữ liệu

Chỉ chủ sở hữu được sửa cấu trúc và ghi vào bảng. Người kia đọc qua service hoặc view đã thoả thuận.

| Chủ | Nhóm | Bảng (tên trong database) |
|---|---|---|
| **Kế** | Người dùng | `users`, `user_consents` |
| **Kế** | Từ điển, từ vựng | `dictionary_words`, `dictionary_meanings`, `dictionary_word_forms`, `dictionary_pronunciations`, `user_saved_words` |
| **Kế** | Bộ từ, ôn thẻ | `vocab_deck_categories`, `vocab_decks`, `vocab_deck_tags`, `vocab_groups`, `vocab_cards`, `vocab_card_phonetics`, `user_card_progress`, `vocab_study_sessions`, `vocab_review_logs` |
| **Kế** | Kiểm tra trình độ | `assessment_items`, `assessment_sessions`, `assessment_responses`, `assessment_results` |
| **Kế** | Vận hành | `content_error_reports`, `content_audit_log` |
| **Lâm** | Bài học | `topics`, `lessons`, `sentences` |
| **Lâm** | Gói, hạn mức | `user_subscriptions`, `plan_limits`, `usage_counters` |
| **Lâm** | Lượt luyện | `sentence_attempts`, `sentence_attempt_words`, `sentence_attempt_phonemes`, `user_lesson_progress`, `user_lesson_mode_progress`, `user_sentence_review`, `sentence_notes` |
| **Lâm** | Ngữ âm | `phonemes`, `phoneme_confusions`, `minimal_pairs` |
| **Lâm** | Danh mục lỗi chấm điểm | `error_categories` (nghe chép và shadowing dùng bảng này để gắn nhãn lỗi, nên Lâm sở hữu cả bảng lẫn màn admin `errors`) |
| **Lâm** | Điểm yếu, kế hoạch | `practice_recommendations`, `daily_plans`, `daily_plan_items`, `ai_feedback` |

Các view `v_user_*`, `v_topic_lesson_counts`, `v_vocab_deck_counts` thuộc người sở hữu bảng gốc của view đó. Bảng `sentences` có cột `cefr_source`, `cefr_suggested_by_ai`, `ai_confidence` (cho gợi ý CEFR): Lâm sở hữu bảng, nên Lâm là người ghi các cột này. Soạn bài của giáo viên (Kế) ghi câu và bài qua `LessonAuthoringService` của Lâm, không ghi thẳng vào bảng.

Nền tảng chung: **Kế** giữ backend (cấu hình, bảo mật, API client, router). **Lâm** giữ bộ giao diện chung (màu, nút, layout). Người kia cần thêm gì thì gửi PR nhỏ cho chủ file duyệt.

## 4. Chỗ hai người phải khớp nhau

Đây là các chỗ code của người này phải gọi code của người kia. Để không ai phải chờ ai, làm theo ba bước:

1. **Người cung cấp viết "hợp đồng" trước**: một interface (tên hàm, tham số, giá trị trả về) và một bản giả trả dữ liệu cố định. Ví dụ `ConsentService.hasConsent(userId)` bản giả luôn trả "đã đồng ý". Merge vào `main` trước hạn trong bảng.
2. **Người cần dùng gọi interface đó** ngay, chạy được với bản giả.
3. **Đến hạn, người cung cấp thay bản giả bằng bản thật** mà không đổi interface. Người cần dùng không phải sửa gì.

Nếu muốn đổi interface sau khi đã merge, báo người kia trước.

| Bên cần | Bên cung cấp | Cái cần có | Dùng cho chức năng nào (mục 2) | Hạn |
|---|---|---|---|---|
| Lâm | Kế | Kiểm tra người dùng đã đồng ý dùng AI (`ConsentService`) | Tuần 4: shadowing chỉ gửi giọng đi chấm khi đã đồng ý | Tuần 1 |
| Cả hai | Kế | Ghi nhật ký khi thêm, sửa, xoá (`AuditService`) | Tuần 3: soạn bài của giáo viên. Tuần 5: ngữ âm. Tuần 7: ngân hàng câu hỏi | Tuần 1 |
| Kế | Lâm | Đọc bài và câu để luyện (`SentenceQueryService`) | Tuần 2: nghe chép lấy câu của bài | Đầu tuần 2 |
| Kế | Lâm | Thêm, sửa, đăng bài và câu (`LessonAuthoringService`) | Tuần 3: giáo viên soạn bài, cắt câu, đăng bài. Tuần 11: lưu mức CEFR do AI gợi ý | Tuần 2 |
| Lâm | Kế | Tra từ trong từ điển (`DictionaryQueryService`) | Tuần 5: ngữ âm, chọn từ cho cặp tối thiểu | Tuần 4 |
| Lâm | Kế | Số thẻ đến hạn (`SrsQueryService`) | Tuần 8: trang Hôm nay hiện việc ôn thẻ | Tuần 7 |
| Lâm | Kế | Trình độ hiện tại của người dùng (`LevelQueryService`) | Tuần 8: trang Hôm nay giao bài nghe chép đúng trình độ | Tuần 7 |
| Kế | Lâm | Gói và hạn dùng của người dùng (`SubscriptionQueryService`) | Tuần 6: Cài đặt, tab Gói. Tuần 10: admin, chi tiết người dùng | Tuần 6 |
| Kế | Lâm | Chấm phát âm một đoạn ghi âm (`PronunciationScoringService`, dùng chung Azure với shadowing) | Tuần 7: kiểm tra trình độ, phần nói | Tuần 5 |
| Kế | Lâm | Gợi ý mức CEFR cho câu (`CefrSuggestService`: nhận câu, trả mức CEFR và độ tin cậy) | Tuần 11: nút "Nhờ AI gợi ý CEFR" trong soạn bài và màn duyệt CEFR | Tuần 10 |
| Kế | Lâm | View số lượt chấm và AI theo ngày | Tuần 11: tổng quan admin | Tuần 10 |

## 5. Quy ước

**Mã nguồn**
- Backend chia theo feature, trong mỗi feature chia tầng: `com.lingualoop.backend.<feature>.{controller,service,repository,entity,dto}` (ví dụ `dictation.controller`, `dictation.service`). Cấu trúc đầy đủ xem [cau-truc-du-an.md](cau-truc-du-an.md). Frontend: `src/features/<feature>/`.
- Nhánh: `<type>/<mo-ta-ngan>`, `type` giống type của commit (`feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `ci`), ví dụ `feat/dictation-cham-tung-tu`, `fix/shadowing-timeout`. Xem [CODING-CONVENTION.md](../docs/convention/CODING-CONVENTION.md) mục 1. PR nhỏ, vài ngày. Mọi PR đều do người còn lại duyệt.

**Database (Flyway)**
- Không sửa `V1`, `V2`. Migration mới đặt tên theo thời gian: `V20261001_1530__ten_viec.sql`.
- Bật `spring.flyway.out-of-order=true` cho dev và test. Ưu tiên thêm cột nullable hoặc có giá trị mặc định.
- Migration sửa bảng của người kia phải qua PR và được người đó duyệt.

**Phải chốt sớm** (đổi sau rất tốn):
1. Cách xác thực: tự quản mã (bảng token) hay dùng dịch vụ ngoài. Kế chốt.
2. Cách lưu điểm âm vị từ Azure: tuần 1 Lâm thử API thật, chốt cách lưu trong tuần 3 (trước shadowing tuần 4). Lâm chốt.
3. Quy ước mã lỗi và định dạng lỗi của API. Kế soạn, Lâm duyệt.

**Mỗi tuần**: cập nhật Project, ghi AI Usage Log, đo độ phủ test.
