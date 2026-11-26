package com.lingualoop.backend.user.service;

import static com.lingualoop.backend.user.enums.TransferContentType.DECK;
import static com.lingualoop.backend.user.enums.TransferContentType.LESSON;

import java.util.ArrayList;
import java.util.Collection;
import java.util.EnumMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.audit.enums.AuditAction;
import com.lingualoop.backend.audit.enums.AuditEntityType;
import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.common.response.PageResponse;
import com.lingualoop.backend.lesson.dto.OwnedLessonView;
import com.lingualoop.backend.lesson.service.LessonOwnershipService;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.user.dto.AdminUserView;
import com.lingualoop.backend.user.dto.ContentTransferView;
import com.lingualoop.backend.user.dto.request.TransferAllRequest;
import com.lingualoop.backend.user.dto.request.TransferSelectedRequest;
import com.lingualoop.backend.user.entity.User;
import com.lingualoop.backend.user.enums.TransferContentType;
import com.lingualoop.backend.user.repository.AdminUserRepository;
import com.lingualoop.backend.user.repository.AdminUserRepository.ItemFilter;
import com.lingualoop.backend.user.repository.UserRepository;
import com.lingualoop.backend.vocab.dto.OwnedDeckView;
import com.lingualoop.backend.vocab.service.DeckOwnershipService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
class ContentTransferServiceImpl implements ContentTransferService {

    private static final int PAGE_SIZE = 20;
    private static final int RECIPIENT_LIMIT = 50;
    /** Tên chủ ghi vào nhật ký cho bộ thẻ chưa gán chủ. */
    private static final String SYSTEM_OWNER_LABEL = "Hệ thống";

    private final UserRepository users;
    private final AdminUserRepository adminUsers;
    private final LessonOwnershipService lessonOwnership;
    private final DeckOwnershipService deckOwnership;
    private final NotificationService notifications;
    private final AdminAuditor auditor;

    /**
     * Một mục sẽ được giao: loại, id, tên, chủ hiện tại ({@code null} = "Hệ thống") và trạng thái Đã xuất bản.
     */
    private record Target(TransferContentType type, UUID id, String name, UUID ownerId, boolean published) {

        static Target of(OwnedLessonView lesson) {
            return new Target(LESSON, lesson.id(), lesson.title(), lesson.ownerId(), lesson.published());
        }

        static Target of(OwnedDeckView deck) {
            return new Target(DECK, deck.id(), deck.name(), deck.ownerId(), deck.published());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ContentTransferView.Item> listItems(String q, TransferContentType type, String owner,
            int page) {
        boolean system = SYSTEM_OWNER.equals(owner);
        UUID ownerId = system || owner == null || owner.isBlank() ? null : parseUuid(owner);
        ItemFilter filter = new ItemFilter(AdminUserRepository.containsPattern(q), type, system, ownerId);
        long total = adminUsers.countTransferItems(filter);
        List<ContentTransferView.Item> items = adminUsers.findTransferItems(filter, PAGE_SIZE,
                (long) page * PAGE_SIZE);
        return PageResponse.of(items, page, PAGE_SIZE, total);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ContentTransferView.Owner> owners() {
        return adminUsers.findTransferOwners();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ContentTransferView.Recipient> recipients(String q, List<UUID> excluded) {
        return adminUsers.findRecipients(AdminUserRepository.containsPattern(q),
                excluded == null ? List.of() : excluded, RECIPIENT_LIMIT);
    }

    @Override
    @Transactional(readOnly = true)
    public ContentTransferView.TeacherSummary summary(UUID teacherId) {
        User teacher = users.findById(teacherId).orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        return summaryOf(teacher);
    }

    @Override
    @Transactional
    public ContentTransferView.Result transferSelected(UUID adminId, TransferSelectedRequest request) {
        if (request.items().isEmpty()) {
            throw new BusinessException(ErrorCode.TRANSFER_NOTHING_SELECTED);
        }
        User recipient = lockRecipient(request.recipientId());

        Map<UUID, Target> lessons = byId(lessonOwnership.lockLibraryLessons(idsOf(request.items(), LESSON)).stream()
                .map(Target::of).toList(), Target::id);
        Map<UUID, Target> decks = byId(deckOwnership.lockLibraryDecks(idsOf(request.items(), DECK)).stream()
                .map(Target::of).toList(), Target::id);

        Set<UUID> ownerIds = request.items().stream().map(TransferSelectedRequest.Item::ownerId)
                .filter(Objects::nonNull).collect(Collectors.toSet());
        Map<UUID, User> owners = byId(users.findAllById(ownerIds), User::getId);

        List<Target> targets = new ArrayList<>();
        for (TransferSelectedRequest.Item item : request.items()) {
            Target target = (item.contentType() == LESSON ? lessons : decks).get(item.id());
            if (target == null || !Objects.equals(target.ownerId(), item.ownerId())
                    || !stillNeedsTransfer(target, owners)) {
                throw new BusinessException(ErrorCode.TRANSFER_CONTENT_CHANGED);
            }
            if (recipient.getId().equals(target.ownerId())) {
                throw new BusinessException(ErrorCode.TRANSFER_RECIPIENT_INVALID);
            }
            targets.add(target);
        }
        return transfer(adminId, recipient, distinct(targets), null);
    }

    @Override
    @Transactional
    public ContentTransferView.Result transferAll(UUID adminId, UUID teacherId, TransferAllRequest request) {
        User source = users.findForUpdate(teacherId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        if (source.getRole() != Role.TEACHER) {
            throw new BusinessException(ErrorCode.TRANSFER_SOURCE_NOT_TEACHER);
        }
        List<OwnedLessonView> lessons = lessonOwnership.lockLibraryLessonsOf(teacherId);
        List<OwnedDeckView> decks = deckOwnership.lockLibraryDecksOf(teacherId);
        if (lessons.isEmpty() && decks.isEmpty()) {
            throw new BusinessException(ErrorCode.TRANSFER_NO_CONTENT);
        }
        if (lessons.size() != request.expectedLessons() || decks.size() != request.expectedDecks()) {
            throw new BusinessException(ErrorCode.TRANSFER_CONTENT_CHANGED, Map.of("summary", summaryOf(source)));
        }
        if (source.getId().equals(request.recipientId())) {
            throw new BusinessException(ErrorCode.TRANSFER_RECIPIENT_INVALID);
        }
        User recipient = lockRecipient(request.recipientId());

        List<Target> targets = new ArrayList<>();
        lessons.forEach(l -> targets.add(Target.of(l)));
        decks.forEach(d -> targets.add(Target.of(d)));
        return transfer(adminId, recipient, targets, source);
    }

    // ---------------------------------------------------------------- giao

    private ContentTransferView.Result transfer(UUID adminId, User recipient, List<Target> targets, User source) {
        List<ContentTransferView.Conflict> conflicts = nameConflicts(recipient.getId(), targets);
        if (!conflicts.isEmpty()) {
            throw new BusinessException(ErrorCode.TRANSFER_NAME_CONFLICT, Map.of("conflicts", conflicts));
        }
        List<UUID> lessonIds = idsOfType(targets, LESSON);
        List<UUID> deckIds = idsOfType(targets, DECK);
        int movedLessons = lessonOwnership.changeOwner(lessonIds, recipient.getId());
        int movedDecks = deckOwnership.changeOwner(deckIds, recipient.getId());
        if (movedLessons != lessonIds.size() || movedDecks != deckIds.size()) {
            // Không xảy ra khi các dòng đã khóa ở trên; ném để giao dịch hoàn tác, giữ toàn bộ hoặc không (BR-QT-07).
            throw new BusinessException(ErrorCode.TRANSFER_CONTENT_CHANGED);
        }

        Map<UUID, String> ownerNames = byId(users.findAllById(targets.stream().map(Target::ownerId)
                .filter(Objects::nonNull).collect(Collectors.toSet())), User::getId)
                .entrySet().stream().collect(Collectors.toMap(Map.Entry::getKey, e -> e.getValue().getDisplayName()));
        for (Target target : targets) {
            Map<String, Object> diff = Map.of("owner",
                    AdminAuditor.change(ownerLabel(target.ownerId(), ownerNames), recipient.getDisplayName()));
            auditor.record(adminId, AuditAction.TRANSFER, target.type().auditEntityType(), target.id(), target.name(),
                    diff, null);
        }
        if (source != null) {
            auditor.record(adminId, AuditAction.TRANSFER, AuditEntityType.USER, source.getId(),
                    source.getDisplayName(), null, "Giao %d bài học, %d bộ thẻ cho %s".formatted(movedLessons,
                            movedDecks, recipient.getDisplayName()));
        }
        notifications.send(recipient.getId(), notificationMessage(movedLessons, movedDecks));
        return new ContentTransferView.Result(recipient.getId(), recipient.getDisplayName(), movedLessons, movedDecks);
    }

    /** Giáo viên nhận phải đang hoạt động và có vai trò Giáo viên (BR-QT-06). */
    private User lockRecipient(UUID recipientId) {
        User recipient = users.findForUpdate(recipientId).orElse(null);
        if (recipient == null || recipient.getRole() != Role.TEACHER || recipient.isLocked()) {
            throw new BusinessException(ErrorCode.TRANSFER_RECIPIENT_INVALID);
        }
        return recipient;
    }

    /**
     * Mục trùng tên (không phân biệt hoa thường) với nội dung cùng loại chưa xóa của giáo viên nhận, hoặc trùng nhau
     * trong cùng lần giao (BR-QT-07).
     */
    private List<ContentTransferView.Conflict> nameConflicts(UUID recipientId, List<Target> targets) {
        Map<TransferContentType, Set<String>> taken = new EnumMap<>(TransferContentType.class);
        taken.put(LESSON, new HashSet<>(lessonOwnership.activeTitlesLower(recipientId)));
        taken.put(DECK, new HashSet<>(deckOwnership.activeNamesLower(recipientId)));
        List<ContentTransferView.Conflict> conflicts = new ArrayList<>();
        for (Target target : targets) {
            if (!taken.get(target.type()).add(target.name().toLowerCase(Locale.ROOT))) {
                conflicts.add(new ContentTransferView.Conflict(target.type().value(), target.id(), target.name()));
            }
        }
        return conflicts;
    }

    /** Bộ chưa gán chủ, hoặc nội dung Đã xuất bản của giáo viên đang bị khóa (BR-QT-05, UC-QT-06 nhánh 7c). */
    private static boolean stillNeedsTransfer(Target target, Map<UUID, User> owners) {
        if (target.ownerId() == null) {
            return target.type() == DECK;
        }
        User owner = owners.get(target.ownerId());
        return owner != null && owner.isLocked() && target.published();
    }

    // ---------------------------------------------------------------- tiện ích

    private ContentTransferView.TeacherSummary summaryOf(User teacher) {
        if (teacher.getRole() != Role.TEACHER) {
            throw new BusinessException(ErrorCode.TRANSFER_SOURCE_NOT_TEACHER);
        }
        AdminUserView.ContentCounts counts = adminUsers.contentCounts(teacher.getId());
        return new ContentTransferView.TeacherSummary(teacher.getId(), teacher.getDisplayName(), teacher.getEmail(),
                teacher.isLocked(), counts.lessons(), counts.draftLessons(), counts.decks(), counts.draftDecks(),
                counts.openReports());
    }

    private static Set<UUID> idsOf(List<TransferSelectedRequest.Item> items, TransferContentType type) {
        return items.stream().filter(i -> i.contentType() == type).map(TransferSelectedRequest.Item::id)
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private static List<UUID> idsOfType(List<Target> targets, TransferContentType type) {
        return targets.stream().filter(t -> t.type() == type).map(Target::id).toList();
    }

    private static List<Target> distinct(List<Target> targets) {
        Map<String, Target> unique = new LinkedHashMap<>();
        targets.forEach(t -> unique.putIfAbsent(t.type() + ":" + t.id(), t));
        return List.copyOf(unique.values());
    }

    private static <T> Map<UUID, T> byId(Collection<T> values, Function<T, UUID> id) {
        return values.stream().collect(Collectors.toMap(id, Function.identity(), (a, b) -> a));
    }

    private static String ownerLabel(UUID ownerId, Map<UUID, String> names) {
        return ownerId == null ? SYSTEM_OWNER_LABEL : names.getOrDefault(ownerId, ownerId.toString());
    }

    /** Thông báo lưu dạng văn bản như mọi thông báo khác của {@link NotificationService}. */
    private static String notificationMessage(int lessons, int decks) {
        List<String> parts = new ArrayList<>();
        if (lessons > 0) {
            parts.add(lessons + " bài học");
        }
        if (decks > 0) {
            parts.add(decks + " bộ thẻ");
        }
        return "Quản trị viên đã giao cho bạn " + String.join(" và ", parts) + ".";
    }

    private static UUID parseUuid(String value) {
        try {
            return UUID.fromString(value);
        } catch (IllegalArgumentException e) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }
    }
}
