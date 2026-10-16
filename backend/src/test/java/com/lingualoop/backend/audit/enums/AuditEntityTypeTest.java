package com.lingualoop.backend.audit.enums;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

class AuditEntityTypeTest {

    @ParameterizedTest
    @EnumSource(AuditEntityType.class)
    void value_isLowerCaseName(AuditEntityType type) {
        assertThat(type.value()).isEqualTo(type.name().toLowerCase());
    }

    @ParameterizedTest
    @EnumSource(AuditEntityType.class)
    void fromValue_roundTripsEveryType(AuditEntityType type) {
        assertThat(AuditEntityType.fromValue(type.value())).contains(type);
    }

    @Test
    void fromValue_isCaseInsensitive() {
        assertThat(AuditEntityType.fromValue("LeSsOn")).contains(AuditEntityType.LESSON);
    }

    @Test
    void fromValue_unknownValue_returnsEmpty() {
        assertThat(AuditEntityType.fromValue("comment")).isEmpty();
    }

    @Test
    void fromValue_null_returnsEmpty() {
        assertThat(AuditEntityType.fromValue(null)).isEmpty();
    }
}
