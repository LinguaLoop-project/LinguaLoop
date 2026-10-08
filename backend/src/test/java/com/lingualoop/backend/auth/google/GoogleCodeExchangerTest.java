package com.lingualoop.backend.auth.google;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.containing;
import static com.github.tomakehurst.wiremock.client.WireMock.equalTo;
import static com.github.tomakehurst.wiremock.client.WireMock.get;
import static com.github.tomakehurst.wiremock.client.WireMock.getRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.post;
import static com.github.tomakehurst.wiremock.client.WireMock.postRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.urlEqualTo;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.RegisterExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import com.github.tomakehurst.wiremock.junit5.WireMockExtension;
import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.config.GoogleProperties;

import static com.github.tomakehurst.wiremock.core.WireMockConfiguration.wireMockConfig;

/** Authorization code flow với Google giả dựng trên WireMock: đổi code rồi gọi userinfo (AC-17, 22, 23). */
@SpringBootTest(properties = {
        "app.google.client-id=test-client.apps.googleusercontent.com",
        "app.google.client-secret=test-secret-not-real",
        "app.google.redirect-uri=http://localhost:5173/authenticate",
        "spring.cloud.openfeign.client.config.default.read-timeout=700" })
@Import(TestcontainersConfiguration.class)
class GoogleCodeExchangerTest {

    @RegisterExtension
    static WireMockExtension google = WireMockExtension.newInstance()
            .options(wireMockConfig().dynamicPort()).build();

    @DynamicPropertySource
    static void googleUrls(DynamicPropertyRegistry registry) {
        registry.add("app.google.oauth-url", google::baseUrl);
        registry.add("app.google.user-info-url", google::baseUrl);
    }

    @Autowired
    private GoogleCodeExchanger exchanger;

    @BeforeEach
    void resetStubs() {
        google.resetAll();
    }

    private void stubToken(int status, String body) {
        google.stubFor(post(urlEqualTo("/token")).willReturn(aResponse()
                .withStatus(status).withHeader("Content-Type", "application/json").withBody(body)));
    }

    private void stubUserInfo(int status, String body) {
        google.stubFor(get(urlEqualTo("/v1/userinfo")).willReturn(aResponse()
                .withStatus(status).withHeader("Content-Type", "application/json").withBody(body)));
    }

    private static final String USER_INFO = """
            {"sub":"google-sub-123","email":"minh@gmail.com","email_verified":true,
             "name":"Minh Nguyen","picture":"https://lh3.googleusercontent.com/a/minh","locale":"vi"}""";

    private void assertCode(Runnable call, ErrorCode expected) {
        assertThatThrownBy(call::run).isInstanceOfSatisfying(BusinessException.class,
                e -> assertThat(e.getErrorCode()).isEqualTo(expected));
    }

    @Test
    void exchange_validCode_returnsIdentityFromUserInfo_AC17() {
        stubToken(200, "{\"access_token\":\"ya29.fake-access\",\"expires_in\":3599,\"token_type\":\"Bearer\",\"scope\":\"openid\"}");
        stubUserInfo(200, USER_INFO);

        GoogleIdentity identity = exchanger.exchange("4/0Abc-code");

        assertThat(identity).isEqualTo(new GoogleIdentity("google-sub-123", "minh@gmail.com", "Minh Nguyen",
                "https://lh3.googleusercontent.com/a/minh"));
    }

    @Test
    void exchange_sendsSecretAndCodeInFormBodyNotInUrl_AC17() {
        stubToken(200, "{\"access_token\":\"ya29.fake-access\"}");
        stubUserInfo(200, USER_INFO);

        exchanger.exchange("4/0Abc-code");

        google.verify(postRequestedFor(urlEqualTo("/token"))
                .withHeader("Content-Type", containing("application/x-www-form-urlencoded"))
                .withRequestBody(containing("code=4%2F0Abc-code"))
                .withRequestBody(containing("client_id=test-client.apps.googleusercontent.com"))
                .withRequestBody(containing("client_secret=test-secret-not-real"))
                .withRequestBody(containing("redirect_uri=http%3A%2F%2Flocalhost%3A5173%2Fauthenticate"))
                .withRequestBody(containing("grant_type=authorization_code")));
        google.verify(getRequestedFor(urlEqualTo("/v1/userinfo"))
                .withHeader("Authorization", equalTo("Bearer ya29.fake-access")));
    }

    @Test
    void exchange_noNameNoPicture_returnsNulls_AC18() {
        stubToken(200, "{\"access_token\":\"t\"}");
        stubUserInfo(200, "{\"sub\":\"s1\",\"email\":\"a@x.com\",\"email_verified\":true}");

        GoogleIdentity identity = exchanger.exchange("code");

        assertThat(identity.name()).isNull();
        assertThat(identity.picture()).isNull();
    }

    @Test
    void exchange_googleRejectsCodeWith400_isInvalid_AC22() {
        stubToken(400, "{\"error\":\"invalid_grant\",\"error_description\":\"Bad Request\"}");

        assertCode(() -> exchanger.exchange("used-code"), ErrorCode.AUTH_GOOGLE_TOKEN_INVALID);
    }

    @Test
    void exchange_emailNotVerified_isInvalid_AC22() {
        stubToken(200, "{\"access_token\":\"t\"}");
        stubUserInfo(200, "{\"sub\":\"s1\",\"email\":\"a@x.com\",\"email_verified\":false}");

        assertCode(() -> exchanger.exchange("code"), ErrorCode.AUTH_GOOGLE_TOKEN_INVALID);
    }

    @Test
    void exchange_emailVerifiedMissing_isInvalid_AC22() {
        stubToken(200, "{\"access_token\":\"t\"}");
        stubUserInfo(200, "{\"sub\":\"s1\",\"email\":\"a@x.com\"}");

        assertCode(() -> exchanger.exchange("code"), ErrorCode.AUTH_GOOGLE_TOKEN_INVALID);
    }

    @Test
    void exchange_missingEmailOrSub_isInvalid_AC22() {
        stubToken(200, "{\"access_token\":\"t\"}");
        stubUserInfo(200, "{\"sub\":\"s1\",\"email_verified\":true}");
        assertCode(() -> exchanger.exchange("code"), ErrorCode.AUTH_GOOGLE_TOKEN_INVALID);

        stubUserInfo(200, "{\"email\":\"a@x.com\",\"email_verified\":true}");
        assertCode(() -> exchanger.exchange("code"), ErrorCode.AUTH_GOOGLE_TOKEN_INVALID);
    }

    @Test
    void exchange_tokenResponseWithoutAccessToken_isInvalid_AC22() {
        stubToken(200, "{}");

        assertCode(() -> exchanger.exchange("code"), ErrorCode.AUTH_GOOGLE_TOKEN_INVALID);
    }

    @Test
    void exchange_googleReturns500_isUnavailable_AC23() {
        stubToken(500, "oops");

        assertCode(() -> exchanger.exchange("code"), ErrorCode.AUTH_GOOGLE_UNAVAILABLE);
    }

    @Test
    void exchange_wrongClientSecret401_isUnavailableNotUserError_AC23() {
        stubToken(401, "{\"error\":\"invalid_client\"}");

        assertCode(() -> exchanger.exchange("code"), ErrorCode.AUTH_GOOGLE_UNAVAILABLE);
    }

    @Test
    void exchange_userInfoFails_isUnavailable_AC23() {
        stubToken(200, "{\"access_token\":\"t\"}");
        stubUserInfo(503, "down");

        assertCode(() -> exchanger.exchange("code"), ErrorCode.AUTH_GOOGLE_UNAVAILABLE);
    }

    @Test
    void exchange_googleTooSlow_isUnavailable_AC23() {
        google.stubFor(post(urlEqualTo("/token")).willReturn(aResponse()
                .withFixedDelay(3000).withHeader("Content-Type", "application/json")
                .withBody("{\"access_token\":\"t\"}")));

        assertCode(() -> exchanger.exchange("code"), ErrorCode.AUTH_GOOGLE_UNAVAILABLE);
    }

    @Test
    void exchange_secretNotConfigured_isUnavailableWithoutCallingGoogle_AC23() {
        GoogleProperties noSecret = new GoogleProperties("id.apps.googleusercontent.com", "",
                "http://localhost:5173/authenticate", google.baseUrl(), google.baseUrl());
        GoogleCodeExchanger unconfigured = new GoogleCodeExchanger(noSecret, null, null);

        assertThatThrownBy(() -> unconfigured.exchange("code")).isInstanceOf(GoogleUnavailableException.class);
        assertThat(google.getAllServeEvents()).isEmpty();
    }
}
