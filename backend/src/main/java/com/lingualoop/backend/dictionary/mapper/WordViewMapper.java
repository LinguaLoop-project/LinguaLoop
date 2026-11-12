package com.lingualoop.backend.dictionary.mapper;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.lingualoop.backend.dictionary.dto.MeaningSnapshot;
import com.lingualoop.backend.dictionary.dto.WordView;
import com.lingualoop.backend.dictionary.entity.DictionaryWord;
import com.lingualoop.backend.dictionary.entity.PosPronunciation;
import com.lingualoop.backend.dictionary.entity.WordMeaning;
import com.lingualoop.backend.dictionary.util.AudioUrlResolver;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class WordViewMapper {

    private final AudioUrlResolver audioUrlResolver;

    public WordView toView(DictionaryWord word) {
        DictionaryWord lemma = word.getLemma();
        return build(word, lemma == null ? null : build(lemma, null));
    }

    private WordView build(DictionaryWord word, WordView lemma) {
        return new WordView(
                word.getHeadword(),
                defaultPronunciation(word),
                groupByPos(word),
                lemma);
    }

    /** Một nghĩa kèm phát âm của loại từ đó (hoặc của cả từ); âm thanh giữ đường dẫn tương đối (ADR 0009). */
    public MeaningSnapshot toSnapshot(DictionaryWord word, WordMeaning meaning) {
        PosPronunciation p = rawPronunciationFor(word, blankToNull(meaning.pos()));
        return new MeaningSnapshot(
                word.getId(),
                word.getHeadword(),
                blankToNull(meaning.pos()),
                meaning.no(),
                meaning.meaningVi(),
                meaning.definitionEn(),
                meaning.definitionVi(),
                meaning.exampleEn(),
                meaning.exampleVi(),
                p.ipaUk(),
                p.ipaUs(),
                p.audioUk(),
                p.audioUs());
    }

    private List<WordView.MeaningGroup> groupByPos(DictionaryWord word) {
        Map<String, List<WordView.Meaning>> byPos = new LinkedHashMap<>();
        for (WordMeaning m : word.getMeanings()) {
            byPos.computeIfAbsent(blankToNull(m.pos()), k -> new ArrayList<>())
                    .add(new WordView.Meaning(m.no(), m.meaningVi(), m.definitionEn(), m.definitionVi(),
                            m.exampleEn(), m.exampleVi()));
        }
        List<WordView.MeaningGroup> groups = new ArrayList<>(byPos.size());
        byPos.forEach((pos, meanings) -> groups.add(
                new WordView.MeaningGroup(pos, pronunciationFor(word, pos), List.copyOf(meanings))));
        return groups;
    }

    private WordView.Pronunciation pronunciationFor(DictionaryWord word, String pos) {
        return resolved(rawPronunciationFor(word, pos));
    }

    private WordView.Pronunciation defaultPronunciation(DictionaryWord word) {
        return resolved(rawPronunciationFor(word, null));
    }

    /** Ghi đè phát âm theo loại từ nếu có, không thì dùng mặc định của từ; âm thanh còn là đường dẫn gốc. */
    private PosPronunciation rawPronunciationFor(DictionaryWord word, String pos) {
        Map<String, PosPronunciation> overrides = word.getPosPronunciations();
        PosPronunciation override = overrides == null || pos == null ? null : overrides.get(pos);
        return override != null ? override
                : new PosPronunciation(word.getIpaUk(), word.getIpaUs(), word.getAudioUk(), word.getAudioUs());
    }

    private WordView.Pronunciation resolved(PosPronunciation p) {
        return new WordView.Pronunciation(p.ipaUk(), p.ipaUs(),
                audioUrlResolver.resolve(p.audioUk()), audioUrlResolver.resolve(p.audioUs()));
    }

    private String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s;
    }
}
