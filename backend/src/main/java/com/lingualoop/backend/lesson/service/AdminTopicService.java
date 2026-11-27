package com.lingualoop.backend.lesson.service;

import java.util.List;
import java.util.UUID;

import com.lingualoop.backend.lesson.dto.request.TopicNameRequest;
import com.lingualoop.backend.lesson.dto.response.AdminTopicResponse;

/** Quản trị viên xem, thêm và sửa tên chủ đề (UC-CD-01 đến 03). Chưa có xóa hay đổi thứ tự (BR-CD-03). */
public interface AdminTopicService {

    /**
     * Chủ đề theo thứ tự hiển thị (BR-CD-05). {@code q} tìm theo tên, không phân biệt hoa thường; {@code visible} null
     * là mọi trạng thái, true là Đang hiển thị, false là Chưa hiển thị (BR-CD-04).
     */
    List<AdminTopicResponse> list(String q, Boolean visible);

    /** Thêm chủ đề vào cuối danh sách (BR-CD-01, BR-CD-03) và ghi nhật ký (BR-CD-07). */
    AdminTopicResponse create(UUID adminId, TopicNameRequest request);

    /** Sửa tên, làm mới ngày cập nhật, giữ thứ tự và bài học (BR-CD-01, BR-CD-03); ghi nhật ký tên cũ và mới (BR-CD-07). */
    AdminTopicResponse rename(UUID adminId, UUID topicId, TopicNameRequest request);
}
