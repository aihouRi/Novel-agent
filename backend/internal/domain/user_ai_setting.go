package domain

import "time"

type UserAISetting struct {
	UserID             int64     `json:"user_id"`
	Provider           string    `json:"provider"`
	OpenAIAPIKeyMasked string    `json:"openai_api_key_masked"`
	HasOpenAIAPIKey    bool      `json:"has_openai_api_key"`
	OpenAIBaseURL      string    `json:"openai_base_url"`
	OpenAIModel        string    `json:"openai_model"`
	GeminiAPIKeyMasked string    `json:"gemini_api_key_masked"`
	HasGeminiAPIKey    bool      `json:"has_gemini_api_key"`
	GeminiBaseURL      string    `json:"gemini_base_url"`
	GeminiModel        string    `json:"gemini_model"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}
