package com.lingualoop.backend.auth.google;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/** Phản hồi userinfo (OpenID Connect) của Google. */
@JsonIgnoreProperties(ignoreUnknown = true)
record GoogleUserInfo(
        String sub,
        String email,
        @JsonProperty("email_verified") Boolean emailVerified,
        String name,
        String picture) {
}
