package com.lingualoop.backend.auth.google;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;

/** Lấy hồ sơ người dùng bằng access token; token đi trong header, không đi trong URL. */
@FeignClient(name = "google-userinfo", url = "${app.google.user-info-url}")
interface GoogleUserInfoClient {

    @GetMapping("/v1/userinfo")
    GoogleUserInfo getUserInfo(@RequestHeader(HttpHeaders.AUTHORIZATION) String bearerToken);
}
