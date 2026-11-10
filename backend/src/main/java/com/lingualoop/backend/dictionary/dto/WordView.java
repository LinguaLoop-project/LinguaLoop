package com.lingualoop.backend.dictionary.dto;

import java.util.List;

/** Một từ để hiển thị: các nghĩa đã gom theo loại từ, mỗi nhóm kèm phát âm của cả từ. */
public record WordView(
        String headword,
        Pronunciation pronunciation,
        List<MeaningGroup> groups,
        WordView lemma) {

    public record Pronunciation(String ipaUk, String ipaUs, String audioUk, String audioUs) {
    }

    public record MeaningGroup(String pos, Pronunciation pronunciation, List<Meaning> meanings) {
    }

    public record Meaning(int no, String translationVi, String definitionEn, String definitionVi, String exampleEn,
            String exampleVi) {
    }
}
