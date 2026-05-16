package config

import "os"

// AppConfig stores minimal runtime config for MVP phase 2.
type AppConfig struct {
	Port      string
	MySQLDSN  string
	JWTSecret string
}

func Load() AppConfig {
	cfg := AppConfig{
		Port:      getenv("PORT", "8080"),
		MySQLDSN:  getenv("MYSQL_DSN", "novel:novel@tcp(127.0.0.1:3306)/novel_agent?parseTime=true&charset=utf8mb4,utf8"),
		JWTSecret: getenv("JWT_SECRET", "change-me-in-dev"),
	}

	return cfg
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
