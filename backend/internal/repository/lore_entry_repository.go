package repository

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"novel-agent/backend/internal/domain"
)

type LoreEntryRepository struct {
	db *sql.DB
}

func NewLoreEntryRepository(db *sql.DB) *LoreEntryRepository {
	return &LoreEntryRepository{db: db}
}

func (r *LoreEntryRepository) Create(ctx context.Context, userID int64, in *domain.LoreEntry) (*domain.LoreEntry, error) {
	res, err := r.db.ExecContext(ctx, `
		INSERT INTO lore_entries (novel_id, category, name, description, rules_or_limits, tags)
		SELECT ?, ?, ?, ?, ?, ?
		FROM novels
		WHERE id = ? AND user_id = ?
	`, in.NovelID, in.Category, in.Name, in.Description, in.RulesOrLimits, in.Tags, in.NovelID, userID)
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
	if err := r.syncCharacterBindings(ctx, userID, in.NovelID, id, in.CharacterIDs); err != nil {
		return nil, err
	}
	return r.GetByID(ctx, userID, in.NovelID, id)
}

func (r *LoreEntryRepository) ListByNovel(ctx context.Context, userID, novelID int64) ([]domain.LoreEntry, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT le.id, le.novel_id, le.category, le.name, le.description, le.rules_or_limits, le.tags, le.created_at, le.updated_at
		FROM lore_entries le
		JOIN novels n ON n.id = le.novel_id
		WHERE le.novel_id = ? AND n.user_id = ?
		ORDER BY le.id DESC
	`, novelID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	entries := make([]domain.LoreEntry, 0)
	for rows.Next() {
		var e domain.LoreEntry
		if err := rows.Scan(&e.ID, &e.NovelID, &e.Category, &e.Name, &e.Description, &e.RulesOrLimits, &e.Tags, &e.CreatedAt, &e.UpdatedAt); err != nil {
			return nil, err
		}
		ids, err := r.getCharacterIDsByEntry(ctx, userID, novelID, e.ID)
		if err != nil {
			return nil, err
		}
		e.CharacterIDs = ids
		entries = append(entries, e)
	}
	return entries, rows.Err()
}

func (r *LoreEntryRepository) GetByID(ctx context.Context, userID, novelID, id int64) (*domain.LoreEntry, error) {
	var e domain.LoreEntry
	err := r.db.QueryRowContext(ctx, `
		SELECT le.id, le.novel_id, le.category, le.name, le.description, le.rules_or_limits, le.tags, le.created_at, le.updated_at
		FROM lore_entries le
		JOIN novels n ON n.id = le.novel_id
		WHERE le.id = ? AND le.novel_id = ? AND n.user_id = ?
	`, id, novelID, userID).Scan(&e.ID, &e.NovelID, &e.Category, &e.Name, &e.Description, &e.RulesOrLimits, &e.Tags, &e.CreatedAt, &e.UpdatedAt)
	if err != nil {
		return nil, err
	}
	ids, err := r.getCharacterIDsByEntry(ctx, userID, novelID, e.ID)
	if err != nil {
		return nil, err
	}
	e.CharacterIDs = ids
	return &e, nil
}

func (r *LoreEntryRepository) Update(ctx context.Context, userID, novelID, id int64, in *domain.LoreEntry) (*domain.LoreEntry, error) {
	res, err := r.db.ExecContext(ctx, `
		UPDATE lore_entries le
		JOIN novels n ON n.id = le.novel_id
		SET le.category = ?, le.name = ?, le.description = ?, le.rules_or_limits = ?, le.tags = ?
		WHERE le.id = ? AND le.novel_id = ? AND n.user_id = ?
	`, in.Category, in.Name, in.Description, in.RulesOrLimits, in.Tags, id, novelID, userID)
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
	if err := r.syncCharacterBindings(ctx, userID, novelID, id, in.CharacterIDs); err != nil {
		return nil, err
	}
	return r.GetByID(ctx, userID, novelID, id)
}

func (r *LoreEntryRepository) Delete(ctx context.Context, userID, novelID, id int64) error {
	res, err := r.db.ExecContext(ctx, `
		DELETE le FROM lore_entries le
		JOIN novels n ON n.id = le.novel_id
		WHERE le.id = ? AND le.novel_id = ? AND n.user_id = ?
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

func (r *LoreEntryRepository) getCharacterIDsByEntry(ctx context.Context, userID, novelID, entryID int64) ([]int64, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT lec.character_id
		FROM lore_entry_characters lec
		JOIN lore_entries le ON le.id = lec.lore_entry_id
		JOIN novels n ON n.id = le.novel_id
		WHERE lec.lore_entry_id = ? AND le.novel_id = ? AND n.user_id = ?
		ORDER BY lec.character_id ASC
	`, entryID, novelID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	ids := make([]int64, 0)
	for rows.Next() {
		var id int64
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, rows.Err()
}

func (r *LoreEntryRepository) syncCharacterBindings(ctx context.Context, userID, novelID, entryID int64, characterIDs []int64) error {
	if err := r.ensureCharacterIDsBelongToNovel(ctx, userID, novelID, characterIDs); err != nil {
		return err
	}

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx, `DELETE FROM lore_entry_characters WHERE lore_entry_id = ?`, entryID); err != nil {
		return err
	}

	for _, cid := range characterIDs {
		if _, err := tx.ExecContext(ctx, `INSERT INTO lore_entry_characters (lore_entry_id, character_id) VALUES (?, ?)`, entryID, cid); err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (r *LoreEntryRepository) ensureCharacterIDsBelongToNovel(ctx context.Context, userID, novelID int64, ids []int64) error {
	if len(ids) == 0 {
		return nil
	}
	clean := make([]int64, 0, len(ids))
	seen := make(map[int64]bool, len(ids))
	for _, id := range ids {
		if id <= 0 {
			return fmt.Errorf("character_ids contains invalid id")
		}
		if seen[id] {
			continue
		}
		seen[id] = true
		clean = append(clean, id)
	}
	placeholders := strings.TrimSuffix(strings.Repeat("?,", len(clean)), ",")
	args := make([]interface{}, 0, 2+len(clean))
	args = append(args, novelID, userID)
	for _, id := range clean {
		args = append(args, id)
	}

	query := `
		SELECT COUNT(*)
		FROM characters c
		JOIN novels n ON n.id = c.novel_id
		WHERE c.novel_id = ? AND n.user_id = ?
		AND c.id IN (` + placeholders + `)
	`

	var count int
	if err := r.db.QueryRowContext(ctx, query, args...).Scan(&count); err != nil {
		return err
	}
	if count != len(clean) {
		return fmt.Errorf("character_ids contains non-existing character")
	}
	return nil
}
