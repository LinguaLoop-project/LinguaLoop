-- Hệ thống không xóa tài khoản, quản trị viên chỉ khóa (locked_at) (BR-NK-16). Nhiều bảng tham chiếu users với
-- ON DELETE CASCADE, nên một lệnh DELETE chạy tay trên users sẽ xóa theo lượt luyện, đơn Pro, nhật ký AI... và làm sai
-- số liệu thống kê. Chặn ngay ở cơ sở dữ liệu: muốn xóa thật phải chủ động tắt trigger.
CREATE FUNCTION forbid_user_delete() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'Không được xóa tài khoản (%), hãy khóa tài khoản', lower(TG_OP)
        USING ERRCODE = 'restrict_violation';
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_no_delete BEFORE DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION forbid_user_delete();
CREATE TRIGGER trg_users_no_truncate BEFORE TRUNCATE ON users
    FOR EACH STATEMENT EXECUTE FUNCTION forbid_user_delete();
