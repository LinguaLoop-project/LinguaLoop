package com.lingualoop.backend.dictionary.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.security.JwtTokenService;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.user.service.UserAccountService;

/** Chạy trên Postgres thật: jsonb, pg_trgm và fetch join lemma đều được thực thi. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class DictionaryApiIntegrationTest {

    private static final String NOUN_AND_VERB = """
            [{"no":1,"pos":"noun","translation_vi":"món quà","example_en":"a gift","example_vi":"một món quà"},
             {"no":2,"pos":"noun","translation_vi":"hiện tại","example_en":null,"example_vi":null},
             {"no":3,"pos":"verb","translation_vi":"trình bày","example_en":"to present","example_vi":"để trình bày"}]""";

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtTokenService jwtTokenService;
    @Autowired private UserAccountService userAccountService;
    @Autowired private JdbcTemplate jdbc;

    /** Mỗi test một tiền tố riêng (chỉ chữ cái và số) để headword không đụng dữ liệu của test khác. */
    private final String base = "zq" + UUID.randomUUID().toString().replace("-", "").substring(0, 10);

    // ---------------------------------------------------------------- GET /word/{word}

    @Test
    void lookup_groupsMeaningsByPosKeepingNumbersAndOrder() throws Exception {
        insert(base, "A1", null, "/ɪpa-uk/", "/ɪpa-us/", null, NOUN_AND_VERB);

        as(get("/api/v1/dictionary/word/{word}", base))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.headword").value(base))
                .andExpect(jsonPath("$.data.cefrLevel").value("A1"))
                .andExpect(jsonPath("$.data.pronunciation.ipaUs").value("/ɪpa-us/"))
                .andExpect(jsonPath("$.data.lemma").doesNotExist())
                .andExpect(jsonPath("$.data.groups.length()").value(2))
                .andExpect(jsonPath("$.data.groups[0].pos").value("noun"))
                .andExpect(jsonPath("$.data.groups[0].meanings.length()").value(2))
                .andExpect(jsonPath("$.data.groups[0].meanings[0].no").value(1))
                .andExpect(jsonPath("$.data.groups[0].meanings[0].translationVi").value("món quà"))
                .andExpect(jsonPath("$.data.groups[0].meanings[0].exampleEn").value("a gift"))
                .andExpect(jsonPath("$.data.groups[0].meanings[1].exampleEn").doesNotExist())
                .andExpect(jsonPath("$.data.groups[1].pos").value("verb"))
                .andExpect(jsonPath("$.data.groups[1].meanings[0].no").value(3));
    }

    @Test
    void lookup_passesThroughAudioPathWhenBaseUrlNotConfigured() throws Exception {
        insert(base, "A1", null, "/ipa-uk/", "/ipa-us/", "audio/" + base + "-uk.mp3", "audio/" + base + "-us.mp3",
                null, NOUN_AND_VERB);

        as(get("/api/v1/dictionary/word/{word}", base))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.pronunciation.audioUk").value("audio/" + base + "-uk.mp3"))
                .andExpect(jsonPath("$.data.pronunciation.audioUs").value("audio/" + base + "-us.mp3"));
    }

    @Test
    void lookup_usesPosOverrideOnlyForThatPos() throws Exception {
        String override = """
                {"verb":{"ipa_uk":"/v-uk/","ipa_us":"/v-us/","audio_uk":null,"audio_us":"audio/v-us.mp3"}}""";
        insert(base, "A1", null, "/n-uk/", "/n-us/", override, NOUN_AND_VERB);

        as(get("/api/v1/dictionary/word/{word}", base))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.pronunciation.ipaUk").value("/n-uk/"))
                .andExpect(jsonPath("$.data.groups[0].pos").value("noun"))
                .andExpect(jsonPath("$.data.groups[0].pronunciation.ipaUs").value("/n-us/"))
                .andExpect(jsonPath("$.data.groups[1].pos").value("verb"))
                .andExpect(jsonPath("$.data.groups[1].pronunciation.ipaUk").value("/v-uk/"))
                .andExpect(jsonPath("$.data.groups[1].pronunciation.audioUs").value("audio/v-us.mp3"))
                .andExpect(jsonPath("$.data.groups[1].pronunciation.audioUk").doesNotExist());
    }

    @Test
    void lookup_normalizesCaseCurlyApostropheAndTrailingPunctuation() throws Exception {
        insert(base + "'t", null, null, null, "/x/", null, NOUN_AND_VERB);

        as(get("/api/v1/dictionary/word/{word}", base.toUpperCase() + "’T."))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.headword").value(base + "'t"))
                .andExpect(jsonPath("$.data.cefrLevel").doesNotExist());
    }

    @Test
    void lookup_inflectionWithoutOwnMeaningsReturnsLemma() throws Exception {
        UUID lemma = insert(base, "A1", null, "/l/", "/l/", null, NOUN_AND_VERB);
        insert(base + "s", "A1", lemma, "/ls/", "/ls/", null, "[]");

        as(get("/api/v1/dictionary/word/{word}", base + "s"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.headword").value(base + "s"))
                .andExpect(jsonPath("$.data.groups.length()").value(0))
                .andExpect(jsonPath("$.data.lemma.headword").value(base))
                .andExpect(jsonPath("$.data.lemma.groups.length()").value(2))
                .andExpect(jsonPath("$.data.lemma.lemma").doesNotExist());
    }

    @Test
    void lookup_wordWithOwnMeaningsAndLemmaReturnsBoth() throws Exception {
        UUID lemma = insert(base, "A1", null, null, null, null, NOUN_AND_VERB);
        insert(base + "d", "A1", lemma, null, null, null,
                "[{\"no\":1,\"pos\":\"noun\",\"translation_vi\":\"khung chì\",\"example_en\":null,\"example_vi\":null}]");

        as(get("/api/v1/dictionary/word/{word}", base + "d"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.groups[0].meanings[0].translationVi").value("khung chì"))
                .andExpect(jsonPath("$.data.lemma.headword").value(base));
    }

    @Test
    void lookup_blankPosMeaningsFormOneGroupWithNullPos() throws Exception {
        insert(base, null, null, null, null, null,
                "[{\"no\":1,\"pos\":\"\",\"translation_vi\":\"a\",\"example_en\":null,\"example_vi\":null},"
                        + "{\"no\":2,\"pos\":null,\"translation_vi\":\"b\",\"example_en\":null,\"example_vi\":null}]");

        as(get("/api/v1/dictionary/word/{word}", base))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.groups.length()").value(1))
                .andExpect(jsonPath("$.data.groups[0].pos").doesNotExist())
                .andExpect(jsonPath("$.data.groups[0].meanings.length()").value(2));
    }

    @Test
    void lookup_returns404ForUnknownAndEmptyWords() throws Exception {
        insert(base + "empty", null, null, null, null, null, "[]");

        for (String word : new String[] { base + "unknown", base + "empty", "...", "a".repeat(100) }) {
            as(get("/api/v1/dictionary/word/{word}", word))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.code").value("DICTIONARY_WORD_NOT_FOUND"));
        }
    }

    @Test
    void lookup_requiresLogin() throws Exception {
        mockMvc.perform(get("/api/v1/dictionary/word/{word}", base))
                .andExpect(status().isUnauthorized());
    }

    // ---------------------------------------------------------------- GET /search

    @Test
    void search_ordersExactThenPrefixByCloserMatch() throws Exception {
        insert(base + "xyz", null, null, null, null, null, NOUN_AND_VERB);
        insert(base + "s", null, null, null, null, null, NOUN_AND_VERB);
        insert(base, null, null, null, null, null, NOUN_AND_VERB);

        as(get("/api/v1/dictionary/search").param("word", base))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(3))
                .andExpect(jsonPath("$.data[0].headword").value(base))
                .andExpect(jsonPath("$.data[1].headword").value(base + "s"))
                .andExpect(jsonPath("$.data[2].headword").value(base + "xyz"));
    }

    @Test
    void search_findsCloseSpellingsAndNormalizesQuery() throws Exception {
        insert(base + "ello", null, null, null, null, null, NOUN_AND_VERB);

        as(get("/api/v1/dictionary/search").param("word", " " + (base + "elo").toUpperCase() + "! "))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].headword").value(base + "ello"));
    }

    @Test
    void search_skipsWordsWithNothingToShowAndMarksInflectionsWithLemma() throws Exception {
        UUID lemma = insert(base, null, null, null, null, null, NOUN_AND_VERB);
        insert(base + "s", null, lemma, null, null, null, "[]");
        insert(base + "empty", null, null, null, null, null, "[]");

        as(get("/api/v1/dictionary/search").param("word", base))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[0].headword").value(base))
                .andExpect(jsonPath("$.data[1].headword").value(base + "s"))
                .andExpect(jsonPath("$.data[1].lemma.headword").value(base));
    }

    @Test
    void search_respectsLimitAndCapsIt() throws Exception {
        for (int i = 0; i < 5; i++) {
            insert(base + i, null, null, null, null, null, NOUN_AND_VERB);
        }

        as(get("/api/v1/dictionary/search").param("word", base).param("limit", "2"))
                .andExpect(jsonPath("$.data.length()").value(2));
        as(get("/api/v1/dictionary/search").param("word", base).param("limit", "0"))
                .andExpect(jsonPath("$.data.length()").value(1));
        as(get("/api/v1/dictionary/search").param("word", base).param("limit", "100000"))
                .andExpect(jsonPath("$.data.length()").value(5));
    }

    @Test
    void search_returnsEmptyListForBlankQueryAndBadRequestWhenMissing() throws Exception {
        as(get("/api/v1/dictionary/search").param("word", "  ?! "))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(0));
        as(get("/api/v1/dictionary/search"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void search_requiresLogin() throws Exception {
        mockMvc.perform(get("/api/v1/dictionary/search").param("word", base))
                .andExpect(status().isUnauthorized());
    }

    // ---------------------------------------------------------------- helpers

    private ResultActions as(MockHttpServletRequestBuilder request) throws Exception {
        UUID userId = userAccountService.createLocal(
                "dict-" + UUID.randomUUID() + "@x.com", "Kế", "bcrypt-hash").id();
        return mockMvc.perform(request.header(HttpHeaders.AUTHORIZATION, "Bearer "
                + jwtTokenService.issueAccessToken(userId, Role.STUDENT, UUID.randomUUID()).token()));
    }

    private UUID insert(String headword, String cefr, UUID lemmaId, String ipaUk, String ipaUs,
            String posPronunciations, String meaningsJson) {
        return insert(headword, cefr, lemmaId, ipaUk, ipaUs, null, null, posPronunciations, meaningsJson);
    }

    private UUID insert(String headword, String cefr, UUID lemmaId, String ipaUk, String ipaUs,
            String audioUk, String audioUs, String posPronunciations, String meaningsJson) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO dictionary_words
                    (id, headword, cefr_level, lemma_id, ipa_uk, ipa_us, audio_uk, audio_us, pos_pronunciations, meanings)
                VALUES (?, ?, CAST(? AS cefr_code), CAST(? AS uuid), ?, ?, ?, ?, CAST(? AS jsonb), CAST(? AS jsonb))""",
                id, headword, cefr, lemmaId == null ? null : lemmaId.toString(), ipaUk, ipaUs,
                audioUk, audioUs, posPronunciations, meaningsJson);
        return id;
    }
}
