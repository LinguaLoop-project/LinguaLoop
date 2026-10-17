package com.lingualoop.backend.audit.enums;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

class AuditActionTest {

    @ParameterizedTest
    @EnumSource(AuditAction.class)
    void value_isLowerCaseName(AuditAction action) {
        assertThat(action.value()).isEqualTo(action.name().toLowerCase());
    }

    @ParameterizedTest
    @EnumSource(AuditAction.class)
    void fromValue_roundTripsEveryAction(AuditAction action) {
        assertThat(AuditAction.fromValue(action.value())).contains(action);
    }

    @Test
    void fromValue_isCaseInsensitive() {
        assertThat(AuditAction.fromValue("PuBlIsH")).contains(AuditAction.PUBLISH);
    }

    @Test
    void fromValue_unknownValue_returnsEmpty() {
        assertThat(AuditAction.fromValue("archive")).isEmpty();
    }

    @Test
    void fromValue_null_returnsEmpty() {
        assertThat(AuditAction.fromValue(null)).isEmpty();
    }
}
