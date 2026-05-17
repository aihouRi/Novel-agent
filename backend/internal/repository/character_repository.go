package repository

import (
	"context"
	"database/sql"

	"novel-agent/backend/internal/domain"
)

type CharacterRepository struct {
	db *sql.DB
}

func NewCharacterRepository(db *sql.DB) *CharacterRepository {
	return &CharacterRepository{db: db}
}

func (r *CharacterRepository) Create(ctx context.Context, userID int64, c *domain.Character) (*domain.Character, error) {
	res, err := r.db.ExecContext(ctx, `
		INSERT INTO characters (
			novel_id, name, aliases, role, personality, realm_or_ability, goal,
			relationships, speech_style, first_appearance_chapter, last_appearance_chapter, memo
		)
		SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
		FROM novels
		WHERE id = ? AND user_id = ?
	`, c.NovelID, c.Name, c.Aliases, c.Role, c.Personality, c.RealmOrAbility, c.Goal,
		c.Relationships, c.SpeechStyle, c.FirstAppearanceChapter, c.LastAppearanceChapter, c.Memo,
		c.NovelID, userID)
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

func (r *CharacterRepository) ListByNovel(ctx context.Context, userID, novelID int64) ([]domain.Character, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT c.id, c.novel_id, c.name, c.aliases, c.role, c.personality, c.realm_or_ability,
			c.goal, c.relationships, c.speech_style, c.first_appearance_chapter,
			c.last_appearance_chapter, c.memo, c.created_at, c.updated_at
		FROM characters c
		JOIN novels n ON n.id = c.novel_id
		WHERE c.novel_id = ? AND n.user_id = ?
		ORDER BY c.id DESC
	`, novelID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	characters := make([]domain.Character, 0)
	for rows.Next() {
		var c domain.Character
		if err := rows.Scan(
			&c.ID, &c.NovelID, &c.Name, &c.Aliases, &c.Role, &c.Personality, &c.RealmOrAbility,
			&c.Goal, &c.Relationships, &c.SpeechStyle, &c.FirstAppearanceChapter,
			&c.LastAppearanceChapter, &c.Memo, &c.CreatedAt, &c.UpdatedAt,
		); err != nil {
			return nil, err
		}
		characters = append(characters, c)
	}

	return characters, rows.Err()
}

func (r *CharacterRepository) GetByID(ctx context.Context, userID, novelID, id int64) (*domain.Character, error) {
	var c domain.Character
	err := r.db.QueryRowContext(ctx, `
		SELECT c.id, c.novel_id, c.name, c.aliases, c.role, c.personality, c.realm_or_ability,
			c.goal, c.relationships, c.speech_style, c.first_appearance_chapter,
			c.last_appearance_chapter, c.memo, c.created_at, c.updated_at
		FROM characters c
		JOIN novels n ON n.id = c.novel_id
		WHERE c.id = ? AND c.novel_id = ? AND n.user_id = ?
	`, id, novelID, userID).Scan(
		&c.ID, &c.NovelID, &c.Name, &c.Aliases, &c.Role, &c.Personality, &c.RealmOrAbility,
		&c.Goal, &c.Relationships, &c.SpeechStyle, &c.FirstAppearanceChapter,
		&c.LastAppearanceChapter, &c.Memo, &c.CreatedAt, &c.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &c, nil
}

func (r *CharacterRepository) Update(ctx context.Context, userID, novelID, id int64, c *domain.Character) (*domain.Character, error) {
	res, err := r.db.ExecContext(ctx, `
		UPDATE characters c
		JOIN novels n ON n.id = c.novel_id
		SET c.name = ?, c.aliases = ?, c.role = ?, c.personality = ?, c.realm_or_ability = ?,
			c.goal = ?, c.relationships = ?, c.speech_style = ?,
			c.first_appearance_chapter = ?, c.last_appearance_chapter = ?, c.memo = ?
		WHERE c.id = ? AND c.novel_id = ? AND n.user_id = ?
	`, c.Name, c.Aliases, c.Role, c.Personality, c.RealmOrAbility,
		c.Goal, c.Relationships, c.SpeechStyle,
		c.FirstAppearanceChapter, c.LastAppearanceChapter, c.Memo,
		id, novelID, userID)
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

func (r *CharacterRepository) Delete(ctx context.Context, userID, novelID, id int64) error {
	res, err := r.db.ExecContext(ctx, `
		DELETE c FROM characters c
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
