package com.lingualoop.backend.dictionary.mapper;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

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
                word.getCefrLevel() == null ? null : word.getCefrLevel().name(),
                defaultPronunciation(word),
                groupByPos(word),
                lemma);
    }

    private List<WordView.MeaningGroup> groupByPos(DictionaryWord word) {
        Map<String, List<WordView.Meaning>> byPos = new LinkedHashMap<>();
        for (WordMeaning m : word.getMeanings()) {
            byPos.computeIfAbsent(blankToNull(m.pos()), k -> new ArrayList<>())
                    .add(new WordView.Meaning(m.no(), m.translationVi(), m.exampleEn(), m.exampleVi()));
        }
        List<WordView.MeaningGroup> groups = new ArrayList<>(byPos.size());
        byPos.forEach((pos, meanings) -> groups.add(
                new WordView.MeaningGroup(pos, pronunciationFor(word, pos), List.copyOf(meanings))));
        return groups;
    }

    /** Ghi đè phát âm theo loại từ nếu có, không thì dùng mặc định của từ. */
    private WordView.Pronunciation pronunciationFor(DictionaryWord word, String pos) {
        Map<String, PosPronunciation> overrides = word.getPosPronunciations();
        PosPronunciation override = overrides == null || pos == null ? null : overrides.get(pos);
        if (override == null) {
            return defaultPronunciation(word);
        }
        return new WordView.Pronunciation(override.ipaUk(), override.ipaUs(),
                audioUrlResolver.resolve(override.audioUk()), audioUrlResolver.resolve(override.audioUs()));
    }

    private WordView.Pronunciation defaultPronunciation(DictionaryWord word) {
        return new WordView.Pronunciation(word.getIpaUk(), word.getIpaUs(),
                audioUrlResolver.resolve(word.getAudioUk()), audioUrlResolver.resolve(word.getAudioUs()));
    }

    private String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s;
    }
}
