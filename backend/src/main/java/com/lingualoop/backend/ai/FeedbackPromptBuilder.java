package com.lingualoop.backend.ai;

import java.util.Locale;
import java.util.stream.Collectors;

/**
 * Dựng prompt cho Nhận xét AI. Đổi nội dung prompt thì tăng {@link #VERSION} để biết nhận xét nào sinh từ bản nào.
 */
public final class FeedbackPromptBuilder {

    public static final String VERSION = "shadowing-feedback-v1";

    private static final String SYSTEM = """
            Bạn là gia sư phát âm tiếng Anh cho người Việt. Bạn nhận kết quả chấm phát âm của MỘT câu người học vừa đọc theo mẫu.
            Quy tắc:
            - Chỉ dựa vào dữ liệu được cung cấp, không bịa thêm lỗi hay âm không có trong dữ liệu.
            - Viết bằng tiếng Việt, tối đa 4 câu: một câu nhận xét chung có điểm tích cực, một đến hai câu nêu lỗi quan trọng nhất (nêu rõ từ và âm), một câu gợi ý cách luyện.
            - Không dùng markdown, không dùng danh sách, không dùng emoji.
            - Đặt ký hiệu âm giữa hai dấu gạch chéo, ví dụ /θ/.
            - Nếu không có lỗi đáng kể thì khen ngắn gọn và gợi ý giữ nhịp, trọng âm.""";

    private FeedbackPromptBuilder() {
    }

    public static String systemInstruction() {
        return SYSTEM;
    }

    public static String userPrompt(FeedbackRequest r) {
        StringBuilder sb = new StringBuilder();
        sb.append("Câu mẫu: ").append(r.sentenceText()).append('\n');
        sb.append("Điểm tổng: ").append(round(r.score())).append("/100\n");
        sb.append("Chính xác: ").append(score(r.accuracy()))
                .append(", trôi chảy: ").append(score(r.fluency()))
                .append(", đầy đủ: ").append(score(r.completeness()))
                .append(", ngữ điệu: ").append(score(r.prosody())).append('\n');
        sb.append("Từng từ:\n");
        for (FeedbackRequest.Word w : r.words()) {
            sb.append("- ").append(w.text()).append(": ").append(round(w.accuracy())).append(" điểm, ")
                    .append(outcome(w.outcome()));
            if (!w.weakPhonemes().isEmpty()) {
                sb.append(", âm yếu: ").append(w.weakPhonemes().stream()
                        .map(p -> p.expected() == null
                                ? "/" + p.symbol() + "/ " + round(p.accuracy())
                                : "cần /" + p.expected() + "/ nhưng nghe giống /" + p.symbol() + "/ " + round(p.accuracy()))
                        .collect(Collectors.joining(", ")));
            }
            sb.append('\n');
        }
        return sb.toString();
    }

    private static String outcome(String outcome) {
        return switch (outcome) {
            case "correct" -> "đọc đúng";
            case "mispronounced" -> "đọc sai";
            case "omitted" -> "bị bỏ sót";
            case "inserted" -> "từ thừa (không có trong câu mẫu)";
            default -> outcome;
        };
    }

    private static String score(Double value) {
        return value == null ? "không có" : round(value);
    }

    private static String round(double value) {
        return String.format(Locale.ROOT, "%d", Math.round(value));
    }
}
