package com.lingualoop.backend.vocab.service;

import java.util.List;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ConflictException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.common.exception.FieldValidationException;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.user.dto.UserAccountView;
import com.lingualoop.backend.user.service.UserAccountService;
import com.lingualoop.backend.vocab.dto.MyDeckView;
import com.lingualoop.backend.vocab.repository.MyDeckRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
class MyDeckServiceImpl implements MyDeckService {

    static final int NAME_MAX = 100;
    static final String DUPLICATE_NAME = "Bạn đã có bộ từ cùng tên";
    private static final String UNIQUE_NAME_INDEX = "uq_vocab_decks_name";

    private final MyDeckRepository repository;
    private final UserAccountService users;

    @Override
    @Transactional(readOnly = true)
    public List<MyDeckView> list(UUID userId) {
        requireStudent(userId);
        return repository.findAll(userId);
    }

    @Override
    @Transactional
    public MyDeckView create(UUID userId, String rawName) {
        requireStudent(userId);
        String name = validName(rawName);
        if (repository.existsName(userId, name, null)) {
            throw new ConflictException(DUPLICATE_NAME);
        }
        UUID id;
        try {
            id = repository.insert(userId, name);
        } catch (DataIntegrityViolationException ex) {
            throw duplicateOrRethrow(ex);
        }
        return found(userId, id);
    }

    @Override
    @Transactional
    public MyDeckView rename(UUID userId, UUID deckId, String rawName) {
        requireStudent(userId);
        String name = validName(rawName);
        // Bộ phải có trước khi xét tên để bộ của người khác luôn báo không tìm thấy (BR-HT-06).
        found(userId, deckId);
        if (repository.existsName(userId, name, deckId)) {
            throw new ConflictException(DUPLICATE_NAME);
        }
        try {
            if (repository.rename(userId, deckId, name) == 0) {
                throw new BusinessException(ErrorCode.VOCAB_DECK_NOT_FOUND);
            }
        } catch (DataIntegrityViolationException ex) {
            throw duplicateOrRethrow(ex);
        }
        return found(userId, deckId);
    }

    @Override
    @Transactional
    public void delete(UUID userId, UUID deckId) {
        requireStudent(userId);
        if (repository.softDelete(userId, deckId) == 0) {
            throw new BusinessException(ErrorCode.VOCAB_DECK_NOT_FOUND);
        }
    }

    private MyDeckView found(UUID userId, UUID deckId) {
        return repository.findOne(userId, deckId)
                .orElseThrow(() -> new BusinessException(ErrorCode.VOCAB_DECK_NOT_FOUND));
    }

    /** Bộ cá nhân chỉ dành cho học viên; giáo viên và admin soạn bộ ở phần quản lý riêng. */
    private void requireStudent(UUID userId) {
        UserAccountView user = users.findById(userId).orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
        if (user.role() != Role.STUDENT) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
    }

    /** Tên sau khi cắt khoảng trắng hai đầu: bắt buộc, tối đa 100 ký tự (BR-HT-25). */
    static String validName(String raw) {
        String name = raw == null ? "" : raw.strip();
        if (name.isEmpty()) {
            throw new FieldValidationException("name", "NotBlank");
        }
        if (name.codePointCount(0, name.length()) > NAME_MAX) {
            throw new FieldValidationException("name", "Size");
        }
        return name;
    }

    /** Hai yêu cầu cùng đặt một tên: chỉ mục duy nhất chặn bên sau; lỗi khác được ném lại. */
    private static RuntimeException duplicateOrRethrow(DataIntegrityViolationException ex) {
        String message = ex.getMostSpecificCause().getMessage();
        if (message != null && message.contains(UNIQUE_NAME_INDEX)) {
            return new ConflictException(DUPLICATE_NAME);
        }
        return ex;
    }
}
