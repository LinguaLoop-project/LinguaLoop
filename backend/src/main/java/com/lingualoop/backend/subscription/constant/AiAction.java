package com.lingualoop.backend.subscription.constant;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Định nghĩa các hành động tiêu tốn năng lượng AI trong Bể năng lượng dùng chung (`ai_energy`, BR-QUOTA-01).
 * Hằng giá đặt tập trung ở đây để backend và frontend đồng bộ.
 */
public enum AiAction {
    AI_FEEDBACK("ai_feedback", 1),
    TUTOR_SESSION("tutor_session", 3);

    /** Mã tính năng của bể năng lượng chung trong {@code plan_limits} và {@code usage_counters}. */
    public static final String FEATURE = "ai_energy";

    private final String action;
    private final int cost;

    AiAction(String action, int cost) {
        this.action = action;
        this.cost = cost;
    }

    public String action() {
        return action;
    }

    public int cost() {
        return cost;
    }

    private static final Map<String, Integer> COSTS;

    static {
        Map<String, Integer> map = new LinkedHashMap<>();
        for (AiAction a : values()) {
            map.put(a.action, a.cost);
        }
        COSTS = Collections.unmodifiableMap(map);
    }

    public static Map<String, Integer> costs() {
        return COSTS;
    }
}
