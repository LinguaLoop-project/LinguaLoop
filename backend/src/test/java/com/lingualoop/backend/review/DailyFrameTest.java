package com.lingualoop.backend.review;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;

import org.junit.jupiter.api.Test;

/** Cách khung bài ngày chia định mức thẻ cho thẻ đến hạn, từ mới và thẻ củng cố (BR-HT-29). */
class DailyFrameTest {

    private static final UUID DECK = UUID.fromString("00000000-0000-0000-0000-00000000000a");

    @Test
    void newWordCap_isAThirdOfTheQuotaRoundedUp_AC_HT_76() {
        assertThat(DailyFrame.newWordCap(15, 0)).isEqualTo(5);
        assertThat(DailyFrame.newWordCap(20, 0)).isEqualTo(7);
        assertThat(DailyFrame.newWordCap(30, 0)).isEqualTo(10);
        assertThat(DailyFrame.newWordCap(40, 0)).isEqualTo(14);
    }

    @Test
    void newWordCap_shrinksWhenTomorrowIsAlreadyBusy_andNeverGoesNegative_AC_HT_77() {
        assertThat(DailyFrame.newWordCap(20, 18)).isEqualTo(2);
        assertThat(DailyFrame.newWordCap(20, 13)).isEqualTo(7);
        assertThat(DailyFrame.newWordCap(20, 20)).isZero();
        assertThat(DailyFrame.newWordCap(20, 75)).isZero();
    }

    @Test
    void fill_dueFirstThenNewWordsThenReinforce_AC_HT_76() {
        // 20 ô: 3 thẻ đến hạn, 40 từ mới (giới hạn 7), 15 thẻ củng cố.
        DailyFrame frame = DailyFrame.fill(20, 3, 7, 40, 15, DECK);

        assertThat(frame.due()).isEqualTo(3);
        assertThat(frame.newWords()).isEqualTo(7);
        assertThat(frame.reinforce()).isEqualTo(10);
        assertThat(frame.total()).isEqualTo(20);
        assertThat(frame.newWordsDeck()).isEqualTo(DECK);
    }

    @Test
    void fill_plentyOfDueCards_leavesNoRoomForTheOtherSources() {
        DailyFrame frame = DailyFrame.fill(20, 35, 7, 40, 15, DECK);

        assertThat(frame).isEqualTo(new DailyFrame(20, 0, 0, null));
    }

    @Test
    void fill_newWordsNeverExceedWhatIsAllowedOrAvailable_AC_HT_77() {
        assertThat(DailyFrame.fill(20, 0, 0, 40, 0, DECK).newWords()).isZero();     // đã đủ từ mới hôm nay
        assertThat(DailyFrame.fill(20, 0, 2, 40, 0, DECK).newWords()).isEqualTo(2); // ngày mai đã nhiều thẻ
        assertThat(DailyFrame.fill(20, 0, 7, 3, 0, DECK).newWords()).isEqualTo(3);  // bộ chỉ còn 3 thẻ Mới
    }

    @Test
    void fill_reinforceTakesWhatIsLeftEvenWithoutNewWords() {
        DailyFrame frame = DailyFrame.fill(20, 3, 0, 0, 30, DECK);

        assertThat(frame.reinforce()).isEqualTo(17);
        assertThat(frame.newWordsDeck()).isNull();
    }

    @Test
    void fill_nothingAvailable_isEmpty_andAFullQuotaIsEmptyToo() {
        assertThat(DailyFrame.fill(20, 0, 7, 0, 0, DECK)).isEqualTo(DailyFrame.EMPTY);
        assertThat(DailyFrame.fill(0, 50, 7, 40, 15, DECK)).isEqualTo(DailyFrame.EMPTY);
        assertThat(DailyFrame.fill(-3, 50, 7, 40, 15, DECK)).isEqualTo(DailyFrame.EMPTY);
    }
}
