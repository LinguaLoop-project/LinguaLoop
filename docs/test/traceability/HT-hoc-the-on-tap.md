# Truy vết AC → test: HT-hoc-the-on-tap

> Nguồn AC: `docs/srs/HT-hoc-the-on-tap/usecase.md`. **Loại**: D (dương), A (âm), B (biên). **Trạng thái**: `Đã có`, `Một phần`, `Thiếu`, `Thủ công`, `Không áp dụng` (định nghĩa ở [mục lục](../TRACEABILITY-AC-TEST.md#định-nghĩa-trạng-thái)).

Tổng hợp: 81 AC, 12 đã có test, 20 một phần, 49 thiếu.

| AC | Tên | UC | Loại | Test | Trạng thái |
|---|---|---|:---:|---|---|
| AC-HT-01 | Ẩn bộ Từ đã lưu khỏi danh sách bộ từ | UC-HT-01 |  |  | Thiếu |
| AC-HT-02 | Hiển thị mục Đang học | UC-HT-01 |  |  | Thiếu |
| AC-HT-03 | Khóa bộ Pro đối với gói Free | UC-HT-01 |  |  | Thiếu |
| AC-HT-04 | Mở toàn bộ phần của bộ Pro đối với gói Pro | UC-HT-01 |  |  | Thiếu |
| AC-HT-05 | Chọn Học từ mới tự động mở phần đầu tiên còn thẻ Mới | UC-HT-01 |  |  | Thiếu |
| AC-HT-06 | Hiển thị gợi ý khi chưa học bộ nào | UC-HT-01 |  |  | Thiếu |
| AC-HT-07 | Chọn ôn riêng bộ từ đang xem | UC-HT-01 |  |  | Thiếu |
| AC-HT-08 | Xử lý khi không tải được danh sách hoặc bộ không tồn tại | UC-HT-01 |  |  | Thiếu |
| AC-HT-09 | Đánh giá mức độ thuộc khi trả lời đúng ở Trắc nghiệm, Trắc nghiệm đảo và Đoán | UC-HT-02 |  |  | Thiếu |
| AC-HT-10 | Đánh giá mức độ thuộc khi trả lời sai ở mọi cách học | UC-HT-02 |  |  | Thiếu |
| AC-HT-11 | Chấm điểm trực tiếp ở cách học Flashcard theo SM-2 | UC-HT-02 |  |  | Thiếu |
| AC-HT-12 | Hiển thị màn hình cách học Đoán | UC-HT-02 |  |  | Thiếu |
| AC-HT-13 | Kiểm tra, Gợi ý, Không biết và quy đổi mức độ thuộc ở cách học Đoán | UC-HT-02 |  |  | Thiếu |
| AC-HT-14 | Chia phần học thành các lượt tối đa 10 thẻ và đổi cách học từ thẻ hiện tại | UC-HT-02 |  |  | Thiếu |
| AC-HT-15 | Từ chối mở phần bị khóa của bộ Pro | UC-HT-02 |  |  | Thiếu |
| AC-HT-16 | Tự động gửi lại câu trả lời khi mất kết nối | UC-HT-02 |  |  | Thiếu |
| AC-HT-17 | Hàng đợi ôn gộp chung mọi bộ | UC-HT-03 |  |  | Thiếu |
| AC-HT-18 | Giới hạn tối đa 50 thẻ mỗi lượt ôn | UC-HT-03 |  |  | Thiếu |
| AC-HT-19 | Thẻ chọn Quên được đưa xuống cuối lượt | UC-HT-03 |  |  | Thiếu |
| AC-HT-20 | Thẻ Đã thuộc vẫn vào hàng đợi khi đến hạn | UC-HT-03 |  |  | Thiếu |
| AC-HT-21 | Thông báo khi không có thẻ đến hạn | UC-HT-03 |  |  | Thiếu |
| AC-HT-22 | Không ghi trùng nhật ký khi gửi lại lúc mất mạng | UC-HT-03 |  |  | Thiếu |
| AC-HT-23 | Đồng bộ số lượng thẻ đến hạn với trang Hôm nay | UC-HT-03 |  |  | Thiếu |
| AC-HT-24 | Chọn câu theo điểm thấp nhất rồi theo ngày thêm sớm nhất | UC-HT-04 | D, B | DailyReviewApiIntegrationTest.plan_picksLowestScoreFirst_thenTheEarlierAddedSentence_BR_HT_20_AC_HT_24 | Đã có |
| AC-HT-25 | Không lấy câu của chế độ khác để bù khi thiếu câu | UC-HT-04 | D, B | DailyReviewApiIntegrationTest.plan_aModeWithFewerSentences_isNotToppedUpFromTheOther_BR_HT_20_AC_HT_25 | Đã có |
| AC-HT-26 | Loại bỏ câu thuộc bài đã gỡ xuất bản hoặc bài Pro với gói Free | UC-HT-04 | D, A | DailyReviewApiIntegrationTest.plan_leavesOutDraftDeletedAndProSentences_butProLearnersKeepThem_BR_HT_20_AC_HT_26 | Đã có |
| AC-HT-27 | Hiển thị hộp hỏi bỏ khỏi danh sách khi đạt từ 80 điểm | UC-HT-04 |  |  | Thiếu |
| AC-HT-28 | Không hỏi bỏ câu khi đạt dưới 80 điểm | UC-HT-04 |  |  | Thiếu |
| AC-HT-29 | Không tự động gỡ câu nếu tác nhân chọn Giữ lại | UC-HT-04 |  |  | Thiếu |
| AC-HT-30 | Chủ động bỏ câu khỏi danh sách ở bất kỳ mức điểm nào | UC-HT-04 |  |  | Thiếu |
| AC-HT-31 | Lượt ôn câu Nghe chép được tính là lượt làm lại | UC-HT-04 |  |  | Thiếu |
| AC-HT-32 | Bỏ qua câu không đánh dấu đã ôn hôm nay | UC-HT-04 | D | DailyReviewApiIntegrationTest.skip_postponesTheSentenceToTomorrow_withoutCountingItAsReviewed_AC_HT_32_AC_HT_61 | Một phần (chỉ backend; chưa test nút Bỏ qua câu này ở giao diện) |
| AC-HT-33 | Lỗi chấm phát âm Shadowing không đánh dấu đã ôn hôm nay | UC-HT-04 | A | DailyReviewApiIntegrationTest.markReviewed_withoutARecentAttempt_isRefusedAndNothingIsMarked_BR_HT_21_AC_HT_33 | Một phần (chỉ kiểm tra không có lượt thật thì không đánh dấu; chưa test nhánh lỗi chấm của Azure ở giao diện) |
| AC-HT-34 | Thông báo khi không còn câu cần ôn trong ngày | UC-HT-04 | D | DailyReviewApiIntegrationTest.plan_nothingToReview_returnsEmptyPlanAndNextDueTime_AC_HT_40; `frontend/src/features/review/flow.test.ts` | Một phần (chưa test thông báo "không còn câu nào cần ôn" ở trang Ôn câu riêng) |
| AC-HT-35 | Giữ kết quả khi dừng giữa chừng hoặc mất kết nối | UC-HT-04 |  |  | Thiếu |
| AC-HT-36 | Cấu trúc, thứ tự và định mức của phiên Ôn tập kiến thức theo thời lượng mục tiêu ngày | UC-HT-05 | D, B | DailyReviewApiIntegrationTest.plan_quotaFollowsTheDailyGoal_AC_HT_36; DailyReviewApiIntegrationTest.plan_defaultGoalWith35Cards_takesTwentyCardsAndTwoPlusTwoSentences_AC_HT_36; `frontend/src/features/review/flow.test.ts` | Đã có |
| AC-HT-37 | Chọn Ôn thêm ở cuối phiên chỉ lấy thêm thẻ từ vựng | UC-HT-05 | D | DailyReviewApiIntegrationTest.plan_quotaReachedWithMoreCardsDue_showsDoneAndSuggestionsButKeepsAMoreRound_AC_HT_58_AC_HT_60; `frontend/src/features/review/flow.test.ts` | Đã có |
| AC-HT-38 | Không chọn lại câu đã ôn khi mở phiên lần hai trong ngày | UC-HT-05 | D | DailyReviewApiIntegrationTest.markReviewed_afterARealAttempt_removesTheSentenceFromTheNextPlan_AC_HT_38; DailyReviewApiIntegrationTest.plan_hidesSentencesReviewedTodayInTheLearnersTimezone_BR_HT_21 | Đã có |
| AC-HT-39 | Bảo toàn tiến độ khi thoát phiên giữa chừng | UC-HT-05 | D | DailyReviewApiIntegrationTest.plan_cardsReviewedTodayAreDeductedFromTheDailyQuota_BR_HT_24_AC_HT_59; DailyReviewApiIntegrationTest.plan_sentencesReviewedTodayAreDeductedPerMode_BR_HT_24_AC_HT_59 | Một phần (chỉ kiểm tra dữ liệu và kế hoạch phiên sau; chưa test nút Thoát ở giao diện) |
| AC-HT-40 | Xử lý khi thiếu phần thẻ, thiếu phần câu hoặc trống cả hai | UC-HT-05 | D, B | DailyReviewApiIntegrationTest.plan_nothingToReview_returnsEmptyPlanAndNextDueTime_AC_HT_40; `frontend/src/features/review/flow.test.ts` | Đã có |
| AC-HT-41 | Thông báo lỗi khi không tải được phiên ôn tập | UC-HT-05 |  |  | Thiếu |
| AC-HT-58 | Ôn đủ Định mức ôn ngày thì trang Hôm nay báo đã ôn xong dù còn việc tồn | UC-HT-05 | D | DailyReviewApiIntegrationTest.plan_everythingWithinTheQuotaDone_isAllDoneEvenWithBacklogLeft_AC_HT_58; DailyReviewApiIntegrationTest.plan_quotaReachedWithMoreCardsDue_showsDoneAndSuggestionsButKeepsAMoreRound_AC_HT_58_AC_HT_60 | Một phần (backend có test; trang Hôm nay mới kiểm tay trên trình duyệt, chưa có test giao diện) |
| AC-HT-59 | Phiên mới chỉ lấy phần định mức còn lại của ngày | UC-HT-05 | D, B | DailyReviewApiIntegrationTest.plan_cardsReviewedTodayAreDeductedFromTheDailyQuota_BR_HT_24_AC_HT_59; DailyReviewApiIntegrationTest.plan_onlyReviewAnswersCount_notLearningAndNotYesterday_andACardCountsOnce_AC_HT_59; DailyReviewApiIntegrationTest.plan_sentencesReviewedTodayAreDeductedPerMode_BR_HT_24_AC_HT_59 | Đã có |
| AC-HT-60 | Ôn thêm không tính định mức và không lấy câu | UC-HT-05 | D | DailyReviewApiIntegrationTest.plan_quotaReachedWithMoreCardsDue_showsDoneAndSuggestionsButKeepsAMoreRound_AC_HT_58_AC_HT_60; `frontend/src/features/review/flow.test.ts` | Đã có |
| AC-HT-61 | Câu bỏ qua không quay lại trong ngày và được chọn lại vào ngày mai | UC-HT-05 | D, B | DailyReviewApiIntegrationTest.skip_postponesTheSentenceToTomorrow_withoutCountingItAsReviewed_AC_HT_32_AC_HT_61; DailyReviewApiIntegrationTest.skip_cameBackTheNextDay_AC_HT_61; DailyReviewApiIntegrationTest.skip_theOnlyRemainingSentence_letsTheDayFinish_AC_HT_61 | Đã có |
| AC-HT-76 | Ít thẻ đến hạn thì khung bài lấp bằng từ mới rồi thẻ củng cố | UC-HT-05 |  |  | Thiếu |
| AC-HT-77 | Giới hạn từ mới mỗi ngày và khi ngày mai đã nhiều thẻ | UC-HT-05 |  |  | Thiếu |
| AC-HT-78 | Thẻ củng cố không làm đổi lịch ôn | UC-HT-05 |  |  | Thiếu |
| AC-HT-79 | Câu luyện thêm lấp chỗ thiếu nhưng không vào danh sách Câu cần ôn | UC-HT-05 |  |  | Thiếu |
| AC-HT-80 | Gói Free không lấp bằng nội dung Pro | UC-HT-05 |  |  | Thiếu |
| AC-HT-81 | Học viên chưa học bộ nào được chọn bộ khởi đầu theo cấp độ | UC-HT-05 |  |  | Thiếu |
| AC-HT-42 | Lưu một nghĩa mới từ từ điển | UC-HT-06 |  |  | Thiếu |
| AC-HT-43 | Lưu trùng một nghĩa đang lưu không báo lỗi | UC-HT-06 |  |  | Thiếu |
| AC-HT-44 | Lưu nhiều nghĩa khác nhau của cùng một từ | UC-HT-06 |  |  | Thiếu |
| AC-HT-45 | Bấm vào từ chia dạng trong bài học sẽ lưu từ gốc kèm câu của bài | UC-HT-06 |  |  | Thiếu |
| AC-HT-46 | Bỏ lưu rồi lưu lại giữ nguyên tiến độ cũ | UC-HT-06 |  |  | Thiếu |
| AC-HT-47 | Bảo mật riêng tư đối với từ đã lưu | UC-HT-06 |  |  | Thiếu |
| AC-HT-48 | Giữ nguyên nút khi mất kết nối | UC-HT-06 |  |  | Thiếu |
| AC-HT-49 | Hiển thị mặc định mục Từ đã lưu và chuyển mục | UC-HT-07 |  |  | Thiếu |
| AC-HT-50 | Lọc kết hợp theo từ khóa, nguồn và trạng thái | UC-HT-07 |  |  | Thiếu |
| AC-HT-51 | Tính đúng bốn số tổng trên trang Từ đã lưu | UC-HT-07 |  |  | Thiếu |
| AC-HT-52 | Bỏ lưu nhiều từ cùng lúc | UC-HT-07 |  |  | Thiếu |
| AC-HT-53 | Hiển thị hướng dẫn khi chưa lưu từ nào | UC-HT-07 |  |  | Thiếu |
| AC-HT-54 | Thông báo lỗi khi không tải được danh sách | UC-HT-07 |  |  | Thiếu |
| AC-HT-55 | Thêm bộ từ vựng cá nhân thành công | UC-HT-08 | D, B | MyDeckApiIntegrationTest.create_validName_returnsTheDeckAndListsItForTheOwner_AC_HT_55; MyDeckApiIntegrationTest.create_trimsTheName_andAcceptsExactly100Characters_AC_HT_55; `frontend/src/features/vocab/myDecks.test.ts` | Một phần (backend và logic kiểm tên có test; hộp thoại và tab chạy thử trên trình duyệt, chưa có test giao diện) |
| AC-HT-56 | Sửa và xóa bộ từ vựng cá nhân | UC-HT-08 | D | MyDeckApiIntegrationTest.rename_updatesTheNameInTheList_AC_HT_56; MyDeckApiIntegrationTest.delete_removesTheDeck_itsCardsLeaveTheReviewQueue_andTheNameCanBeReused_AC_HT_56 | Một phần (backend có test, gồm thẻ rời hàng đợi ôn; chưa có test giao diện) |
| AC-HT-57 | Từ chối khi tên bộ từ trống, quá dài hoặc bị trùng | UC-HT-08 | A, B | MyDeckApiIntegrationTest.create_blankOrTooLongName_returns400WithNameError_AC_HT_57; MyDeckApiIntegrationTest.create_duplicateNameOfTheSameLearner_returns409_butAnotherLearnerMayUseIt_AC_HT_57; MyDeckApiIntegrationTest.rename_invalidOrDuplicateName_isRejectedAndKeepsTheOldName_AC_HT_57; `frontend/src/features/vocab/myDecks.test.ts` | Một phần (backend và logic kiểm tên có test; lỗi hiện dưới ô nhập mới kiểm trên trình duyệt) |
| AC-HT-62 | Thêm nhóm và thẻ rồi học được ngay | UC-HT-09 | D | MyDeckContentApiIntegrationTest.addGroupAndCard_thenTheDeckIsLearnableAndReviewable_AC_HT_62 | Một phần (backend có test, gồm học và ôn bộ cá nhân; giao diện mới kiểm tay trên trình duyệt) |
| AC-HT-63 | Sửa thẻ và đổi tên nhóm giữ nguyên vị trí và tiến độ | UC-HT-09 | D | MyDeckContentApiIntegrationTest.updateCardAndRenameGroup_keepPositionAndProgress_AC_HT_63 | Một phần (chỉ backend) |
| AC-HT-64 | Xóa thẻ hoặc nhóm thì thẻ rời hàng đợi ôn | UC-HT-09 | D | MyDeckContentApiIntegrationTest.deleteCardAndGroup_leaveTheReviewQueue_andTheDeckRemains_AC_HT_64 | Một phần (chỉ backend; hộp xác nhận xóa mới kiểm tay) |
| AC-HT-65 | Từ trùng, tên nhóm trùng hoặc không hợp lệ bị từ chối | UC-HT-09 | A, B | MyDeckContentApiIntegrationTest.duplicateWordOrGroupNameAndInvalidFields_areRejected_AC_HT_65 | Một phần (chỉ backend; lỗi hiện tại đúng ô dùng lại logic của giáo viên, chưa có test riêng) |
| AC-HT-66 | Nhập thẻ từ tệp, một dòng sai thì không thẻ nào được thêm | UC-HT-09 | D, A | MyDeckContentApiIntegrationTest.importCards_validFileAddsAllInOrder_invalidFileAddsNone_AC_HT_66 | Một phần (chỉ backend) |
| AC-HT-67 | Chỉ chủ bộ được xem và sửa nội dung bộ cá nhân, không có ảnh | UC-HT-09 | A | MyDeckContentApiIntegrationTest.otherLearnerGets404_teacherGets403_andImagesAreRefused_AC_HT_67; `frontend/src/features/vocab/deckManagePaths.test.ts` | Đã có |
| AC-HT-68 | Nhóm chưa có thẻ không mở học được | UC-HT-09 | B | MyDeckContentApiIntegrationTest.emptyGroup_isAPartWithNoCards_andDoesNotBreakTheDeck_AC_HT_68 | Một phần (backend có test; nút "Chưa có thẻ" ở trang bộ mới kiểm tay) |
| AC-HT-69 | Điền sẵn thẻ từ từ điển và âm thanh tự lấy từ từ điển | UC-HT-09 | D, A | MyDeckContentApiIntegrationTest.cardsOfWordsInTheDictionaryGetItsAudio_byHandAndByImport_AC_HT_69 | Một phần (backend: âm thanh tự lấy từ từ điển khi nhập tay, đổi loại từ và nhập tệp; ô tra từ điển điền sẵn biểu mẫu mới kiểm tay trên trình duyệt) |
| AC-HT-70 | Thêm thẻ từ ô tra từ điển vào một nhóm của bộ cá nhân | UC-HT-10 | D | MyDeckQuickAddApiIntegrationTest.fromTheDictionary_addsACardWithTheMeaningContentAtTheEndOfTheGroup_AC_HT_70 | Một phần (backend có test; nút và khung chọn bộ mới kiểm tay trên trình duyệt) |
| AC-HT-71 | Thêm từ câu bài học thì thẻ nhớ câu gốc | UC-HT-10 | D | MyDeckQuickAddApiIntegrationTest.fromALessonSentence_keepsTheSentenceTranslationAndLesson_AC_HT_71 | Một phần (backend có test; luồng từ câu bài học mới kiểm tay trên trình duyệt) |
| AC-HT-72 | Tạo bộ và nhóm ngay trong khung | UC-HT-10 | D, B | MyDeckQuickAddApiIntegrationTest.intoADeckAndGroupJustCreated_theFirstCardGoesToTheDefaultGroup_AC_HT_72; `frontend/src/features/vocab/quickAdd.test.ts` | Một phần (chuỗi tạo bộ, nhóm rồi thêm thẻ và hoàn tác có test logic; giao diện mới kiểm tay) |
| AC-HT-73 | Từ đã có trong bộ bị từ chối | UC-HT-10 | A | MyDeckQuickAddApiIntegrationTest.aWordAlreadyInTheDeck_isRefusedAndTheGroupHoldingItIsNamed_AC_HT_73; `frontend/src/features/vocab/quickAdd.test.ts` | Một phần (backend và ánh xạ lỗi có test; lời nhắn trong khung mới kiểm tay) |
| AC-HT-74 | Từ chối khi nghĩa, bộ hay bài học không dùng được | UC-HT-10 | A | MyDeckQuickAddApiIntegrationTest.missingMeaningForeignDeckOrForbiddenLesson_areRefused_AC_HT_74; MyDeckQuickAddApiIntegrationTest.teachersAreRefusedAndAnonymousIs401_AC_HT_74; `frontend/src/features/vocab/quickAdd.test.ts` | Đã có |
| AC-HT-75 | Nút Thêm vào bộ chỉ dành cho học viên và cùng điều kiện với nút Lưu | UC-HT-10 | A | MyDeckQuickAddApiIntegrationTest.teachersAreRefusedAndAnonymousIs401_AC_HT_74 | Một phần (API từ chối giáo viên; việc ẩn nút với giáo viên và ở dạng chia chưa có test giao diện, chưa kiểm tay) |
