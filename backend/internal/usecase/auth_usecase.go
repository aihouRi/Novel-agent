package usecase

import (
	"context"
	"database/sql"
	"errors"
	"strings"
	"time"

	"novel-agent/backend/internal/domain"
	"novel-agent/backend/internal/repository"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var ErrInvalidCredentials = errors.New("invalid credentials")

type AuthUsecase struct {
	users     *repository.UserRepository
	jwtSecret string
}

func NewAuthUsecase(users *repository.UserRepository, jwtSecret string) *AuthUsecase {
	return &AuthUsecase{users: users, jwtSecret: jwtSecret}
}

func (u *AuthUsecase) Register(ctx context.Context, name, email, password string) (*domain.User, string, error) {
	name = strings.TrimSpace(name)
	email = strings.TrimSpace(strings.ToLower(email))
	if name == "" || email == "" || password == "" {
		return nil, "", errors.New("name, email and password are required")
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, "", err
	}

	user, err := u.users.Create(ctx, name, email, string(hashed))
	if err != nil {
		return nil, "", err
	}

	token, err := u.issueToken(user.ID)
	if err != nil {
		return nil, "", err
	}

	return user, token, nil
}

func (u *AuthUsecase) Login(ctx context.Context, email, password string) (*domain.User, string, error) {
	email = strings.TrimSpace(strings.ToLower(email))
	if email == "" || password == "" {
		return nil, "", ErrInvalidCredentials
	}

	user, err := u.users.GetByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, "", ErrInvalidCredentials
		}
		return nil, "", err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, "", ErrInvalidCredentials
	}

	token, err := u.issueToken(user.ID)
	if err != nil {
		return nil, "", err
	}

	return user, token, nil
}

func (u *AuthUsecase) GetMe(ctx context.Context, userID int64) (*domain.User, error) {
	return u.users.GetByID(ctx, userID)
}

func (u *AuthUsecase) issueToken(userID int64) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
		"iat":     time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(u.jwtSecret))
}
