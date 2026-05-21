package usecase

import (
	"context"
	"database/sql"
	"strings"

	"novel-agent/backend/internal/domain"
	"novel-agent/backend/internal/repository"
	"novel-agent/backend/internal/service"
)

type UserAISettingUsecase struct {
	repo           *repository.UserAISettingRepository
	crypto         *service.SecretCrypto
	defaultBaseURL string
	defaultModel   string
}

func NewUserAISettingUsecase(
	repo *repository.UserAISettingRepository,
	crypto *service.SecretCrypto,
	defaultBaseURL string,
	defaultModel string,
) *UserAISettingUsecase {
	return &UserAISettingUsecase{
		repo:           repo,
		crypto:         crypto,
		defaultBaseURL: strings.TrimSpace(defaultBaseURL),
		defaultModel:   strings.TrimSpace(defaultModel),
	}
}

type UpsertUserAISettingInput struct {
	OpenAIAPIKey  string
	OpenAIBaseURL string
	OpenAIModel   string
}

type EffectiveOpenAIConfig struct {
	APIKey   string
	BaseURL  string
	Model    string
	FromUser bool
}

func (u *UserAISettingUsecase) Get(ctx context.Context, userID int64) (*domain.UserAISetting, error) {
	row, err := u.repo.GetByUserID(ctx, userID)
	if err != nil {
		if err == sql.ErrNoRows {
			return &domain.UserAISetting{
				UserID:             userID,
				OpenAIAPIKeyMasked: "",
				HasOpenAIAPIKey:    false,
				OpenAIBaseURL:      u.defaultBaseURL,
				OpenAIModel:        u.defaultModel,
			}, nil
		}
		return nil, err
	}

	key, err := u.crypto.Decrypt(row.OpenAIAPIKeyEncrypted)
	if err != nil {
		return nil, err
	}

	return &domain.UserAISetting{
		UserID:             userID,
		OpenAIAPIKeyMasked: maskAPIKey(key),
		HasOpenAIAPIKey:    strings.TrimSpace(key) != "",
		OpenAIBaseURL:      row.OpenAIBaseURL,
		OpenAIModel:        row.OpenAIModel,
	}, nil
}

func (u *UserAISettingUsecase) Upsert(ctx context.Context, userID int64, in UpsertUserAISettingInput) (*domain.UserAISetting, error) {
	baseURL := strings.TrimSpace(in.OpenAIBaseURL)
	model := strings.TrimSpace(in.OpenAIModel)
	apiKey := strings.TrimSpace(in.OpenAIAPIKey)
	hasAPIKey := apiKey != ""

	if baseURL == "" {
		baseURL = u.defaultBaseURL
	}
	if model == "" {
		model = u.defaultModel
	}
	if !hasAPIKey {
		existing, err := u.repo.GetByUserID(ctx, userID)
		if err == nil {
			if decrypted, decErr := u.crypto.Decrypt(existing.OpenAIAPIKeyEncrypted); decErr == nil {
				apiKey = strings.TrimSpace(decrypted)
				hasAPIKey = apiKey != ""
			}
		}
	}

	encrypted, err := u.crypto.Encrypt(apiKey)
	if err != nil {
		return nil, err
	}

	if err := u.repo.Upsert(ctx, repository.UserAISettingRow{
		UserID:                userID,
		OpenAIAPIKeyEncrypted: encrypted,
		OpenAIBaseURL:         baseURL,
		OpenAIModel:           model,
	}); err != nil {
		return nil, err
	}

	return &domain.UserAISetting{
		UserID:             userID,
		OpenAIAPIKeyMasked: maskAPIKey(apiKey),
		HasOpenAIAPIKey:    hasAPIKey,
		OpenAIBaseURL:      baseURL,
		OpenAIModel:        model,
	}, nil
}

func (u *UserAISettingUsecase) ResolveEffectiveConfig(ctx context.Context, userID int64, fallbackAPIKey string) (EffectiveOpenAIConfig, error) {
	row, err := u.repo.GetByUserID(ctx, userID)
	if err != nil {
		if err == sql.ErrNoRows {
			return EffectiveOpenAIConfig{
				APIKey:   strings.TrimSpace(fallbackAPIKey),
				BaseURL:  u.defaultBaseURL,
				Model:    u.defaultModel,
				FromUser: false,
			}, nil
		}
		return EffectiveOpenAIConfig{}, err
	}

	key, err := u.crypto.Decrypt(row.OpenAIAPIKeyEncrypted)
	if err != nil {
		return EffectiveOpenAIConfig{}, err
	}
	key = strings.TrimSpace(key)
	if key == "" {
		key = strings.TrimSpace(fallbackAPIKey)
	}

	return EffectiveOpenAIConfig{
		APIKey:   key,
		BaseURL:  strings.TrimSpace(row.OpenAIBaseURL),
		Model:    strings.TrimSpace(row.OpenAIModel),
		FromUser: true,
	}, nil
}

func maskAPIKey(key string) string {
	k := strings.TrimSpace(key)
	if k == "" {
		return ""
	}
	if len(k) <= 8 {
		return "****"
	}
	return k[:4] + "****" + k[len(k)-4:]
}
