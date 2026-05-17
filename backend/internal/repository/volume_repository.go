package repository

import (
	"context"
	"database/sql"

	"novel-agent/backend/internal/domain"
)

type VolumeRepository struct {
	db *sql.DB
}

func NewVolumeRepository(db *sql.DB) *VolumeRepository {
	return &VolumeRepository{db: db}
}

func (r *VolumeRepository) Create(ctx context.Context, userID int64, v *domain.Volume) (*domain.Volume, error) {
	res, err := r.db.ExecContext(ctx, `
		INSERT INTO volumes (novel_id, volume_number, title)
		SELECT ?, ?, ?
		FROM novels
		WHERE id = ? AND user_id = ?
	`, v.NovelID, v.VolumeNumber, v.Title, v.NovelID, userID)
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
	return r.GetByID(ctx, userID, v.NovelID, id)
}

func (r *VolumeRepository) ListByNovel(ctx context.Context, userID, novelID int64) ([]domain.Volume, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT v.id, v.novel_id, v.volume_number, v.title, v.created_at, v.updated_at
		FROM volumes v
		JOIN novels n ON n.id = v.novel_id
		WHERE v.novel_id = ? AND n.user_id = ?
		ORDER BY v.volume_number ASC, v.id ASC
	`, novelID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	volumes := make([]domain.Volume, 0)
	for rows.Next() {
		var v domain.Volume
		if err := rows.Scan(&v.ID, &v.NovelID, &v.VolumeNumber, &v.Title, &v.CreatedAt, &v.UpdatedAt); err != nil {
			return nil, err
		}
		volumes = append(volumes, v)
	}
	return volumes, rows.Err()
}

func (r *VolumeRepository) GetByID(ctx context.Context, userID, novelID, id int64) (*domain.Volume, error) {
	var v domain.Volume
	err := r.db.QueryRowContext(ctx, `
		SELECT v.id, v.novel_id, v.volume_number, v.title, v.created_at, v.updated_at
		FROM volumes v
		JOIN novels n ON n.id = v.novel_id
		WHERE v.id = ? AND v.novel_id = ? AND n.user_id = ?
	`, id, novelID, userID).Scan(&v.ID, &v.NovelID, &v.VolumeNumber, &v.Title, &v.CreatedAt, &v.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &v, nil
}

func (r *VolumeRepository) Update(ctx context.Context, userID, novelID, id int64, v *domain.Volume) (*domain.Volume, error) {
	res, err := r.db.ExecContext(ctx, `
		UPDATE volumes v
		JOIN novels n ON n.id = v.novel_id
		SET v.volume_number = ?, v.title = ?
		WHERE v.id = ? AND v.novel_id = ? AND n.user_id = ?
	`, v.VolumeNumber, v.Title, id, novelID, userID)
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

func (r *VolumeRepository) Delete(ctx context.Context, userID, novelID, id int64) error {
	res, err := r.db.ExecContext(ctx, `
		DELETE v FROM volumes v
		JOIN novels n ON n.id = v.novel_id
		WHERE v.id = ? AND v.novel_id = ? AND n.user_id = ?
		  AND NOT EXISTS (SELECT 1 FROM chapters c WHERE c.volume_id = v.id)
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
