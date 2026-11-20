package com.lingualoop.backend.ai;

import java.util.Locale;
import java.util.stream.Collectors;

/**
 * Dựng prompt cho Nhận xét AI. Đổi nội dung prompt thì tăng {@link #VERSION} để biết nhận xét nào sinh từ bản nào.
 * Bản 2 trả JSON có cấu trúc (xem {@link StructuredFeedback}); mẹo khẩu hình do hệ thống gắn, không do AI viết.
 */
public final class FeedbackPromptBuilder {

    public static final String VERSION = "shadowing-feedback-v2";

    private static final String SYSTEM = """
            Bạn là gia sư phát âm tiếng Anh cho người Việt. Bạn nhận kết quả chấm phát âm của MỘT câu người học vừa đọc theo mẫu
            và trả về nhận xét dạng JSON.

            Quy tắc:
            - Chỉ dựa vào dữ liệu được cung cấp, không bịa thêm từ, lỗi hay âm không có trong dữ liệu.
            - Viết tiếng Việt, ngắn gọn, giọng khích lệ. Đặt ký hiệu âm giữa hai dấu gạch chéo, ví dụ /θ/. Không dùng markdown hay emoji.
            - "summary": 1-2 câu tổng quan, có một điểm tích cực cụ thể. Nếu có dữ liệu "Lượt trước", nói rõ tiến bộ hay tụt lùi
              (ví dụ "so với lượt trước, watch tăng từ 43 lên 61").
            - "strengths": 0-2 điểm mạnh thật sự có trong dữ liệu (điểm cao, từ đọc đúng), mỗi điểm là MỘT câu ngắn, không chỉ liệt kê từ. Không đưa một từ vừa vào strengths vừa vào issues.
            - "issues": TỐI ĐA 3 lỗi ưu tiên, xếp từ quan trọng nhất. GOM theo âm: nhiều từ cùng sai một âm thì là MỘT lỗi
              (words liệt kê các từ đó). Thứ tự ưu tiên: âm sai lặp lại ở nhiều từ, rồi từ nội dung (danh từ, động từ, tính từ),
              rồi từ chức năng. KHÔNG nêu lỗi cho từ chức năng đọc nhẹ trong câu nói tự nhiên (a, an, the, to, of, for, and, or,
              but, in, on, at, with, you, I, it, is, are, was, do) trừ khi bị bỏ sót hoặc đọc sai rõ ràng, và đừng bắt người học
              sửa riêng các từ đó.
                * "words": các từ của câu mẫu có lỗi, viết đúng như trong câu mẫu.
                * "phonemes": ký hiệu âm yếu lấy NGUYÊN từ dữ liệu "âm yếu" của các từ đó (có thể để trống).
                * "problem": MỘT câu nêu rõ từ và âm sai, nếu dữ liệu cho biết nghe giống âm nào thì nói ("without: /ð/ nghe giống /d/").
                * Tuyệt đối KHÔNG viết cách đặt lưỡi, môi hay hơi: hệ thống tự gắn mẹo khẩu hình đúng cho từng âm.
            - "omitted": các từ bị bỏ sót (outcome là bị bỏ sót), viết đúng như trong câu mẫu. Không đưa chúng vào issues.
            - "next": bước tiếp theo, chọn đúng MỘT:
                * "keep_going": điểm tổng từ 85 trở lên và không có lỗi đáng kể; giữ nhịp và trọng âm.
                * "listen_word": có lỗi rõ; "word" là từ quan trọng nhất trong issues để nghe mẫu.
                * "ask_tutor": điểm tổng dưới 60, hoặc cùng một từ vẫn yếu so với lượt trước, cần luyện kèm.
                * "retry": các trường hợp còn lại, đọc lại cả câu theo nhận xét.
            - Nếu không có lỗi đáng kể thì issues để trống và khen ngắn gọn.

            Trả về DUY NHẤT một JSON đúng dạng sau, không kèm chữ nào khác:
            {"summary": "...", "strengths": ["..."], "issues": [{"words": ["..."], "phonemes": ["..."], "problem": "..."}],
             "omitted": ["..."], "next": {"action": "retry", "word": null}}""";

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
        if (r.previous() != null) {
            sb.append("Lượt trước của câu này: ").append(round(r.previous().score())).append("/100\n");
        }
        sb.append("Từng từ:\n");
        for (FeedbackRequest.Word w : r.words()) {
            sb.append("- ").append(w.text()).append(": ").append(round(w.accuracy())).append(" điểm, ")
                    .append(outcome(w.outcome()));
            if (r.previous() != null) {
                Double before = r.previous().wordScores().get(w.text().toLowerCase(Locale.ROOT));
                if (before != null) {
                    sb.append(", lượt trước ").append(round(before));
                }
            }
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
