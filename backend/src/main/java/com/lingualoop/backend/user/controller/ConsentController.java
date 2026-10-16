package com.lingualoop.backend.user.controller;

import java.util.Set;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.security.CurrentUserId;
import com.lingualoop.backend.user.enums.ConsentType;
import com.lingualoop.backend.user.service.ConsentService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/me/consents")
@RequiredArgsConstructor
public class ConsentController {

    private final ConsentService consentService;

    @GetMapping
    public ApiResponse<Set<ConsentType>> granted(@CurrentUserId UUID userId) {
        return ApiResponse.ok(consentService.getGrantedTypes(userId));
    }

    @PutMapping("/{type}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void grant(@CurrentUserId UUID userId, @PathVariable ConsentType type) {
        consentService.grant(userId, type);
    }

    @DeleteMapping("/{type}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void revoke(@CurrentUserId UUID userId, @PathVariable ConsentType type) {
        consentService.revoke(userId, type);
    }
}
