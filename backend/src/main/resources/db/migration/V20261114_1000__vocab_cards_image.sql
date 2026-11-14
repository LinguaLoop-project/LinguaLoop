-- Ảnh minh họa của thẻ do giáo viên soạn (BR-NT-03, BR-NT-09): S3 key dưới vocab-decks/cards/<userId>/ (đọc công
-- khai theo bucket policy vocab-decks/*). NULL = thẻ không có ảnh.
ALTER TABLE vocab_cards ADD COLUMN image_url text;
