package com.lingualoop.backend.tutor;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class TutorInstructionsTest {

    private static final PracticeWord THINK = new PracticeWord("think", "θ", 20, "Đặt đầu lưỡi giữa hai hàm răng.");
    private static final PracticeWord THIS = new PracticeWord("this", "ð", 55, "Rung dây thanh.");
    private final AttemptRule rule = new AttemptRule();

    @Test
    void retryInstructionNamesTheWordAndAttemptAndAsksForTheToolCall() {
        var d = rule.afterWordAttempt(2, 50, true);

        String text = TutorInstructions.afterWordAttempt(d, 50, 2, THINK, null);

        assertThat(text).contains("lượt 2/3").contains("\"think\"").contains("request_retry(target=\"word\")");
    }

    @Test
    void passingAndMovingOnDescribesTheNextWordWithItsTip() {
        var d = rule.afterWordAttempt(1, 90, true);

        String text = TutorInstructions.afterWordAttempt(d, 90, 1, THINK, THIS);

        assertThat(text).contains("đạt 90").contains("Đã chuyển sang").contains("\"this\"").contains("Rung dây thanh")
                .contains("switch_word");
    }

    @Test
    void exhaustedWordIsRecordedWithoutNagging() {
        var d = rule.afterWordAttempt(3, 40, true);

        String text = TutorInstructions.afterWordAttempt(d, 40, 3, THINK, THIS);

        assertThat(text).contains("cần luyện thêm").contains("đừng nài").contains("\"this\"");
    }

    @Test
    void finishingTheListAsksForTheWholeSentence() {
        var d = rule.afterWordAttempt(1, 90, false);

        assertThat(TutorInstructions.afterWordAttempt(d, 90, 1, THIS, null))
                .contains("Đã hết danh sách").contains("request_retry(target=\"sentence\")");
    }

    @Test
    void sentenceAttemptEndsWithCompletedOrContinuesWithPendingWord() {
        assertThat(TutorInstructions.afterSentenceAttempt(AttemptRule.NextStep.END, 82, null))
                .contains("end_session(reason=\"completed\")");
        assertThat(TutorInstructions.afterSentenceAttempt(AttemptRule.NextStep.NEXT_WORD, 82, THIS))
                .contains("\"this\"").contains("learner_exit");
    }

    @Test
    void switchInstructionTellsHowManyAttemptsRemain() {
        var progress = new WordProgress(THIS, 1, WordStatus.PENDING, 60.0);

        assertThat(TutorInstructions.afterSwitch(progress)).contains("\"this\"").contains("Còn 2 lượt");
    }

    @Test
    void wordWithoutPhonemeOrTipTellsTutorToExplainItself() {
        var plain = new PracticeWord("the", null, 0, null);

        assertThat(TutorInstructions.describe(plain)).contains("chưa có mẹo soạn sẵn");
        assertThat(TutorInstructions.describe(new PracticeWord("sing", "ŋ", 20, null))).contains("chưa có mẹo soạn sẵn");
    }

    @Test
    void offTopicEscalatesWarnThenEnd() {
        assertThat(TutorInstructions.offTopic(1)).contains("1/3").contains("tối đa một câu");
        assertThat(TutorInstructions.offTopic(2)).contains("2/3").contains("Không trả lời nội dung")
                .contains("kết thúc phiên");
        assertThat(TutorInstructions.offTopic(3)).contains("phiên kết thúc").contains("Không gọi thêm tool");
    }
}
