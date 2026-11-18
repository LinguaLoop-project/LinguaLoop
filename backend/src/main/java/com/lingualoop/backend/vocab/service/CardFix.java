package com.lingualoop.backend.vocab.service;

import com.lingualoop.backend.vocab.dto.request.CardRequest;

/**
 * Nội dung thẻ sau khi thay một trường bằng bản sửa đề xuất (BR-XL-10). {@code property} là tên trường của
 * {@link CardRequest} để báo lỗi kiểm tra; {@code oldValue} là giá trị trước khi thay.
 */
record CardFix(CardRequest request, String property, String oldValue) {

    static CardFix of(String column, CardRequest c, String v) {
        return switch (column) {
            case "word" -> new CardFix(new CardRequest(v, c.meaningVi(), c.ipaUk(), c.ipaUs(), c.pos(),
                    c.definitionEn(), c.definitionVi(), c.exampleEn(), c.exampleVi()), "word", c.word());
            case "ipa_uk" -> new CardFix(new CardRequest(c.word(), c.meaningVi(), v, c.ipaUs(), c.pos(),
                    c.definitionEn(), c.definitionVi(), c.exampleEn(), c.exampleVi()), "ipaUk", c.ipaUk());
            case "ipa_us" -> new CardFix(new CardRequest(c.word(), c.meaningVi(), c.ipaUk(), v, c.pos(),
                    c.definitionEn(), c.definitionVi(), c.exampleEn(), c.exampleVi()), "ipaUs", c.ipaUs());
            case "meaning_vi" -> new CardFix(new CardRequest(c.word(), v, c.ipaUk(), c.ipaUs(), c.pos(),
                    c.definitionEn(), c.definitionVi(), c.exampleEn(), c.exampleVi()), "meaningVi", c.meaningVi());
            case "definition_en" -> new CardFix(new CardRequest(c.word(), c.meaningVi(), c.ipaUk(), c.ipaUs(), c.pos(),
                    v, c.definitionVi(), c.exampleEn(), c.exampleVi()), "definitionEn", c.definitionEn());
            case "definition_vi" -> new CardFix(new CardRequest(c.word(), c.meaningVi(), c.ipaUk(), c.ipaUs(), c.pos(),
                    c.definitionEn(), v, c.exampleEn(), c.exampleVi()), "definitionVi", c.definitionVi());
            case "example_en" -> new CardFix(new CardRequest(c.word(), c.meaningVi(), c.ipaUk(), c.ipaUs(), c.pos(),
                    c.definitionEn(), c.definitionVi(), v, c.exampleVi()), "exampleEn", c.exampleEn());
            case "example_vi" -> new CardFix(new CardRequest(c.word(), c.meaningVi(), c.ipaUk(), c.ipaUs(), c.pos(),
                    c.definitionEn(), c.definitionVi(), c.exampleEn(), v), "exampleVi", c.exampleVi());
            default -> throw new IllegalArgumentException("Không phải trường sửa được của thẻ: " + column);
        };
    }
}
