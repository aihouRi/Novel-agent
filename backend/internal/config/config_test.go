package config

import "testing"

func TestLoadDefaults(t *testing.T) {
	t.Setenv("PORT", "")
	t.Setenv("MYSQL_DSN", "")
	t.Setenv("JWT_SECRET", "")
	t.Setenv("OPENAI_API_KEY", "")
	t.Setenv("OPENAI_BASE_URL", "")
	t.Setenv("OPENAI_MODEL", "")

	cfg := Load()

	if cfg.Port != "8080" {
		t.Fatalf("expected default port 8080, got %q", cfg.Port)
	}
	if cfg.MySQLDSN == "" {
		t.Fatal("expected non-empty default mysql dsn")
	}
	if cfg.JWTSecret != "change-me-in-dev" {
		t.Fatalf("expected default jwt secret, got %q", cfg.JWTSecret)
	}
	if cfg.OpenAIBaseURL != "https://api.openai.com/v1" {
		t.Fatalf("expected default openai base url, got %q", cfg.OpenAIBaseURL)
	}
	if cfg.OpenAIModelName != "gpt-4o-mini" {
		t.Fatalf("expected default openai model, got %q", cfg.OpenAIModelName)
	}
}

func TestLoadFromEnv(t *testing.T) {
	t.Setenv("PORT", "19090")
	t.Setenv("MYSQL_DSN", "u:p@tcp(localhost:3306)/db")
	t.Setenv("JWT_SECRET", "test-secret")
	t.Setenv("OPENAI_API_KEY", "sk-test")
	t.Setenv("OPENAI_BASE_URL", "https://example.com/v1")
	t.Setenv("OPENAI_MODEL", "gpt-test")

	cfg := Load()

	if cfg.Port != "19090" {
		t.Fatalf("expected env port, got %q", cfg.Port)
	}
	if cfg.MySQLDSN != "u:p@tcp(localhost:3306)/db" {
		t.Fatalf("expected env mysql dsn, got %q", cfg.MySQLDSN)
	}
	if cfg.JWTSecret != "test-secret" {
		t.Fatalf("expected env jwt secret, got %q", cfg.JWTSecret)
	}
	if cfg.OpenAIAPIKey != "sk-test" {
		t.Fatalf("expected env api key, got %q", cfg.OpenAIAPIKey)
	}
	if cfg.OpenAIBaseURL != "https://example.com/v1" {
		t.Fatalf("expected env base url, got %q", cfg.OpenAIBaseURL)
	}
	if cfg.OpenAIModelName != "gpt-test" {
		t.Fatalf("expected env model, got %q", cfg.OpenAIModelName)
	}
}
