package main

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"novel-agent/backend/internal/config"
)

func TestProtectedRoutesRequireAuth(t *testing.T) {
	e := newServer(nil, config.AppConfig{JWTSecret: "test"})

	tests := []string{"/auth/me", "/novels"}
	for _, path := range tests {
		req := httptest.NewRequest(http.MethodGet, path, nil)
		rec := httptest.NewRecorder()
		e.ServeHTTP(rec, req)

		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("path %s: expected 401, got %d", path, rec.Code)
		}
	}
}
