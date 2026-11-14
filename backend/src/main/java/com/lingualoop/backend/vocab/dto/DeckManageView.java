package com.lingualoop.backend.vocab.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Bộ thẻ trên màn quản lý của giáo viên và quản trị viên (UC-BT-01 đến UC-BT-04). */
public final class DeckManageView {

    private DeckManageView() {
    }

    /**
     * Một bộ trong danh sách của giáo viên. {@code imageUrl} trống = ảnh mặc định, {@code categoryId} trống = mục
     * "Khác" (BR-BT-13, 14). {@code status} là {@code draft} hoặc {@code published}; bộ đã xóa giữ trạng thái trước khi
     * xóa và có {@code deletedAt} (BR-BT-02). Số nhóm và số thẻ chỉ đếm bản ghi chưa xóa (BR-BT-12).
     * {@code unpublishReason} là lý do quản trị viên gỡ xuất bản, hiện cạnh bộ cho giáo viên (BR-BT-08).
     */
    public record Item(
            UUID id,
            String name,
            String imageUrl,
            UUID categoryId,
            String categoryName,
            long groupCount,
            long cardCount,
            boolean pro,
            String status,
            Instant updatedAt,
            Instant deletedAt,
            String unpublishReason) {
    }

    /** Danh mục để chọn khi lọc danh sách hoặc tạo, sửa bộ (BR-BT-14). */
    public record Category(UUID id, String name) {
    }

    /** Một bộ trong danh sách của quản trị viên; {@code ownerId} trống = bộ hệ thống, hiển thị "Hệ thống". */
    public record AdminItem(
            UUID id,
            String name,
            String imageUrl,
            UUID categoryId,
            String categoryName,
            long groupCount,
            long cardCount,
            boolean pro,
            String status,
            Instant updatedAt,
            UUID ownerId,
            String ownerName) {
    }

    /**
     * Thông tin chung của một bộ trên màn xem chi tiết (UC-BT-04). {@code ownerId}, {@code ownerName} trống với bộ hệ
     * thống; {@code unpublishReason} là lý do quản trị viên gỡ xuất bản gần nhất (BR-BT-08). Nhóm thẻ theo thứ tự thêm,
     * {@code cardCount} chỉ đếm thẻ chưa xóa.
     */
    public record Detail(
            UUID id,
            String name,
            String imageUrl,
            UUID categoryId,
            String categoryName,
            boolean pro,
            String status,
            Instant updatedAt,
            UUID ownerId,
            String ownerName,
            String unpublishReason,
            long cardCount,
            List<Group> groups) {

        public Detail {
            groups = List.copyOf(groups);
        }
    }

    /** Một nhóm thẻ của bộ kèm số thẻ chưa xóa. */
    public record Group(UUID id, String name, long cardCount) {
    }

    /** Một thẻ trong nhóm trên màn xem chi tiết (BR-BT-15). */
    public record Card(
            UUID id,
            String word,
            String pos,
            String ipaUk,
            String ipaUs,
            String meaningVi,
            String definitionEn,
            String definitionVi,
            String exampleEn,
            String exampleVi,
            String imageUrl,
            String audioUk,
            String audioUs) {
    }
}
