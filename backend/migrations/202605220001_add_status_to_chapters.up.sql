ALTER TABLE chapters
  ADD COLUMN status VARCHAR(16) NOT NULL DEFAULT 'draft' AFTER summary;

