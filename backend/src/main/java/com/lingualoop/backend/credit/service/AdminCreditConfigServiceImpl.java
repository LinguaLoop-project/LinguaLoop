package com.lingualoop.backend.credit.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.audit.dto.request.AuditEntryRequest;
import com.lingualoop.backend.audit.enums.AuditAction;
import com.lingualoop.backend.audit.enums.AuditEntityType;
import com.lingualoop.backend.audit.service.AuditService;
import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.credit.AiFeature;
import com.lingualoop.backend.credit.dto.CreditConfigView;
import com.lingualoop.backend.credit.dto.UpdateCreditConfigRequest;
import com.lingualoop.backend.credit.entity.AiFeaturePrice;
import com.lingualoop.backend.credit.entity.AiSettings;
import com.lingualoop.backend.credit.repository.AiFeaturePriceRepository;
import com.lingualoop.backend.credit.repository.AiSettingsRepository;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.user.dto.UserAccountView;
import com.lingualoop.backend.user.service.UserAccountService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
class AdminCreditConfigServiceImpl implements AdminCreditConfigService {

    /** Thứ tự hàng của bảng dịch vụ tính credit (BR-GA-04). */
    private static final List<AiFeature> ROW_ORDER = List.of(AiFeature.SHADOWING_FEEDBACK, AiFeature.TUTOR_SESSION,
            AiFeature.LESSON_CHAT, AiFeature.LESSON_SUGGEST, AiFeature.LESSON_IMPORT);
    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    private final AiSettingsRepository settingsRepository;
    private final AiFeaturePriceRepository priceRepository;
    private final UserAccountService users;
    private final AuditService auditService;

    @Override
    @Transactional(readOnly = true)
    public CreditConfigView get() {
        return view(settingsRepository.findById(AiSettings.SINGLETON_ID).orElseThrow(), priceMap());
    }

    @Override
    @Transactional
    public CreditConfigView update(UUID adminId, UpdateCreditConfigRequest request) {
        AiSettings settings = settingsRepository.findForUpdate(AiSettings.SINGLETON_ID).orElseThrow();
        if (!settings.getUpdatedAt().equals(request.version())) {
            throw new BusinessException(ErrorCode.CREDIT_CONFIG_STALE);
        }
        if (request.gatewayFeePct().add(request.marginPct()).compareTo(HUNDRED) >= 0) {
            throw new BusinessException(ErrorCode.CREDIT_CONFIG_FEE_MARGIN_TOO_HIGH);
        }
        Map<AiFeature, UpdateCreditConfigRequest.FeaturePrice> inputs = featureInputs(request);
        Map<AiFeature, AiFeaturePrice> prices = priceMap();

        Map<String, Object> diff = new LinkedHashMap<>();
        putIfChanged(diff, "creditValueVnd", settings.getCreditValueVnd(), request.creditValueVnd());
        putIfChanged(diff, "gatewayFeePct", settings.getGatewayFeePct(), request.gatewayFeePct());
        putIfChanged(diff, "marginPct", settings.getMarginPct(), request.marginPct());
        putIfChanged(diff, "trialCredits", settings.getTrialCredits(), request.trialCredits());
        for (AiFeature feature : ROW_ORDER) {
            AiFeaturePrice price = prices.get(feature);
            UpdateCreditConfigRequest.FeaturePrice input = inputs.get(feature);
            String key = feature.dbValue() + ".";
            putIfChanged(diff, key + "creditsPerUse", price.getCreditsPerUse(), input.creditsPerUse());
            putIfChanged(diff, key + "inputPriceVnd", price.getInputPriceVnd(), input.inputPriceVnd());
            putIfChanged(diff, key + "outputPriceVnd", price.getOutputPriceVnd(), input.outputPriceVnd());
            putIfChanged(diff, key + "fixedCostVnd", price.getFixedCostVnd(), input.fixedCostVnd());
        }
        if (diff.isEmpty()) {
            throw new BusinessException(ErrorCode.CREDIT_CONFIG_UNCHANGED);
        }

        settings.update(request.creditValueVnd(), request.gatewayFeePct(), request.marginPct(),
                request.trialCredits(), adminId);
        for (AiFeature feature : ROW_ORDER) {
            UpdateCreditConfigRequest.FeaturePrice input = inputs.get(feature);
            prices.get(feature).update(input.creditsPerUse(), input.inputPriceVnd(), input.outputPriceVnd(),
                    input.fixedCostVnd());
        }
        // Ghi xuống ngay để đọc lại updated_at do trigger đặt (phiên bản mới trả cho client)
        settingsRepository.flush();
        String adminName = users.findById(adminId).map(UserAccountView::displayName).orElse(null);
        auditService.record(new AuditEntryRequest(adminId, adminName, Role.ADMIN, AuditAction.UPDATE,
                AuditEntityType.SETTINGS, null, "Cấu hình credit", diff, null));
        return view(settings, prices);
    }

    /** Mỗi tính năng đúng một lần; mã lạ hoặc trùng thì yêu cầu không hợp lệ. */
    private static Map<AiFeature, UpdateCreditConfigRequest.FeaturePrice> featureInputs(
            UpdateCreditConfigRequest request) {
        Map<String, AiFeature> byValue = new HashMap<>();
        for (AiFeature feature : AiFeature.values()) {
            byValue.put(feature.dbValue(), feature);
        }
        Map<AiFeature, UpdateCreditConfigRequest.FeaturePrice> inputs = new EnumMap<>(AiFeature.class);
        for (UpdateCreditConfigRequest.FeaturePrice input : request.features()) {
            AiFeature feature = byValue.get(input.feature());
            if (feature == null || inputs.put(feature, input) != null) {
                throw new BusinessException(ErrorCode.BAD_REQUEST);
            }
        }
        if (inputs.size() != AiFeature.values().length) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }
        return inputs;
    }

    private static void putIfChanged(Map<String, Object> diff, String field, Object oldValue, Object newValue) {
        boolean same = oldValue instanceof BigDecimal oldDecimal && newValue instanceof BigDecimal newDecimal
                ? oldDecimal.compareTo(newDecimal) == 0
                : Objects.equals(oldValue, newValue);
        if (!same) {
            Map<String, Object> change = new LinkedHashMap<>();
            change.put("old", oldValue);
            change.put("new", newValue);
            diff.put(field, change);
        }
    }

    private Map<AiFeature, AiFeaturePrice> priceMap() {
        Map<String, AiFeaturePrice> byValue = new HashMap<>();
        priceRepository.findAll().forEach(p -> byValue.put(p.getFeature(), p));
        Map<AiFeature, AiFeaturePrice> map = new EnumMap<>(AiFeature.class);
        for (AiFeature feature : AiFeature.values()) {
            map.put(feature, Objects.requireNonNull(byValue.get(feature.dbValue())));
        }
        return map;
    }

    private CreditConfigView view(AiSettings settings, Map<AiFeature, AiFeaturePrice> prices) {
        List<CreditConfigView.FeatureRow> rows = new ArrayList<>();
        for (AiFeature feature : ROW_ORDER) {
            AiFeaturePrice p = prices.get(feature);
            rows.add(new CreditConfigView.FeatureRow(feature.dbValue(), p.getCreditsPerUse(), p.getInputPriceVnd(),
                    p.getOutputPriceVnd(), p.getFixedCostVnd()));
        }
        CreditConfigView.Editor editor = settings.getUpdatedBy() == null ? null
                : new CreditConfigView.Editor(settings.getUpdatedBy(),
                        users.findById(settings.getUpdatedBy()).map(UserAccountView::displayName).orElse(null));
        return new CreditConfigView(settings.getCreditValueVnd(), settings.getGatewayFeePct(),
                settings.getMarginPct(), settings.getTrialCredits(), rows, editor,
                editor == null ? null : settings.getUpdatedAt(), settings.getUpdatedAt());
    }
}
