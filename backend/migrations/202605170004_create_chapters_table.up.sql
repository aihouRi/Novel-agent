CREATE TABLE IF NOT EXISTS chapters (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    novel_id BIGINT UNSIGNED NOT NULL,
    chapter_number INT NOT NULL,
    title VARCHAR(255) NOT NULL DEFAULT '',
    body LONGTEXT,
    word_count INT NOT NULL DEFAULT 0,
    generation_instruction TEXT,
    outline TEXT,
    summary TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_chapters_novel_chapter_number (novel_id, chapter_number),
    KEY idx_chapters_novel_id (novel_id),
    CONSTRAINT fk_chapters_novel_id FOREIGN KEY (novel_id) REFERENCES novels (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
