package com.lingualoop.backend.common.exception;

import org.springframework.http.HttpStatus;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Mã lỗi trả về cho client trong {@link ErrorResponse#code()}. Frontend dựa vào
 * mã này để xử lý, không dựa vào message. Feature cần mã riêng thì thêm vào đây
 * qua PR, đặt tên theo dạng {@code <FEATURE>_<VAN_DE>} (vd {@code LESSON_NOT_PUBLISHED}).
 */
@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    VALIDATION_FAILED(HttpStatus.BAD_REQUEST, "Dữ liệu không hợp lệ"),
    BAD_REQUEST(HttpStatus.BAD_REQUEST, "Yêu cầu không hợp lệ"),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "Bạn cần đăng nhập"),
    TOKEN_INVALID(HttpStatus.UNAUTHORIZED, "Phiên đăng nhập không hợp lệ hoặc đã hết hạn"),
    FORBIDDEN(HttpStatus.FORBIDDEN, "Bạn không có quyền thực hiện thao tác này"),
    NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy dữ liệu"),
    METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "Phương thức không được hỗ trợ"),
    CONFLICT(HttpStatus.CONFLICT, "Dữ liệu bị trùng hoặc xung đột"),
    PAYLOAD_TOO_LARGE(HttpStatus.CONTENT_TOO_LARGE, "Tệp tải lên quá lớn"),
    UNSUPPORTED_MEDIA_TYPE(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Định dạng dữ liệu không được hỗ trợ"),
    QUOTA_EXCEEDED(HttpStatus.TOO_MANY_REQUESTS, "Bạn không đủ credit AI"),

    AUTH_INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "Email hoặc mật khẩu chưa đúng"),
    AUTH_ACCOUNT_LOCKED(HttpStatus.LOCKED, "Tài khoản tạm thời bị khoá do đăng nhập sai nhiều lần"),
    AUTH_ACCOUNT_DISABLED(HttpStatus.FORBIDDEN, "Tài khoản đã bị khoá bởi quản trị viên"),
    AUTH_EMAIL_NOT_VERIFIED(HttpStatus.FORBIDDEN, "Email chưa được xác thực"),
    AUTH_EMAIL_TAKEN(HttpStatus.CONFLICT, "Email này đã được đăng ký"),
    AUTH_LINK_INVALID(HttpStatus.BAD_REQUEST, "Liên kết không hợp lệ, đã hết hạn hoặc đã được sử dụng"),
    AUTH_REFRESH_INVALID(HttpStatus.UNAUTHORIZED, "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại"),
    AUTH_GOOGLE_TOKEN_INVALID(HttpStatus.UNAUTHORIZED, "Không thể đăng nhập bằng Google"),
    AUTH_GOOGLE_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE, "Tạm thời không đăng nhập được bằng Google"),
    AUTH_GOOGLE_LINK_CONFLICT(HttpStatus.CONFLICT, "Email này đã liên kết với một tài khoản Google khác"),
    AUTH_CURRENT_PASSWORD_WRONG(HttpStatus.BAD_REQUEST, "Mật khẩu hiện tại chưa đúng"),

    LESSON_PRO_REQUIRED(HttpStatus.FORBIDDEN, "Bạn cần gói Pro để xem nội dung này"),
    LESSON_TITLE_TAKEN(HttpStatus.CONFLICT, "Tiêu đề đã tồn tại"),
    LESSON_TOPIC_NOT_FOUND(HttpStatus.BAD_REQUEST, "Không tìm thấy chủ đề này"),
    LESSON_TRANSCRIPT_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE,
            "Tạm thời không tạo được lời thoại cho video, hãy thử lại"),
    LESSON_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy bài học"),
    LESSON_VIDEO_TAKEN(HttpStatus.CONFLICT, "Video này đã có bài học"),
    LESSON_ALREADY_PUBLISHED(HttpStatus.CONFLICT, "Bài học đã được xuất bản"),
    LESSON_NOT_PUBLISHED(HttpStatus.CONFLICT, "Bài học không còn ở trạng thái Đã xuất bản"),
    LESSON_NOT_PUBLISHABLE(HttpStatus.UNPROCESSABLE_CONTENT,
            "Bài cần ít nhất 1 câu và mọi câu đều có bản dịch tiếng Việt"),
    LESSON_ALREADY_DELETED(HttpStatus.CONFLICT, "Bài học đã bị xóa"),
    LESSON_NOT_DELETED(HttpStatus.CONFLICT, "Bài học đã được khôi phục"),
    LESSON_RESTORE_EXPIRED(HttpStatus.GONE, "Bài học đã bị xóa quá 30 ngày, không thể khôi phục"),
    LESSON_SENTENCES_INVALID(HttpStatus.BAD_REQUEST, "Một số câu chưa hợp lệ, chưa câu nào được lưu"),
    LESSON_SENTENCE_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy câu này trong bài"),
    LESSON_MUST_KEEP_SENTENCE(HttpStatus.CONFLICT,
            "Bài Đã xuất bản phải còn ít nhất 1 câu, hãy gỡ xuất bản trước nếu muốn xóa hết câu"),
    LESSON_STRUCTURE_LOCKED(HttpStatus.CONFLICT,
            "Bài đã từng xuất bản nên không tách câu được nữa; chỉ sửa nội dung, mốc thời gian hoặc xóa câu"),

    YOUTUBE_LINK_INVALID(HttpStatus.BAD_REQUEST, "Link không phải video YouTube hợp lệ"),
    YOUTUBE_VIDEO_UNAVAILABLE(HttpStatus.UNPROCESSABLE_CONTENT,
            "Video không dùng được: đã bị gỡ, ở chế độ riêng tư, bị giới hạn độ tuổi hoặc đang phát trực tiếp"),
    YOUTUBE_VIDEO_TOO_LONG(HttpStatus.UNPROCESSABLE_CONTENT, "Video dài hơn giới hạn cho phép"),
    YOUTUBE_NO_ENGLISH_SPEECH(HttpStatus.UNPROCESSABLE_CONTENT, "Video không có phụ đề tiếng Anh"),
    YOUTUBE_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE, "Tạm thời không lấy được dữ liệu từ YouTube, hãy thử lại"),

    DICTIONARY_WORD_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy từ này trong từ điển"),

    VOCAB_MEANING_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy nghĩa này của từ"),
    VOCAB_DECK_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy bộ từ này"),
    VOCAB_SAVED_WORD_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy từ đã lưu này"),
    VOCAB_PART_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy phần này của bộ từ"),
    VOCAB_PART_LOCKED(HttpStatus.FORBIDDEN, "Bạn cần gói Pro để học phần này"),
    VOCAB_SESSION_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy phiên học này"),
    VOCAB_CARD_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy thẻ này"),
    VOCAB_GROUP_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy nhóm thẻ này"),
    VOCAB_DECK_ALREADY_PUBLISHED(HttpStatus.CONFLICT, "Bộ thẻ đã được xuất bản"),
    VOCAB_DECK_NOT_PUBLISHED(HttpStatus.CONFLICT, "Bộ thẻ chưa được xuất bản"),
    VOCAB_DECK_NOT_PUBLISHABLE(HttpStatus.UNPROCESSABLE_CONTENT,
            "Bộ thẻ cần ít nhất một nhóm thẻ và mỗi nhóm thẻ cần ít nhất một thẻ"),
    VOCAB_DECK_NOT_DELETED(HttpStatus.CONFLICT, "Bộ thẻ đã được khôi phục"),
    VOCAB_DECK_RESTORE_EXPIRED(HttpStatus.GONE, "Bộ thẻ đã bị xóa quá 30 ngày, không thể khôi phục"),
    VOCAB_DECK_NAME_TAKEN(HttpStatus.CONFLICT, "Bạn đã có bộ thẻ cùng tên, hãy nhập tên mới"),
    VOCAB_GROUP_NAME_TAKEN(HttpStatus.CONFLICT, "Bộ đã có nhóm thẻ cùng tên, hãy đổi tên"),
    VOCAB_CARD_WORD_TAKEN(HttpStatus.CONFLICT, "Từ này đã có trong bộ thẻ"),
    VOCAB_DECK_MUST_STAY_PUBLISHABLE(HttpStatus.CONFLICT,
            "Bộ đang xuất bản phải có ít nhất một nhóm thẻ và mỗi nhóm có ít nhất một thẻ, hãy gỡ xuất bản bộ trước"),
    VOCAB_IMPORT_FILE_INVALID(HttpStatus.BAD_REQUEST, "Tệp nhập thẻ không hợp lệ"),
    VOCAB_IMPORT_TOO_MANY_ROWS(HttpStatus.UNPROCESSABLE_CONTENT, "Tệp có quá 500 dòng dữ liệu, hãy chia nhỏ tệp"),
    VOCAB_IMPORT_ROWS_INVALID(HttpStatus.UNPROCESSABLE_CONTENT,
            "Một số dòng trong tệp chưa hợp lệ, chưa thẻ nào được thêm"),

    REPORT_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy báo cáo này"),
    REPORT_TARGET_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy nội dung"),
    REPORT_DUPLICATE(HttpStatus.CONFLICT, "Báo cáo trước đó của bạn về nội dung này đang được xem xét"),
    REPORT_ALREADY_HANDLED(HttpStatus.CONFLICT, "Báo cáo đã được xử lý"),
    REPORT_NOT_FIXED(HttpStatus.UNPROCESSABLE_CONTENT,
            "Nội dung chưa được sửa kể từ khi nhận báo cáo; hãy sửa đúng trường hoặc từ chối báo cáo"),
    REPORT_REVIEW_REQUIRED(HttpStatus.CONFLICT,
            "Nội dung bị gỡ do báo cáo, cần gửi yêu cầu duyệt xuất bản lại"),
    REPORT_FIX_UNAVAILABLE(HttpStatus.UNPROCESSABLE_CONTENT, "Báo cáo này không kèm bản sửa đề xuất"),
    REPORT_TAKEDOWN_NOT_FOUND(HttpStatus.NOT_FOUND, "Nội dung này không bị gỡ do báo cáo"),
    REPUBLISH_NOT_FIXED(HttpStatus.UNPROCESSABLE_CONTENT,
            "Còn câu hoặc thẻ bị báo chưa được sửa kể từ khi bị gỡ"),
    REPUBLISH_PENDING(HttpStatus.CONFLICT, "Đã có yêu cầu xuất bản lại đang chờ duyệt"),
    REPUBLISH_NOT_FOUND(HttpStatus.NOT_FOUND, "Yêu cầu không còn hiệu lực"),

    DICTATION_EASY_UNAVAILABLE(HttpStatus.UNPROCESSABLE_ENTITY, "Câu này chưa có ô nào để điền, hãy chọn mức khác"),
    PRACTICE_SENTENCE_NOT_PRACTICED(HttpStatus.UNPROCESSABLE_ENTITY, "Bạn cần làm câu này ít nhất một lần trước"),
    SHADOWING_AUDIO_INVALID(HttpStatus.BAD_REQUEST, "Bản ghi âm không hợp lệ"),
    SHADOWING_NO_SPEECH(HttpStatus.UNPROCESSABLE_CONTENT, "Không nghe thấy giọng nói trong bản ghi âm"),
    SHADOWING_SCORING_UNAVAILABLE(HttpStatus.BAD_GATEWAY, "Dịch vụ chấm phát âm tạm thời không dùng được"),
    SHADOWING_SCORING_BUSY(HttpStatus.SERVICE_UNAVAILABLE, "Hệ thống chấm phát âm đang bận, vui lòng thử lại sau ít phút"),
    AI_FEEDBACK_UNAVAILABLE(HttpStatus.BAD_GATEWAY, "Dịch vụ nhận xét AI tạm thời không dùng được"),
    AI_FEEDBACK_BUSY(HttpStatus.SERVICE_UNAVAILABLE, "AI đang bận, vui lòng thử lại sau ít phút"),
    TUTOR_LIVE_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE, "Gia sư tạm thời không dùng được, hãy xem mẹo sửa bằng chữ"),
    TUTOR_SESSION_CONFLICT(HttpStatus.CONFLICT, "Phiên gia sư không ở trạng thái cho phép thao tác này"),
    TUTOR_WORD_NOT_IN_SENTENCE(HttpStatus.BAD_REQUEST, "Từ này không có trong câu đang học"),
    TUTOR_TOO_MANY_FAILED_STARTS(HttpStatus.TOO_MANY_REQUESTS,
            "Hôm nay bạn đã mở gia sư nhiều lần không thành công, hãy thử lại vào ngày mai"),

    STORAGE_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE, "Chức năng tải tệp tạm thời không dùng được"),
    STORAGE_UPLOAD_NOT_FOUND(HttpStatus.BAD_REQUEST, "Không tìm thấy tệp đã tải lên, hãy tải lại"),
    STORAGE_FILE_INVALID(HttpStatus.BAD_REQUEST, "Tệp tải lên sai định dạng hoặc quá dung lượng"),

    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi hệ thống, vui lòng thử lại sau");

    private final HttpStatus status;
    private final String defaultMessage;
}
