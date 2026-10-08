package com.lingualoop.backend.auth.mail;

import java.io.UnsupportedEncodingException;
import java.util.Locale;
import java.util.Set;

import org.springframework.context.MessageSource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

import com.lingualoop.backend.config.AuthProperties;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;

/** Gửi thư qua SMTP (Mailpit ở local). Nội dung lấy từ {@code messages_<lang>.properties}. */
@Component
@RequiredArgsConstructor
public class SmtpAuthMailSender implements AuthMailSender {

    private static final String DEFAULT_LANGUAGE = "vi";
    private static final Set<String> SUPPORTED_LANGUAGES = Set.of("vi", "en");
    private static final String SENDER_NAME = "LinguaLoop";

    private final JavaMailSender javaMailSender;
    private final MessageSource messageSource;
    private final AuthProperties authProperties;

    @Override
    public void sendVerifyEmail(String to, String uiLanguage, String rawToken) {
        Locale locale = Locale.forLanguageTag(SUPPORTED_LANGUAGES.contains(uiLanguage) ? uiLanguage : DEFAULT_LANGUAGE);
        String link = baseUrl() + "/verify-email?token=" + rawToken;
        String hours = String.valueOf(authProperties.verifyTtl().toHours());

        send(to, messageSource.getMessage("auth.mail.verify.subject", null, locale),
                messageSource.getMessage("auth.mail.verify.body", new Object[] { link, hours }, locale));
    }

    private String baseUrl() {
        String url = authProperties.frontendUrl();
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }

    private void send(String to, String subject, String text) {
        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setFrom(authProperties.mailFrom(), SENDER_NAME);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(text, false);
            javaMailSender.send(message);
        } catch (MessagingException | UnsupportedEncodingException e) {
            throw new IllegalStateException("Could not build mail to " + to, e);
        }
    }
}
