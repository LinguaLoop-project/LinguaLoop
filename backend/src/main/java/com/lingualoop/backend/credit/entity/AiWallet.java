package com.lingualoop.backend.credit.entity;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Số dư credit hiện tại của một người dùng. Luôn đọc có khoá dòng ({@code FOR UPDATE}) trước khi sửa. */
@Getter
@Entity
@Table(name = "ai_wallets")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AiWallet {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "balance", nullable = false)
    private int balance;

    @Column(name = "resets_at")
    private Instant resetsAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /** Thời điểm đã được tặng (hoặc mất quyền nhận) credit dùng thử; null = chưa (BR-GA-03). */
    @Column(name = "trial_granted_at")
    private Instant trialGrantedAt;

    /** Tặng credit dùng thử một lần: số dư bằng {@code credits}, không có mốc đặt lại (BR-GA-03). */
    public void grantTrial(int credits, Instant now) {
        refill(credits, null, now);
        this.trialGrantedAt = now;
    }

    /** Đánh dấu không còn quyền nhận credit dùng thử (giáo viên, đã kích hoạt Pro). */
    public void closeTrial(Instant now) {
        if (trialGrantedAt == null) {
            this.trialGrantedAt = now;
        }
    }

    /** Nạp lại số dư và dời mốc đặt lại kế tiếp. */
    public void refill(int newBalance, Instant nextReset, Instant now) {
        this.balance = newBalance;
        this.resetsAt = nextReset;
        this.updatedAt = now;
    }

    /** Cộng credit được cấp (giáo viên, BR-GA-11); không đổi mốc đặt lại. */
    public void add(int credits, Instant now) {
        this.balance = Math.addExact(balance, credits);
        this.updatedAt = now;
    }

    /** Trừ tối đa {@code credits}, không để âm; trả số đã trừ thật. */
    public int deduct(int credits, Instant now) {
        int charged = Math.min(Math.max(credits, 0), balance);
        balance -= charged;
        updatedAt = now;
        return charged;
    }
}
