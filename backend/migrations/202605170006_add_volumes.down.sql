ALTER TABLE chapters
DROP FOREIGN KEY fk_chapters_volume_id,
DROP KEY idx_chapters_volume_id,
DROP COLUMN volume_id;

DROP TABLE IF EXISTS volumes;
