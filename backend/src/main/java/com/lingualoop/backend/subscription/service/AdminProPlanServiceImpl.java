package com.lingualoop.backend.subscription.service;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
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
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.subscription.dto.ProPlanView;
import com.lingualoop.backend.subscription.dto.request.ProPlanRequest;
import com.lingualoop.backend.subscription.entity.ProPlan;
import com.lingualoop.backend.subscription.repository.ProPlanRepository;
import com.lingualoop.backend.user.dto.UserAccountView;
import com.lingualoop.backend.user.service.UserAccountService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
class AdminProPlanServiceImpl implements AdminProPlanService {

    private final ProPlanRepository plans;
    private final UserAccountService users;
    private final AuditService auditService;

    @Override
    @Transactional(readOnly = true)
    public List<ProPlanView> list() {
        Map<UUID, Long> purchases = purchases();
        return plans.findAllByOrderByMonthsAscCreatedAtAsc().stream()
                .map(p -> view(p, purchases.getOrDefault(p.getId(), 0L)))
                .toList();
    }

    @Override
    @Transactional
    public ProPlanView create(UUID adminId, ProPlanRequest request) {
        String name = request.name().trim();
        requireNameFree(name, null);
        ProPlan plan = ProPlan.create(name, request.months(), request.priceVnd(), request.creditsPerMonth());
        saveCheckingName(plan);
        Map<String, Object> diff = new LinkedHashMap<>();
        diff.put("name", change(null, plan.getName()));
        diff.put("months", change(null, (int) plan.getMonths()));
        diff.put("priceVnd", change(null, plan.getPriceVnd()));
        diff.put("creditsPerMonth", change(null, plan.getCreditsPerMonth()));
        diff.put("onSale", change(null, false));
        audit(adminId, AuditAction.CREATE, plan, diff);
        return view(plan, 0);
    }

    @Override
    @Transactional
    public ProPlanView update(UUID adminId, UUID planId, ProPlanRequest request) {
        if (request.version() == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }
        ProPlan plan = lockPlan(planId);
        if (!plan.getUpdatedAt().equals(request.version())) {
            throw new BusinessException(ErrorCode.PRO_PLAN_STALE);
        }
        String name = request.name().trim();
        Map<String, Object> diff = new LinkedHashMap<>();
        putIfChanged(diff, "name", plan.getName(), name);
        putIfChanged(diff, "months", (int) plan.getMonths(), request.months());
        putIfChanged(diff, "priceVnd", plan.getPriceVnd(), request.priceVnd());
        putIfChanged(diff, "creditsPerMonth", plan.getCreditsPerMonth(), request.creditsPerMonth());
        if (diff.isEmpty()) {
            throw new BusinessException(ErrorCode.PRO_PLAN_UNCHANGED);
        }
        requireNameFree(name, plan.getId());
        plan.edit(name, request.months(), request.priceVnd(), request.creditsPerMonth());
        saveCheckingName(plan);
        audit(adminId, AuditAction.UPDATE, plan, diff);
        return view(plan, purchases().getOrDefault(plan.getId(), 0L));
    }

    @Override
    @Transactional
    public ProPlanView setOnSale(UUID adminId, UUID planId, boolean onSale) {
        ProPlan plan = lockPlan(planId);
        if (plan.isOnSale() == onSale) {
            throw new BusinessException(ErrorCode.PRO_PLAN_STATUS_UNCHANGED, Map.of("onSale", plan.isOnSale()));
        }
        plan.setOnSale(onSale);
        plans.flush();
        audit(adminId, onSale ? AuditAction.PUBLISH : AuditAction.UNPUBLISH, plan,
                Map.of("onSale", change(!onSale, onSale)));
        return view(plan, purchases().getOrDefault(plan.getId(), 0L));
    }

    private ProPlan lockPlan(UUID planId) {
        return plans.findForUpdate(planId).orElseThrow(() -> new BusinessException(ErrorCode.PRO_PLAN_NOT_FOUND));
    }

    private void requireNameFree(String name, UUID excludeId) {
        if (plans.nameTaken(name, excludeId)) {
            throw new BusinessException(ErrorCode.PRO_PLAN_NAME_TAKEN);
        }
    }

    /** Hai quản trị viên cùng lưu một tên: chỉ mục duy nhất chặn người sau. */
    private void saveCheckingName(ProPlan plan) {
        try {
            plans.saveAndFlush(plan);
        } catch (DataIntegrityViolationException e) {
            throw new BusinessException(ErrorCode.PRO_PLAN_NAME_TAKEN);
        }
    }

    private Map<UUID, Long> purchases() {
        Map<UUID, Long> map = new HashMap<>();
        plans.purchaseCounts().forEach(c -> map.put(c.getPlanId(), c.getPurchases()));
        return map;
    }

    private void audit(UUID adminId, AuditAction action, ProPlan plan, Map<String, Object> diff) {
        String adminName = users.findById(adminId).map(UserAccountView::displayName).orElse(null);
        auditService.record(new AuditEntryRequest(adminId, adminName, Role.ADMIN, action, AuditEntityType.PLAN,
                plan.getId(), plan.getName(), diff, null));
    }

    private static void putIfChanged(Map<String, Object> diff, String field, Object oldValue, Object newValue) {
        if (!Objects.equals(oldValue, newValue)) {
            diff.put(field, change(oldValue, newValue));
        }
    }

    private static Map<String, Object> change(Object oldValue, Object newValue) {
        Map<String, Object> change = new LinkedHashMap<>();
        change.put("old", oldValue);
        change.put("new", newValue);
        return change;
    }

    private static ProPlanView view(ProPlan plan, long purchases) {
        return new ProPlanView(plan.getId(), plan.getName(), plan.getMonths(), plan.getPriceVnd(),
                plan.getCreditsPerMonth(), plan.isOnSale(), purchases, plan.getUpdatedAt());
    }
}
