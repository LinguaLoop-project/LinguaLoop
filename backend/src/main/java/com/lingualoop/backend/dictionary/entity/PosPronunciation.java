package com.lingualoop.backend.dictionary.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/** Phát âm riêng cho một loại từ (vd "present" động từ). */
@JsonIgnoreProperties(ignoreUnknown = true)
public record PosPronunciation(
        @JsonProperty("ipa_uk") String ipaUk,
        @JsonProperty("ipa_us") String ipaUs,
        @JsonProperty("audio_uk") String audioUk,
        @JsonProperty("audio_us") String audioUs) {
}
