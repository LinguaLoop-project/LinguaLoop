package com.lingualoop.backend.devtools;

import java.util.UUID;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.security.CurrentUserId;
import com.lingualoop.backend.subscription.dto.PlanResponse;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;

/** API thử Free/Pro; không tồn tại (404) khi {@code app.dev-tools.enabled} không bật. */
@RestController
@RequestMapping("/api/v1/dev")
@ConditionalOnProperty(name = "app.dev-tools.enabled", havingValue = "true")
@Validated
@RequiredArgsConstructor
class DevToolsController {

    private final DevToolsService devToolsService;

    record SetPlanRequest(@NotNull @Pattern(regexp = "free|pro") String plan) {
    }

    @PutMapping("/plan")
    public ApiResponse<PlanResponse> setPlan(@CurrentUserId UUID userId, @Valid @RequestBody SetPlanRequest request) {
        boolean pro = "pro".equals(request.plan());
        devToolsService.setPro(userId, pro);
        return ApiResponse.ok(PlanResponse.of(pro));
    }

    record SetCreditsRequest(@NotNull @Min(0) @Max(1000000) Integer balance) {
    }

    /** Đặt số dư ví credit của người gọi, để thử trường hợp hết credit. */
    @PutMapping("/credits")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void setCredits(@CurrentUserId UUID userId, @Valid @RequestBody SetCreditsRequest request) {
        devToolsService.setCredits(userId, request.balance());
    }
}
