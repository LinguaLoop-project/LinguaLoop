package com.lingualoop.backend.auth.mail;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.util.Properties;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.context.MessageSource;
import org.springframework.mail.javamail.JavaMailSender;

import com.lingualoop.backend.config.AuthProperties;
import com.lingualoop.backend.config.MessageConfig;

import jakarta.mail.Message;
import jakarta.mail.Session;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;

class SmtpAuthMailSenderTest {

    private JavaMailSender javaMailSender;
    private SmtpAuthMailSender sender;

    @BeforeEach
    void setUp() {
        javaMailSender = mock(JavaMailSender.class);
        when(javaMailSender.createMimeMessage()).thenAnswer(i -> new MimeMessage(Session.getInstance(new Properties())));

        MessageSource messages = new MessageConfig().messageSource();

        AuthProperties props = new AuthProperties("http://localhost:5173", "no-reply@lingualoop.test", 5,
                Duration.ofMinutes(15), Duration.ofHours(24), Duration.ofSeconds(60), Duration.ofDays(30),
                Duration.ofSeconds(10), new AuthProperties.Cookie("Lax", false));
        sender = new SmtpAuthMailSender(javaMailSender, messages, props);
    }

    private MimeMessage sentMessage() {
        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(javaMailSender).send(captor.capture());
        return captor.getValue();
    }

    @Test
    void sendVerifyEmail_vi_hasRecipientVerifyLinkAndVietnameseText() throws Exception {
        sender.sendVerifyEmail("minh@x.com", "vi", "tok_en-123");

        MimeMessage message = sentMessage();
        assertThat(message.getRecipients(Message.RecipientType.TO))
                .extracting(a -> ((InternetAddress) a).getAddress()).containsExactly("minh@x.com");
        assertThat(((InternetAddress) message.getFrom()[0]).getAddress()).isEqualTo("no-reply@lingualoop.test");
        assertThat(message.getSubject()).isEqualTo("Xác thực email LinguaLoop của bạn");
        assertThat((String) message.getContent())
                .contains("http://localhost:5173/verify-email?token=tok_en-123")
                .contains("24 giờ");
    }

    @Test
    void sendVerifyEmail_en_usesEnglishText() throws Exception {
        sender.sendVerifyEmail("minh@x.com", "en", "tok123");

        MimeMessage message = sentMessage();
        assertThat(message.getSubject()).isEqualTo("Verify your LinguaLoop email");
        assertThat((String) message.getContent())
                .contains("http://localhost:5173/verify-email?token=tok123")
                .contains("24 hours");
    }

    @Test
    void sendVerifyEmail_unknownLanguage_fallsBackToVietnamese() throws Exception {
        sender.sendVerifyEmail("minh@x.com", "fr", "tok123");

        assertThat(sentMessage().getSubject()).isEqualTo("Xác thực email LinguaLoop của bạn");
    }

    @Test
    void sendVerifyEmail_frontendUrlWithTrailingSlash_doesNotDoubleSlash() throws Exception {
        AuthProperties props = new AuthProperties("http://localhost:5173/", "no-reply@lingualoop.test", 5,
                Duration.ofMinutes(15), Duration.ofHours(24), Duration.ofSeconds(60), Duration.ofDays(30),
                Duration.ofSeconds(10), new AuthProperties.Cookie("Lax", false));
        new SmtpAuthMailSender(javaMailSender, new MessageConfig().messageSource(), props).sendVerifyEmail("a@x.com", "vi", "t");

        assertThat((String) sentMessage().getContent()).contains("http://localhost:5173/verify-email?token=t");
    }
}
