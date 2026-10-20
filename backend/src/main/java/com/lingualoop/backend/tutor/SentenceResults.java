package com.lingualoop.backend.tutor;

import java.util.List;

import com.lingualoop.backend.shadowing.dto.AttemptSnapshot;

/** Đổi kết quả đã lưu của module shadowing sang đầu vào của luật gia sư. */
final class SentenceResults {

    private SentenceResults() {
    }

    static SentenceResult of(AttemptSnapshot snapshot) {
        return new SentenceResult(snapshot.accuracy(), words(snapshot.words()));
    }

    static List<SentenceResult.Word> words(List<AttemptSnapshot.Word> words) {
        return words.stream()
                .map(w -> new SentenceResult.Word(w.text(), w.accuracy(), w.outcome(), w.phonemes().stream()
                        .map(p -> new SentenceResult.Phoneme(p.symbol(), p.accuracy(), p.needsFix(), p.mismatch()))
                        .toList()))
                .toList();
    }

    static List<SentenceResult> of(List<AttemptSnapshot> snapshots) {
        return snapshots.stream().map(SentenceResults::of).toList();
    }
}
