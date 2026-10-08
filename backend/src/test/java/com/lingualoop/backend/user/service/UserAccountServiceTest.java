package com.lingualoop.backend.user.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.user.dto.UserAccount;

@SpringBootTest
@Import(TestcontainersConfiguration.class)
class UserAccountServiceTest {

    @Autowired
    private UserAccountService service;

    @Test
    void createLocal_thenFindByEmailIgnoringCase() {
        String email = "svc-" + UUID.randomUUID() + "@x.com";

        UserAccount created = service.createLocal(email, "Lan", "hash");

        assertThat(created.emailVerified()).isFalse();
        assertThat(created.disabled()).isFalse();
        assertThat(service.findByEmail(email.toUpperCase()))
                .hasValueSatisfying(found -> assertThat(found.id()).isEqualTo(created.id()));
        assertThat(service.findById(created.id())).isPresent();
        assertThat(service.findByEmail("nobody-" + UUID.randomUUID() + "@x.com")).isEmpty();
    }

    @Test
    void markEmailVerified_setsFlag() {
        UserAccount created = service.createLocal("v-" + UUID.randomUUID() + "@x.com", "Vy", "hash");

        service.markEmailVerified(created.id());

        assertThat(service.findById(created.id()).orElseThrow().emailVerified()).isTrue();
    }
}
