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

    /** Nạp lại số dư và dời mốc đặt lại kế tiếp. */
    public void refill(int newBalance, Instant nextReset, Instant now) {
        this.balance = newBalance;
        this.resetsAt = nextReset;
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
