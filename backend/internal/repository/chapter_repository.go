package repository

import (
	"context"
	"database/sql"
	"strings"

	"novel-agent/backend/internal/domain"
)

type ChapterRepository struct {
	db *sql.DB
}

func NewChapterRepository(db *sql.DB) *ChapterRepository {
	return &ChapterRepository{db: db}
}

func (r *ChapterRepository) Create(ctx context.Context, userID int64, c *domain.Chapter) (*domain.Chapter, error) {
	status := normalizeChapterStatus(c.Status)
	res, err := r.db.ExecContext(ctx, `
		INSERT INTO chapters (
			novel_id, volume_id, chapter_number, title, body, word_count, generation_instruction, outline, summary, status
		)
		SELECT ?, v.id, ?, ?, ?, ?, ?, ?, ?, ?
		FROM novels
		JOIN volumes v ON v.id = ? AND v.novel_id = novels.id
		WHERE novels.id = ? AND novels.user_id = ?
	`, c.NovelID, c.ChapterNumber, c.Title, c.Body, c.WordCount, c.GenerationInstruction, c.Outline, c.Summary, status, c.VolumeID, c.NovelID, userID)
	if err != nil {
		return nil, err
	}

	affected, err := res.RowsAffected()
	if err != nil {
		return nil, err
	}
	if affected == 0 {
		return nil, sql.ErrNoRows
	}

	id, err := res.LastInsertId()
	if err != nil {
		return nil, err
	}

	return r.GetByID(ctx, userID, c.NovelID, id)
}

func (r *ChapterRepository) ListByNovel(ctx context.Context, userID, novelID int64) ([]domain.Chapter, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT c.id, c.novel_id, c.volume_id, c.chapter_number, c.title, c.body, c.word_count,
			c.generation_instruction, c.outline, c.summary, c.status, c.created_at, c.updated_at
		FROM chapters c
		JOIN novels n ON n.id = c.novel_id
		WHERE c.novel_id = ? AND n.user_id = ?
		ORDER BY c.chapter_number ASC, c.id ASC
	`, novelID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	chapters := make([]domain.Chapter, 0)
	for rows.Next() {
		var c domain.Chapter
		if err := rows.Scan(
			&c.ID, &c.NovelID, &c.VolumeID, &c.ChapterNumber, &c.Title, &c.Body, &c.WordCount,
			&c.GenerationInstruction, &c.Outline, &c.Summary, &c.Status, &c.CreatedAt, &c.UpdatedAt,
		); err != nil {
			return nil, err
		}
		chapters = append(chapters, c)
	}

	return chapters, rows.Err()
}

func (r *ChapterRepository) GetByID(ctx context.Context, userID, novelID, id int64) (*domain.Chapter, error) {
	var c domain.Chapter
	err := r.db.QueryRowContext(ctx, `
		SELECT c.id, c.novel_id, c.volume_id, c.chapter_number, c.title, c.body, c.word_count,
			c.generation_instruction, c.outline, c.summary, c.status, c.created_at, c.updated_at
		FROM chapters c
		JOIN novels n ON n.id = c.novel_id
		WHERE c.id = ? AND c.novel_id = ? AND n.user_id = ?
	`, id, novelID, userID).Scan(
		&c.ID, &c.NovelID, &c.VolumeID, &c.ChapterNumber, &c.Title, &c.Body, &c.WordCount,
		&c.GenerationInstruction, &c.Outline, &c.Summary, &c.Status, &c.CreatedAt, &c.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &c, nil
}

func (r *ChapterRepository) Update(ctx context.Context, userID, novelID, id int64, c *domain.Chapter) (*domain.Chapter, error) {
	status := normalizeChapterStatus(c.Status)
	res, err := r.db.ExecContext(ctx, `
		UPDATE chapters c
		JOIN novels n ON n.id = c.novel_id
		JOIN volumes v ON v.id = ? AND v.novel_id = c.novel_id
		SET c.volume_id = ?, c.chapter_number = ?, c.title = ?, c.body = ?, c.word_count = ?,
			c.generation_instruction = ?, c.outline = ?, c.summary = ?, c.status = ?
		WHERE c.id = ? AND c.novel_id = ? AND n.user_id = ?
	`, c.VolumeID, c.VolumeID, c.ChapterNumber, c.Title, c.Body, c.WordCount, c.GenerationInstruction, c.Outline, c.Summary, status, id, novelID, userID)
	if err != nil {
		return nil, err
	}

	affected, err := res.RowsAffected()
	if err != nil {
		return nil, err
	}
	if affected == 0 {
		return nil, sql.ErrNoRows
	}

	return r.GetByID(ctx, userID, novelID, id)
}

func (r *ChapterRepository) Delete(ctx context.Context, userID, novelID, id int64) error {
	res, err := r.db.ExecContext(ctx, `
		DELETE c FROM chapters c
		JOIN novels n ON n.id = c.novel_id
		WHERE c.id = ? AND c.novel_id = ? AND n.user_id = ?
	`, id, novelID, userID)
	if err != nil {
		return err
	}

	affected, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if affected == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func normalizeChapterStatus(in string) string {
	switch strings.ToLower(strings.TrimSpace(in)) {
	case "review":
		return "review"
	case "final":
		return "final"
	default:
		return "draft"
	}
}
