package com.lingualoop.backend.auth.google;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/** Phản hồi {@code POST /token} của Google. Chỉ cần access token; các trường khác bỏ qua. */
@JsonIgnoreProperties(ignoreUnknown = true)
record GoogleTokenResponse(@JsonProperty("access_token") String accessToken) {
}
