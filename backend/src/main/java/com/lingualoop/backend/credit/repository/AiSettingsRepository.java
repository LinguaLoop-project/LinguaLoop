package com.lingualoop.backend.credit.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.lingualoop.backend.credit.entity.AiSettings;

import jakarta.persistence.LockModeType;

public interface AiSettingsRepository extends JpaRepository<AiSettings, Short> {

    /** Khoá dòng cấu hình khi sửa, để hai quản trị viên lưu cùng lúc không ghi đè nhau (UC-GA-02 8b). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM AiSettings s WHERE s.id = :id")
    Optional<AiSettings> findForUpdate(@Param("id") Short id);
}
