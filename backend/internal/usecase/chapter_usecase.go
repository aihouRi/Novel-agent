package usecase

import (
	"context"
	"database/sql"
	"errors"
	"strings"

	"novel-agent/backend/internal/domain"
	"novel-agent/backend/internal/repository"
)

var ErrChapterNotFound = errors.New("chapter not found")

type ChapterUsecase struct {
	chapters *repository.ChapterRepository
}

func NewChapterUsecase(chapters *repository.ChapterRepository) *ChapterUsecase {
	return &ChapterUsecase{chapters: chapters}
}

func (u *ChapterUsecase) Create(ctx context.Context, userID, novelID int64, in *domain.Chapter) (*domain.Chapter, error) {
	in.NovelID = novelID
	in.Title = strings.TrimSpace(in.Title)
	in.GenerationInstruction = strings.TrimSpace(in.GenerationInstruction)
	in.Outline = strings.TrimSpace(in.Outline)
	in.Body = strings.TrimSpace(in.Body)
	in.Summary = strings.TrimSpace(in.Summary)

	if in.ChapterNumber <= 0 {
		return nil, errors.New("chapter_number must be greater than 0")
	}
	if in.WordCount < 0 {
		return nil, errors.New("word_count cannot be negative")
	}

	chapter, err := u.chapters.Create(ctx, userID, in)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrChapterNotFound
		}
		return nil, err
	}
	return chapter, nil
}

func (u *ChapterUsecase) List(ctx context.Context, userID, novelID int64) ([]domain.Chapter, error) {
	return u.chapters.ListByNovel(ctx, userID, novelID)
}

func (u *ChapterUsecase) Get(ctx context.Context, userID, novelID, id int64) (*domain.Chapter, error) {
	chapter, err := u.chapters.GetByID(ctx, userID, novelID, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrChapterNotFound
		}
		return nil, err
	}
	return chapter, nil
}

func (u *ChapterUsecase) Update(ctx context.Context, userID, novelID, id int64, in *domain.Chapter) (*domain.Chapter, error) {
	in.Title = strings.TrimSpace(in.Title)
	in.GenerationInstruction = strings.TrimSpace(in.GenerationInstruction)
	in.Outline = strings.TrimSpace(in.Outline)
	in.Body = strings.TrimSpace(in.Body)
	in.Summary = strings.TrimSpace(in.Summary)

	if in.ChapterNumber <= 0 {
		return nil, errors.New("chapter_number must be greater than 0")
	}
	if in.WordCount < 0 {
		return nil, errors.New("word_count cannot be negative")
	}

	chapter, err := u.chapters.Update(ctx, userID, novelID, id, in)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrChapterNotFound
		}
		return nil, err
	}
	return chapter, nil
}

func (u *ChapterUsecase) Delete(ctx context.Context, userID, novelID, id int64) error {
	err := u.chapters.Delete(ctx, userID, novelID, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrChapterNotFound
		}
		return err
	}
	return nil
}
