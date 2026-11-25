package com.lingualoop.backend.audit.dto;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.lingualoop.backend.audit.dto.request.AuditEntryRequest;
import com.lingualoop.backend.audit.enums.AuditAction;
import com.lingualoop.backend.audit.enums.AuditEntityType;

class AuditChangesTest {

    @Test
    void build_keepsOnlyChangedFields_withOldAndNew_AC_NK_03() {
        Map<String, Object> diff = AuditChanges.create()
                .field("priceVnd", 50_000L, 59_000L)
                .field("creditsPerMonth", 1_000, 1_200)
                .field("onSale", true, true)
                .build();

        assertThat(diff).containsOnlyKeys("priceVnd", "creditsPerMonth");
        assertThat(diff.get("creditsPerMonth")).isEqualTo(Map.of("old", 1_000, "new", 1_200));
    }

    @Test
    void build_nothingChanged_isNull() {
        assertThat(AuditChanges.create().field("name", "A", "A").build()).isNull();
    }

    @Test
    void field_decimalsComparedByValue_andNullKept() {
        Map<String, Object> diff = AuditChanges.create()
                .field("gatewayFeePct", new BigDecimal("3.0"), new BigDecimal("3"))
                .field("name", "Pro 1 tháng", null)
                .build();

        assertThat(diff).containsOnlyKeys("name");
        assertThat(AuditChanges.pair("Pro 1 tháng", null)).containsEntry("new", null);
    }

    @Test
    void withParent_requiresTypeAndIdTogether() {
        AuditEntryRequest entry = new AuditEntryRequest(null, null, null, AuditAction.RESOLVE, AuditEntityType.REPORT,
                UUID.randomUUID(), "apple", null, null);
        UUID deck = UUID.randomUUID();

        assertThat(entry.withParent(AuditEntityType.DECK, deck).parentId()).isEqualTo(deck);
        assertThatThrownBy(() -> entry.withParent(AuditEntityType.DECK, null))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
