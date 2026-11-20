package com.lingualoop.backend.user.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.lingualoop.backend.user.entity.User;

import jakarta.persistence.LockModeType;

public interface UserRepository extends JpaRepository<User, UUID> {

    // Tham số JDBC có kiểu varchar nên "email = ?" thành so sánh text phân biệt hoa thường;
    // ép sang citext để dùng đúng so sánh của cột.
    @Query(value = "SELECT * FROM users WHERE email = CAST(:email AS citext)", nativeQuery = true)
    Optional<User> findByEmail(@Param("email") String email);

    Optional<User> findByGoogleSub(String googleSub);

    /** Khóa dòng tài khoản để hai quản trị viên thao tác cùng lúc không ghi chồng (UC-QT-02, 03, 04, 06, 07). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM User u WHERE u.id = :id")
    Optional<User> findForUpdate(@Param("id") UUID id);

    @Query(value = "SELECT EXISTS (SELECT 1 FROM users WHERE email = CAST(:email AS citext))", nativeQuery = true)
    boolean existsByEmail(@Param("email") String email);
}
