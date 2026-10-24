package com.lingualoop.backend.dictionary.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.lingualoop.backend.dictionary.entity.DictionaryWord;

public interface DictionaryWordRepository extends JpaRepository<DictionaryWord, UUID> {

    @Query("select w from DictionaryWord w left join fetch w.lemma where w.headword = :headword")
    Optional<DictionaryWord> findByHeadwordWithLemma(@Param("headword") String headword);

    @Query("select w from DictionaryWord w left join fetch w.lemma where w.id in :ids")
    List<DictionaryWord> findAllWithLemmaByIdIn(@Param("ids") Collection<UUID> ids);

    /**
     * Lấy ID các từ khớp với q, ưu tiên: trùng khớp, tiền tố, từ có nghĩa riêng.
     */
    @Query(value = """
            SELECT w.id
            FROM dictionary_words w
            WHERE (jsonb_array_length(w.meanings) > 0 OR w.lemma_id IS NOT NULL)
              AND (w.headword LIKE :prefix OR (length(:q) >= 3 AND w.headword % :q))
            ORDER BY (w.headword = :q) DESC,
                     (w.headword LIKE :prefix) DESC,
                     (w.lemma_id IS NOT NULL AND jsonb_array_length(w.meanings) = 0) ASC,
                     CASE WHEN w.headword LIKE :prefix THEN 0 ELSE 1 - similarity(w.headword, :q) END ASC,
                     w.cefr_level ASC NULLS LAST,
                     length(w.headword) ASC,
                     w.headword ASC
            LIMIT :limit
            """, nativeQuery = true)
    List<UUID> searchIds(@Param("q") String q, @Param("prefix") String prefix, @Param("limit") int limit);
}
