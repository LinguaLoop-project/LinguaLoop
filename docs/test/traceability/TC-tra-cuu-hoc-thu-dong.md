# Truy vết AC → test: TC-tra-cuu-hoc-thu-dong

> Nguồn AC: `docs/srs/TC-tra-cuu-hoc-thu-dong/usecase.md`. **Loại**: D (dương), A (âm), B (biên). **Trạng thái**: `Đã có`, `Một phần`, `Thiếu`, `Thủ công`, `Không áp dụng` (định nghĩa ở [mục lục](../TRACEABILITY-AC-TEST.md#định-nghĩa-trạng-thái)).

Tổng hợp: 44 AC, 9 đã có test, 3 một phần, 27 thiếu, 5 thủ công.

| AC | Tên | UC | Loại | Test | Trạng thái |
|---|---|---|:---:|---|---|
| AC-TC-01 | Chỉ hiển thị các bài học đã xuất bản và chưa bị xóa | UC-TC-01 |  |  | Thiếu |
| AC-TC-02 | Hiển thị trang tổng quan thư viện bài học | UC-TC-01 |  |  | Thiếu |
| AC-TC-03 | Lọc kết hợp theo chủ đề, trình độ, bài miễn phí và từ khóa | UC-TC-01 |  |  | Thiếu |
| AC-TC-04 | Lọc bài học theo tiến độ của riêng tác nhân | UC-TC-01 |  |  | Thiếu |
| AC-TC-05 | Phân trang danh sách bài học và hiển thị tiến độ nghe chép | UC-TC-01 |  |  | Thiếu |
| AC-TC-06 | Xem danh sách chủ đề và chi tiết một chủ đề | UC-TC-01 |  |  | Thiếu |
| AC-TC-07 | Từ chối khi mở chủ đề chưa hiển thị hoặc không tồn tại | UC-TC-01 |  |  | Thiếu |
| AC-TC-08 | Hiển thị nhãn khóa đối với bài Pro trong danh sách khi dùng gói Free | UC-TC-01 |  |  | Thiếu |
| AC-TC-09 | Thông báo khi không có bài học nào khớp bộ lọc | UC-TC-01 |  |  | Thiếu |
| AC-TC-10 | Yêu cầu đăng nhập và xử lý khi mất kết nối | UC-TC-01 |  |  | Thiếu |
| AC-TC-44 | Bài học giới thiệu trên trang chủ cho khách chưa đăng nhập | UC-TC-01 | D, A, B | PublicLessonShowcaseIntegrationTest.guestWithoutToken_getsOnlyVisibleLessonsWithCardFields_atMostThreePerLevel_AC_TC_44; PublicLessonShowcaseIntegrationTest.hidesDraftDeletedPersonalAndSilentLessons_andTopicsWithoutVisibleLessons_AC_TC_44; PublicLessonShowcaseIntegrationTest.sameSeedKeepsTheSamePick_andAtMostThreePerLevel_AC_TC_44; PublicLessonShowcaseIntegrationTest.onlyReadingIsPublic_AC_TC_44 | Một phần (chưa có test giao diện cho khung trống và ẩn khi lỗi) |
| AC-TC-11 | Hiển thị thông tin chi tiết bài học và tối đa 3 bài liên quan | UC-TC-02 |  |  | Thiếu |
| AC-TC-12 | Từ chối hiển thị bài học chưa xuất bản, đã xóa hoặc không tồn tại | UC-TC-02 |  |  | Thiếu |
| AC-TC-13 | Hiển thị danh sách câu lời thoại theo đúng thứ tự câu | UC-TC-02 |  |  | Thiếu |
| AC-TC-14 | Khóa lời thoại và quyền luyện tập của bài Pro đối với gói Free | UC-TC-02 |  |  | Thiếu |
| AC-TC-15 | Mở toàn bộ lời thoại bài Pro đối với học viên gói Pro còn hạn | UC-TC-02 |  |  | Thiếu |
| AC-TC-16 | Tính đúng phần trăm tiến độ nghe chép trên trang chi tiết bài | UC-TC-02 |  |  | Thiếu |
| AC-TC-17 | Hiển thị huy hiệu điểm cao nhất của từng câu theo từng chế độ | UC-TC-02 |  |  | Thiếu |
| AC-TC-18 | Cung cấp đúng danh sách câu và kiểm tra quyền khi chuyển sang chế độ luyện tập | UC-TC-02 |  |  | Thiếu |
| AC-TC-19 | Tra từ trực tiếp và hiển thị đầy đủ thông tin mục từ | UC-TC-03 |  |  | Thiếu |
| AC-TC-20 | Bấm vào từ ở dạng chia tự động hiển thị mục từ gốc | UC-TC-03 |  |  | Thiếu |
| AC-TC-21 | Hiển thị đúng trạng thái Đã lưu cho từng nghĩa của riêng tác nhân | UC-TC-03 |  |  | Thiếu |
| AC-TC-22 | Mở Lưu từ ngay từ hộp tra từ điển | UC-TC-03 |  |  | Thiếu |
| AC-TC-23 | Thông báo khi từ không tồn tại trong từ điển | UC-TC-03 |  |  | Thiếu |
| AC-TC-24 | Thông báo lỗi khi mất kết nối lúc tra từ | UC-TC-03 |  |  | Thiếu |
| AC-TC-25 | Cuộn liên tục giữa các video hệ thống và đồng bộ lời thoại | UC-TC-04 | D, B | WatchApiIntegrationTest.feed_listsOnlyPublishedShortLibraryLessonsWithLinesInTimeOrder_AC_TC_25; WatchApiIntegrationTest.feed_keepsTheSameOrderForASeed_putsTheStartLessonFirst_andUnpracticedLessonsBeforePracticed_AC_TC_25; `frontend/src/features/watch/feed.test.ts` | Một phần (backend và logic chọn câu có test; cuộn và chỉ phát một video mới kiểm tay trên trình duyệt) |
| AC-TC-26 | Chỉnh tốc độ phát và bật/tắt phụ đề giữ nguyên khi lướt video | UC-TC-04 | D | `frontend/src/features/watch/feed.test.ts` | Một phần (đọc và giữ lựa chọn có test logic; giữ qua các video mới kiểm tay trên trình duyệt) |
| AC-TC-27 | Thích và bỏ thích video | UC-TC-04 | D, A | WatchApiIntegrationTest.like_thenLikeAgain_thenUnlikeTwice_countsOnlyOneLike_AC_TC_27; WatchApiIntegrationTest.like_aDraftOrMissingLesson_isNotFound_AC_TC_27 | Đã có |
| AC-TC-28 | Bấm vào từ trong lời thoại tạm dừng video và mở hộp Tra từ điển | UC-TC-04 | D |  | Thủ công (kiểm tay trên trình duyệt: bấm từ thì video dừng và mở hộp tra từ, đóng thì phát tiếp) |
| AC-TC-29 | Lưu câu từ video vào danh sách Câu cần ôn | UC-TC-04 | D, A | WatchApiIntegrationTest.saveSentence_withoutAnyAttempt_addsItToShadowingReview_andSavingAgainUnsavesIt_AC_TC_29; WatchApiIntegrationTest.saveSentence_ofADraftLessonOrADeletedSentence_isNotFound_AC_TC_29 | Đã có |
| AC-TC-30 | Chuyển từ video đang xem sang Thực hành shadowing của bài học | UC-TC-04 | D |  | Thủ công (kiểm tay: nút Luyện bài này mở /student/shadowing/<bài>) |
| AC-TC-31 | Mở Báo cáo nội dung đối với câu có vấn đề | UC-TC-04 | D |  | Thủ công (kiểm tay: nút Báo cáo mở hộp báo cáo gắn câu đang phát, video tạm dừng) |
| AC-TC-32 | Phân quyền video thuộc bài học Pro đối với Học viên thường | UC-TC-04 | A | WatchApiIntegrationTest.freeLearners_doNotGetProVideos_andAreToldSomeAreHidden_proLearnersGetThem_AC_TC_32; WatchApiIntegrationTest.anonymousIs401_andTeachersAre403_AC_TC_32; `frontend/src/features/watch/feed.test.ts` | Đã có |
| AC-TC-33 | Xử lý khi video lỗi nguồn phát hoặc mất kết nối mạng | UC-TC-04 | A |  | Thủ công (kiểm tay: lỗi nguồn phát hiện thông báo và nút Thử lại; chưa giả lập được lỗi YouTube) |
| AC-TC-34 | Lưu và bỏ lưu bài, gửi lặp không tạo bản ghi trùng | UC-TC-05 | D, B | SavedLessonApiIntegrationTest.save_thenSaveAgain_thenUnsaveTwice_keepsOneRowAndShowsInDetailAndFeed_AC_TC_34 | Đã có |
| AC-TC-35 | Từ chối lưu bài nháp, bài không tồn tại và bài Pro với gói Free | UC-TC-05 | A | SavedLessonApiIntegrationTest.save_aDraftMissingOrProLesson_isRefused_AC_TC_35 | Đã có |
| AC-TC-36 | Danh sách Bài đã lưu: mới lưu trước, đảo thứ tự, 12 bài mỗi trang, kèm tiến độ | UC-TC-05 | D, B | SavedLessonApiIntegrationTest.list_showsNewestFirst_canReverse_pagesBy12_andCarriesProgress_AC_TC_36; `frontend/src/features/lesson/savedLessons.test.ts` | Đã có |
| AC-TC-37 | Tìm theo tên và lọc theo tiến độ | UC-TC-05 | D, A | SavedLessonApiIntegrationTest.list_filtersByTitleAndByLearningState_AC_TC_37 | Đã có |
| AC-TC-38 | Bài không còn khả dụng vẫn nằm trong danh sách và bỏ lưu được | UC-TC-05 | B | SavedLessonApiIntegrationTest.list_keepsLessonsThatWereUnpublishedOrBecameProOnly_andTheyCanBeUnsaved_AC_TC_38 | Đã có |
| AC-TC-39 | Danh sách trống, riêng tư và quyền truy cập | UC-TC-05 | A | SavedLessonApiIntegrationTest.list_isEmptyForANewLearner_isPrivate_andRefusesAnonymousAndTeachers_AC_TC_39 | Đã có |
| AC-TC-40 | Nút Lưu bài và Lưu video đặt đúng chỗ | UC-TC-05 | D |  | Thủ công (kiểm tay trên trình duyệt: Lưu bài ở trang chi tiết, Lưu video và Lưu câu ở Học thụ động, thông báo, trang Bài đã lưu, bản điện thoại và nền tối) |
| AC-TC-41 | Lọc Bài đã lưu theo trình độ, chủ đề, miễn phí, bài ngắn và giới hạn cỡ trang | UC-TC-05 |  |  | Thiếu |
| AC-TC-42 | Thống kê Bài đã lưu | UC-TC-05 |  |  | Thiếu |
| AC-TC-43 | Bỏ lưu hàng loạt các bài đã xong | UC-TC-05 |  |  | Thiếu |
