package com.lingualoop.backend.shadowing.controller;

import java.io.IOException;
import java.io.PrintWriter;
import java.io.UncheckedIOException;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.http.HttpServletResponse;

/**
 * Ghi các sự kiện Server-Sent Events thẳng vào response, chỉ bắt đầu response ở sự kiện đầu tiên. Nhờ vậy lỗi xảy ra
 * trước sự kiện đầu vẫn trả được mã HTTP và JSON lỗi bình thường; sau đó chỉ báo lỗi bằng sự kiện {@code error}.
 */
final class SseStream {

    private static final ObjectMapper JSON = new ObjectMapper();

    private final HttpServletResponse response;
    private boolean started;

    SseStream(HttpServletResponse response) {
        this.response = response;
    }

    boolean started() {
        return started;
    }

    /** @throws UncheckedIOException khi không ghi được nữa (thường là người học đã đóng trang) */
    void send(String event, Object data) {
        try {
            if (!started) {
                response.setStatus(HttpServletResponse.SC_OK);
                response.setContentType("text/event-stream");
                response.setCharacterEncoding("UTF-8");
                response.setHeader("Cache-Control", "no-cache");
                response.setHeader("X-Accel-Buffering", "no"); // proxy như nginx không được gom lại rồi mới gửi
                started = true;
            }
            PrintWriter writer = response.getWriter();
            writer.write("event: " + event + "\ndata: " + JSON.writeValueAsString(data) + "\n\n");
            writer.flush();
            if (writer.checkError()) {
                throw new IOException("Client closed the connection");
            }
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }
}
