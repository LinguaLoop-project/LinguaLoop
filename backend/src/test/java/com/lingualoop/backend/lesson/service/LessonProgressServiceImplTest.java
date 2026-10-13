package com.lingualoop.backend.lesson.service;

import com.lingualoop.backend.lesson.enums.PracticeMode;
import org.junit.jupiter.api.Test;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

class LessonProgressServiceImplTest {

    private final LessonProgressServiceImpl service = new LessonProgressServiceImpl();

    @Test
    void recordActivity_shouldExecuteWithoutException() {
        assertDoesNotThrow(() -> service.recordActivity(
                UUID.randomUUID(),
                UUID.randomUUID(),
                PracticeMode.dictation,
                120
        ));
    }
}
