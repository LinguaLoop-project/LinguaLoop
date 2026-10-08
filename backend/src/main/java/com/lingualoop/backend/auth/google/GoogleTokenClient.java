package com.lingualoop.backend.auth.google;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

/** Đổi authorization code lấy access token. Gửi form trong body, không đưa secret lên query string. */
@FeignClient(name = "google-token", url = "${app.google.oauth-url}")
interface GoogleTokenClient {

    @PostMapping(value = "/token", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    GoogleTokenResponse exchange(@RequestBody MultiValueMap<String, String> form);
}
