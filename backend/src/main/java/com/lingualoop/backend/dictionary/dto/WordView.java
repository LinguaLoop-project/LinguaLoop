package com.lingualoop.backend.dictionary.dto;

import java.util.List;

/**
 * Một từ để hiển thị: các nghĩa đã gom theo loại từ, mỗi nhóm kèm phát âm đã chọn
 * (ghi đè theo loại từ nếu có, không thì phát âm mặc định của cả từ).
 */
public record WordView(
        String headword,
        String cefrLevel,
        Pronunciation pronunciation,
        List<MeaningGroup> groups,
        WordView lemma) {

    public record Pronunciation(String ipaUk, String ipaUs, String audioUk, String audioUs) {
    }

    public record MeaningGroup(String pos, Pronunciation pronunciation, List<Meaning> meanings) {
    }

    public record Meaning(int no, String translationVi, String exampleEn, String exampleVi) {
    }
}
