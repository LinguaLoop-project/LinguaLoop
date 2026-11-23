package com.lingualoop.backend.subscription.entity;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Gói Pro do quản trị viên cấu hình (BR-GA-07). Không xóa, chỉ ngừng bán; gói mới luôn ở trạng thái ngừng bán. */
@Getter
@Entity
@Table(name = "pro_plans")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "months", nullable = false)
    private short months;

    @Column(name = "price_vnd", nullable = false)
    private int priceVnd;

    @Column(name = "credits_per_month", nullable = false)
    private int creditsPerMonth;

    @Column(name = "on_sale", nullable = false)
    private boolean onSale;

    @Generated(event = EventType.INSERT)
    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private Instant createdAt;

    /**
     * Mốc sửa gần nhất, cũng là phiên bản để phát hiện hai quản trị viên sửa cùng lúc (UC-GA-05 7a). DB đặt giá trị
     * (mặc định khi thêm, trigger {@code set_updated_at} khi sửa); Hibernate đọc lại sau mỗi lần ghi.
     */
    @Generated(event = {EventType.INSERT, EventType.UPDATE})
    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private Instant updatedAt;

    public static ProPlan create(String name, int months, int priceVnd, int creditsPerMonth) {
        ProPlan plan = new ProPlan();
        plan.edit(name, months, priceVnd, creditsPerMonth);
        plan.onSale = false;
        return plan;
    }

    public void edit(String name, int months, int priceVnd, int creditsPerMonth) {
        this.name = name;
        this.months = (short) months;
        this.priceVnd = priceVnd;
        this.creditsPerMonth = creditsPerMonth;
    }

    public void setOnSale(boolean onSale) {
        this.onSale = onSale;
    }
}
