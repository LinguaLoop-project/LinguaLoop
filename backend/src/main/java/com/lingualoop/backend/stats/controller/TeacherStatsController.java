package com.lingualoop.backend.stats.controller;

import java.util.UUID;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.security.CurrentUserId;
import com.lingualoop.backend.stats.dto.StatsPeriod;
import com.lingualoop.backend.stats.dto.TeacherDeckStatsView;
import com.lingualoop.backend.stats.dto.TeacherLessonStatsView;
import com.lingualoop.backend.stats.dto.TeacherOverviewView;
import com.lingualoop.backend.stats.service.TeacherContentStatsService;

import lombok.RequiredArgsConstructor;

/**
 * Thống kê nội dung của giáo viên (UC-TN-01 đến 03); mặc định 30 ngày gần nhất (BR-TN-03). {@code SecurityConfig} cho
 * cả quản trị viên vào {@code /teacher/**}, nên lớp này chỉ nhận giáo viên.
 */
@RestController
@RequestMapping("/api/v1/teacher/stats")
@PreAuthorize("hasRole('TEACHER')")
@RequiredArgsConstructor
public class TeacherStatsController {

    private final TeacherContentStatsService statsService;

    @GetMapping("/overview")
    public ApiResponse<TeacherOverviewView> overview(@CurrentUserId UUID userId,
            @RequestParam(defaultValue = "D30") StatsPeriod period) {
        return ApiResponse.ok(statsService.overview(userId, period));
    }

    @GetMapping("/lessons/{lessonId}")
    public ApiResponse<TeacherLessonStatsView> lesson(@CurrentUserId UUID userId, @PathVariable UUID lessonId,
            @RequestParam(defaultValue = "D30") StatsPeriod period) {
        return ApiResponse.ok(statsService.lesson(userId, lessonId, period));
    }

    @GetMapping("/decks/{deckId}")
    public ApiResponse<TeacherDeckStatsView> deck(@CurrentUserId UUID userId, @PathVariable UUID deckId,
            @RequestParam(defaultValue = "D30") StatsPeriod period) {
        return ApiResponse.ok(statsService.deck(userId, deckId, period));
    }
}
