package usecase

import (
	"context"
	"database/sql"
	"errors"
	"strings"

	"novel-agent/backend/internal/domain"
	"novel-agent/backend/internal/repository"
)

var ErrCharacterNotFound = errors.New("character not found")

type CharacterUsecase struct {
	characters *repository.CharacterRepository
}

func NewCharacterUsecase(characters *repository.CharacterRepository) *CharacterUsecase {
	return &CharacterUsecase{characters: characters}
}

func (u *CharacterUsecase) Create(ctx context.Context, userID, novelID int64, in *domain.Character) (*domain.Character, error) {
	in.NovelID = novelID
	in.Name = strings.TrimSpace(in.Name)
	if in.Name == "" {
		return nil, errors.New("name is required")
	}

	c, err := u.characters.Create(ctx, userID, in)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrCharacterNotFound
		}
		return nil, err
	}
	return c, nil
}

func (u *CharacterUsecase) List(ctx context.Context, userID, novelID int64) ([]domain.Character, error) {
	return u.characters.ListByNovel(ctx, userID, novelID)
}

func (u *CharacterUsecase) Get(ctx context.Context, userID, novelID, id int64) (*domain.Character, error) {
	c, err := u.characters.GetByID(ctx, userID, novelID, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrCharacterNotFound
		}
		return nil, err
	}
	return c, nil
}

func (u *CharacterUsecase) Update(ctx context.Context, userID, novelID, id int64, in *domain.Character) (*domain.Character, error) {
	in.Name = strings.TrimSpace(in.Name)
	if in.Name == "" {
		return nil, errors.New("name is required")
	}

	c, err := u.characters.Update(ctx, userID, novelID, id, in)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrCharacterNotFound
		}
		return nil, err
	}
	return c, nil
}

func (u *CharacterUsecase) Delete(ctx context.Context, userID, novelID, id int64) error {
	err := u.characters.Delete(ctx, userID, novelID, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrCharacterNotFound
		}
		return err
	}
	return nil
}
