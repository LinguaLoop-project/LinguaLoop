package com.lingualoop.backend.vocab.service;

import java.util.Arrays;
import java.util.List;

import org.springframework.stereotype.Component;

import com.lingualoop.backend.vocab.dto.LearnView;
import com.lingualoop.backend.vocab.enums.CardStatus;
import com.lingualoop.backend.vocab.repository.VocabLearnRepository.CardRow;

import lombok.RequiredArgsConstructor;

/** Dựng thẻ trả về cho màn học và màn ôn từ một dòng đọc từ cơ sở dữ liệu. */
@Component
@RequiredArgsConstructor
class CardViews {

    private final CardAudioUrls audio;

    /** Thẻ của bộ hệ thống: không có câu gốc của bài học. */
    LearnView.Card of(CardRow row) {
        return of(row, null, null, null);
    }

    /** Thẻ kèm câu gốc, bản dịch và bài học khi là từ đã lưu từ bài học. */
    LearnView.Card of(CardRow row, String contextEn, String contextVi, LearnView.LessonRef lesson) {
        CardStatus status = CardStatus.fromDb(row.status());
        Sm2.State state = status == CardStatus.NEW ? Sm2.State.FRESH
                : new Sm2.State(row.repetitions(), row.intervalDays(), row.easiness());
        List<LearnView.Preview> previews = Arrays.stream(Sm2.QUALITIES)
                .mapToObj(q -> new LearnView.Preview(q, Sm2.grade(state, q).delay().toMinutes()))
                .toList();
        return new LearnView.Card(row.id(), row.word(), row.pos(), row.translationVi(), row.explanationEn(),
                row.explanationVi(), row.exampleEn(), row.exampleVi(), row.imageUrl(), row.ipaUk(), row.ipaUs(),
                audio.resolve(row.audioUk()), audio.resolve(row.audioUs()), status, previews, contextEn, contextVi, lesson);
    }
}
