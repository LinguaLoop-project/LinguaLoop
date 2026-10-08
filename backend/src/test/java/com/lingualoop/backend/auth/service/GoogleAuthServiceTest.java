package com.lingualoop.backend.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;

import com.lingualoop.backend.auth.dto.AuthSession;
import com.lingualoop.backend.auth.google.GoogleIdTokenVerifier;
import com.lingualoop.backend.auth.google.GoogleIdentity;
import com.lingualoop.backend.auth.google.GoogleUnavailableException;
import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.user.dto.UserAccount;
import com.lingualoop.backend.user.service.UserAccountService;

class GoogleAuthServiceTest {

    private static final String SUB = "google-sub-1";
    private static final GoogleIdentity IDENTITY = new GoogleIdentity(SUB, "minh@gmail.com", "Minh", "https://img/m.png");

    private GoogleIdTokenVerifier verifier;
    private UserAccountService users;
    private RefreshTokenService refreshTokens;
    private AuthService authService;
    private GoogleAuthService service;
    private final AuthSession session = new AuthSession(null, "raw-refresh");

    @BeforeEach
    void setUp() {
        verifier = mock(GoogleIdTokenVerifier.class);
        users = mock(UserAccountService.class);
        refreshTokens = mock(RefreshTokenService.class);
        authService = mock(AuthService.class);
        service = new GoogleAuthService(verifier, users, refreshTokens, authService);
        when(verifier.verify("id-token")).thenReturn(IDENTITY);
        when(authService.openSession(any(UserAccount.class), anyString())).thenReturn(session);
    }

    private static UserAccount account(boolean verified, boolean disabled, boolean hasPassword, boolean googleLinked) {
        return new UserAccount(UUID.randomUUID(), "minh@gmail.com", "Minh", null, hasPassword ? "hash" : null,
                Role.STUDENT, "vi", verified, disabled, false, googleLinked);
    }

    @Test
    void login_knownSub_opensSessionWithoutTouchingAccount_AC17() {
        UserAccount existing = account(true, false, false, true);
        when(users.findByGoogleSub(SUB)).thenReturn(Optional.of(existing));

        AuthSession result = service.login("id-token", "ua");

        assertThat(result).isSameAs(session);
        verify(authService).openSession(existing, "ua");
        verify(users, never()).createFromGoogle(anyString(), anyString(), any(), any());
        verify(users, never()).linkGoogle(any(), anyString());
    }

    @Test
    void login_unknownEmail_createsAccount_AC18() {
        UserAccount created = account(true, false, false, true);
        when(users.findByGoogleSub(SUB)).thenReturn(Optional.empty());
        when(users.findByEmail("minh@gmail.com")).thenReturn(Optional.empty());
        when(users.createFromGoogle(SUB, "minh@gmail.com", "Minh", "https://img/m.png")).thenReturn(created);

        service.login("id-token", "ua");

        verify(authService).openSession(created, "ua");
    }

    @Test
    void login_emailOfVerifiedLocalAccount_linksWithoutRevokingSessions_AC19() {
        UserAccount local = account(true, false, true, false);
        UserAccount linked = account(true, false, true, true);
        when(users.findByGoogleSub(SUB)).thenReturn(Optional.empty());
        when(users.findByEmail("minh@gmail.com")).thenReturn(Optional.of(local));
        when(users.linkGoogle(local.id(), SUB)).thenReturn(false);
        when(users.findById(local.id())).thenReturn(Optional.of(linked));

        service.login("id-token", "ua");

        verify(refreshTokens, never()).revokeAllForUser(any());
        verify(authService).openSession(linked, "ua");
    }

    @Test
    void login_emailOfUnverifiedLocalAccount_linksAndRevokesAllSessions_AC20() {
        UserAccount local = account(false, false, true, false);
        UserAccount linked = account(true, false, false, true);
        when(users.findByGoogleSub(SUB)).thenReturn(Optional.empty());
        when(users.findByEmail("minh@gmail.com")).thenReturn(Optional.of(local));
        when(users.linkGoogle(local.id(), SUB)).thenReturn(true);
        when(users.findById(local.id())).thenReturn(Optional.of(linked));

        service.login("id-token", "ua");

        verify(refreshTokens).revokeAllForUser(local.id());
        verify(authService).openSession(linked, "ua");
    }

    @Test
    void login_emailAlreadyLinkedToOtherGoogleAccount_conflict_AC54() {
        when(users.findByGoogleSub(SUB)).thenReturn(Optional.empty());
        when(users.findByEmail("minh@gmail.com")).thenReturn(Optional.of(account(true, false, false, true)));

        assertThatThrownBy(() -> service.login("id-token", "ua"))
                .isInstanceOfSatisfying(BusinessException.class,
                        e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.AUTH_GOOGLE_LINK_CONFLICT));
        verify(users, never()).linkGoogle(any(), anyString());
    }

    @Test
    void login_disabledAccountFoundBySub_isRejected_AC24() {
        when(users.findByGoogleSub(SUB)).thenReturn(Optional.of(account(true, true, false, true)));

        assertThatThrownBy(() -> service.login("id-token", "ua"))
                .isInstanceOfSatisfying(BusinessException.class,
                        e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.AUTH_ACCOUNT_DISABLED));
        verify(authService, never()).openSession(any(), anyString());
    }

    @Test
    void login_disabledLocalAccountByEmail_isRejectedBeforeLinking_AC24() {
        when(users.findByGoogleSub(SUB)).thenReturn(Optional.empty());
        when(users.findByEmail("minh@gmail.com")).thenReturn(Optional.of(account(false, true, true, false)));

        assertThatThrownBy(() -> service.login("id-token", "ua"))
                .isInstanceOfSatisfying(BusinessException.class,
                        e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.AUTH_ACCOUNT_DISABLED));
        verify(users, never()).linkGoogle(any(), anyString());
        verify(refreshTokens, never()).revokeAllForUser(any());
    }

    @Test
    void login_concurrentCreate_picksUpTheAccountTheOtherRequestCreated() {
        UserAccount created = account(true, false, false, true);
        when(users.findByGoogleSub(SUB)).thenReturn(Optional.empty(), Optional.of(created));
        when(users.findByEmail("minh@gmail.com")).thenReturn(Optional.empty());
        when(users.createFromGoogle(eq(SUB), anyString(), any(), any())).thenThrow(new DataIntegrityViolationException("dup"));

        service.login("id-token", "ua");

        verify(authService).openSession(created, "ua");
    }

    @Test
    void login_concurrentCreateButNothingFoundAfterwards_rethrows() {
        when(users.findByGoogleSub(SUB)).thenReturn(Optional.empty());
        when(users.findByEmail("minh@gmail.com")).thenReturn(Optional.empty());
        when(users.createFromGoogle(eq(SUB), anyString(), any(), any())).thenThrow(new DataIntegrityViolationException("dup"));

        assertThatThrownBy(() -> service.login("id-token", "ua")).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void login_verifierRejectsToken_propagatesAndTouchesNothing_AC22() {
        when(verifier.verify("bad")).thenThrow(new BusinessException(ErrorCode.AUTH_GOOGLE_TOKEN_INVALID));

        assertThatThrownBy(() -> service.login("bad", "ua")).isInstanceOf(BusinessException.class);
        verify(users, never()).findByGoogleSub(anyString());
    }

    @Test
    void login_googleUnavailable_propagates_AC23() {
        when(verifier.verify("id-token")).thenThrow(new GoogleUnavailableException("down"));

        assertThatThrownBy(() -> service.login("id-token", "ua")).isInstanceOf(GoogleUnavailableException.class);
    }
}
