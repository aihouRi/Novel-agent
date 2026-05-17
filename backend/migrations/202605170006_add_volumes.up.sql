CREATE TABLE IF NOT EXISTS volumes (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    novel_id BIGINT UNSIGNED NOT NULL,
    volume_number INT NOT NULL,
    title VARCHAR(255) NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_volumes_novel_volume_number (novel_id, volume_number),
    KEY idx_volumes_novel_id (novel_id),
    CONSTRAINT fk_volumes_novel_id FOREIGN KEY (novel_id) REFERENCES novels (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO volumes (novel_id, volume_number, title)
SELECT n.id, 1, '第一卷'
FROM novels n
LEFT JOIN volumes v ON v.novel_id = n.id AND v.volume_number = 1
WHERE v.id IS NULL;

ALTER TABLE chapters
ADD COLUMN volume_id BIGINT UNSIGNED NULL AFTER novel_id;

UPDATE chapters c
JOIN volumes v ON v.novel_id = c.novel_id AND v.volume_number = 1
SET c.volume_id = v.id
WHERE c.volume_id IS NULL;

ALTER TABLE chapters
ADD KEY idx_chapters_volume_id (volume_id),
ADD CONSTRAINT fk_chapters_volume_id FOREIGN KEY (volume_id) REFERENCES volumes (id);
