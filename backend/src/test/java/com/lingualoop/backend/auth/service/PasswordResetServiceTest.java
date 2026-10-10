package com.lingualoop.backend.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.SimpleTransactionStatus;
import org.springframework.transaction.support.TransactionTemplate;

import com.lingualoop.backend.auth.entity.EmailToken;
import com.lingualoop.backend.auth.mail.AuthMailDispatcher;
import com.lingualoop.backend.auth.repository.EmailTokenRepository;
import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.config.AuthProperties;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.user.dto.UserAccount;
import com.lingualoop.backend.user.service.UserAccountService;

class PasswordResetServiceTest {

    private static final Instant NOW = Instant.parse("2026-10-09T10:00:00Z");
    private static final String RAW = "raw-token";

    private EmailTokenRepository tokens;
    private UserAccountService accounts;
    private RefreshTokenService refreshTokens;
    private LoginAttemptService loginAttempts;
    private AuthMailDispatcher dispatcher;
    private PasswordResetService service;

    @BeforeEach
    void setUp() {
        tokens = mock(EmailTokenRepository.class);
        accounts = mock(UserAccountService.class);
        refreshTokens = mock(RefreshTokenService.class);
        loginAttempts = mock(LoginAttemptService.class);
        dispatcher = mock(AuthMailDispatcher.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        when(encoder.encode(anyString())).thenReturn("hashed");
        PlatformTransactionManager txManager = mock(PlatformTransactionManager.class);
        when(txManager.getTransaction(any())).thenReturn(new SimpleTransactionStatus());
        AuthProperties props = new AuthProperties("http://localhost:5173", "no-reply@lingualoop.test", 5,
                Duration.ofMinutes(15), Duration.ofHours(24), Duration.ofMinutes(30), Duration.ofSeconds(60),
                Duration.ofDays(30), Duration.ofSeconds(10), new AuthProperties.Cookie("Lax", false));

        service = new PasswordResetService(tokens, accounts, refreshTokens, loginAttempts, dispatcher, encoder, props,
                Clock.fixed(NOW, ZoneOffset.UTC), new TransactionTemplate(txManager));
    }

    private static UserAccount account(boolean disabled, String passwordHash) {
        return new UserAccount(UUID.randomUUID(), "a@x.com", "A", null, passwordHash, Role.STUDENT, "vi", false,
                disabled, false, false);
    }

    private static EmailToken tokenOf(UserAccount account, Instant createdAt, Duration ttl) {
        return EmailToken.issue(account.id(), EmailToken.RESET_PASSWORD, SecureTokens.sha256(RAW), createdAt,
                createdAt.plus(ttl));
    }

    private void givenToken(EmailToken token) {
        when(tokens.findByTokenHashAndPurpose(SecureTokens.sha256(RAW), EmailToken.RESET_PASSWORD))
                .thenReturn(Optional.of(token));
    }

    @Test
    void request_unknownEmail_doesNothing_AC34() {
        when(accounts.findByEmail("a@x.com")).thenReturn(Optional.empty());

        service.request("a@x.com");

        verify(tokens, never()).save(any());
        verifyNoInteractions(dispatcher);
    }

    @Test
    void request_disabledAccount_doesNothing_AC34() {
        when(accounts.findByEmail("a@x.com")).thenReturn(Optional.of(account(true, "hash")));

        service.request("a@x.com");

        verify(tokens, never()).save(any());
        verifyNoInteractions(dispatcher);
    }

    @Test
    void request_lastMailWithinCooldown_doesNothing_AC38() {
        UserAccount user = account(false, "hash");
        when(accounts.findByEmail("a@x.com")).thenReturn(Optional.of(user));
        when(tokens.findFirstByUserIdAndPurposeOrderByCreatedAtDesc(user.id(), EmailToken.RESET_PASSWORD))
                .thenReturn(Optional.of(tokenOf(user, NOW.minusSeconds(59), Duration.ofMinutes(30))));

        service.request("a@x.com");

        verify(tokens, never()).save(any());
        verifyNoInteractions(dispatcher);
    }

    @Test
    void request_lastMailExactlyAtCooldown_issuesNewToken_AC38() {
        UserAccount user = account(false, "hash");
        when(accounts.findByEmail("a@x.com")).thenReturn(Optional.of(user));
        when(tokens.findFirstByUserIdAndPurposeOrderByCreatedAtDesc(user.id(), EmailToken.RESET_PASSWORD))
                .thenReturn(Optional.of(tokenOf(user, NOW.minusSeconds(60), Duration.ofMinutes(30))));

        service.request("a@x.com");

        verify(dispatcher).sendResetPassword(any(), any());
    }

    @Test
    void request_eligibleAccount_storesHashWith30MinuteExpiryAndMailsRawToken_AC33() {
        UserAccount user = account(false, "hash");
        when(accounts.findByEmail("a@x.com")).thenReturn(Optional.of(user));
        when(tokens.findFirstByUserIdAndPurposeOrderByCreatedAtDesc(user.id(), EmailToken.RESET_PASSWORD))
                .thenReturn(Optional.empty());

        service.request("a@x.com");

        verify(tokens).markAllUsed(user.id(), EmailToken.RESET_PASSWORD, NOW);
        ArgumentCaptor<EmailToken> saved = ArgumentCaptor.forClass(EmailToken.class);
        verify(tokens).save(saved.capture());
        ArgumentCaptor<String> raw = ArgumentCaptor.forClass(String.class);
        verify(dispatcher).sendResetPassword(any(), raw.capture());
        assertThat(saved.getValue().getPurpose()).isEqualTo(EmailToken.RESET_PASSWORD);
        assertThat(saved.getValue().getTokenHash()).isEqualTo(SecureTokens.sha256(raw.getValue()));
        assertThat(saved.getValue().getExpiresAt()).isEqualTo(NOW.plus(Duration.ofMinutes(30)));
    }

    @Test
    void request_googleOnlyAccount_isMailedToo_AC36() {
        UserAccount google = account(false, null);
        when(accounts.findByEmail("a@x.com")).thenReturn(Optional.of(google));
        when(tokens.findFirstByUserIdAndPurposeOrderByCreatedAtDesc(google.id(), EmailToken.RESET_PASSWORD))
                .thenReturn(Optional.empty());

        service.request("a@x.com");

        verify(dispatcher).sendResetPassword(any(), any());
    }

    @Test
    void validate_unknownToken_throwsLinkInvalid_AC39() {
        when(tokens.findByTokenHashAndPurpose(anyString(), anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.validate(RAW)).isInstanceOfSatisfying(BusinessException.class,
                e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.AUTH_LINK_INVALID));
    }

    @Test
    void validate_usedToken_throwsLinkInvalid_AC39() {
        EmailToken token = tokenOf(account(false, "hash"), NOW.minusSeconds(10), Duration.ofMinutes(30));
        token.markUsed(NOW.minusSeconds(5));
        givenToken(token);

        assertThatThrownBy(() -> service.validate(RAW)).isInstanceOfSatisfying(BusinessException.class,
                e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.AUTH_LINK_INVALID));
    }

    @Test
    void validate_expiredToken_throwsLinkInvalid_AC39() {
        givenToken(tokenOf(account(false, "hash"), NOW.minus(Duration.ofMinutes(31)), Duration.ofMinutes(30)));

        assertThatThrownBy(() -> service.validate(RAW)).isInstanceOfSatisfying(BusinessException.class,
                e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.AUTH_LINK_INVALID));
    }

    @Test
    void validate_usableToken_hasNoSideEffects_AC39() {
        EmailToken token = tokenOf(account(false, "hash"), NOW.minusSeconds(10), Duration.ofMinutes(30));
        givenToken(token);

        service.validate(RAW);

        assertThat(token.isUsed()).isFalse();
        verifyNoInteractions(accounts, refreshTokens, loginAttempts);
    }

    @Test
    void reset_usableToken_savesPasswordVerifiesEmailRevokesSessionsAndClearsLock_AC35() {
        UserAccount user = account(false, "old");
        EmailToken token = tokenOf(user, NOW.minusSeconds(10), Duration.ofMinutes(30));
        givenToken(token);
        when(accounts.findById(user.id())).thenReturn(Optional.of(user));

        service.reset(RAW, "newpassword456");

        assertThat(token.isUsed()).isTrue();
        verify(tokens).markAllUsed(user.id(), EmailToken.RESET_PASSWORD, NOW);
        verify(accounts).updatePasswordHash(user.id(), "hashed");
        verify(accounts).markEmailVerified(user.id());
        verify(refreshTokens).revokeAllForUser(user.id());
        verify(loginAttempts).clear("a@x.com");
    }

    @Test
    void reset_invalidToken_changesNothing_AC39() {
        when(tokens.findByTokenHashAndPurpose(anyString(), anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.reset(RAW, "newpassword456")).isInstanceOfSatisfying(BusinessException.class,
                e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.AUTH_LINK_INVALID));

        verifyNoInteractions(accounts, refreshTokens, loginAttempts);
    }

    @Test
    void reset_accountNoLongerExists_throwsLinkInvalid_AC39() {
        UserAccount user = account(false, "old");
        givenToken(tokenOf(user, NOW.minusSeconds(10), Duration.ofMinutes(30)));
        when(accounts.findById(user.id())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.reset(RAW, "newpassword456")).isInstanceOfSatisfying(BusinessException.class,
                e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.AUTH_LINK_INVALID));

        verify(accounts, never()).updatePasswordHash(any(), any());
    }
}
