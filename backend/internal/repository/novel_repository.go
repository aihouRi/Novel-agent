package repository

import (
	"context"
	"database/sql"

	"novel-agent/backend/internal/domain"
)

type NovelRepository struct {
	db *sql.DB
}

func NewNovelRepository(db *sql.DB) *NovelRepository {
	return &NovelRepository{db: db}
}

func (r *NovelRepository) Create(ctx context.Context, n *domain.Novel) (*domain.Novel, error) {
	res, err := r.db.ExecContext(ctx, `
		INSERT INTO novels (
			user_id, title, genre, language, style_profile, worldview,
			power_system, main_plot, writing_rules, forbidden_rules, recent_chapter_count
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, n.UserID, n.Title, n.Genre, n.Language, n.StyleProfile, n.Worldview,
		n.PowerSystem, n.MainPlot, n.WritingRules, n.ForbiddenRules, n.RecentChapterCount)
	if err != nil {
		return nil, err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return nil, err
	}

	return r.GetByID(ctx, id, n.UserID)
}

func (r *NovelRepository) ListByUserID(ctx context.Context, userID int64) ([]domain.Novel, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, user_id, title, genre, language, style_profile, worldview,
			power_system, main_plot, writing_rules, forbidden_rules, recent_chapter_count,
			created_at, updated_at
		FROM novels
		WHERE user_id = ?
		ORDER BY id DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	novels := make([]domain.Novel, 0)
	for rows.Next() {
		var n domain.Novel
		if err := rows.Scan(
			&n.ID, &n.UserID, &n.Title, &n.Genre, &n.Language, &n.StyleProfile, &n.Worldview,
			&n.PowerSystem, &n.MainPlot, &n.WritingRules, &n.ForbiddenRules, &n.RecentChapterCount,
			&n.CreatedAt, &n.UpdatedAt,
		); err != nil {
			return nil, err
		}
		novels = append(novels, n)
	}

	return novels, rows.Err()
}

func (r *NovelRepository) GetByID(ctx context.Context, id, userID int64) (*domain.Novel, error) {
	var n domain.Novel
	err := r.db.QueryRowContext(ctx, `
		SELECT id, user_id, title, genre, language, style_profile, worldview,
			power_system, main_plot, writing_rules, forbidden_rules, recent_chapter_count,
			created_at, updated_at
		FROM novels
		WHERE id = ? AND user_id = ?
	`, id, userID).Scan(
		&n.ID, &n.UserID, &n.Title, &n.Genre, &n.Language, &n.StyleProfile, &n.Worldview,
		&n.PowerSystem, &n.MainPlot, &n.WritingRules, &n.ForbiddenRules, &n.RecentChapterCount,
		&n.CreatedAt, &n.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &n, nil
}

func (r *NovelRepository) Update(ctx context.Context, id, userID int64, n *domain.Novel) (*domain.Novel, error) {
	_, err := r.db.ExecContext(ctx, `
		UPDATE novels
		SET title = ?, genre = ?, language = ?, style_profile = ?, worldview = ?,
			power_system = ?, main_plot = ?, writing_rules = ?, forbidden_rules = ?,
			recent_chapter_count = ?
		WHERE id = ? AND user_id = ?
	`, n.Title, n.Genre, n.Language, n.StyleProfile, n.Worldview,
		n.PowerSystem, n.MainPlot, n.WritingRules, n.ForbiddenRules, n.RecentChapterCount,
		id, userID)
	if err != nil {
		return nil, err
	}

	return r.GetByID(ctx, id, userID)
}

func (r *NovelRepository) Delete(ctx context.Context, id, userID int64) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM novels WHERE id = ? AND user_id = ?`, id, userID)
	return err
}
