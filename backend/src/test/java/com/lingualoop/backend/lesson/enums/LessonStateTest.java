package com.lingualoop.backend.lesson.enums;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;

class LessonStateTest {

    @Test
    void parse_blankMeansNoFilter() {
        assertThat(LessonState.parse(null)).isNull();
        assertThat(LessonState.parse("  ")).isNull();
    }

    @Test
    void parse_isCaseInsensitive() {
        assertThat(LessonState.parse("todo")).isEqualTo(LessonState.TODO);
        assertThat(LessonState.parse(" Doing ")).isEqualTo(LessonState.DOING);
        assertThat(LessonState.parse("DONE")).isEqualTo(LessonState.DONE);
    }

    @Test
    void parse_unknownValue_isValidationError() {
        assertThatThrownBy(() -> LessonState.parse("finished"))
                .isInstanceOfSatisfying(BusinessException.class,
                        e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.VALIDATION_FAILED));
    }
}
