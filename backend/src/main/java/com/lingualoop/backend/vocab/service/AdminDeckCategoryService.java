package com.lingualoop.backend.vocab.service;

import java.util.List;
import java.util.UUID;

import com.lingualoop.backend.vocab.dto.request.CategoryNameRequest;
import com.lingualoop.backend.vocab.dto.response.AdminCategoryResponse;

/** Quản trị viên xem, thêm và sửa tên danh mục bộ thẻ (UC-CD-04 đến 06). Chưa có xóa hay đổi thứ tự (BR-CD-03). */
public interface AdminDeckCategoryService {

    /** Danh mục theo thứ tự hiển thị (BR-CD-05). {@code q} tìm theo tên, không phân biệt hoa thường. */
    List<AdminCategoryResponse> list(String q);

    /** Thêm danh mục vào cuối danh sách (BR-CD-02, BR-CD-03) và ghi nhật ký (BR-CD-07). */
    AdminCategoryResponse create(UUID adminId, CategoryNameRequest request);

    /** Sửa tên, làm mới ngày cập nhật, giữ thứ tự và bộ thẻ (BR-CD-02, BR-CD-03); ghi nhật ký tên cũ và mới (BR-CD-07). */
    AdminCategoryResponse rename(UUID adminId, UUID categoryId, CategoryNameRequest request);
}
