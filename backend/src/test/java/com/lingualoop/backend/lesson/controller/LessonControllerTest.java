package com.lingualoop.backend.lesson.controller;

import com.lingualoop.backend.lesson.dto.LessonDetail;
import com.lingualoop.backend.lesson.service.LessonQueryService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.springframework.security.test.context.support.WithMockUser;

@WebMvcTest(LessonController.class)
class LessonControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private LessonQueryService lessonQueryService;

    @Test
    @WithMockUser
    void getLessonDetail_shouldReturn200() throws Exception {
        // Arrange
        LessonDetail mockDetail = new LessonDetail(UUID.randomUUID(), "test-lesson", "Title", null, null, null, null, null, 100, 0, null, false, false, 5L, null, null);
        when(lessonQueryService.getLessonDetail(eq("test-lesson"), any(UUID.class))).thenReturn(mockDetail);

        // Act & Assert
        // Authentication is probably mocked or bypassed in simple webmvctest if security auto-config is excluded, 
        // but let's assume it passes or we might need @WithMockUser. For LinguaLoop, if JWT filter applies, we might get 401. 
        // We'll just test the endpoint mapping. If we get 401, we might need to suppress security in WebMvcTest.
        mockMvc.perform(get("/api/v1/lessons/test-lesson")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.slug").value("test-lesson"));
    }
}
