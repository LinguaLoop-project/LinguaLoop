package com.lingualoop.backend.tutor;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class TutorPromptBuilderTest {

    private final TutorPromptBuilder builder = new TutorPromptBuilder();

    /** Prompt là text block nhiều dòng; gộp khoảng trắng để kiểm tra cụm từ không phụ thuộc chỗ xuống dòng. */
    private String build(String sentence, List<PracticeWord> words) {
        return String.join(" ", builder.build(sentence, words).split("[ \t\r\n]+"));
    }

    private static final List<PracticeWord> WORDS = List.of(
            new PracticeWord("think", "θ", 42.4, "Đặt đầu lưỡi giữa hai hàm răng."),
            new PracticeWord("this", "ð", 55, null));

    @Test
    void listsEveryWordInOrderWithTipsAndNamesTheCurrentOne() {
        String prompt = build("I think this is it.", WORDS);

        assertThat(prompt)
                .contains("\"I think this is it.\"")
                .contains("1. từ \"think\", âm /θ/ (42/100; mẹo: Đặt đầu lưỡi giữa hai hàm răng.)")
                .contains("2. từ \"this\", âm /ð/ (55/100; chưa có mẹo soạn sẵn")
                .contains("Từ đang luyện bây giờ: \"think\".");
        assertThat(prompt.indexOf("1. từ \"think\"")).isLessThan(prompt.indexOf("2. từ \"this\""));
    }

    @Test
    void mentionsAllFourTools() {
        String prompt = build("I think so.", WORDS);

        assertThat(prompt)
                .contains("request_retry(target=\"word\")")
                .contains("request_retry(target=\"sentence\")")
                .contains("switch_word(word=\"X\")")
                .contains("log_turn(topic=")
                .contains("end_session(reason=\"completed\")")
                .contains("end_session(reason=\"learner_exit\")");
    }

    @Test
    void separatesChatModeFromScoringMode() {
        String prompt = build("I think so.", WORDS);

        assertThat(prompt)
                .contains("TRÒ CHUYỆN")
                .contains("Bạn KHÔNG chấm được phát âm")
                .contains("bấm nút chấm hoặc nói \"chấm cho mình\"")
                .contains("CHẤM: bắt đầu khi bạn gọi tool request_retry")
                .contains("Chỉ tin điểm trong kết quả tool");
    }

    @Test
    void neverForcesTheLearnerBackToAWordTheyDroppedAndAllowsAnyWordInTheSentence() {
        String prompt = build("I think so.", WORDS);

        assertThat(prompt)
                .contains("Không bao giờ nài người học luyện lại một từ họ đã muốn bỏ")
                .contains("X phải là một từ trong câu")
                .doesNotContain("DUY NHẤT")
                .doesNotContain("Không bao giờ nói về lỗi khác");
    }

    @Test
    void keepsConversationOnTheSentenceAndLogsEveryChatTurn() {
        String prompt = build("I think so.", WORDS);

        assertThat(prompt)
                .contains("Chỉ bàn về câu đang học")
                .contains("Sau MỖI lượt người học nói trong chế độ trò chuyện")
                .contains("yêu cầu đổi từ hay yêu cầu chấm cũng là on_topic")
                .contains("nếu họ cứ đi xa thì phiên sẽ kết thúc");
    }

    @Test
    void forbidsSpeakingToolNamesAndRequiresRealToolCall() {
        String prompt = build("I think so.", WORDS);

        assertThat(prompt)
                .contains("tuyệt đối không nói hay viết tên tool ra lời")
                .contains("phải thực sự gọi request_retry")
                .contains("không đọc ký hiệu phiên âm IPA")
                .contains("xưng \"mình\" và gọi người học là \"bạn\"")
                .contains("khoảng 40 từ");
    }

    @Test
    void emptyListAsksTheLearnerWhichWordTheyWant() {
        String prompt = build("Good morning.", List.of());

        assertThat(prompt)
                .contains("đọc khá tốt, chưa có từ lỗi rõ")
                .contains("hỏi họ muốn luyện từ nào")
                .doesNotContain("Danh sách từ lỗi")
                .doesNotContain("Từ đang luyện bây giờ");
    }
}
