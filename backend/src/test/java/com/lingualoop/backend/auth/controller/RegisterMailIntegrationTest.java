package com.lingualoop.backend.auth.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Properties;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.user.service.UserAccountService;

import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;

/** Chạy qua SmtpAuthMailSender thật, chỉ giả lập tầng SMTP ({@link JavaMailSender}). */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class RegisterMailIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserAccountService userAccountService;

    @MockitoBean
    private JavaMailSender javaMailSender;

    @BeforeEach
    void setUp() {
        when(javaMailSender.createMimeMessage()).thenAnswer(i -> new MimeMessage(Session.getInstance(new Properties())));
    }

    private ResultActions register(String email) throws Exception {
        String body = """
                {"email":"%s","password":"password123","displayName":"Minh","acceptTerms":true}""".formatted(email);
        return mockMvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content(body));
    }

    @Test
    void register_smtpDown_returns201WithMailSentFalseAndKeepsAccount_AC07() throws Exception {
        String email = "mailfail-" + UUID.randomUUID() + "@x.com";
        doThrow(new MailSendException("connection refused")).when(javaMailSender).send(any(MimeMessage.class));

        register(email)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.email").value(email))
                .andExpect(jsonPath("$.data.mailSent").value(false));

        assertThat(userAccountService.findByEmail(email)).isPresent();
    }

    @Test
    void register_smtpOk_sendsMailAndReportsMailSentTrue_AC01() throws Exception {
        String email = "mailok-" + UUID.randomUUID() + "@x.com";
        doNothing().when(javaMailSender).send(any(MimeMessage.class));

        register(email)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.mailSent").value(true));

        verify(javaMailSender).send(any(MimeMessage.class));
    }
}
