package repository

import (
	"context"
	"database/sql"
	"errors"
	"strings"

	"novel-agent/backend/internal/domain"
)

var ErrUserAlreadyExists = errors.New("user already exists")

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(ctx context.Context, name, email, passwordHash string) (*domain.User, error) {
	res, err := r.db.ExecContext(ctx, `
		INSERT INTO users (name, email, password_hash)
		VALUES (?, ?, ?)
	`, name, email, passwordHash)
	if err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "duplicate") {
			return nil, ErrUserAlreadyExists
		}
		return nil, err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return nil, err
	}

	return r.GetByID(ctx, id)
}

func (r *UserRepository) GetByID(ctx context.Context, id int64) (*domain.User, error) {
	var u domain.User
	err := r.db.QueryRowContext(ctx, `
		SELECT id, name, email, password_hash, created_at, updated_at
		FROM users
		WHERE id = ?
	`, id).Scan(&u.ID, &u.Name, &u.Email, &u.PasswordHash, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	var u domain.User
	err := r.db.QueryRowContext(ctx, `
		SELECT id, name, email, password_hash, created_at, updated_at
		FROM users
		WHERE email = ?
	`, email).Scan(&u.ID, &u.Name, &u.Email, &u.PasswordHash, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &u, nil
}
