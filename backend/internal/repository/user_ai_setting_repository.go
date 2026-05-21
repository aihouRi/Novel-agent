package repository

import (
	"context"
	"database/sql"
)

type UserAISettingRow struct {
	UserID                 int64
	OpenAIAPIKeyEncrypted  string
	OpenAIBaseURL          string
	OpenAIModel            string
}

type UserAISettingRepository struct {
	db *sql.DB
}

func NewUserAISettingRepository(db *sql.DB) *UserAISettingRepository {
	return &UserAISettingRepository{db: db}
}

func (r *UserAISettingRepository) GetByUserID(ctx context.Context, userID int64) (*UserAISettingRow, error) {
	var row UserAISettingRow
	err := r.db.QueryRowContext(ctx, `
		SELECT user_id, openai_api_key_encrypted, openai_base_url, openai_model
		FROM user_ai_settings
		WHERE user_id = ?
	`, userID).Scan(&row.UserID, &row.OpenAIAPIKeyEncrypted, &row.OpenAIBaseURL, &row.OpenAIModel)
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *UserAISettingRepository) Upsert(ctx context.Context, row UserAISettingRow) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO user_ai_settings (user_id, openai_api_key_encrypted, openai_base_url, openai_model)
		VALUES (?, ?, ?, ?)
		ON DUPLICATE KEY UPDATE
			openai_api_key_encrypted = VALUES(openai_api_key_encrypted),
			openai_base_url = VALUES(openai_base_url),
			openai_model = VALUES(openai_model)
	`, row.UserID, row.OpenAIAPIKeyEncrypted, row.OpenAIBaseURL, row.OpenAIModel)
	return err
}
