package usecase

import (
	"context"
	"database/sql"
	"errors"
	"strings"

	"novel-agent/backend/internal/domain"
	"novel-agent/backend/internal/repository"
)

var ErrLoreEntryNotFound = errors.New("lore entry not found")

var allowedLoreCategories = map[string]bool{
	"artifact":     true,
	"elixir":       true,
	"formation":    true,
	"technique":    true,
	"location":     true,
	"organization": true,
	"other":        true,
}

type LoreEntryUsecase struct {
	repo *repository.LoreEntryRepository
}

func NewLoreEntryUsecase(repo *repository.LoreEntryRepository) *LoreEntryUsecase {
	return &LoreEntryUsecase{repo: repo}
}

func (u *LoreEntryUsecase) Create(ctx context.Context, userID, novelID int64, in *domain.LoreEntry) (*domain.LoreEntry, error) {
	in.NovelID = novelID
	sanitizeLoreEntry(in)
	if err := validateLoreEntry(in); err != nil {
		return nil, err
	}

	entry, err := u.repo.Create(ctx, userID, in)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrLoreEntryNotFound
		}
		return nil, err
	}
	return entry, nil
}

func (u *LoreEntryUsecase) List(ctx context.Context, userID, novelID int64) ([]domain.LoreEntry, error) {
	return u.repo.ListByNovel(ctx, userID, novelID)
}

func (u *LoreEntryUsecase) Get(ctx context.Context, userID, novelID, id int64) (*domain.LoreEntry, error) {
	entry, err := u.repo.GetByID(ctx, userID, novelID, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrLoreEntryNotFound
		}
		return nil, err
	}
	return entry, nil
}

func (u *LoreEntryUsecase) Update(ctx context.Context, userID, novelID, id int64, in *domain.LoreEntry) (*domain.LoreEntry, error) {
	sanitizeLoreEntry(in)
	if err := validateLoreEntry(in); err != nil {
		return nil, err
	}

	entry, err := u.repo.Update(ctx, userID, novelID, id, in)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrLoreEntryNotFound
		}
		return nil, err
	}
	return entry, nil
}

func (u *LoreEntryUsecase) Delete(ctx context.Context, userID, novelID, id int64) error {
	err := u.repo.Delete(ctx, userID, novelID, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrLoreEntryNotFound
		}
		return err
	}
	return nil
}

func sanitizeLoreEntry(in *domain.LoreEntry) {
	in.Category = strings.TrimSpace(strings.ToLower(in.Category))
	in.Name = strings.TrimSpace(in.Name)
	in.Description = strings.TrimSpace(in.Description)
	in.RulesOrLimits = strings.TrimSpace(in.RulesOrLimits)
	in.Tags = strings.TrimSpace(in.Tags)
}

func validateLoreEntry(in *domain.LoreEntry) error {
	if in.Category == "" {
		return errors.New("category is required")
	}
	if !allowedLoreCategories[in.Category] {
		return errors.New("category is invalid")
	}
	if in.Name == "" {
		return errors.New("name is required")
	}
	if in.Description == "" {
		return errors.New("description is required")
	}
	return nil
}
