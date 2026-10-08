package com.lingualoop.backend.auth.repository;

import java.time.Instant;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.lingualoop.backend.auth.entity.LoginAttempt;

public interface LoginAttemptRepository extends JpaRepository<LoginAttempt, String> {

    // Tham số JDBC là varchar nên phải ép sang citext để so khớp không phân biệt hoa thường.
    @Query(value = "SELECT * FROM auth_login_attempts WHERE email = CAST(:email AS citext)", nativeQuery = true)
    Optional<LoginAttempt> findByEmailIgnoreCase(@Param("email") String email);

    /**
     * Tăng bộ đếm sai một cách nguyên tử (một câu lệnh, không race giữa các request đồng thời). Khi đạt
     * {@code max} thì đặt {@code locked_until} và đếm về 0. Trả về trạng thái sau khi cập nhật.
     */
    @Query(value = """
            INSERT INTO auth_login_attempts AS a (email, failed_count, locked_until, updated_at)
            VALUES (CAST(:email AS citext),
                    CASE WHEN 1 >= CAST(:max AS int) THEN 0 ELSE 1 END,
                    CASE WHEN 1 >= CAST(:max AS int) THEN CAST(:lockedUntil AS timestamptz) END,
                    CAST(:now AS timestamptz))
            ON CONFLICT (email) DO UPDATE SET
                failed_count = CASE WHEN a.failed_count + 1 >= CAST(:max AS int) THEN 0 ELSE a.failed_count + 1 END,
                locked_until = CASE WHEN a.failed_count + 1 >= CAST(:max AS int) THEN CAST(:lockedUntil AS timestamptz) ELSE a.locked_until END,
                updated_at   = CAST(:now AS timestamptz)
            RETURNING *
            """, nativeQuery = true)
    LoginAttempt recordFailure(@Param("email") String email, @Param("max") int max,
            @Param("lockedUntil") Instant lockedUntil, @Param("now") Instant now);

    @Modifying
    @Query(value = "DELETE FROM auth_login_attempts WHERE email = CAST(:email AS citext)", nativeQuery = true)
    int clear(@Param("email") String email);
}
