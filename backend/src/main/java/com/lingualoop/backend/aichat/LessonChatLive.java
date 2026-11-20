package com.lingualoop.backend.aichat;

import java.time.Duration;
import java.util.List;
import java.util.Map;

import com.google.genai.types.FunctionDeclaration;
import com.google.genai.types.Schema;
import com.google.genai.types.Type;
import com.lingualoop.backend.aichat.LessonChatAi.Lesson;
import com.lingualoop.backend.tutor.LiveTokenIssuer.LiveSpec;

/**
 * Cấu hình Gemini Live cho gia sư giọng nói của Thực hành với AI theo bài: lời nhắc, ba tool và thời hạn token. Tên tool
 * phải khớp với {@link LessonChatPrompts#live} và với bộ điều khiển phía trình duyệt.
 */
final class LessonChatLive {

    /** Token sống lâu hơn trần 15 phút của phiên (BR-AI-11) một chút, vì giờ chỉ bắt đầu tính khi gia sư nói câu đầu. */
    static final Duration TOKEN_LIFETIME = Duration.ofMinutes(17);

    private LessonChatLive() {
    }

    static LiveSpec spec(Lesson lesson, int maxQuestions) {
        return new LiveSpec(LessonChatPrompts.live(lesson, maxQuestions), tools(), TOKEN_LIFETIME, true);
    }

    static List<FunctionDeclaration> tools() {
        return List.of(
                declaration("next_question",
                        "Ghi lại câu hỏi mới mà bạn sắp hỏi người học. Gọi trước khi đọc câu hỏi, mỗi câu hỏi một lần.",
                        Map.of("question", string("Câu hỏi tiếng Anh sẽ hỏi", null)), "question"),
                declaration("give_feedback",
                        "Ghi lại câu trả lời của người học cho câu hỏi hiện tại cùng nhận xét. Gọi ngay sau khi họ "
                                + "trả lời, trước khi bạn nói nhận xét.",
                        Map.of(
                                "answer", string("Điều người học vừa nói, giữ nguyên lỗi", null),
                                "feedback", string("Nhận xét tiếng Việt 2-3 câu so với lời thoại", null),
                                "better", string("Một câu tiếng Anh tự nhiên hơn", null)),
                        "answer", "feedback", "better"),
                declaration("end_session",
                        "Kết thúc phiên khi đã đủ số câu hỏi hoặc người học muốn dừng.",
                        Map.of("reason", string("Lý do kết thúc", List.of("completed", "learner_exit"))), "reason"));
    }

    private static Schema string(String description, List<String> values) {
        Schema.Builder property = Schema.builder().type(Type.Known.STRING).description(description);
        if (values != null) {
            property.enum_(values);
        }
        return property.build();
    }

    private static FunctionDeclaration declaration(String name, String description, Map<String, Schema> properties,
            String... required) {
        return FunctionDeclaration.builder()
                .name(name)
                .description(description)
                .parameters(Schema.builder().type(Type.Known.OBJECT).properties(properties).required(required))
                .build();
    }
}
