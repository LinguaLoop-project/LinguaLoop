package com.lingualoop.backend.lesson.service;

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
import com.lingualoop.backend.lesson.dto.request.TopicNameRequest;
import com.lingualoop.backend.lesson.dto.response.AdminTopicResponse;
import com.lingualoop.backend.lesson.entity.Topic;
import com.lingualoop.backend.lesson.repository.TopicRepository;
import com.lingualoop.backend.security.Role;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
class AdminTopicServiceImpl implements AdminTopicService {

    private final TopicRepository topics;
    private final AuditService auditService;

    @Override
    @Transactional(readOnly = true)
    public List<AdminTopicResponse> list(String q, Boolean visible) {
        String pattern = LikePatterns.containsLower(q);
        return topics.findAdminRows(pattern == null ? "%" : pattern, visible == null, Boolean.TRUE.equals(visible))
                .stream()
                .map(AdminTopicResponse::from)
                .toList();
    }

    @Override
    @Transactional
    public AdminTopicResponse create(UUID adminId, TopicNameRequest request) {
        String name = request.name().strip();
        if (topics.existsByNameIgnoreCase(name)) {
            throw new BusinessException(ErrorCode.TOPIC_NAME_TAKEN);
        }
        Topic topic = saveCheckingName(Topic.named(name));
        audit(adminId, AuditAction.CREATE, topic, null);
        return row(topic.getId());
    }

    @Override
    @Transactional
    public AdminTopicResponse rename(UUID adminId, UUID topicId, TopicNameRequest request) {
        Topic topic = topics.findById(topicId).orElseThrow(() -> new BusinessException(ErrorCode.TOPIC_NOT_FOUND));
        String name = request.name().strip();
        String oldName = topic.getName();
        if (name.equals(oldName)) {
            return row(topicId);
        }
        if (topics.existsByNameIgnoreCaseAndIdNot(name, topicId)) {
            throw new BusinessException(ErrorCode.TOPIC_NAME_TAKEN);
        }
        topic.setName(name);
        saveCheckingName(topic);
        audit(adminId, AuditAction.UPDATE, topic, oldName);
        return row(topicId);
    }

    /** Hai quản trị viên cùng lưu một tên: chỉ mục duy nhất {@code uq_topics_name} chặn người sau. */
    private Topic saveCheckingName(Topic topic) {
        try {
            return topics.saveAndFlush(topic);
        } catch (DataIntegrityViolationException e) {
            throw new BusinessException(ErrorCode.TOPIC_NAME_TAKEN);
        }
    }

    private AdminTopicResponse row(UUID topicId) {
        return topics.findAdminRow(topicId).map(AdminTopicResponse::from)
                .orElseThrow(() -> new BusinessException(ErrorCode.TOPIC_NOT_FOUND));
    }

    /** {@code oldName} null là thao tác thêm (BR-CD-07, BR-NK-03). */
    private void audit(UUID adminId, AuditAction action, Topic topic, String oldName) {
        Map<String, Object> change = new LinkedHashMap<>();
        change.put("old", oldName);
        change.put("new", topic.getName());
        auditService.record(new AuditEntryRequest(adminId, null, Role.ADMIN, action, AuditEntityType.TOPIC,
                topic.getId(), topic.getName(), Map.of("name", change), null));
    }
}
