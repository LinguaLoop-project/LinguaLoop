package com.lingualoop.backend.subscription.service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.lingualoop.backend.subscription.repository.ProOrderPaymentRepository;
import com.lingualoop.backend.user.service.NotificationService;
import com.lingualoop.backend.user.service.NotificationType;

import lombok.RequiredArgsConstructor;

/**
 * Nhắc học viên khi gói Pro sắp hết hạn (còn 7 ngày, còn 1 ngày) và khi đã hết hạn (BR-TK-22). Mỗi mốc chỉ gửi một lần
 * cho mỗi thời điểm hết hạn (khóa chống trùng), nên gia hạn xong thì lần hết hạn mới được nhắc lại từ đầu. Chạy định kỳ
 * và an toàn khi chạy lặp hoặc trễ vì khóa chống trùng; người mới thấy gói đã hết hạn quá lâu thì không được nhắc.
 */
@Service
@RequiredArgsConstructor
public class ProExpiryReminderService {

    /** Mốc nhắc sớm. */
    static final Duration FIRST_NOTICE = Duration.ofDays(7);
    static final Duration LAST_NOTICE = Duration.ofDays(1);
    /** Gói hết hạn quá lâu thì không còn nhắc nữa (tránh gửi hàng loạt khi chạy lần đầu). */
    static final Duration EXPIRED_GRACE = Duration.ofDays(3);

    private static final ZoneId VN = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final String LINK = "/student/subscription";

    private final ProOrderPaymentRepository orders;
    private final NotificationService notifications;
    private final Clock clock;

    /** Gửi mọi nhắc đến hạn tại thời điểm hiện tại; trả số thông báo đã gửi mới. */
    public int run() {
        return run(clock.instant());
    }

    /** Như {@link #run()} nhưng tính tại thời điểm {@code now}. */
    public int run(Instant now) {
        int sent = 0;
        for (ProOrderPaymentRepository.PeriodEnd end : orders.findPeriodEndsBetween(now.minus(EXPIRED_GRACE),
                now.plus(FIRST_NOTICE))) {
            Instant endsAt = end.endsAt();
            String stamp = Long.toString(endsAt.getEpochSecond());
            String date = DATE.format(endsAt.atZone(VN));
            boolean created;
            if (!endsAt.isAfter(now)) {
                created = notifications.send(end.userId(), NotificationType.PRO_EXPIRED,
                        "Gói Pro của bạn đã hết hạn, tài khoản đã về gói Free. Bạn có thể gia hạn bất cứ lúc nào.", LINK,
                        Map.of("endsAt", endsAt.truncatedTo(ChronoUnit.SECONDS).toString()), "pro-expired:" + stamp);
            } else {
                // Mốc 1 ngày thay cho mốc 7 ngày khi mới thấy gói lúc đã sát hạn, để không gửi hai thông báo dồn.
                boolean last = Duration.between(now, endsAt).compareTo(LAST_NOTICE) <= 0;
                long days = Math.max(1, (Duration.between(now, endsAt).toHours() + 23) / 24);
                created = notifications.send(end.userId(), NotificationType.PRO_EXPIRING,
                        "Gói Pro của bạn sẽ hết hạn vào " + date + " (còn " + days + " ngày). Gia hạn để không bị gián đoạn.",
                        LINK, Map.of("endsAt", endsAt.truncatedTo(ChronoUnit.SECONDS).toString(), "days", Long.toString(days)),
                        (last ? "pro-expiring-1:" : "pro-expiring-7:") + stamp);
            }
            if (created) {
                sent++;
            }
        }
        return sent;
    }
}
