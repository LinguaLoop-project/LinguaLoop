package com.lingualoop.backend.user.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.AbstractMockHttpServletRequestBuilder;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.security.JwtTokenService;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.storage.service.FileStorageService;
import com.lingualoop.backend.storage.service.UploadPurpose;
import com.lingualoop.backend.user.service.UserAccountService;

/** Ảnh đại diện học viên tự tải lên (UC-TK-10, BR-TK-19): đặt, thay, bỏ; chỉ học viên và chỉ tệp của chính mình. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class AvatarApiIntegrationTest {

    private static final String URL = "/api/v1/users/me/avatar";
    private static final String CDN = "https://cdn.test/";
    private static final byte[] JPG_HEAD = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 0x10, 'J', 'F', 'I', 'F', 0, 1};
    private static final byte[] PNG_HEAD = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0};
    private static final byte[] WEBP_HEAD = {'R', 'I', 'F', 'F', 1, 2, 3, 4, 'W', 'E', 'B', 'P'};
    private static final byte[] TEXT_HEAD = "not an image".getBytes();

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtTokenService jwtTokenService;
    @Autowired private UserAccountService users;
    @Autowired private JdbcTemplate jdbc;
    @MockitoBean private FileStorageService storage;

    private UUID me;

    @BeforeEach
    void setUp() {
        me = users.createLocal("av-" + UUID.randomUUID() + "@x.com", "Minh", "hash").id();
        when(storage.readHead(anyString(), anyInt())).thenReturn(JPG_HEAD);
        when(storage.publicUrl(anyString())).thenAnswer(inv -> CDN + inv.getArgument(0));
    }

    private ResultActions as(UUID user, AbstractMockHttpServletRequestBuilder<?> request) throws Exception {
        String token = jwtTokenService.issueAccessToken(user, Role.STUDENT, UUID.randomUUID()).token();
        return mockMvc.perform(request.header(HttpHeaders.AUTHORIZATION, "Bearer " + token));
    }

    private ResultActions setAvatar(UUID user, String key) throws Exception {
        return as(user, put(URL).contentType(MediaType.APPLICATION_JSON).content("{\"key\":\"" + key + "\"}"));
    }

    private String keyOf(UUID user, String file) {
        return UploadPurpose.AVATAR.prefix() + "/" + user + "/" + file;
    }

    @Test
    void setAvatar_savesTheKeyAndMeReturnsItsUrl_AC_TK_66() throws Exception {
        String key = keyOf(me, "a.jpg");

        setAvatar(me, key).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.avatarUrl").value(CDN + key))
                .andExpect(jsonPath("$.data.customAvatar").value(true));
        verify(storage).confirmUpload(me, UploadPurpose.AVATAR, key);

        as(me, get("/api/v1/users/me")).andExpect(jsonPath("$.data.avatarUrl").value(CDN + key));
    }

    @Test
    void setAvatar_acceptsPngAndWebpAndReplacesThePreviousFile_AC_TK_66() throws Exception {
        String first = keyOf(me, "a.png");
        String second = keyOf(me, "b.webp");

        when(storage.readHead(eq(first), anyInt())).thenReturn(PNG_HEAD);
        setAvatar(me, first).andExpect(status().isOk());
        when(storage.readHead(eq(second), anyInt())).thenReturn(WEBP_HEAD);
        setAvatar(me, second).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.avatarUrl").value(CDN + second));

        verify(storage).discardUpload(me, UploadPurpose.AVATAR, first);   // ảnh cũ bị xóa khỏi S3
        verify(storage, never()).discardUpload(me, UploadPurpose.AVATAR, second);
    }

    @Test
    void setAvatar_rejectsAFileThatIsNotReallyAnImage_AC_TK_67() throws Exception {
        String key = keyOf(me, "fake.jpg");
        when(storage.readHead(eq(key), anyInt())).thenReturn(TEXT_HEAD);

        setAvatar(me, key).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("avatar"))
                .andExpect(jsonPath("$.errors[0].code").value("ImageType"));
        verify(storage).discardUpload(me, UploadPurpose.AVATAR, key);     // tệp sai bị xóa
        as(me, get("/api/v1/users/me")).andExpect(jsonPath("$.data.avatarUrl").doesNotExist());
    }

    @Test
    void setAvatar_rejectsAKeyThatIsNotTheCallers_orWasNeverUploaded_AC_TK_67() throws Exception {
        String foreign = keyOf(UUID.randomUUID(), "x.jpg");
        doThrow(new BusinessException(ErrorCode.STORAGE_UPLOAD_NOT_FOUND))
                .when(storage).confirmUpload(me, UploadPurpose.AVATAR, foreign);

        setAvatar(me, foreign).andExpect(status().is4xxClientError());
        as(me, get("/api/v1/users/me")).andExpect(jsonPath("$.data.avatarUrl").doesNotExist());
        as(me, put(URL).contentType(MediaType.APPLICATION_JSON).content("{\"key\":\"\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void setAvatar_isForStudentsOnly_andNeedsAToken_AC_TK_67() throws Exception {
        jdbc.update("UPDATE users SET role = 'teacher' WHERE id = ?", me);
        String teacherToken = jwtTokenService.issueAccessToken(me, Role.TEACHER, UUID.randomUUID()).token();
        mockMvc.perform(put(URL).contentType(MediaType.APPLICATION_JSON).content("{\"key\":\"k\"}")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + teacherToken)).andExpect(status().isForbidden());
        mockMvc.perform(put(URL).contentType(MediaType.APPLICATION_JSON).content("{\"key\":\"k\"}"))
                .andExpect(status().isUnauthorized());
        verify(storage, never()).confirmUpload(any(), any(), anyString());
    }

    @Test
    void removeAvatar_fallsBackToTheGooglePictureAndDeletesTheFile_AC_TK_68() throws Exception {
        jdbc.update("UPDATE users SET avatar_url = 'https://google.test/p.png' WHERE id = ?", me);
        String key = keyOf(me, "a.jpg");
        setAvatar(me, key).andExpect(jsonPath("$.data.avatarUrl").value(CDN + key));

        as(me, delete(URL)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.avatarUrl").value("https://google.test/p.png"))
                .andExpect(jsonPath("$.data.customAvatar").value(false));
        verify(storage).discardUpload(me, UploadPurpose.AVATAR, key);

        as(me, delete(URL)).andExpect(status().isOk());                    // gọi lại khi không còn ảnh: không lỗi
    }
}
