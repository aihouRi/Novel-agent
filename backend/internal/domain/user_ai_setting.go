package domain

import "time"

type UserAISetting struct {
	UserID              int64     `json:"user_id"`
	OpenAIAPIKeyMasked  string    `json:"openai_api_key_masked"`
	HasOpenAIAPIKey     bool      `json:"has_openai_api_key"`
	OpenAIBaseURL       string    `json:"openai_base_url"`
	OpenAIModel         string    `json:"openai_model"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
}
