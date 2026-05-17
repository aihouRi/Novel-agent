package usecase

import (
	"context"
	"database/sql"
	"errors"
	"strings"

	"novel-agent/backend/internal/domain"
	"novel-agent/backend/internal/repository"
)

var ErrNovelNotFound = errors.New("novel not found")

type NovelUsecase struct {
	novels *repository.NovelRepository
}

func NewNovelUsecase(novels *repository.NovelRepository) *NovelUsecase {
	return &NovelUsecase{novels: novels}
}

func (u *NovelUsecase) Create(ctx context.Context, userID int64, in *domain.Novel) (*domain.Novel, error) {
	in.UserID = userID
	in.Title = strings.TrimSpace(in.Title)
	if in.Title == "" {
		return nil, errors.New("title is required")
	}
	if in.RecentChapterCount <= 0 {
		in.RecentChapterCount = 3
	}
	return u.novels.Create(ctx, in)
}

func (u *NovelUsecase) List(ctx context.Context, userID int64) ([]domain.Novel, error) {
	return u.novels.ListByUserID(ctx, userID)
}

func (u *NovelUsecase) Get(ctx context.Context, id, userID int64) (*domain.Novel, error) {
	n, err := u.novels.GetByID(ctx, id, userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNovelNotFound
		}
		return nil, err
	}
	return n, nil
}

func (u *NovelUsecase) Update(ctx context.Context, id, userID int64, in *domain.Novel) (*domain.Novel, error) {
	if _, err := u.Get(ctx, id, userID); err != nil {
		return nil, err
	}

	in.Title = strings.TrimSpace(in.Title)
	if in.Title == "" {
		return nil, errors.New("title is required")
	}
	if in.RecentChapterCount <= 0 {
		in.RecentChapterCount = 3
	}

	return u.novels.Update(ctx, id, userID, in)
}

func (u *NovelUsecase) Delete(ctx context.Context, id, userID int64) error {
	if _, err := u.Get(ctx, id, userID); err != nil {
		return err
	}
	return u.novels.Delete(ctx, id, userID)
}
