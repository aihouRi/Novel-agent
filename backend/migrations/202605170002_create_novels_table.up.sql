CREATE TABLE IF NOT EXISTS novels (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    genre VARCHAR(255) NOT NULL DEFAULT '',
    language VARCHAR(50) NOT NULL DEFAULT 'zh-CN',
    style_profile TEXT,
    worldview TEXT,
    power_system TEXT,
    main_plot TEXT,
    writing_rules TEXT,
    forbidden_rules TEXT,
    recent_chapter_count INT NOT NULL DEFAULT 3,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_novels_user_id (user_id),
    CONSTRAINT fk_novels_user_id FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
