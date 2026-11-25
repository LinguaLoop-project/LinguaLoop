package com.lingualoop.backend.user.service;

import java.time.Clock;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.audit.enums.AuditAction;
import com.lingualoop.backend.audit.enums.AuditEntityType;
import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.common.response.PageResponse;
import com.lingualoop.backend.credit.CreditService;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.subscription.dto.ActiveProOrder;
import com.lingualoop.backend.subscription.service.SubscriptionQueryService;
import com.lingualoop.backend.user.dto.AdminUserView;
import com.lingualoop.backend.user.dto.UserLockedEvent;
import com.lingualoop.backend.user.entity.User;
import com.lingualoop.backend.user.enums.AccountPlan;
import com.lingualoop.backend.user.enums.AccountStatus;
import com.lingualoop.backend.user.repository.AdminUserRepository;
import com.lingualoop.backend.user.repository.AdminUserRepository.UserFilter;
import com.lingualoop.backend.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
class UserAdminServiceImpl implements UserAdminService {

    private static final int PAGE_SIZE = 20;
    private static final int RECENT_ACTIVITY_LIMIT = 10;

    private final UserRepository users;
    private final AdminUserRepository adminUsers;
    private final SubscriptionQueryService subscriptions;
    private final CreditService credits;
    private final AdminAuditor auditor;
    private final NotificationService notifications;
    private final ApplicationEventPublisher events;
    private final Clock clock;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminUserView.Row> list(String q, Role role, AccountPlan plan, AccountStatus status,
            int page) {
        UserFilter filter = new UserFilter(AdminUserRepository.containsPattern(q), role, plan, status);
        long total = adminUsers.countUsers(filter);
        List<AdminUserView.Row> rows = adminUsers.findUsers(filter, PAGE_SIZE, (long) page * PAGE_SIZE);
        return PageResponse.of(rows, page, PAGE_SIZE, total);
    }

    @Override
    @Transactional // không readOnly: đọc số dư credit có thể tạo ví lần đầu
    public AdminUserView.Detail detail(UUID userId) {
        User user = users.findById(userId).orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        return toDetail(user);
    }

    @Override
    @Transactional
    public AdminUserView.Detail lock(UUID adminId, UUID userId, String reason) {
        User user = lockRow(userId);
        assertManageable(adminId, user);
        if (user.isLocked()) {
            throw new BusinessException(ErrorCode.USER_ALREADY_LOCKED);
        }
        String trimmed = reason.trim();
        user.lock(trimmed, clock.instant());
        users.saveAndFlush(user);
        audit(adminId, AuditAction.LOCK, user, null, trimmed);
        events.publishEvent(new UserLockedEvent(user.getId()));
        return toDetail(user);
    }

    @Override
    @Transactional
    public AdminUserView.Detail unlock(UUID adminId, UUID userId) {
        User user = lockRow(userId);
        if (!user.isLocked()) {
            throw new BusinessException(ErrorCode.USER_NOT_LOCKED);
        }
        user.unlock();
        users.saveAndFlush(user);
        audit(adminId, AuditAction.UNLOCK, user, null, null);
        return toDetail(user);
    }

    @Override
    @Transactional
    public AdminUserView.Detail changeRole(UUID adminId, UUID userId, Role target) {
        if (target == null || target == Role.ADMIN) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }
        User user = lockRow(userId);
        assertManageable(adminId, user);
        if (user.isLocked()) {
            throw new BusinessException(ErrorCode.USER_LOCKED_ROLE_CHANGE);
        }
        Role current = user.getRole();
        if (current == target) {
            throw new BusinessException(ErrorCode.USER_ROLE_UNCHANGED);
        }

        Map<String, Object> diff = new LinkedHashMap<>();
        diff.put("role", AdminAuditor.change(current.value(), target.value()));
        if (current == Role.TEACHER) {
            AdminUserView.ContentCounts content = adminUsers.contentCounts(user.getId());
            if (content.lessons() > 0 || content.decks() > 0) {
                throw new BusinessException(ErrorCode.USER_TEACHER_HAS_CONTENT,
                        Map.of("lessons", content.lessons(), "decks", content.decks()));
            }
            diff.put("creditBalance", AdminAuditor.change(credits.balanceOf(user.getId()).balance(), 0));
        } else {
            Optional<ActiveProOrder> pro = subscriptions.activeOrder(user.getId());
            if (pro.isPresent()) {
                throw new BusinessException(ErrorCode.USER_ACTIVE_PRO, Map.of("endsAt", pro.get().endsAt()));
            }
        }

        user.changeRole(target);
        users.saveAndFlush(user);
        credits.resetForRoleChange(user.getId());
        audit(adminId, AuditAction.CHANGE_ROLE, user, diff, null);
        return toDetail(user);
    }

    @Override
    @Transactional
    public AdminUserView.Detail grantCredit(UUID adminId, UUID userId, int amount, String note) {
        User user = lockRow(userId);
        if (user.getRole() != Role.TEACHER || user.isLocked()) {
            throw new BusinessException(ErrorCode.CREDIT_GRANT_NOT_ALLOWED);
        }
        String trimmed = note.trim();
        int oldBalance = credits.balanceOf(user.getId()).balance();
        int newBalance = credits.grant(user.getId(), amount);
        Map<String, Object> diff = Map.of("creditBalance", AdminAuditor.change(oldBalance, newBalance));
        audit(adminId, AuditAction.GRANT_CREDIT, user, diff, "Cấp " + vnNumber(amount) + " credit: " + trimmed);
        notifications.send(user.getId(),
                "Bạn vừa được cấp " + vnNumber(amount) + " credit để dùng khi soạn bài. Ghi chú: " + trimmed);
        return toDetail(user);
    }

    /** 1500 -> "1.500" (dấu chấm ngăn cách hàng nghìn kiểu Việt Nam). */
    private static String vnNumber(int value) {
        return String.format(Locale.ROOT, "%,d", value).replace(',', '.');
    }

    private User lockRow(UUID userId) {
        return users.findForUpdate(userId).orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }

    /** Chỉ khóa và đổi vai trò học viên, giáo viên khác chính mình (BR-QT-02). */
    private static void assertManageable(UUID adminId, User user) {
        if (user.getId().equals(adminId) || user.getRole() == Role.ADMIN) {
            throw new BusinessException(ErrorCode.USER_PROTECTED);
        }
    }

    private AdminUserView.Detail toDetail(User user) {
        UUID id = user.getId();
        boolean student = user.getRole() == Role.STUDENT;
        boolean teacher = user.getRole() == Role.TEACHER;
        Optional<ActiveProOrder> pro = student ? subscriptions.activeOrder(id) : Optional.empty();
        String plan = student ? AccountPlan.of(pro.isPresent()).value() : null;
        return new AdminUserView.Detail(id, user.getDisplayName(), user.getEmail(), user.getAvatarUrl(),
                user.getRole().value(), user.isLocked(), user.getLockedAt(), user.getLockedReason(),
                user.getCreatedAt(), adminUsers.lastActiveAt(id),
                adminUsers.recentActivities(id, RECENT_ACTIVITY_LIMIT),
                plan,
                pro.map(ActiveProOrder::endsAt).orElse(null),
                student ? adminUsers.payments(id) : List.of(),
                teacher ? adminUsers.contentCounts(id) : null,
                teacher ? credits.balanceOf(id).balance() : null);
    }

    private void audit(UUID adminId, AuditAction action, User target, Map<String, Object> diff, String note) {
        auditor.record(adminId, action, AuditEntityType.USER, target.getId(), target.getDisplayName(), diff, note);
    }
}
