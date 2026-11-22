package com.lingualoop.backend.credit;

import java.util.Map;
import java.util.UUID;

import com.lingualoop.backend.credit.dto.CreditBalance;

/**
 * Hợp đồng credit cho các feature dùng tính năng tính credit (shadowing, tutor, aichat, lesson). Mỗi tính năng trừ một
 * mức credit cố định cho mỗi đơn vị nghiệp vụ (BR-GA-04, BR-GA-06, ADR 0013); chi phí thật chỉ ghi để thống kê.
 */
public interface CreditService {

    /** Credit trừ cho một đơn vị của tính năng (để hiển thị giá trước khi dùng). */
    int priceOf(AiFeature feature);

    /** Credit mỗi đơn vị của mọi tính năng, theo thứ tự khai báo của {@link AiFeature}. */
    Map<AiFeature, Integer> prices();

    /** {@link #requireCanStart(UUID, AiFeature, int)} cho một đơn vị. */
    void requireCanStart(UUID userId, AiFeature feature);

    /**
     * Làm mới ví theo gói (lazy) rồi kiểm số dư &gt;= credit mỗi đơn vị × {@code quantity}. Không đủ thì ghi
     * {@code rejected_no_credit} vào {@code ai_usage_logs}.
     *
     * @throws com.lingualoop.backend.common.exception.BusinessException {@code QUOTA_EXCEEDED}
     *         (details: feature, balance, cost)
     */
    void requireCanStart(UUID userId, AiFeature feature, int quantity);

    /**
     * Trừ credit mỗi đơn vị × {@code usage.quantity()}, không để ví âm; ghi {@code ai_usage_logs} success kèm chi phí
     * thật tính theo đơn giá hiện hành (BR-GA-12).
     *
     * @return số credit đã trừ thật (nhỏ hơn mức cần khi ví không đủ, ví dụ hai yêu cầu chạy song song)
     */
    int charge(UUID userId, AiFeature feature, AiUsage usage);

    /**
     * Ghi chi phí phát sinh thêm trong một lần dùng đã trừ credit (các lượt sau của cuộc trò chuyện, nhận xét tổng
     * quát): không trừ credit, không tính là một lần dùng.
     */
    void recordCost(UUID userId, AiFeature feature, AiUsage usage);

    /** Ghi {@code ai_usage_logs} failed hoặc rejected_no_credit, không trừ credit. */
    void logFailure(UUID userId, AiFeature feature, boolean rejectedNoCredit);

    /**
     * Ghi {@code ai_usage_logs} failed kèm chi phí khi dịch vụ ngoài đã tính phí dù lần dùng lỗi (BR-GA-12), ví dụ đã
     * lấy được phụ đề nhưng không tạo được bài. Không trừ credit.
     */
    void logFailedCost(UUID userId, AiFeature feature, AiUsage usage);

    /**
     * Như {@link #logFailure(UUID, AiFeature, boolean)} cho phiên giọng nói đã nối tới dịch vụ AI: dòng được gắn với
     * phiên để điền chi phí thật qua {@link #recordLiveUsage} (dịch vụ AI đã tính phí phần đã nói, BR-GA-12).
     */
    void logFailure(UUID userId, AiFeature feature, boolean rejectedNoCredit, UUID liveSessionId);

    /**
     * Điền chi phí của phiên giọng nói vào dòng ghi lúc trừ credit (hoặc lúc bị từ chối) của phiên (BR-GA-12). Số đơn vị
     * do trình duyệt báo nên chỉ dùng để thống kê, chi phí vẫn đánh dấu ước tính. Cả hai bằng 0 thì ước tính theo thời
     * lượng từ lúc trừ credit. Mỗi phiên chỉ điền một lần; phiên không phải của {@code userId} hoặc đã điền thì bỏ qua.
     *
     * @return true nếu vừa điền chi phí
     */
    boolean recordLiveUsage(UUID userId, UUID sessionId, long inputUnits, long outputUnits);

    /**
     * Ước tính theo thời lượng tối đa chi phí các phiên giọng nói đã trừ credit mà trình duyệt không báo số đơn vị xử lý
     * (đóng trang, mất mạng) sau thời gian chờ. Job định kỳ gọi.
     *
     * @return số phiên vừa được ước tính
     */
    int estimateUnreportedLiveCosts();

    CreditBalance balanceOf(UUID userId);

    /**
     * Hủy toàn bộ số dư khi tài khoản đổi vai trò (UC-QT-04, BR-QT-04): giáo viên đổi thành học viên mất credit giáo
     * viên và dùng credit Free từ lần đọc ví sau; học viên đổi thành giáo viên có số dư giáo viên bằng 0. Chạy trong
     * giao dịch của nghiệp vụ đang gọi. Chưa có ví thì không làm gì.
     */
    void resetForRoleChange(UUID userId);

    /**
     * Cộng credit được quản trị viên cấp vào số dư của giáo viên (UC-GA-07, BR-GA-11); không hết hạn, không đặt lại.
     * Chạy trong giao dịch của nghiệp vụ đang gọi, bên gọi tự kiểm vai trò và trạng thái tài khoản. Trả số dư mới.
     */
    int grant(UUID userId, int credits);
}
