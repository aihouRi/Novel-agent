package usecase

import (
	"context"
	"database/sql"
	"strings"

	"novel-agent/backend/internal/domain"
	"novel-agent/backend/internal/repository"
	"novel-agent/backend/internal/service"
)

const (
	AIProviderOpenAI = "openai"
	AIProviderGemini = "gemini"
)

type UserAISettingUsecase struct {
	repo               *repository.UserAISettingRepository
	crypto             *service.SecretCrypto
	defaultOpenAIBase  string
	defaultOpenAIModel string
	defaultGeminiBase  string
	defaultGeminiModel string
}

func NewUserAISettingUsecase(
	repo *repository.UserAISettingRepository,
	crypto *service.SecretCrypto,
	defaultOpenAIBase string,
	defaultOpenAIModel string,
	defaultGeminiBase string,
	defaultGeminiModel string,
) *UserAISettingUsecase {
	return &UserAISettingUsecase{
		repo:               repo,
		crypto:             crypto,
		defaultOpenAIBase:  strings.TrimSpace(defaultOpenAIBase),
		defaultOpenAIModel: strings.TrimSpace(defaultOpenAIModel),
		defaultGeminiBase:  strings.TrimSpace(defaultGeminiBase),
		defaultGeminiModel: strings.TrimSpace(defaultGeminiModel),
	}
}

type UpsertUserAISettingInput struct {
	Provider      string
	OpenAIAPIKey  string
	OpenAIBaseURL string
	OpenAIModel   string
	GeminiAPIKey  string
	GeminiBaseURL string
	GeminiModel   string
}

type EffectiveAIConfig struct {
	Provider string
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
				UserID:        userID,
				Provider:      AIProviderOpenAI,
				OpenAIBaseURL: u.defaultOpenAIBase,
				OpenAIModel:   u.defaultOpenAIModel,
				GeminiBaseURL: u.defaultGeminiBase,
				GeminiModel:   u.defaultGeminiModel,
			}, nil
		}
		return nil, err
	}
	openAIKey, err := u.crypto.Decrypt(row.OpenAIAPIKeyEncrypted)
	if err != nil {
		openAIKey = ""
	}
	geminiKey, err := u.crypto.Decrypt(row.GeminiAPIKeyEncrypted)
	if err != nil {
		geminiKey = ""
	}
	provider := normalizeProvider(row.Provider)
	return &domain.UserAISetting{
		UserID:             userID,
		Provider:           provider,
		OpenAIAPIKeyMasked: maskAPIKey(openAIKey),
		HasOpenAIAPIKey:    strings.TrimSpace(openAIKey) != "",
		OpenAIBaseURL:      pickNonEmpty(row.OpenAIBaseURL, u.defaultOpenAIBase),
		OpenAIModel:        pickNonEmpty(row.OpenAIModel, u.defaultOpenAIModel),
		GeminiAPIKeyMasked: maskAPIKey(geminiKey),
		HasGeminiAPIKey:    strings.TrimSpace(geminiKey) != "",
		GeminiBaseURL:      pickNonEmpty(row.GeminiBaseURL, u.defaultGeminiBase),
		GeminiModel:        pickNonEmpty(row.GeminiModel, u.defaultGeminiModel),
	}, nil
}

func (u *UserAISettingUsecase) Upsert(ctx context.Context, userID int64, in UpsertUserAISettingInput) (*domain.UserAISetting, error) {
	provider := normalizeProvider(in.Provider)
	openAIBase := pickNonEmpty(strings.TrimSpace(in.OpenAIBaseURL), u.defaultOpenAIBase)
	openAIModel := pickNonEmpty(strings.TrimSpace(in.OpenAIModel), u.defaultOpenAIModel)
	geminiBase := pickNonEmpty(strings.TrimSpace(in.GeminiBaseURL), u.defaultGeminiBase)
	geminiModel := pickNonEmpty(strings.TrimSpace(in.GeminiModel), u.defaultGeminiModel)

	openAIKey := strings.TrimSpace(in.OpenAIAPIKey)
	geminiKey := strings.TrimSpace(in.GeminiAPIKey)

	existing, err := u.repo.GetByUserID(ctx, userID)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	if existing != nil {
		if openAIKey == "" {
			if decrypted, decErr := u.crypto.Decrypt(existing.OpenAIAPIKeyEncrypted); decErr == nil {
				openAIKey = strings.TrimSpace(decrypted)
			}
		}
		if geminiKey == "" {
			if decrypted, decErr := u.crypto.Decrypt(existing.GeminiAPIKeyEncrypted); decErr == nil {
				geminiKey = strings.TrimSpace(decrypted)
			}
		}
	}

	openAIEncrypted, err := u.crypto.Encrypt(openAIKey)
	if err != nil {
		return nil, err
	}
	geminiEncrypted, err := u.crypto.Encrypt(geminiKey)
	if err != nil {
		return nil, err
	}

	if err := u.repo.Upsert(ctx, repository.UserAISettingRow{
		UserID:                userID,
		Provider:              provider,
		OpenAIAPIKeyEncrypted: openAIEncrypted,
		OpenAIBaseURL:         openAIBase,
		OpenAIModel:           openAIModel,
		GeminiAPIKeyEncrypted: geminiEncrypted,
		GeminiBaseURL:         geminiBase,
		GeminiModel:           geminiModel,
	}); err != nil {
		return nil, err
	}

	return &domain.UserAISetting{
		UserID:             userID,
		Provider:           provider,
		OpenAIAPIKeyMasked: maskAPIKey(openAIKey),
		HasOpenAIAPIKey:    openAIKey != "",
		OpenAIBaseURL:      openAIBase,
		OpenAIModel:        openAIModel,
		GeminiAPIKeyMasked: maskAPIKey(geminiKey),
		HasGeminiAPIKey:    geminiKey != "",
		GeminiBaseURL:      geminiBase,
		GeminiModel:        geminiModel,
	}, nil
}

func (u *UserAISettingUsecase) ResolveEffectiveConfig(
	ctx context.Context,
	userID int64,
	fallbackOpenAIAPIKey string,
	fallbackGeminiAPIKey string,
) (EffectiveAIConfig, error) {
	row, err := u.repo.GetByUserID(ctx, userID)
	if err != nil {
		if err == sql.ErrNoRows {
			return EffectiveAIConfig{
				Provider: AIProviderOpenAI,
				APIKey:   strings.TrimSpace(fallbackOpenAIAPIKey),
				BaseURL:  u.defaultOpenAIBase,
				Model:    u.defaultOpenAIModel,
				FromUser: false,
			}, nil
		}
		return EffectiveAIConfig{}, err
	}
	provider := normalizeProvider(row.Provider)
	openAIKey, err := u.crypto.Decrypt(row.OpenAIAPIKeyEncrypted)
	if err != nil {
		openAIKey = ""
	}
	geminiKey, err := u.crypto.Decrypt(row.GeminiAPIKeyEncrypted)
	if err != nil {
		geminiKey = ""
	}
	if provider == AIProviderGemini {
		key := pickNonEmpty(strings.TrimSpace(geminiKey), strings.TrimSpace(fallbackGeminiAPIKey))
		return EffectiveAIConfig{
			Provider: AIProviderGemini,
			APIKey:   key,
			BaseURL:  pickNonEmpty(row.GeminiBaseURL, u.defaultGeminiBase),
			Model:    pickNonEmpty(row.GeminiModel, u.defaultGeminiModel),
			FromUser: true,
		}, nil
	}

	key := pickNonEmpty(strings.TrimSpace(openAIKey), strings.TrimSpace(fallbackOpenAIAPIKey))
	return EffectiveAIConfig{
		Provider: AIProviderOpenAI,
		APIKey:   key,
		BaseURL:  pickNonEmpty(row.OpenAIBaseURL, u.defaultOpenAIBase),
		Model:    pickNonEmpty(row.OpenAIModel, u.defaultOpenAIModel),
		FromUser: true,
	}, nil
}

func normalizeProvider(v string) string {
	switch strings.ToLower(strings.TrimSpace(v)) {
	case AIProviderGemini:
		return AIProviderGemini
	default:
		return AIProviderOpenAI
	}
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

func pickNonEmpty(v, fallback string) string {
	if strings.TrimSpace(v) != "" {
		return strings.TrimSpace(v)
	}
	return strings.TrimSpace(fallback)
}
