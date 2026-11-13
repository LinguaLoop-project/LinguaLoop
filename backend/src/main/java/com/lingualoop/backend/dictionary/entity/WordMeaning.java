package com.lingualoop.backend.dictionary.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record WordMeaning(
        int no,
        String pos,
        @JsonProperty("meaning_vi") String meaningVi,
        @JsonProperty("definition_en") String definitionEn,
        @JsonProperty("definition_vi") String definitionVi,
        @JsonProperty("example_en") String exampleEn,
        @JsonProperty("example_vi") String exampleVi) {
}
