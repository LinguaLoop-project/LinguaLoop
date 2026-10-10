package com.lingualoop.backend.auth.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.after;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.auth.entity.EmailToken;
import com.lingualoop.backend.auth.mail.AuthMailSender;
import com.lingualoop.backend.auth.repository.EmailTokenRepository;
import com.lingualoop.backend.support.MutableClock;
import com.lingualoop.backend.support.TestClockConfiguration;
import com.lingualoop.backend.user.dto.UserAccount;
import com.lingualoop.backend.user.service.UserAccountService;

@SpringBootTest
@AutoConfigureMockMvc
@Import({ TestcontainersConfiguration.class, TestClockConfiguration.class })
class EmailVerificationIntegrationTest {

    /** Thư gửi ở luồng nền: chờ tối đa chừng này để thấy thư đã gửi, hoặc chờ chừng này để chắc là không gửi. */
    private static final long MAIL_WAIT_MS = 2000;
    private static final long NO_MAIL_WAIT_MS = 300;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserAccountService userAccountService;

    @Autowired
    private EmailTokenRepository emailTokenRepository;

    @Autowired
    private MutableClock clock;

    @MockitoBean
    private AuthMailSender authMailSender;

    @BeforeEach
    void resetClock() {
        clock.reset();
    }

    private static String uniqueEmail() {
        return "ver-" + UUID.randomUUID() + "@x.com";
    }

    /** Đăng ký qua API và trả token thô trong thư xác thực đầu tiên. */
    private String registerAndCaptureToken(String email) throws Exception {
        String body = """
                {"email":"%s","password":"password123","displayName":"Minh","acceptTerms":true}""".formatted(email);
        mockMvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated());
        return lastMailedToken(email);
    }

    private String lastMailedToken(String email) {
        ArgumentCaptor<String> token = ArgumentCaptor.forClass(String.class);
        verify(authMailSender, org.mockito.Mockito.atLeastOnce()).sendVerifyEmail(eq(email), any(), token.capture());
        return token.getAllValues().get(token.getAllValues().size() - 1);
    }

    private ResultActions verifyEmail(String token) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/verify-email").contentType(MediaType.APPLICATION_JSON)
                .content("{\"token\":\"%s\"}".formatted(token)));
    }

    private ResultActions resend(String email) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/verify-email/resend").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"%s\"}".formatted(email)));
    }

    private List<EmailToken> tokensOf(String email) {
        UserAccount user = userAccountService.findByEmail(email).orElseThrow();
        return emailTokenRepository.findAll().stream().filter(t -> t.getUserId().equals(user.id()))
                .sorted(Comparator.comparing(EmailToken::getCreatedAt)).toList();
    }

    @Test
    void verify_validToken_marksEmailVerified_AC28() throws Exception {
        String email = uniqueEmail();
        String token = registerAndCaptureToken(email);

        verifyEmail(token)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.result").value("VERIFIED"));

        assertThat(userAccountService.findByEmail(email).orElseThrow().emailVerified()).isTrue();
        assertThat(tokensOf(email)).allSatisfy(t -> assertThat(t.getUsedAt()).isNotNull());
    }

    @Test
    void registerThenVerifyThenLogin_loginOnlyWorksAfterVerification_AC28() throws Exception {
        String email = uniqueEmail();
        String token = registerAndCaptureToken(email);
        String loginBody = "{\"email\":\"%s\",\"password\":\"password123\"}".formatted(email);

        mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON).content(loginBody))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("AUTH_EMAIL_NOT_VERIFIED"));

        verifyEmail(token).andExpect(status().isOk()).andExpect(jsonPath("$.data.result").value("VERIFIED"));

        mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON).content(loginBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.data.user.email").value(email))
                .andExpect(jsonPath("$.data.user.emailVerified").value(true));
    }

    @Test
    void verify_emailAlreadyVerified_returnsAlreadyVerifiedNotError_AC30() throws Exception {
        String email = uniqueEmail();
        String token = registerAndCaptureToken(email);
        verifyEmail(token).andExpect(status().isOk());

        verifyEmail(token)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.result").value("ALREADY_VERIFIED"));
    }

    @Test
    void verify_unknownToken_returnsLinkInvalid_AC32() throws Exception {
        verifyEmail("not-a-real-token")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("AUTH_LINK_INVALID"));
    }

    @Test
    void verify_blankToken_returnsValidationFailed() throws Exception {
        verifyEmail("")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    void verify_tokenOlderThan24Hours_returnsLinkInvalidAndKeepsUnverified_AC32() throws Exception {
        String email = uniqueEmail();
        String token = registerAndCaptureToken(email);

        clock.advance(Duration.ofHours(24).plusSeconds(1));

        verifyEmail(token)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("AUTH_LINK_INVALID"));
        assertThat(userAccountService.findByEmail(email).orElseThrow().emailVerified()).isFalse();
    }

    @Test
    void verify_tokenJustInsideTtl_isAccepted_AC28() throws Exception {
        String email = uniqueEmail();
        String token = registerAndCaptureToken(email);

        clock.advance(Duration.ofHours(23).plusMinutes(59));

        verifyEmail(token).andExpect(status().isOk()).andExpect(jsonPath("$.data.result").value("VERIFIED"));
    }

    @Test
    void resend_afterCooldown_sendsNewMailAndInvalidatesOldLink_AC29() throws Exception {
        String email = uniqueEmail();
        String oldToken = registerAndCaptureToken(email);
        clock.advance(Duration.ofSeconds(61));

        resend(email).andExpect(status().isAccepted());

        verify(authMailSender, timeout(MAIL_WAIT_MS).times(2)).sendVerifyEmail(eq(email), any(), any());
        String newToken = lastMailedToken(email);
        assertThat(newToken).isNotEqualTo(oldToken);
        verifyEmail(oldToken).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("AUTH_LINK_INVALID"));
        verifyEmail(newToken).andExpect(status().isOk()).andExpect(jsonPath("$.data.result").value("VERIFIED"));
    }

    @Test
    void resend_unknownEmail_returns202WithoutSendingMail_AC29() throws Exception {
        String email = uniqueEmail();

        resend(email).andExpect(status().isAccepted());

        verify(authMailSender, after(NO_MAIL_WAIT_MS).never()).sendVerifyEmail(eq(email), any(), any());
    }

    @Test
    void resend_withinCooldown_returns202WithoutSendingNewMail_AC31() throws Exception {
        String email = uniqueEmail();
        registerAndCaptureToken(email);
        clock.advance(Duration.ofSeconds(59));

        resend(email).andExpect(status().isAccepted());

        verify(authMailSender, after(NO_MAIL_WAIT_MS).times(1)).sendVerifyEmail(eq(email), any(), any());
        assertThat(tokensOf(email)).hasSize(1);
    }

    @Test
    void resend_alreadyVerifiedEmail_returns202WithoutSendingMail() throws Exception {
        String email = uniqueEmail();
        verifyEmail(registerAndCaptureToken(email)).andExpect(status().isOk());
        clock.advance(Duration.ofSeconds(61));

        resend(email).andExpect(status().isAccepted());

        verify(authMailSender, after(NO_MAIL_WAIT_MS).times(1)).sendVerifyEmail(eq(email), any(), any());
    }

    @Test
    void resend_emailInDifferentCase_stillMatchesAccount_AC29() throws Exception {
        String email = uniqueEmail();
        registerAndCaptureToken(email);
        clock.advance(Duration.ofSeconds(61));

        resend(email.toUpperCase()).andExpect(status().isAccepted());

        // thư luôn gửi tới địa chỉ lưu trong tài khoản, không phải chuỗi người dùng gõ
        verify(authMailSender, timeout(MAIL_WAIT_MS).times(2)).sendVerifyEmail(eq(email), any(), any());
    }

    @Test
    void resend_invalidEmailFormat_returns400() throws Exception {
        resend("not-an-email")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    void resend_mailSendFails_stillReturns202() throws Exception {
        String email = uniqueEmail();
        registerAndCaptureToken(email);
        clock.advance(Duration.ofSeconds(61));
        doThrow(new IllegalStateException("smtp down")).when(authMailSender).sendVerifyEmail(any(), any(), any());

        resend(email).andExpect(status().isAccepted());
    }

    @Test
    void resend_slowSmtp_doesNotDelayResponse_BRAUTH04() throws Exception {
        String email = uniqueEmail();
        registerAndCaptureToken(email);
        clock.advance(Duration.ofSeconds(61));
        doAnswer(invocation -> {
            Thread.sleep(1500);
            return null;
        }).when(authMailSender).sendVerifyEmail(any(), any(), any());

        long start = System.nanoTime();
        resend(email).andExpect(status().isAccepted());
        long elapsedMs = Duration.ofNanos(System.nanoTime() - start).toMillis();

        assertThat(elapsedMs).isLessThan(1000);
    }
}
