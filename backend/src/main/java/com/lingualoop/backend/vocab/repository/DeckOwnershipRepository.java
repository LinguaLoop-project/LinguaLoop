package com.lingualoop.backend.vocab.repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import com.lingualoop.backend.vocab.entity.VocabDeck;

/** Đọc và đổi chủ bộ thẻ thư viện chưa xóa khi quản trị viên giao lại nội dung (BR-QT-05, BR-QT-07). */
public interface DeckOwnershipRepository extends Repository<VocabDeck, UUID> {

    interface OwnedRow {
        UUID getId();

        String getName();

        UUID getOwnerId();

        String getStatus();
    }

    String SELECT = "SELECT d.id AS id, d.name AS name, d.owner_id AS ownerId, d.status AS status FROM vocab_decks d ";

    /** Khóa các dòng để hai quản trị viên giao cùng lúc không chồng lên nhau. */
    @Query(value = SELECT + """
            WHERE d.id IN (:ids) AND d.kind = 'library' AND d.deleted_at IS NULL
            ORDER BY d.id FOR UPDATE""", nativeQuery = true)
    List<OwnedRow> lockLibraryByIds(@Param("ids") Collection<UUID> ids);

    @Query(value = SELECT + """
            WHERE d.owner_id = :ownerId AND d.kind = 'library' AND d.deleted_at IS NULL
            ORDER BY d.id FOR UPDATE""", nativeQuery = true)
    List<OwnedRow> lockLibraryByOwner(@Param("ownerId") UUID ownerId);

    /** Tên chữ thường của mọi bộ chưa xóa của một người (trừ bộ Từ đã lưu), cùng phạm vi với uq_vocab_decks_name. */
    @Query(value = """
            SELECT lower(d.name) FROM vocab_decks d
            WHERE d.owner_id = :ownerId AND d.deleted_at IS NULL AND d.kind <> 'saved'""", nativeQuery = true)
    List<String> activeNamesLower(@Param("ownerId") UUID ownerId);

    @Modifying(flushAutomatically = true)
    @Query(value = """
            UPDATE vocab_decks SET owner_id = :newOwner
            WHERE id IN (:ids) AND kind = 'library' AND deleted_at IS NULL""", nativeQuery = true)
    int changeOwner(@Param("ids") Collection<UUID> ids, @Param("newOwner") UUID newOwner);
}
