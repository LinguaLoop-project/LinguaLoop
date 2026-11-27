package com.lingualoop.backend.vocab.service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.audit.dto.request.AuditEntryRequest;
import com.lingualoop.backend.audit.enums.AuditAction;
import com.lingualoop.backend.audit.enums.AuditEntityType;
import com.lingualoop.backend.audit.service.AuditService;
import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.common.util.LikePatterns;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.vocab.dto.request.CategoryNameRequest;
import com.lingualoop.backend.vocab.dto.response.AdminCategoryResponse;
import com.lingualoop.backend.vocab.entity.DeckCategory;
import com.lingualoop.backend.vocab.repository.DeckCategoryRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
class AdminDeckCategoryServiceImpl implements AdminDeckCategoryService {

    private final DeckCategoryRepository categories;
    private final AuditService auditService;

    @Override
    @Transactional(readOnly = true)
    public List<AdminCategoryResponse> list(String q) {
        String pattern = LikePatterns.containsLower(q);
        return categories.findAdminRows(pattern == null ? "%" : pattern).stream()
                .map(AdminCategoryResponse::from)
                .toList();
    }

    @Override
    @Transactional
    public AdminCategoryResponse create(UUID adminId, CategoryNameRequest request) {
        String name = request.name().strip();
        if (categories.existsByNameIgnoreCase(name)) {
            throw new BusinessException(ErrorCode.DECK_CATEGORY_NAME_TAKEN);
        }
        DeckCategory category = saveCheckingName(DeckCategory.named(name));
        audit(adminId, AuditAction.CREATE, category, null);
        return row(category.getId());
    }

    @Override
    @Transactional
    public AdminCategoryResponse rename(UUID adminId, UUID categoryId, CategoryNameRequest request) {
        DeckCategory category = categories.findById(categoryId)
                .orElseThrow(() -> new BusinessException(ErrorCode.DECK_CATEGORY_NOT_FOUND));
        String name = request.name().strip();
        String oldName = category.getName();
        if (name.equals(oldName)) {
            return row(categoryId);
        }
        if (categories.existsByNameIgnoreCaseAndIdNot(name, categoryId)) {
            throw new BusinessException(ErrorCode.DECK_CATEGORY_NAME_TAKEN);
        }
        category.rename(name);
        saveCheckingName(category);
        audit(adminId, AuditAction.UPDATE, category, oldName);
        return row(categoryId);
    }

    /** Hai quản trị viên cùng lưu một tên: chỉ mục duy nhất {@code uq_deck_categories_name} chặn người sau. */
    private DeckCategory saveCheckingName(DeckCategory category) {
        try {
            return categories.saveAndFlush(category);
        } catch (DataIntegrityViolationException e) {
            throw new BusinessException(ErrorCode.DECK_CATEGORY_NAME_TAKEN);
        }
    }

    private AdminCategoryResponse row(UUID categoryId) {
        return categories.findAdminRow(categoryId).map(AdminCategoryResponse::from)
                .orElseThrow(() -> new BusinessException(ErrorCode.DECK_CATEGORY_NOT_FOUND));
    }

    /** {@code oldName} null là thao tác thêm (BR-CD-07, BR-NK-03). */
    private void audit(UUID adminId, AuditAction action, DeckCategory category, String oldName) {
        Map<String, Object> change = new LinkedHashMap<>();
        change.put("old", oldName);
        change.put("new", category.getName());
        auditService.record(new AuditEntryRequest(adminId, null, Role.ADMIN, action, AuditEntityType.CATEGORY,
                category.getId(), category.getName(), Map.of("name", change), null));
    }
}
