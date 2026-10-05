package com.lingualoop.backend.user.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.lingualoop.backend.user.entity.User;

public interface UserRepository extends JpaRepository<User, UUID> {

    // Tham số JDBC có kiểu varchar nên "email = ?" thành so sánh text phân biệt hoa thường;
    // ép sang citext để dùng đúng so sánh của cột.
    @Query(value = "SELECT * FROM users WHERE email = CAST(:email AS citext)", nativeQuery = true)
    Optional<User> findByEmail(@Param("email") String email);

    @Query(value = "SELECT EXISTS (SELECT 1 FROM users WHERE email = CAST(:email AS citext))", nativeQuery = true)
    boolean existsByEmail(@Param("email") String email);
}
