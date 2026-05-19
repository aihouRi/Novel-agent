CREATE TABLE lore_entries (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  novel_id BIGINT UNSIGNED NOT NULL,
  category VARCHAR(32) NOT NULL COMMENT 'artifact|elixir|formation|technique|location|organization|other',
  name VARCHAR(128) NOT NULL,
  description TEXT NOT NULL,
  rules_or_limits TEXT NULL,
  tags VARCHAR(255) NULL COMMENT 'comma separated tags for MVP',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_lore_entries_novel_id (novel_id),
  KEY idx_lore_entries_novel_category (novel_id, category),
  CONSTRAINT fk_lore_entries_novel_id
    FOREIGN KEY (novel_id) REFERENCES novels(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE lore_entry_characters (
  lore_entry_id BIGINT UNSIGNED NOT NULL,
  character_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (lore_entry_id, character_id),
  KEY idx_lec_character_id (character_id),
  CONSTRAINT fk_lec_lore_entry_id
    FOREIGN KEY (lore_entry_id) REFERENCES lore_entries(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_lec_character_id
    FOREIGN KEY (character_id) REFERENCES characters(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
