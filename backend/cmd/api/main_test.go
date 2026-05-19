package main

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"novel-agent/backend/internal/config"
)

func TestNewServerHealthRoute(t *testing.T) {
	e := newServer(nil, config.AppConfig{JWTSecret: "test"})
	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	rec := httptest.NewRecorder()

	e.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rec.Code)
	}
	if got := rec.Body.String(); got != "{\"status\":\"ok\"}\n" {
		t.Fatalf("unexpected response body: %q", got)
	}
}
