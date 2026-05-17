package usecase

import (
	"context"
	"database/sql"
	"errors"
	"strings"

	"novel-agent/backend/internal/domain"
	"novel-agent/backend/internal/repository"
)

var ErrVolumeNotFound = errors.New("volume not found")

type VolumeUsecase struct {
	volumes *repository.VolumeRepository
}

func NewVolumeUsecase(volumes *repository.VolumeRepository) *VolumeUsecase {
	return &VolumeUsecase{volumes: volumes}
}

func (u *VolumeUsecase) Create(ctx context.Context, userID, novelID int64, in *domain.Volume) (*domain.Volume, error) {
	in.NovelID = novelID
	in.Title = strings.TrimSpace(in.Title)
	if in.VolumeNumber <= 0 {
		return nil, errors.New("volume_number must be greater than 0")
	}
	if in.Title == "" {
		return nil, errors.New("title is required")
	}
	v, err := u.volumes.Create(ctx, userID, in)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrVolumeNotFound
		}
		return nil, err
	}
	return v, nil
}

func (u *VolumeUsecase) List(ctx context.Context, userID, novelID int64) ([]domain.Volume, error) {
	return u.volumes.ListByNovel(ctx, userID, novelID)
}

func (u *VolumeUsecase) Update(ctx context.Context, userID, novelID, id int64, in *domain.Volume) (*domain.Volume, error) {
	in.Title = strings.TrimSpace(in.Title)
	if in.VolumeNumber <= 0 {
		return nil, errors.New("volume_number must be greater than 0")
	}
	if in.Title == "" {
		return nil, errors.New("title is required")
	}
	v, err := u.volumes.Update(ctx, userID, novelID, id, in)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrVolumeNotFound
		}
		return nil, err
	}
	return v, nil
}

func (u *VolumeUsecase) Delete(ctx context.Context, userID, novelID, id int64) error {
	err := u.volumes.Delete(ctx, userID, novelID, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrVolumeNotFound
		}
		return err
	}
	return nil
}
