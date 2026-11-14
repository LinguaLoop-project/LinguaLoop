package com.lingualoop.backend.vocab;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import com.lingualoop.backend.security.JwtTokenService;
import com.lingualoop.backend.security.Role;

import lombok.RequiredArgsConstructor;

/**
 * Dữ liệu mẫu cho test quản lý bộ thẻ của giáo viên và quản trị viên (UC-BT-01, UC-BT-02). Người dùng và bộ được chèn
 * bằng SQL để đặt tùy ý {@code updated_at}, {@code deleted_at}, chủ bộ và loại bộ. Cơ sở dữ liệu của test dùng chung:
 * giáo viên luôn tạo mới nên danh sách của giáo viên chỉ có bộ của test; danh sách quản trị viên thì có bộ của test
 * khác, nên test quản trị viên lọc thêm theo tiền tố tên riêng.
 */
@Component
@RequiredArgsConstructor
public class DeckManageTestData {

    private final JdbcTemplate jdbc;
    private final JwtTokenService jwtTokenService;

    /** Một tài khoản mới với vai trò {@code role} và tên hiển thị {@code displayName}. */
    public UUID user(Role role, String displayName) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, display_name, role, email_verified_at)
                VALUES (?, ?, 'hash', ?, ?, now())""", id, "bt-" + id + "@x.com", displayName, role.value());
        return id;
    }

    public UUID teacher(String displayName) {
        return user(Role.TEACHER, displayName);
    }

    public UUID admin() {
        return user(Role.ADMIN, "Admin");
    }

    public String tokenFor(UUID userId, Role role) {
        return jwtTokenService.issueAccessToken(userId, role, UUID.randomUUID()).token();
    }

    /** Danh mục với tên duy nhất trong cả cơ sở dữ liệu. */
    public UUID category(String name) {
        UUID id = UUID.randomUUID();
        jdbc.update("INSERT INTO deck_categories (id, name) VALUES (?, ?)", id, name);
        return id;
    }

    /** Bắt đầu dựng một bộ thư viện Nháp của {@code owner} ({@code null} = bộ hệ thống). */
    public DeckBuilder deck(UUID owner, String name) {
        return new DeckBuilder(owner, name);
    }

    /** Một nhóm thẻ; {@code deleted} = đã xóa mềm. */
    public UUID group(UUID deck, String name, boolean deleted) {
        UUID id = UUID.randomUUID();
        jdbc.update("INSERT INTO vocab_groups (id, deck_id, name, deleted_at) VALUES (?, ?, ?, ?)",
                id, deck, name, deleted ? Timestamp.from(Instant.now()) : null);
        return id;
    }

    /** Một thẻ trong nhóm; {@code deleted} = đã xóa mềm. */
    public UUID card(UUID group, String word, boolean deleted) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO vocab_cards (id, deck_id, group_id, word, meaning_vi, deleted_at)
                VALUES (?, (SELECT deck_id FROM vocab_groups WHERE id = ?), ?, ?, 'nghĩa', ?)""",
                id, group, group, word, deleted ? Timestamp.from(Instant.now()) : null);
        return id;
    }

    public int countDecks(UUID owner) {
        Integer n = jdbc.queryForObject("SELECT count(*) FROM vocab_decks WHERE owner_id = ?", Integer.class, owner);
        return n == null ? 0 : n;
    }

    /** Dựng một dòng {@code vocab_decks}; mặc định thư viện, Nháp, không Pro, không danh mục, cập nhật lúc này. */
    public final class DeckBuilder {
        private final UUID owner;
        private final String name;
        private String kind = "library";
        private String status = "draft";
        private boolean pro;
        private UUID category;
        private Instant updatedAt = Instant.now();
        private Instant deletedAt;
        private String imageUrl;

        private DeckBuilder(UUID owner, String name) {
            this.owner = owner;
            this.name = name;
        }

        public DeckBuilder published() {
            this.status = "published";
            return this;
        }

        public DeckBuilder personal() {
            this.kind = "personal";
            return this;
        }

        public DeckBuilder pro() {
            this.pro = true;
            return this;
        }

        public DeckBuilder category(UUID categoryId) {
            this.category = categoryId;
            return this;
        }

        public DeckBuilder updatedAt(Instant at) {
            this.updatedAt = at;
            return this;
        }

        public DeckBuilder deletedAt(Instant at) {
            this.deletedAt = at;
            return this;
        }

        public DeckBuilder image(String url) {
            this.imageUrl = url;
            return this;
        }

        public UUID insert() {
            UUID id = UUID.randomUUID();
            jdbc.update("""
                    INSERT INTO vocab_decks (id, owner_id, kind, category_id, name, image_url, is_pro, status,
                                             deleted_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    id, owner, kind, category, name, imageUrl, pro, status,
                    deletedAt == null ? null : Timestamp.from(deletedAt), Timestamp.from(updatedAt));
            return id;
        }
    }
}
