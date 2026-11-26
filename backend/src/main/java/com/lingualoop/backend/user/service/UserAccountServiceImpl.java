package com.lingualoop.backend.user.service;

import java.time.Clock;
import java.time.DateTimeException;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.common.exception.FieldValidationException;
import com.lingualoop.backend.common.exception.NotFoundException;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.storage.service.FileStorageService;
import com.lingualoop.backend.storage.service.UploadPurpose;
import com.lingualoop.backend.user.dto.UserAccountView;
import com.lingualoop.backend.user.dto.response.MeResponse;
import com.lingualoop.backend.user.entity.User;
import com.lingualoop.backend.user.mapper.UserMapper;
import com.lingualoop.backend.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
class UserAccountServiceImpl implements UserAccountService {

    private static final int DISPLAY_NAME_MAX = 50;
    /** BR-TK-13: thời lượng học mỗi ngày chọn một trong các mức này. */
    private static final Set<Integer> DAILY_MINUTES = Set.of(10, 15, 20, 30);
    private static final Set<String> UI_LANGUAGES = Set.of("vi", "en");

    private final UserRepository userRepository;
    private final Clock clock;
    private final UserMapper userMapper;
    private final FileStorageService storage;
    private final AvatarImageValidator avatarValidator;

    @Override
    @Transactional(readOnly = true)
    public Optional<UserAccountView> findByEmail(String email) {
        return userRepository.findByEmail(email).map(userMapper::toUserAccountView);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<UserAccountView> findById(UUID id) {
        return userRepository.findById(id).map(userMapper::toUserAccountView);
    }

    @Override
    @Transactional
    public UserAccountView createLocal(String email, String displayName, String passwordHash) {
        User user = User.createLocal(email, displayName, passwordHash, Instant.now(clock));
        return userMapper.toUserAccountView(userRepository.saveAndFlush(user));
    }

    @Override
    @Transactional
    public void markEmailVerified(UUID userId) {
        load(userId).markEmailVerified(Instant.now(clock));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<UserAccountView> findByGoogleSub(String sub) {
        return userRepository.findByGoogleSub(sub).map(userMapper::toUserAccountView);
    }

    @Override
    @Transactional
    public UserAccountView createFromGoogle(String sub, String email, String name, String pictureUrl) {
        User user = User.createFromGoogle(sub, email, googleDisplayName(name, email), pictureUrl,
                Instant.now(clock));
        return userMapper.toUserAccountView(userRepository.saveAndFlush(user));
    }

    @Override
    @Transactional
    public boolean linkGoogle(UUID userId, String sub) {
        return load(userId).linkGoogle(sub, Instant.now(clock));
    }

    @Override
    @Transactional
    public void updatePasswordHash(UUID userId, String passwordHash) {
        load(userId).changePassword(passwordHash);
    }

    private User load(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found: " + userId));
    }

    /** Tên Google, cắt còn 50 ký tự; trống thì lấy phần trước @ của email. */
    private static String googleDisplayName(String name, String email) {
        String base = name == null ? "" : name.strip();
        if (base.isEmpty()) {
            int at = email.indexOf('@');
            base = at < 0 ? email : email.substring(0, at);
        }
        return base.codePointCount(0, base.length()) <= DISPLAY_NAME_MAX
                ? base
                : base.substring(0, base.offsetByCodePoints(0, DISPLAY_NAME_MAX));
    }

    @Override
    @Transactional
    public UserAccountView saveLearningProfile(UUID userId, String displayName, int dailyMinutes, String uiLanguage,
            String timezone, boolean acceptTerms) {
        User user = load(userId);
        if (user.getRole() != Role.STUDENT) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        String name = displayName == null ? "" : displayName.strip();
        if (name.isEmpty()) {
            throw new FieldValidationException("displayName", "NotBlank");
        }
        if (name.codePointCount(0, name.length()) > DISPLAY_NAME_MAX) {
            throw new FieldValidationException("displayName", "Size");
        }
        if (!DAILY_MINUTES.contains(dailyMinutes)) {
            throw new FieldValidationException("dailyMinutes", "Allowed");
        }
        if (!UI_LANGUAGES.contains(uiLanguage)) {
            throw new FieldValidationException("uiLanguage", "Allowed");
        }
        if (!isValidZone(timezone)) {
            throw new FieldValidationException("timezone", "Allowed");
        }
        // BR-TK-14: chưa từng đồng ý thì phải đồng ý ở bước này, nếu không thì không lưu gì cả.
        if (user.getTermsAcceptedAt() == null && !acceptTerms) {
            throw new FieldValidationException("acceptTerms", "AssertTrue");
        }
        user.saveLearningProfile(name, (short) dailyMinutes, uiLanguage, timezone, acceptTerms, Instant.now(clock));
        return userMapper.toUserAccountView(user);
    }

    private static boolean isValidZone(String timezone) {
        if (timezone == null || timezone.isBlank()) {
            return false;
        }
        try {
            ZoneId.of(timezone);
            return true;
        } catch (DateTimeException e) {
            return false;
        }
    }

    @Override
    @Transactional
    public UserAccountView setAvatar(UUID userId, String key) {
        User user = load(userId);
        requireStudent(user);
        try {
            storage.confirmUpload(userId, UploadPurpose.AVATAR, key);
        } catch (BusinessException ex) {
            if (ex.getErrorCode() == ErrorCode.STORAGE_FILE_INVALID) {
                throw new FieldValidationException(AvatarImageValidator.FIELD, AvatarImageValidator.CODE_TYPE);
            }
            throw ex;
        }
        try {
            avatarValidator.validate(storage.readHead(key, AvatarImageValidator.HEAD_BYTES));
        } catch (FieldValidationException ex) {
            discardQuietly(userId, key);
            throw ex;
        }
        String previous = user.getAvatarKey();
        user.changeAvatarKey(key);
        UserAccountView view = userMapper.toUserAccountView(userRepository.saveAndFlush(user));
        if (previous != null && !previous.equals(key)) {
            discardQuietly(userId, previous);
        }
        return view;
    }

    @Override
    @Transactional
    public UserAccountView removeAvatar(UUID userId) {
        User user = load(userId);
        requireStudent(user);
        String previous = user.getAvatarKey();
        user.changeAvatarKey(null);
        UserAccountView view = userMapper.toUserAccountView(userRepository.saveAndFlush(user));
        if (previous != null) {
            discardQuietly(userId, previous);
        }
        return view;
    }

    private static void requireStudent(User user) {
        if (user.getRole() != Role.STUDENT) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
    }

    /** Xóa tệp thừa trên S3; lỗi kho tệp không được làm hỏng thao tác đã thành công của học viên. */
    private void discardQuietly(UUID userId, String key) {
        try {
            storage.discardUpload(userId, UploadPurpose.AVATAR, key);
        } catch (RuntimeException ex) {
            log.warn("Không xóa được ảnh đại diện cũ: {}", key, ex);
        }
    }

    @Override
    public MeResponse toMe(UserAccountView account) {
        MeResponse me = userMapper.toMe(account);
        if (account.avatarKey() == null) {
            return me;
        }
        return new MeResponse(me.id(), me.email(), me.displayName(), storage.publicUrl(account.avatarKey()), me.role(),
                me.emailVerified(), me.onboarded(), me.hasPassword(), me.googleLinked(), me.dailyMinutes(),
                me.uiLanguage(), me.timezone(), me.termsAccepted(), true);
    }
}
