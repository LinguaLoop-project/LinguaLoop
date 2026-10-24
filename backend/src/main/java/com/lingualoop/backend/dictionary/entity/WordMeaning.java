package com.lingualoop.backend.dictionary.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record WordMeaning(
        int no,
        String pos,
        @JsonProperty("translation_vi") String translationVi,
        @JsonProperty("example_en") String exampleEn,
        @JsonProperty("example_vi") String exampleVi) {
}
