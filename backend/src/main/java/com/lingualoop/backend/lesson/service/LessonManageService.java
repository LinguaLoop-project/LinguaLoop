package com.lingualoop.backend.lesson.service;

import java.util.UUID;

import com.lingualoop.backend.common.response.PageResponse;
import com.lingualoop.backend.lesson.dto.LessonManageView;
import com.lingualoop.backend.lesson.dto.request.RestoreLessonRequest;
import com.lingualoop.backend.lesson.dto.request.UnpublishLessonRequest;
import com.lingualoop.backend.lesson.dto.request.UpdateLessonRequest;
import com.lingualoop.backend.lesson.dto.request.UpdateSentencesRequest;
import com.lingualoop.backend.lesson.enums.CefrLevel;

/**
 * Quản lý bài học thư viện của giáo viên và quản trị viên (UC-BH-01, 02, 04 đến 09). Trang đánh số từ 0, 10 bài mỗi
 * trang (BR-BH-16). Quyền (BR-BH-01, 02): giáo viên chỉ thao tác trên bài của mình, bài của người khác ném
 * {@code ForbiddenException}; bài không tồn tại hoặc đã xóa ném {@code LESSON_NOT_FOUND}. Mọi thao tác ghi đều ghi
 * nhật ký (BR-NK-03).
 */
public interface LessonManageService {

    /** Bộ lọc danh sách; {@code status} của giáo viên: {@code all}, {@code published}, {@code draft}, {@code deleted}. */
    record ListQuery(String q, UUID topicId, CefrLevel cefrLevel, boolean pro, String status, UUID ownerId) {
    }

    /** Bài của chính giáo viên; "Đã xóa" chỉ gồm bài xóa trong 30 ngày gần nhất (UC-BH-01, BR-BH-05). */
    PageResponse<LessonManageView.Item> listForTeacher(UUID teacherId, ListQuery query, int page);

    /**
     * Bài Đã xuất bản của mọi giáo viên, lọc được theo {@code ownerId} (UC-BH-01, BR-BH-02). Lọc trạng thái khác
     * {@code published} ném {@code ForbiddenException}.
     */
    PageResponse<LessonManageView.Item> listForAdmin(ListQuery query, int page);

    /** Chi tiết bài chưa xóa của giáo viên, kể cả Nháp (UC-BH-02). */
    LessonManageView.Detail getForTeacher(UUID teacherId, UUID lessonId);

    /** Chi tiết bài Đã xuất bản; bài Nháp ném {@code ForbiddenException} (AC-BH-10). */
    LessonManageView.Detail getForAdmin(UUID lessonId);

    /**
     * Sửa tiêu đề, chủ đề, trình độ, nhãn Pro (UC-BH-04, BR-BH-08). Tiêu đề sai ném {@code FieldValidationException};
     * trùng ném {@code LESSON_TITLE_TAKEN}; chủ đề không tồn tại ném {@code LESSON_TOPIC_NOT_FOUND}.
     */
    LessonManageView.Detail updateInfo(UUID teacherId, UUID lessonId, UpdateLessonRequest request);

    /**
     * Lưu các câu đã sửa và xóa các câu được chọn trong một lần (UC-BH-05, BR-BH-09, 13). Câu sai ném
     * {@code LESSON_SENTENCES_INVALID} với {@code details.errors[]} ({@code sentenceId}, {@code field}, {@code code});
     * xóa hết câu của bài Đã xuất bản ném {@code LESSON_MUST_KEEP_SENTENCE}.
     */
    LessonManageView.Detail updateSentences(UUID teacherId, UUID lessonId, UpdateSentencesRequest request);

    /**
     * Xuất bản bài Nháp (UC-BH-06, BR-BH-11). Bài đã xuất bản ném {@code LESSON_ALREADY_PUBLISHED}; chưa đủ điều kiện
     * ném {@code LESSON_NOT_PUBLISHABLE} kèm {@code details.noSentences} và {@code details.missingTranslation} (số thứ tự
     * các câu thiếu bản dịch, đánh từ 1).
     */
    void publish(UUID teacherId, UUID lessonId);

    /** Giáo viên gỡ bài của mình về Nháp, không cần lý do (UC-BH-07). Bài Nháp ném {@code LESSON_NOT_PUBLISHED}. */
    void unpublishByTeacher(UUID teacherId, UUID lessonId);

    /**
     * Quản trị viên gỡ bài Đã xuất bản về Nháp kèm lý do (UC-BH-07 luồng 2a, BR-BH-04); cũng dùng khi gỡ từ báo cáo
     * (UC-XL-06). Lý do sai ném {@code FieldValidationException} trên {@code reason}; bài Nháp hoặc đã xóa ném
     * {@code LESSON_NOT_PUBLISHED}.
     */
    void unpublishByAdmin(UUID adminId, UUID lessonId, UnpublishLessonRequest request);

    /** Xóa tạm bài, giữ 30 ngày (UC-BH-08, BR-BH-05). Bài đã xóa ném {@code LESSON_ALREADY_DELETED}. */
    void delete(UUID teacherId, UUID lessonId);

    /**
     * Khôi phục bài xóa trong 30 ngày về Nháp (UC-BH-09, BR-BH-06). Bài chưa xóa ném {@code LESSON_NOT_DELETED}; quá hạn
     * ném {@code LESSON_RESTORE_EXPIRED}; tiêu đề trùng ném {@code LESSON_TITLE_TAKEN} để giáo viên nhập tiêu đề mới;
     * video đã có bài khác ném {@code LESSON_VIDEO_TAKEN}.
     */
    void restore(UUID teacherId, UUID lessonId, RestoreLessonRequest request);
}
