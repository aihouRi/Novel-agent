package config

import "os"

// AppConfig stores minimal runtime config for MVP phase 2.
type AppConfig struct {
	Port            string
	MySQLDSN        string
	JWTSecret       string
	OpenAIAPIKey    string
	OpenAIBaseURL   string
	OpenAIModelName string
	GeminiAPIKey    string
	GeminiBaseURL   string
	GeminiModelName string
}

func Load() AppConfig {
	cfg := AppConfig{
		Port:            getenv("PORT", "8080"),
		MySQLDSN:        getenv("MYSQL_DSN", "novel:novel@tcp(127.0.0.1:3306)/novel_agent?parseTime=true&charset=utf8mb4,utf8"),
		JWTSecret:       getenv("JWT_SECRET", "change-me-in-dev"),
		OpenAIAPIKey:    getenv("OPENAI_API_KEY", ""),
		OpenAIBaseURL:   getenv("OPENAI_BASE_URL", "https://api.openai.com/v1"),
		OpenAIModelName: getenv("OPENAI_MODEL", "gpt-4o-mini"),
		GeminiAPIKey:    getenv("GEMINI_API_KEY", ""),
		GeminiBaseURL:   getenv("GEMINI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta"),
		GeminiModelName: getenv("GEMINI_MODEL", "gemini-2.5-flash"),
	}

	return cfg
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
