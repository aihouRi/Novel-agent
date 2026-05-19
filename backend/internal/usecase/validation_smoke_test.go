package usecase

import (
	"context"
	"errors"
	"testing"

	"novel-agent/backend/internal/domain"
)

func TestAuthUsecaseValidation(t *testing.T) {
	u := &AuthUsecase{}

	if _, _, err := u.Register(context.Background(), "", "", ""); err == nil {
		t.Fatal("expected register validation error")
	}

	if _, _, err := u.Login(context.Background(), "", ""); !errors.Is(err, ErrInvalidCredentials) {
		t.Fatalf("expected ErrInvalidCredentials, got %v", err)
	}
}

func TestNovelUsecaseValidation(t *testing.T) {
	u := &NovelUsecase{}
	_, err := u.Create(context.Background(), 1, &domain.Novel{Title: "   "})
	if err == nil || err.Error() != "title is required" {
		t.Fatalf("expected title is required, got %v", err)
	}
}

func TestCharacterUsecaseValidation(t *testing.T) {
	u := &CharacterUsecase{}

	_, err := u.Create(context.Background(), 1, 1, &domain.Character{Name: "   ", ImportanceLevel: 1})
	if err == nil || err.Error() != "name is required" {
		t.Fatalf("expected name is required, got %v", err)
	}

	_, err = u.Create(context.Background(), 1, 1, &domain.Character{Name: "A", ImportanceLevel: 10})
	if err == nil || err.Error() != "importance_level must be between 0 and 9" {
		t.Fatalf("expected importance level validation error, got %v", err)
	}
}

func TestVolumeUsecaseValidation(t *testing.T) {
	u := &VolumeUsecase{}

	_, err := u.Create(context.Background(), 1, 1, &domain.Volume{VolumeNumber: 0, Title: "v"})
	if err == nil || err.Error() != "volume_number must be greater than 0" {
		t.Fatalf("expected volume number validation error, got %v", err)
	}

	_, err = u.Create(context.Background(), 1, 1, &domain.Volume{VolumeNumber: 1, Title: "   "})
	if err == nil || err.Error() != "title is required" {
		t.Fatalf("expected title required error, got %v", err)
	}
}

func TestChapterUsecaseValidationAndWordCount(t *testing.T) {
	u := &ChapterUsecase{}

	_, err := u.Create(context.Background(), 1, 1, &domain.Chapter{ChapterNumber: 0, VolumeID: 1, Body: "a"})
	if err == nil || err.Error() != "chapter_number must be greater than 0" {
		t.Fatalf("expected chapter number validation error, got %v", err)
	}

	_, err = u.Create(context.Background(), 1, 1, &domain.Chapter{ChapterNumber: 1, VolumeID: 0, Body: "a"})
	if err == nil || err.Error() != "volume_id is required" {
		t.Fatalf("expected volume id validation error, got %v", err)
	}

	got := countNonSpaceChars(" a b\n\t中 文  ")
	if got != 4 {
		t.Fatalf("expected non-space count 4, got %d", got)
	}
}
