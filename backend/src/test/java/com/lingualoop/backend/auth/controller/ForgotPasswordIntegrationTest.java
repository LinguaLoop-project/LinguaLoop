package com.lingualoop.backend.auth.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.after;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.timeout;
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
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.auth.entity.EmailToken;
import com.lingualoop.backend.auth.mail.AuthMailSender;
import com.lingualoop.backend.auth.repository.EmailTokenRepository;
import com.lingualoop.backend.auth.service.SecureTokens;
import com.lingualoop.backend.support.MutableClock;
import com.lingualoop.backend.support.TestClockConfiguration;
import com.lingualoop.backend.user.dto.UserAccount;
import com.lingualoop.backend.user.service.UserAccountService;

@SpringBootTest
@AutoConfigureMockMvc
@Import({ TestcontainersConfiguration.class, TestClockConfiguration.class })
class ForgotPasswordIntegrationTest {

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
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private MutableClock clock;

    @MockitoBean
    private AuthMailSender authMailSender;

    @BeforeEach
    void resetClock() {
        clock.reset();
    }

    private static String uniqueEmail() {
        return "forgot-" + UUID.randomUUID() + "@x.com";
    }

    private UserAccount verifiedUser() {
        UserAccount user = userAccountService.createLocal(uniqueEmail(), "Minh", passwordEncoder.encode("password123"));
        userAccountService.markEmailVerified(user.id());
        return user;
    }

    private ResultActions forgot(String email) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/forgot-password").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"%s\"}".formatted(email)));
    }

    private ResultActions validate(String token) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/reset-password/validate").contentType(MediaType.APPLICATION_JSON)
                .content("{\"token\":\"%s\"}".formatted(token)));
    }

    /** Token thô trong thư đặt lại gần nhất gửi tới {@code email}, sau khi đã có đúng {@code mails} thư. */
    private String lastMailedToken(String email, int mails) {
        ArgumentCaptor<String> token = ArgumentCaptor.forClass(String.class);
        verify(authMailSender, timeout(MAIL_WAIT_MS).times(mails)).sendResetPassword(eq(email), any(), token.capture(),
                anyBoolean());
        return token.getAllValues().get(token.getAllValues().size() - 1);
    }

    private void assertNoMail(String email) {
        verify(authMailSender, after(NO_MAIL_WAIT_MS).never()).sendResetPassword(eq(email), any(), any(), anyBoolean());
    }

    private List<EmailToken> resetTokensOf(String email) {
        UserAccount user = userAccountService.findByEmail(email).orElseThrow();
        return emailTokenRepository.findAll().stream()
                .filter(t -> t.getUserId().equals(user.id()) && EmailToken.RESET_PASSWORD.equals(t.getPurpose()))
                .sorted(Comparator.comparing(EmailToken::getCreatedAt)).toList();
    }

    @Test
    void forgot_existingEmail_sendsMailAndStoresOnlyTokenHash_AC33() throws Exception {
        UserAccount user = verifiedUser();

        forgot(user.email()).andExpect(status().isAccepted());

        String raw = lastMailedToken(user.email(), 1);
        List<EmailToken> tokens = resetTokensOf(user.email());
        assertThat(tokens).hasSize(1);
        assertThat(tokens.get(0).getUsedAt()).isNull();
        assertThat(tokens.get(0).getExpiresAt()).isEqualTo(tokens.get(0).getCreatedAt().plus(Duration.ofMinutes(30)));
        assertThat(tokens.get(0).getTokenHash()).isEqualTo(SecureTokens.sha256(raw)).isNotEqualTo(raw);
        verify(authMailSender).sendResetPassword(eq(user.email()), any(), eq(raw), eq(true));
    }

    @Test
    void forgot_emailInDifferentCase_stillMatchesAccount_AC33() throws Exception {
        UserAccount user = verifiedUser();

        forgot(user.email().toUpperCase()).andExpect(status().isAccepted());

        // thư luôn gửi tới địa chỉ lưu trong tài khoản, không phải chuỗi người dùng gõ
        lastMailedToken(user.email(), 1);
    }

    @Test
    void forgot_unknownEmail_returns202WithoutMail_AC34() throws Exception {
        String email = uniqueEmail();

        forgot(email).andExpect(status().isAccepted());

        assertNoMail(email);
    }

    @Test
    void forgot_responseIsIdenticalForKnownAndUnknownEmail_AC34() throws Exception {
        UserAccount user = verifiedUser();

        MvcResult known = forgot(user.email()).andReturn();
        MvcResult unknown = forgot(uniqueEmail()).andReturn();

        assertThat(known.getResponse().getStatus()).isEqualTo(unknown.getResponse().getStatus());
        assertThat(known.getResponse().getContentAsString()).isEqualTo(unknown.getResponse().getContentAsString());
    }

    @Test
    void forgot_disabledAccount_returns202WithoutMail_AC34() throws Exception {
        UserAccount user = verifiedUser();
        jdbcTemplate.update("UPDATE users SET disabled = true WHERE id = ?", user.id());

        forgot(user.email()).andExpect(status().isAccepted());

        assertNoMail(user.email());
        assertThat(resetTokensOf(user.email())).isEmpty();
    }

    @Test
    void forgot_googleOnlyAccount_sendsSetPasswordVariant_AC36() throws Exception {
        String email = uniqueEmail();
        userAccountService.createFromGoogle("sub-" + UUID.randomUUID(), email, "Gia", null);

        forgot(email).andExpect(status().isAccepted());

        verify(authMailSender, timeout(MAIL_WAIT_MS)).sendResetPassword(eq(email), any(), any(), eq(false));
    }

    @Test
    void forgot_invalidEmailFormat_returns400WithoutMail_AC37() throws Exception {
        forgot("not-an-email")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.errors[0].field").value("email"));
    }

    @Test
    void forgot_blankEmail_returns400_AC37() throws Exception {
        forgot("")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.errors[0].field").value("email"));
    }

    @Test
    void forgot_withinCooldown_returns202WithoutSecondMail_AC38() throws Exception {
        UserAccount user = verifiedUser();
        forgot(user.email()).andExpect(status().isAccepted());
        lastMailedToken(user.email(), 1);
        clock.advance(Duration.ofSeconds(59));

        forgot(user.email()).andExpect(status().isAccepted());

        verify(authMailSender, after(NO_MAIL_WAIT_MS).times(1)).sendResetPassword(eq(user.email()), any(), any(),
                anyBoolean());
        assertThat(resetTokensOf(user.email())).hasSize(1);
    }

    @Test
    void forgot_afterCooldown_sendsNewMailAndInvalidatesOldLink_AC38() throws Exception {
        UserAccount user = verifiedUser();
        forgot(user.email()).andExpect(status().isAccepted());
        String oldToken = lastMailedToken(user.email(), 1);
        clock.advance(Duration.ofSeconds(61));

        forgot(user.email()).andExpect(status().isAccepted());

        String newToken = lastMailedToken(user.email(), 2);
        assertThat(newToken).isNotEqualTo(oldToken);
        validate(oldToken).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("AUTH_LINK_INVALID"));
        validate(newToken).andExpect(status().isOk());
    }

    @Test
    void forgot_cooldownIsPerPurpose_recentVerificationMailDoesNotBlockReset_AC38() throws Exception {
        String email = uniqueEmail();
        mockMvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content(
                "{\"email\":\"%s\",\"password\":\"password123\",\"displayName\":\"Minh\",\"acceptTerms\":true}"
                        .formatted(email)))
                .andExpect(status().isCreated());

        forgot(email).andExpect(status().isAccepted());

        lastMailedToken(email, 1);
    }

    @Test
    void forgot_mailSendFails_stillReturns202_AC33() throws Exception {
        UserAccount user = verifiedUser();
        doThrow(new IllegalStateException("smtp down")).when(authMailSender).sendResetPassword(any(), any(), any(),
                anyBoolean());

        forgot(user.email()).andExpect(status().isAccepted());
    }

    @Test
    void forgot_slowSmtp_doesNotDelayResponse_BRAUTH04() throws Exception {
        UserAccount user = verifiedUser();
        doAnswer(invocation -> {
            Thread.sleep(1500);
            return null;
        }).when(authMailSender).sendResetPassword(any(), any(), any(), anyBoolean());

        long start = System.nanoTime();
        forgot(user.email()).andExpect(status().isAccepted());
        long elapsedMs = Duration.ofNanos(System.nanoTime() - start).toMillis();

        assertThat(elapsedMs).isLessThan(1000);
    }
}
