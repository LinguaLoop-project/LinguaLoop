-- Phát âm riêng theo loại từ cho từ đồng tự khác âm (vd "present": danh từ /ˈpreznt/, động từ /prɪˈzent/).
-- Khoá là pos trong meanings; giá trị cùng dạng phát âm mặc định của từ:
-- {"verb":{"ipa_uk":"...","ipa_us":"...","audio_uk":null,"audio_us":null}}
-- NULL: mọi loại từ dùng phát âm mặc định. Dữ liệu nạp bằng backend/seed/dictionary-pos-pronunciations.sql.gz.
ALTER TABLE dictionary_words ADD COLUMN pos_pronunciations jsonb;
