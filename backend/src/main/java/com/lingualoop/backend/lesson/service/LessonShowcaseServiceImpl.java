package com.lingualoop.backend.lesson.service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.lesson.dto.ShowcaseView;
import com.lingualoop.backend.lesson.repository.ShowcaseRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
class LessonShowcaseServiceImpl implements LessonShowcaseService {

    private static final ZoneId VN = ZoneId.of("Asia/Ho_Chi_Minh");

    private final ShowcaseRepository repository;
    private final Clock clock;

    /** Bài được chọn đổi theo ngày (giờ Việt Nam) để trang chủ không luôn hiện cùng một nhóm bài. */
    @Override
    @Transactional(readOnly = true)
    @Cacheable(CACHE)
    public ShowcaseView showcase() {
        String seed = LocalDate.now(clock.withZone(VN)).toString();
        return new ShowcaseView(repository.lessons(seed, PER_LEVEL), repository.topics(TOPICS));
    }
}
